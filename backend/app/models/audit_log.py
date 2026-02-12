"""AuditLog model for tracking sensitive actions."""

from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class AuditAction(str, Enum):
    """Auditable action types."""

    # Auth
    LOGIN = "login"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    PASSWORD_RESET = "password_reset"
    ACCOUNT_ACTIVATED = "account_activated"

    # User/GDPR
    PROFILE_UPDATED = "profile_updated"
    DATA_EXPORTED = "data_exported"
    ACCOUNT_DELETED = "account_deleted"

    # Edition
    EDITION_CREATED = "edition_created"
    EDITION_UPDATED = "edition_updated"
    EDITION_CLOSED = "edition_closed"
    EDITION_ARCHIVED = "edition_archived"

    # Invitation
    INVITATION_SENT = "invitation_sent"
    INVITATION_BULK = "invitation_bulk"

    # Sales
    SALE_REGISTERED = "sale_registered"
    SALE_CANCELLED = "sale_cancelled"
    SALES_SYNCED = "sales_synced"

    # Payout
    PAYOUT_CALCULATED = "payout_calculated"
    PAYOUT_PAID = "payout_paid"


class AuditLog(Base):
    """Audit log entry for tracking sensitive actions."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False, index=True
    )

    # Who
    user_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    user_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # From where
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # What
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    detail: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Result
    result: Mapped[str] = mapped_column(String(20), default="success", nullable=False)

    # Relationship
    user = relationship("User", foreign_keys=[user_id])
