"""Edition repository for database operations."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import Edition, User
from app.models.edition import EditionStatus


class EditionRepository:
    """Repository for edition database operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository with database session."""
        self.db = db

    async def get_by_id(self, edition_id: str) -> Edition | None:
        """Get an edition by ID."""
        result = await self.db.execute(
            select(Edition)
            .options(joinedload(Edition.created_by), joinedload(Edition.closed_by))
            .where(Edition.id == edition_id)
        )
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Edition | None:
        """Get an edition by name (for uniqueness check)."""
        result = await self.db.execute(select(Edition).where(Edition.name == name))
        return result.scalar_one_or_none()

    async def name_exists(self, name: str, exclude_id: str | None = None) -> bool:
        """Check if an edition name already exists."""
        query = select(func.count()).select_from(Edition).where(Edition.name == name)
        if exclude_id:
            query = query.where(Edition.id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one() > 0

    async def create(
        self,
        name: str,
        start_datetime,
        end_datetime,
        created_by: User,
        *,
        location: str | None = None,
        description: str | None = None,
    ) -> Edition:
        """Create a new edition."""
        edition = Edition(
            name=name,
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            location=location,
            description=description,
            status=EditionStatus.DRAFT.value,
            created_by_id=created_by.id,
        )

        self.db.add(edition)
        await self.db.commit()
        await self.db.refresh(edition)

        # Reload with relationships
        return await self.get_by_id(edition.id)

    async def update(self, edition: Edition, **kwargs) -> Edition:
        """Update an edition's attributes."""
        for key, value in kwargs.items():
            if hasattr(edition, key) and value is not None:
                setattr(edition, key, value)

        await self.db.commit()
        await self.db.refresh(edition)

        # Reload with relationships
        return await self.get_by_id(edition.id)

    async def update_status(self, edition: Edition, status: EditionStatus) -> Edition:
        """Update edition status."""
        edition.status = status.value
        await self.db.commit()
        await self.db.refresh(edition)
        return edition

    async def close_edition(self, edition: Edition, user_id: str) -> Edition:
        """Close an edition and record closure metadata."""
        edition.status = EditionStatus.CLOSED.value
        edition.closed_at = datetime.now()
        edition.closed_by_id = user_id
        await self.db.commit()
        await self.db.refresh(edition)
        return await self.get_by_id(edition.id)

    async def archive_edition(self, edition: Edition) -> Edition:
        """Archive a closed edition."""
        edition.status = EditionStatus.ARCHIVED.value
        edition.archived_at = datetime.now()
        await self.db.commit()
        await self.db.refresh(edition)
        return await self.get_by_id(edition.id)

    async def delete(self, edition: Edition) -> None:
        """Delete an edition."""
        await self.db.delete(edition)
        await self.db.commit()

    async def list_editions(
        self,
        *,
        status: str | None = None,
        include_archived: bool = False,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[Edition], int]:
        """List editions with filtering and pagination."""
        query = select(Edition).options(
            joinedload(Edition.created_by), joinedload(Edition.closed_by)
        )

        # Apply filters
        if status:
            query = query.where(Edition.status == status)
        elif not include_archived:
            # By default, exclude archived editions
            query = query.where(Edition.status != EditionStatus.ARCHIVED.value)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        # Apply pagination and ordering
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(Edition.start_datetime.desc())

        result = await self.db.execute(query)
        editions = list(result.scalars().all())

        return editions, total

    async def get_active_edition(self) -> Edition | None:
        """Get the currently active edition (in_progress status)."""
        result = await self.db.execute(
            select(Edition)
            .options(joinedload(Edition.created_by))
            .where(Edition.status == EditionStatus.IN_PROGRESS.value)
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_any_active_edition(
        self, *, exclude_id: str | None = None
    ) -> Edition | None:
        """Get any edition in an active status (configured, registrations_open, or in_progress).

        Returns the highest-priority active edition (in_progress > registrations_open > configured).
        """
        active_statuses = [
            EditionStatus.IN_PROGRESS.value,
            EditionStatus.REGISTRATIONS_OPEN.value,
            EditionStatus.CONFIGURED.value,
        ]
        query = (
            select(Edition)
            .options(joinedload(Edition.created_by), joinedload(Edition.closed_by))
            .where(Edition.status.in_(active_statuses))
        )
        if exclude_id:
            query = query.where(Edition.id != exclude_id)

        result = await self.db.execute(query)
        editions = list(result.scalars().all())
        if not editions:
            return None

        # Return highest-priority: in_progress > registrations_open > configured
        priority = {s: i for i, s in enumerate(active_statuses)}
        return min(editions, key=lambda e: priority.get(e.status, 99))
