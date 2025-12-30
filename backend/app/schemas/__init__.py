"""Pydantic schemas for API validation."""

from app.schemas.auth import (
    ActivateAccountRequest,
    LoginRequest,
    LoginResponse,
    PasswordReset,
    PasswordResetRequest,
    RefreshTokenRequest,
    TokenResponse,
    TokenValidationResponse,
)
from app.schemas.common import ErrorResponse, MessageResponse, PaginatedResponse
from app.schemas.deposit_slot import (
    DepositSlotCreate,
    DepositSlotListResponse,
    DepositSlotResponse,
    DepositSlotUpdate,
)
from app.schemas.edition import (
    EditionCreate,
    EditionListResponse,
    EditionResponse,
    EditionStatus,
    EditionStatusUpdate,
    EditionUpdate,
)
from app.schemas.invitation import (
    BulkDeleteRequest,
    BulkDeleteResult,
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
    "TokenValidationResponse",
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
    # Deposit Slot
    "DepositSlotCreate",
    "DepositSlotUpdate",
    "DepositSlotResponse",
    "DepositSlotListResponse",
    # Edition
    "EditionCreate",
    "EditionUpdate",
    "EditionStatusUpdate",
    "EditionResponse",
    "EditionListResponse",
    "EditionStatus",
    # Invitation
    "InvitationCreate",
    "InvitationResponse",
    "InvitationResendResponse",
    "BulkInvitationResult",
    "BulkDeleteRequest",
    "BulkDeleteResult",
    # Common
    "PaginatedResponse",
    "ErrorResponse",
    "MessageResponse",
]
