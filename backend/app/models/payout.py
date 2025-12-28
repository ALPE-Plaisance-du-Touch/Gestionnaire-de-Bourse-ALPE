"""Payout model for depositor reimbursements."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.item_list import ItemList
    from app.models.user import User


class PayoutStatus(str, Enum):
    """Payout status."""

    PENDING = "pending"
    READY = "ready"
    PAID = "paid"
    CANCELLED = "cancelled"


class PayoutMethod(str, Enum):
    """Payout methods."""

    CASH = "cash"
    CHECK = "check"
    TRANSFER = "transfer"


class Payout(Base, UUIDMixin, TimestampMixin):
    """Payout model for depositor reimbursements."""

    __tablename__ = "payouts"

    # Financial breakdown
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    commission_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    list_fees: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        default=Decimal("0.00"),
        nullable=False,
    )
    net_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Sales statistics
    total_articles: Mapped[int] = mapped_column(default=0)
    sold_articles: Mapped[int] = mapped_column(default=0)
    unsold_articles: Mapped[int] = mapped_column(default=0)

    # Status
    status: Mapped[str] = mapped_column(
        String(20),
        default=PayoutStatus.PENDING.value,
        nullable=False,
    )

    # Payment details
    payment_method: Mapped[str | None] = mapped_column(String(20), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    payment_reference: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Foreign keys
    item_list_id: Mapped[str] = mapped_column(
        ForeignKey("item_lists.id", ondelete="CASCADE"),
        nullable=False,
    )
    depositor_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    processed_by_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    item_list: Mapped["ItemList"] = relationship("ItemList", foreign_keys=[item_list_id])
    depositor: Mapped["User"] = relationship("User", foreign_keys=[depositor_id])
    processed_by: Mapped["User | None"] = relationship(
        "User", foreign_keys=[processed_by_id]
    )
