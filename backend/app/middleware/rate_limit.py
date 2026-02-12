"""Rate limiting middleware using in-memory storage.

For production, consider using Redis for distributed rate limiting.
"""

import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.config import settings


@dataclass
class RateLimitState:
    """State for tracking rate limit per client."""

    requests: list[float] = field(default_factory=list)

    def add_request(self, timestamp: float) -> None:
        """Add a request timestamp."""
        self.requests.append(timestamp)

    def cleanup(self, window_start: float) -> None:
        """Remove requests outside the current window."""
        self.requests = [ts for ts in self.requests if ts >= window_start]

    def count(self) -> int:
        """Get the number of requests in the current window."""
        return len(self.requests)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using sliding window algorithm."""

    def __init__(
        self,
        app,
        requests_per_window: int | None = None,
        window_seconds: int | None = None,
        exclude_paths: list[str] | None = None,
    ):
        """Initialize rate limiter.

        Args:
            app: The FastAPI application
            requests_per_window: Max requests per window (default from settings)
            window_seconds: Window size in seconds (default from settings)
            exclude_paths: Paths to exclude from rate limiting
        """
        super().__init__(app)
        self.requests_per_window = requests_per_window or settings.rate_limit_requests
        self.window_seconds = window_seconds or settings.rate_limit_window_seconds
        self.exclude_paths = exclude_paths or ["/health", "/api/docs", "/api/redoc", "/api/openapi.json"]
        self.clients: dict[str, RateLimitState] = defaultdict(RateLimitState)

    def _get_client_id(self, request: Request) -> str:
        """Get a unique identifier for the client.

        Uses X-Forwarded-For header if behind a proxy, otherwise client IP.
        """
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            # Take the first IP in the chain (original client)
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _is_excluded(self, path: str) -> bool:
        """Check if the path is excluded from rate limiting."""
        return any(path.startswith(excluded) for excluded in self.exclude_paths)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process the request and apply rate limiting."""
        # Skip rate limiting for excluded paths
        if self._is_excluded(request.url.path):
            return await call_next(request)

        client_id = self._get_client_id(request)
        current_time = time.time()
        window_start = current_time - self.window_seconds

        # Get or create client state
        state = self.clients[client_id]

        # Cleanup old requests
        state.cleanup(window_start)

        # Check rate limit
        if state.count() >= self.requests_per_window:
            # Calculate retry-after
            oldest_request = min(state.requests) if state.requests else current_time
            retry_after = int(oldest_request + self.window_seconds - current_time) + 1

            return JSONResponse(
                status_code=429,
                content={
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Too many requests. Please retry after {retry_after} seconds.",
                    "details": {
                        "retry_after": retry_after,
                        "limit": self.requests_per_window,
                        "window": self.window_seconds,
                    },
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.requests_per_window),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(oldest_request + self.window_seconds)),
                },
            )

        # Add current request
        state.add_request(current_time)

        # Process the request
        response = await call_next(request)

        # Add rate limit headers
        remaining = self.requests_per_window - state.count()
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_window)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(int(current_time + self.window_seconds))

        return response


class LoginRateLimitMiddleware(BaseHTTPMiddleware):
    """Stricter rate limiting for login endpoint to prevent brute force attacks."""

    def __init__(
        self,
        app,
        max_attempts: int = 5,
        lockout_seconds: int = 900,  # 15 minutes
    ):
        """Initialize login rate limiter.

        Args:
            app: The FastAPI application
            max_attempts: Maximum login attempts before lockout
            lockout_seconds: Lockout duration in seconds
        """
        super().__init__(app)
        self.max_attempts = max_attempts
        self.lockout_seconds = lockout_seconds
        self.attempts: dict[str, list[float]] = defaultdict(list)
        self.lockouts: dict[str, float] = {}

    def _get_client_id(self, request: Request) -> str:
        """Get a unique identifier for the client."""
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process login requests with stricter rate limiting."""
        # Only apply to login endpoint
        if request.url.path != "/api/v1/auth/login" or request.method != "POST":
            return await call_next(request)

        client_id = self._get_client_id(request)
        current_time = time.time()

        # Check if client is locked out
        if client_id in self.lockouts:
            lockout_end = self.lockouts[client_id]
            if current_time < lockout_end:
                retry_after = int(lockout_end - current_time) + 1
                return JSONResponse(
                    status_code=429,
                    content={
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Too many login attempts. Please retry after {retry_after} seconds.",
                        "details": {
                            "retry_after": retry_after,
                            "lockout_minutes": self.lockout_seconds // 60,
                        },
                    },
                    headers={"Retry-After": str(retry_after)},
                )
            else:
                # Lockout expired
                del self.lockouts[client_id]
                self.attempts[client_id] = []

        # Cleanup old attempts (outside lockout window)
        window_start = current_time - self.lockout_seconds
        self.attempts[client_id] = [
            ts for ts in self.attempts[client_id] if ts >= window_start
        ]

        # Check attempt count
        if len(self.attempts[client_id]) >= self.max_attempts:
            # Apply lockout
            self.lockouts[client_id] = current_time + self.lockout_seconds
            return JSONResponse(
                status_code=429,
                content={
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": f"Too many login attempts. Please retry after {self.lockout_seconds // 60} minutes.",
                    "details": {
                        "retry_after": self.lockout_seconds,
                        "lockout_minutes": self.lockout_seconds // 60,
                    },
                },
                headers={"Retry-After": str(self.lockout_seconds)},
            )

        # Process the request
        response = await call_next(request)

        # Track failed attempts (401 responses)
        if response.status_code == 401:
            self.attempts[client_id].append(current_time)

        return response
