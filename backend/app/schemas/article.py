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
    ON_SALE = "on_sale"
    SOLD = "sold"
    UNSOLD = "unsold"
    RETRIEVED = "retrieved"
    DONATED = "donated"


# Price constraints
MIN_PRICE = Decimal("1.00")
MAX_PRICE_STROLLER = Decimal("150.00")
MAX_PRICE_DEFAULT = Decimal("100.00")

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
    description: str = Field(..., min_length=1, max_length=255)
    price: Decimal = Field(..., ge=MIN_PRICE, le=MAX_PRICE_DEFAULT)
    size: str | None = Field(None, max_length=50)
    brand: str | None = Field(None, max_length=100)
    color: str | None = Field(None, max_length=50)
    gender: ArticleGender | None = None

    # Lot fields
    is_lot: bool = False
    lot_quantity: int | None = Field(None, ge=1, le=MAX_LOT_SIZE)

    # Conformity certification
    conformity_certified: bool = Field(
        default=False,
        description="Depositor certifies article is clean and in good condition",
    )

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

    description: str | None = Field(None, min_length=1, max_length=255)
    price: Decimal | None = Field(None, ge=MIN_PRICE, le=MAX_PRICE_DEFAULT)
    size: str | None = Field(None, max_length=50)
    brand: str | None = Field(None, max_length=100)
    color: str | None = Field(None, max_length=50)
    gender: ArticleGender | None = None

    # Lot fields can be updated
    is_lot: bool | None = None
    lot_quantity: int | None = Field(None, ge=1, le=MAX_LOT_SIZE)

    # Can update certification
    conformity_certified: bool | None = None


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
    conformity_certified: bool
    barcode: str | None = None
    notes: str | None = None

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
