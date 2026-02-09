"""Unit tests for private sale detection."""

from datetime import datetime

import pytest

from app.services.sale import _is_private_sale_time


class TestPrivateSaleTimeDetection:
    """Tests for _is_private_sale_time helper."""

    def test_friday_17h_is_private(self):
        """Friday 17:00 should be private sale time."""
        # Friday = weekday 4
        sold_at = datetime(2026, 2, 13, 17, 0)  # Friday
        assert sold_at.weekday() == 4
        assert _is_private_sale_time(sold_at) is True

    def test_friday_17h30_is_private(self):
        """Friday 17:30 should be private sale time."""
        sold_at = datetime(2026, 2, 13, 17, 30)
        assert _is_private_sale_time(sold_at) is True

    def test_friday_17h59_is_private(self):
        """Friday 17:59 should be private sale time."""
        sold_at = datetime(2026, 2, 13, 17, 59)
        assert _is_private_sale_time(sold_at) is True

    def test_friday_16h_is_not_private(self):
        """Friday 16:00 is before private sale window."""
        sold_at = datetime(2026, 2, 13, 16, 0)
        assert _is_private_sale_time(sold_at) is False

    def test_friday_18h_is_not_private(self):
        """Friday 18:00 is after private sale window."""
        sold_at = datetime(2026, 2, 13, 18, 0)
        assert _is_private_sale_time(sold_at) is False

    def test_saturday_17h_is_not_private(self):
        """Saturday 17:00 is not private sale time."""
        sold_at = datetime(2026, 2, 14, 17, 0)  # Saturday
        assert sold_at.weekday() == 5
        assert _is_private_sale_time(sold_at) is False

    def test_monday_17h_is_not_private(self):
        """Monday 17:00 is not private sale time."""
        sold_at = datetime(2026, 2, 9, 17, 0)  # Monday
        assert sold_at.weekday() == 0
        assert _is_private_sale_time(sold_at) is False

    def test_friday_9h_is_not_private(self):
        """Friday morning is not private sale time."""
        sold_at = datetime(2026, 2, 13, 9, 0)
        assert _is_private_sale_time(sold_at) is False
