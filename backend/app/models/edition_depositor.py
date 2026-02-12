"""EditionDepositor model for depositor-edition association."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.item_list import ListType

if TYPE_CHECKING:
    from app.models.deposit_slot import DepositSlot
    from app.models.edition import Edition
    from app.models.user import User


class EditionDepositor(Base, UUIDMixin, TimestampMixin):
    """Association between a depositor and an edition.

    This model tracks which depositors are registered for which editions,
    including their assigned deposit slot and list type.
    """

    __tablename__ = "edition_depositors"

    # Foreign keys
    edition_id: Mapped[str] = mapped_column(
        ForeignKey("editions.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    deposit_slot_id: Mapped[str | None] = mapped_column(
        ForeignKey("deposit_slots.id", ondelete="SET NULL"),
        nullable=True,
    )

    # List type assigned (from Billetweb tarif or manual assignment)
    list_type: Mapped[str] = mapped_column(
        String(20),
        default=ListType.STANDARD.value,
        nullable=False,
    )

    # Billetweb import reference (for traceability)
    billetweb_order_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)
    billetweb_session: Mapped[str | None] = mapped_column(String(255), nullable=True)
    billetweb_tarif: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Import metadata
    imported_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    import_log_id: Mapped[str | None] = mapped_column(
        ForeignKey("billetweb_import_logs.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Additional info from Billetweb
    postal_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    edition: Mapped["Edition"] = relationship("Edition", back_populates="depositors")
    user: Mapped["User"] = relationship("User", back_populates="edition_registrations")
    deposit_slot: Mapped["DepositSlot | None"] = relationship(
        "DepositSlot", back_populates="registered_depositors"
    )

    @property
    def is_local_resident(self) -> bool:
        """Check if depositor is from Plaisance-du-Touch (31830)."""
        return self.postal_code == "31830"

    @property
    def is_list_1000(self) -> bool:
        """Check if assigned to Liste 1000."""
        return self.list_type == ListType.LIST_1000.value

    @property
    def is_list_2000(self) -> bool:
        """Check if assigned to Liste 2000."""
        return self.list_type == ListType.LIST_2000.value

    @property
    def is_from_billetweb(self) -> bool:
        """Check if this registration came from Billetweb import."""
        return self.billetweb_order_ref is not None
