"""Edition service for business logic."""

from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import (
    EditionClosedError,
    EditionNotFoundError,
    ValidationError,
)
from app.models import Edition, User
from app.models.edition import EditionStatus
from app.repositories import EditionRepository
from app.repositories.payout import PayoutRepository
from app.schemas import EditionCreate, EditionUpdate
from app.schemas.edition import ClosureCheckItem, ClosureCheckResponse


class EditionService:
    """Service for edition business logic."""

    # Valid status transitions
    VALID_TRANSITIONS = {
        EditionStatus.DRAFT: [EditionStatus.CONFIGURED],
        EditionStatus.CONFIGURED: [EditionStatus.DRAFT, EditionStatus.REGISTRATIONS_OPEN],
        EditionStatus.REGISTRATIONS_OPEN: [EditionStatus.CONFIGURED, EditionStatus.IN_PROGRESS],
        EditionStatus.IN_PROGRESS: [EditionStatus.CLOSED],
        EditionStatus.CLOSED: [EditionStatus.ARCHIVED],
        EditionStatus.ARCHIVED: [],  # Terminal state
    }

    def __init__(self, db: AsyncSession):
        """Initialize service with database session."""
        self.db = db
        self.repository = EditionRepository(db)

    async def create_edition(
        self,
        data: EditionCreate,
        created_by: User,
    ) -> Edition:
        """
        Create a new edition.

        Args:
            data: Edition creation data
            created_by: User creating the edition (must be admin)

        Returns:
            Created edition

        Raises:
            ValidationError: If name already exists or dates are invalid
        """
        # Check for duplicate name
        if await self.repository.name_exists(data.name):
            raise ValidationError(
                f"Une édition avec le nom '{data.name}' existe déjà",
                field="name",
            )

        # Validate dates (already done in schema, but double-check)
        if data.end_datetime <= data.start_datetime:
            raise ValidationError(
                "La date de fin doit être postérieure à la date de début",
                field="end_datetime",
            )

        return await self.repository.create(
            name=data.name,
            start_datetime=data.start_datetime,
            end_datetime=data.end_datetime,
            location=data.location,
            description=data.description,
            created_by=created_by,
        )

    async def get_edition(self, edition_id: str) -> Edition:
        """
        Get an edition by ID.

        Args:
            edition_id: Edition ID

        Returns:
            Edition

        Raises:
            EditionNotFoundError: If edition not found
        """
        edition = await self.repository.get_by_id(edition_id)
        if not edition:
            raise EditionNotFoundError(edition_id)
        return edition

    async def list_editions(
        self,
        *,
        status: str | None = None,
        include_archived: bool = False,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[Edition], int]:
        """
        List editions with optional filtering.

        Args:
            status: Filter by status
            include_archived: Include archived editions
            page: Page number
            limit: Items per page

        Returns:
            Tuple of (editions list, total count)
        """
        return await self.repository.list_editions(
            status=status,
            include_archived=include_archived,
            page=page,
            limit=limit,
        )

    async def update_edition(
        self,
        edition_id: str,
        data: EditionUpdate,
    ) -> Edition:
        """
        Update an edition.

        Args:
            edition_id: Edition ID
            data: Update data

        Returns:
            Updated edition

        Raises:
            EditionNotFoundError: If edition not found
            EditionClosedError: If edition is closed
            ValidationError: If validation fails
        """
        edition = await self.get_edition(edition_id)

        # Check if edition is closed
        if edition.is_closed:
            raise EditionClosedError(edition_id)

        # Check for duplicate name if name is being changed
        if data.name and data.name != edition.name:
            if await self.repository.name_exists(data.name, exclude_id=edition_id):
                raise ValidationError(
                    f"Une édition avec le nom '{data.name}' existe déjà",
                    field="name",
                )

        # Validate dates if both are provided
        new_start = data.start_datetime or edition.start_datetime
        new_end = data.end_datetime or edition.end_datetime

        if new_end <= new_start:
            raise ValidationError(
                "La date de fin doit être postérieure à la date de début",
                field="end_datetime",
            )

        # Build update kwargs (exclude None values)
        update_data = data.model_dump(exclude_unset=True)

        return await self.repository.update(edition, **update_data)

    async def update_status(
        self,
        edition_id: str,
        new_status: EditionStatus,
    ) -> Edition:
        """
        Update edition status.

        Args:
            edition_id: Edition ID
            new_status: New status

        Returns:
            Updated edition

        Raises:
            EditionNotFoundError: If edition not found
            ValidationError: If transition is not allowed
        """
        edition = await self.get_edition(edition_id)
        current_status = EditionStatus(edition.status)

        # Check if transition is valid
        allowed_transitions = self.VALID_TRANSITIONS.get(current_status, [])
        if new_status not in allowed_transitions:
            raise ValidationError(
                f"Transition de '{current_status.value}' vers '{new_status.value}' non autorisée",
                field="status",
            )

        # REQ-F-019: Enforce single active edition constraint
        active_statuses = [
            EditionStatus.CONFIGURED,
            EditionStatus.REGISTRATIONS_OPEN,
            EditionStatus.IN_PROGRESS,
        ]
        if new_status in active_statuses:
            other = await self.repository.get_any_active_edition(
                exclude_id=edition.id
            )
            if other:
                raise ValidationError(
                    f"Une bourse est déjà active ({other.name}). "
                    "Clôturez-la avant d'en activer une autre.",
                    field="status",
                )

        return await self.repository.update_status(edition, new_status)

    async def delete_edition(self, edition_id: str) -> None:
        """
        Delete an edition.

        Only draft editions can be deleted.

        Args:
            edition_id: Edition ID

        Raises:
            EditionNotFoundError: If edition not found
            ValidationError: If edition is not in draft status
        """
        edition = await self.get_edition(edition_id)

        if not edition.is_draft:
            raise ValidationError(
                "Seules les éditions en brouillon peuvent être supprimées",
                field="status",
            )

        await self.repository.delete(edition)

    async def check_closure_prerequisites(
        self, edition_id: str
    ) -> ClosureCheckResponse:
        """Check all prerequisites for closing an edition."""
        edition = await self.get_edition(edition_id)
        checks: list[ClosureCheckItem] = []

        # Check 1: Edition must be in_progress
        checks.append(ClosureCheckItem(
            label="Edition en cours",
            passed=edition.status == EditionStatus.IN_PROGRESS.value,
            detail="L'edition doit etre en statut 'En cours'" if edition.status != EditionStatus.IN_PROGRESS.value else None,
        ))

        # Check 2: Retrieval end date must be passed
        retrieval_passed = (
            edition.retrieval_end_datetime is not None
            and datetime.now() > edition.retrieval_end_datetime
        )
        checks.append(ClosureCheckItem(
            label="Periode de recuperation terminee",
            passed=retrieval_passed,
            detail="La date de fin de recuperation n'est pas encore passee" if not retrieval_passed else None,
        ))

        # Check 3 & 4: Payout stats
        payout_repo = PayoutRepository(self.db)
        stats = await payout_repo.get_stats(edition_id)

        payouts_calculated = stats["total_payouts"] > 0
        checks.append(ClosureCheckItem(
            label="Reversements calcules",
            passed=payouts_calculated,
            detail="Aucun reversement n'a ete calcule" if not payouts_calculated else None,
        ))

        all_final = (
            payouts_calculated
            and stats["payouts_pending"] == 0
            and stats["payouts_ready"] == 0
        )
        checks.append(ClosureCheckItem(
            label="Tous les paiements finalises",
            passed=all_final,
            detail=f"{stats['payouts_pending'] + stats['payouts_ready']} paiement(s) en attente" if not all_final else None,
        ))

        can_close = all(c.passed for c in checks)
        return ClosureCheckResponse(can_close=can_close, checks=checks)

    async def close_edition(
        self, edition_id: str, user: User
    ) -> Edition:
        """Close an edition after validating prerequisites."""
        check = await self.check_closure_prerequisites(edition_id)
        if not check.can_close:
            failed = [c.label for c in check.checks if not c.passed]
            raise ValidationError(
                f"Impossible de cloturer : {', '.join(failed)}",
                field="status",
            )

        edition = await self.get_edition(edition_id)
        return await self.repository.close_edition(edition, user.id)

    async def archive_edition(self, edition_id: str) -> Edition:
        """Archive a closed edition."""
        edition = await self.get_edition(edition_id)

        if edition.status != EditionStatus.CLOSED.value:
            raise ValidationError(
                "Seules les editions cloturees peuvent etre archivees",
                field="status",
            )

        return await self.repository.archive_edition(edition)

    async def get_active_edition(self) -> Edition | None:
        """
        Get the currently active edition (any non-draft, non-closed status).

        Returns the highest-priority active edition:
        in_progress > registrations_open > configured.
        """
        return await self.repository.get_any_active_edition()
