"""Deposit slot schemas for API requests and responses."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class DepositSlotBase(BaseModel):
    """Base deposit slot schema with common fields."""

    start_datetime: datetime
    end_datetime: datetime
    max_capacity: int = Field(default=20, ge=1, le=200)
    reserved_for_locals: bool = False
    description: str | None = Field(None, max_length=255)

    @field_validator("end_datetime")
    @classmethod
    def end_must_be_after_start(cls, v: datetime, info) -> datetime:
        """Validate that end_datetime is after start_datetime."""
        if "start_datetime" in info.data and v <= info.data["start_datetime"]:
            raise ValueError("end_datetime must be after start_datetime")
        return v


class DepositSlotCreate(DepositSlotBase):
    """Schema for creating a new deposit slot."""

    pass


class DepositSlotUpdate(BaseModel):
    """Schema for updating a deposit slot."""

    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    max_capacity: int | None = Field(None, ge=1, le=200)
    reserved_for_locals: bool | None = None
    description: str | None = Field(None, max_length=255)


class DepositSlotResponse(BaseModel):
    """Response schema for deposit slot data."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    edition_id: str
    start_datetime: datetime
    end_datetime: datetime
    max_capacity: int
    reserved_for_locals: bool
    description: str | None = None
    registered_count: int = 0
    created_at: datetime


class DepositSlotListResponse(BaseModel):
    """Response schema for list of deposit slots."""

    items: list[DepositSlotResponse]
    total: int
