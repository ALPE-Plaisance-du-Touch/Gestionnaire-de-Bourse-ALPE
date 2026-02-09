"""Edition model for sale events."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.billetweb_import_log import BilletwebImportLog
    from app.models.deposit_slot import DepositSlot
    from app.models.edition_depositor import EditionDepositor
    from app.models.item_list import ItemList
    from app.models.sale import Sale
    from app.models.user import User


class EditionStatus(str, Enum):
    """Edition lifecycle status."""

    DRAFT = "draft"
    CONFIGURED = "configured"
    REGISTRATIONS_OPEN = "registrations_open"
    IN_PROGRESS = "in_progress"
    CLOSED = "closed"
    ARCHIVED = "archived"


class Edition(Base, UUIDMixin, TimestampMixin):
    """Edition model representing a sale event."""

    __tablename__ = "editions"

    # Basic info
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Status
    status: Mapped[str] = mapped_column(
        String(50),
        default=EditionStatus.DRAFT.value,
        nullable=False,
    )

    # Key dates
    start_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Declaration deadline (before deposit dates)
    declaration_deadline: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    # Deposit dates (when depositors bring their items)
    deposit_start_datetime: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    deposit_end_datetime: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    # Sale dates (when items are sold to public)
    sale_start_datetime: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    sale_end_datetime: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Retrieval dates (when depositors pick up unsold items)
    retrieval_start_datetime: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    retrieval_end_datetime: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    # Financial settings
    commission_rate: Mapped[Decimal | None] = mapped_column(
        Numeric(5, 4),  # Up to 99.99%
        default=Decimal("0.20"),  # 20% default
        nullable=True,
    )

    # Creator
    created_by_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )
    created_by: Mapped["User | None"] = relationship("User", foreign_keys=[created_by_id])

    # Closure tracking
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    closed_by_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
    )
    closed_by: Mapped["User | None"] = relationship("User", foreign_keys=[closed_by_id])
    archived_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    deposit_slots: Mapped[list["DepositSlot"]] = relationship(
        "DepositSlot", back_populates="edition", cascade="all, delete-orphan"
    )
    item_lists: Mapped[list["ItemList"]] = relationship(
        "ItemList", back_populates="edition", cascade="all, delete-orphan"
    )
    sales: Mapped[list["Sale"]] = relationship(
        "Sale", back_populates="edition", cascade="all, delete-orphan"
    )
    depositors: Mapped[list["EditionDepositor"]] = relationship(
        "EditionDepositor", back_populates="edition", cascade="all, delete-orphan"
    )
    billetweb_imports: Mapped[list["BilletwebImportLog"]] = relationship(
        "BilletwebImportLog", back_populates="edition", cascade="all, delete-orphan"
    )

    @property
    def is_draft(self) -> bool:
        """Check if edition is in draft status."""
        return self.status == EditionStatus.DRAFT.value

    @property
    def is_active(self) -> bool:
        """Check if edition is currently active (in progress)."""
        return self.status == EditionStatus.IN_PROGRESS.value

    @property
    def is_closed(self) -> bool:
        """Check if edition is closed."""
        return self.status in (
            EditionStatus.CLOSED.value,
            EditionStatus.ARCHIVED.value,
        )

    @property
    def can_accept_declarations(self) -> bool:
        """Check if edition can accept article declarations."""
        if self.status not in (
            EditionStatus.CONFIGURED.value,
            EditionStatus.REGISTRATIONS_OPEN.value,
        ):
            return False
        if self.declaration_deadline and datetime.utcnow() > self.declaration_deadline:
            return False
        return True
