"""Unit tests for the Billetweb import service."""

import os
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DepositSlot, Edition, User
from app.models.item_list import ListType
from app.services.billetweb_import import (
    REQUIRED_COLUMN_NAMES,
    BilletwebImportService,
)

# Path to test fixtures
FIXTURES_PATH = Path(__file__).parent.parent / "fixtures"


def load_fixture(filename: str) -> bytes:
    """Load a test fixture file."""
    filepath = FIXTURES_PATH / filename
    with open(filepath, "rb") as f:
        return f.read()


class TestBilletwebValidation:
    """Tests for validation methods."""

    def test_validate_email_valid(self):
        """Test valid email addresses."""
        valid_emails = [
            "test@example.com",
            "user.name@domain.org",
            "user+tag@example.fr",
            "firstname.lastname@company.co.uk",
        ]
        for email in valid_emails:
            assert BilletwebImportService._validate_email(email) is True, f"Should accept {email}"

    def test_validate_email_invalid(self):
        """Test invalid email addresses."""
        invalid_emails = [
            "",
            "notanemail",
            "@domain.com",
            "user@",
            "user@domain",
            "user space@domain.com",
        ]
        for email in invalid_emails:
            assert BilletwebImportService._validate_email(email) is False, f"Should reject {email}"

    def test_validate_phone_valid_french(self):
        """Test valid French phone numbers."""
        valid_phones = [
            "0612345678",
            "06 12 34 56 78",
            "06.12.34.56.78",
            "06-12-34-56-78",
            "+33612345678",
            "+33 6 12 34 56 78",
        ]
        for phone in valid_phones:
            assert BilletwebImportService._validate_phone(phone) is True, f"Should accept {phone}"

    def test_validate_phone_invalid(self):
        """Test invalid phone numbers."""
        invalid_phones = [
            "123",
            "not-a-phone",
            "00612345678",  # Invalid French format
            "+1234567890",  # Not French
        ]
        for phone in invalid_phones:
            assert BilletwebImportService._validate_phone(phone) is False, f"Should reject {phone}"

    def test_validate_phone_optional(self):
        """Test that phone is optional (None or empty accepted)."""
        assert BilletwebImportService._validate_phone(None) is True
        assert BilletwebImportService._validate_phone("") is True

    def test_normalize_phone(self):
        """Test phone number normalization."""
        # +33 format should be converted to 0
        assert BilletwebImportService._normalize_phone("+33612345678") == "0612345678"
        assert BilletwebImportService._normalize_phone("+33 6 12 34 56 78") == "0612345678"

        # Standard format should just remove spaces/dots/dashes
        assert BilletwebImportService._normalize_phone("06 12 34 56 78") == "0612345678"
        assert BilletwebImportService._normalize_phone("06.12.34.56.78") == "0612345678"

        # None should return None
        assert BilletwebImportService._normalize_phone(None) is None

    def test_map_tarif_to_list_type_standard(self):
        """Test standard tarif mapping."""
        standard_tarifs = ["Standard", "STANDARD", "standard", "Normal", "Classique"]
        for tarif in standard_tarifs:
            assert BilletwebImportService._map_tarif_to_list_type(tarif) == ListType.STANDARD.value

    def test_map_tarif_to_list_type_local_residents(self):
        """Test local residents (Plaisance) tarif mapping."""
        local_tarifs = [
            "Réservé habitants de Plaisance",
            "réservé habitants de plaisance",
            "Habitants de Plaisance",
            "Plaisançois",
        ]
        for tarif in local_tarifs:
            result = BilletwebImportService._map_tarif_to_list_type(tarif)
            assert result == ListType.LIST_1000.value, f"Tarif '{tarif}' should map to LIST_1000"

    def test_map_tarif_to_list_type_alpe_members(self):
        """Test ALPE members tarif mapping."""
        member_tarifs = ["Adhérent", "Adhérent ALPE", "Membre", "Membre ALPE"]
        for tarif in member_tarifs:
            result = BilletwebImportService._map_tarif_to_list_type(tarif)
            assert result == ListType.LIST_1000.value, f"Tarif '{tarif}' should map to LIST_1000"

    def test_map_tarif_to_list_type_family_friends(self):
        """Test family/friends tarif mapping."""
        family_tarifs = ["Famille", "Ami", "Famille/Ami"]
        for tarif in family_tarifs:
            result = BilletwebImportService._map_tarif_to_list_type(tarif)
            assert result == ListType.LIST_2000.value, f"Tarif '{tarif}' should map to LIST_2000"

    def test_map_tarif_to_list_type_unknown_defaults_to_standard(self):
        """Test that unknown tarifs default to STANDARD."""
        unknown_tarifs = ["Unknown", "Prix spécial", "Gratuit", ""]
        for tarif in unknown_tarifs:
            result = BilletwebImportService._map_tarif_to_list_type(tarif)
            assert result == ListType.STANDARD.value, f"Unknown tarif '{tarif}' should default to STANDARD"


class TestBilletwebCsvParsing:
    """Tests for CSV parsing."""

    @pytest.fixture
    def mock_db_session(self):
        """Create a mock database session."""
        return MagicMock(spec=AsyncSession)

    @pytest.fixture
    def service(self, mock_db_session):
        """Create a BilletwebImportService instance."""
        return BilletwebImportService(mock_db_session)

    @pytest.fixture
    def sample_deposit_slots(self):
        """Create sample deposit slots for testing."""
        slot1 = MagicMock(spec=DepositSlot)
        slot1.id = "slot-1"
        slot1.start_datetime = datetime(2025, 11, 5, 20, 0)
        slot1.end_datetime = datetime(2025, 11, 5, 22, 0)
        slot1.description = None

        slot2 = MagicMock(spec=DepositSlot)
        slot2.id = "slot-2"
        slot2.start_datetime = datetime(2025, 11, 6, 14, 0)
        slot2.end_datetime = datetime(2025, 11, 6, 16, 0)
        slot2.description = None

        return [slot1, slot2]

    def test_parse_valid_csv(self, service, sample_deposit_slots):
        """Test parsing a valid CSV file."""
        content = load_fixture("billetweb_valid.csv")
        result = service._parse_csv(content, sample_deposit_slots)

        # Should have no errors
        assert len(result.errors) == 0

        # Should have parsed rows (3 total, all paid and valid)
        assert result.stats.total_rows == 3
        assert len(result.parsed_rows) == 3

        # Check first parsed row
        row1 = result.parsed_rows[0]
        assert row1.nom == "Dupont"
        assert row1.prenom == "Jean"
        assert row1.email == "jean.dupont@example.com"

    def test_parse_csv_missing_columns(self, service, sample_deposit_slots):
        """Test parsing CSV with missing required columns."""
        content = load_fixture("billetweb_missing_columns.csv")
        result = service._parse_csv(content, sample_deposit_slots)

        # Should have errors for missing columns
        assert len(result.errors) > 0
        error_messages = [e.error_message for e in result.errors]
        assert any("colonnes manquantes" in msg.lower() for msg in error_messages)

    def test_parse_csv_invalid_data(self, service, sample_deposit_slots):
        """Test parsing CSV with invalid email/phone."""
        content = load_fixture("billetweb_invalid_data.csv")
        result = service._parse_csv(content, sample_deposit_slots)

        # Should have validation errors
        assert len(result.errors) > 0

        # Check for email validation error
        email_errors = [e for e in result.errors if "email" in e.error_message.lower()]
        assert len(email_errors) > 0

    def test_parse_csv_unpaid_rows_filtered(self, service, sample_deposit_slots):
        """Test that unpaid/invalid rows are filtered out."""
        content = load_fixture("billetweb_unpaid.csv")
        result = service._parse_csv(content, sample_deposit_slots)

        # 3 total rows, but only 1 is both paid and valid
        assert result.stats.total_rows == 3
        assert result.stats.rows_unpaid_invalid == 2
        assert len(result.parsed_rows) == 1

    def test_parse_csv_duplicates_detected(self, service, sample_deposit_slots):
        """Test that duplicate emails are detected."""
        content = load_fixture("billetweb_duplicates.csv")
        result = service._parse_csv(content, sample_deposit_slots)

        # Should detect 1 duplicate
        assert result.stats.duplicates_in_file == 1

        # Should only keep first occurrence (2 unique emails -> 2 parsed rows)
        assert len(result.parsed_rows) == 2

        # Should have a warning about duplicates
        assert any("doublon" in w.lower() for w in result.warnings)

    def test_parse_csv_slot_mapping(self, service, sample_deposit_slots):
        """Test that slots are correctly mapped by datetime."""
        content = load_fixture("billetweb_valid.csv")
        result = service._parse_csv(content, sample_deposit_slots)

        # Check slot mapping was created
        assert "2025-11-05 20:00" in result.slot_mapping
        assert result.slot_mapping["2025-11-05 20:00"] == "slot-1"

        assert "2025-11-06 14:00" in result.slot_mapping
        assert result.slot_mapping["2025-11-06 14:00"] == "slot-2"


class TestBilletwebEmailTemplates:
    """Tests for email templates used in Billetweb import."""

    def test_billetweb_invitation_template_exists(self):
        """Test that the billetweb invitation email template exists."""
        from app.services.email import EmailService

        service = EmailService()

        # HTML template
        html_template = service.jinja_env.get_template("billetweb_invitation.html")
        assert html_template is not None

        # Text template
        text_template = service.jinja_env.get_template("billetweb_invitation.txt")
        assert text_template is not None

    def test_billetweb_invitation_template_renders(self):
        """Test that the billetweb invitation template renders correctly."""
        from app.services.email import EmailService

        service = EmailService()
        html_template = service.jinja_env.get_template("billetweb_invitation.html")

        context = {
            "first_name": "Jean",
            "activation_url": "http://localhost:5173/activate?token=abc123",
            "expiry_days": 7,
            "edition_name": "Bourse de Printemps 2025",
            "slot_datetime": datetime(2025, 11, 5, 20, 0),
            "support_email": "contact@alpe-plaisance.fr",
        }

        html_content = html_template.render(**context)

        assert "Jean" in html_content
        assert "http://localhost:5173/activate?token=abc123" in html_content
        assert "Bourse de Printemps 2025" in html_content

    def test_edition_registration_template_exists(self):
        """Test that the edition registration notification template exists."""
        from app.services.email import EmailService

        service = EmailService()

        # HTML template
        html_template = service.jinja_env.get_template("edition_registration.html")
        assert html_template is not None

        # Text template
        text_template = service.jinja_env.get_template("edition_registration.txt")
        assert text_template is not None

    def test_edition_registration_template_renders(self):
        """Test that the edition registration template renders correctly."""
        from app.services.email import EmailService

        service = EmailService()
        html_template = service.jinja_env.get_template("edition_registration.html")

        context = {
            "first_name": "Marie",
            "edition_name": "Bourse Automne 2025",
            "slot_datetime": datetime(2025, 11, 6, 14, 0),
            "login_url": "http://localhost:5173/login",
            "support_email": "contact@alpe-plaisance.fr",
        }

        html_content = html_template.render(**context)

        assert "Marie" in html_content
        assert "Bourse Automne 2025" in html_content
        assert "http://localhost:5173/login" in html_content
