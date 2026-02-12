"""Unit tests for ItemList service."""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

from app.exceptions import DeclarationDeadlinePassedError, EditionNotFoundError
from app.models import Edition, ItemList, User
from app.models.edition import EditionStatus
from app.models.item_list import ListStatus, ListType
from app.services.item_list import (
    ItemListNotFoundError,
    ItemListService,
    ListAlreadyValidatedError,
    ListNotDraftError,
    MaxListsExceededError,
)


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return AsyncMock()


@pytest.fixture
def mock_depositor():
    """Create a mock depositor user."""
    user = MagicMock(spec=User)
    user.id = "user-123"
    user.email = "depositor@example.com"
    return user


@pytest.fixture
def mock_edition():
    """Create a mock edition."""
    edition = MagicMock(spec=Edition)
    edition.id = "edition-123"
    edition.status = EditionStatus.REGISTRATIONS_OPEN.value
    # Use naive datetime (no timezone) to match the service implementation
    edition.declaration_deadline = datetime.utcnow() + timedelta(days=7)
    return edition


@pytest.fixture
def mock_item_list(mock_depositor, mock_edition):
    """Create a mock item list."""
    item_list = MagicMock(spec=ItemList)
    item_list.id = "list-123"
    item_list.number = 100
    item_list.list_type = ListType.STANDARD.value
    item_list.status = ListStatus.DRAFT.value
    item_list.is_validated = False
    item_list.depositor_id = mock_depositor.id
    item_list.edition_id = mock_edition.id
    item_list.articles = []
    item_list.article_count = 0
    item_list.clothing_count = 0
    return item_list


class TestCanModifyLists:
    """Tests for _can_modify_lists method."""

    def test_can_modify_when_registrations_open(self, mock_edition):
        """Can modify lists when edition is registrations_open."""
        mock_edition.status = EditionStatus.REGISTRATIONS_OPEN.value
        mock_edition.declaration_deadline = datetime.utcnow() + timedelta(days=7)

        service = ItemListService(AsyncMock())
        assert service._can_modify_lists(mock_edition) is True

    def test_can_modify_when_configured(self, mock_edition):
        """Can modify lists when edition is configured."""
        mock_edition.status = EditionStatus.CONFIGURED.value
        mock_edition.declaration_deadline = datetime.utcnow() + timedelta(days=7)

        service = ItemListService(AsyncMock())
        assert service._can_modify_lists(mock_edition) is True

    def test_cannot_modify_when_draft(self, mock_edition):
        """Cannot modify lists when edition is draft."""
        mock_edition.status = EditionStatus.DRAFT.value

        service = ItemListService(AsyncMock())
        assert service._can_modify_lists(mock_edition) is False

    def test_cannot_modify_when_deadline_passed(self, mock_edition):
        """Cannot modify lists when deadline has passed."""
        mock_edition.status = EditionStatus.REGISTRATIONS_OPEN.value
        mock_edition.declaration_deadline = datetime.utcnow() - timedelta(days=1)

        service = ItemListService(AsyncMock())
        assert service._can_modify_lists(mock_edition) is False

    def test_can_modify_when_no_deadline_set(self, mock_edition):
        """Can modify lists when no deadline is set."""
        mock_edition.status = EditionStatus.REGISTRATIONS_OPEN.value
        mock_edition.declaration_deadline = None

        service = ItemListService(AsyncMock())
        assert service._can_modify_lists(mock_edition) is True


class TestGetMaxLists:
    """Tests for _get_max_lists method."""

    def test_standard_list_max(self):
        """Standard list type allows 2 lists."""
        service = ItemListService(AsyncMock())
        assert service._get_max_lists(ListType.STANDARD) == 2

    def test_list_1000_max(self):
        """List 1000 type allows 2 lists."""
        service = ItemListService(AsyncMock())
        assert service._get_max_lists(ListType.LIST_1000) == 2

    def test_list_2000_max(self):
        """List 2000 type allows 4 lists."""
        service = ItemListService(AsyncMock())
        assert service._get_max_lists(ListType.LIST_2000) == 4


class TestCreateList:
    """Tests for create_list method."""

    @pytest.mark.asyncio
    async def test_create_list_success(self, mock_db, mock_depositor, mock_edition):
        """Successfully create a list."""
        service = ItemListService(mock_db)

        # Mock repository methods
        service.edition_repo.get_by_id = AsyncMock(return_value=mock_edition)
        service.repository.count_by_depositor_and_edition = AsyncMock(return_value=0)
        service.repository.get_next_list_number = AsyncMock(return_value=100)
        service.repository.create = AsyncMock(return_value=MagicMock(id="new-list"))

        from app.schemas import ItemListCreate
        result = await service.create_list(
            depositor=mock_depositor,
            edition_id=mock_edition.id,
            data=ItemListCreate(list_type=ListType.STANDARD),
        )

        assert result is not None
        service.repository.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_list_edition_not_found(self, mock_db, mock_depositor):
        """Raise error when edition not found."""
        service = ItemListService(mock_db)
        service.edition_repo.get_by_id = AsyncMock(return_value=None)

        from app.schemas import ItemListCreate
        with pytest.raises(EditionNotFoundError):
            await service.create_list(
                depositor=mock_depositor,
                edition_id="nonexistent",
                data=ItemListCreate(list_type=ListType.STANDARD),
            )

    @pytest.mark.asyncio
    async def test_create_list_deadline_passed(self, mock_db, mock_depositor, mock_edition):
        """Raise error when deadline has passed."""
        mock_edition.declaration_deadline = datetime.utcnow() - timedelta(days=1)

        service = ItemListService(mock_db)
        service.edition_repo.get_by_id = AsyncMock(return_value=mock_edition)

        from app.schemas import ItemListCreate
        with pytest.raises(DeclarationDeadlinePassedError):
            await service.create_list(
                depositor=mock_depositor,
                edition_id=mock_edition.id,
                data=ItemListCreate(list_type=ListType.STANDARD),
            )

    @pytest.mark.asyncio
    async def test_create_list_max_exceeded(self, mock_db, mock_depositor, mock_edition):
        """Raise error when max lists reached."""
        service = ItemListService(mock_db)
        service.edition_repo.get_by_id = AsyncMock(return_value=mock_edition)
        service.repository.count_by_depositor_and_edition = AsyncMock(return_value=2)

        from app.schemas import ItemListCreate
        with pytest.raises(MaxListsExceededError):
            await service.create_list(
                depositor=mock_depositor,
                edition_id=mock_edition.id,
                data=ItemListCreate(list_type=ListType.STANDARD),
            )


class TestValidateList:
    """Tests for validate_list method."""

    @pytest.mark.asyncio
    async def test_validate_list_success(self, mock_db, mock_depositor, mock_item_list):
        """Successfully validate a list."""
        mock_item_list.article_count = 5
        mock_item_list.articles = [
            MagicMock(conformity_certified=True) for _ in range(5)
        ]

        service = ItemListService(mock_db)
        service.get_list = AsyncMock(return_value=mock_item_list)
        service.repository.validate_list = AsyncMock(return_value=mock_item_list)

        result = await service.validate_list(
            list_id=mock_item_list.id,
            depositor=mock_depositor,
            confirmation_accepted=True,
        )

        assert result is not None
        service.repository.validate_list.assert_called_once()

    @pytest.mark.asyncio
    async def test_validate_list_not_owner(self, mock_db, mock_depositor, mock_item_list):
        """Raise error when user is not the owner."""
        other_user = MagicMock(spec=User)
        other_user.id = "other-user-123"

        service = ItemListService(mock_db)
        service.get_list = AsyncMock(return_value=mock_item_list)

        from app.exceptions import ValidationError
        with pytest.raises(ValidationError) as exc_info:
            await service.validate_list(
                list_id=mock_item_list.id,
                depositor=other_user,
                confirmation_accepted=True,
            )
        assert "autorisé" in str(exc_info.value.message)

    @pytest.mark.asyncio
    async def test_validate_list_already_validated(self, mock_db, mock_depositor, mock_item_list):
        """Raise error when list is already validated."""
        mock_item_list.is_validated = True

        service = ItemListService(mock_db)
        service.get_list = AsyncMock(return_value=mock_item_list)

        with pytest.raises(ListAlreadyValidatedError):
            await service.validate_list(
                list_id=mock_item_list.id,
                depositor=mock_depositor,
                confirmation_accepted=True,
            )

    @pytest.mark.asyncio
    async def test_validate_list_no_confirmation(self, mock_db, mock_depositor, mock_item_list):
        """Raise error when confirmation not accepted."""
        mock_item_list.article_count = 5

        service = ItemListService(mock_db)
        service.get_list = AsyncMock(return_value=mock_item_list)

        from app.exceptions import ValidationError
        with pytest.raises(ValidationError) as exc_info:
            await service.validate_list(
                list_id=mock_item_list.id,
                depositor=mock_depositor,
                confirmation_accepted=False,
            )
        assert "conditions" in str(exc_info.value.message)

    @pytest.mark.asyncio
    async def test_validate_list_empty(self, mock_db, mock_depositor, mock_item_list):
        """Raise error when list has no articles."""
        mock_item_list.article_count = 0

        service = ItemListService(mock_db)
        service.get_list = AsyncMock(return_value=mock_item_list)

        from app.exceptions import ValidationError
        with pytest.raises(ValidationError) as exc_info:
            await service.validate_list(
                list_id=mock_item_list.id,
                depositor=mock_depositor,
                confirmation_accepted=True,
            )
        assert "au moins un article" in str(exc_info.value.message)


class TestDeleteList:
    """Tests for delete_list method."""

    @pytest.mark.asyncio
    async def test_delete_list_success(self, mock_db, mock_depositor, mock_item_list):
        """Successfully delete a draft list."""
        mock_item_list.article_count = 0

        service = ItemListService(mock_db)
        service.get_list = AsyncMock(return_value=mock_item_list)
        service.repository.delete = AsyncMock()

        await service.delete_list(mock_item_list.id, mock_depositor)

        service.repository.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_list_not_owner(self, mock_db, mock_depositor, mock_item_list):
        """Raise error when user is not the owner."""
        other_user = MagicMock(spec=User)
        other_user.id = "other-user-123"

        service = ItemListService(mock_db)
        service.get_list = AsyncMock(return_value=mock_item_list)

        from app.exceptions import ValidationError
        with pytest.raises(ValidationError):
            await service.delete_list(mock_item_list.id, other_user)

    @pytest.mark.asyncio
    async def test_delete_list_not_draft(self, mock_db, mock_depositor, mock_item_list):
        """Raise error when list is not in draft status."""
        mock_item_list.status = ListStatus.VALIDATED.value

        service = ItemListService(mock_db)
        service.get_list = AsyncMock(return_value=mock_item_list)

        with pytest.raises(ListNotDraftError):
            await service.delete_list(mock_item_list.id, mock_depositor)

    @pytest.mark.asyncio
    async def test_delete_list_has_articles(self, mock_db, mock_depositor, mock_item_list):
        """Raise error when list has articles."""
        mock_item_list.article_count = 5

        service = ItemListService(mock_db)
        service.get_list = AsyncMock(return_value=mock_item_list)

        from app.exceptions import ValidationError
        with pytest.raises(ValidationError) as exc_info:
            await service.delete_list(mock_item_list.id, mock_depositor)
        assert "supprimer tous les articles" in str(exc_info.value.message)
