"""Unit tests for depositor lookup endpoint logic."""

import pytest

from app.api.v1.endpoints.invitations import compute_invitation_status


class TestComputeInvitationStatus:
    """Tests for invitation status computation used in lookup context."""

    def test_activated_user(self):
        """Active user with password should be 'activated'."""

        class FakeUser:
            is_active = True
            password_hash = "hashed"
            invitation_token = None
            invitation_expires_at = None

        assert compute_invitation_status(FakeUser()) == "activated"

    def test_cancelled_no_token(self):
        """Inactive user without token should be 'cancelled'."""

        class FakeUser:
            is_active = False
            password_hash = None
            invitation_token = None
            invitation_expires_at = None

        assert compute_invitation_status(FakeUser()) == "cancelled"

    def test_pending_with_valid_token(self):
        """Inactive user with future expiry should be 'pending'."""
        from datetime import datetime, timedelta, timezone

        class FakeUser:
            is_active = False
            password_hash = None
            invitation_token = "abc123"
            invitation_expires_at = datetime.now(timezone.utc) + timedelta(days=3)

        assert compute_invitation_status(FakeUser()) == "pending"

    def test_expired_token(self):
        """Inactive user with past expiry should be 'expired'."""
        from datetime import datetime, timedelta, timezone

        class FakeUser:
            is_active = False
            password_hash = None
            invitation_token = "abc123"
            invitation_expires_at = datetime.now(timezone.utc) - timedelta(days=1)

        assert compute_invitation_status(FakeUser()) == "expired"

    def test_expired_naive_datetime(self):
        """Expired invitation with naive datetime (no tzinfo) should still be detected."""
        from datetime import datetime, timedelta

        class FakeUser:
            is_active = False
            password_hash = None
            invitation_token = "abc123"
            invitation_expires_at = datetime.utcnow() - timedelta(days=1)

        assert compute_invitation_status(FakeUser()) == "expired"


class TestDepositorLookupResponseSchema:
    """Tests for the expected response structure of the lookup endpoint."""

    def test_not_found_response_structure(self):
        """Not-found response should have found=False."""
        response = {"found": False}
        assert response["found"] is False
        assert "first_name" not in response

    def test_found_response_structure(self):
        """Found response should include depositor details."""
        response = {
            "found": True,
            "first_name": "Jean",
            "last_name": "Dupont",
            "participation_count": 3,
            "last_edition_name": "Bourse Automne 2025",
            "preferred_list_type": "standard",
        }
        assert response["found"] is True
        assert response["first_name"] == "Jean"
        assert response["participation_count"] == 3
        assert response["preferred_list_type"] == "standard"

    def test_found_with_zero_participations(self):
        """User with no participation history should return count 0."""
        response = {
            "found": True,
            "first_name": "Marie",
            "last_name": "Martin",
            "participation_count": 0,
            "last_edition_name": None,
            "preferred_list_type": "standard",
        }
        assert response["found"] is True
        assert response["participation_count"] == 0
        assert response["last_edition_name"] is None
