"""Invitation schemas for API requests and responses."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class InvitationCreate(BaseModel):
    """Schema for creating a single invitation."""

    email: EmailStr
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    list_type: str = Field(
        default="standard",
        pattern="^(standard|list_1000|list_2000)$",
    )


class InvitationResponse(BaseModel):
    """Response schema for invitation data."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    status: str
    created_at: datetime
    expires_at: datetime
    used_at: datetime | None = None


class BulkInvitationResult(BaseModel):
    """Response schema for bulk invitation creation."""

    total: int
    created: int
    duplicates: int
    errors: list[dict]


class InvitationResendResponse(BaseModel):
    """Response schema for invitation resend."""

    id: str
    email: EmailStr
    status: str
    expires_at: datetime
    message: str = "Invitation resent successfully"
