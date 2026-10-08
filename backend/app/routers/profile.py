import re
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import current_user, hash_password, verify_password
from ..models import Analysis, User
from ..schemas import ChangePasswordIn, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])

GOOGLE_MARKER = "__google__"
_PHONE_RE = re.compile(r"^\+?[0-9\s\-().]{7,20}$")


def _serialize(user: User, db: Session) -> dict:
    count = db.scalar(select(func.count()).select_from(Analysis).where(Analysis.user_id == user.id)) or 0
    return {
        "email": user.email,
        "name": user.name or "",
        "channel_link": user.channel_link or "",
        "phone": user.phone or "",
        "date_of_birth": user.date_of_birth or "",
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "auth_provider": "google" if user.password_hash == GOOGLE_MARKER else "password",
        "analyses_count": count,
    }


@router.get("")
def get_profile(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return _serialize(user, db)


@router.patch("")
def update_profile(body: ProfileUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    name = body.name.strip()
    link = body.channel_link.strip()
    phone = body.phone.strip()
    dob = body.date_of_birth.strip()

    if link and not re.match(r"^https?://\S+\.\S+", link):
        raise HTTPException(400, "Channel link must start with http:// or https://")
    if phone and not _PHONE_RE.match(phone):
        raise HTTPException(400, "Please enter a valid phone number.")
    if dob:
        try:
            d = date.fromisoformat(dob)
        except ValueError:
            raise HTTPException(400, "Date of birth must be a valid date.")
        if d > date.today() or d.year < 1900:
            raise HTTPException(400, "Please enter a valid date of birth.")

    user.name, user.channel_link, user.phone, user.date_of_birth = name, link, phone, dob
    db.commit()
    return _serialize(user, db)


@router.post("/change-password")
def change_password(body: ChangePasswordIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if user.password_hash == GOOGLE_MARKER:
        raise HTTPException(400, "Your account uses Google sign-in, so it has no password to change.")
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect.")
    if body.current_password == body.new_password:
        raise HTTPException(400, "New password must be different from your current password.")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"ok": True}