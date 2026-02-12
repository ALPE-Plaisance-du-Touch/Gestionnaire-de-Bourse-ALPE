"""BilletwebImportLog repository for database operations."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.billetweb_import_log import BilletwebImportLog


class BilletwebImportLogRepository:
    """Repository for Billetweb import log database operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository with database session."""
        self.db = db

    async def get_by_id(self, log_id: str) -> BilletwebImportLog | None:
        """Get an import log by ID."""
        result = await self.db.execute(
            select(BilletwebImportLog)
            .options(joinedload(BilletwebImportLog.imported_by))
            .where(BilletwebImportLog.id == log_id)
        )
        return result.scalar_one_or_none()

    async def list_by_edition(
        self,
        edition_id: str,
        *,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[BilletwebImportLog], int]:
        """List import logs for an edition with pagination."""
        query = (
            select(BilletwebImportLog)
            .options(joinedload(BilletwebImportLog.imported_by))
            .where(BilletwebImportLog.edition_id == edition_id)
        )

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        # Apply pagination and ordering (most recent first)
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(BilletwebImportLog.import_started_at.desc())

        result = await self.db.execute(query)
        logs = list(result.scalars().all())

        return logs, total

    async def count_imports_for_edition(self, edition_id: str) -> int:
        """Count total imports for an edition."""
        result = await self.db.execute(
            select(func.count())
            .select_from(BilletwebImportLog)
            .where(BilletwebImportLog.edition_id == edition_id)
        )
        return result.scalar_one()

    async def get_total_imported_for_edition(self, edition_id: str) -> int:
        """Get total number of rows imported across all imports for an edition."""
        result = await self.db.execute(
            select(func.sum(BilletwebImportLog.rows_imported))
            .where(BilletwebImportLog.edition_id == edition_id)
        )
        return result.scalar_one() or 0

    async def get_latest_import(self, edition_id: str) -> BilletwebImportLog | None:
        """Get the most recent import for an edition."""
        result = await self.db.execute(
            select(BilletwebImportLog)
            .options(joinedload(BilletwebImportLog.imported_by))
            .where(BilletwebImportLog.edition_id == edition_id)
            .order_by(BilletwebImportLog.import_started_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()
