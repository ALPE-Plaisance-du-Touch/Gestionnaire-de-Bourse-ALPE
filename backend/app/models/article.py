"""Article model for items in a list."""

from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.item_list import ItemList
    from app.models.sale import Sale


class ArticleCategory(str, Enum):
    """Article categories."""

    CLOTHING = "clothing"
    SHOES = "shoes"
    ACCESSORIES = "accessories"
    TOYS = "toys"
    GAMES = "games"
    BOOKS = "books"
    NURSERY = "nursery"
    STROLLER = "stroller"
    CAR_SEAT = "car_seat"
    OTHER = "other"


class ArticleStatus(str, Enum):
    """Article lifecycle status."""

    DRAFT = "draft"
    VALIDATED = "validated"
    ON_SALE = "on_sale"
    SOLD = "sold"
    UNSOLD = "unsold"
    RETRIEVED = "retrieved"
    DONATED = "donated"


# Categories that count as clothing (max 12 per list)
CLOTHING_CATEGORIES = {
    ArticleCategory.CLOTHING.value,
    ArticleCategory.SHOES.value,
    ArticleCategory.ACCESSORIES.value,
}

# Maximum prices by category (from regulations)
MAX_PRICES = {
    ArticleCategory.STROLLER.value: Decimal("150.00"),
    "default": Decimal("100.00"),
}


class Article(Base, UUIDMixin, TimestampMixin):
    """Article model representing an item for sale."""

    __tablename__ = "articles"

    # Basic info (description limited to 100 chars to fit on labels)
    description: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    subcategory: Mapped[str | None] = mapped_column(String(50), nullable=True)
    size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    brand: Mapped[str | None] = mapped_column(String(100), nullable=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Pricing
    price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    # Line number (position in list, 1-24)
    line_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Lot handling (for grouped items like socks, bibs)
    is_lot: Mapped[bool] = mapped_column(Boolean, default=False)
    lot_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(
        String(50),
        default=ArticleStatus.DRAFT.value,
        nullable=False,
    )

    # Conformity certification by depositor
    conformity_certified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Notes (internal, for volunteers)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Barcode (generated from list number + line number)
    barcode: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)

    # Foreign key
    item_list_id: Mapped[str] = mapped_column(
        ForeignKey("item_lists.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Relationships
    item_list: Mapped["ItemList"] = relationship("ItemList", back_populates="articles")
    sale: Mapped["Sale | None"] = relationship("Sale", back_populates="article", uselist=False)

    @property
    def is_clothing(self) -> bool:
        """Check if article is in a clothing category."""
        return self.category in CLOTHING_CATEGORIES

    @property
    def is_sold(self) -> bool:
        """Check if article has been sold."""
        return self.status == ArticleStatus.SOLD.value

    @property
    def is_available(self) -> bool:
        """Check if article is available for sale."""
        return self.status == ArticleStatus.ON_SALE.value

    @property
    def max_price(self) -> Decimal:
        """Get maximum allowed price for this article's category."""
        return MAX_PRICES.get(self.category, MAX_PRICES["default"])

    def generate_barcode(self, list_number: int) -> str:
        """Generate barcode from list number and line number.

        Format: LLLLNN where LLLL is list number and NN is line number.
        Example: List 123, Line 5 -> "012305"
        """
        return f"{list_number:04d}{self.line_number:02d}"
