"""Unit tests for sale service."""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

from app.models import User
from app.models.article import Article, ArticleStatus
from app.models.item_list import ItemList
from app.models.sale import Sale, PaymentMethod
from app.schemas.sale import OfflineSaleItem
from app.services.sale import (
    scan_article,
    register_sale,
    cancel_sale,
    get_live_stats,
    get_article_catalog,
    sync_offline_sales,
    CANCEL_TIME_LIMIT,
    _sale_to_response,
)
from app.exceptions import (
    ArticleAlreadySoldError,
    ArticleNotFoundError,
    EditionNotFoundError,
    ValidationError,
)


def _make_user(role_name="volunteer", **kwargs):
    user = MagicMock(spec=User)
    user.id = kwargs.get("id", "user-123")
    user.first_name = kwargs.get("first_name", "Jean")
    user.last_name = kwargs.get("last_name", "Dupont")
    user.role = MagicMock()
    user.role.name = role_name
    user.is_manager = role_name in ("manager", "administrator")
    user.is_administrator = role_name == "administrator"
    return user


def _make_article(**kwargs):
    article = MagicMock(spec=Article)
    article.id = kwargs.get("id", "article-abc")
    article.barcode = kwargs.get("barcode", "010001")
    article.description = kwargs.get("description", "Pantalon bleu")
    article.category = kwargs.get("category", "clothing")
    article.size = kwargs.get("size", "4 ans")
    article.price = kwargs.get("price", Decimal("5.00"))
    article.brand = kwargs.get("brand", None)
    article.is_lot = kwargs.get("is_lot", False)
    article.lot_quantity = kwargs.get("lot_quantity", None)
    article.status = kwargs.get("status", ArticleStatus.ON_SALE.value)
    article.is_available = article.status == ArticleStatus.ON_SALE.value
    article.is_sold = article.status == ArticleStatus.SOLD.value

    item_list = MagicMock(spec=ItemList)
    item_list.id = "list-123"
    item_list.number = kwargs.get("list_number", 100)
    item_list.edition_id = kwargs.get("edition_id", "edition-123")
    item_list.label_color = kwargs.get("label_color", "sky_blue")

    depositor = _make_user(id="depositor-456", first_name="Marie", last_name="Martin")
    item_list.depositor = depositor

    article.item_list = item_list
    article.item_list_id = item_list.id

    return article


def _make_sale(article, seller, **kwargs):
    sale = MagicMock(spec=Sale)
    sale.id = kwargs.get("id", "sale-xyz")
    sale.article_id = article.id
    sale.article = article
    sale.seller_id = seller.id
    sale.seller = seller
    sale.price = article.price
    sale.payment_method = kwargs.get("payment_method", PaymentMethod.CASH.value)
    sale.register_number = kwargs.get("register_number", 1)
    sale.sold_at = kwargs.get("sold_at", datetime.now())
    sale.edition_id = article.item_list.edition_id
    return sale


class TestSaleToResponse:
    def test_basic_response(self):
        seller = _make_user()
        article = _make_article()
        sale = _make_sale(article, seller, sold_at=datetime.now())

        response = _sale_to_response(sale, seller)

        assert response.id == "sale-xyz"
        assert response.article_id == article.id
        assert response.article_description == "Pantalon bleu"
        assert response.price == Decimal("5.00")
        assert response.payment_method == "cash"
        assert response.seller_name == "Jean Dupont"
        assert response.depositor_name == "Marie Martin"
        assert response.list_number == 100

    def test_can_cancel_within_time_limit(self):
        seller = _make_user(role_name="volunteer")
        article = _make_article()
        sale = _make_sale(article, seller, sold_at=datetime.now())

        response = _sale_to_response(sale, seller)
        assert response.can_cancel is True

    def test_cannot_cancel_after_time_limit_as_volunteer(self):
        seller = _make_user(role_name="volunteer")
        article = _make_article()
        sale = _make_sale(article, seller, sold_at=datetime.now() - timedelta(minutes=10))

        response = _sale_to_response(sale, seller)
        assert response.can_cancel is False

    def test_can_cancel_after_time_limit_as_manager(self):
        manager = _make_user(role_name="manager")
        article = _make_article()
        sale = _make_sale(article, manager, sold_at=datetime.now() - timedelta(minutes=10))

        response = _sale_to_response(sale, manager)
        assert response.can_cancel is True


class TestScanArticle:
    @pytest.mark.asyncio
    async def test_article_not_found(self):
        db = AsyncMock()

        with patch("app.services.sale.EditionRepository") as MockEditionRepo, \
             patch("app.services.sale.ArticleRepository") as MockArticleRepo:
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=MagicMock())
            MockArticleRepo.return_value.get_by_barcode = AsyncMock(return_value=None)

            with pytest.raises(ArticleNotFoundError):
                await scan_article("edition-123", "999999", db)

    @pytest.mark.asyncio
    async def test_edition_not_found(self):
        db = AsyncMock()

        with patch("app.services.sale.EditionRepository") as MockEditionRepo:
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=None)

            with pytest.raises(EditionNotFoundError):
                await scan_article("bad-id", "010001", db)

    @pytest.mark.asyncio
    async def test_scan_success(self):
        db = AsyncMock()
        article = _make_article()

        with patch("app.services.sale.EditionRepository") as MockEditionRepo, \
             patch("app.services.sale.ArticleRepository") as MockArticleRepo:
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=MagicMock())
            MockArticleRepo.return_value.get_by_barcode = AsyncMock(return_value=article)

            result = await scan_article("edition-123", "010001", db)

            assert result.article_id == "article-abc"
            assert result.barcode == "010001"
            assert result.is_available is True
            assert result.depositor_name == "Marie Martin"
            assert result.list_number == 100


class TestRegisterSale:
    @pytest.mark.asyncio
    async def test_invalid_payment_method(self):
        db = AsyncMock()
        seller = _make_user()

        with pytest.raises(ValidationError, match="Invalid payment method"):
            await register_sale("edition-123", "article-abc", "bitcoin", 1, seller, db)

    @pytest.mark.asyncio
    async def test_article_already_sold(self):
        db = AsyncMock()
        seller = _make_user()
        article = _make_article(status=ArticleStatus.SOLD.value)

        with patch("app.services.sale.EditionRepository") as MockEditionRepo, \
             patch("app.services.sale.ArticleRepository") as MockArticleRepo:
            edition = MagicMock()
            edition.status = "in_progress"
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=edition)
            MockArticleRepo.return_value.get_by_id = AsyncMock(return_value=article)

            with pytest.raises(ArticleAlreadySoldError):
                await register_sale("edition-123", "article-abc", "cash", 1, seller, db)

    @pytest.mark.asyncio
    async def test_edition_not_in_progress(self):
        db = AsyncMock()
        seller = _make_user()

        with patch("app.services.sale.EditionRepository") as MockEditionRepo:
            edition = MagicMock()
            edition.status = "configured"
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=edition)

            with pytest.raises(ValidationError, match="in progress"):
                await register_sale("edition-123", "article-abc", "cash", 1, seller, db)


class TestCancelSale:
    @pytest.mark.asyncio
    async def test_sale_not_found(self):
        db = AsyncMock()
        user = _make_user()

        with patch("app.services.sale.SaleRepository") as MockSaleRepo:
            MockSaleRepo.return_value.get_by_id = AsyncMock(return_value=None)

            with pytest.raises(ValidationError, match="Sale not found"):
                await cancel_sale("bad-id", user, db)

    @pytest.mark.asyncio
    async def test_cancel_within_time_limit_as_volunteer(self):
        db = AsyncMock()
        volunteer = _make_user(role_name="volunteer")
        article = _make_article()
        sale = _make_sale(article, volunteer, sold_at=datetime.now())

        with patch("app.services.sale.SaleRepository") as MockSaleRepo, \
             patch("app.services.sale.ArticleRepository") as MockArticleRepo:
            MockSaleRepo.return_value.get_by_id = AsyncMock(return_value=sale)
            MockSaleRepo.return_value.delete = AsyncMock()
            MockArticleRepo.return_value.get_by_id = AsyncMock(return_value=article)

            await cancel_sale("sale-xyz", volunteer, db)

            MockSaleRepo.return_value.delete.assert_called_once_with(sale)

    @pytest.mark.asyncio
    async def test_cancel_after_time_limit_as_volunteer_rejected(self):
        db = AsyncMock()
        volunteer = _make_user(role_name="volunteer")
        article = _make_article()
        sale = _make_sale(article, volunteer, sold_at=datetime.now() - timedelta(minutes=10))

        with patch("app.services.sale.SaleRepository") as MockSaleRepo:
            MockSaleRepo.return_value.get_by_id = AsyncMock(return_value=sale)

            with pytest.raises(ValidationError, match="managers"):
                await cancel_sale("sale-xyz", volunteer, db)

    @pytest.mark.asyncio
    async def test_cancel_after_time_limit_as_manager_ok(self):
        db = AsyncMock()
        manager = _make_user(role_name="manager")
        article = _make_article()
        sale = _make_sale(article, manager, sold_at=datetime.now() - timedelta(minutes=10))

        with patch("app.services.sale.SaleRepository") as MockSaleRepo, \
             patch("app.services.sale.ArticleRepository") as MockArticleRepo:
            MockSaleRepo.return_value.get_by_id = AsyncMock(return_value=sale)
            MockSaleRepo.return_value.delete = AsyncMock()
            MockArticleRepo.return_value.get_by_id = AsyncMock(return_value=article)

            await cancel_sale("sale-xyz", manager, db)

            MockSaleRepo.return_value.delete.assert_called_once_with(sale)


class TestSyncOfflineSales:
    @pytest.mark.asyncio
    async def test_sync_nominal(self):
        db = AsyncMock()
        seller = _make_user()
        article = _make_article()

        items = [
            OfflineSaleItem(
                client_id="client-1",
                article_id="article-abc",
                payment_method="cash",
                register_number=1,
                sold_at=datetime.now(),
            ),
        ]

        with patch("app.services.sale.EditionRepository") as MockEditionRepo, \
             patch("app.services.sale.ArticleRepository") as MockArticleRepo, \
             patch("app.services.sale.SaleRepository") as MockSaleRepo:
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=MagicMock())
            MockArticleRepo.return_value.get_by_id = AsyncMock(return_value=article)
            MockSaleRepo.return_value.get_by_article_id = AsyncMock(return_value=None)
            MockSaleRepo.return_value.create = AsyncMock()

            result = await sync_offline_sales("edition-123", items, seller, db)

            assert result.synced == 1
            assert result.conflicts == 0
            assert result.errors == 0
            assert result.results[0].status == "synced"
            assert result.results[0].client_id == "client-1"

    @pytest.mark.asyncio
    async def test_sync_conflict_article_already_sold(self):
        db = AsyncMock()
        seller = _make_user()
        article = _make_article(status=ArticleStatus.SOLD.value)

        items = [
            OfflineSaleItem(
                client_id="client-1",
                article_id="article-abc",
                payment_method="cash",
                register_number=1,
                sold_at=datetime.now(),
            ),
        ]

        existing_sale = MagicMock(spec=Sale)

        with patch("app.services.sale.EditionRepository") as MockEditionRepo, \
             patch("app.services.sale.ArticleRepository") as MockArticleRepo, \
             patch("app.services.sale.SaleRepository") as MockSaleRepo:
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=MagicMock())
            MockArticleRepo.return_value.get_by_id = AsyncMock(return_value=article)
            MockSaleRepo.return_value.get_by_article_id = AsyncMock(return_value=existing_sale)

            result = await sync_offline_sales("edition-123", items, seller, db)

            assert result.synced == 0
            assert result.conflicts == 1
            assert result.results[0].status == "conflict"

    @pytest.mark.asyncio
    async def test_sync_error_article_not_found(self):
        db = AsyncMock()
        seller = _make_user()

        items = [
            OfflineSaleItem(
                client_id="client-1",
                article_id="nonexistent",
                payment_method="cash",
                register_number=1,
                sold_at=datetime.now(),
            ),
        ]

        with patch("app.services.sale.EditionRepository") as MockEditionRepo, \
             patch("app.services.sale.ArticleRepository") as MockArticleRepo, \
             patch("app.services.sale.SaleRepository"):
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=MagicMock())
            MockArticleRepo.return_value.get_by_id = AsyncMock(return_value=None)

            result = await sync_offline_sales("edition-123", items, seller, db)

            assert result.synced == 0
            assert result.errors == 1
            assert result.results[0].status == "error"
            assert "not found" in result.results[0].error_message

    @pytest.mark.asyncio
    async def test_sync_edition_not_found(self):
        db = AsyncMock()
        seller = _make_user()

        with patch("app.services.sale.EditionRepository") as MockEditionRepo:
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=None)

            with pytest.raises(EditionNotFoundError):
                await sync_offline_sales("bad-id", [], seller, db)

    @pytest.mark.asyncio
    async def test_sync_mixed_results(self):
        db = AsyncMock()
        seller = _make_user()
        article_ok = _make_article(id="art-ok")
        article_sold = _make_article(id="art-sold", status=ArticleStatus.SOLD.value)

        items = [
            OfflineSaleItem(
                client_id="ok-1",
                article_id="art-ok",
                payment_method="card",
                register_number=2,
                sold_at=datetime.now(),
            ),
            OfflineSaleItem(
                client_id="conflict-1",
                article_id="art-sold",
                payment_method="cash",
                register_number=1,
                sold_at=datetime.now(),
            ),
            OfflineSaleItem(
                client_id="error-1",
                article_id="nonexistent",
                payment_method="cash",
                register_number=1,
                sold_at=datetime.now(),
            ),
        ]

        existing_sale = MagicMock(spec=Sale)

        async def mock_get_by_id(article_id):
            if article_id == "art-ok":
                return article_ok
            if article_id == "art-sold":
                return article_sold
            return None

        async def mock_get_by_article_id(article_id):
            if article_id == "art-sold":
                return existing_sale
            return None

        with patch("app.services.sale.EditionRepository") as MockEditionRepo, \
             patch("app.services.sale.ArticleRepository") as MockArticleRepo, \
             patch("app.services.sale.SaleRepository") as MockSaleRepo:
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=MagicMock())
            MockArticleRepo.return_value.get_by_id = AsyncMock(side_effect=mock_get_by_id)
            MockSaleRepo.return_value.get_by_article_id = AsyncMock(side_effect=mock_get_by_article_id)
            MockSaleRepo.return_value.create = AsyncMock()

            result = await sync_offline_sales("edition-123", items, seller, db)

            assert result.synced == 1
            assert result.conflicts == 1
            assert result.errors == 1


class TestGetArticleCatalog:
    @pytest.mark.asyncio
    async def test_catalog_returns_on_sale_articles(self):
        db = AsyncMock()
        article = _make_article()

        with patch("app.services.sale.EditionRepository") as MockEditionRepo, \
             patch("app.services.sale.ArticleRepository") as MockArticleRepo:
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=MagicMock())
            MockArticleRepo.return_value.get_on_sale_for_edition = AsyncMock(return_value=[article])

            result = await get_article_catalog("edition-123", db)

            assert len(result) == 1
            assert result[0].article_id == "article-abc"
            assert result[0].barcode == "010001"
            assert result[0].depositor_name == "Marie Martin"
            assert result[0].list_number == 100

    @pytest.mark.asyncio
    async def test_catalog_edition_not_found(self):
        db = AsyncMock()

        with patch("app.services.sale.EditionRepository") as MockEditionRepo:
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=None)

            with pytest.raises(EditionNotFoundError):
                await get_article_catalog("bad-id", db)
