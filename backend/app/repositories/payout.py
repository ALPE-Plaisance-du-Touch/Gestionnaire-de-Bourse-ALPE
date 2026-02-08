"""Payout repository for database operations."""

from decimal import Decimal

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import ItemList, User
from app.models.item_list import ListStatus
from app.models.payout import Payout, PayoutStatus


class PayoutRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, payout: Payout) -> Payout:
        self.db.add(payout)
        await self.db.flush()
        return payout

    async def create_bulk(self, payouts: list[Payout]) -> list[Payout]:
        self.db.add_all(payouts)
        await self.db.flush()
        return payouts

    async def get_by_id(self, payout_id: str) -> Payout | None:
        result = await self.db.execute(
            select(Payout)
            .options(
                joinedload(Payout.item_list).joinedload(ItemList.articles),
                joinedload(Payout.item_list).joinedload(ItemList.depositor),
                joinedload(Payout.depositor),
                joinedload(Payout.processed_by),
            )
            .where(Payout.id == payout_id)
        )
        return result.unique().scalar_one_or_none()

    async def get_by_item_list_id(self, item_list_id: str) -> Payout | None:
        result = await self.db.execute(
            select(Payout).where(Payout.item_list_id == item_list_id)
        )
        return result.scalar_one_or_none()

    async def list_by_edition(
        self,
        edition_id: str,
        offset: int = 0,
        limit: int = 20,
        status: str | None = None,
        search: str | None = None,
    ) -> tuple[list[Payout], int]:
        base_query = (
            select(Payout)
            .join(ItemList, Payout.item_list_id == ItemList.id)
            .where(ItemList.edition_id == edition_id)
        )

        if status:
            base_query = base_query.where(Payout.status == status)
        if search:
            base_query = base_query.join(
                User, Payout.depositor_id == User.id
            ).where(
                (User.first_name.ilike(f"%{search}%"))
                | (User.last_name.ilike(f"%{search}%"))
            )

        # Count
        count_result = await self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        # Fetch with relations
        result = await self.db.execute(
            base_query
            .options(
                joinedload(Payout.item_list),
                joinedload(Payout.depositor),
                joinedload(Payout.processed_by),
            )
            .order_by(ItemList.number)
            .offset(offset)
            .limit(limit)
        )
        payouts = list(result.unique().scalars().all())

        return payouts, total

    async def get_stats(self, edition_id: str) -> dict:
        # Aggregated stats
        result = await self.db.execute(
            select(
                Payout.status,
                func.count().label("count"),
                func.coalesce(func.sum(Payout.gross_amount), 0).label("total_gross"),
                func.coalesce(func.sum(Payout.commission_amount), 0).label("total_commission"),
                func.coalesce(func.sum(Payout.list_fees), 0).label("total_fees"),
                func.coalesce(func.sum(Payout.net_amount), 0).label("total_net"),
                func.coalesce(func.sum(Payout.total_articles), 0).label("total_articles"),
                func.coalesce(func.sum(Payout.sold_articles), 0).label("sold_articles"),
                func.coalesce(func.sum(Payout.unsold_articles), 0).label("unsold_articles"),
            )
            .join(ItemList, Payout.item_list_id == ItemList.id)
            .where(ItemList.edition_id == edition_id)
            .group_by(Payout.status)
        )
        rows = result.all()

        total_sales = Decimal("0.00")
        total_commission = Decimal("0.00")
        total_list_fees = Decimal("0.00")
        total_net = Decimal("0.00")
        total_payouts = 0
        total_articles = 0
        sold_articles = 0
        unsold_articles = 0
        counts_by_status = {s.value: 0 for s in PayoutStatus}

        for status, count, gross, commission, fees, net, arts, sold, unsold in rows:
            total_payouts += count
            total_sales += Decimal(str(gross))
            total_commission += Decimal(str(commission))
            total_list_fees += Decimal(str(fees))
            total_net += Decimal(str(net))
            total_articles += int(arts)
            sold_articles += int(sold)
            unsold_articles += int(unsold)
            counts_by_status[status] = count

        return {
            "total_sales": total_sales,
            "total_commission": total_commission,
            "total_list_fees": total_list_fees,
            "total_net": total_net,
            "total_payouts": total_payouts,
            "payouts_pending": counts_by_status.get(PayoutStatus.PENDING.value, 0),
            "payouts_ready": counts_by_status.get(PayoutStatus.READY.value, 0),
            "payouts_paid": counts_by_status.get(PayoutStatus.PAID.value, 0),
            "payouts_cancelled": counts_by_status.get(PayoutStatus.CANCELLED.value, 0),
            "total_articles": total_articles,
            "sold_articles": sold_articles,
            "unsold_articles": unsold_articles,
        }

    async def delete_unpaid_by_edition(self, edition_id: str) -> int:
        # Get item_list_ids for this edition
        subquery = select(ItemList.id).where(ItemList.edition_id == edition_id)

        result = await self.db.execute(
            delete(Payout)
            .where(
                Payout.item_list_id.in_(subquery),
                Payout.status.in_([PayoutStatus.PENDING.value, PayoutStatus.READY.value]),
            )
            .execution_options(synchronize_session="fetch")
        )
        return result.rowcount

    async def update(self, payout: Payout) -> Payout:
        await self.db.flush()
        await self.db.refresh(payout)
        return payout
