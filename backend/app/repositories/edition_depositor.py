"""EditionDepositor repository for database operations."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import DepositSlot, User
from app.models.edition_depositor import EditionDepositor


class EditionDepositorRepository:
    """Repository for edition depositor database operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository with database session."""
        self.db = db

    async def get_by_id(self, depositor_id: str) -> EditionDepositor | None:
        """Get an edition depositor by ID."""
        result = await self.db.execute(
            select(EditionDepositor)
            .options(
                joinedload(EditionDepositor.user),
                joinedload(EditionDepositor.deposit_slot),
            )
            .where(EditionDepositor.id == depositor_id)
        )
        return result.scalar_one_or_none()

    async def get_by_edition_and_user(
        self, edition_id: str, user_id: str
    ) -> EditionDepositor | None:
        """Get an edition depositor by edition and user ID."""
        result = await self.db.execute(
            select(EditionDepositor).where(
                EditionDepositor.edition_id == edition_id,
                EditionDepositor.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def exists(self, edition_id: str, user_id: str) -> bool:
        """Check if a depositor is registered for an edition."""
        result = await self.db.execute(
            select(func.count())
            .select_from(EditionDepositor)
            .where(
                EditionDepositor.edition_id == edition_id,
                EditionDepositor.user_id == user_id,
            )
        )
        return result.scalar_one() > 0

    async def create(
        self,
        edition_id: str,
        user_id: str,
        *,
        deposit_slot_id: str | None = None,
        list_type: str = "standard",
        billetweb_order_ref: str | None = None,
        billetweb_session: str | None = None,
        billetweb_tarif: str | None = None,
        import_log_id: str | None = None,
        postal_code: str | None = None,
        city: str | None = None,
        address: str | None = None,
        imported_at=None,
    ) -> EditionDepositor:
        """Create a new edition depositor association."""
        depositor = EditionDepositor(
            edition_id=edition_id,
            user_id=user_id,
            deposit_slot_id=deposit_slot_id,
            list_type=list_type,
            billetweb_order_ref=billetweb_order_ref,
            billetweb_session=billetweb_session,
            billetweb_tarif=billetweb_tarif,
            import_log_id=import_log_id,
            postal_code=postal_code,
            city=city,
            address=address,
            imported_at=imported_at,
        )

        self.db.add(depositor)
        await self.db.commit()
        await self.db.refresh(depositor)

        return depositor

    async def delete(self, depositor: EditionDepositor) -> None:
        """Delete an edition depositor."""
        await self.db.delete(depositor)
        await self.db.commit()

    async def list_by_edition(
        self,
        edition_id: str,
        *,
        list_type: str | None = None,
        slot_id: str | None = None,
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[EditionDepositor], int]:
        """List depositors for an edition with filtering and pagination."""
        query = (
            select(EditionDepositor)
            .options(
                joinedload(EditionDepositor.user),
                joinedload(EditionDepositor.deposit_slot),
            )
            .where(EditionDepositor.edition_id == edition_id)
        )

        # Apply filters
        if list_type:
            query = query.where(EditionDepositor.list_type == list_type)
        if slot_id:
            query = query.where(EditionDepositor.deposit_slot_id == slot_id)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        # Apply pagination and ordering
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(EditionDepositor.created_at.desc())

        result = await self.db.execute(query)
        depositors = list(result.unique().scalars().all())

        return depositors, total

    async def count_by_edition(self, edition_id: str) -> int:
        """Count total depositors for an edition."""
        result = await self.db.execute(
            select(func.count())
            .select_from(EditionDepositor)
            .where(EditionDepositor.edition_id == edition_id)
        )
        return result.scalar_one()

    async def count_by_slot(self, slot_id: str) -> int:
        """Count depositors registered for a specific slot."""
        result = await self.db.execute(
            select(func.count())
            .select_from(EditionDepositor)
            .where(EditionDepositor.deposit_slot_id == slot_id)
        )
        return result.scalar_one()

    async def get_depositor_emails_for_edition(self, edition_id: str) -> list[str]:
        """Get all depositor emails for an edition."""
        result = await self.db.execute(
            select(User.email)
            .join(EditionDepositor, EditionDepositor.user_id == User.id)
            .where(EditionDepositor.edition_id == edition_id)
        )
        return [row[0] for row in result.all()]
