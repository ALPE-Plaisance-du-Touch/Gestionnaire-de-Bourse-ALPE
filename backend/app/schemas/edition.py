"""Edition schemas for API requests and responses."""

from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class EditionStatus(str, Enum):
    """Edition lifecycle status."""

    DRAFT = "draft"
    CONFIGURED = "configured"
    REGISTRATIONS_OPEN = "registrations_open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"
    ARCHIVED = "archived"


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
    """Schema for creating a new edition."""

    pass


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
    sale_start_datetime: datetime | None = None
    sale_end_datetime: datetime | None = None
    retrieval_start_datetime: datetime | None = None
    retrieval_end_datetime: datetime | None = None
    commission_rate: Decimal | None = Field(None, ge=0, le=1)


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
    sale_start_datetime: datetime | None = None
    sale_end_datetime: datetime | None = None
    retrieval_start_datetime: datetime | None = None
    retrieval_end_datetime: datetime | None = None
    commission_rate: Decimal | None = None

    # Metadata
    created_at: datetime
    created_by: CreatorResponse | None = None

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
