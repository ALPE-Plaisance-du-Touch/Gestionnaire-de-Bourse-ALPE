"""Billetweb synchronization service."""

import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DepositSlot, Edition
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
        """List events from Billetweb API."""
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

    # --- Sessions sync ---

    async def sync_sessions_preview(self, edition: Edition) -> dict:
        """Preview sessions from Billetweb for the given edition.

        Returns dict with keys: total_sessions, new_sessions, sessions
        Each session has: session_id, name, start, end, capacity, sold, already_synced
        """
        if not edition.billetweb_event_id:
            raise ValueError("Edition is not linked to a Billetweb event")

        client = await self._get_client()
        raw_sessions = await client.get_sessions(edition.billetweb_event_id)

        # Get existing billetweb_session_ids for this edition
        result = await self.db.execute(
            select(DepositSlot.billetweb_session_id)
            .where(DepositSlot.edition_id == edition.id)
            .where(DepositSlot.billetweb_session_id.isnot(None))
        )
        existing_ids = {row[0] for row in result.all()}

        sessions = []
        new_count = 0
        for session in raw_sessions:
            session_id = str(session.get("id", ""))
            already_synced = session_id in existing_ids
            if not already_synced:
                new_count += 1

            sessions.append({
                "session_id": session_id,
                "name": session.get("name", ""),
                "start": session.get("start", ""),
                "end": session.get("end", ""),
                "capacity": session.get("nb_places", 0),
                "sold": session.get("nb_sold", 0),
                "already_synced": already_synced,
            })

        return {
            "total_sessions": len(sessions),
            "new_sessions": new_count,
            "sessions": sessions,
        }

    async def sync_sessions_import(self, edition: Edition) -> dict:
        """Import/upsert sessions from Billetweb as deposit slots.

        Returns dict with keys: created, updated, total
        """
        if not edition.billetweb_event_id:
            raise ValueError("Edition is not linked to a Billetweb event")

        client = await self._get_client()
        raw_sessions = await client.get_sessions(edition.billetweb_event_id)

        # Get existing slots indexed by billetweb_session_id
        result = await self.db.execute(
            select(DepositSlot)
            .where(DepositSlot.edition_id == edition.id)
            .where(DepositSlot.billetweb_session_id.isnot(None))
        )
        existing_slots = {
            slot.billetweb_session_id: slot
            for slot in result.scalars().all()
        }

        created = 0
        updated = 0

        for session in raw_sessions:
            session_id = str(session.get("id", ""))
            start_str = session.get("start", "")
            end_str = session.get("end", "")
            capacity = int(session.get("nb_places", 20))
            name = session.get("name", "")

            # Parse datetimes
            start_dt = self._parse_datetime(start_str)
            end_dt = self._parse_datetime(end_str)

            if not start_dt or not end_dt:
                logger.warning("Skipping session %s: invalid dates", session_id)
                continue

            existing = existing_slots.get(session_id)
            if existing:
                existing.start_datetime = start_dt
                existing.end_datetime = end_dt
                existing.max_capacity = capacity
                existing.description = name or existing.description
                updated += 1
            else:
                slot = DepositSlot(
                    edition_id=edition.id,
                    start_datetime=start_dt,
                    end_datetime=end_dt,
                    max_capacity=capacity,
                    description=name or None,
                    billetweb_session_id=session_id,
                )
                self.db.add(slot)
                created += 1

        await self.db.flush()

        return {"created": created, "updated": updated, "total": created + updated}

    @staticmethod
    def _parse_datetime(dt_str: str) -> datetime | None:
        """Parse a datetime string from Billetweb API."""
        if not dt_str:
            return None
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M"):
            try:
                return datetime.strptime(dt_str, fmt)
            except ValueError:
                continue
        return None
