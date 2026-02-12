"""Billetweb API integration endpoints."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import DBSession, require_role
from app.models import User
from app.repositories.edition import EditionRepository
from app.schemas.billetweb import BilletwebPreviewResponse
from app.schemas.billetweb_api import (
    BilletwebAttendeesSyncRequest,
    BilletwebAttendeesSyncResult,
    BilletwebConnectionTestResponse,
    BilletwebCredentialsRequest,
    BilletwebCredentialsResponse,
    BilletwebEventInfo,
    BilletwebEventsListResponse,
    BilletwebSessionPreview,
    BilletwebSessionsPreviewResponse,
    BilletwebSessionsSyncResult,
)
from app.services.billetweb_client import BilletwebAPIError, BilletwebAuthError
from app.services.billetweb_sync import BilletwebSyncService
from app.services.settings import SettingsService

logger = logging.getLogger(__name__)

# Settings router (mounted at /settings/billetweb)
router = APIRouter()

# Edition-scoped sync router (mounted at /editions/{edition_id}/billetweb-api)
edition_router = APIRouter()


# --- Settings endpoints (admin only) ---

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


# --- Edition-scoped sync endpoints (manager+) ---

async def _get_edition_or_404(db: DBSession, edition_id: str):
    """Get edition by ID or raise 404."""
    repo = EditionRepository(db)
    edition = await repo.get_by_id(edition_id)
    if not edition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )
    return edition


@edition_router.get(
    "/sessions/preview",
    response_model=BilletwebSessionsPreviewResponse,
    summary="Preview Billetweb sessions for this edition",
)
async def preview_sessions_sync(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Preview sessions from Billetweb before syncing as deposit slots."""
    edition = await _get_edition_or_404(db, edition_id)

    if not edition.billetweb_event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Edition is not linked to a Billetweb event",
        )

    sync_service = BilletwebSyncService(db)
    try:
        result = await sync_service.sync_sessions_preview(edition)
        return BilletwebSessionsPreviewResponse(
            total_sessions=result["total_sessions"],
            new_sessions=result["new_sessions"],
            sessions=[BilletwebSessionPreview(**s) for s in result["sessions"]],
        )
    except BilletwebAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )


@edition_router.post(
    "/sessions/sync",
    response_model=BilletwebSessionsSyncResult,
    summary="Sync Billetweb sessions as deposit slots",
)
async def sync_sessions(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Import/upsert sessions from Billetweb as deposit slots."""
    edition = await _get_edition_or_404(db, edition_id)

    if not edition.billetweb_event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Edition is not linked to a Billetweb event",
        )

    sync_service = BilletwebSyncService(db)
    try:
        result = await sync_service.sync_sessions_import(edition)
        return BilletwebSessionsSyncResult(**result)
    except BilletwebAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )


@edition_router.get(
    "/attendees/preview",
    response_model=BilletwebPreviewResponse,
    summary="Preview Billetweb attendees for this edition",
)
async def preview_attendees_sync(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Preview attendees from Billetweb before importing as depositors."""
    edition = await _get_edition_or_404(db, edition_id)

    if not edition.billetweb_event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Edition is not linked to a Billetweb event",
        )

    sync_service = BilletwebSyncService(db)
    try:
        return await sync_service.sync_attendees_preview(edition)
    except BilletwebAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )


@edition_router.post(
    "/attendees/import",
    response_model=BilletwebAttendeesSyncResult,
    summary="Import Billetweb attendees as depositors",
)
async def import_attendees_sync(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
    options: BilletwebAttendeesSyncRequest | None = None,
):
    """Import attendees from Billetweb API as edition depositors."""
    edition = await _get_edition_or_404(db, edition_id)

    if not edition.billetweb_event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Edition is not linked to a Billetweb event",
        )

    send_emails = options.send_emails if options else False

    sync_service = BilletwebSyncService(db)
    try:
        result = await sync_service.sync_attendees_import(
            edition=edition,
            imported_by=current_user,
            send_emails=send_emails,
        )
        return BilletwebAttendeesSyncResult(**result)
    except BilletwebAPIError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e),
        )
