import hashlib
import secrets
import string
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.config import GOOGLE_CLIENT_ID, IS_PROD, SECRET_KEY
from ..core import ratelimit as rl
from ..core.database import get_db
from ..core.email import send_email, otp_email_html, welcome_email_html
from ..core.security import hash_password, verify_password, make_token
from ..models import User, OtpCode
from ..schemas import Credentials, LoginIn, OtpRequest, OtpVerify, GoogleAuthIn, ResetPasswordIn

router = APIRouter(prefix="/auth", tags=["auth"])

OTP_TTL_MIN = 10
OTP_RESEND_COOLDOWN_SEC = 60
OTP_MAX_ATTEMPTS = 5


# ── OTP helpers (stored in the database, never printed in production) ─────────
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _aware(dt: datetime) -> datetime:
    """SQLite returns naive datetimes; Postgres returns aware ones. Normalise."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _generate_otp() -> str:
    # secrets = cryptographically secure (random is predictable)
    return "".join(secrets.choice(string.digits) for _ in range(6))


def _hash(key: str, otp: str) -> str:
    return hashlib.sha256(f"{SECRET_KEY}:{key}:{otp}".encode()).hexdigest()


def _issue_otp(db: Session, key: str) -> str:
    now_utc = _now()
    row = db.get(OtpCode, key)
    if row:
        elapsed = (now_utc - _aware(row.sent_at)).total_seconds()
        if elapsed < OTP_RESEND_COOLDOWN_SEC:
            wait = int(OTP_RESEND_COOLDOWN_SEC - elapsed) + 1
            raise HTTPException(429, f"Please wait {wait}s before requesting another code.")
    otp = _generate_otp()
    if not row:
        row = OtpCode(key=key)
        db.add(row)
    row.code_hash = _hash(key, otp)
    row.expires_at = now_utc + timedelta(minutes=OTP_TTL_MIN)
    row.sent_at = now_utc
    row.attempts = 0
    row.verified = False
    db.commit()
    if not IS_PROD:  # local development convenience only
        print(f"[DEV OTP] {key} -> {otp}", flush=True)
    return otp


def _check_otp(db: Session, key: str, submitted: str) -> OtpCode:
    """Validate a code; limits wrong guesses to stop brute-forcing."""
    row = db.get(OtpCode, key)
    if not row:
        raise HTTPException(400, "No code found for this email. Please request a new code.")
    if _now() > _aware(row.expires_at):
        db.delete(row)
        db.commit()
        raise HTTPException(400, "This code has expired. Please request a new one.")
    if not secrets.compare_digest(row.code_hash, _hash(key, submitted.strip())):
        row.attempts += 1
        if row.attempts >= OTP_MAX_ATTEMPTS:
            db.delete(row)
            db.commit()
            raise HTTPException(400, "Too many incorrect attempts. Please request a new code.")
        db.commit()
        raise HTTPException(400, "Incorrect code. Please try again.")
    return row


def _require_verified(db: Session, key: str) -> OtpCode:
    row = db.get(OtpCode, key)
    if not row or not row.verified or _now() > _aware(row.expires_at):
        raise HTTPException(400, "Email not verified. Please verify the code first.")
    return row


# ── Signup OTP ────────────────────────────────────────────────────────────────
@router.post("/send-otp")
def send_otp(body: OtpRequest, bg: BackgroundTasks, request: Request, db: Session = Depends(get_db)):
    rl.hit(f"otp-ip:{rl.client_ip(request)}", 15, 3600)   # per IP
    rl.hit("emails-global", 150, 3600)                      # protects the free email quota
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "An account with this email already exists. Please log in instead.")
    otp = _issue_otp(db, f"signup:{email}")
    bg.add_task(
        send_email,
        email,
        "Your Comment Compass verification code",
        otp_email_html(otp, "Verify your email", "Enter this code to complete your signup."),
    )
    return {"ok": True}


@router.post("/verify-otp")
def verify_otp(body: OtpVerify, request: Request, db: Session = Depends(get_db)):
    rl.hit(f"verify-ip:{rl.client_ip(request)}", 30, 900)
    row = _check_otp(db, f"signup:{body.email.lower()}", body.otp)
    row.verified = True          # register() requires this flag
    db.commit()
    return {"ok": True}


# ── Register (only after the email code was verified) ────────────────────────
@router.post("/register", status_code=201)
def register(body: Credentials, bg: BackgroundTasks, request: Request, db: Session = Depends(get_db)):
    rl.hit(f"register-ip:{rl.client_ip(request)}", 10, 3600)
    email = body.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "An account with this email already exists.")
    otp_row = _require_verified(db, f"signup:{email}")
    user = User(
        email=email,
        password_hash=hash_password(body.password),
        channel_link=body.channel_link,
        phone=body.phone,
        date_of_birth=body.date_of_birth,
    )
    db.add(user)
    db.delete(otp_row)
    db.commit()
    db.refresh(user)
    bg.add_task(send_email, email, "Welcome to Comment Compass 🎉", welcome_email_html(email))
    return {"token": make_token(user.id)}


# ── Login ─────────────────────────────────────────────────────────────────────
@router.post("/login")
def login(body: LoginIn, request: Request, db: Session = Depends(get_db)):
    email = body.email.lower()
    email_key = f"login-email:{email}"
    ip_key = f"login-ip:{rl.client_ip(request)}"
    rl.check(email_key, 8, 900)      # 8 wrong passwords per email per 15 min
    rl.check(ip_key, 30, 900)        # 30 wrong passwords per IP per 15 min
    user = db.scalar(select(User).where(User.email == email))
    if user and user.password_hash == "__google__":
        raise HTTPException(400, "This account uses Google sign-in. Please continue with Google.")
    if not user or not verify_password(body.password, user.password_hash):
        rl.record(email_key, 900)
        rl.record(ip_key, 900)
        raise HTTPException(401, "Wrong email or password.")
    if user.is_blocked:
        raise HTTPException(403, "Your account has been suspended. Contact support.")
    rl.clear(email_key)
    user.last_login = _now()
    db.commit()
    return {"token": make_token(user.id)}


# ── Google OAuth ──────────────────────────────────────────────────────────────
@router.post("/google")
def google_auth(body: GoogleAuthIn, bg: BackgroundTasks, request: Request, db: Session = Depends(get_db)):
    rl.hit(f"google-ip:{rl.client_ip(request)}", 30, 900)
    try:
        r = httpx.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": body.credential},
            timeout=10,
        )
        r.raise_for_status()
        info = r.json()
    except Exception:
        raise HTTPException(401, "Invalid Google token.")
    if not GOOGLE_CLIENT_ID or info.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(401, "Google token audience mismatch.")
    if str(info.get("email_verified")).lower() != "true":
        raise HTTPException(401, "Your Google email is not verified.")
    email = info.get("email", "").lower()
    if not email:
        raise HTTPException(400, "Could not retrieve email from Google account.")
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        user = User(email=email, password_hash="__google__")
        db.add(user)
        db.commit()
        db.refresh(user)
        bg.add_task(send_email, email, "Welcome to Comment Compass 🎉", welcome_email_html(email))
    if user.is_blocked:
        raise HTTPException(403, "Your account has been suspended. Contact support.")
    user.last_login = _now()
    db.commit()
    return {"token": make_token(user.id)}


# ── Forgot password ───────────────────────────────────────────────────────────
@router.post("/forgot-password")
def forgot_password(body: OtpRequest, bg: BackgroundTasks, request: Request, db: Session = Depends(get_db)):
    rl.hit(f"otp-ip:{rl.client_ip(request)}", 15, 3600)
    rl.hit("emails-global", 150, 3600)
    email = body.email.lower()
    user = db.scalar(select(User).where(User.email == email))
    if not user:
        raise HTTPException(404, "No account found with this email. Please check the address or sign up.")
    if user.password_hash == "__google__":
        raise HTTPException(400, "This account uses Google sign-in. Please continue with Google instead.")
    if user.is_blocked:
        raise HTTPException(403, "Your account has been suspended. Contact support.")
    otp = _issue_otp(db, f"reset:{email}")
    bg.add_task(
        send_email,
        email,
        "Reset your Comment Compass password",
        otp_email_html(otp, "Reset your password", "Enter this code to set a new password."),
    )
    return {"ok": True}


@router.post("/verify-reset-otp")
def verify_reset_otp(body: OtpVerify, request: Request, db: Session = Depends(get_db)):
    rl.hit(f"verify-ip:{rl.client_ip(request)}", 30, 900)
    row = _check_otp(db, f"reset:{body.email.lower()}", body.otp)
    row.verified = True
    db.commit()
    return {"ok": True}


@router.post("/reset-password")
def reset_password(body: ResetPasswordIn, request: Request, db: Session = Depends(get_db)):
    rl.hit(f"reset-ip:{rl.client_ip(request)}", 10, 900)
    key = f"reset:{body.email.lower()}"
    row = _require_verified(db, key)
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user:
        raise HTTPException(404, "Account not found.")
    user.password_hash = hash_password(body.new_password)
    db.delete(row)
    db.commit()
    return {"ok": True}