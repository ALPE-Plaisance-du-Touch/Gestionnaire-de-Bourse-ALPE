"""Unit tests for payout service."""

import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

from app.models import User
from app.models.article import Article, ArticleStatus
from app.models.item_list import ItemList
from app.models.payout import Payout, PayoutMethod, PayoutStatus
from app.services.payout import (
    _calculate_list_fee,
    _payout_to_response,
    _round,
    calculate_payouts,
    record_payment,
    recalculate_payout,
)
from app.exceptions import (
    PayoutAlreadyPaidError,
    PayoutNotFoundError,
    ValidationError,
)


def _make_user(**kwargs):
    user = MagicMock(spec=User)
    user.id = kwargs.get("id", "user-123")
    user.first_name = kwargs.get("first_name", "Jean")
    user.last_name = kwargs.get("last_name", "Dupont")
    return user


def _make_article(**kwargs):
    article = MagicMock(spec=Article)
    article.id = kwargs.get("id", "article-1")
    article.price = kwargs.get("price", Decimal("5.00"))
    article.status = kwargs.get("status", ArticleStatus.SOLD.value)
    article.description = kwargs.get("description", "Pantalon")
    article.category = kwargs.get("category", "clothing")
    return article


def _make_item_list(**kwargs):
    item_list = MagicMock(spec=ItemList)
    item_list.id = kwargs.get("id", "list-123")
    item_list.number = kwargs.get("number", 100)
    item_list.list_type = kwargs.get("list_type", "standard")
    item_list.edition_id = kwargs.get("edition_id", "edition-123")
    item_list.depositor_id = kwargs.get("depositor_id", "depositor-456")
    item_list.articles = kwargs.get("articles", [])
    item_list.depositor = kwargs.get("depositor", _make_user(
        id="depositor-456", first_name="Marie", last_name="Martin"
    ))
    return item_list


def _make_payout(item_list=None, **kwargs):
    payout = MagicMock(spec=Payout)
    payout.id = kwargs.get("id", "payout-abc")
    payout.item_list_id = kwargs.get("item_list_id", "list-123")
    payout.depositor_id = kwargs.get("depositor_id", "depositor-456")
    payout.gross_amount = kwargs.get("gross_amount", Decimal("50.00"))
    payout.commission_amount = kwargs.get("commission_amount", Decimal("10.00"))
    payout.list_fees = kwargs.get("list_fees", Decimal("0.00"))
    payout.net_amount = kwargs.get("net_amount", Decimal("40.00"))
    payout.total_articles = kwargs.get("total_articles", 10)
    payout.sold_articles = kwargs.get("sold_articles", 5)
    payout.unsold_articles = kwargs.get("unsold_articles", 5)
    payout.status = kwargs.get("status", PayoutStatus.PENDING.value)
    payout.payment_method = kwargs.get("payment_method", None)
    payout.paid_at = kwargs.get("paid_at", None)
    payout.payment_reference = kwargs.get("payment_reference", None)
    payout.notes = kwargs.get("notes", None)
    payout.processed_by_id = kwargs.get("processed_by_id", None)
    payout.created_at = kwargs.get("created_at", datetime.now())
    payout.updated_at = kwargs.get("updated_at", datetime.now())

    if item_list is None:
        item_list = _make_item_list()
    payout.item_list = item_list
    payout.depositor = item_list.depositor
    payout.processed_by = kwargs.get("processed_by", None)

    return payout


class TestListFees:
    def test_standard_list_fee(self):
        assert _calculate_list_fee("standard") == Decimal("0.00")

    def test_list_1000_fee(self):
        assert _calculate_list_fee("list_1000") == Decimal("1.00")

    def test_list_2000_fee(self):
        assert _calculate_list_fee("list_2000") == Decimal("2.50")

    def test_unknown_list_type_defaults_to_zero(self):
        assert _calculate_list_fee("unknown") == Decimal("0.00")


class TestRounding:
    def test_round_half_up(self):
        assert _round(Decimal("1.005")) == Decimal("1.01")

    def test_round_two_decimal_places(self):
        assert _round(Decimal("12.3456")) == Decimal("12.35")

    def test_round_exact(self):
        assert _round(Decimal("5.00")) == Decimal("5.00")


class TestPayoutToResponse:
    def test_basic_response(self):
        payout = _make_payout()
        response = _payout_to_response(payout)

        assert response.id == "payout-abc"
        assert response.depositor_name == "Marie Martin"
        assert response.gross_amount == Decimal("50.00")
        assert response.net_amount == Decimal("40.00")
        assert response.list_number == 100
        assert response.processed_by_name is None

    def test_response_with_processed_by(self):
        processor = _make_user(first_name="Admin", last_name="Boss")
        payout = _make_payout(processed_by=processor)
        response = _payout_to_response(payout)

        assert response.processed_by_name == "Admin Boss"


class TestCalculatePayouts:
    @pytest.mark.asyncio
    async def test_edition_not_found(self):
        db = AsyncMock()

        with patch("app.services.payout.EditionRepository") as MockEditionRepo:
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=None)

            from app.exceptions import EditionNotFoundError
            with pytest.raises(EditionNotFoundError):
                await calculate_payouts("bad-id", _make_user(), db)

    @pytest.mark.asyncio
    async def test_edition_wrong_status_rejected(self):
        db = AsyncMock()
        edition = MagicMock()
        edition.status = "draft"
        edition.commission_rate = Decimal("0.20")

        with patch("app.services.payout.EditionRepository") as MockEditionRepo:
            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=edition)

            with pytest.raises(ValidationError, match="in progress or closed"):
                await calculate_payouts("edition-123", _make_user(), db)

    @pytest.mark.asyncio
    async def test_basic_calculation(self):
        db = AsyncMock()
        edition = MagicMock()
        edition.status = "in_progress"
        edition.commission_rate = Decimal("0.20")

        sold_article = _make_article(price=Decimal("10.00"), status=ArticleStatus.SOLD.value)
        unsold_article = _make_article(price=Decimal("5.00"), status=ArticleStatus.ON_SALE.value)
        item_list = _make_item_list(articles=[sold_article, unsold_article])

        with patch("app.services.payout.EditionRepository") as MockEditionRepo, \
             patch("app.services.payout.PayoutRepository") as MockPayoutRepo, \
             patch("app.services.payout.ItemListRepository") as MockListRepo:

            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=edition)
            MockPayoutRepo.return_value.delete_unpaid_by_edition = AsyncMock()
            MockPayoutRepo.return_value.get_by_item_list_id = AsyncMock(return_value=None)
            MockPayoutRepo.return_value.create_bulk = AsyncMock()
            MockListRepo.return_value.list_by_edition_with_articles = AsyncMock(
                return_value=[item_list]
            )

            result = await calculate_payouts("edition-123", _make_user(), db)

            assert result.total_payouts == 1
            assert result.total_sales == Decimal("10.00")
            assert result.total_commission == Decimal("2.00")
            assert result.total_list_fees == Decimal("0.00")
            assert result.total_net == Decimal("8.00")

    @pytest.mark.asyncio
    async def test_zero_sales(self):
        db = AsyncMock()
        edition = MagicMock()
        edition.status = "closed"
        edition.commission_rate = Decimal("0.20")

        unsold = _make_article(status=ArticleStatus.ON_SALE.value)
        item_list = _make_item_list(articles=[unsold])

        with patch("app.services.payout.EditionRepository") as MockEditionRepo, \
             patch("app.services.payout.PayoutRepository") as MockPayoutRepo, \
             patch("app.services.payout.ItemListRepository") as MockListRepo:

            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=edition)
            MockPayoutRepo.return_value.delete_unpaid_by_edition = AsyncMock()
            MockPayoutRepo.return_value.get_by_item_list_id = AsyncMock(return_value=None)
            MockPayoutRepo.return_value.create_bulk = AsyncMock()
            MockListRepo.return_value.list_by_edition_with_articles = AsyncMock(
                return_value=[item_list]
            )

            result = await calculate_payouts("edition-123", _make_user(), db)

            assert result.total_sales == Decimal("0.00")
            assert result.total_commission == Decimal("0.00")
            assert result.total_net == Decimal("0.00")

    @pytest.mark.asyncio
    async def test_all_sold(self):
        db = AsyncMock()
        edition = MagicMock()
        edition.status = "in_progress"
        edition.commission_rate = Decimal("0.20")

        articles = [
            _make_article(price=Decimal("10.00"), status=ArticleStatus.SOLD.value),
            _make_article(price=Decimal("20.00"), status=ArticleStatus.SOLD.value),
        ]
        item_list = _make_item_list(articles=articles)

        with patch("app.services.payout.EditionRepository") as MockEditionRepo, \
             patch("app.services.payout.PayoutRepository") as MockPayoutRepo, \
             patch("app.services.payout.ItemListRepository") as MockListRepo:

            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=edition)
            MockPayoutRepo.return_value.delete_unpaid_by_edition = AsyncMock()
            MockPayoutRepo.return_value.get_by_item_list_id = AsyncMock(return_value=None)
            MockPayoutRepo.return_value.create_bulk = AsyncMock()
            MockListRepo.return_value.list_by_edition_with_articles = AsyncMock(
                return_value=[item_list]
            )

            result = await calculate_payouts("edition-123", _make_user(), db)

            assert result.total_sales == Decimal("30.00")
            assert result.total_commission == Decimal("6.00")
            assert result.total_net == Decimal("24.00")

    @pytest.mark.asyncio
    async def test_net_negative_clipped_to_zero(self):
        """When list fees exceed gross - commission, net should be 0."""
        db = AsyncMock()
        edition = MagicMock()
        edition.status = "in_progress"
        edition.commission_rate = Decimal("0.20")

        # 0.50€ sold, commission=0.10, list_fee=1.00 → net would be -0.60 → clipped to 0
        article = _make_article(price=Decimal("0.50"), status=ArticleStatus.SOLD.value)
        item_list = _make_item_list(list_type="list_1000", articles=[article])

        with patch("app.services.payout.EditionRepository") as MockEditionRepo, \
             patch("app.services.payout.PayoutRepository") as MockPayoutRepo, \
             patch("app.services.payout.ItemListRepository") as MockListRepo:

            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=edition)
            MockPayoutRepo.return_value.delete_unpaid_by_edition = AsyncMock()
            MockPayoutRepo.return_value.get_by_item_list_id = AsyncMock(return_value=None)
            MockPayoutRepo.return_value.create_bulk = AsyncMock()
            MockListRepo.return_value.list_by_edition_with_articles = AsyncMock(
                return_value=[item_list]
            )

            result = await calculate_payouts("edition-123", _make_user(), db)

            assert result.total_net == Decimal("0.00")

    @pytest.mark.asyncio
    async def test_skips_paid_payouts(self):
        db = AsyncMock()
        edition = MagicMock()
        edition.status = "in_progress"
        edition.commission_rate = Decimal("0.20")

        article = _make_article(price=Decimal("10.00"), status=ArticleStatus.SOLD.value)
        item_list = _make_item_list(articles=[article])

        paid_payout = MagicMock()
        paid_payout.status = PayoutStatus.PAID.value

        with patch("app.services.payout.EditionRepository") as MockEditionRepo, \
             patch("app.services.payout.PayoutRepository") as MockPayoutRepo, \
             patch("app.services.payout.ItemListRepository") as MockListRepo:

            MockEditionRepo.return_value.get_by_id = AsyncMock(return_value=edition)
            MockPayoutRepo.return_value.delete_unpaid_by_edition = AsyncMock()
            MockPayoutRepo.return_value.get_by_item_list_id = AsyncMock(return_value=paid_payout)
            MockPayoutRepo.return_value.create_bulk = AsyncMock()
            MockListRepo.return_value.list_by_edition_with_articles = AsyncMock(
                return_value=[item_list]
            )

            result = await calculate_payouts("edition-123", _make_user(), db)

            # Paid payout is skipped, no new payouts created
            assert result.total_payouts == 0
            assert result.total_depositors == 1  # Still counted


class TestRecordPayment:
    @pytest.mark.asyncio
    async def test_invalid_payment_method(self):
        db = AsyncMock()

        with pytest.raises(ValidationError, match="Invalid payment method"):
            await record_payment("payout-abc", "bitcoin", None, None, _make_user(), db)

    @pytest.mark.asyncio
    async def test_check_requires_reference(self):
        db = AsyncMock()

        with pytest.raises(ValidationError, match="Check number"):
            await record_payment("payout-abc", "check", None, None, _make_user(), db)

    @pytest.mark.asyncio
    async def test_already_paid(self):
        db = AsyncMock()
        payout = _make_payout(status=PayoutStatus.PAID.value)

        with patch("app.services.payout.PayoutRepository") as MockPayoutRepo:
            MockPayoutRepo.return_value.get_by_id = AsyncMock(return_value=payout)

            with pytest.raises(PayoutAlreadyPaidError):
                await record_payment("payout-abc", "cash", None, None, _make_user(), db)

    @pytest.mark.asyncio
    async def test_cash_payment_success(self):
        db = AsyncMock()
        user = _make_user()
        item_list = _make_item_list()
        payout = _make_payout(item_list=item_list, status=PayoutStatus.PENDING.value)

        with patch("app.services.payout.PayoutRepository") as MockPayoutRepo:
            MockPayoutRepo.return_value.get_by_id = AsyncMock(return_value=payout)

            result = await record_payment("payout-abc", "cash", None, None, user, db)

            assert payout.status == PayoutStatus.PAID.value
            assert payout.payment_method == "cash"
            assert payout.processed_by_id == user.id
            db.commit.assert_called()


class TestRecalculatePayout:
    @pytest.mark.asyncio
    async def test_payout_not_found(self):
        db = AsyncMock()

        with patch("app.services.payout.PayoutRepository") as MockPayoutRepo:
            MockPayoutRepo.return_value.get_by_id = AsyncMock(return_value=None)

            with pytest.raises(PayoutNotFoundError):
                await recalculate_payout("bad-id", _make_user(), db)

    @pytest.mark.asyncio
    async def test_already_paid_rejected(self):
        db = AsyncMock()
        payout = _make_payout(status=PayoutStatus.PAID.value)

        with patch("app.services.payout.PayoutRepository") as MockPayoutRepo:
            MockPayoutRepo.return_value.get_by_id = AsyncMock(return_value=payout)

            with pytest.raises(PayoutAlreadyPaidError):
                await recalculate_payout("payout-abc", _make_user(), db)
