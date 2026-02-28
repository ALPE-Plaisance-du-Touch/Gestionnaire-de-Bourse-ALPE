"""Configuration API endpoints."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.dependencies import RequireAdmin
from app.models.base import get_db_session
from app.repositories import AppSettingRepository, EditionRepository
from app.schemas import ActiveEditionResponse, CategoryConstraintsResponse, CategoryInfo, EditionResponse, PriceHintsResponse
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
from app.services.email import email_service

router = APIRouter(prefix="/config", tags=["config"])

SUPPORT_EMAIL_KEY = "support_email"


class PublicConfigResponse(BaseModel):
    support_email: str


class SupportEmailResponse(BaseModel):
    support_email: str
    source: str


class UpdateSupportEmailRequest(BaseModel):
    support_email: EmailStr


async def _get_support_email(db: AsyncSession) -> str:
    repo = AppSettingRepository(db)
    setting = await repo.get_by_key(SUPPORT_EMAIL_KEY)
    value = setting.value if setting and setting.value else settings.support_email
    email_service.support_email = value
    return value


@router.get(
    "/public",
    response_model=PublicConfigResponse,
    summary="Get public configuration",
)
async def get_public_config(db: AsyncSession = Depends(get_db_session)):
    return PublicConfigResponse(
        support_email=await _get_support_email(db),
    )


@router.get(
    "/support-email",
    response_model=SupportEmailResponse,
    summary="Get support email configuration",
    dependencies=[RequireAdmin],
)
async def get_support_email(db: AsyncSession = Depends(get_db_session)):
    repo = AppSettingRepository(db)
    setting = await repo.get_by_key(SUPPORT_EMAIL_KEY)
    if setting and setting.value:
        return SupportEmailResponse(support_email=setting.value, source="database")
    return SupportEmailResponse(support_email=settings.support_email, source="default")


@router.put(
    "/support-email",
    response_model=SupportEmailResponse,
    summary="Update support email",
    dependencies=[RequireAdmin],
)
async def update_support_email(
    body: UpdateSupportEmailRequest,
    db: AsyncSession = Depends(get_db_session),
):
    repo = AppSettingRepository(db)
    await repo.upsert(SUPPORT_EMAIL_KEY, str(body.support_email))
    await db.commit()
    email_service.support_email = str(body.support_email)
    return SupportEmailResponse(support_email=str(body.support_email), source="database")


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


@router.get(
    "/active-edition",
    response_model=ActiveEditionResponse,
    summary="Get active edition",
    description="Get the currently active edition (public, no authentication required).",
)
async def get_active_edition(
    db: AsyncSession = Depends(get_db_session),
):
    """Get the active edition for homepage display."""
    repo = EditionRepository(db)
    edition = await repo.get_any_active_edition()
    training = await repo.get_active_training_edition()
    return ActiveEditionResponse(
        active_edition=EditionResponse.model_validate(edition) if edition else None,
        training_edition=EditionResponse.model_validate(training) if training else None,
    )
