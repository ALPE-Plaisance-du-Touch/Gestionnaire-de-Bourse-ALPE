"""Billetweb synchronization service."""

import logging
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DepositSlot, Edition, User
from app.models.edition_depositor import EditionDepositor
from app.models.item_list import ListType
from app.repositories import DepositSlotRepository, UserRepository
from app.schemas.billetweb import BilletwebPreviewResponse, BilletwebPreviewStats
from app.services.billetweb_client import BilletwebClient
from app.services.billetweb_import import BilletwebImportService, ParsedRow
from app.services.settings import SettingsService

if TYPE_CHECKING:
    from fastapi import BackgroundTasks

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
                "location": event.get("place", ""),
                "description": event.get("description", ""),
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

        # Update edition deposit period from slot boundaries
        all_slots_result = await self.db.execute(
            select(DepositSlot)
            .where(DepositSlot.edition_id == edition.id)
            .order_by(DepositSlot.start_datetime)
        )
        all_slots = all_slots_result.scalars().all()
        if all_slots:
            edition.deposit_start_datetime = all_slots[0].start_datetime
            edition.deposit_end_datetime = all_slots[-1].end_datetime
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

    # --- Attendees sync ---

    def _build_slot_mapping_for_attendees(
        self, deposit_slots: list[DepositSlot]
    ) -> dict[str, str]:
        """Build a mapping from session datetime strings to deposit slot IDs."""
        mapping: dict[str, str] = {}
        for slot in deposit_slots:
            dt_key = slot.start_datetime.strftime("%Y-%m-%d %H:%M")
            mapping[dt_key] = slot.id
            # Also map with seconds
            dt_key_sec = slot.start_datetime.strftime("%Y-%m-%d %H:%M:%S")
            mapping[dt_key_sec] = slot.id
            if slot.description:
                mapping[slot.description.strip().lower()] = slot.id
            if slot.billetweb_session_id:
                mapping[slot.billetweb_session_id] = slot.id
        return mapping

    def _attendee_to_parsed_row(
        self,
        attendee: dict,
        row_number: int,
        slot_mapping: dict[str, str],
    ) -> ParsedRow | None:
        """Convert a Billetweb API attendee dict to a ParsedRow.

        Returns None if the attendee should be skipped (unpaid/invalid).
        """
        # Filter: only paid and validated
        paid = str(attendee.get("paid", "")).lower()
        valid = str(attendee.get("valid", "")).lower()
        if paid not in ("1", "true", "oui") or valid not in ("1", "true", "oui"):
            return None

        email = str(attendee.get("order_email", attendee.get("email", ""))).strip()
        nom = str(attendee.get("name", "")).strip()
        prenom = str(attendee.get("firstname", "")).strip()
        tarif = str(attendee.get("ticket", "")).strip()

        if not email or not nom:
            return None

        # Map session: try by session_id first, then by session start datetime
        session_id = str(attendee.get("session_id", ""))
        session_start = str(attendee.get("session_start", "")).strip()
        seance = ""

        if session_id and session_id in slot_mapping:
            seance = session_id
        elif session_start:
            # Try matching datetime format
            seance = session_start

        # Extract custom fields
        telephone = attendee.get("phone", None) or attendee.get("telephone", None)
        code_postal = attendee.get("zip", None) or attendee.get("code_postal", None)
        ville = attendee.get("city", None) or attendee.get("ville", None)
        commande_ref = str(attendee.get("order_ext_id", attendee.get("barcode", "")))

        return ParsedRow(
            row_number=row_number,
            nom=nom,
            prenom=prenom,
            email=email,
            seance=seance,
            tarif=tarif,
            paye=True,
            valide=True,
            telephone=BilletwebImportService._normalize_phone(telephone) if telephone else None,
            adresse=None,
            code_postal=str(code_postal).strip() if code_postal else None,
            ville=str(ville).strip() if ville else None,
            commande_ref=commande_ref or None,
            list_type=BilletwebImportService._map_tarif_to_list_type(tarif),
        )

    async def sync_attendees_preview(self, edition: Edition) -> BilletwebPreviewResponse:
        """Preview attendees from Billetweb for the given edition.

        Fetches attendees (incremental if last_billetweb_sync set),
        filters paid+valid, and returns preview stats.
        """
        if not edition.billetweb_event_id:
            raise ValueError("Edition is not linked to a Billetweb event")

        client = await self._get_client()

        # Incremental: use last sync timestamp
        last_update = None
        if edition.last_billetweb_sync:
            last_update = int(edition.last_billetweb_sync.replace(tzinfo=timezone.utc).timestamp())

        raw_attendees = await client.get_attendees(
            edition.billetweb_event_id, last_update=last_update,
        )

        # Get deposit slots for mapping
        slot_repo = DepositSlotRepository(self.db)
        deposit_slots, _ = await slot_repo.list_by_edition(edition.id)
        slot_mapping = self._build_slot_mapping_for_attendees(deposit_slots)

        # Convert to ParsedRows
        parsed_rows: list[ParsedRow] = []
        seen_emails: set[str] = set()
        rows_unpaid_invalid = 0
        duplicates = 0

        for idx, attendee in enumerate(raw_attendees, start=1):
            row = self._attendee_to_parsed_row(attendee, idx, slot_mapping)
            if row is None:
                rows_unpaid_invalid += 1
                continue

            email_lower = row.email.lower()
            if email_lower in seen_emails:
                duplicates += 1
                continue
            seen_emails.add(email_lower)
            parsed_rows.append(row)

        # Count existing/new/already_registered
        user_repo = UserRepository(self.db)
        existing_depositors = 0
        new_depositors = 0
        already_registered = 0

        for row in parsed_rows:
            user = await user_repo.get_by_email(row.email)
            if user:
                existing_reg = await self.db.execute(
                    select(EditionDepositor).where(
                        EditionDepositor.edition_id == edition.id,
                        EditionDepositor.user_id == user.id,
                    )
                )
                if existing_reg.scalar_one_or_none():
                    already_registered += 1
                else:
                    existing_depositors += 1
            else:
                new_depositors += 1

        stats = BilletwebPreviewStats(
            total_rows=len(raw_attendees),
            rows_unpaid_invalid=rows_unpaid_invalid,
            rows_to_process=len(parsed_rows),
            existing_depositors=existing_depositors,
            new_depositors=new_depositors,
            duplicates_in_file=duplicates,
            already_registered=already_registered,
            errors_count=0,
        )

        return BilletwebPreviewResponse(
            stats=stats,
            errors=[],
            warnings=[],
            can_import=len(parsed_rows) > 0,
            available_slots=[
                s.description or f"{s.start_datetime.strftime('%A %d %B %Hh')}-{s.end_datetime.strftime('%Hh')}"
                for s in deposit_slots
            ],
        )

    async def sync_attendees_import(
        self,
        edition: Edition,
        imported_by: User,
        send_emails: bool = True,
        background_tasks: "BackgroundTasks | None" = None,
    ) -> dict:
        """Import attendees from Billetweb API.

        Returns dict with keys: existing_linked, new_created, already_registered,
        invitations_sent, notifications_sent
        """
        if not edition.billetweb_event_id:
            raise ValueError("Edition is not linked to a Billetweb event")

        client = await self._get_client()

        # Incremental: use last sync timestamp
        last_update = None
        if edition.last_billetweb_sync:
            last_update = int(edition.last_billetweb_sync.replace(tzinfo=timezone.utc).timestamp())

        raw_attendees = await client.get_attendees(
            edition.billetweb_event_id, last_update=last_update,
        )

        # Get deposit slots for mapping
        slot_repo = DepositSlotRepository(self.db)
        deposit_slots, _ = await slot_repo.list_by_edition(edition.id)
        slot_mapping = self._build_slot_mapping_for_attendees(deposit_slots)

        # Convert to ParsedRows
        parsed_rows: list[ParsedRow] = []
        seen_emails: set[str] = set()

        for idx, attendee in enumerate(raw_attendees, start=1):
            row = self._attendee_to_parsed_row(attendee, idx, slot_mapping)
            if row is None:
                continue

            email_lower = row.email.lower()
            if email_lower in seen_emails:
                continue
            seen_emails.add(email_lower)
            parsed_rows.append(row)

        # Use shared import logic
        import_service = BilletwebImportService(self.db)
        existing_linked, new_created, already_registered, invitations_sent, notifications_sent = (
            await import_service.import_from_rows(
                parsed_rows=parsed_rows,
                slot_mapping=slot_mapping,
                edition=edition,
                imported_by=imported_by,
                send_emails=send_emails,
                background_tasks=background_tasks,
            )
        )

        # Update last sync timestamp
        edition.last_billetweb_sync = datetime.now(timezone.utc)
        await self.db.commit()

        return {
            "existing_linked": existing_linked,
            "new_created": new_created,
            "already_registered": already_registered,
            "invitations_sent": invitations_sent,
            "notifications_sent": notifications_sent,
        }
