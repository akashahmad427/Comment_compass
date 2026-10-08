"""Run once to create/update the admin user in the DB.
Usage: python seed_admin.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import engine
from app.core.security import hash_password
from app.models import Base, User
from sqlalchemy.orm import Session
from sqlalchemy import select

ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@commentcompass.app")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

Base.metadata.create_all(engine)

with Session(engine) as db:
    user = db.scalar(select(User).where(User.email == ADMIN_EMAIL.lower()))
    if user:
        user.role = "admin"
        user.password_hash = hash_password(ADMIN_PASSWORD)
        print(f"Updated existing user {ADMIN_EMAIL} → role=admin")
    else:
        db.add(User(
            email=ADMIN_EMAIL.lower(),
            password_hash=hash_password(ADMIN_PASSWORD),
            role="admin",
        ))
        print(f"Created admin user: {ADMIN_EMAIL}")
    db.commit()
