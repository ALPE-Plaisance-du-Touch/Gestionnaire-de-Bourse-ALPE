"""Deposit slot model for deposit time slots."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

# Forward reference for type checking
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.edition import Edition
    from app.models.edition_depositor import EditionDepositor


class DepositSlot(Base, UUIDMixin, TimestampMixin):
    """Deposit slot model representing a time slot for depositors to bring items."""

    __tablename__ = "deposit_slots"

    # Edition reference
    edition_id: Mapped[str] = mapped_column(
        ForeignKey("editions.id", ondelete="CASCADE"),
        nullable=False,
    )
    edition: Mapped["Edition"] = relationship("Edition", back_populates="deposit_slots")

    # Slot timing
    start_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Capacity
    max_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=20)

    # Reserved for local residents (Plaisance-du-Touch)
    reserved_for_locals: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False
    )

    # Optional description
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    registered_depositors: Mapped[list["EditionDepositor"]] = relationship(
        "EditionDepositor", back_populates="deposit_slot"
    )

    @property
    def duration_minutes(self) -> int:
        """Calculate slot duration in minutes."""
        delta = self.end_datetime - self.start_datetime
        return int(delta.total_seconds() / 60)

    @property
    def is_past(self) -> bool:
        """Check if slot has already passed."""
        return datetime.utcnow() > self.end_datetime

    def __repr__(self) -> str:
        return f"<DepositSlot {self.start_datetime.strftime('%Y-%m-%d %H:%M')} - {self.max_capacity} places>"
