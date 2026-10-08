"""Plan limits.

free    : a one-time trial of FREE_ANALYSES analyses (never resets)
pro     : PRO_MONTHLY analyses in any rolling 30 days
agency  : AGENCY_MONTHLY analyses in any rolling 30 days

Only analyses that did not fail count. Re-opening a video analyzed in the last
24 hours returns the saved result and costs nothing (handled in the router).
"""
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.config import AGENCY_MONTHLY, FREE_ANALYSES, PRO_MONTHLY
from ..models import Analysis, Subscription

PAID_LIMITS = {"pro": PRO_MONTHLY, "agency": AGENCY_MONTHLY}


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def get_plan(db: Session, user_id: int) -> str:
    """A paid plan counts only while it is active and not past its end date."""
    sub = db.scalar(select(Subscription).where(Subscription.user_id == user_id))
    if sub and sub.plan in PAID_LIMITS and sub.status == "active":
        end = sub.current_period_end
        if end is None or _aware(end) > datetime.now(timezone.utc):
            return sub.plan
    return "free"


def usage(db: Session, user_id: int) -> dict:
    plan = get_plan(db, user_id)
    q = (
        select(func.count()).select_from(Analysis)
        .where(Analysis.user_id == user_id, Analysis.status != "failed")
    )
    if plan == "free":
        limit, period = FREE_ANALYSES, "lifetime"
    else:
        limit, period = PAID_LIMITS[plan], "month"
        q = q.where(Analysis.created_at > datetime.now(timezone.utc) - timedelta(days=30))
    used = db.scalar(q) or 0
    return {"plan": plan, "period": period, "limit": limit, "used": used, "remaining": max(limit - used, 0)}


def limit_message(u: dict) -> str:
    if u["plan"] == "free":
        return (f"You've used your {u['limit']} free analyses. "
                "Paid plans are coming soon. Contact us to get early access.")
    return f"You've used all {u['limit']} analyses for this month. Contact us if you need more."