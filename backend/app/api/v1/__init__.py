"""API v1 package."""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, config, invitations

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(config.router, tags=["Config"])
api_router.include_router(invitations.router, prefix="/invitations", tags=["Invitations"])
