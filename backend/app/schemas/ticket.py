"""Pydantic schemas for ticket messaging."""

from datetime import datetime

from pydantic import BaseModel, Field


class CreateTicketRequest(BaseModel):
    subject: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)
    assigned_to_id: str | None = None


class CreateMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class TicketMessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    content: str
    is_read: bool
    created_at: datetime


class TicketResponse(BaseModel):
    id: str
    edition_id: str
    subject: str
    status: str
    created_by_id: str
    created_by_name: str
    assigned_to_id: str | None = None
    assigned_to_name: str | None = None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None = None
    last_message_at: datetime | None = None
    unread_count: int = 0


class TicketDetailResponse(TicketResponse):
    messages: list[TicketMessageResponse]


class TicketListResponse(BaseModel):
    tickets: list[TicketResponse]
    total: int


class UnreadCountResponse(BaseModel):
    unread_count: int
