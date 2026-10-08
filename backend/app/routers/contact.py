from html import escape as esc

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from ..core import ratelimit as rl
from ..core.config import CONTACT_NOTIFY_EMAIL
from ..core.database import get_db
from ..core.email import send_email
from ..models import ContactMessage
from ..schemas import ContactMessageIn

router = APIRouter(prefix="/contact", tags=["contact"])


def _notification_html(msg: ContactMessage) -> str:
    # Everything the visitor typed is escaped, so they cannot inject HTML or links into your inbox.
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:560px">
      <h3 style="margin:0 0 12px">New contact message</h3>
      <p><b>From:</b> {esc(msg.name)} &lt;{esc(msg.email)}&gt;</p>
      <p><b>Subject:</b> {esc(msg.subject)}</p>
      <p style="white-space:pre-wrap;background:#f4f4f8;padding:12px;border-radius:8px">{esc(msg.message)}</p>
      <p style="color:#666;font-size:13px">Reply from your admin panel (Messages), or write to {esc(msg.email)} directly.</p>
    </div>"""


@router.post("", status_code=201)
def submit_contact(
    body: ContactMessageIn,
    bg: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
):
    rl.hit(f"contact-ip:{rl.client_ip(request)}", 5, 3600)   # 5 messages per IP per hour
    msg = ContactMessage(
        name=body.name,
        email=body.email.lower(),
        subject=body.subject,
        message=body.message,
    )
    db.add(msg)
    db.commit()

    if CONTACT_NOTIFY_EMAIL:
        try:
            rl.hit("emails-global", 150, 3600)   # share the hourly email budget; the message is saved either way
            subject = " ".join(f"New contact message: {msg.subject}".split())[:150]
            bg.add_task(send_email, CONTACT_NOTIFY_EMAIL, subject, _notification_html(msg))
        except HTTPException:
            pass
    return {"ok": True}