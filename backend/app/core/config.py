import os
import sys
import bcrypt

ENV = os.getenv("ENV", "development").lower()
IS_PROD = ENV == "production"
# True when the app sits behind Render/Vercel proxies (real client IP is in X-Forwarded-For)
TRUST_PROXY = os.getenv("TRUST_PROXY", "true" if IS_PROD else "false").lower() == "true"

_db = os.getenv("DATABASE_URL", "sqlite:///./dev.db")
if _db.startswith("postgres://"):
    _db = _db.replace("postgres://", "postgresql+psycopg2://", 1)
elif _db.startswith("postgresql://"):
    _db = _db.replace("postgresql://", "postgresql+psycopg2://", 1)

DATABASE_URL = _db
SECRET_KEY = os.getenv("SECRET_KEY", "" if IS_PROD else "dev-only-secret-change-me")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")]
DAILY_LIMIT = int(os.getenv("DAILY_LIMIT", "5"))
MAX_COMMENTS = int(os.getenv("MAX_COMMENTS", "500"))
# Plans: "free" is a one-time trial; paid plans get a monthly allowance (rolling 30 days)
FREE_ANALYSES = int(os.getenv("FREE_ANALYSES", "3"))
PRO_MONTHLY = int(os.getenv("PRO_MONTHLY", "30"))
AGENCY_MONTHLY = int(os.getenv("AGENCY_MONTHLY", "150"))

TOKEN_HOURS = 24 * 7

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

BREVO_API_KEY    = os.getenv("BREVO_API_KEY", "")        # API key from Brevo dashboard
BREVO_FROM_EMAIL = os.getenv("BREVO_FROM_EMAIL", "")     # verified sender email in Brevo
APP_URL = os.getenv("APP_URL", "http://localhost:3000")
CONTACT_NOTIFY_EMAIL = os.getenv("CONTACT_NOTIFY_EMAIL", BREVO_FROM_EMAIL)

# Admin credentials — hardcoded role, never a regular user
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@commentcompass.app")
_raw = os.getenv("ADMIN_PASSWORD", "" if IS_PROD else "admin123")
ADMIN_PASSWORD_HASH = bcrypt.hashpw(_raw.encode(), bcrypt.gensalt()).decode()


# ── Production safety checks: refuse to start with weak or missing secrets ────
if IS_PROD:
    _problems = []
    if len(SECRET_KEY) < 32:
        _problems.append("SECRET_KEY must be set and at least 32 characters")
    if len(_raw) < 12 or _raw.lower() in {"admin123", "password", "changeme"}:
        _problems.append("ADMIN_PASSWORD must be set and at least 12 characters")
    if "CORS_ORIGINS" not in os.environ:
        _problems.append("CORS_ORIGINS must be set to your frontend URL")
    if not YOUTUBE_API_KEY:
        _problems.append("YOUTUBE_API_KEY is missing")
    if not GOOGLE_CLIENT_ID:
        print("WARNING: GOOGLE_CLIENT_ID not set, Google login will fail", file=sys.stderr)
    if not BREVO_API_KEY or not BREVO_FROM_EMAIL:
        print("WARNING: Brevo not configured, emails will not be sent", file=sys.stderr)
    if _problems:
        raise RuntimeError("Unsafe production config: " + "; ".join(_problems))