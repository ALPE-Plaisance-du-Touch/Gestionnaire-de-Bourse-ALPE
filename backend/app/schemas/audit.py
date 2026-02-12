"""Audit log schemas for API responses."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditLogResponse(BaseModel):
    """Response schema for a single audit log entry."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    user_id: str | None = None
    user_email: str | None = None
    role: str | None = None
    ip_address: str | None = None
    action: str
    entity_type: str | None = None
    entity_id: str | None = None
    detail: str | None = None
    result: str


class AuditLogListResponse(BaseModel):
    """Paginated list of audit logs."""

    items: list[AuditLogResponse]
    total: int
    page: int
    limit: int
    pages: int
