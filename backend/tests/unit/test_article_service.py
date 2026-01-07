"""Unit tests for Article service."""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

from app.exceptions import (
    ArticleNotFoundError,
    InvalidPriceError,
    MaxArticlesExceededError,
    MaxClothingExceededError,
)
from app.models import Article, Edition, ItemList, User
from app.models.article import ArticleStatus
from app.models.edition import EditionStatus
from app.models.item_list import ListStatus, ListType
from app.schemas.article import ArticleCategory, ArticleCreate, ArticleGender
from app.services.article import (
    ArticleService,
    BlacklistedCategoryError,
    CategoryLimitExceededError,
    InvalidLotError,
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
    return item_list


@pytest.fixture
def mock_article(mock_item_list):
    """Create a mock article."""
    article = MagicMock(spec=Article)
    article.id = "article-123"
    article.description = "Test article"
    article.category = "clothing"
    article.price = Decimal("5.00")
    article.line_number = 1
    article.status = ArticleStatus.DRAFT.value
    article.item_list_id = mock_item_list.id
    article.item_list = mock_item_list
    article.is_lot = False
    article.lot_quantity = None
    article.size = None
    return article


class TestParseSizeToMonths:
    """Tests for _parse_size_to_months method."""

    def test_parse_months(self):
        """Parse '18 mois' format."""
        service = ArticleService(AsyncMock())
        assert service._parse_size_to_months("18 mois") == 18
        assert service._parse_size_to_months("24 mois") == 24

    def test_parse_years(self):
        """Parse '2 ans' format."""
        service = ArticleService(AsyncMock())
        assert service._parse_size_to_months("2 ans") == 24
        assert service._parse_size_to_months("3 ans") == 36

    def test_parse_invalid(self):
        """Return None for invalid formats."""
        service = ArticleService(AsyncMock())
        assert service._parse_size_to_months("XL") is None
        assert service._parse_size_to_months("8 ans") == 96
        assert service._parse_size_to_months("invalid") is None


class TestValidatePrice:
    """Tests for _validate_price method."""

    def test_valid_price(self):
        """Valid price does not raise."""
        service = ArticleService(AsyncMock())
        service._validate_price(Decimal("5.00"), "clothing")  # Should not raise

    def test_price_too_low(self):
        """Price below minimum raises error."""
        service = ArticleService(AsyncMock())
        with pytest.raises(InvalidPriceError):
            service._validate_price(Decimal("0.50"), "clothing")

    def test_stroller_price_too_high(self):
        """Stroller price above max raises error."""
        service = ArticleService(AsyncMock())
        with pytest.raises(InvalidPriceError):
            service._validate_price(Decimal("200.00"), "nursery", "stroller")

    def test_stroller_price_valid(self):
        """Valid stroller price does not raise."""
        service = ArticleService(AsyncMock())
        service._validate_price(Decimal("150.00"), "nursery", "stroller")


class TestValidateLot:
    """Tests for _validate_lot method."""

    def test_valid_lot(self):
        """Valid lot does not raise."""
        service = ArticleService(AsyncMock())
        service._validate_lot(3, "18 mois")  # Should not raise

    def test_lot_no_quantity(self):
        """Lot without quantity raises error."""
        service = ArticleService(AsyncMock())
        with pytest.raises(InvalidLotError):
            service._validate_lot(None, "18 mois")

    def test_lot_too_many_items(self):
        """Lot with too many items raises error."""
        service = ArticleService(AsyncMock())
        with pytest.raises(InvalidLotError) as exc_info:
            service._validate_lot(5, "18 mois")
        assert "3 articles maximum" in str(exc_info.value.message)

    def test_lot_age_too_old(self):
        """Lot for items over 36 months raises error."""
        service = ArticleService(AsyncMock())
        with pytest.raises(InvalidLotError) as exc_info:
            service._validate_lot(3, "4 ans")
        assert "36 mois" in str(exc_info.value.message)


class TestValidateArticleConstraints:
    """Tests for _validate_article_constraints method."""

    @pytest.mark.asyncio
    async def test_max_articles_exceeded(self, mock_db, mock_item_list):
        """Raise error when max articles reached."""
        service = ArticleService(mock_db)
        service.repository.count_by_list_id = AsyncMock(return_value=24)

        data = ArticleCreate(
            category=ArticleCategory.CLOTHING,
            description="Test",
            price=Decimal("5.00"),
            conformity_certified=True,
        )

        with pytest.raises(MaxArticlesExceededError):
            await service._validate_article_constraints(mock_item_list, data)

    @pytest.mark.asyncio
    async def test_max_clothing_exceeded(self, mock_db, mock_item_list):
        """Raise error when max clothing reached."""
        service = ArticleService(mock_db)
        service.repository.count_by_list_id = AsyncMock(return_value=10)
        service.repository.count_clothing = AsyncMock(return_value=12)

        data = ArticleCreate(
            category=ArticleCategory.CLOTHING,
            description="Test",
            price=Decimal("5.00"),
            conformity_certified=True,
        )

        with pytest.raises(MaxClothingExceededError):
            await service._validate_article_constraints(mock_item_list, data)

    @pytest.mark.asyncio
    async def test_blacklisted_category(self, mock_db, mock_item_list):
        """Raise error for blacklisted items."""
        service = ArticleService(mock_db)
        service.repository.count_by_list_id = AsyncMock(return_value=5)
        service.repository.count_clothing = AsyncMock(return_value=2)

        data = ArticleCreate(
            category=ArticleCategory.NURSERY,
            subcategory="car_seat",
            description="Test",
            price=Decimal("50.00"),
            conformity_certified=True,
        )

        with pytest.raises(BlacklistedCategoryError):
            await service._validate_article_constraints(mock_item_list, data)

    @pytest.mark.asyncio
    async def test_category_limit_exceeded(self, mock_db, mock_item_list):
        """Raise error when category limit reached."""
        service = ArticleService(mock_db)
        service.repository.count_by_list_id = AsyncMock(return_value=5)
        service.repository.count_clothing = AsyncMock(return_value=2)
        service.repository.count_by_subcategory = AsyncMock(return_value=1)

        data = ArticleCreate(
            category=ArticleCategory.CLOTHING,
            subcategory="coat",  # Max 1 per list
            description="Test",
            price=Decimal("20.00"),
            conformity_certified=True,
        )

        with pytest.raises(CategoryLimitExceededError):
            await service._validate_article_constraints(mock_item_list, data)

    @pytest.mark.asyncio
    async def test_valid_article(self, mock_db, mock_item_list):
        """Valid article does not raise."""
        service = ArticleService(mock_db)
        service.repository.count_by_list_id = AsyncMock(return_value=5)
        service.repository.count_clothing = AsyncMock(return_value=2)
        service.repository.count_by_subcategory = AsyncMock(return_value=0)

        data = ArticleCreate(
            category=ArticleCategory.CLOTHING,
            description="Test",
            price=Decimal("5.00"),
            conformity_certified=True,
        )

        # Should not raise
        await service._validate_article_constraints(mock_item_list, data)


class TestAddArticle:
    """Tests for add_article method."""

    @pytest.mark.asyncio
    async def test_add_article_success(self, mock_db, mock_depositor, mock_item_list, mock_edition):
        """Successfully add an article."""
        service = ArticleService(mock_db)

        # Mock list service check
        service.list_service.check_can_modify = AsyncMock(
            return_value=(mock_item_list, mock_edition)
        )

        # Mock repository methods
        service.repository.count_by_list_id = AsyncMock(return_value=5)
        service.repository.count_clothing = AsyncMock(return_value=2)
        service.repository.count_by_subcategory = AsyncMock(return_value=0)
        service.repository.get_next_line_number = AsyncMock(return_value=6)
        service.repository.create = AsyncMock(return_value=MagicMock(id="new-article"))
        service.repository.reorder_articles = AsyncMock()
        service.repository.get_by_id = AsyncMock(return_value=MagicMock(id="new-article"))

        data = ArticleCreate(
            category=ArticleCategory.CLOTHING,
            description="Test article",
            price=Decimal("5.00"),
            conformity_certified=True,
        )

        result = await service.add_article(
            list_id=mock_item_list.id,
            depositor=mock_depositor,
            data=data,
        )

        assert result is not None
        service.repository.create.assert_called_once()
        service.repository.reorder_articles.assert_called_once()


class TestUpdateArticle:
    """Tests for update_article method."""

    @pytest.mark.asyncio
    async def test_update_article_success(
        self, mock_db, mock_depositor, mock_item_list, mock_article, mock_edition
    ):
        """Successfully update an article."""
        service = ArticleService(mock_db)

        service.list_service.check_can_modify = AsyncMock(
            return_value=(mock_item_list, mock_edition)
        )
        service.repository.get_by_id = AsyncMock(return_value=mock_article)
        service.repository.update = AsyncMock(return_value=mock_article)

        from app.schemas.article import ArticleUpdate
        data = ArticleUpdate(description="Updated description")

        result = await service.update_article(
            list_id=mock_item_list.id,
            article_id=mock_article.id,
            depositor=mock_depositor,
            data=data,
        )

        assert result is not None
        service.repository.update.assert_called_once()

    @pytest.mark.asyncio
    async def test_update_article_not_found(
        self, mock_db, mock_depositor, mock_item_list, mock_edition
    ):
        """Raise error when article not found."""
        service = ArticleService(mock_db)

        service.list_service.check_can_modify = AsyncMock(
            return_value=(mock_item_list, mock_edition)
        )
        service.repository.get_by_id = AsyncMock(return_value=None)

        from app.schemas.article import ArticleUpdate
        data = ArticleUpdate(description="Updated")

        with pytest.raises(ArticleNotFoundError):
            await service.update_article(
                list_id=mock_item_list.id,
                article_id="nonexistent",
                depositor=mock_depositor,
                data=data,
            )


class TestDeleteArticle:
    """Tests for delete_article method."""

    @pytest.mark.asyncio
    async def test_delete_article_success(
        self, mock_db, mock_depositor, mock_item_list, mock_article, mock_edition
    ):
        """Successfully delete an article."""
        service = ArticleService(mock_db)

        service.list_service.check_can_modify = AsyncMock(
            return_value=(mock_item_list, mock_edition)
        )
        service.repository.get_by_id = AsyncMock(return_value=mock_article)
        service.repository.delete = AsyncMock()
        service.repository.reorder_articles = AsyncMock()

        await service.delete_article(
            list_id=mock_item_list.id,
            article_id=mock_article.id,
            depositor=mock_depositor,
        )

        service.repository.delete.assert_called_once()
        service.repository.reorder_articles.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_article_not_found(
        self, mock_db, mock_depositor, mock_item_list, mock_edition
    ):
        """Raise error when article not found."""
        service = ArticleService(mock_db)

        service.list_service.check_can_modify = AsyncMock(
            return_value=(mock_item_list, mock_edition)
        )
        service.repository.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(ArticleNotFoundError):
            await service.delete_article(
                list_id=mock_item_list.id,
                article_id="nonexistent",
                depositor=mock_depositor,
            )
