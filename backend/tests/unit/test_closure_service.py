"""Unit tests for edition closure service."""

import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.models import Edition, User
from app.models.edition import EditionStatus
from app.schemas.edition import ClosureCheckResponse
from app.services.edition import EditionService


# ---- Helpers ----

def _make_edition(**kwargs):
    edition = MagicMock(spec=Edition)
    edition.id = kwargs.get("id", "edition-1")
    edition.name = kwargs.get("name", "Bourse Test")
    edition.status = kwargs.get("status", EditionStatus.IN_PROGRESS.value)
    edition.retrieval_end_datetime = kwargs.get(
        "retrieval_end_datetime", datetime.now() - timedelta(days=1)
    )
    edition.closed_at = kwargs.get("closed_at", None)
    edition.closed_by_id = kwargs.get("closed_by_id", None)
    edition.archived_at = kwargs.get("archived_at", None)
    edition.is_closed = edition.status in (
        EditionStatus.CLOSED.value, EditionStatus.ARCHIVED.value
    )
    edition.depositors = kwargs.get("depositors", [])
    return edition


def _make_user(**kwargs):
    user = MagicMock(spec=User)
    user.id = kwargs.get("id", "admin-1")
    user.first_name = kwargs.get("first_name", "Admin")
    user.last_name = kwargs.get("last_name", "Test")
    user.email = kwargs.get("email", "admin@test.com")
    return user


def _make_payout_stats(**kwargs):
    return {
        "total_payouts": kwargs.get("total_payouts", 5),
        "payouts_pending": kwargs.get("payouts_pending", 0),
        "payouts_ready": kwargs.get("payouts_ready", 0),
        "payouts_paid": kwargs.get("payouts_paid", 5),
        "payouts_cancelled": kwargs.get("payouts_cancelled", 0),
        "total_sales": kwargs.get("total_sales", 100),
        "total_commission": kwargs.get("total_commission", 20),
        "total_list_fees": kwargs.get("total_list_fees", 0),
        "total_net": kwargs.get("total_net", 80),
        "total_articles": kwargs.get("total_articles", 20),
        "sold_articles": kwargs.get("sold_articles", 15),
        "unsold_articles": kwargs.get("unsold_articles", 5),
    }


# ---- Tests ----

class TestCheckClosurePrerequisites:
    """Tests for check_closure_prerequisites."""

    @pytest.mark.asyncio
    async def test_all_prerequisites_met(self):
        """All checks pass -> can_close=True."""
        db = AsyncMock()
        service = EditionService(db)
        service.repository = AsyncMock()
        service.repository.get_by_id = AsyncMock(return_value=_make_edition())

        with patch(
            "app.services.edition.PayoutRepository"
        ) as MockPayoutRepo:
            MockPayoutRepo.return_value.get_stats = AsyncMock(
                return_value=_make_payout_stats()
            )
            result = await service.check_closure_prerequisites("edition-1")

        assert isinstance(result, ClosureCheckResponse)
        assert result.can_close is True
        assert all(c.passed for c in result.checks)

    @pytest.mark.asyncio
    async def test_no_payouts_calculated(self):
        """No payouts -> can_close=False."""
        db = AsyncMock()
        service = EditionService(db)
        service.repository = AsyncMock()
        service.repository.get_by_id = AsyncMock(return_value=_make_edition())

        with patch(
            "app.services.edition.PayoutRepository"
        ) as MockPayoutRepo:
            MockPayoutRepo.return_value.get_stats = AsyncMock(
                return_value=_make_payout_stats(total_payouts=0, payouts_paid=0)
            )
            result = await service.check_closure_prerequisites("edition-1")

        assert result.can_close is False
        labels = {c.label: c.passed for c in result.checks}
        assert labels["Reversements calcules"] is False

    @pytest.mark.asyncio
    async def test_payouts_not_finalized(self):
        """Payouts still pending -> can_close=False."""
        db = AsyncMock()
        service = EditionService(db)
        service.repository = AsyncMock()
        service.repository.get_by_id = AsyncMock(return_value=_make_edition())

        with patch(
            "app.services.edition.PayoutRepository"
        ) as MockPayoutRepo:
            MockPayoutRepo.return_value.get_stats = AsyncMock(
                return_value=_make_payout_stats(payouts_ready=2)
            )
            result = await service.check_closure_prerequisites("edition-1")

        assert result.can_close is False
        labels = {c.label: c.passed for c in result.checks}
        assert labels["Tous les paiements finalises"] is False

    @pytest.mark.asyncio
    async def test_retrieval_date_not_passed(self):
        """Retrieval date in the future -> can_close=False."""
        db = AsyncMock()
        service = EditionService(db)
        service.repository = AsyncMock()
        edition = _make_edition(
            retrieval_end_datetime=datetime.now() + timedelta(days=1)
        )
        service.repository.get_by_id = AsyncMock(return_value=edition)

        with patch(
            "app.services.edition.PayoutRepository"
        ) as MockPayoutRepo:
            MockPayoutRepo.return_value.get_stats = AsyncMock(
                return_value=_make_payout_stats()
            )
            result = await service.check_closure_prerequisites("edition-1")

        assert result.can_close is False
        labels = {c.label: c.passed for c in result.checks}
        assert labels["Periode de recuperation terminee"] is False

    @pytest.mark.asyncio
    async def test_wrong_status(self):
        """Edition not in_progress -> can_close=False."""
        db = AsyncMock()
        service = EditionService(db)
        service.repository = AsyncMock()
        edition = _make_edition(status=EditionStatus.CONFIGURED.value)
        service.repository.get_by_id = AsyncMock(return_value=edition)

        with patch(
            "app.services.edition.PayoutRepository"
        ) as MockPayoutRepo:
            MockPayoutRepo.return_value.get_stats = AsyncMock(
                return_value=_make_payout_stats()
            )
            result = await service.check_closure_prerequisites("edition-1")

        assert result.can_close is False
        labels = {c.label: c.passed for c in result.checks}
        assert labels["Edition en cours"] is False


class TestCloseEdition:
    """Tests for close_edition."""

    @pytest.mark.asyncio
    async def test_close_success(self):
        """Successful closure sets status, closed_at, closed_by."""
        db = AsyncMock()
        service = EditionService(db)
        service.repository = AsyncMock()

        edition = _make_edition()
        closed_edition = _make_edition(
            status=EditionStatus.CLOSED.value,
            closed_at=datetime.now(),
            closed_by_id="admin-1",
        )
        service.repository.get_by_id = AsyncMock(return_value=edition)
        service.repository.close_edition = AsyncMock(return_value=closed_edition)

        user = _make_user()

        with patch(
            "app.services.edition.PayoutRepository"
        ) as MockPayoutRepo:
            MockPayoutRepo.return_value.get_stats = AsyncMock(
                return_value=_make_payout_stats()
            )
            result = await service.close_edition("edition-1", user)

        assert result.status == EditionStatus.CLOSED.value
        assert result.closed_at is not None
        assert result.closed_by_id == "admin-1"
        service.repository.close_edition.assert_called_once_with(edition, "admin-1")

    @pytest.mark.asyncio
    async def test_close_fails_prerequisites(self):
        """Closure fails when prerequisites not met."""
        from app.exceptions import ValidationError

        db = AsyncMock()
        service = EditionService(db)
        service.repository = AsyncMock()
        edition = _make_edition(
            retrieval_end_datetime=datetime.now() + timedelta(days=1)
        )
        service.repository.get_by_id = AsyncMock(return_value=edition)

        user = _make_user()

        with patch(
            "app.services.edition.PayoutRepository"
        ) as MockPayoutRepo:
            MockPayoutRepo.return_value.get_stats = AsyncMock(
                return_value=_make_payout_stats()
            )
            with pytest.raises(ValidationError, match="Impossible de cloturer"):
                await service.close_edition("edition-1", user)


class TestArchiveEdition:
    """Tests for archive_edition."""

    @pytest.mark.asyncio
    async def test_archive_success(self):
        """Archive a closed edition successfully."""
        db = AsyncMock()
        service = EditionService(db)
        service.repository = AsyncMock()

        edition = _make_edition(status=EditionStatus.CLOSED.value)
        archived_edition = _make_edition(
            status=EditionStatus.ARCHIVED.value,
            archived_at=datetime.now(),
        )
        service.repository.get_by_id = AsyncMock(return_value=edition)
        service.repository.archive_edition = AsyncMock(return_value=archived_edition)

        result = await service.archive_edition("edition-1")

        assert result.status == EditionStatus.ARCHIVED.value
        assert result.archived_at is not None
        service.repository.archive_edition.assert_called_once_with(edition)

    @pytest.mark.asyncio
    async def test_archive_non_closed_fails(self):
        """Cannot archive edition that is not closed."""
        from app.exceptions import ValidationError

        db = AsyncMock()
        service = EditionService(db)
        service.repository = AsyncMock()
        edition = _make_edition(status=EditionStatus.IN_PROGRESS.value)
        service.repository.get_by_id = AsyncMock(return_value=edition)

        with pytest.raises(ValidationError, match="cloturees"):
            await service.archive_edition("edition-1")
