"""ItemList model for depositor lists."""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.article import Article
    from app.models.edition import Edition
    from app.models.user import User


class ListType(str, Enum):
    """Type of list (affects pricing and slots)."""

    STANDARD = "standard"  # Regular depositors (100-600 range)
    LIST_1000 = "list_1000"  # ALPE members (white labels, 1€/list)
    LIST_2000 = "list_2000"  # Family/friends of members (pink labels, 5€/2 lists)


class ListStatus(str, Enum):
    """List lifecycle status."""

    DRAFT = "draft"
    VALIDATED = "validated"
    CHECKED_IN = "checked_in"  # Depositor brought items
    RETRIEVED = "retrieved"  # Depositor picked up unsold items
    PAYOUT_PENDING = "payout_pending"
    PAYOUT_COMPLETED = "payout_completed"


# Label colors by list number range
LABEL_COLORS = {
    100: "sky_blue",
    200: "yellow",
    300: "fuchsia",
    400: "lilac",
    500: "mint_green",
    600: "orange",
    1000: "white",
    2000: "pink",
}


class ItemList(Base, UUIDMixin, TimestampMixin):
    """ItemList model representing a depositor's list of articles."""

    __tablename__ = "item_lists"

    # List identification
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    list_type: Mapped[str] = mapped_column(
        String(20),
        default=ListType.STANDARD.value,
        nullable=False,
    )
    label_color: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Status
    status: Mapped[str] = mapped_column(
        String(50),
        default=ListStatus.DRAFT.value,
        nullable=False,
    )

    # Check-in/retrieval tracking
    checked_in_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    retrieved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Validation
    is_validated: Mapped[bool] = mapped_column(Boolean, default=False)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Labels printed flag
    labels_printed: Mapped[bool] = mapped_column(Boolean, default=False)
    labels_printed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Foreign keys
    edition_id: Mapped[str] = mapped_column(
        ForeignKey("editions.id", ondelete="CASCADE"),
        nullable=False,
    )
    depositor_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationships
    edition: Mapped["Edition"] = relationship("Edition", back_populates="item_lists")
    depositor: Mapped["User"] = relationship("User", back_populates="item_lists")
    articles: Mapped[list["Article"]] = relationship(
        "Article", back_populates="item_list", cascade="all, delete-orphan"
    )

    @property
    def article_count(self) -> int:
        """Get total number of articles in the list."""
        return len(self.articles)

    @property
    def clothing_count(self) -> int:
        """Get number of clothing articles."""
        return sum(1 for a in self.articles if a.is_clothing)

    @property
    def is_list_1000(self) -> bool:
        """Check if this is a Liste 1000 (ALPE member)."""
        return self.list_type == ListType.LIST_1000.value

    @property
    def is_list_2000(self) -> bool:
        """Check if this is a Liste 2000 (family/friends)."""
        return self.list_type == ListType.LIST_2000.value

    def get_label_color_for_number(self) -> str | None:
        """Get the label color based on list number range."""
        if self.list_type == ListType.LIST_1000.value:
            return LABEL_COLORS[1000]
        if self.list_type == ListType.LIST_2000.value:
            return LABEL_COLORS[2000]
        # Standard lists: determine by number range
        for threshold in sorted(LABEL_COLORS.keys(), reverse=True):
            if threshold < 1000 and self.number >= threshold:
                return LABEL_COLORS[threshold]
        return None
