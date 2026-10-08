from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select, delete
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.email import send_email
from ..core.security import verify_password, make_token, current_admin
from html import escape as esc
from ..models import User, Analysis, ContactMessage, Subscription
from ..schemas import AdminLoginIn, AdminReplyIn, AdminEmailIn, AdminPlanIn


from ..services import plans

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/login")
def admin_login(body: AdminLoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid admin credentials.")
    if user.role != "admin":
        raise HTTPException(403, "Not an admin account.")
    return {"token": make_token(user.id, role="admin")}


# ── Dashboard stats ───────────────────────────────────────────────────────────
@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=Depends(current_admin)):
    now = datetime.now(timezone.utc)
    last_30 = now - timedelta(days=30)
    last_7  = now - timedelta(days=7)

    total_users   = db.scalar(select(func.count()).select_from(User).where(User.role == "user"))
    blocked_users = db.scalar(select(func.count()).select_from(User).where(User.role == "user", User.is_blocked == True))
    new_users_30  = db.scalar(select(func.count()).select_from(User).where(User.role == "user", User.created_at >= last_30))

    # Active = logged in within last 30 days
    active_30 = db.scalar(
        select(func.count()).select_from(User)
        .where(User.role == "user", User.last_login >= last_30, User.is_blocked == False)
    )
    # Engaged = ran at least 1 analysis in last 7 days
    engaged_7 = db.scalar(
        select(func.count(Analysis.user_id.distinct()))
        .where(Analysis.created_at >= last_7)
    )

    total_analyses = db.scalar(select(func.count()).select_from(Analysis))
    done_analyses  = db.scalar(select(func.count()).select_from(Analysis).where(Analysis.status == "done"))
    open_messages  = db.scalar(
        select(func.count()).select_from(ContactMessage).where(ContactMessage.status == "open")
    )

    return {
        "total_users":     total_users,
        "blocked_users":   blocked_users,
        "new_users_30d":   new_users_30,
        "active_users_30d": active_30,
        "engaged_users_7d": engaged_7,
        "total_analyses":  total_analyses,
        "done_analyses":   done_analyses,
        "open_messages":   open_messages,
    }


# ── Users ─────────────────────────────────────────────────────────────────────
@router.get("/users")
def list_users(
    page: int = 1,
    search: str = "",
    db: Session = Depends(get_db),
    _=Depends(current_admin),
):
    q = select(User).where(User.role == "user").order_by(User.created_at.desc())
    if search:
        q = q.where(User.email.ilike(f"%{search}%"))
    total = db.scalar(select(func.count()).select_from(q.subquery()))
    users = db.scalars(q.limit(20).offset((max(page, 1) - 1) * 20)).all()
    return {
        "total": total,
        "users": [_serialize_user(u, db) for u in users],
    }


@router.get("/users/{uid}")
def get_user(uid: int, db: Session = Depends(get_db), _=Depends(current_admin)):
    user = db.get(User, uid)
    if not user or user.role != "user":
        raise HTTPException(404, "User not found.")
    return _serialize_user(user, db, full=True)


@router.patch("/users/{uid}/block")
def block_user(uid: int, db: Session = Depends(get_db), _=Depends(current_admin)):
    user = db.get(User, uid)
    if not user or user.role != "user":
        raise HTTPException(404, "User not found.")
    user.is_blocked = True
    db.commit()
    return {"ok": True, "blocked": True}


@router.patch("/users/{uid}/unblock")
def unblock_user(uid: int, db: Session = Depends(get_db), _=Depends(current_admin)):
    user = db.get(User, uid)
    if not user or user.role != "user":
        raise HTTPException(404, "User not found.")
    user.is_blocked = False
    db.commit()
    return {"ok": True, "blocked": False}

@router.patch("/users/{uid}/plan")
def set_plan(uid: int, body: AdminPlanIn, db: Session = Depends(get_db), _=Depends(current_admin)):
    """Grant or remove a paid plan by hand (until online payments exist)."""
    user = db.get(User, uid)
    if not user or user.role != "user":
        raise HTTPException(404, "User not found.")
    sub = db.scalar(select(Subscription).where(Subscription.user_id == uid))
    if not sub:
        sub = Subscription(user_id=uid)
        db.add(sub)
    sub.plan = body.plan
    sub.status = "active" if body.plan != "free" else "cancelled"
    sub.current_period_end = (
        datetime.now(timezone.utc) + timedelta(days=body.days) if body.plan != "free" else None
    )
    db.commit()
    return {"ok": True, "plan": plans.get_plan(db, uid)}

@router.delete("/users/{uid}")
def delete_user(uid: int, db: Session = Depends(get_db), _=Depends(current_admin)):
    user = db.get(User, uid)
    if not user or user.role != "user":
        raise HTTPException(404, "User not found.")
    # CASCADE handles analyses deletion via FK
    db.execute(delete(Analysis).where(Analysis.user_id == uid))
    db.delete(user)
    db.commit()
    return {"ok": True}


@router.post("/users/email")
def email_user(body: AdminEmailIn, db: Session = Depends(get_db), _=Depends(current_admin)):
    user = db.get(User, body.user_id)
    if not user:
        raise HTTPException(404, "User not found.")
    html = f"""
    <!DOCTYPE html><html><body style="background:#0a0a0f;font-family:Inter,Arial,sans-serif;padding:40px 20px;">
    <table width="520" style="background:#16161f;border:1px solid #2a2a3a;border-radius:16px;
           overflow:hidden;margin:0 auto;">
      <tr><td style="background:linear-gradient(135deg,#6366f1,#a78bfa);padding:28px 40px;">
        <div style="font-size:20px;font-weight:900;color:#fff;">🧭 Comment Compass</div>
      </td></tr>
      <tr><td style="padding:36px 40px;">
        <h2 style="color:#f0f0ff;margin:0 0 16px;">{esc(body.subject)}</h2>
        <div style="color:#b0b0cc;font-size:15px;line-height:1.7;white-space:pre-wrap;">{esc(body.body)}</div>
      </td></tr>
      <tr><td style="padding:20px 40px;border-top:1px solid #2a2a3a;text-align:center;">
        <p style="color:#7070a0;font-size:12px;margin:0;">© Comment Compass · Support Team</p>
      </td></tr>
    </table></body></html>
    """
    send_email(user.email, body.subject, html)
    return {"ok": True}


# ── Contact messages ──────────────────────────────────────────────────────────
@router.get("/messages")
def list_messages(
    page: int = 1,
    status: str = "",
    db: Session = Depends(get_db),
    _=Depends(current_admin),
):
    q = select(ContactMessage).order_by(ContactMessage.created_at.desc())
    if status:
        q = q.where(ContactMessage.status == status)
    total = db.scalar(select(func.count()).select_from(q.subquery()))
    msgs = db.scalars(q.limit(20).offset((max(page, 1) - 1) * 20)).all()
    return {"total": total, "messages": [_serialize_msg(m) for m in msgs]}


@router.post("/messages/reply")
def reply_message(body: AdminReplyIn, db: Session = Depends(get_db), _=Depends(current_admin)):
    msg = db.get(ContactMessage, body.message_id)
    if not msg:
        raise HTTPException(404, "Message not found.")
    html = f"""
    <!DOCTYPE html><html><body style="background:#0a0a0f;font-family:Inter,Arial,sans-serif;padding:40px 20px;">
    <table width="520" style="background:#16161f;border:1px solid #2a2a3a;border-radius:16px;
           overflow:hidden;margin:0 auto;">
      <tr><td style="background:linear-gradient(135deg,#6366f1,#a78bfa);padding:28px 40px;">
        <div style="font-size:20px;font-weight:900;color:#fff;">🧭 Comment Compass Support</div>
      </td></tr>
      <tr><td style="padding:36px 40px;">
        <p style="color:#b0b0cc;font-size:14px;margin:0 0 20px;">
          Hi {esc(msg.name)}, thanks for reaching out. Here's our response to your message:
        </p>
        <div style="background:#0a0a0f;border-left:4px solid #6366f1;padding:16px 20px;
                    border-radius:0 10px 10px 0;margin-bottom:24px;">
          <p style="color:#7070a0;font-size:13px;margin:0 0 8px;">Your original message:</p>
          <p style="color:#b0b0cc;font-size:14px;margin:0;font-style:italic;">""{esc(msg.message)}"</p>
        </div>
        <div style="color:#f0f0ff;font-size:15px;line-height:1.7;white-space:pre-wrap;">{esc(body.reply)}</div>
      </td></tr>
      <tr><td style="padding:20px 40px;border-top:1px solid #2a2a3a;text-align:center;">
        <p style="color:#7070a0;font-size:12px;margin:0;">© Comment Compass · Support Team</p>
      </td></tr>
    </table></body></html>
    """
    send_email(msg.email, f"Re: {msg.subject}", html)
    msg.reply = body.reply
    msg.status = "replied"
    msg.replied_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


@router.patch("/messages/{mid}/close")
def close_message(mid: int, db: Session = Depends(get_db), _=Depends(current_admin)):
    msg = db.get(ContactMessage, mid)
    if not msg:
        raise HTTPException(404, "Message not found.")
    msg.status = "closed"
    db.commit()
    return {"ok": True}


# ── Helpers ───────────────────────────────────────────────────────────────────
def _serialize_user(u: User, db: Session, full=False) -> dict:
    d = {
        "id":           u.id,
        "email":        u.email,
        "channel_link": u.channel_link,
        "phone":        u.phone,
        "is_blocked":   u.is_blocked,
        "last_login":   u.last_login.isoformat() if u.last_login else None,
        "created_at":   u.created_at.isoformat(),
    }
    if full:
        d["plan"] = plans.get_plan(db, u.id)
        d["total_analyses"] = db.scalar(
            select(func.count()).select_from(Analysis).where(Analysis.user_id == u.id)
        )
    return d


def _serialize_msg(m: ContactMessage) -> dict:
    return {
        "id":         m.id,
        "name":       m.name,
        "email":      m.email,
        "subject":    m.subject,
        "message":    m.message,
        "status":     m.status,
        "reply":      m.reply,
        "replied_at": m.replied_at.isoformat() if m.replied_at else None,
        "created_at": m.created_at.isoformat(),
    }
