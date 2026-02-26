"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware import LoginRateLimitMiddleware, RateLimitMiddleware


WEAK_JWT_SECRETS = {"your-secret-key-change-in-production", "dev-secret-key-change-in-production", ""}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup and shutdown events."""
    if settings.is_production:
        if settings.jwt_secret_key in WEAK_JWT_SECRETS:
            raise RuntimeError("JWT_SECRET_KEY must be set to a strong secret in production")
        if len(settings.jwt_secret_key) < 32:
            raise RuntimeError("JWT_SECRET_KEY must be at least 32 characters in production")
    yield


app = FastAPI(
    title="Bourse ALPE API",
    description="API for managing second-hand goods sales events",
    version="0.1.0",
    docs_url="/api/docs" if settings.is_development else None,
    redoc_url="/api/redoc" if settings.is_development else None,
    openapi_url="/api/openapi.json" if settings.is_development else None,
    lifespan=lifespan,
)

# Rate limiting middleware (skip in development for easier testing)
if not settings.is_development:
    app.add_middleware(LoginRateLimitMiddleware, max_attempts=5, lockout_seconds=900)
    app.add_middleware(RateLimitMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}


@app.get("/api/v1", tags=["Root"])
async def api_root() -> dict[str, str]:
    """API root endpoint with version information."""
    return {
        "name": "Bourse ALPE API",
        "version": "0.1.0",
        "docs": "/api/docs",
    }


# Include API routers
from app.api.v1 import api_router

app.include_router(api_router, prefix="/api/v1")
