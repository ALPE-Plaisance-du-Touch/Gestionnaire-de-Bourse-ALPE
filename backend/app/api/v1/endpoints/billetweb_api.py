"""Billetweb API integration endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import DBSession, require_role
from app.models import User
from app.schemas.billetweb_api import (
    BilletwebConnectionTestResponse,
    BilletwebCredentialsRequest,
    BilletwebCredentialsResponse,
)
from app.services.settings import SettingsService

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
    service = SettingsService(db)
    configured = await service.is_billetweb_configured()

    if not configured:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Billetweb API credentials not configured",
        )

    # Import here to avoid circular dependency - will be created in iteration 2
    try:
        from app.services.billetweb_client import BilletwebClient

        user, api_key = await service.get_billetweb_credentials()
        client = BilletwebClient(user=user, api_key=api_key)
        await client.test_connection()
        return BilletwebConnectionTestResponse(
            success=True,
            message="Connection successful",
        )
    except ImportError:
        # BilletwebClient not yet implemented (iteration 2)
        return BilletwebConnectionTestResponse(
            success=False,
            message="Billetweb client not yet available",
        )
    except Exception as e:
        return BilletwebConnectionTestResponse(
            success=False,
            message=str(e),
        )
