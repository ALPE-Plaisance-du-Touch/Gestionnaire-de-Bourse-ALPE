"""Audit logging service for tracking sensitive actions."""

import logging

from fastapi import Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import User
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)


async def log_action(
    db: AsyncSession,
    *,
    action: str,
    request: Request | None = None,
    user: User | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    detail: str | None = None,
    result: str = "success",
) -> None:
    """Log an auditable action.

    This function is designed to never raise, so it can safely be called
    from within request handlers without affecting the main operation.
    """
    try:
        entry = AuditLog(
            action=action,
            user_id=user.id if user else None,
            user_email=user.email if user else None,
            role=user.role.name if user and user.role else None,
            ip_address=_get_client_ip(request) if request else None,
            user_agent=request.headers.get("user-agent", "")[:512] if request else None,
            entity_type=entity_type,
            entity_id=entity_id,
            detail=detail,
            result=result,
        )
        db.add(entry)
        await db.flush()
    except Exception:
        logger.exception("Failed to write audit log")


async def list_audit_logs(
    db: AsyncSession,
    *,
    action: str | None = None,
    user_id: str | None = None,
    entity_type: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    page: int = 1,
    limit: int = 50,
) -> tuple[list[AuditLog], int]:
    """List audit logs with filtering and pagination."""
    query = select(AuditLog).options(joinedload(AuditLog.user))

    if action:
        query = query.where(AuditLog.action == action)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if entity_type:
        query = query.where(AuditLog.entity_type == entity_type)
    if date_from:
        query = query.where(AuditLog.timestamp >= date_from)
    if date_to:
        query = query.where(AuditLog.timestamp <= date_to)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    query = query.order_by(AuditLog.timestamp.desc())
    query = query.offset((page - 1) * limit).limit(limit)

    result = await db.execute(query)
    logs = list(result.scalars().all())

    return logs, total


def _get_client_ip(request: Request) -> str | None:
    """Extract client IP from request, respecting X-Forwarded-For."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None
