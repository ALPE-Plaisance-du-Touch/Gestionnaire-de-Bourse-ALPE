"""Unit tests for bulk resend invitation schemas and service logic."""

from app.schemas.invitation import BulkResendRequest, BulkResendResult


class TestBulkResendRequest:
    """Tests for BulkResendRequest schema validation."""

    def test_valid_request(self):
        """Single ID is valid."""
        req = BulkResendRequest(ids=["abc-123"])
        assert req.ids == ["abc-123"]

    def test_multiple_ids(self):
        """Multiple IDs are valid."""
        ids = [f"id-{i}" for i in range(10)]
        req = BulkResendRequest(ids=ids)
        assert len(req.ids) == 10

    def test_max_100_ids(self):
        """100 IDs is within limit."""
        ids = [f"id-{i}" for i in range(100)]
        req = BulkResendRequest(ids=ids)
        assert len(req.ids) == 100

    def test_over_100_ids_rejected(self):
        """More than 100 IDs should be rejected."""
        import pytest

        ids = [f"id-{i}" for i in range(101)]
        with pytest.raises(Exception):
            BulkResendRequest(ids=ids)

    def test_empty_ids_rejected(self):
        """Empty list should be rejected."""
        import pytest

        with pytest.raises(Exception):
            BulkResendRequest(ids=[])


class TestBulkResendResult:
    """Tests for BulkResendResult schema."""

    def test_all_resent(self):
        """All invitations resent successfully."""
        result = BulkResendResult(total=5, resent=5, skipped=0)
        assert result.total == 5
        assert result.resent == 5
        assert result.skipped == 0

    def test_some_skipped(self):
        """Some invitations skipped (already activated)."""
        result = BulkResendResult(total=5, resent=3, skipped=2)
        assert result.resent == 3
        assert result.skipped == 2

    def test_all_skipped(self):
        """All invitations skipped."""
        result = BulkResendResult(total=3, resent=0, skipped=3)
        assert result.resent == 0
        assert result.skipped == 3
