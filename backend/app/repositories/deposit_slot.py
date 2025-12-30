"""Deposit slot repository for database operations."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DepositSlot


class DepositSlotRepository:
    """Repository for deposit slot database operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository with database session."""
        self.db = db

    async def get_by_id(self, slot_id: str) -> DepositSlot | None:
        """Get a deposit slot by ID."""
        result = await self.db.execute(
            select(DepositSlot).where(DepositSlot.id == slot_id)
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        edition_id: str,
        start_datetime: datetime,
        end_datetime: datetime,
        max_capacity: int = 20,
        reserved_for_locals: bool = False,
        description: str | None = None,
    ) -> DepositSlot:
        """Create a new deposit slot."""
        slot = DepositSlot(
            edition_id=edition_id,
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            max_capacity=max_capacity,
            reserved_for_locals=reserved_for_locals,
            description=description,
        )

        self.db.add(slot)
        await self.db.commit()
        await self.db.refresh(slot)

        return slot

    async def update(self, slot: DepositSlot, **kwargs) -> DepositSlot:
        """Update a deposit slot's attributes."""
        for key, value in kwargs.items():
            if hasattr(slot, key) and value is not None:
                setattr(slot, key, value)

        await self.db.commit()
        await self.db.refresh(slot)

        return slot

    async def delete(self, slot: DepositSlot) -> None:
        """Delete a deposit slot."""
        await self.db.delete(slot)
        await self.db.commit()

    async def list_by_edition(self, edition_id: str) -> tuple[list[DepositSlot], int]:
        """List all deposit slots for an edition, ordered by start time."""
        query = (
            select(DepositSlot)
            .where(DepositSlot.edition_id == edition_id)
            .order_by(DepositSlot.start_datetime)
        )

        result = await self.db.execute(query)
        slots = list(result.scalars().all())

        return slots, len(slots)

    async def delete_all_by_edition(self, edition_id: str) -> int:
        """Delete all deposit slots for an edition. Returns count of deleted slots."""
        # Get all slots for the edition
        slots, count = await self.list_by_edition(edition_id)

        for slot in slots:
            await self.db.delete(slot)

        await self.db.commit()

        return count

    async def has_overlapping_slot(
        self,
        edition_id: str,
        start_datetime: datetime,
        end_datetime: datetime,
        exclude_slot_id: str | None = None,
    ) -> bool:
        """Check if there's an overlapping slot for the edition."""
        query = (
            select(func.count())
            .select_from(DepositSlot)
            .where(DepositSlot.edition_id == edition_id)
            .where(
                # Overlapping condition: starts before the other ends AND ends after the other starts
                DepositSlot.start_datetime < end_datetime,
                DepositSlot.end_datetime > start_datetime,
            )
        )

        if exclude_slot_id:
            query = query.where(DepositSlot.id != exclude_slot_id)

        result = await self.db.execute(query)
        return result.scalar_one() > 0
