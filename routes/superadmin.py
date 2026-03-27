"""
SuperAdmin authentication routes.
Email/password login, password change, forgot/reset password.
"""

import os
import secrets
import logging
from datetime import datetime, timedelta

import jwt
import bcrypt
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/superadmin", tags=["superadmin"])

# Will be set by init_superadmin_routes()
_jwt_secret_key = ""
_jwt_algorithm = "HS256"
_get_setting = None
_db_session = None

# In-memory store for password reset tokens: {token: {email, expires}}
_reset_tokens: dict = {}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str


def init_superadmin_routes(jwt_secret_key: str, jwt_algorithm: str, get_setting_fn, db_session_fn):
    """Initialize module-level dependencies from main app."""
    global _jwt_secret_key, _jwt_algorithm, _get_setting, _db_session
    _jwt_secret_key = jwt_secret_key
    _jwt_algorithm = jwt_algorithm
    _get_setting = get_setting_fn
    _db_session = db_session_fn


def _get_secret():
    return _get_setting("jwt_secret_key", _jwt_secret_key)


def _require_superadmin_cookie(request: Request) -> dict:
    """Validate superadmin JWT from httpOnly cookie. Returns payload."""
    token = request.cookies.get("superadmin_jwt")
    if not token:
        # Fallback to Authorization header for backward compat
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
        else:
            raise HTTPException(status_code=401, detail="Authentication required")
    try:
        secret = _get_secret()
        payload = jwt.decode(token, secret, algorithms=[_jwt_algorithm])
        if payload.get("role") != "superadmin":
            raise HTTPException(status_code=403, detail="Not superadmin")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/login")
async def superadmin_login(data: LoginRequest):
    """Authenticate superadmin with email and password."""
    with _db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, email, password_hash, role FROM users WHERE email = ?",
            (data.email,)
        )
        user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = dict(user)

    if not bcrypt.checkpw(data.password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Forbidden")

    secret = _get_secret()
    token = jwt.encode(
        {
            "sub": user["id"],
            "email": user["email"],
            "role": "superadmin",
            "exp": datetime.utcnow() + timedelta(hours=24),
            "iat": datetime.utcnow(),
        },
        secret,
        algorithm=_jwt_algorithm,
    )

    response = JSONResponse(content={"success": True})
    response.set_cookie(
        key="superadmin_jwt",
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=86400,
        path="/",
    )
    return response


@router.get("/verify")
async def superadmin_verify(request: Request):
    """Verify superadmin session (cookie or bearer)."""
    payload = _require_superadmin_cookie(request)
    return {"valid": True, "email": payload.get("email")}


@router.post("/logout")
async def superadmin_logout():
    """Clear superadmin session cookie."""
    response = JSONResponse(content={"success": True})
    response.delete_cookie(key="superadmin_jwt", path="/")
    return response


@router.post("/change-password")
async def superadmin_change_password(request: Request, data: ChangePasswordRequest):
    """Change superadmin password (requires current password)."""
    payload = _require_superadmin_cookie(request)
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")

    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    with _db_session() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not bcrypt.checkpw(data.current_password.encode("utf-8"), user["password_hash"].encode("utf-8")):
            raise HTTPException(status_code=403, detail="Current password is incorrect")

        new_hash = bcrypt.hashpw(data.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        cursor.execute(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
            (new_hash, datetime.utcnow().isoformat(), user_id),
        )

    return {"success": True}


@router.post("/forgot-password")
async def superadmin_forgot_password(data: ForgotPasswordRequest):
    """Generate password reset token. Sends email or logs to console."""
    with _db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, role FROM users WHERE email = ?",
            (data.email,)
        )
        user = cursor.fetchone()

    # Always return success to prevent email enumeration
    if not user or dict(user).get("role") != "superadmin":
        return {"success": True, "message": "If the email exists, a reset link has been sent."}

    token = secrets.token_urlsafe(48)
    _reset_tokens[token] = {
        "email": data.email,
        "expires": datetime.utcnow() + timedelta(hours=1),
    }

    reset_url = f"/superadmin/reset-password?token={token}"

    # Try SMTP, fallback to console
    smtp_host = os.environ.get("SMTP_HOST", "")
    if smtp_host:
        try:
            import smtplib
            from email.mime.text import MIMEText

            smtp_port = int(os.environ.get("SMTP_PORT", "587"))
            smtp_user = os.environ.get("SMTP_USER", "")
            smtp_pass = os.environ.get("SMTP_PASS", "")
            smtp_from = os.environ.get("SMTP_FROM", smtp_user)

            base_url = os.environ.get("BASE_URL", "https://4updf.com")
            full_url = f"{base_url}{reset_url}"

            msg = MIMEText(
                f"Click the link below to reset your SuperAdmin password:\n\n{full_url}\n\nThis link expires in 1 hour.",
                "plain",
            )
            msg["Subject"] = "4uPDF SuperAdmin Password Reset"
            msg["From"] = smtp_from
            msg["To"] = data.email

            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_from, [data.email], msg.as_string())

            logger.info(f"[FORGOT-PASSWORD] Reset email sent to {data.email}")
        except Exception as e:
            logger.warning(f"[FORGOT-PASSWORD] SMTP failed: {e}. Logging token to console.")
            logger.info(f"[FORGOT-PASSWORD] Reset token for {data.email}: {token}. URL: {reset_url}")
    else:
        logger.info(f"[FORGOT-PASSWORD] Reset token for {data.email}: {token}. URL: {reset_url}")
        print(f"[FORGOT-PASSWORD] Reset token for {data.email}: {token}. URL: {reset_url}")

    return {"success": True, "message": "If the email exists, a reset link has been sent."}


@router.post("/reset-password")
async def superadmin_reset_password(data: ResetPasswordRequest):
    """Reset password using token from forgot-password flow."""
    token_data = _reset_tokens.get(data.token)
    if not token_data:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if datetime.utcnow() > token_data["expires"]:
        _reset_tokens.pop(data.token, None)
        raise HTTPException(status_code=400, detail="Reset token has expired")

    if data.new_password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    email = token_data["email"]
    new_hash = bcrypt.hashpw(data.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    with _db_session() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?",
            (new_hash, datetime.utcnow().isoformat(), email),
        )
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="User not found")

    _reset_tokens.pop(data.token, None)
    return {"success": True, "message": "Password has been reset successfully."}
