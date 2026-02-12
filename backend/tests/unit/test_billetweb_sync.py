"""Tests for BilletwebSyncService."""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DepositSlot, Edition
from app.models.edition import EditionStatus
from app.services.billetweb_sync import BilletwebSyncService


class TestParseDateTime:
    """Test datetime parsing utility."""

    def test_parse_datetime_with_seconds(self):
        result = BilletwebSyncService._parse_datetime("2025-11-05 09:00:00")
        assert result == datetime(2025, 11, 5, 9, 0, 0)

    def test_parse_datetime_without_seconds(self):
        result = BilletwebSyncService._parse_datetime("2025-11-05 09:00")
        assert result == datetime(2025, 11, 5, 9, 0)

    def test_parse_datetime_iso_format(self):
        result = BilletwebSyncService._parse_datetime("2025-11-05T09:00:00")
        assert result == datetime(2025, 11, 5, 9, 0, 0)

    def test_parse_datetime_iso_without_seconds(self):
        result = BilletwebSyncService._parse_datetime("2025-11-05T09:00")
        assert result == datetime(2025, 11, 5, 9, 0)

    def test_parse_datetime_empty(self):
        assert BilletwebSyncService._parse_datetime("") is None

    def test_parse_datetime_invalid(self):
        assert BilletwebSyncService._parse_datetime("not-a-date") is None


class TestSyncSessionsPreview:
    """Test sessions preview with mocked client."""

    @pytest.mark.asyncio
    async def test_preview_no_event_id(self, db_session):
        edition = MagicMock(spec=Edition)
        edition.billetweb_event_id = None

        service = BilletwebSyncService(db_session)
        with pytest.raises(ValueError, match="not linked"):
            await service.sync_sessions_preview(edition)

    @pytest.mark.asyncio
    async def test_preview_returns_sessions(self, db_session, admin_user):
        # Create edition with billetweb_event_id
        edition = Edition(
            name="Test Edition",
            start_datetime=datetime(2025, 11, 5, 9, 0),
            end_datetime=datetime(2025, 11, 6, 18, 0),
            status=EditionStatus.CONFIGURED.value,
            commission_rate=0.2,
            billetweb_event_id="evt123",
            created_by_id=admin_user.id,
        )
        db_session.add(edition)
        await db_session.commit()
        await db_session.refresh(edition)

        mock_sessions = [
            {
                "id": "s1",
                "name": "Matin",
                "start": "2025-11-05 09:00:00",
                "end": "2025-11-05 12:00:00",
                "nb_places": 30,
                "nb_sold": 10,
            },
            {
                "id": "s2",
                "name": "Apres-midi",
                "start": "2025-11-05 14:00:00",
                "end": "2025-11-05 18:00:00",
                "nb_places": 25,
                "nb_sold": 5,
            },
        ]

        mock_client = AsyncMock()
        mock_client.get_sessions.return_value = mock_sessions

        service = BilletwebSyncService(db_session)

        with patch.object(service, "_get_client", return_value=mock_client):
            result = await service.sync_sessions_preview(edition)

        assert result["total_sessions"] == 2
        assert result["new_sessions"] == 2
        assert len(result["sessions"]) == 2
        assert result["sessions"][0]["session_id"] == "s1"
        assert result["sessions"][0]["already_synced"] is False


class TestSyncSessionsImport:
    """Test sessions import with mocked client."""

    @pytest.mark.asyncio
    async def test_import_creates_slots(self, db_session, admin_user):
        edition = Edition(
            name="Test Edition",
            start_datetime=datetime(2025, 11, 5, 9, 0),
            end_datetime=datetime(2025, 11, 6, 18, 0),
            status=EditionStatus.CONFIGURED.value,
            commission_rate=0.2,
            billetweb_event_id="evt123",
            created_by_id=admin_user.id,
        )
        db_session.add(edition)
        await db_session.commit()
        await db_session.refresh(edition)

        mock_sessions = [
            {
                "id": "s1",
                "name": "Matin",
                "start": "2025-11-05 09:00:00",
                "end": "2025-11-05 12:00:00",
                "nb_places": 30,
            },
        ]

        mock_client = AsyncMock()
        mock_client.get_sessions.return_value = mock_sessions

        service = BilletwebSyncService(db_session)

        with patch.object(service, "_get_client", return_value=mock_client):
            result = await service.sync_sessions_import(edition)

        assert result["created"] == 1
        assert result["updated"] == 0
        assert result["total"] == 1

        # Verify deposit period was updated from slot boundaries
        await db_session.refresh(edition)
        assert edition.deposit_start_datetime == datetime(2025, 11, 5, 9, 0)
        assert edition.deposit_end_datetime == datetime(2025, 11, 5, 12, 0)

    @pytest.mark.asyncio
    async def test_import_updates_existing_slots(self, db_session, admin_user):
        edition = Edition(
            name="Test Edition",
            start_datetime=datetime(2025, 11, 5, 9, 0),
            end_datetime=datetime(2025, 11, 6, 18, 0),
            status=EditionStatus.CONFIGURED.value,
            commission_rate=0.2,
            billetweb_event_id="evt123",
            created_by_id=admin_user.id,
        )
        db_session.add(edition)
        await db_session.commit()
        await db_session.refresh(edition)

        # Pre-create a slot linked to billetweb
        slot = DepositSlot(
            edition_id=edition.id,
            start_datetime=datetime(2025, 11, 5, 9, 0),
            end_datetime=datetime(2025, 11, 5, 12, 0),
            max_capacity=20,
            billetweb_session_id="s1",
        )
        db_session.add(slot)
        await db_session.commit()

        mock_sessions = [
            {
                "id": "s1",
                "name": "Matin Updated",
                "start": "2025-11-05 09:00:00",
                "end": "2025-11-05 12:00:00",
                "nb_places": 35,
            },
        ]

        mock_client = AsyncMock()
        mock_client.get_sessions.return_value = mock_sessions

        service = BilletwebSyncService(db_session)

        with patch.object(service, "_get_client", return_value=mock_client):
            result = await service.sync_sessions_import(edition)

        assert result["created"] == 0
        assert result["updated"] == 1

        # Verify slot was updated
        await db_session.refresh(slot)
        assert slot.max_capacity == 35
        assert slot.description == "Matin Updated"


class TestAttendeeToRow:
    """Test attendee-to-ParsedRow conversion."""

    @pytest.fixture
    def service(self, db_session):
        return BilletwebSyncService(db_session)

    def test_valid_attendee(self, service):
        attendee = {
            "order_email": "test@example.com",
            "name": "Dupont",
            "firstname": "Jean",
            "ticket": "Standard",
            "paid": "1",
            "valid": "1",
            "session_id": "s1",
            "session_start": "2025-11-05 09:00:00",
            "phone": "0612345678",
            "zip": "31000",
            "city": "Toulouse",
            "barcode": "ABC123",
        }
        slot_mapping = {"s1": "slot-uuid-1"}

        row = service._attendee_to_parsed_row(attendee, 1, slot_mapping)
        assert row is not None
        assert row.email == "test@example.com"
        assert row.nom == "Dupont"
        assert row.prenom == "Jean"
        assert row.seance == "s1"
        assert row.code_postal == "31000"
        assert row.ville == "Toulouse"

    def test_unpaid_attendee_returns_none(self, service):
        attendee = {
            "order_email": "test@example.com",
            "name": "Dupont",
            "firstname": "Jean",
            "ticket": "Standard",
            "paid": "0",
            "valid": "1",
        }
        row = service._attendee_to_parsed_row(attendee, 1, {})
        assert row is None

    def test_invalid_attendee_returns_none(self, service):
        attendee = {
            "order_email": "test@example.com",
            "name": "Dupont",
            "firstname": "Jean",
            "ticket": "Standard",
            "paid": "1",
            "valid": "0",
        }
        row = service._attendee_to_parsed_row(attendee, 1, {})
        assert row is None

    def test_missing_email_returns_none(self, service):
        attendee = {
            "name": "Dupont",
            "firstname": "Jean",
            "ticket": "Standard",
            "paid": "1",
            "valid": "1",
        }
        row = service._attendee_to_parsed_row(attendee, 1, {})
        assert row is None

    def test_session_matching_by_datetime(self, service):
        attendee = {
            "order_email": "test@example.com",
            "name": "Dupont",
            "firstname": "Jean",
            "ticket": "Standard",
            "paid": "1",
            "valid": "1",
            "session_start": "2025-11-05 09:00:00",
        }
        slot_mapping = {"2025-11-05 09:00:00": "slot-uuid-1"}

        row = service._attendee_to_parsed_row(attendee, 1, slot_mapping)
        assert row is not None
        assert row.seance == "2025-11-05 09:00:00"
