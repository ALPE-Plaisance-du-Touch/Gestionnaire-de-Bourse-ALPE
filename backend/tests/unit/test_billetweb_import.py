"""Unit tests for the Billetweb import service."""

from datetime import datetime

import pytest

from app.models.item_list import ListType
from app.services.billetweb_import import BilletwebImportService


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
