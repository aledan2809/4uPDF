"""
Authentication and rate limiting for 4uPDF
JWT-based auth with bcrypt password hashing
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
import os

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import jwt
import bcrypt

from .database import get_db
from .models.database import User, UserTier, UsageLog

# Config
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "4updf-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Rate limits per tier
RATE_LIMITS = {
    UserTier.FREE: {"daily": 5, "max_file_mb": 50},
    UserTier.PRO: {"daily": 1000, "max_file_mb": 200},
    UserTier.ENTERPRISE: {"daily": 10000, "max_file_mb": 500},
}

# Anonymous rate limit (no account)
ANONYMOUS_DAILY_LIMIT = 3
ANONYMOUS_MAX_FILE_MB = 20

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: int, email: str, tier: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {
        "sub": str(user_id),
        "email": email,
        "tier": tier,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Get current user if authenticated, None otherwise."""
    if not credentials:
        return None
    try:
        payload = decode_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (HTTPException, ValueError, KeyError):
        return None

    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    return result.scalar_one_or_none()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get current user, raise 401 if not authenticated."""
    payload = decode_token(credentials.credentials)
    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


async def check_rate_limit(
    request: Request,
    user: Optional[User],
    db: AsyncSession,
) -> None:
    """Check rate limit for current user or anonymous IP."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    if user:
        # Authenticated user — check by user_id
        limits = RATE_LIMITS.get(user.tier, RATE_LIMITS[UserTier.FREE])
        result = await db.execute(
            select(func.count(UsageLog.id))
            .where(UsageLog.user_id == user.id, UsageLog.date >= today_start)
        )
        count = result.scalar() or 0
        if count >= limits["daily"]:
            raise HTTPException(
                status_code=429,
                detail=f"Daily limit reached ({limits['daily']} operations). Upgrade to Pro for more.",
            )
    else:
        # Anonymous — check by IP
        ip = request.client.host if request.client else "unknown"
        result = await db.execute(
            select(func.count(UsageLog.id))
            .where(UsageLog.ip_address == ip, UsageLog.user_id == None, UsageLog.date >= today_start)
        )
        count = result.scalar() or 0
        if count >= ANONYMOUS_DAILY_LIMIT:
            raise HTTPException(
                status_code=429,
                detail=f"Daily limit reached ({ANONYMOUS_DAILY_LIMIT} free operations). Create an account for more.",
            )


async def log_usage(
    request: Request,
    user: Optional[User],
    tool_type: str,
    db: AsyncSession,
) -> None:
    """Log usage for rate limiting."""
    from .models.database import ToolType
    try:
        tt = ToolType(tool_type)
    except ValueError:
        tt = ToolType.MERGE  # fallback

    log = UsageLog(
        user_id=user.id if user else None,
        tool_type=tt,
        ip_address=request.client.host if request.client else None,
    )
    db.add(log)
    await db.flush()
