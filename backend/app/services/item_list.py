"""ItemList service for business logic."""

from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import (
    DeclarationDeadlinePassedError,
    EditionNotFoundError,
    NotFoundError,
    ValidationError,
)
from app.models import Edition, ItemList, User
from app.models.item_list import ListStatus, ListType
from app.repositories import EditionRepository, ItemListRepository
from app.schemas import ItemListCreate


# Maximum lists per depositor by list type
MAX_LISTS_STANDARD = 2
MAX_LISTS_1000 = 2  # ALPE members
MAX_LISTS_2000 = 4  # Family/friends (2 persons x 2 lists)


class ItemListNotFoundError(NotFoundError):
    """Item list not found."""

    def __init__(self, list_id: str):
        super().__init__(f"Item list {list_id} not found")


class MaxListsExceededError(ValidationError):
    """Maximum number of lists exceeded."""

    def __init__(self, max_lists: int, list_type: str):
        super().__init__(
            f"Vous avez atteint le nombre maximum de {max_lists} listes pour le type '{list_type}'",
            field="list_type",
        )


class ListNotDraftError(ValidationError):
    """List is not in draft status."""

    def __init__(self):
        super().__init__(
            "Cette liste ne peut plus être modifiée car elle a été validée",
            field="status",
        )


class ListAlreadyValidatedError(ValidationError):
    """List has already been validated."""

    def __init__(self):
        super().__init__(
            "Cette liste a déjà été validée",
            field="status",
        )


class ItemListService:
    """Service for item list business logic."""

    def __init__(self, db: AsyncSession):
        """Initialize service with database session."""
        self.db = db
        self.repository = ItemListRepository(db)
        self.edition_repo = EditionRepository(db)

    async def create_list(
        self,
        depositor: User,
        edition_id: str,
        data: ItemListCreate,
    ) -> ItemList:
        """
        Create a new item list for a depositor.

        Args:
            depositor: User creating the list
            edition_id: Edition ID
            data: List creation data

        Returns:
            Created item list

        Raises:
            EditionNotFoundError: If edition not found
            DeclarationDeadlinePassedError: If deadline has passed
            MaxListsExceededError: If max lists reached
        """
        # Get edition
        edition = await self.edition_repo.get_by_id(edition_id)
        if not edition:
            raise EditionNotFoundError(edition_id)

        # Check declaration deadline
        if not self._can_modify_lists(edition):
            raise DeclarationDeadlinePassedError(edition_id)

        # Check max lists
        current_count = await self.repository.count_by_depositor_and_edition(
            depositor.id, edition_id
        )

        max_lists = self._get_max_lists(data.list_type)
        if current_count >= max_lists:
            raise MaxListsExceededError(max_lists, data.list_type.value)

        # Get next list number
        number = await self.repository.get_next_list_number(edition_id, data.list_type)

        return await self.repository.create(
            depositor=depositor,
            edition=edition,
            list_type=data.list_type,
            number=number,
        )

    async def get_list(
        self, list_id: str, *, load_articles: bool = False
    ) -> ItemList:
        """
        Get an item list by ID.

        Args:
            list_id: List ID
            load_articles: Whether to load articles

        Returns:
            Item list

        Raises:
            ItemListNotFoundError: If list not found
        """
        item_list = await self.repository.get_by_id(
            list_id, load_articles=load_articles
        )
        if not item_list:
            raise ItemListNotFoundError(list_id)
        return item_list

    async def get_depositor_lists(
        self,
        depositor_id: str,
        edition_id: str,
        *,
        load_articles: bool = False,
    ) -> list[ItemList]:
        """
        Get all lists for a depositor in an edition.

        Args:
            depositor_id: Depositor's user ID
            edition_id: Edition ID
            load_articles: Whether to load articles

        Returns:
            List of item lists
        """
        return await self.repository.get_by_depositor_and_edition(
            depositor_id, edition_id, load_articles=load_articles
        )

    async def get_depositor_lists_summary(
        self,
        depositor_id: str,
        edition_id: str,
    ) -> dict:
        """
        Get summary of depositor's lists for an edition.

        Returns dict with:
            - lists: list of ItemList
            - total_lists: count of lists
            - max_lists: maximum allowed
            - can_create_more: bool
        """
        lists = await self.repository.get_by_depositor_and_edition(
            depositor_id, edition_id, load_articles=True
        )

        # Determine max lists based on list type (use first list's type or standard)
        if lists:
            list_type = ListType(lists[0].list_type)
        else:
            list_type = ListType.STANDARD

        max_lists = self._get_max_lists(list_type)
        can_create_more = len(lists) < max_lists

        # Also check edition deadline
        edition = await self.edition_repo.get_by_id(edition_id)
        if edition and not self._can_modify_lists(edition):
            can_create_more = False

        return {
            "lists": lists,
            "total_lists": len(lists),
            "max_lists": max_lists,
            "can_create_more": can_create_more,
        }

    async def validate_list(
        self,
        list_id: str,
        depositor: User,
        *,
        confirmation_accepted: bool,
    ) -> ItemList:
        """
        Validate a list (final confirmation).

        Args:
            list_id: List ID
            depositor: User validating (must be owner)
            confirmation_accepted: User accepted terms

        Returns:
            Validated item list

        Raises:
            ItemListNotFoundError: If list not found
            ValidationError: If user is not owner or confirmation not accepted
            ListAlreadyValidatedError: If already validated
        """
        item_list = await self.get_list(list_id, load_articles=True)

        # Check ownership
        if item_list.depositor_id != depositor.id:
            raise ValidationError(
                "Vous n'êtes pas autorisé à valider cette liste",
                field="depositor_id",
            )

        # Check if already validated
        if item_list.is_validated:
            raise ListAlreadyValidatedError()

        # Check confirmation
        if not confirmation_accepted:
            raise ValidationError(
                "Vous devez accepter les conditions de dépôt",
                field="confirmation_accepted",
            )

        # Check that list has at least one article
        if item_list.article_count == 0:
            raise ValidationError(
                "La liste doit contenir au moins un article",
                field="articles",
            )

        # Check all articles have conformity certified
        for article in item_list.articles:
            if not article.conformity_certified:
                raise ValidationError(
                    "Tous les articles doivent avoir la certification de conformité cochée",
                    field="conformity_certified",
                )

        return await self.repository.validate_list(item_list)

    async def delete_list(self, list_id: str, depositor: User) -> None:
        """
        Delete an item list.

        Only draft lists with no articles can be deleted.

        Args:
            list_id: List ID
            depositor: User deleting (must be owner)

        Raises:
            ItemListNotFoundError: If list not found
            ValidationError: If user is not owner or list cannot be deleted
        """
        item_list = await self.get_list(list_id, load_articles=True)

        # Check ownership
        if item_list.depositor_id != depositor.id:
            raise ValidationError(
                "Vous n'êtes pas autorisé à supprimer cette liste",
                field="depositor_id",
            )

        # Check status
        if item_list.status != ListStatus.DRAFT.value:
            raise ListNotDraftError()

        # Check if list has articles
        if item_list.article_count > 0:
            raise ValidationError(
                "Vous devez supprimer tous les articles avant de supprimer la liste",
                field="articles",
            )

        await self.repository.delete(item_list)

    async def check_can_modify(
        self, list_id: str, depositor: User
    ) -> tuple[ItemList, Edition]:
        """
        Check if a list can be modified by the depositor.

        Returns tuple of (item_list, edition) if modification is allowed.

        Raises appropriate errors if not allowed.
        """
        item_list = await self.get_list(list_id)

        # Check ownership
        if item_list.depositor_id != depositor.id:
            raise ValidationError(
                "Vous n'êtes pas autorisé à modifier cette liste",
                field="depositor_id",
            )

        # Check status
        if item_list.is_validated:
            raise ListNotDraftError()

        # Check edition deadline
        edition = await self.edition_repo.get_by_id(item_list.edition_id)
        if not edition:
            raise EditionNotFoundError(item_list.edition_id)

        if not self._can_modify_lists(edition):
            raise DeclarationDeadlinePassedError(edition.id)

        return item_list, edition

    def _can_modify_lists(self, edition: Edition) -> bool:
        """Check if lists can be modified for this edition."""
        # Lists can be modified if:
        # 1. Edition is in appropriate status
        # 2. Declaration deadline has not passed

        allowed_statuses = ["registrations_open", "configured"]
        if edition.status not in allowed_statuses:
            return False

        # Check deadline if set
        if edition.declaration_deadline:
            if datetime.utcnow() > edition.declaration_deadline:
                return False

        return True

    def _get_max_lists(self, list_type: ListType) -> int:
        """Get maximum lists allowed for a list type."""
        if list_type == ListType.LIST_2000:
            return MAX_LISTS_2000
        return MAX_LISTS_STANDARD
