"""Tests for SettingsService."""

import base64

import pytest
from cryptography.fernet import Fernet

from app.config import settings
from app.services.settings import SettingsService

# Generate a valid Fernet key for tests
TEST_FERNET_KEY = Fernet.generate_key().decode()


@pytest.fixture(autouse=True)
def _set_encryption_key(monkeypatch):
    """Ensure a valid encryption key is available for all tests."""
    monkeypatch.setattr(settings, "settings_encryption_key", TEST_FERNET_KEY)


class TestMaskApiKey:
    """Test API key masking."""

    def test_mask_long_key(self):
        assert SettingsService.mask_api_key("abcdefghijklmnop") == "••••••••mnop"

    def test_mask_short_key(self):
        assert SettingsService.mask_api_key("ab") == "****"

    def test_mask_exactly_four(self):
        assert SettingsService.mask_api_key("abcd") == "****"

    def test_mask_five_chars(self):
        assert SettingsService.mask_api_key("abcde") == "••••••••bcde"


class TestSettingsServiceIntegration:
    """Integration tests requiring database session."""

    @pytest.mark.asyncio
    async def test_set_and_get_credentials(self, db_session):
        service = SettingsService(db_session)

        await service.set_billetweb_credentials("myuser", "mysecretkey")
        await db_session.commit()

        user, api_key = await service.get_billetweb_credentials()
        assert user == "myuser"
        assert api_key == "mysecretkey"

    @pytest.mark.asyncio
    async def test_is_configured_false_initially(self, db_session):
        service = SettingsService(db_session)
        assert await service.is_billetweb_configured() is False

    @pytest.mark.asyncio
    async def test_is_configured_true_after_set(self, db_session):
        service = SettingsService(db_session)
        await service.set_billetweb_credentials("user", "key")
        await db_session.commit()
        assert await service.is_billetweb_configured() is True

    @pytest.mark.asyncio
    async def test_overwrite_credentials(self, db_session):
        service = SettingsService(db_session)

        await service.set_billetweb_credentials("user1", "key1")
        await db_session.commit()

        await service.set_billetweb_credentials("user2", "key2")
        await db_session.commit()

        user, api_key = await service.get_billetweb_credentials()
        assert user == "user2"
        assert api_key == "key2"

    @pytest.mark.asyncio
    async def test_get_credentials_when_not_set(self, db_session):
        service = SettingsService(db_session)
        user, api_key = await service.get_billetweb_credentials()
        assert user is None
        assert api_key is None

    @pytest.mark.asyncio
    async def test_encryption_not_plaintext(self, db_session):
        """Verify the API key is stored encrypted, not in plaintext."""
        service = SettingsService(db_session)
        await service.set_billetweb_credentials("user", "my-secret-api-key-123")
        await db_session.commit()

        # Read the raw stored value from the repo
        key_setting = await service.repo.get_by_key("billetweb_api_key")
        assert key_setting is not None
        assert key_setting.is_encrypted is True
        assert key_setting.value != "my-secret-api-key-123"
