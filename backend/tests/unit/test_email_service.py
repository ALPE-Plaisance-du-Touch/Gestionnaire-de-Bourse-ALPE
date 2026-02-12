"""Unit tests for the email service."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.email import EmailService


class TestEmailService:
    """Tests for EmailService."""

    @pytest.fixture
    def email_service(self):
        """Create an EmailService instance for testing."""
        return EmailService()

    def test_template_rendering_invitation(self, email_service):
        """Test invitation email template renders correctly."""
        html_template = email_service.jinja_env.get_template("invitation.html")
        text_template = email_service.jinja_env.get_template("invitation.txt")

        context = {
            "first_name": "Jean",
            "activation_url": "http://localhost:5173/activate?token=abc123",
            "expiry_days": 7,
        }

        html_content = html_template.render(**context)
        text_content = text_template.render(**context)

        # Check HTML content
        assert "Jean" in html_content
        assert "http://localhost:5173/activate?token=abc123" in html_content
        assert "7 jours" in html_content
        assert "Bourse ALPE" in html_content

        # Check text content
        assert "Jean" in text_content
        assert "http://localhost:5173/activate?token=abc123" in text_content
        assert "7 jours" in text_content

    def test_template_rendering_password_reset(self, email_service):
        """Test password reset email template renders correctly."""
        html_template = email_service.jinja_env.get_template("password_reset.html")
        text_template = email_service.jinja_env.get_template("password_reset.txt")

        context = {
            "first_name": "Marie",
            "reset_url": "http://localhost:5173/reset-password?token=xyz789",
            "expiry_hours": 24,
        }

        html_content = html_template.render(**context)
        text_content = text_template.render(**context)

        # Check HTML content
        assert "Marie" in html_content
        assert "http://localhost:5173/reset-password?token=xyz789" in html_content
        assert "24 heures" in html_content
        assert "Réinitialisation" in html_content

        # Check text content
        assert "Marie" in text_content
        assert "http://localhost:5173/reset-password?token=xyz789" in text_content
        assert "24 heures" in text_content

    @pytest.mark.asyncio
    async def test_send_invitation_email(self, email_service):
        """Test sending invitation email."""
        with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_send:
            result = await email_service.send_invitation_email(
                to_email="test@example.com",
                token="test-token-123",
                first_name="Test",
            )

            assert result is True
            mock_send.assert_called_once()

            # Check email was constructed correctly
            call_args = mock_send.call_args
            message = call_args[0][0]  # First positional arg is the message

            assert message["To"] == "test@example.com"
            assert "Invitation" in message["Subject"]
            assert "ALPE" in message["Subject"]

    @pytest.mark.asyncio
    async def test_send_password_reset_email(self, email_service):
        """Test sending password reset email."""
        with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_send:
            result = await email_service.send_password_reset_email(
                to_email="user@example.com",
                token="reset-token-456",
                first_name="User",
            )

            assert result is True
            mock_send.assert_called_once()

            # Check email was constructed correctly
            call_args = mock_send.call_args
            message = call_args[0][0]

            assert message["To"] == "user@example.com"
            assert "Réinitialisation" in message["Subject"]

    @pytest.mark.asyncio
    async def test_send_email_failure(self, email_service):
        """Test email sending handles failures gracefully."""
        with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_send:
            mock_send.side_effect = Exception("SMTP connection failed")

            result = await email_service.send_invitation_email(
                to_email="test@example.com",
                token="test-token",
                first_name="Test",
            )

            assert result is False

    @pytest.mark.asyncio
    async def test_send_email_with_default_first_name(self, email_service):
        """Test email uses default first name when not provided."""
        with patch("aiosmtplib.send", new_callable=AsyncMock) as mock_send:
            result = await email_service.send_invitation_email(
                to_email="test@example.com",
                token="test-token",
                first_name=None,
            )

            assert result is True
            mock_send.assert_called_once()
