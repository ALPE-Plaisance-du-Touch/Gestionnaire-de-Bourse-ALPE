"""Article schemas for API requests and responses."""

from datetime import datetime
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ArticleCategory(str, Enum):
    """Main article categories."""

    CLOTHING = "clothing"
    SHOES = "shoes"
    NURSERY = "nursery"
    TOYS = "toys"
    BOOKS = "books"
    ACCESSORIES = "accessories"
    OTHER = "other"


class ArticleSubcategory(str, Enum):
    """Article subcategories for specific constraints."""

    # Clothing subcategories
    COAT = "coat"  # Manteau/Blouson - 1 max
    SKIRT = "skirt"
    TSHIRT = "tshirt"
    DRESS = "dress"
    PANTS = "pants"
    SHIRT = "shirt"
    SHORTS = "shorts"
    JOGGING = "jogging"
    SWEATER = "sweater"
    RAINCOAT = "raincoat"
    JACKET = "jacket"
    LAYETTE = "layette"
    BODY = "body"  # Bodys - lot allowed
    PAJAMA = "pajama"  # Pyjamas/Grenouillères - lot allowed

    # Accessories subcategories
    HANDBAG = "handbag"  # 1 max
    SCARF = "scarf"  # 2 max

    # Nursery subcategories
    STROLLER = "stroller"  # Max 150€
    BED_BUMPER = "bed_bumper"  # Tour de lit - 1 max

    # Toys subcategories
    PLUSH = "plush"  # Peluche - 1 max

    # Books subcategories
    ADULT_BOOK = "adult_book"  # 5 max


class ArticleGender(str, Enum):
    """Gender for clothing items."""

    GIRL = "girl"
    BOY = "boy"
    UNISEX = "unisex"
    ADULT_MALE = "adult_male"
    ADULT_FEMALE = "adult_female"
    ADULT_UNISEX = "adult_unisex"


class ArticleStatus(str, Enum):
    """Article lifecycle status."""

    DRAFT = "draft"
    VALIDATED = "validated"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    ON_SALE = "on_sale"
    SOLD = "sold"
    UNSOLD = "unsold"
    RETRIEVED = "retrieved"
    DONATED = "donated"


# Price constraints
MIN_PRICE = Decimal("1.00")
MAX_PRICE_STROLLER = Decimal("150.00")
# No general max price - only strollers have a 150€ limit

# Article limits per list
MAX_ARTICLES_PER_LIST = 24
MAX_CLOTHING_PER_LIST = 12

# Category-specific limits per list
CATEGORY_LIMITS = {
    ArticleSubcategory.COAT.value: 1,
    ArticleSubcategory.HANDBAG.value: 1,
    ArticleSubcategory.SCARF.value: 2,
    ArticleSubcategory.BED_BUMPER.value: 1,
    ArticleSubcategory.PLUSH.value: 1,
    ArticleSubcategory.ADULT_BOOK.value: 5,
}

# Lot constraints
MAX_LOT_SIZE = 3
MAX_LOT_AGE_MONTHS = 36
# Only bodys and pajamas can be sold in lots
LOT_ALLOWED_SUBCATEGORIES = {"body", "pajama"}

# Blacklisted categories (not allowed)
BLACKLISTED_ITEMS = [
    "car_seat",  # Sièges-autos, rehausseurs
    "baby_bottle",  # Biberons, pots, vaisselle bébé
    "cd_dvd",  # CD/DVD/Vinyles
    "helmet",  # Casques (vélo, ski, équitation)
    "game_console",  # Consoles, jeux PC/Mac
    "furniture",  # Meubles, luminaires, décoration
    "bedding",  # Literie (matelas, oreillers)
    "damaged_book",  # Livres jaunis/abîmés, encyclopédies
    "adult_sleepwear",  # Pyjamas adultes, chemises de nuit
    "underwear",  # Sous-vêtements adultes/enfants >2 ans
    "socks",  # Chaussettes (sauf ski), collants, chaussons
    "suit_tie",  # Costumes hommes, cravates, kimono
]


class ArticleCreate(BaseModel):
    """Schema for creating a new article."""

    category: ArticleCategory
    subcategory: str | None = Field(None, max_length=50)
    description: str = Field(..., min_length=1, max_length=100)
    price: Decimal = Field(..., ge=MIN_PRICE)
    size: str | None = Field(None, max_length=50)
    brand: str | None = Field(None, max_length=100)
    color: str | None = Field(None, max_length=50)
    gender: ArticleGender | None = None

    # Lot fields
    is_lot: bool = False
    lot_quantity: int | None = Field(None, ge=1, le=MAX_LOT_SIZE)

    @field_validator("price")
    @classmethod
    def validate_price_minimum(cls, v: Decimal) -> Decimal:
        """Ensure price is at least 1€."""
        if v < MIN_PRICE:
            raise ValueError(f"Price must be at least {MIN_PRICE}€")
        return v

    @field_validator("lot_quantity")
    @classmethod
    def validate_lot_quantity(cls, v: int | None, info) -> int | None:
        """Validate lot quantity is set when is_lot is True."""
        if info.data.get("is_lot") and v is None:
            raise ValueError("lot_quantity is required when is_lot is True")
        if not info.data.get("is_lot") and v is not None:
            raise ValueError("lot_quantity should only be set when is_lot is True")
        return v


class ArticleUpdate(BaseModel):
    """Schema for updating an article."""

    category: ArticleCategory | None = None
    subcategory: str | None = Field(None, max_length=50)
    description: str | None = Field(None, min_length=1, max_length=100)
    price: Decimal | None = Field(None, ge=MIN_PRICE)
    size: str | None = Field(None, max_length=50)
    brand: str | None = Field(None, max_length=100)
    color: str | None = Field(None, max_length=50)
    gender: ArticleGender | None = None

    # Lot fields can be updated
    is_lot: bool | None = None
    lot_quantity: int | None = Field(None, ge=1, le=MAX_LOT_SIZE)



class ArticleResponse(BaseModel):
    """Response schema for article data."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    line_number: int
    category: str
    subcategory: str | None = None
    description: str
    price: Decimal
    size: str | None = None
    brand: str | None = None
    color: str | None = None
    gender: str | None = None

    is_lot: bool
    lot_quantity: int | None = None

    status: str
    barcode: str | None = None
    notes: str | None = None

    # Review fields (US-013)
    rejection_reason: str | None = None
    rejected_at: datetime | None = None
    reviewed_at: datetime | None = None

    item_list_id: str
    created_at: datetime


class ArticleSummary(BaseModel):
    """Compact article representation for list views."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    line_number: int
    category: str
    description: str
    price: Decimal
    is_lot: bool
    lot_quantity: int | None = None
    status: str


class CategoryInfo(BaseModel):
    """Information about a category for frontend display."""

    id: str
    name: str
    name_fr: str
    max_per_list: int | None = None
    max_price: Decimal | None = None
    is_clothing: bool = False


class CategoryConstraintsResponse(BaseModel):
    """Response with all category constraints for frontend."""

    categories: list[CategoryInfo]
    blacklisted: list[str]
    max_articles_per_list: int = MAX_ARTICLES_PER_LIST
    max_clothing_per_list: int = MAX_CLOTHING_PER_LIST
    min_price: Decimal = MIN_PRICE
    max_price_stroller: Decimal = MAX_PRICE_STROLLER
    max_lot_size: int = MAX_LOT_SIZE
    max_lot_age_months: int = MAX_LOT_AGE_MONTHS


class PriceHint(BaseModel):
    """Indicative price range for an article type."""

    category: str
    subcategory: str | None = None
    target: str  # "adult" or "child"
    min_price: Decimal
    max_price: Decimal


class PriceHintsResponse(BaseModel):
    """Response with price hints for all categories."""

    hints: list[PriceHint]


class ArticleListResponse(BaseModel):
    """Response schema for paginated article list."""

    items: list[ArticleResponse]
    total: int
    clothing_count: int
    category_counts: dict[str, int]


class ArticleRejectRequest(BaseModel):
    """Request schema for rejecting an article during review."""

    rejection_reason: str | None = Field(None, max_length=200)


class ReviewStats(BaseModel):
    """Review statistics for a list."""

    pending: int
    accepted: int
    rejected: int


class ReviewListResponse(BaseModel):
    """Response schema for a list in the review context."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    number: int
    list_type: str
    status: str
    depositor_name: str
    article_count: int
    review_stats: ReviewStats
    reviewed_at: datetime | None = None
    reviewed_by_name: str | None = None


class ReviewListDetailResponse(BaseModel):
    """Response schema for a list detail in review context."""

    id: str
    number: int
    list_type: str
    status: str
    depositor_name: str
    articles: list[ArticleResponse]
    review_stats: ReviewStats
    reviewed_at: datetime | None = None


class ReviewSummaryResponse(BaseModel):
    """Response schema for review progress of an edition."""

    total_lists: int
    reviewed_lists: int
    pending_lists: int
    total_articles: int
    accepted_articles: int
    rejected_articles: int
    pending_articles: int
