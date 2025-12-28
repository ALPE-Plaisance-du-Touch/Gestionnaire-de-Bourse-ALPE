"""Invitation API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import DBSession, require_role
from app.exceptions import DuplicateEmailError, InvalidTokenError
from app.models import User
from app.schemas import (
    BulkInvitationResult,
    InvitationCreate,
    InvitationResendResponse,
    InvitationResponse,
)
from app.services.invitation import InvitationService

router = APIRouter()


def get_invitation_service(db: DBSession) -> InvitationService:
    """Get InvitationService instance."""
    return InvitationService(db)


InvitationServiceDep = Annotated[InvitationService, Depends(get_invitation_service)]


@router.post(
    "",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create invitation",
    description="Create and send an invitation for a depositor. Requires manager or admin role.",
)
async def create_invitation(
    request: InvitationCreate,
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

        # TODO: Send invitation email
        # await email_service.send_invitation_email(user.email, token)

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
    )

    # TODO: Send invitation emails for created invitations

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
    invitation_service: InvitationServiceDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Resend an invitation with a new token."""
    try:
        user, token = await invitation_service.resend_invitation(invitation_id)

        # TODO: Send invitation email
        # await email_service.send_invitation_email(user.email, token)

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
