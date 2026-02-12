"""Unit tests for deadline reminder email."""

from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio

from app.services.email import EmailService


class TestDeadlineReminderEmail:
    """Tests for send_deadline_reminder method."""

    @pytest.fixture
    def email_service(self):
        return EmailService()

    @pytest.mark.asyncio
    async def test_send_deadline_reminder_renders_templates(self, email_service):
        """Test that deadline reminder renders both HTML and text templates."""
        with patch.object(email_service, "_send_email", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            result = await email_service.send_deadline_reminder(
                to_email="test@example.com",
                first_name="Jean",
                edition_name="Bourse Printemps 2025",
                deadline="15/03/2025",
            )

            assert result is True
            mock_send.assert_called_once()

            call_kwargs = mock_send.call_args
            assert call_kwargs[1]["to_email"] == "test@example.com"
            assert "Bourse Printemps 2025" in call_kwargs[1]["subject"]
            assert "Jean" in call_kwargs[1]["html_content"]
            assert "15/03/2025" in call_kwargs[1]["html_content"]
            assert "Jean" in call_kwargs[1]["text_content"]
            assert "15/03/2025" in call_kwargs[1]["text_content"]

    @pytest.mark.asyncio
    async def test_send_deadline_reminder_subject_includes_edition(self, email_service):
        """Test that subject line includes edition name."""
        with patch.object(email_service, "_send_email", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            await email_service.send_deadline_reminder(
                to_email="test@example.com",
                first_name="Marie",
                edition_name="Automne 2025",
                deadline="01/11/2025",
            )

            subject = mock_send.call_args[1]["subject"]
            assert "Automne 2025" in subject
            assert "date limite" in subject.lower() or "rappel" in subject.lower()

    @pytest.mark.asyncio
    async def test_send_deadline_reminder_includes_lists_url(self, email_service):
        """Test that email includes link to lists page."""
        with patch.object(email_service, "_send_email", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = True

            await email_service.send_deadline_reminder(
                to_email="test@example.com",
                first_name="Pierre",
                edition_name="Test Edition",
                deadline="20/06/2025",
            )

            html = mock_send.call_args[1]["html_content"]
            text = mock_send.call_args[1]["text_content"]
            assert "my-lists" in html
            assert "my-lists" in text

    @pytest.mark.asyncio
    async def test_send_deadline_reminder_failure(self, email_service):
        """Test handling of email send failure."""
        with patch.object(email_service, "_send_email", new_callable=AsyncMock) as mock_send:
            mock_send.return_value = False

            result = await email_service.send_deadline_reminder(
                to_email="bad@example.com",
                first_name="Test",
                edition_name="Test",
                deadline="01/01/2025",
            )

            assert result is False
