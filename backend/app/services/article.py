"""Article service for business logic."""

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import (
    ArticleNotFoundError,
    InvalidPriceError,
    MaxArticlesExceededError,
    MaxClothingExceededError,
    ValidationError,
)
from app.models import Article, ItemList, User
from app.repositories import ArticleRepository, ItemListRepository
from app.schemas.article import (
    ArticleCreate,
    ArticleUpdate,
    BLACKLISTED_ITEMS,
    CATEGORY_LIMITS,
    LOT_ALLOWED_SUBCATEGORIES,
    MAX_ARTICLES_PER_LIST,
    MAX_CLOTHING_PER_LIST,
    MAX_LOT_AGE_MONTHS,
    MAX_LOT_SIZE,
    MAX_PRICE_STROLLER,
    MIN_PRICE,
)
from app.services.item_list import ItemListNotFoundError, ItemListService
from app.repositories.article import CLOTHING_CATEGORIES


class CategoryLimitExceededError(ValidationError):
    """Category-specific limit exceeded."""

    def __init__(self, subcategory: str, max_count: int):
        super().__init__(
            f"Vous avez atteint la limite de {max_count} article(s) de type '{subcategory}' par liste",
            field="subcategory",
        )


class BlacklistedCategoryError(ValidationError):
    """Article category is blacklisted."""

    def __init__(self, item_type: str):
        super().__init__(
            f"Les articles de type '{item_type}' ne sont pas acceptés selon le règlement",
            field="category",
        )


class InvalidLotError(ValidationError):
    """Lot configuration is invalid."""

    def __init__(self, message: str):
        super().__init__(message, field="is_lot")


class ArticleService:
    """Service for article business logic."""

    def __init__(self, db: AsyncSession):
        """Initialize service with database session."""
        self.db = db
        self.repository = ArticleRepository(db)
        self.list_repository = ItemListRepository(db)
        self.list_service = ItemListService(db)

    async def add_article(
        self,
        list_id: str,
        depositor: User,
        data: ArticleCreate,
    ) -> Article:
        """
        Add an article to a list.

        Args:
            list_id: List ID
            depositor: User adding the article
            data: Article data

        Returns:
            Created article

        Raises:
            Various validation errors
        """
        # Check if list can be modified
        item_list, edition = await self.list_service.check_can_modify(
            list_id, depositor
        )

        # Validate constraints
        await self._validate_article_constraints(item_list, data)

        # Get next line number
        line_number = await self.repository.get_next_line_number(list_id)

        # Create article
        article = await self.repository.create(
            item_list=item_list,
            description=data.description,
            category=data.category.value,
            subcategory=data.subcategory,
            price=data.price,
            size=data.size,
            brand=data.brand,
            color=data.color,
            gender=data.gender.value if data.gender else None,
            is_lot=data.is_lot,
            lot_quantity=data.lot_quantity,
            conformity_certified=data.conformity_certified,
            line_number=line_number,
        )

        # Reorder articles by category
        await self.repository.reorder_articles(list_id)

        # Refresh to get updated line number
        return await self.repository.get_by_id(article.id)

    async def update_article(
        self,
        list_id: str,
        article_id: str,
        depositor: User,
        data: ArticleUpdate,
    ) -> Article:
        """
        Update an article.

        Args:
            list_id: List ID
            article_id: Article ID
            depositor: User updating
            data: Update data

        Returns:
            Updated article
        """
        # Check if list can be modified
        item_list, edition = await self.list_service.check_can_modify(
            list_id, depositor
        )

        # Get article
        article = await self.repository.get_by_id(article_id)
        if not article or article.item_list_id != list_id:
            raise ArticleNotFoundError(article_id)

        # Determine effective category/subcategory after update
        new_category = data.category.value if data.category else article.category
        new_subcategory = data.subcategory if "subcategory" in data.model_fields_set else article.subcategory
        category_changed = new_category != article.category

        # Validate clothing limit if switching to clothing
        if category_changed and new_category in CLOTHING_CATEGORIES:
            clothing_count = await self.repository.count_clothing(list_id)
            # Current article is not clothing (otherwise no change), so no need to subtract
            if clothing_count >= MAX_CLOTHING_PER_LIST:
                raise MaxClothingExceededError(MAX_CLOTHING_PER_LIST)

        # Validate category-specific limits for new subcategory
        if new_subcategory and new_subcategory != article.subcategory and new_subcategory in CATEGORY_LIMITS:
            max_allowed = CATEGORY_LIMITS[new_subcategory]
            current = await self.repository.count_by_subcategory(list_id, new_subcategory)
            if current >= max_allowed:
                raise CategoryLimitExceededError(new_subcategory, max_allowed)

        # Validate price if provided
        if data.price is not None:
            self._validate_price(data.price, new_category, new_subcategory)

        # Validate lot fields
        is_lot = data.is_lot if data.is_lot is not None else article.is_lot
        lot_qty = data.lot_quantity if data.lot_quantity is not None else article.lot_quantity
        size = data.size if data.size is not None else article.size
        if is_lot and lot_qty:
            self._validate_lot(lot_qty, size, new_subcategory)

        # Update
        update_data = data.model_dump(exclude_unset=True)

        # Handle enums
        if "gender" in update_data and update_data["gender"] is not None:
            update_data["gender"] = update_data["gender"].value
        if "category" in update_data and update_data["category"] is not None:
            update_data["category"] = update_data["category"].value

        article = await self.repository.update(article, **update_data)

        # Reorder if category changed (line numbers depend on clothing vs non-clothing)
        if category_changed:
            await self.repository.reorder_articles(list_id)
            article = await self.repository.get_by_id(article.id)

        return article

    async def delete_article(
        self,
        list_id: str,
        article_id: str,
        depositor: User,
    ) -> None:
        """
        Delete an article.

        Args:
            list_id: List ID
            article_id: Article ID
            depositor: User deleting
        """
        # Check if list can be modified
        await self.list_service.check_can_modify(list_id, depositor)

        # Get article
        article = await self.repository.get_by_id(article_id)
        if not article or article.item_list_id != list_id:
            raise ArticleNotFoundError(article_id)

        # Delete
        await self.repository.delete(article)

        # Reorder remaining articles
        await self.repository.reorder_articles(list_id)

    async def get_article(self, article_id: str) -> Article:
        """Get an article by ID."""
        article = await self.repository.get_by_id(article_id)
        if not article:
            raise ArticleNotFoundError(article_id)
        return article

    async def get_articles_for_list(self, list_id: str) -> list[Article]:
        """Get all articles for a list, ordered by category."""
        return await self.repository.get_by_list_id(list_id)

    async def get_list_article_summary(
        self, list_id: str, *, depositor_id: str | None = None
    ) -> dict:
        """
        Get article summary for a list.

        Args:
            list_id: List ID
            depositor_id: If provided, verify the list belongs to this depositor

        Returns:
            dict with total, clothing_count, category_counts

        Raises:
            ItemListNotFoundError: If list not found or doesn't belong to depositor
        """
        # Verify list exists and optionally check ownership
        item_list = await self.list_repository.get_by_id(list_id)
        if not item_list:
            raise ItemListNotFoundError(list_id)

        if depositor_id and item_list.depositor_id != depositor_id:
            raise ItemListNotFoundError(list_id)

        articles = await self.repository.get_by_list_id(list_id)
        category_counts = await self.repository.get_category_counts(list_id)
        clothing_count = await self.repository.count_clothing(list_id)

        return {
            "total": len(articles),
            "clothing_count": clothing_count,
            "category_counts": category_counts,
            "articles": articles,
        }

    async def _validate_article_constraints(
        self, item_list: ItemList, data: ArticleCreate
    ) -> None:
        """Validate all article constraints before creation."""
        list_id = item_list.id

        # 1. Check max articles
        current_count = await self.repository.count_by_list_id(list_id)
        if current_count >= MAX_ARTICLES_PER_LIST:
            raise MaxArticlesExceededError(MAX_ARTICLES_PER_LIST)

        # 2. Check max clothing
        if data.category.value in CLOTHING_CATEGORIES:
            clothing_count = await self.repository.count_clothing(list_id)
            if clothing_count >= MAX_CLOTHING_PER_LIST:
                raise MaxClothingExceededError(MAX_CLOTHING_PER_LIST)

        # 3. Check blacklisted items
        if data.subcategory and data.subcategory in BLACKLISTED_ITEMS:
            raise BlacklistedCategoryError(data.subcategory)

        # 4. Check category-specific limits
        if data.subcategory and data.subcategory in CATEGORY_LIMITS:
            max_allowed = CATEGORY_LIMITS[data.subcategory]
            current = await self.repository.count_by_subcategory(
                list_id, data.subcategory
            )
            if current >= max_allowed:
                raise CategoryLimitExceededError(data.subcategory, max_allowed)

        # 5. Validate price
        self._validate_price(data.price, data.category.value, data.subcategory)

        # 6. Validate lot
        if data.is_lot:
            self._validate_lot(data.lot_quantity, data.size, data.subcategory)

    def _validate_price(
        self,
        price: Decimal,
        category: str,
        subcategory: str | None = None,
    ) -> None:
        """Validate article price."""
        # Check minimum
        if price < MIN_PRICE:
            raise InvalidPriceError(
                str(price), str(MIN_PRICE), str(MAX_PRICE_STROLLER)
            )

        # Check maximum for strollers
        if subcategory == "stroller" and price > MAX_PRICE_STROLLER:
            raise InvalidPriceError(
                str(price), str(MIN_PRICE), str(MAX_PRICE_STROLLER)
            )

    def _validate_lot(
        self, lot_quantity: int | None, size: str | None, subcategory: str | None = None
    ) -> None:
        """Validate lot configuration."""
        if lot_quantity is None:
            raise InvalidLotError("La quantité du lot est requise")

        if lot_quantity > MAX_LOT_SIZE:
            raise InvalidLotError(
                f"Un lot ne peut contenir que {MAX_LOT_SIZE} articles maximum"
            )

        # Check subcategory restriction (only bodys and pajamas allowed)
        if subcategory not in LOT_ALLOWED_SUBCATEGORIES:
            raise InvalidLotError(
                "Les lots sont uniquement autorisés pour les bodys et pyjamas/grenouillères"
            )

        # Check age restriction for lots (max 36 months)
        # Size should be in format like "18 mois", "24 mois", "3 ans"
        if size:
            age_months = self._parse_size_to_months(size)
            if age_months and age_months > MAX_LOT_AGE_MONTHS:
                raise InvalidLotError(
                    f"Les lots ne sont autorisés que jusqu'à {MAX_LOT_AGE_MONTHS} mois"
                )

    def _parse_size_to_months(self, size: str) -> int | None:
        """Parse size string to months (e.g., '18 mois' -> 18, '2 ans' -> 24)."""
        size_lower = size.lower().strip()

        # Try "X mois" format
        if "mois" in size_lower:
            try:
                months = int(size_lower.replace("mois", "").strip())
                return months
            except ValueError:
                return None

        # Try "X ans" format
        if "ans" in size_lower or "an" in size_lower:
            try:
                years_str = size_lower.replace("ans", "").replace("an", "").strip()
                years = int(years_str)
                return years * 12
            except ValueError:
                return None

        return None


def get_category_info() -> list[dict]:
    """Get category information for frontend display."""
    categories = [
        {
            "id": "clothing",
            "name": "Clothing",
            "name_fr": "Vêtements",
            "max_per_list": MAX_CLOTHING_PER_LIST,
            "is_clothing": True,
        },
        {
            "id": "shoes",
            "name": "Shoes",
            "name_fr": "Chaussures",
            "is_clothing": True,
        },
        {
            "id": "nursery",
            "name": "Nursery",
            "name_fr": "Puériculture",
            "is_clothing": False,
        },
        {
            "id": "toys",
            "name": "Toys",
            "name_fr": "Jeux et jouets",
            "is_clothing": False,
        },
        {
            "id": "books",
            "name": "Books",
            "name_fr": "Livres",
            "is_clothing": False,
        },
        {
            "id": "accessories",
            "name": "Accessories",
            "name_fr": "Accessoires",
            "is_clothing": True,
        },
        {
            "id": "other",
            "name": "Other",
            "name_fr": "Autres",
            "is_clothing": False,
        },
    ]

    # Add subcategory limits
    subcategory_info = {
        "coat": {"name_fr": "Manteau/Blouson", "max": 1},
        "handbag": {"name_fr": "Sac à main", "max": 1},
        "scarf": {"name_fr": "Foulard", "max": 2},
        "bed_bumper": {"name_fr": "Tour de lit", "max": 1},
        "plush": {"name_fr": "Peluche", "max": 1},
        "adult_book": {"name_fr": "Livre adulte", "max": 5},
    }

    return categories


def get_price_hints() -> list[dict]:
    """Get indicative price hints for articles."""
    return [
        # Adult clothing
        {"category": "clothing", "subcategory": "skirt", "target": "adult", "min_price": Decimal("3"), "max_price": Decimal("10")},
        {"category": "clothing", "subcategory": "tshirt", "target": "adult", "min_price": Decimal("3"), "max_price": Decimal("8")},
        {"category": "clothing", "subcategory": "dress", "target": "adult", "min_price": Decimal("5"), "max_price": Decimal("23")},
        {"category": "clothing", "subcategory": "pants", "target": "adult", "min_price": Decimal("4"), "max_price": Decimal("13")},
        {"category": "clothing", "subcategory": "coat", "target": "adult", "min_price": Decimal("8"), "max_price": Decimal("31")},
        # Child clothing
        {"category": "clothing", "subcategory": "skirt", "target": "child", "min_price": Decimal("2"), "max_price": Decimal("8")},
        {"category": "clothing", "subcategory": "tshirt", "target": "child", "min_price": Decimal("1"), "max_price": Decimal("7")},
        {"category": "clothing", "subcategory": "dress", "target": "child", "min_price": Decimal("3"), "max_price": Decimal("13")},
        {"category": "clothing", "subcategory": "pants", "target": "child", "min_price": Decimal("3"), "max_price": Decimal("10")},
        {"category": "clothing", "subcategory": "coat", "target": "child", "min_price": Decimal("3"), "max_price": Decimal("13")},
        {"category": "clothing", "subcategory": "layette", "target": "child", "min_price": Decimal("1"), "max_price": Decimal("8")},
        # Special
        {"category": "nursery", "subcategory": "stroller", "target": "child", "min_price": Decimal("20"), "max_price": Decimal("150")},
    ]
