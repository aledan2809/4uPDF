"""
Stripe payment routes for 4uPDF Pro subscription
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import stripe
import os

from .database import get_db
from .models.database import User, UserTier
from .auth import get_current_user

router = APIRouter(prefix="/api/stripe", tags=["stripe"])

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID", "")  # Pro monthly price ID
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://4updf.com")

stripe.api_key = STRIPE_SECRET_KEY


class CheckoutResponse(BaseModel):
    checkout_url: str


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout session for Pro subscription."""
    if not STRIPE_SECRET_KEY or not STRIPE_PRICE_ID:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    if user.tier == UserTier.PRO:
        raise HTTPException(status_code=400, detail="Already on Pro tier")

    # Create or reuse Stripe customer
    if not user.stripe_customer_id:
        customer = stripe.Customer.create(email=user.email)
        user.stripe_customer_id = customer.id
        await db.flush()

    session = stripe.checkout.Session.create(
        customer=user.stripe_customer_id,
        mode="subscription",
        line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
        success_url=f"{FRONTEND_URL}/pricing?success=true",
        cancel_url=f"{FRONTEND_URL}/pricing?canceled=true",
        metadata={"user_id": str(user.id)},
    )

    return CheckoutResponse(checkout_url=session.url)


@router.post("/portal")
async def create_portal(
    user: User = Depends(get_current_user),
):
    """Create a Stripe Customer Portal session for subscription management."""
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe not configured")
    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription")

    session = stripe.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{FRONTEND_URL}/pricing",
    )
    return {"portal_url": session.url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
    else:
        import json
        event = json.loads(payload)

    event_type = event.get("type", "")
    data = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        customer_id = data.get("customer")
        if customer_id:
            result = await db.execute(
                select(User).where(User.stripe_customer_id == customer_id)
            )
            user = result.scalar_one_or_none()
            if user:
                user.tier = UserTier.PRO
                user.usage_limit_daily = 1000
                user.usage_limit_monthly = 30000
                user.stripe_subscription_id = data.get("subscription")
                await db.flush()

    elif event_type in ("customer.subscription.deleted", "customer.subscription.paused"):
        customer_id = data.get("customer")
        if customer_id:
            result = await db.execute(
                select(User).where(User.stripe_customer_id == customer_id)
            )
            user = result.scalar_one_or_none()
            if user:
                user.tier = UserTier.FREE
                user.usage_limit_daily = 5
                user.usage_limit_monthly = 100
                user.stripe_subscription_id = None
                await db.flush()

    elif event_type == "customer.subscription.updated":
        customer_id = data.get("customer")
        status = data.get("status")
        if customer_id and status == "active":
            result = await db.execute(
                select(User).where(User.stripe_customer_id == customer_id)
            )
            user = result.scalar_one_or_none()
            if user and user.tier != UserTier.PRO:
                user.tier = UserTier.PRO
                user.usage_limit_daily = 1000
                user.usage_limit_monthly = 30000
                await db.flush()

    return {"received": True}
