"""Unit tests for model properties comparing a stored datetime against now."""

from datetime import datetime, timedelta

from app.models.deposit_slot import DepositSlot
from app.models.edition import Edition, EditionStatus


class TestCanAcceptDeclarations:
    """Tests for Edition.can_accept_declarations."""

    def test_accepts_before_a_deadline_read_from_database(self):
        """The column has no timezone, so the stored value comes back naive."""
        edition = Edition(
            status=EditionStatus.REGISTRATIONS_OPEN.value,
            declaration_deadline=datetime.now() + timedelta(days=1),
        )

        assert edition.can_accept_declarations is True

    def test_refuses_once_the_deadline_has_passed(self):
        edition = Edition(
            status=EditionStatus.REGISTRATIONS_OPEN.value,
            declaration_deadline=datetime.now() - timedelta(days=1),
        )

        assert edition.can_accept_declarations is False

    def test_accepts_when_no_deadline_is_set(self):
        edition = Edition(
            status=EditionStatus.REGISTRATIONS_OPEN.value,
            declaration_deadline=None,
        )

        assert edition.can_accept_declarations is True


class TestDepositSlotIsPast:
    """Tests for DepositSlot.is_past."""

    def test_a_slot_ending_in_the_past_is_past(self):
        """The column has no timezone, so the stored value comes back naive."""
        slot = DepositSlot(end_datetime=datetime.now() - timedelta(hours=1))

        assert slot.is_past is True

    def test_a_slot_ending_later_is_not_past(self):
        slot = DepositSlot(end_datetime=datetime.now() + timedelta(hours=1))

        assert slot.is_past is False
