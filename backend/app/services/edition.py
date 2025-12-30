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
from app.schemas import EditionCreate, EditionUpdate


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

        # Additional validation for specific transitions
        if new_status == EditionStatus.CONFIGURED:
            # For now, no additional validation required for US-006
            # US-007 will add validation for required configuration fields
            pass

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

    async def get_active_edition(self) -> Edition | None:
        """
        Get the currently active edition.

        Returns:
            Active edition or None
        """
        return await self.repository.get_active_edition()
