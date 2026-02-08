"""Sale repository for database operations."""

from decimal import Decimal

from sqlalchemy import case, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import Article, ItemList, Sale, User
from app.models.article import ArticleStatus
from app.models.sale import PaymentMethod


class SaleRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, sale: Sale) -> Sale:
        self.db.add(sale)
        await self.db.commit()
        await self.db.refresh(sale)
        return sale

    async def get_by_id(self, sale_id: str) -> Sale | None:
        result = await self.db.execute(
            select(Sale)
            .options(
                joinedload(Sale.article).joinedload(Article.item_list).joinedload(ItemList.depositor),
                joinedload(Sale.seller),
            )
            .where(Sale.id == sale_id)
        )
        return result.unique().scalar_one_or_none()

    async def get_by_article_id(self, article_id: str) -> Sale | None:
        result = await self.db.execute(
            select(Sale)
            .options(joinedload(Sale.seller))
            .where(Sale.article_id == article_id)
        )
        return result.unique().scalar_one_or_none()

    async def list_by_edition(
        self,
        edition_id: str,
        offset: int = 0,
        limit: int = 20,
        payment_method: str | None = None,
        register_number: int | None = None,
    ) -> tuple[list[Sale], int]:
        base_query = select(Sale).where(Sale.edition_id == edition_id)

        if payment_method:
            base_query = base_query.where(Sale.payment_method == payment_method)
        if register_number is not None:
            base_query = base_query.where(Sale.register_number == register_number)

        # Count
        count_result = await self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        # Fetch with relations
        result = await self.db.execute(
            base_query
            .options(
                joinedload(Sale.article).joinedload(Article.item_list).joinedload(ItemList.depositor),
                joinedload(Sale.seller),
            )
            .order_by(Sale.sold_at.desc())
            .offset(offset)
            .limit(limit)
        )
        sales = list(result.unique().scalars().all())

        return sales, total

    async def delete(self, sale: Sale) -> None:
        await self.db.delete(sale)
        await self.db.commit()

    async def get_stats(self, edition_id: str) -> dict:
        # Total sold and revenue by payment method
        result = await self.db.execute(
            select(
                Sale.payment_method,
                func.count().label("count"),
                func.coalesce(func.sum(Sale.price), 0).label("revenue"),
            )
            .where(Sale.edition_id == edition_id)
            .group_by(Sale.payment_method)
        )
        rows = result.all()

        total_sold = 0
        total_revenue = Decimal("0.00")
        revenue_cash = Decimal("0.00")
        revenue_card = Decimal("0.00")
        revenue_check = Decimal("0.00")

        for payment_method, count, revenue in rows:
            total_sold += count
            total_revenue += Decimal(str(revenue))
            if payment_method == PaymentMethod.CASH.value:
                revenue_cash = Decimal(str(revenue))
            elif payment_method == PaymentMethod.CARD.value:
                revenue_card = Decimal(str(revenue))
            elif payment_method == PaymentMethod.CHECK.value:
                revenue_check = Decimal(str(revenue))

        # Count articles on sale in this edition
        on_sale_result = await self.db.execute(
            select(func.count())
            .select_from(Article)
            .join(ItemList, Article.item_list_id == ItemList.id)
            .where(
                ItemList.edition_id == edition_id,
                Article.status == ArticleStatus.ON_SALE.value,
            )
        )
        articles_on_sale = on_sale_result.scalar_one()

        total_sellable = articles_on_sale + total_sold
        sell_through_rate = (total_sold / total_sellable * 100) if total_sellable > 0 else 0.0

        return {
            "total_articles_sold": total_sold,
            "total_revenue": total_revenue,
            "revenue_cash": revenue_cash,
            "revenue_card": revenue_card,
            "revenue_check": revenue_check,
            "articles_on_sale": articles_on_sale,
            "sell_through_rate": round(sell_through_rate, 1),
        }

    async def get_top_depositors(self, edition_id: str, limit: int = 5) -> list[dict]:
        result = await self.db.execute(
            select(
                User.first_name,
                User.last_name,
                func.count().label("articles_sold"),
                func.sum(Sale.price).label("total_revenue"),
            )
            .join(Article, Sale.article_id == Article.id)
            .join(ItemList, Article.item_list_id == ItemList.id)
            .join(User, ItemList.depositor_id == User.id)
            .where(Sale.edition_id == edition_id)
            .group_by(User.id, User.first_name, User.last_name)
            .order_by(func.sum(Sale.price).desc())
            .limit(limit)
        )
        return [
            {
                "depositor_name": f"{first_name} {last_name}",
                "articles_sold": articles_sold,
                "total_revenue": Decimal(str(total_revenue)),
            }
            for first_name, last_name, articles_sold, total_revenue in result.all()
        ]

    async def get_category_stats(self, edition_id: str) -> list[dict]:
        """Get sales stats grouped by article category."""
        sellable_statuses = (ArticleStatus.ON_SALE.value, ArticleStatus.SOLD.value)

        # Total articles and sold articles per category
        result = await self.db.execute(
            select(
                Article.category,
                func.count().label("total_articles"),
                func.sum(
                    case((Article.status == ArticleStatus.SOLD.value, 1), else_=0)
                ).label("sold_articles"),
                func.coalesce(
                    func.sum(
                        case((Article.status == ArticleStatus.SOLD.value, Article.price), else_=0)
                    ),
                    0,
                ).label("total_revenue"),
            )
            .join(ItemList, Article.item_list_id == ItemList.id)
            .where(
                ItemList.edition_id == edition_id,
                Article.status.in_(sellable_statuses),
            )
            .group_by(Article.category)
            .order_by(func.count().desc())
        )

        stats = []
        for category, total_articles, sold_articles, total_revenue in result.all():
            sell_through = (sold_articles / total_articles * 100) if total_articles > 0 else 0.0
            stats.append({
                "category": category,
                "total_articles": total_articles,
                "sold_articles": sold_articles,
                "sell_through_rate": round(sell_through, 1),
                "total_revenue": Decimal(str(total_revenue)),
            })
        return stats

    async def get_price_distribution(self, edition_id: str) -> list[dict]:
        """Get article count by price range."""
        sellable_statuses = (ArticleStatus.ON_SALE.value, ArticleStatus.SOLD.value)

        price_range = case(
            (Article.price < 5, "0-5"),
            (Article.price < 10, "5-10"),
            (Article.price < 20, "10-20"),
            (Article.price < 50, "20-50"),
            else_="50+",
        )

        result = await self.db.execute(
            select(
                price_range.label("price_range"),
                func.count().label("count"),
            )
            .join(ItemList, Article.item_list_id == ItemList.id)
            .where(
                ItemList.edition_id == edition_id,
                Article.status.in_(sellable_statuses),
            )
            .group_by(price_range)
        )

        # Ensure all ranges are present, in order
        range_order = ["0-5", "5-10", "10-20", "20-50", "50+"]
        range_counts = {r: 0 for r in range_order}
        for price_range_val, count in result.all():
            range_counts[price_range_val] = count

        return [{"range": r, "count": range_counts[r]} for r in range_order]
