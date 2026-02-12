"""Billetweb synchronization service."""

import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.billetweb_client import BilletwebClient
from app.services.settings import SettingsService

logger = logging.getLogger(__name__)


class BilletwebSyncService:
    """Service for synchronizing data from Billetweb API."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self._settings_service = SettingsService(db)

    async def _get_client(self) -> BilletwebClient:
        """Create an authenticated Billetweb client from stored credentials."""
        user, api_key = await self._settings_service.get_billetweb_credentials()
        if not user or not api_key:
            raise ValueError("Billetweb API credentials not configured")
        return BilletwebClient(user=user, api_key=api_key)

    async def test_connection(self) -> bool:
        """Test the Billetweb API connection."""
        client = await self._get_client()
        return await client.test_connection()

    async def list_events(self) -> list[dict]:
        """List events from Billetweb API.

        Returns a list of event info dicts with keys:
        id, name, start, end, location
        """
        client = await self._get_client()
        raw_events = await client.get_events()

        events = []
        for event in raw_events:
            events.append({
                "id": str(event.get("id", "")),
                "name": event.get("name", ""),
                "start": event.get("start", ""),
                "end": event.get("end", ""),
                "location": event.get("location", ""),
            })

        return events
