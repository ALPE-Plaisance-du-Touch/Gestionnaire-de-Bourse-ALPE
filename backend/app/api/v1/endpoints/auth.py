"""Authentication API endpoints."""

import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request, Response, status

from app.dependencies import AuthServiceDep, CurrentActiveUser, DBSession
from app.exceptions import (
    AuthenticationError,
    InvalidTokenError,
    TokenExpiredError,
)
from app.schemas import (
    ActivateAccountRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    PasswordReset,
    PasswordResetRequest,
    RefreshTokenRequest,
    TokenResponse,
    TokenValidationResponse,
    UserResponse,
)
from app.services.audit import log_action
from app.services.email import email_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="User login",
    description="Authenticate a user and return JWT tokens.",
)
async def login(
    request: LoginRequest,
    auth_service: AuthServiceDep,
    db: DBSession,
    req: Request,
):
    """Authenticate a user and return access/refresh tokens."""
    try:
        result = await auth_service.login(request)
        await log_action(db, action="login", request=req, detail=request.email)
        return result
    except AuthenticationError as e:
        await log_action(db, action="login_failed", request=req, detail=request.email, result="failure")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Get a new access token using a valid refresh token.",
)
async def refresh_token(
    request: RefreshTokenRequest,
    auth_service: AuthServiceDep,
):
    """Refresh access token using a valid refresh token."""
    try:
        return await auth_service.refresh_tokens(request.refresh_token)
    except (InvalidTokenError, TokenExpiredError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message,
            headers={"WWW-Authenticate": "Bearer"},
        )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Logout",
    description="Invalidate the current user's tokens.",
)
async def logout(
    current_user: CurrentActiveUser,
    db: DBSession,
    req: Request,
):
    """Logout the current user."""
    await log_action(db, action="logout", request=req, user=current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/validate-token/{token}",
    response_model=TokenValidationResponse,
    summary="Validate invitation token",
    description="Check if an invitation token is valid and return user info for pre-filling the form.",
)
async def validate_invitation_token(
    token: str,
    auth_service: AuthServiceDep,
):
    """Validate an invitation token before showing the activation form.

    Returns user info (email, name) if token is valid, or error details if not.
    This endpoint does NOT invalidate the token.
    """
    result = await auth_service.validate_invitation_token(token)
    return result


@router.post(
    "/activate",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Activate account",
    description="Activate a user account using an invitation token.",
)
async def activate_account(
    request: ActivateAccountRequest,
    auth_service: AuthServiceDep,
    db: DBSession,
    req: Request,
):
    """Activate a user account via invitation token."""
    try:
        user = await auth_service.activate_account(request)
        await log_action(db, action="account_activated", request=req, user=user, entity_type="user", entity_id=user.id)
        return UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            role=user.role.name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            is_local_resident=user.is_local_resident,
            created_at=user.created_at,
            last_login_at=user.last_login_at,
        )
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )
    except TokenExpiredError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the profile of the currently authenticated user.",
)
async def get_current_user_profile(
    current_user: CurrentActiveUser,
):
    """Get the current user's profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        role=current_user.role.name,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        is_local_resident=current_user.is_local_resident,
        created_at=current_user.created_at,
        last_login_at=current_user.last_login_at,
    )


@router.post(
    "/password/reset-request",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=MessageResponse,
    summary="Request password reset",
    description="Request a password reset email. Always returns success to prevent email enumeration.",
)
async def request_password_reset(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    auth_service: AuthServiceDep,
):
    """Request a password reset.

    Note: Always returns success to prevent email enumeration attacks.
    If the email exists, a reset token will be generated and sent via email.
    """
    result = await auth_service.request_password_reset(request.email)

    # Send email with reset link if user exists
    if result:
        token, first_name = result
        background_tasks.add_task(
            email_service.send_password_reset_email,
            to_email=request.email,
            token=token,
            first_name=first_name,
        )
        logger.info(f"Password reset email queued for {request.email}")

    return MessageResponse(
        message="If an account with this email exists, a password reset link has been sent."
    )


@router.post(
    "/password/reset",
    response_model=MessageResponse,
    summary="Reset password",
    description="Reset password using a valid reset token.",
)
async def reset_password(
    request: PasswordReset,
    auth_service: AuthServiceDep,
    db: DBSession,
    req: Request,
):
    """Reset password using a valid reset token."""
    try:
        await auth_service.reset_password(request.token, request.password)
        await log_action(db, action="password_reset", request=req)
        return MessageResponse(message="Password has been reset successfully.")
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )
    except TokenExpiredError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        )
