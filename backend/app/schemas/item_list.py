"""ItemList schemas for API requests and responses."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class ListType(str, Enum):
    """Type of list (affects pricing and label color)."""

    STANDARD = "standard"
    LIST_1000 = "list_1000"
    LIST_2000 = "list_2000"


class ListStatus(str, Enum):
    """List lifecycle status."""

    DRAFT = "draft"
    VALIDATED = "validated"
    CHECKED_IN = "checked_in"
    RETRIEVED = "retrieved"
    PAYOUT_PENDING = "payout_pending"
    PAYOUT_COMPLETED = "payout_completed"


class ItemListCreate(BaseModel):
    """Schema for creating a new item list."""

    list_type: ListType = Field(default=ListType.STANDARD)


class ItemListUpdate(BaseModel):
    """Schema for updating an item list."""

    # Only status can be updated directly (other transitions are automatic)
    pass


class ItemListValidateRequest(BaseModel):
    """Schema for validating a list (final confirmation)."""

    confirmation_accepted: bool = Field(
        ...,
        description="User confirms they accept deposit conditions",
    )


class DepositorInfo(BaseModel):
    """Depositor information for list response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    first_name: str
    last_name: str


class ItemListResponse(BaseModel):
    """Response schema for item list data."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    number: int
    list_type: str
    label_color: str | None = None
    status: str
    is_validated: bool
    validated_at: datetime | None = None
    checked_in_at: datetime | None = None
    retrieved_at: datetime | None = None
    labels_printed: bool
    labels_printed_at: datetime | None = None

    # Computed fields (will be set from model properties)
    article_count: int = 0
    clothing_count: int = 0

    # Relations
    edition_id: str
    depositor_id: str

    # Metadata
    created_at: datetime


class ItemListWithDepositorResponse(ItemListResponse):
    """Item list response with depositor information."""

    depositor: DepositorInfo | None = None
    total_value: float = 0.0


class ItemListDetailResponse(ItemListResponse):
    """Item list response with articles included."""

    # Note: ArticleResponse is imported at runtime to avoid circular imports
    # The actual type is defined in article.py
    articles: list = []


class ItemListSummary(BaseModel):
    """Summary of a list for depositor dashboard."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    number: int
    list_type: str
    status: str
    article_count: int = 0
    clothing_count: int = 0
    total_value: float = 0.0
    is_validated: bool
    validated_at: datetime | None = None
    created_at: datetime


class DepositorListsResponse(BaseModel):
    """Response for depositor's lists for an edition."""

    lists: list[ItemListSummary]
    total_lists: int
    max_lists: int = 2
    can_create_more: bool


class ItemListListResponse(BaseModel):
    """Response schema for paginated item list."""

    items: list[ItemListWithDepositorResponse]
    total: int
    page: int
    limit: int
    pages: int


class DeclarationsSummaryResponse(BaseModel):
    """Summary of declaration progress for an edition."""

    total_depositors: int
    depositors_with_lists: int
    total_lists: int
    draft_lists: int
    validated_lists: int
    total_articles: int
    total_value: float
    # Per-depositor status counts
    depositors_none: int = 0
    depositors_started: int = 0
    depositors_partial: int = 0
    depositors_complete: int = 0


class DepositorDeclarationInfo(BaseModel):
    """A depositor with their declaration progress."""

    id: str
    user_id: str
    email: str
    first_name: str
    last_name: str
    list_type: str
    lists_count: int
    draft_count: int
    validated_count: int
    total_articles: int
    total_value: float
    declaration_status: str


class DepositorDeclarationsListResponse(BaseModel):
    """Paginated list of depositors with declaration info."""

    items: list[DepositorDeclarationInfo]
    total: int
    page: int
    limit: int
    pages: int
    count_none: int
    count_started: int
    count_partial: int
    count_complete: int


class DeclarationReminderRequest(BaseModel):
    """Request body for sending declaration reminders."""

    depositor_ids: list[str] = Field(default_factory=list)


class DeclarationReminderResponse(BaseModel):
    """Response for the reminder endpoint."""

    emails_queued: int
    message: str
