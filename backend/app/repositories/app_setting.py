"""App setting repository for database operations."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.app_setting import AppSetting


class AppSettingRepository:
    """Repository for app setting database operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_key(self, key: str) -> AppSetting | None:
        result = await self.db.execute(
            select(AppSetting).where(AppSetting.key == key)
        )
        return result.scalar_one_or_none()

    async def upsert(self, key: str, value: str | None, *, is_encrypted: bool = False) -> AppSetting:
        setting = await self.get_by_key(key)
        if setting:
            setting.value = value
            setting.is_encrypted = is_encrypted
        else:
            setting = AppSetting(key=key, value=value, is_encrypted=is_encrypted)
            self.db.add(setting)
        await self.db.flush()
        return setting

    async def delete_by_key(self, key: str) -> bool:
        setting = await self.get_by_key(key)
        if setting:
            await self.db.delete(setting)
            await self.db.flush()
            return True
        return False
