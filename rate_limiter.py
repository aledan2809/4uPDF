"""
Rate limiting middleware for API endpoints
Uses sliding window algorithm with Redis-like in-memory storage
"""

import time
from collections import defaultdict, deque
from threading import Lock
from typing import Dict, Tuple
from fastapi import Request, HTTPException
from datetime import datetime, timedelta

class RateLimiter:
    """In-memory rate limiter using sliding window algorithm."""

    def __init__(self):
        self.requests: Dict[str, deque] = defaultdict(deque)
        self.locks: Dict[str, Lock] = defaultdict(Lock)
        self.cleanup_interval = 3600
        self.last_cleanup = time.time()

    def _get_client_id(self, request: Request) -> str:
        """Extract client identifier from request."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _cleanup_old_entries(self):
        """Remove expired entries to prevent memory bloat."""
        now = time.time()
        if now - self.last_cleanup < self.cleanup_interval:
            return

        cutoff = now - 3600
        keys_to_remove = []

        for key, timestamps in list(self.requests.items()):
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()
            if not timestamps:
                keys_to_remove.append(key)

        for key in keys_to_remove:
            del self.requests[key]
            if key in self.locks:
                del self.locks[key]

        self.last_cleanup = now

    def check_rate_limit(
        self,
        request: Request,
        max_requests: int = 100,
        window_seconds: int = 60,
        endpoint: str = ""
    ) -> Tuple[bool, Dict[str, int]]:
        """
        Check if request is within rate limit.

        Args:
            request: FastAPI request object
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            endpoint: Optional endpoint identifier for granular limits

        Returns:
            Tuple of (allowed: bool, info: dict with remaining/reset)
        """
        client_id = self._get_client_id(request)
        key = f"{client_id}:{endpoint}" if endpoint else client_id

        self._cleanup_old_entries()

        with self.locks[key]:
            now = time.time()
            cutoff = now - window_seconds

            timestamps = self.requests[key]

            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()

            current_count = len(timestamps)

            if current_count >= max_requests:
                oldest = timestamps[0]
                reset_in = int(oldest + window_seconds - now)
                return False, {
                    "limit": max_requests,
                    "remaining": 0,
                    "reset": reset_in
                }

            timestamps.append(now)

            return True, {
                "limit": max_requests,
                "remaining": max_requests - (current_count + 1),
                "reset": window_seconds
            }

rate_limiter = RateLimiter()

async def check_rate_limit(
    request: Request,
    max_requests: int = 100,
    window: int = 60,
    endpoint: str = ""
):
    """FastAPI dependency for rate limiting."""
    allowed, info = rate_limiter.check_rate_limit(
        request, max_requests, window, endpoint
    )

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded. Try again in {info['reset']} seconds.",
            headers={
                "X-RateLimit-Limit": str(info["limit"]),
                "X-RateLimit-Remaining": str(info["remaining"]),
                "X-RateLimit-Reset": str(info["reset"]),
                "Retry-After": str(info["reset"])
            }
        )

    return info

def get_rate_limit_headers(info: Dict[str, int]) -> Dict[str, str]:
    """Generate rate limit headers for response."""
    return {
        "X-RateLimit-Limit": str(info["limit"]),
        "X-RateLimit-Remaining": str(info["remaining"]),
        "X-RateLimit-Reset": str(info["reset"])
    }
