"""Settings service for managing encrypted application settings."""

import base64

from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.repositories.app_setting import AppSettingRepository

BILLETWEB_USER_KEY = "billetweb_user"
BILLETWEB_API_KEY_KEY = "billetweb_api_key"


class SettingsService:
    """Service for managing Billetweb API credentials and other app settings."""

    def __init__(self, db: AsyncSession):
        self.repo = AppSettingRepository(db)
        self._fernet = self._create_fernet()

    def _create_fernet(self) -> Fernet | None:
        key = settings.settings_encryption_key
        if not key:
            return None
        # Ensure the key is valid Fernet base64 (32 url-safe base64-encoded bytes)
        try:
            # Try using as-is first (already valid Fernet key)
            return Fernet(key.encode() if isinstance(key, str) else key)
        except Exception:
            # Try padding/encoding if needed
            try:
                raw = base64.b64decode(key)
                fernet_key = base64.urlsafe_b64encode(raw[:32])
                return Fernet(fernet_key)
            except Exception:
                return None

    def _encrypt(self, value: str) -> str:
        if not self._fernet:
            raise ValueError("Encryption key not configured")
        return self._fernet.encrypt(value.encode()).decode()

    def _decrypt(self, value: str) -> str:
        if not self._fernet:
            raise ValueError("Encryption key not configured")
        return self._fernet.decrypt(value.encode()).decode()

    async def set_billetweb_credentials(self, user: str, api_key: str) -> None:
        await self.repo.upsert(BILLETWEB_USER_KEY, user, is_encrypted=False)
        encrypted_key = self._encrypt(api_key)
        await self.repo.upsert(BILLETWEB_API_KEY_KEY, encrypted_key, is_encrypted=True)

    async def get_billetweb_credentials(self) -> tuple[str | None, str | None]:
        """Return (user, api_key) with api_key decrypted."""
        user_setting = await self.repo.get_by_key(BILLETWEB_USER_KEY)
        key_setting = await self.repo.get_by_key(BILLETWEB_API_KEY_KEY)

        user = user_setting.value if user_setting else None
        api_key = None
        if key_setting and key_setting.value:
            api_key = self._decrypt(key_setting.value)

        return user, api_key

    async def is_billetweb_configured(self) -> bool:
        user_setting = await self.repo.get_by_key(BILLETWEB_USER_KEY)
        key_setting = await self.repo.get_by_key(BILLETWEB_API_KEY_KEY)
        return bool(user_setting and user_setting.value and key_setting and key_setting.value)

    @staticmethod
    def mask_api_key(api_key: str) -> str:
        if len(api_key) <= 4:
            return "****"
        return "••••••••" + api_key[-4:]
