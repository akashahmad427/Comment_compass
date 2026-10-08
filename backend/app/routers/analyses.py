import logging
import traceback
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from ..core.config import DAILY_LIMIT, MAX_COMMENTS
from ..core import ratelimit as rl
from ..core.database import get_db, SessionLocal
from ..core.security import current_user
from ..models import User, Analysis
from ..schemas import AnalyzeIn
from ..services import plans, youtube
from ..services.analysis import analyze

router = APIRouter(prefix="/analyses", tags=["analyses"])


def serialize(a: Analysis, full=True) -> dict:
    d = {
        "id": a.id,
        "video_id": a.video_id,
        "video_title": a.video_title,
        "channel": a.channel,
        "status": a.status,
        "error": a.error,
        "total": a.total,
        "positive": a.positive,
        "negative": a.negative,
        "neutral": a.neutral,
        "created_at": a.created_at.isoformat(),
    }
    if full:
        d["result"] = a.result or {}
    return d


STUCK_AFTER_MIN = 10


def expire_stuck_analyses(db: Session) -> None:
    """Jobs lost to a restart or sleep would stay pending forever; mark them failed."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=STUCK_AFTER_MIN)
    db.execute(
        update(Analysis)
        .where(Analysis.status.in_(["pending", "processing"]), Analysis.created_at < cutoff)
        .values(status="failed", error="The analysis was interrupted. Please try again.")
    )
    db.commit()


def run_analysis(analysis_id: int):
    """Background job — move to Celery + Redis when scaling beyond one instance."""
    db = SessionLocal()
    a = db.get(Analysis, analysis_id)
    try:
        a.status = "processing"
        db.commit()
        meta = youtube.fetch_meta(a.video_id)
        comments = youtube.fetch_comments(a.video_id, MAX_COMMENTS)
        if not comments:
            raise ValueError("No comments found on this video yet.")
        out = analyze(comments)
        a.video_title = meta["title"]
        a.channel = meta["channel"]
        a.total = len(comments)
        a.positive = out["positive"]
        a.negative = out["negative"]
        a.neutral = out["neutral"]
        replies = sum(1 for c in comments if c.get("is_reply"))
        out["result"]["coverage"] = {
            "analyzed": len(comments),
            "top_level": len(comments) - replies,
            "replies": replies,
            "on_youtube": meta.get("comment_count"),   # YouTube total, includes all replies
        }
        a.result = out["result"]
        a.status = "done"
    except ValueError as e:
        a.status, a.error = "failed", str(e)
    except Exception as e:
        logging.error("Analysis %s failed: %s", analysis_id, traceback.format_exc())
        a.status, a.error = "failed", f"Unexpected error: {e}"
    finally:
        db.commit()
        db.close()


@router.post("", status_code=202)
def create_analysis(
    body: AnalyzeIn,
    bg: BackgroundTasks,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    try:
        vid = youtube.extract_video_id(body.url)
    except ValueError as e:
        raise HTTPException(400, str(e))
    
    rl.hit(f"analyze-user:{user.id}", 20, 3600)
    expire_stuck_analyses(db)
    since = datetime.now(timezone.utc) - timedelta(hours=24)

    cached = db.scalar(
        select(Analysis).where(
            Analysis.user_id == user.id,
            Analysis.video_id == vid,
            Analysis.status == "done",
            Analysis.created_at > since,
        )
    )
    if cached:
        return serialize(cached, full=False)

    # Lock the user row so two quick requests cannot both slip past the plan limit (Postgres)
    db.execute(select(User.id).where(User.id == user.id).with_for_update())
    plan_usage = plans.usage(db, user.id)
    if plan_usage["remaining"] <= 0:
        raise HTTPException(402, plans.limit_message(plan_usage))
    
    used = db.scalar(
        select(func.count()).select_from(Analysis)
        .where(
            Analysis.user_id == user.id,
            Analysis.created_at > since,
            Analysis.status != "failed",   # failed runs do not use up the daily limit
        )
    )
    if used >= DAILY_LIMIT:
        raise HTTPException(429, f"Daily limit of {DAILY_LIMIT} analyses reached. Try again tomorrow.")

    a = Analysis(user_id=user.id, video_id=vid)
    db.add(a)
    db.commit()
    bg.add_task(run_analysis, a.id)
    return serialize(a, full=False)


@router.get("")
def list_analyses(
    page: int = 1,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    rows = db.scalars(
        select(Analysis).where(Analysis.user_id == user.id)
        .order_by(Analysis.created_at.desc())
        .limit(20).offset((max(page, 1) - 1) * 20)
    ).all()
    return [serialize(r, full=False) for r in rows]

@router.get("/usage")
def get_usage(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return plans.usage(db, user.id)

@router.get("/{aid}")
def get_analysis(
    aid: int,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    a = db.get(Analysis, aid)
    if not a or a.user_id != user.id:
        raise HTTPException(404, "Analysis not found.")
    return serialize(a)