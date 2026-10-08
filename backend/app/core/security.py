from datetime import datetime, timedelta, timezone
import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .config import SECRET_KEY, TOKEN_HOURS, ADMIN_EMAIL, ADMIN_PASSWORD_HASH
from .database import get_db
from ..models import User

bearer = HTTPBearer()
bearer_optional = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def make_token(user_id: int, role: str = "user") -> str:
    exp = datetime.now(timezone.utc) + timedelta(hours=TOKEN_HOURS)
    return jwt.encode(
        {"sub": str(user_id), "role": role, "exp": exp},
        SECRET_KEY, algorithm="HS256"
    )


def _decode(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Session expired. Please log in again.")


def current_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    payload = _decode(cred.credentials)
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(401, "User not found.")
    if user.is_blocked:
        raise HTTPException(403, "Your account has been suspended. Contact support.")
    return user


def current_admin(
    cred: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    payload = _decode(cred.credentials)
    if payload.get("role") != "admin":
        raise HTTPException(403, "Admin access required.")
    return payload
