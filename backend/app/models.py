from datetime import datetime, timezone
from sqlalchemy import (
    Boolean, Column, Integer, String, DateTime,
    ForeignKey, JSON, Text, Index
)
from sqlalchemy.orm import DeclarativeBase


def now():
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True)
    email           = Column(String(255), unique=True, index=True, nullable=False)
    password_hash   = Column(String(255), nullable=False)
    name            = Column(String(100), default="")
    channel_link    = Column(String(500), default="")
    phone           = Column(String(30), default="")
    date_of_birth   = Column(String(20), default="")
    role            = Column(String(20), default="user", nullable=False)  # user | admin
    is_blocked      = Column(Boolean, default=False, nullable=False)
    last_login      = Column(DateTime(timezone=True), nullable=True)
    created_at      = Column(DateTime(timezone=True), default=now)


class Analysis(Base):
    __tablename__ = "analyses"
    id          = Column(Integer, primary_key=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    video_id    = Column(String(20), nullable=False, index=True)
    video_title = Column(String(500), default="")
    channel     = Column(String(255), default="")
    status      = Column(String(20), default="pending")  # pending|processing|done|failed
    error       = Column(Text, default="")
    total       = Column(Integer, default=0)
    positive    = Column(Integer, default=0)
    negative    = Column(Integer, default=0)
    neutral     = Column(Integer, default=0)
    result      = Column(JSON, default=dict)
    created_at  = Column(DateTime(timezone=True), default=now)

    __table_args__ = (Index("ix_analysis_user_created", "user_id", "created_at"),)


class ContactMessage(Base):
    __tablename__ = "contact_messages"
    id          = Column(Integer, primary_key=True)
    name        = Column(String(255), nullable=False)
    email       = Column(String(255), nullable=False, index=True)
    subject     = Column(String(500), nullable=False)
    message     = Column(Text, nullable=False)
    status      = Column(String(20), default="open")   # open | replied | closed
    reply       = Column(Text, default="")
    replied_at  = Column(DateTime(timezone=True), nullable=True)
    created_at  = Column(DateTime(timezone=True), default=now)

    __table_args__ = (Index("ix_contact_status_created", "status", "created_at"),)


class OtpCode(Base):
    """One-time codes stored in the DB so they survive restarts and multiple instances."""
    __tablename__ = "otp_codes"
    key         = Column(String(255), primary_key=True)   # "signup:<email>" or "reset:<email>"
    code_hash   = Column(String(64), nullable=False)      # sha256, never the plain code
    expires_at  = Column(DateTime(timezone=True), nullable=False)
    sent_at     = Column(DateTime(timezone=True), nullable=False)
    attempts    = Column(Integer, default=0, nullable=False)
    verified    = Column(Boolean, default=False, nullable=False)


# ── Stripe stub — wire up when moving past MVP ────────────────────────────────
class Subscription(Base):
    __tablename__ = "subscriptions"
    id                  = Column(Integer, primary_key=True)
    user_id             = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                                 unique=True, nullable=False)
    plan                = Column(String(20), default="free")   # free | pro | agency
    stripe_customer_id  = Column(String(255), default="")
    stripe_sub_id       = Column(String(255), default="")
    status              = Column(String(20), default="active") # active | cancelled | past_due
    current_period_end  = Column(DateTime(timezone=True), nullable=True)
    created_at          = Column(DateTime(timezone=True), default=now)
    updated_at          = Column(DateTime(timezone=True), default=now, onupdate=now)