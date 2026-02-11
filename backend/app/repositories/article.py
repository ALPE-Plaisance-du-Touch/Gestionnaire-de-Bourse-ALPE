"""Article repository for database operations."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import Article, ItemList
from app.models.article import ArticleStatus


# Category order for sorting articles
CATEGORY_ORDER = {
    "clothing": 1,
    "shoes": 2,
    "accessories": 3,
    "nursery": 4,
    "toys": 5,
    "books": 6,
    "other": 7,
}

# Categories that count as clothing (lines 1-12)
CLOTHING_CATEGORIES = {"clothing", "shoes", "accessories"}


class ArticleRepository:
    """Repository for article database operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository with database session."""
        self.db = db

    async def get_by_id(self, article_id: str) -> Article | None:
        """Get an article by ID."""
        result = await self.db.execute(
            select(Article)
            .options(joinedload(Article.item_list))
            .where(Article.id == article_id)
        )
        return result.unique().scalar_one_or_none()

    async def get_by_barcode(self, barcode: str) -> Article | None:
        """Get an article by barcode with item_list and depositor loaded."""
        result = await self.db.execute(
            select(Article)
            .options(joinedload(Article.item_list).joinedload(ItemList.depositor))
            .where(Article.barcode == barcode)
        )
        return result.unique().scalar_one_or_none()

    async def get_by_list_id(
        self, item_list_id: str, *, order_by_category: bool = True
    ) -> list[Article]:
        """Get all articles for a list, ordered by category and line number."""
        query = select(Article).where(Article.item_list_id == item_list_id)

        if order_by_category:
            # Order by category (using predefined order) then by line number
            query = query.order_by(Article.line_number)
        else:
            query = query.order_by(Article.line_number)

        result = await self.db.execute(query)
        articles = list(result.scalars().all())

        if order_by_category:
            # Sort by category order
            articles.sort(
                key=lambda a: (CATEGORY_ORDER.get(a.category, 99), a.line_number)
            )

        return articles

    async def count_by_list_id(self, item_list_id: str) -> int:
        """Count total articles in a list."""
        result = await self.db.execute(
            select(func.count())
            .select_from(Article)
            .where(Article.item_list_id == item_list_id)
        )
        return result.scalar_one()

    async def count_by_category(self, item_list_id: str, category: str) -> int:
        """Count articles of a specific category in a list."""
        result = await self.db.execute(
            select(func.count())
            .select_from(Article)
            .where(Article.item_list_id == item_list_id)
            .where(Article.category == category)
        )
        return result.scalar_one()

    async def count_by_subcategory(
        self, item_list_id: str, subcategory: str
    ) -> int:
        """Count articles of a specific subcategory in a list."""
        result = await self.db.execute(
            select(func.count())
            .select_from(Article)
            .where(Article.item_list_id == item_list_id)
            .where(Article.subcategory == subcategory)
        )
        return result.scalar_one()

    async def count_clothing(self, item_list_id: str) -> int:
        """Count clothing articles (clothing + shoes + accessories) in a list."""
        clothing_categories = ["clothing", "shoes", "accessories"]
        result = await self.db.execute(
            select(func.count())
            .select_from(Article)
            .where(Article.item_list_id == item_list_id)
            .where(Article.category.in_(clothing_categories))
        )
        return result.scalar_one()

    async def get_next_line_number(self, item_list_id: str) -> int:
        """Get the next available line number for a list."""
        result = await self.db.execute(
            select(func.max(Article.line_number)).where(
                Article.item_list_id == item_list_id
            )
        )
        max_line = result.scalar_one()
        return (max_line or 0) + 1

    async def create(
        self,
        item_list: ItemList,
        *,
        description: str,
        category: str,
        price,
        line_number: int,
        subcategory: str | None = None,
        size: str | None = None,
        brand: str | None = None,
        color: str | None = None,
        gender: str | None = None,
        is_lot: bool = False,
        lot_quantity: int | None = None,
        conformity_certified: bool = False,
    ) -> Article:
        """Create a new article."""
        article = Article(
            description=description,
            category=category,
            subcategory=subcategory,
            price=price,
            size=size,
            brand=brand,
            color=color,
            gender=gender,
            line_number=line_number,
            is_lot=is_lot,
            lot_quantity=lot_quantity,
            status=ArticleStatus.DRAFT.value,
            conformity_certified=conformity_certified,
            item_list_id=item_list.id,
        )

        self.db.add(article)
        await self.db.commit()
        await self.db.refresh(article)

        return article

    async def update(self, article: Article, **kwargs) -> Article:
        """Update an article's attributes."""
        for key, value in kwargs.items():
            if hasattr(article, key) and value is not None:
                setattr(article, key, value)

        await self.db.commit()
        await self.db.refresh(article)

        return article

    async def delete(self, article: Article) -> None:
        """Delete an article."""
        await self.db.delete(article)
        await self.db.commit()

    async def reorder_articles(self, item_list_id: str) -> None:
        """Reorder all articles in a list by category and assign new line numbers.

        Clothing articles (clothing, shoes, accessories) come first (lines 1-12),
        followed by non-clothing articles. Line numbers are sequential with no gaps.
        """
        articles = await self.get_by_list_id(item_list_id, order_by_category=True)

        # Split into clothing and non-clothing
        clothing_articles = [a for a in articles if a.category in CLOTHING_CATEGORIES]
        other_articles = [a for a in articles if a.category not in CLOTHING_CATEGORIES]

        # First pass: set all line numbers to negative values to avoid unique constraint conflicts
        for index, article in enumerate(articles, start=1):
            article.line_number = -index

        await self.db.flush()

        # Second pass: assign final line numbers sequentially (clothing first, then others)
        line = 1
        for article in clothing_articles:
            article.line_number = line
            line += 1
        for article in other_articles:
            article.line_number = line
            line += 1

        await self.db.commit()

    async def generate_barcode(self, article: Article, list_number: int) -> str:
        """Generate and assign a barcode to an article.

        Format: LLLLNN where LLLL is list number and NN is line number.
        Example: List 123, Line 5 -> "012305"
        """
        barcode = f"{list_number:04d}{article.line_number:02d}"
        article.barcode = barcode
        await self.db.commit()
        return barcode

    async def update_status(
        self, article: Article, status: ArticleStatus
    ) -> Article:
        """Update article status."""
        article.status = status.value
        await self.db.commit()
        await self.db.refresh(article)
        return article

    async def bulk_update_status(
        self, item_list_id: str, from_status: ArticleStatus, to_status: ArticleStatus
    ) -> int:
        """Bulk update status for all articles in a list."""
        articles = await self.get_by_list_id(item_list_id)
        count = 0

        for article in articles:
            if article.status == from_status.value:
                article.status = to_status.value
                count += 1

        await self.db.commit()
        return count

    async def get_category_counts(self, item_list_id: str) -> dict[str, int]:
        """Get count of articles per category for a list."""
        result = await self.db.execute(
            select(Article.category, func.count())
            .where(Article.item_list_id == item_list_id)
            .group_by(Article.category)
        )
        return dict(result.all())

    async def get_on_sale_for_edition(self, edition_id: str) -> list[Article]:
        """Get all articles with status ON_SALE for a given edition."""
        result = await self.db.execute(
            select(Article)
            .join(Article.item_list)
            .options(
                joinedload(Article.item_list).joinedload(ItemList.depositor)
            )
            .where(ItemList.edition_id == edition_id)
            .where(Article.status == ArticleStatus.ON_SALE.value)
        )
        return list(result.unique().scalars().all())

    async def get_subcategory_counts(self, item_list_id: str) -> dict[str, int]:
        """Get count of articles per subcategory for a list."""
        result = await self.db.execute(
            select(Article.subcategory, func.count())
            .where(Article.item_list_id == item_list_id)
            .where(Article.subcategory.isnot(None))
            .group_by(Article.subcategory)
        )
        return dict(result.all())
