"""Edition schemas for API requests and responses."""

from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class RegistrationMode(str, Enum):
    """Source of depositor registrations for an edition."""

    MANUAL = "manual"
    BILLETWEB_CSV = "billetweb_csv"
    BILLETWEB_API = "billetweb_api"


class EditionStatus(str, Enum):
    """Edition lifecycle status."""

    DRAFT = "draft"
    REGISTRATIONS_OPEN = "registrations_open"
    DEPOSIT = "deposit"
    SALE = "sale"
    SETTLEMENT = "settlement"
    CLOSED = "closed"
    ARCHIVED = "archived"


def _validate_module_dependencies(obj) -> "EditionCreate":
    """Enforce module dependencies: payouts and sales sub-settings require sales.

    Only validates fields that are set (not None), so it is safe for partial
    updates where a field left at None means "unchanged".
    """
    sales = getattr(obj, "sales_enabled", None)
    if sales is False:
        for dependent in (
            "payouts_enabled",
            "offline_sales_enabled",
            "private_school_sale_enabled",
        ):
            if getattr(obj, dependent, None) is True:
                raise ValueError(
                    f"{dependent} nécessite que la vente (sales_enabled) soit activée"
                )
    return obj


class EditionBase(BaseModel):
    """Base edition schema with common fields."""

    name: str = Field(..., min_length=1, max_length=100)
    start_datetime: datetime
    end_datetime: datetime
    location: str | None = Field(None, max_length=255)
    description: str | None = None

    @field_validator("end_datetime")
    @classmethod
    def end_must_be_after_start(cls, v: datetime, info) -> datetime:
        """Validate that end_datetime is after start_datetime."""
        if "start_datetime" in info.data and v <= info.data["start_datetime"]:
            raise ValueError("end_datetime must be after start_datetime")
        return v


class EditionCreate(EditionBase):
    """Schema for creating a new edition.

    Feature modules default to a minimal "adoption" preset (#66):
    only deposit review and label generation are on; everything else is off.
    """

    billetweb_event_id: str | None = None
    is_training: bool = False

    # Feature modules — minimal adoption preset at creation
    labels_enabled: bool = True
    deposit_review_enabled: bool = True
    sales_enabled: bool = False
    payouts_enabled: bool = False
    deposit_slots_enabled: bool = False
    tickets_enabled: bool = False
    special_lists_enabled: bool = False
    offline_sales_enabled: bool = False
    private_school_sale_enabled: bool = False
    registration_mode: RegistrationMode = RegistrationMode.MANUAL

    @model_validator(mode="after")
    def validate_module_dependencies(self) -> "EditionCreate":
        return _validate_module_dependencies(self)


class EditionUpdate(BaseModel):
    """Schema for updating an edition."""

    name: str | None = Field(None, min_length=1, max_length=100)
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    location: str | None = Field(None, max_length=255)
    description: str | None = None

    # Configuration fields (US-007)
    declaration_deadline: datetime | None = None
    deposit_start_datetime: datetime | None = None
    deposit_end_datetime: datetime | None = None
    retrieval_start_datetime: datetime | None = None
    retrieval_end_datetime: datetime | None = None
    commission_rate: Decimal | None = Field(None, ge=0, le=1)

    # Training mode toggle
    is_training: bool | None = None

    # Feature modules toggles (#66)
    labels_enabled: bool | None = None
    deposit_review_enabled: bool | None = None
    sales_enabled: bool | None = None
    payouts_enabled: bool | None = None
    deposit_slots_enabled: bool | None = None
    tickets_enabled: bool | None = None
    special_lists_enabled: bool | None = None
    offline_sales_enabled: bool | None = None
    private_school_sale_enabled: bool | None = None
    registration_mode: RegistrationMode | None = None

    @model_validator(mode="after")
    def validate_module_dependencies(self) -> "EditionUpdate":
        return _validate_module_dependencies(self)


class EditionStatusUpdate(BaseModel):
    """Schema for updating edition status."""

    status: EditionStatus


class CreatorResponse(BaseModel):
    """Minimal user info for creator reference."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    first_name: str
    last_name: str
    email: str


class EditionResponse(BaseModel):
    """Response schema for edition data."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str | None = None
    location: str | None = None
    status: str
    start_datetime: datetime
    end_datetime: datetime

    # Configuration fields (nullable until US-007)
    declaration_deadline: datetime | None = None
    deposit_start_datetime: datetime | None = None
    deposit_end_datetime: datetime | None = None
    retrieval_start_datetime: datetime | None = None
    retrieval_end_datetime: datetime | None = None
    commission_rate: Decimal | None = None

    # Metadata
    created_at: datetime
    created_by: CreatorResponse | None = None

    # Billetweb API integration
    billetweb_event_id: str | None = None
    last_billetweb_sync: datetime | None = None

    # Training mode (US-015)
    is_training: bool = False

    # Feature modules toggles (#66)
    labels_enabled: bool = True
    deposit_review_enabled: bool = True
    sales_enabled: bool = True
    payouts_enabled: bool = True
    deposit_slots_enabled: bool = True
    tickets_enabled: bool = True
    special_lists_enabled: bool = True
    offline_sales_enabled: bool = True
    private_school_sale_enabled: bool = True
    registration_mode: str = "manual"

    # Closure tracking
    closed_at: datetime | None = None
    closed_by: CreatorResponse | None = None
    archived_at: datetime | None = None


class ClosureCheckItem(BaseModel):
    """Single prerequisite check result."""

    label: str
    passed: bool
    detail: str | None = None


class ClosureCheckResponse(BaseModel):
    """Response for edition closure prerequisite check."""

    can_close: bool
    checks: list[ClosureCheckItem]


class EditionListResponse(BaseModel):
    """Response schema for paginated edition list."""

    items: list[EditionResponse]
    total: int
    page: int
    limit: int
    pages: int


class ActiveEditionResponse(BaseModel):
    """Response for the public active edition endpoint."""

    active_edition: EditionResponse | None = None
    training_edition: EditionResponse | None = None
