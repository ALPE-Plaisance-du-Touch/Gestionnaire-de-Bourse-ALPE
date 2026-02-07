"""Public configuration API endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings
from app.schemas import CategoryConstraintsResponse, CategoryInfo, PriceHintsResponse
from app.schemas.article import (
    BLACKLISTED_ITEMS,
    MAX_ARTICLES_PER_LIST,
    MAX_CLOTHING_PER_LIST,
    MAX_LOT_AGE_MONTHS,
    MAX_LOT_SIZE,
    MAX_PRICE_STROLLER,
    MIN_PRICE,
)
from app.services import get_category_info, get_price_hints

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


@router.get(
    "/categories",
    response_model=CategoryConstraintsResponse,
    summary="Get article categories and constraints",
    description="Get all article categories with their constraints and limits.",
)
async def get_categories():
    """Get article categories with constraints for the frontend."""
    categories = get_category_info()
    return CategoryConstraintsResponse(
        categories=[CategoryInfo(**c) for c in categories],
        blacklisted=BLACKLISTED_ITEMS,
        max_articles_per_list=MAX_ARTICLES_PER_LIST,
        max_clothing_per_list=MAX_CLOTHING_PER_LIST,
        min_price=MIN_PRICE,
        max_price_stroller=MAX_PRICE_STROLLER,
        max_lot_size=MAX_LOT_SIZE,
        max_lot_age_months=MAX_LOT_AGE_MONTHS,
    )


@router.get(
    "/price-hints",
    response_model=PriceHintsResponse,
    summary="Get indicative price hints",
    description="Get indicative price ranges for different article types.",
)
async def get_price_hints_endpoint():
    """Get price hints for articles."""
    hints = get_price_hints()
    return PriceHintsResponse(hints=hints)
