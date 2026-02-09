"""User profile and GDPR endpoints."""

import logging

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse

from app.dependencies import CurrentActiveUser, DBSession
from app.schemas import MessageResponse, UserResponse, UserSelfUpdate
from app.services.audit import log_action
from app.services.gdpr import GDPRService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Get the full profile of the currently authenticated user.",
)
async def get_profile(current_user: CurrentActiveUser):
    """Get the current user's profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        address=current_user.address,
        role=current_user.role.name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_local_resident=current_user.is_local_resident,
        created_at=current_user.created_at,
        last_login_at=current_user.last_login_at,
    )


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
    description="Update the profile of the currently authenticated user (name, phone, address).",
)
async def update_profile(
    data: UserSelfUpdate,
    current_user: CurrentActiveUser,
    db: DBSession,
    req: Request,
):
    """Update the current user's profile."""
    from app.repositories import UserRepository

    user_repo = UserRepository(db)
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update.",
        )

    user = await user_repo.update(current_user, **updates)
    await log_action(
        db, action="profile_updated", request=req, user=current_user,
        entity_type="user", entity_id=current_user.id,
        detail=", ".join(updates.keys()),
    )
    return UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        address=user.address,
        role=user.role.name,
        is_active=user.is_active,
        is_verified=user.is_verified,
        is_local_resident=user.is_local_resident,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )


@router.get(
    "/me/export",
    summary="Export personal data (GDPR)",
    description="Export all personal data associated with the current user account.",
)
async def export_personal_data(
    current_user: CurrentActiveUser,
    db: DBSession,
    req: Request,
):
    """Export all user personal data for GDPR right of access/portability."""
    gdpr_service = GDPRService(db)
    data = await gdpr_service.export_user_data(current_user)
    await log_action(
        db, action="data_exported", request=req, user=current_user,
        entity_type="user", entity_id=current_user.id,
    )
    return JSONResponse(
        content=data,
        headers={
            "Content-Disposition": f'attachment; filename="gdpr-export-{current_user.id}.json"',
        },
    )


@router.delete(
    "/me",
    status_code=status.HTTP_200_OK,
    response_model=MessageResponse,
    summary="Delete account (GDPR)",
    description="Anonymize and deactivate the current user account. This action is irreversible.",
)
async def delete_account(
    current_user: CurrentActiveUser,
    db: DBSession,
    req: Request,
):
    """Delete (anonymize) the current user's account for GDPR right to erasure."""
    user_id = current_user.id
    await log_action(
        db, action="account_deleted", request=req, user=current_user,
        entity_type="user", entity_id=user_id,
    )
    gdpr_service = GDPRService(db)
    await gdpr_service.delete_account(current_user)
    return MessageResponse(message="Your account has been deleted and personal data anonymized.")
