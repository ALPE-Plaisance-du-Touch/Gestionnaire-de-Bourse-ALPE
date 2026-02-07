"""ItemList repository for database operations."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import Edition, ItemList, User
from app.models.edition_depositor import EditionDepositor
from app.models.item_list import LABEL_COLORS, ListStatus, ListType


class ItemListRepository:
    """Repository for item list database operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository with database session."""
        self.db = db

    async def get_by_id(
        self, item_list_id: str, *, load_articles: bool = False
    ) -> ItemList | None:
        """Get an item list by ID."""
        query = select(ItemList).where(ItemList.id == item_list_id)

        if load_articles:
            query = query.options(joinedload(ItemList.articles))

        query = query.options(
            joinedload(ItemList.depositor), joinedload(ItemList.edition)
        )

        result = await self.db.execute(query)
        return result.unique().scalar_one_or_none()

    async def get_by_depositor_and_edition(
        self,
        depositor_id: str,
        edition_id: str,
        *,
        load_articles: bool = False,
    ) -> list[ItemList]:
        """Get all lists for a depositor in an edition."""
        query = (
            select(ItemList)
            .where(ItemList.depositor_id == depositor_id)
            .where(ItemList.edition_id == edition_id)
            .order_by(ItemList.number)
        )

        if load_articles:
            query = query.options(joinedload(ItemList.articles))

        result = await self.db.execute(query)
        return list(result.unique().scalars().all())

    async def count_by_depositor_and_edition(
        self, depositor_id: str, edition_id: str
    ) -> int:
        """Count lists for a depositor in an edition."""
        result = await self.db.execute(
            select(func.count())
            .select_from(ItemList)
            .where(ItemList.depositor_id == depositor_id)
            .where(ItemList.edition_id == edition_id)
        )
        return result.scalar_one()

    async def get_next_list_number(
        self, edition_id: str, list_type: ListType
    ) -> int:
        """Get the next available list number for an edition and type.

        Number ranges:
        - Standard: 100-699 (100, 200, 300, 400, 500, 600 ranges)
        - LIST_1000: 1000-1999
        - LIST_2000: 2000-2999
        """
        if list_type == ListType.LIST_1000:
            min_number = 1000
            max_number = 1999
        elif list_type == ListType.LIST_2000:
            min_number = 2000
            max_number = 2999
        else:
            # Standard lists start at 100
            min_number = 100
            max_number = 699

        # Get the max number currently in use
        result = await self.db.execute(
            select(func.max(ItemList.number))
            .where(ItemList.edition_id == edition_id)
            .where(ItemList.number >= min_number)
            .where(ItemList.number <= max_number)
        )
        max_current = result.scalar_one()

        if max_current is None:
            return min_number

        return max_current + 1

    async def create(
        self,
        depositor: User,
        edition: Edition,
        list_type: ListType,
        number: int,
    ) -> ItemList:
        """Create a new item list."""
        # Determine label color based on list type and number
        if list_type == ListType.LIST_1000:
            label_color = LABEL_COLORS[1000]
        elif list_type == ListType.LIST_2000:
            label_color = LABEL_COLORS[2000]
        else:
            # Standard list color based on number range
            label_color = None
            for threshold in sorted(LABEL_COLORS.keys(), reverse=True):
                if threshold < 1000 and number >= threshold:
                    label_color = LABEL_COLORS[threshold]
                    break

        item_list = ItemList(
            number=number,
            list_type=list_type.value,
            label_color=label_color,
            status=ListStatus.DRAFT.value,
            depositor_id=depositor.id,
            edition_id=edition.id,
        )

        self.db.add(item_list)
        await self.db.commit()
        await self.db.refresh(item_list)

        return await self.get_by_id(item_list.id)

    async def update(self, item_list: ItemList, **kwargs) -> ItemList:
        """Update an item list's attributes."""
        for key, value in kwargs.items():
            if hasattr(item_list, key) and value is not None:
                setattr(item_list, key, value)

        await self.db.commit()
        await self.db.refresh(item_list)

        return await self.get_by_id(item_list.id)

    async def validate_list(self, item_list: ItemList) -> ItemList:
        """Mark a list as validated."""
        item_list.is_validated = True
        item_list.validated_at = datetime.utcnow()
        item_list.status = ListStatus.VALIDATED.value

        await self.db.commit()
        await self.db.refresh(item_list)

        return await self.get_by_id(item_list.id, load_articles=True)

    async def delete(self, item_list: ItemList) -> None:
        """Delete an item list (only if draft with no articles)."""
        await self.db.delete(item_list)
        await self.db.commit()

    async def list_by_edition(
        self,
        edition_id: str,
        *,
        list_type: str | None = None,
        status: str | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[ItemList], int]:
        """List all item lists for an edition with pagination."""
        query = (
            select(ItemList)
            .options(joinedload(ItemList.depositor))
            .where(ItemList.edition_id == edition_id)
        )

        if list_type:
            query = query.where(ItemList.list_type == list_type)

        if status:
            query = query.where(ItemList.status == status)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        # Apply pagination and ordering
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(ItemList.number)

        result = await self.db.execute(query)
        lists = list(result.unique().scalars().all())

        return lists, total

    async def list_by_edition_with_articles(self, edition_id: str) -> list[ItemList]:
        """Get all lists for an edition with articles loaded (for payout calculation)."""
        query = (
            select(ItemList)
            .options(joinedload(ItemList.articles), joinedload(ItemList.depositor))
            .where(ItemList.edition_id == edition_id)
            .order_by(ItemList.number)
        )
        result = await self.db.execute(query)
        return list(result.unique().scalars().all())

    async def get_lists_for_labels(
        self, edition_id: str, *, depositor_id: str | None = None
    ) -> list[ItemList]:
        """Get validated lists ready for label generation."""
        query = (
            select(ItemList)
            .options(joinedload(ItemList.articles), joinedload(ItemList.depositor))
            .where(ItemList.edition_id == edition_id)
            .where(ItemList.is_validated == True)  # noqa: E712
        )

        if depositor_id:
            query = query.where(ItemList.depositor_id == depositor_id)

        query = query.order_by(ItemList.number)

        result = await self.db.execute(query)
        return list(result.unique().scalars().all())

    async def get_lists_for_labels_by_slot(
        self, edition_id: str, slot_id: str
    ) -> list[ItemList]:
        """Get validated lists for depositors assigned to a specific deposit slot."""
        # Find depositor IDs assigned to this slot
        dep_query = select(EditionDepositor.user_id).where(
            EditionDepositor.edition_id == edition_id,
            EditionDepositor.deposit_slot_id == slot_id,
        )
        dep_result = await self.db.execute(dep_query)
        depositor_ids = [row[0] for row in dep_result.all()]

        if not depositor_ids:
            return []

        query = (
            select(ItemList)
            .options(joinedload(ItemList.articles), joinedload(ItemList.depositor))
            .where(ItemList.edition_id == edition_id)
            .where(ItemList.is_validated == True)  # noqa: E712
            .where(ItemList.depositor_id.in_(depositor_ids))
            .order_by(ItemList.number)
        )

        result = await self.db.execute(query)
        return list(result.unique().scalars().all())

    async def get_lists_for_labels_by_depositors(
        self, edition_id: str, depositor_ids: list[str]
    ) -> list[ItemList]:
        """Get validated lists for specific depositors."""
        query = (
            select(ItemList)
            .options(joinedload(ItemList.articles), joinedload(ItemList.depositor))
            .where(ItemList.edition_id == edition_id)
            .where(ItemList.is_validated == True)  # noqa: E712
            .where(ItemList.depositor_id.in_(depositor_ids))
            .order_by(ItemList.number)
        )

        result = await self.db.execute(query)
        return list(result.unique().scalars().all())

    async def get_label_stats(self, edition_id: str) -> dict:
        """Get label generation statistics for an edition."""
        # Count validated lists
        validated_query = (
            select(ItemList)
            .options(joinedload(ItemList.articles))
            .where(ItemList.edition_id == edition_id)
            .where(ItemList.is_validated == True)  # noqa: E712
        )
        result = await self.db.execute(validated_query)
        validated_lists = list(result.unique().scalars().all())

        total_lists = len(validated_lists)
        total_labels = sum(len(il.articles) for il in validated_lists)
        labels_generated = sum(1 for il in validated_lists if il.labels_printed)
        depositor_ids = {il.depositor_id for il in validated_lists}

        return {
            "total_depositors": len(depositor_ids),
            "total_lists": total_lists,
            "total_labels": total_labels,
            "labels_generated": labels_generated,
            "labels_pending": total_lists - labels_generated,
        }

    async def mark_labels_printed(self, item_list: ItemList) -> ItemList:
        """Mark labels as printed for a list."""
        item_list.labels_printed = True
        item_list.labels_printed_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(item_list)

        return item_list
