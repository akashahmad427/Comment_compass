from typing import Literal

from pydantic import BaseModel, EmailStr, Field



class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    channel_link: str = ""
    phone: str = ""
    date_of_birth: str = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class OtpRequest(BaseModel):
    email: EmailStr


class OtpVerify(BaseModel):
    email: EmailStr
    otp: str


class GoogleAuthIn(BaseModel):
    credential: str


class ResetPasswordIn(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=8, max_length=72)


class ProfileUpdate(BaseModel):
    name: str = Field(default="", max_length=100)
    channel_link: str = Field(default="", max_length=500)
    phone: str = Field(default="", max_length=30)
    date_of_birth: str = Field(default="", max_length=20)


class ChangePasswordIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=72)
    new_password: str = Field(min_length=8, max_length=72)


class AnalyzeIn(BaseModel):
    url: str


class TokenOut(BaseModel):
    token: str


# ── Admin schemas ─────────────────────────────────────────────────────────────
class AdminLoginIn(BaseModel):
    email: EmailStr
    password: str


class AdminReplyIn(BaseModel):
    message_id: int
    reply: str


class AdminEmailIn(BaseModel):
    user_id: int
    subject: str
    body: str


class ContactMessageIn(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    subject: str = Field(min_length=1, max_length=500)
    message: str = Field(min_length=1)


class AdminPlanIn(BaseModel):
    plan: Literal["free", "pro", "agency"]
    days: int = Field(default=30, ge=1, le=366)   # how long a paid plan stays active