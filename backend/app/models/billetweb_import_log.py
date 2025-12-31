"""BilletwebImportLog model for import audit trail."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.edition import Edition
    from app.models.user import User


class BilletwebImportLog(Base, UUIDMixin, TimestampMixin):
    """Audit log for Billetweb imports.

    Tracks who imported, when, how many records, and the source file.
    """

    __tablename__ = "billetweb_import_logs"

    # Foreign keys
    edition_id: Mapped[str] = mapped_column(
        ForeignKey("editions.id", ondelete="CASCADE"),
        nullable=False,
    )
    imported_by_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # File info
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)

    # Import statistics
    total_rows: Mapped[int] = mapped_column(Integer, default=0)
    rows_imported: Mapped[int] = mapped_column(Integer, default=0)
    existing_depositors_linked: Mapped[int] = mapped_column(Integer, default=0)
    new_depositors_created: Mapped[int] = mapped_column(Integer, default=0)
    rows_skipped_invalid: Mapped[int] = mapped_column(Integer, default=0)
    rows_skipped_unpaid: Mapped[int] = mapped_column(Integer, default=0)
    rows_skipped_duplicate: Mapped[int] = mapped_column(Integer, default=0)
    rows_skipped_already_registered: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    import_started_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    import_completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Error details (JSON string for any errors encountered)
    errors_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    edition: Mapped["Edition"] = relationship("Edition", back_populates="billetweb_imports")
    imported_by: Mapped["User | None"] = relationship("User")
