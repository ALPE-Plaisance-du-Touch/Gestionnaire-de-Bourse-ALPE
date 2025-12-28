"""Pydantic schemas for API validation."""

from app.schemas.auth import (
    ActivateAccountRequest,
    LoginRequest,
    LoginResponse,
    PasswordReset,
    PasswordResetRequest,
    RefreshTokenRequest,
    TokenResponse,
)
from app.schemas.common import ErrorResponse, MessageResponse, PaginatedResponse
from app.schemas.invitation import (
    BulkInvitationResult,
    InvitationCreate,
    InvitationResendResponse,
    InvitationResponse,
)
from app.schemas.user import (
    UserCreate,
    UserListResponse,
    UserResponse,
    UserSelfUpdate,
    UserUpdate,
)

__all__ = [
    # Auth
    "LoginRequest",
    "LoginResponse",
    "TokenResponse",
    "RefreshTokenRequest",
    "ActivateAccountRequest",
    "PasswordResetRequest",
    "PasswordReset",
    # User
    "UserCreate",
    "UserUpdate",
    "UserSelfUpdate",
    "UserResponse",
    "UserListResponse",
    # Invitation
    "InvitationCreate",
    "InvitationResponse",
    "InvitationResendResponse",
    "BulkInvitationResult",
    # Common
    "PaginatedResponse",
    "ErrorResponse",
    "MessageResponse",
]
