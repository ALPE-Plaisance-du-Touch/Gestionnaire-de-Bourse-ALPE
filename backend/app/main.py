"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup and shutdown events."""
    # Startup
    # TODO: Initialize database connection pool
    # TODO: Run pending migrations in production
    yield
    # Shutdown
    # TODO: Close database connections


app = FastAPI(
    title="Bourse ALPE API",
    description="API for managing second-hand goods sales events",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
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


# Include routers
# TODO: Add routers as they are implemented
# from app.api import auth, editions, item_lists, articles, sales, payouts
# app.include_router(auth.router, prefix="/api/v1")
# app.include_router(editions.router, prefix="/api/v1")
# app.include_router(item_lists.router, prefix="/api/v1")
# app.include_router(articles.router, prefix="/api/v1")
# app.include_router(sales.router, prefix="/api/v1")
# app.include_router(payouts.router, prefix="/api/v1")
