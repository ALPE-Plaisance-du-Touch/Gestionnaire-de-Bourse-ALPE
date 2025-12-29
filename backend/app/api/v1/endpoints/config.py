"""Public configuration API endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings

router = APIRouter(prefix="/config", tags=["config"])


class PublicConfigResponse(BaseModel):
    """Public configuration values exposed to the frontend."""

    support_email: str


@router.get(
    "/public",
    response_model=PublicConfigResponse,
    summary="Get public configuration",
    description="Get public configuration values for the frontend (support email, etc.).",
)
async def get_public_config():
    """Get public configuration values."""
    return PublicConfigResponse(
        support_email=settings.support_email,
    )
