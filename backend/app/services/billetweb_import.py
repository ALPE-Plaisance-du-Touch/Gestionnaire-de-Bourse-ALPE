"""Billetweb import service for processing depositor data."""

import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DepositSlot, Edition, User
from app.models.billetweb_import_log import BilletwebImportLog
from app.models.edition_depositor import EditionDepositor
from app.models.item_list import ListType
from app.repositories import DepositSlotRepository, UserRepository
from app.repositories.edition_depositor import EditionDepositorRepository
from app.services.invitation import InvitationService

if TYPE_CHECKING:
    from fastapi import BackgroundTasks

logger = logging.getLogger(__name__)


# Tarif to ListType mapping
# Based on Billetweb example: "Réservé habitants de Plaisance" = local residents
TARIF_MAPPING = {
    # Standard tarifs
    "standard": ListType.STANDARD.value,
    "normal": ListType.STANDARD.value,
    "classique": ListType.STANDARD.value,
    "tarif normal": ListType.STANDARD.value,
    # Local residents (Plaisance) - maps to LIST_1000 (ALPE members)
    "réservé habitants de plaisance": ListType.LIST_1000.value,
    "reserve habitants de plaisance": ListType.LIST_1000.value,
    "habitants de plaisance": ListType.LIST_1000.value,
    "plaisançois": ListType.LIST_1000.value,
    "plaisancois": ListType.LIST_1000.value,
    # ALPE members
    "adhérent": ListType.LIST_1000.value,
    "adherent": ListType.LIST_1000.value,
    "adhérent alpe": ListType.LIST_1000.value,
    "membre": ListType.LIST_1000.value,
    "membre alpe": ListType.LIST_1000.value,
    "liste 1000": ListType.LIST_1000.value,
    # Family/Friends
    "famille": ListType.LIST_2000.value,
    "ami": ListType.LIST_2000.value,
    "famille/ami": ListType.LIST_2000.value,
    "liste 2000": ListType.LIST_2000.value,
}


@dataclass
class ParsedRow:
    """Parsed data from a single Billetweb row."""

    row_number: int
    nom: str
    prenom: str
    email: str
    seance: str
    tarif: str
    paye: bool
    valide: bool
    telephone: str | None
    adresse: str | None
    code_postal: str | None
    ville: str | None
    commande_ref: str | None
    list_type: str = ListType.STANDARD.value


class BilletwebImportService:
    """Service for importing depositors from Billetweb."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.invitation_service = InvitationService(db)

    @staticmethod
    def _normalize_string(value: str | None) -> str:
        if value is None:
            return ""
        return str(value).strip()

    @staticmethod
    def _normalize_for_comparison(value: str | None) -> str:
        return BilletwebImportService._normalize_string(value).lower()

    @staticmethod
    def _validate_email(email: str) -> bool:
        if not email:
            return False
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))

    @staticmethod
    def _validate_phone(phone: str | None) -> bool:
        if not phone:
            return True  # Phone is optional
        cleaned = re.sub(r"[\s.\-]", "", phone)
        if re.match(r"^0[1-9]\d{8}$", cleaned):
            return True
        if re.match(r"^\+33[1-9]\d{8}$", cleaned):
            return True
        return False

    @staticmethod
    def _normalize_phone(phone: str | None) -> str | None:
        if not phone:
            return None
        cleaned = re.sub(r"[\s.\-]", "", phone)
        if cleaned.startswith("+33"):
            cleaned = "0" + cleaned[3:]
        return cleaned

    @staticmethod
    def _map_tarif_to_list_type(tarif: str) -> str:
        normalized = BilletwebImportService._normalize_for_comparison(tarif)
        return TARIF_MAPPING.get(normalized, ListType.STANDARD.value)

    async def _process_rows(
        self,
        parsed_rows: list[ParsedRow],
        slot_mapping: dict[str, str],
        edition: Edition,
        imported_by: User,
        import_log: BilletwebImportLog | None = None,
        send_emails: bool = False,
        background_tasks: "BackgroundTasks | None" = None,
    ) -> tuple[int, int, int, int, int]:
        """Process parsed rows: create/link depositors, send emails.

        This method is shared between API sync and manual import.

        Returns:
            Tuple of (existing_linked, new_created, already_registered,
                      invitations_sent, notifications_sent)
        """
        from sqlalchemy import select

        from app.services.email import email_service

        existing_linked = 0
        new_created = 0
        already_registered = 0
        invitations_sent = 0
        notifications_sent = 0

        # Get deposit slots for email context
        slot_repo = DepositSlotRepository(self.db)
        deposit_slots, _ = await slot_repo.list_by_edition(edition.id)

        for row in parsed_rows:
            # Get slot ID
            seance_normalized = self._normalize_for_comparison(row.seance)
            slot_id = slot_mapping.get(seance_normalized)

            # Check if user exists
            user = await self.user_repo.get_by_email(row.email)

            if user:
                # Check if already registered for this edition
                existing_reg = await self.db.execute(
                    select(EditionDepositor).where(
                        EditionDepositor.edition_id == edition.id,
                        EditionDepositor.user_id == user.id,
                    )
                )
                if existing_reg.scalar_one_or_none():
                    already_registered += 1
                    continue

                # Link existing user to edition
                edition_depositor = EditionDepositor(
                    edition_id=edition.id,
                    user_id=user.id,
                    deposit_slot_id=slot_id,
                    list_type=row.list_type,
                    billetweb_order_ref=row.commande_ref,
                    billetweb_session=row.seance,
                    billetweb_tarif=row.tarif,
                    imported_at=datetime.now(timezone.utc),
                    import_log_id=import_log.id if import_log else None,
                    postal_code=row.code_postal,
                    city=row.ville,
                    address=row.adresse,
                )
                self.db.add(edition_depositor)
                existing_linked += 1

                # Send notification email to existing user
                if send_emails:
                    if background_tasks:
                        background_tasks.add_task(
                            email_service.send_edition_registration_notification,
                            to_email=user.email,
                            first_name=user.first_name,
                            edition_name=edition.name,
                            slot_datetime=deposit_slots[0].start_datetime if slot_id and deposit_slots else None,
                        )
                    else:
                        await email_service.send_edition_registration_notification(
                            to_email=user.email,
                            first_name=user.first_name,
                            edition_name=edition.name,
                            slot_datetime=deposit_slots[0].start_datetime if slot_id and deposit_slots else None,
                        )
                    notifications_sent += 1

            else:
                # Create new user with invitation
                new_user, token = await self.invitation_service.create_invitation(
                    email=row.email,
                    first_name=row.prenom,
                    last_name=row.nom,
                    list_type=row.list_type,
                )

                # Update user with additional info from Billetweb
                new_user.phone = row.telephone
                new_user.address = row.adresse
                new_user.is_local_resident = row.code_postal == "31830"

                # Link to edition
                edition_depositor = EditionDepositor(
                    edition_id=edition.id,
                    user_id=new_user.id,
                    deposit_slot_id=slot_id,
                    list_type=row.list_type,
                    billetweb_order_ref=row.commande_ref,
                    billetweb_session=row.seance,
                    billetweb_tarif=row.tarif,
                    imported_at=datetime.now(timezone.utc),
                    import_log_id=import_log.id if import_log else None,
                    postal_code=row.code_postal,
                    city=row.ville,
                    address=row.adresse,
                )
                self.db.add(edition_depositor)
                new_created += 1

                # Send invitation email
                if send_emails:
                    if background_tasks:
                        background_tasks.add_task(
                            email_service.send_billetweb_invitation_email,
                            to_email=new_user.email,
                            token=token,
                            first_name=new_user.first_name,
                            edition_name=edition.name,
                            slot_datetime=deposit_slots[0].start_datetime if slot_id and deposit_slots else None,
                        )
                    else:
                        await email_service.send_billetweb_invitation_email(
                            to_email=new_user.email,
                            token=token,
                            first_name=new_user.first_name,
                            edition_name=edition.name,
                            slot_datetime=deposit_slots[0].start_datetime if slot_id and deposit_slots else None,
                        )
                    invitations_sent += 1

        return existing_linked, new_created, already_registered, invitations_sent, notifications_sent

    async def import_from_rows(
        self,
        parsed_rows: list[ParsedRow],
        slot_mapping: dict[str, str],
        edition: Edition,
        imported_by: User,
        send_emails: bool = False,
        background_tasks: "BackgroundTasks | None" = None,
    ) -> tuple[int, int, int, int, int]:
        """Import depositors from pre-parsed rows (used by API sync).

        Returns:
            Tuple of (existing_linked, new_created, already_registered,
                      invitations_sent, notifications_sent)
        """
        result = await self._process_rows(
            parsed_rows=parsed_rows,
            slot_mapping=slot_mapping,
            edition=edition,
            imported_by=imported_by,
            import_log=None,
            send_emails=send_emails,
            background_tasks=background_tasks,
        )
        await self.db.commit()
        return result
