"""Authentication API endpoints."""

from fastapi import APIRouter, HTTPException, Response, status

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
    UserResponse,
)

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
):
    """Authenticate a user and return access/refresh tokens."""
    try:
        return await auth_service.login(request)
    except AuthenticationError as e:
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
):
    """Logout the current user.

    Note: With stateless JWT, we cannot truly invalidate tokens server-side
    without additional infrastructure (token blacklist). The client should
    discard the tokens. For enhanced security, consider implementing a
    token blacklist or using shorter token expiration times.
    """
    # In a production system, you might want to:
    # 1. Add the token to a blacklist (Redis)
    # 2. Clear the refresh token from the database
    return Response(status_code=status.HTTP_204_NO_CONTENT)


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
):
    """Activate a user account via invitation token."""
    try:
        user = await auth_service.activate_account(request)
        return UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            role=user.role.name,
            is_active=user.is_active,
            is_verified=user.is_verified,
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
    auth_service: AuthServiceDep,
):
    """Request a password reset.

    Note: Always returns success to prevent email enumeration attacks.
    If the email exists, a reset token will be generated and should be
    sent via email.
    """
    token = await auth_service.request_password_reset(request.email)

    # TODO: Send email with reset link if token is not None
    # if token:
    #     await email_service.send_password_reset_email(request.email, token)

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
):
    """Reset password using a valid reset token."""
    try:
        await auth_service.reset_password(request.token, request.password)
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
