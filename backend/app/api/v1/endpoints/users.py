"""User profile, GDPR, and admin user management endpoints."""

import logging
import math
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select

from app.dependencies import CurrentActiveUser, DBSession, require_role
from app.models import Role, User
from app.repositories import UserRepository
from app.schemas import MessageResponse, UserListResponse, UserResponse, UserSelfUpdate, UserUpdate
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


# --- Admin user management endpoints ---


def _user_to_response(user: User) -> UserResponse:
    """Convert a User model to UserResponse."""
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
    "/",
    response_model=UserListResponse,
    summary="List all users (admin)",
    description="List all users with optional filtering by role, status, and search. Administrator only.",
)
async def list_users(
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
    role: str | None = Query(None, pattern="^(depositor|volunteer|manager|administrator)$"),
    is_active: bool | None = Query(None),
    search: str | None = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List all users with filtering and pagination."""
    user_repo = UserRepository(db)
    users, total = await user_repo.list_users(
        role=role, is_active=is_active, search=search, page=page, limit=limit,
    )
    return UserListResponse(
        items=[_user_to_response(u) for u in users],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 1,
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID (admin)",
    description="Get a specific user's details. Administrator only.",
)
async def get_user(
    user_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
):
    """Get a user by ID."""
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return _user_to_response(user)


@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user (admin)",
    description="Update a user's data (name, email, role, status). Administrator only.",
)
async def admin_update_user(
    user_id: str,
    data: UserUpdate,
    db: DBSession,
    req: Request,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
):
    """Update a user as administrator."""
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun champ à mettre à jour.",
        )

    # Prevent admin from deactivating or demoting themselves
    if user_id == current_user.id:
        if "is_active" in updates and not updates["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous ne pouvez pas désactiver votre propre compte.",
            )
        if "role" in updates and updates["role"] != "administrator":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous ne pouvez pas modifier votre propre rôle.",
            )

    # Validate email uniqueness if changing
    if "email" in updates:
        new_email = updates["email"].lower()
        if new_email != user.email and await user_repo.email_exists(new_email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cette adresse email est déjà utilisée.",
            )
        updates["email"] = new_email

    # Convert role name to role_id
    if "role" in updates:
        role_name = updates.pop("role")
        result = await db.execute(select(Role).where(Role.name == role_name))
        role = result.scalar_one_or_none()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rôle « {role_name} » introuvable.",
            )
        updates["role_id"] = role.id

    user = await user_repo.update(user, **updates)

    # Reload role relationship after potential role_id change
    user = await user_repo.get_by_id(user_id)

    await log_action(
        db, action="user_updated_by_admin", request=req, user=current_user,
        entity_type="user", entity_id=user_id,
        detail=", ".join(data.model_dump(exclude_unset=True).keys()),
    )

    return _user_to_response(user)
