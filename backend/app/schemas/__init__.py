"""Pydantic schemas for API validation."""

from app.schemas.article import (
    ArticleCategory,
    ArticleCreate,
    ArticleGender,
    ArticleListResponse,
    ArticleResponse,
    ArticleStatus,
    ArticleSummary,
    ArticleUpdate,
    CategoryConstraintsResponse,
    CategoryInfo,
    PriceHint,
    PriceHintsResponse,
)
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
from app.schemas.billetweb import (
    BilletwebImportLogResponse,
    BilletwebImportOptions,
    BilletwebImportResponse,
    BilletwebImportResult,
    BilletwebPreviewResponse,
    BilletwebPreviewStats,
    BilletwebRowError,
    EditionDepositorResponse,
    EditionDepositorsListResponse,
    EditionDepositorWithUserResponse,
)
from app.schemas.common import ErrorResponse, MessageResponse, PaginatedResponse
from app.schemas.deposit_slot import (
    DepositSlotCreate,
    DepositSlotListResponse,
    DepositSlotResponse,
    DepositSlotUpdate,
)
from app.schemas.edition import (
    ActiveEditionResponse,
    ClosureCheckItem,
    ClosureCheckResponse,
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
from app.schemas.label import (
    LabelGenerationMode,
    LabelGenerationRequest,
    LabelStatsResponse,
)
from app.schemas.sale import (
    CancelSaleRequest,
    RegisterSaleRequest,
    SaleResponse,
    SaleStatsResponse,
    ScanArticleResponse,
    ScanRequest,
    TopDepositorStats,
)
from app.schemas.payout import (
    CalculatePayoutsResponse,
    CategoryStats,
    PayoutDashboardResponse,
    PayoutResponse,
    PayoutStatsResponse,
    PriceRangeStats,
    RecordPaymentRequest,
    UpdatePayoutNotesRequest,
)
from app.schemas.invitation_stats import (
    InvitationByListType,
    InvitationDailyStats,
    InvitationStatsResponse,
)
from app.schemas.item_list import (
    DepositorListsResponse,
    ItemListCreate,
    ItemListDetailResponse,
    ItemListListResponse,
    ItemListResponse,
    ItemListSummary,
    ItemListUpdate,
    ItemListValidateRequest,
    ItemListWithDepositorResponse,
    ListStatus,
    ListType,
)
from app.schemas.user import (
    UserCreate,
    UserListResponse,
    UserResponse,
    UserSelfUpdate,
    UserUpdate,
)
from app.schemas.audit import (
    AuditLogListResponse,
    AuditLogResponse,
)

__all__ = [
    # Article
    "ArticleCategory",
    "ArticleCreate",
    "ArticleGender",
    "ArticleListResponse",
    "ArticleResponse",
    "ArticleStatus",
    "ArticleSummary",
    "ArticleUpdate",
    "CategoryConstraintsResponse",
    "CategoryInfo",
    "PriceHint",
    "PriceHintsResponse",
    # Auth
    "LoginRequest",
    "LoginResponse",
    "TokenResponse",
    "TokenValidationResponse",
    "RefreshTokenRequest",
    "ActivateAccountRequest",
    "PasswordResetRequest",
    "PasswordReset",
    # Billetweb
    "BilletwebImportOptions",
    "BilletwebImportResponse",
    "BilletwebImportResult",
    "BilletwebImportLogResponse",
    "BilletwebPreviewResponse",
    "BilletwebPreviewStats",
    "BilletwebRowError",
    "EditionDepositorResponse",
    "EditionDepositorWithUserResponse",
    "EditionDepositorsListResponse",
    # Common
    "PaginatedResponse",
    "ErrorResponse",
    "MessageResponse",
    # Deposit Slot
    "DepositSlotCreate",
    "DepositSlotUpdate",
    "DepositSlotResponse",
    "DepositSlotListResponse",
    # Edition
    "ActiveEditionResponse",
    "ClosureCheckItem",
    "ClosureCheckResponse",
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
    # Label
    "LabelGenerationMode",
    "LabelGenerationRequest",
    "LabelStatsResponse",
    # Sale
    "CancelSaleRequest",
    "RegisterSaleRequest",
    "SaleResponse",
    "SaleStatsResponse",
    "ScanArticleResponse",
    "ScanRequest",
    "TopDepositorStats",
    # Payout
    "CalculatePayoutsResponse",
    "CategoryStats",
    "PayoutDashboardResponse",
    "PayoutResponse",
    "PayoutStatsResponse",
    "PriceRangeStats",
    "RecordPaymentRequest",
    "UpdatePayoutNotesRequest",
    # Invitation Stats
    "InvitationByListType",
    "InvitationDailyStats",
    "InvitationStatsResponse",
    # ItemList
    "DepositorListsResponse",
    "ItemListCreate",
    "ItemListDetailResponse",
    "ItemListListResponse",
    "ItemListResponse",
    "ItemListSummary",
    "ItemListUpdate",
    "ItemListValidateRequest",
    "ItemListWithDepositorResponse",
    "ListStatus",
    "ListType",
    # User
    "UserCreate",
    "UserUpdate",
    "UserSelfUpdate",
    "UserResponse",
    "UserListResponse",
    # Audit
    "AuditLogResponse",
    "AuditLogListResponse",
]
