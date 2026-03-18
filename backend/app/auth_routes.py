"""
Authentication API routes for 4uPDF
Register, login, profile, refresh token
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone

from .database import get_db
from .models.database import User, UserTier
from .auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class ProfileResponse(BaseModel):
    id: int
    email: str
    tier: str
    is_verified: bool
    usage_limit_daily: int
    created_at: str


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        tier=UserTier.FREE,
        is_active=True,
        is_verified=False,
        usage_limit_daily=5,
        usage_limit_monthly=100,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    token = create_access_token(user.id, user.email, user.tier.value)
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "tier": user.tier.value},
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    user.last_login_at = datetime.now(timezone.utc)
    await db.flush()

    token = create_access_token(user.id, user.email, user.tier.value)
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "email": user.email, "tier": user.tier.value},
    )


@router.get("/me", response_model=ProfileResponse)
async def get_profile(user: User = Depends(get_current_user)):
    """Get current user profile."""
    return ProfileResponse(
        id=user.id,
        email=user.email,
        tier=user.tier.value,
        is_verified=user.is_verified,
        usage_limit_daily=user.usage_limit_daily or 5,
        created_at=user.created_at.isoformat() if user.created_at else "",
    )
