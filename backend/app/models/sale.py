"""Sale model for recording transactions."""

from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.article import Article
    from app.models.edition import Edition
    from app.models.user import User


class PaymentMethod(str, Enum):
    """Payment methods accepted."""

    CASH = "cash"
    CARD = "card"
    CHECK = "check"


class Sale(Base, UUIDMixin, TimestampMixin):
    """Sale model representing a completed transaction."""

    __tablename__ = "sales"

    # Sale details
    sold_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), nullable=False)

    # Register/checkout info
    register_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Offline sale tracking
    is_offline_sale: Mapped[bool] = mapped_column(default=False)
    synced_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Foreign keys
    edition_id: Mapped[str] = mapped_column(
        ForeignKey("editions.id", ondelete="CASCADE"),
        nullable=False,
    )
    article_id: Mapped[str] = mapped_column(
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One article can only be sold once
    )
    seller_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,  # Seller (volunteer/cashier)
    )

    # Relationships
    edition: Mapped["Edition"] = relationship("Edition", back_populates="sales")
    article: Mapped["Article"] = relationship("Article", back_populates="sale")
    seller: Mapped["User | None"] = relationship("User", foreign_keys=[seller_id])
