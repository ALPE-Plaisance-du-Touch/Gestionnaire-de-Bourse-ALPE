"""Schemas for Billetweb API integration."""

from pydantic import BaseModel, Field


class BilletwebCredentialsRequest(BaseModel):
    """Request to save Billetweb API credentials."""

    user: str = Field(..., min_length=1, description="Billetweb API user identifier")
    api_key: str = Field(..., min_length=1, description="Billetweb API key")


class BilletwebCredentialsResponse(BaseModel):
    """Response showing Billetweb API configuration status."""

    configured: bool
    user: str | None = None
    api_key_masked: str | None = None


class BilletwebConnectionTestResponse(BaseModel):
    """Response from testing Billetweb API connection."""

    success: bool
    message: str


class BilletwebEventInfo(BaseModel):
    """Info about a Billetweb event."""

    id: str
    name: str
    start: str
    end: str
    location: str


class BilletwebEventsListResponse(BaseModel):
    """Response listing Billetweb events."""

    events: list[BilletwebEventInfo]


class BilletwebSessionPreview(BaseModel):
    """Preview of a Billetweb session/date."""

    session_id: str
    name: str
    start: str
    end: str
    capacity: int
    sold: int
    already_synced: bool


class BilletwebSessionsPreviewResponse(BaseModel):
    """Response for sessions preview."""

    total_sessions: int
    new_sessions: int
    sessions: list[BilletwebSessionPreview]


class BilletwebSessionsSyncResult(BaseModel):
    """Result of sessions sync."""

    created: int
    updated: int
    total: int


class BilletwebAttendeesSyncRequest(BaseModel):
    """Options for attendees sync."""

    send_emails: bool = Field(default=True, description="Send invitation/notification emails")
    ignore_errors: bool = Field(default=False, description="Skip rows with errors")


class BilletwebAttendeesSyncResult(BaseModel):
    """Result of attendees sync."""

    existing_linked: int
    new_created: int
    already_registered: int
    invitations_sent: int
    notifications_sent: int
