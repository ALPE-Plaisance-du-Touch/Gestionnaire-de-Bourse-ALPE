"""Audit log endpoints for administrators."""

import math

from fastapi import APIRouter, Depends, Query

from app.dependencies import DBSession, require_role
from app.schemas.audit import AuditLogListResponse, AuditLogResponse
from app.services.audit import list_audit_logs

router = APIRouter()


@router.get(
    "",
    response_model=AuditLogListResponse,
    summary="List audit logs",
    description="List audit logs with optional filters. Admin only.",
)
async def get_audit_logs(
    db: DBSession,
    _current_user=Depends(require_role(["administrator"])),
    action: str | None = Query(None, description="Filter by action type"),
    user_id: str | None = Query(None, description="Filter by user ID"),
    entity_type: str | None = Query(None, description="Filter by entity type"),
    date_from: str | None = Query(None, description="Filter from date (ISO 8601)"),
    date_to: str | None = Query(None, description="Filter to date (ISO 8601)"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
):
    """List audit logs with filtering and pagination."""
    logs, total = await list_audit_logs(
        db,
        action=action,
        user_id=user_id,
        entity_type=entity_type,
        date_from=date_from,
        date_to=date_to,
        page=page,
        limit=limit,
    )
    return AuditLogListResponse(
        items=[
            AuditLogResponse(
                id=log.id,
                timestamp=log.timestamp,
                user_id=log.user_id,
                user_email=log.user_email,
                role=log.role,
                ip_address=log.ip_address,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                detail=log.detail,
                result=log.result,
            )
            for log in logs
        ],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 0,
    )
