from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from .core.config import CORS_ORIGINS, IS_PROD
from .core.database import engine, SessionLocal
from .models import Base
from sqlalchemy import inspect, text
from .routers import auth, analyses, admin, contact, profile

Base.metadata.create_all(engine)


def _ensure_columns():
    """create_all() never alters existing tables, so add new columns here."""
    cols = {c["name"] for c in inspect(engine).get_columns("users")}
    if "name" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR(100) DEFAULT ''"))


_ensure_columns()

# Jobs lost to a restart would stay "processing" forever; mark them failed on startup
with SessionLocal() as _db:
    analyses.expire_stuck_analyses(_db)

app = FastAPI(
    title="Comment Compass API",
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None,
    openapi_url=None if IS_PROD else "/openapi.json",
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(analyses.router)
app.include_router(admin.router)
app.include_router(contact.router)
app.include_router(profile.router)


@app.get("/health")
def health():
    return {"ok": True}