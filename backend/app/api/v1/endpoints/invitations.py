"""Invitation API endpoints."""

import logging
from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status

from app.dependencies import DBSession, require_role
from app.exceptions import DuplicateEmailError, InvalidTokenError
from app.models import User
from app.schemas import (
    BulkDeleteRequest,
    BulkDeleteResult,
    BulkInvitationResult,
    InvitationCreate,
    InvitationResendResponse,
    InvitationResponse,
)
from app.services.email import email_service
from app.services.invitation import InvitationService

logger = logging.getLogger(__name__)

router = APIRouter()


def get_invitation_service(db: DBSession) -> InvitationService:
    """Get InvitationService instance."""
    return InvitationService(db)


InvitationServiceDep = Annotated[InvitationService, Depends(get_invitation_service)]


def compute_invitation_status(user: User) -> str:
    """Compute the invitation status based on user state."""
    if user.is_active and user.password_hash:
        return "activated"
    if not user.invitation_token:
        return "cancelled"
    if user.invitation_expires_at:
        expires = user.invitation_expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            return "expired"
    return "pending"


@router.get(
    "",
    response_model=list[InvitationResponse],
    summary="List invitations",
    description="List invitations with optional status filter. Requires manager or admin role.",
)
async def list_invitations(
    invitation_service: InvitationServiceDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
    status_filter: Literal["pending", "expired", "activated"] | None = Query(
        None,
        alias="status",
        description="Filter by status: 'pending', 'expired', 'activated', or omit for all",
    ),
):
    """List invitations with optional status filter."""
    users = await invitation_service.list_invitations(status_filter)

    return [
        InvitationResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            status=compute_invitation_status(user),
            created_at=user.created_at,
            expires_at=user.invitation_expires_at,
            # For activated users, use updated_at as activation date
            used_at=user.updated_at if (user.is_active and user.password_hash) else None,
        )
        for user in users
    ]


@router.get(
    "/stats",
    summary="Get invitation statistics",
)
async def get_invitation_stats_endpoint(
    invitation_service: InvitationServiceDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Get detailed invitation statistics."""
    from app.schemas.invitation_stats import InvitationStatsResponse

    stats = await invitation_service.get_invitation_stats()
    return InvitationStatsResponse(**stats)


@router.get(
    "/export-excel",
    summary="Export invitations as Excel file",
)
async def export_invitations_excel_endpoint(
    invitation_service: InvitationServiceDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Export invitations as an Excel file with 3 sheets."""
    from io import BytesIO

    from fastapi.responses import StreamingResponse

    from app.services.invitation_excel import generate_invitation_excel

    users = await invitation_service.list_invitations()
    stats = await invitation_service.get_invitation_stats()
    excel_bytes = generate_invitation_excel(users, stats)

    return StreamingResponse(
        BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="Export_Invitations.xlsx"'},
    )


@router.post(
    "",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create invitation",
    description="Create and send an invitation for a depositor. Requires manager or admin role.",
)
async def create_invitation(
    request: InvitationCreate,
    background_tasks: BackgroundTasks,
    invitation_service: InvitationServiceDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Create a new invitation for a depositor."""
    try:
        user, token = await invitation_service.create_invitation(
            email=request.email,
            first_name=request.first_name,
            last_name=request.last_name,
            list_type=request.list_type,
            created_by_id=current_user.id,
        )

        # Send invitation email in background
        background_tasks.add_task(
            email_service.send_invitation_email,
            to_email=user.email,
            token=token,
            first_name=user.first_name,
        )
        logger.info(f"Invitation created for {user.email}, email queued")

        return InvitationResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            status="sent",
            created_at=user.created_at,
            expires_at=user.invitation_expires_at,
            used_at=None,
        )
    except DuplicateEmailError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.post(
    "/bulk",
    response_model=BulkInvitationResult,
    summary="Bulk create invitations",
    description="Create multiple invitations at once. Requires manager or admin role.",
)
async def bulk_create_invitations(
    invitations: list[InvitationCreate],
    background_tasks: BackgroundTasks,
    invitation_service: InvitationServiceDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Create multiple invitations at once."""
    invitation_dicts = [
        {
            "email": inv.email,
            "first_name": inv.first_name,
            "last_name": inv.last_name,
            "list_type": inv.list_type,
        }
        for inv in invitations
    ]

    result = await invitation_service.create_bulk_invitations(
        invitations=invitation_dicts,
        created_by_id=current_user.id,
        background_tasks=background_tasks,
    )

    return BulkInvitationResult(
        total=result["total"],
        created=result["created"],
        duplicates=result["duplicates"],
        errors=result["errors"],
    )


@router.post(
    "/{invitation_id}/resend",
    response_model=InvitationResendResponse,
    summary="Resend invitation",
    description="Resend an invitation with a new token. Requires manager or admin role.",
)
async def resend_invitation(
    invitation_id: str,
    background_tasks: BackgroundTasks,
    invitation_service: InvitationServiceDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Resend an invitation with a new token."""
    try:
        user, token = await invitation_service.resend_invitation(invitation_id)

        # Send invitation email in background
        background_tasks.add_task(
            email_service.send_invitation_email,
            to_email=user.email,
            token=token,
            first_name=user.first_name,
        )
        logger.info(f"Invitation resent for {user.email}, email queued")

        return InvitationResendResponse(
            id=user.id,
            email=user.email,
            status="sent",
            expires_at=user.invitation_expires_at,
            message="Invitation resent successfully",
        )
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND
            if "not found" in e.message.lower()
            else status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.post(
    "/bulk-delete",
    response_model=BulkDeleteResult,
    summary="Bulk delete invitations",
    description="Delete multiple invitations at once. Requires manager or admin role.",
)
async def bulk_delete_invitations(
    request: BulkDeleteRequest,
    invitation_service: InvitationServiceDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Delete multiple invitations at once."""
    result = await invitation_service.bulk_delete_invitations(request.ids)
    logger.info(
        f"Bulk delete: {result['deleted']}/{result['total']} invitations deleted by {current_user.email}"
    )
    return BulkDeleteResult(
        total=result["total"],
        deleted=result["deleted"],
        not_found=result["not_found"],
    )


@router.delete(
    "/{invitation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete invitation",
    description="Delete an invitation regardless of its status. Requires manager or admin role.",
)
async def delete_invitation(
    invitation_id: str,
    invitation_service: InvitationServiceDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Delete an invitation.

    For pending invitations, the token is invalidated.
    For activated users, only the invitation record is cleared (user account is preserved).
    """
    deleted = await invitation_service.delete_invitation(invitation_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found",
        )
    logger.info(f"Invitation {invitation_id} deleted by {current_user.email}")
