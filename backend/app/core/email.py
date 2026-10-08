import logging
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from .config import BREVO_API_KEY, BREVO_FROM_EMAIL, APP_URL


def send_email(to: str, subject: str, html: str):
    """Send email via Brevo HTTP API. Logs to terminal when creds are not set."""
    if not BREVO_API_KEY or not BREVO_FROM_EMAIL:
        logging.info("[EMAIL DUMMY] To: %s | Subject: %s", to, subject)
        print(f"[EMAIL DUMMY] To: {to} | Subject: {subject}", flush=True)
        return
    try:
        import httpx
        r = httpx.post(
            "https://api.brevo.com/v3/smtp/email",
            json={
                "sender":   {"email": BREVO_FROM_EMAIL, "name": "Comment Compass"},
                "to":       [{"email": to}],
                "subject":  subject,
                "htmlContent": html,
            },
            headers={"api-key": BREVO_API_KEY, "Content-Type": "application/json"},
            timeout=10,
        )
        r.raise_for_status()
    except Exception as e:
        logging.error("Brevo email failed (to=%s, subject=%r): %s", to, subject, e)


def _base_template(content: str) -> str:
    year = datetime.now().year
    return f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0"
        style="background:#16161f;border:1px solid #2a2a3a;border-radius:16px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#6366f1,#a78bfa);padding:28px 40px;">
            <div style="font-size:20px;font-weight:900;color:#fff;">🧭 Comment Compass</div>
          </td>
        </tr>
        <tr><td style="padding:36px 40px;">{content}</td></tr>
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #2a2a3a;text-align:center;">
            <p style="color:#7070a0;font-size:12px;margin:0;">
              © {year} Comment Compass · Built for creators
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def otp_email_html(otp: str, title: str, subtitle: str) -> str:
    content = f"""
    <h2 style="color:#f0f0ff;font-size:22px;margin:0 0 8px;">{title}</h2>
    <p style="color:#b0b0cc;font-size:15px;margin:0 0 28px;">{subtitle}</p>
    <div style="background:#0a0a0f;border:1px solid #2a2a3a;border-radius:12px;
                padding:24px;text-align:center;margin-bottom:28px;">
      <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#818cf8;">{otp}</div>
    </div>
    <p style="color:#7070a0;font-size:13px;margin:0;">
      Expires in <strong style="color:#b0b0cc;">10 minutes</strong>.
      If you didn't request this, ignore this email.
    </p>"""
    return _base_template(content)


def welcome_email_html(email: str) -> str:
    features = [
        ("📊", "Sentiment analysis in under 60 seconds"),
        ("💡", "Actionable tips to improve your next video"),
        ("🎯", "Discover exactly what your audience wants"),
        ("🔒", "Your data is safe and never shared"),
    ]
    rows = "".join(f"""
    <tr>
      <td style="padding:10px 14px;background:#1a1a24;border:1px solid #2a2a3a;
                 border-radius:10px;">
        <span style="font-size:18px;">{icon}</span>
        <span style="color:#f0f0ff;font-size:14px;font-weight:600;margin-left:10px;">{text}</span>
      </td>
    </tr>
    <tr><td style="height:8px;"></td></tr>
    """ for icon, text in features)

    content = f"""
    <h2 style="color:#f0f0ff;font-size:22px;margin:0 0 12px;">Hi there, welcome aboard! 👋</h2>
    <p style="color:#b0b0cc;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Thank you for joining <strong style="color:#818cf8;">Comment Compass</strong>.
      Your account is ready. Here is what you can do right now:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      {rows}
    </table>
    <p style="color:#b0b0cc;font-size:14px;line-height:1.7;margin:0 0 24px;">
      Just paste any YouTube video link into your dashboard and we will analyse
      the comments for you in seconds.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="{APP_URL}/dashboard"
             style="display:inline-block;background:linear-gradient(135deg,#6366f1,#818cf8);
                    color:#fff;font-size:16px;font-weight:700;padding:16px 40px;
                    border-radius:12px;text-decoration:none;">
            Go to your dashboard
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#7070a0;font-size:13px;margin:24px 0 0;">
      If you have any questions just reply to this email — we read every message.
    </p>"""
    return _base_template(content)