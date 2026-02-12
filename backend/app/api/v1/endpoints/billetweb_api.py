"""Billetweb API integration endpoints."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import DBSession, require_role
from app.models import User
from app.schemas.billetweb_api import (
    BilletwebConnectionTestResponse,
    BilletwebCredentialsRequest,
    BilletwebCredentialsResponse,
    BilletwebEventInfo,
    BilletwebEventsListResponse,
)
from app.services.billetweb_client import BilletwebAPIError, BilletwebAuthError
from app.services.billetweb_sync import BilletwebSyncService
from app.services.settings import SettingsService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "",
    response_model=BilletwebCredentialsResponse,
    summary="Get Billetweb API configuration status",
)
async def get_billetweb_config(
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
):
    """Get the current Billetweb API configuration (credentials masked)."""
    service = SettingsService(db)
    configured = await service.is_billetweb_configured()

    if not configured:
        return BilletwebCredentialsResponse(configured=False)

    user, api_key = await service.get_billetweb_credentials()
    return BilletwebCredentialsResponse(
        configured=True,
        user=user,
        api_key_masked=SettingsService.mask_api_key(api_key) if api_key else None,
    )


@router.put(
    "",
    response_model=BilletwebCredentialsResponse,
    summary="Save Billetweb API credentials",
)
async def save_billetweb_config(
    data: BilletwebCredentialsRequest,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
):
    """Save Billetweb API credentials (admin only). The API key is encrypted at rest."""
    service = SettingsService(db)
    await service.set_billetweb_credentials(data.user, data.api_key)

    return BilletwebCredentialsResponse(
        configured=True,
        user=data.user,
        api_key_masked=SettingsService.mask_api_key(data.api_key),
    )


@router.post(
    "/test",
    response_model=BilletwebConnectionTestResponse,
    summary="Test Billetweb API connection",
)
async def test_billetweb_connection(
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
):
    """Test the Billetweb API connection using saved credentials."""
    sync_service = BilletwebSyncService(db)

    settings_service = SettingsService(db)
    configured = await settings_service.is_billetweb_configured()
    if not configured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Billetweb API credentials not configured",
        )

    try:
        await sync_service.test_connection()
        return BilletwebConnectionTestResponse(
            success=True,
            message="Connection successful",
        )
    except BilletwebAuthError:
        return BilletwebConnectionTestResponse(
            success=False,
            message="Identifiants invalides",
        )
    except BilletwebAPIError as e:
        logger.warning("Billetweb connection test failed: %s", e)
        return BilletwebConnectionTestResponse(
            success=False,
            message=str(e),
        )


@router.get(
    "/events",
    response_model=BilletwebEventsListResponse,
    summary="List Billetweb events",
)
async def list_billetweb_events(
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
):
    """List events from Billetweb API (admin only)."""
    sync_service = BilletwebSyncService(db)

    settings_service = SettingsService(db)
    configured = await settings_service.is_billetweb_configured()
    if not configured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Billetweb API credentials not configured",
        )

    try:
        raw_events = await sync_service.list_events()
        events = [BilletwebEventInfo(**e) for e in raw_events]
        return BilletwebEventsListResponse(events=events)
    except BilletwebAuthError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants Billetweb invalides",
        )
    except BilletwebAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )
