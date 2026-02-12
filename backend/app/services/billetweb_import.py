"""Billetweb import service for processing CSV files from Billetweb."""

import csv
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from io import StringIO
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DepositSlot, Edition, User
from app.models.billetweb_import_log import BilletwebImportLog
from app.models.edition_depositor import EditionDepositor
from app.models.item_list import ListType
from app.repositories import DepositSlotRepository, UserRepository
from app.repositories.edition_depositor import EditionDepositorRepository
from app.schemas.billetweb import (
    BilletwebPreviewResponse,
    BilletwebPreviewStats,
    BilletwebRowError,
    ListTypeBreakdown,
    SlotOccupancy,
)
from app.services.invitation import InvitationService

if TYPE_CHECKING:
    from fastapi import BackgroundTasks

logger = logging.getLogger(__name__)


# Billetweb CSV column names (from header row)
class BilletwebColumns:
    """Column names for Billetweb CSV export."""

    SEANCE = "Séance"  # Deposit slot datetime
    TARIF = "Tarif"  # Pricing/list type
    NOM = "Nom"
    PRENOM = "Prénom"
    EMAIL = "Email"
    COMMANDE = "Commande"  # Order reference
    PAYE = "Payé"
    VALIDE = "Valide"
    TELEPHONE = "Téléphone (Commande) - #5"
    ADRESSE = "Adresse (Commande) - #7"
    CODE_POSTAL = "Code postal (Commande) - #8"
    VILLE = "Ville (Commande) - #9"


# Required columns (will raise error if missing)
REQUIRED_COLUMN_NAMES = [
    BilletwebColumns.NOM,
    BilletwebColumns.PRENOM,
    BilletwebColumns.EMAIL,
    BilletwebColumns.SEANCE,
    BilletwebColumns.TARIF,
    BilletwebColumns.PAYE,
    BilletwebColumns.VALIDE,
]

# Optional columns (won't fail if missing)
OPTIONAL_COLUMN_NAMES = [
    BilletwebColumns.TELEPHONE,
    BilletwebColumns.ADRESSE,
    BilletwebColumns.CODE_POSTAL,
    BilletwebColumns.VILLE,
    BilletwebColumns.COMMANDE,
]


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


@dataclass
class PreviewResult:
    """Internal result from preview analysis."""

    stats: BilletwebPreviewStats
    errors: list[BilletwebRowError] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    parsed_rows: list[ParsedRow] = field(default_factory=list)
    slot_mapping: dict[str, str] = field(default_factory=dict)  # seance -> slot_id


class BilletwebImportService:
    """Service for importing depositors from Billetweb Excel exports."""

    def __init__(self, db: AsyncSession):
        """Initialize service with database session."""
        self.db = db
        self.user_repo = UserRepository(db)
        self.invitation_service = InvitationService(db)

    @staticmethod
    def _normalize_string(value: str | None) -> str:
        """Normalize a string value (strip, lowercase for comparison)."""
        if value is None:
            return ""
        return str(value).strip()

    @staticmethod
    def _normalize_for_comparison(value: str | None) -> str:
        """Normalize a string for comparison (lowercase, stripped)."""
        return BilletwebImportService._normalize_string(value).lower()

    @staticmethod
    def _validate_email(email: str) -> bool:
        """Validate email format."""
        if not email:
            return False
        # Basic RFC 5322 pattern
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        return bool(re.match(pattern, email))

    @staticmethod
    def _validate_phone(phone: str | None) -> bool:
        """Validate French phone number format."""
        if not phone:
            return True  # Phone is optional
        # Remove spaces, dots, dashes
        cleaned = re.sub(r"[\s.\-]", "", phone)
        # French phone: 10 digits starting with 0, or +33 followed by 9 digits
        if re.match(r"^0[1-9]\d{8}$", cleaned):
            return True
        if re.match(r"^\+33[1-9]\d{8}$", cleaned):
            return True
        return False

    @staticmethod
    def _normalize_phone(phone: str | None) -> str | None:
        """Normalize phone number to standard format."""
        if not phone:
            return None
        # Remove spaces, dots, dashes
        cleaned = re.sub(r"[\s.\-]", "", phone)
        # Convert +33 to 0
        if cleaned.startswith("+33"):
            cleaned = "0" + cleaned[3:]
        return cleaned

    @staticmethod
    def _map_tarif_to_list_type(tarif: str) -> str:
        """Map Billetweb tarif to ListType."""
        normalized = BilletwebImportService._normalize_for_comparison(tarif)
        return TARIF_MAPPING.get(normalized, ListType.STANDARD.value)

    def _parse_csv(
        self,
        file_content: bytes,
        deposit_slots: list[DepositSlot],
    ) -> PreviewResult:
        """Parse the CSV file and validate data.

        Args:
            file_content: Raw CSV file content
            deposit_slots: List of configured deposit slots for the edition

        Returns:
            PreviewResult with parsed data and validation results
        """
        errors: list[BilletwebRowError] = []
        warnings: list[str] = []
        parsed_rows: list[ParsedRow] = []

        # Build slot mapping (normalized seance datetime -> slot_id)
        slot_mapping: dict[str, str] = {}
        available_slots: list[str] = []
        for slot in deposit_slots:
            # Create a normalized slot name for matching
            slot_name = slot.description or f"{slot.start_datetime.strftime('%Y-%m-%d %H:%M')}"
            available_slots.append(slot_name)
            # Map by datetime string (Billetweb format: "2025-11-05 20:00")
            dt_key = slot.start_datetime.strftime("%Y-%m-%d %H:%M")
            slot_mapping[dt_key] = slot.id
            # Also map by description if provided
            if slot.description:
                slot_mapping[self._normalize_for_comparison(slot.description)] = slot.id

        # Parse CSV file
        try:
            # Try different encodings
            content_str = None
            for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
                try:
                    content_str = file_content.decode(encoding)
                    break
                except UnicodeDecodeError:
                    continue

            if content_str is None:
                raise ValueError("Impossible de décoder le fichier CSV")

            # Parse CSV
            reader = csv.DictReader(StringIO(content_str))
            rows = list(reader)
            headers = reader.fieldnames or []

        except Exception as e:
            logger.error(f"Failed to parse CSV file: {e}")
            return PreviewResult(
                stats=BilletwebPreviewStats(
                    total_rows=0,
                    rows_unpaid_invalid=0,
                    rows_to_process=0,
                    existing_depositors=0,
                    new_depositors=0,
                    duplicates_in_file=0,
                    already_registered=0,
                    errors_count=1,
                ),
                errors=[
                    BilletwebRowError(
                        row_number=0,
                        email=None,
                        error_type="invalid_file",
                        error_message=f"Impossible de lire le fichier CSV: {str(e)}",
                    )
                ],
            )

        total_rows = len(rows)

        if total_rows == 0:
            return PreviewResult(
                stats=BilletwebPreviewStats(
                    total_rows=0,
                    rows_unpaid_invalid=0,
                    rows_to_process=0,
                    existing_depositors=0,
                    new_depositors=0,
                    duplicates_in_file=0,
                    already_registered=0,
                    errors_count=1,
                ),
                errors=[
                    BilletwebRowError(
                        row_number=0,
                        email=None,
                        error_type="empty_file",
                        error_message="Le fichier ne contient aucune donnée",
                    )
                ],
            )

        # Check required columns
        missing_columns = [col for col in REQUIRED_COLUMN_NAMES if col not in headers]
        if missing_columns:
            return PreviewResult(
                stats=BilletwebPreviewStats(
                    total_rows=total_rows,
                    rows_unpaid_invalid=0,
                    rows_to_process=0,
                    existing_depositors=0,
                    new_depositors=0,
                    duplicates_in_file=0,
                    already_registered=0,
                    errors_count=1,
                ),
                errors=[
                    BilletwebRowError(
                        row_number=0,
                        email=None,
                        error_type="invalid_format",
                        error_message=f"Colonnes manquantes dans le fichier CSV: {', '.join(missing_columns)}. Utilisez le fichier d'export Billetweb sans modification.",
                    )
                ],
            )

        # Track seen emails for duplicate detection
        seen_emails: set[str] = set()
        rows_unpaid_invalid = 0
        duplicates_in_file = 0

        for idx, row in enumerate(rows, start=2):  # Start at 2 (row 1 is header)
            # Extract values using column names
            def get_cell(col_name: str) -> str | None:
                val = row.get(col_name)
                return str(val).strip() if val else None

            paye_val = self._normalize_for_comparison(get_cell(BilletwebColumns.PAYE))
            valide_val = self._normalize_for_comparison(get_cell(BilletwebColumns.VALIDE))

            # Filter: only Payé=Oui AND Valide=Oui
            if paye_val != "oui" or valide_val != "oui":
                rows_unpaid_invalid += 1
                continue

            email = self._normalize_string(get_cell(BilletwebColumns.EMAIL))
            nom = self._normalize_string(get_cell(BilletwebColumns.NOM))
            prenom = self._normalize_string(get_cell(BilletwebColumns.PRENOM))
            seance = self._normalize_string(get_cell(BilletwebColumns.SEANCE))
            tarif = self._normalize_string(get_cell(BilletwebColumns.TARIF))
            telephone = get_cell(BilletwebColumns.TELEPHONE)
            adresse = get_cell(BilletwebColumns.ADRESSE)
            code_postal = get_cell(BilletwebColumns.CODE_POSTAL)
            ville = get_cell(BilletwebColumns.VILLE)
            commande_ref = get_cell(BilletwebColumns.COMMANDE)

            # Check for duplicate emails in file
            email_lower = email.lower() if email else ""
            if email_lower and email_lower in seen_emails:
                duplicates_in_file += 1
                continue
            if email_lower:
                seen_emails.add(email_lower)

            # Validate required fields
            row_errors = []

            if not nom:
                row_errors.append(("missing_field", "Nom manquant", "nom", None))
            if not prenom:
                row_errors.append(("missing_field", "Prénom manquant", "prenom", None))
            if not email:
                row_errors.append(("missing_field", "Email manquant", "email", None))
            elif not self._validate_email(email):
                row_errors.append(("invalid_email", f"Format d'email invalide: {email}", "email", email))

            if not seance:
                row_errors.append(("missing_field", "Séance/Créneau manquant", "seance", None))
            else:
                # Check if slot exists - match by datetime or description
                seance_normalized = self._normalize_for_comparison(seance)
                # Try direct datetime match first (Billetweb format: "2025-11-05 20:00")
                if seance not in slot_mapping and seance_normalized not in slot_mapping:
                    row_errors.append((
                        "unknown_slot",
                        f"Créneau non reconnu: '{seance}'. Créneaux disponibles: {', '.join(available_slots)}",
                        "seance",
                        seance,
                    ))

            if telephone and not self._validate_phone(telephone):
                row_errors.append(("invalid_phone", f"Format de téléphone invalide: {telephone}", "telephone", telephone))

            # Add errors to list
            for error_type, message, field_name, field_value in row_errors:
                errors.append(
                    BilletwebRowError(
                        row_number=idx,
                        email=email or None,
                        error_type=error_type,
                        error_message=message,
                        field_name=field_name,
                        field_value=field_value,
                    )
                )

            # If no blocking errors, add to parsed rows
            if not row_errors:
                parsed_rows.append(
                    ParsedRow(
                        row_number=idx,
                        nom=nom,
                        prenom=prenom,
                        email=email,
                        seance=seance,
                        tarif=tarif,
                        paye=True,
                        valide=True,
                        telephone=self._normalize_phone(telephone),
                        adresse=adresse,
                        code_postal=code_postal,
                        ville=ville,
                        commande_ref=commande_ref,
                        list_type=self._map_tarif_to_list_type(tarif),
                    )
                )

        # Add warning for duplicates if any
        if duplicates_in_file > 0:
            warnings.append(
                f"Le fichier contient {duplicates_in_file} doublon(s) (même email). Seule la première occurrence sera importée."
            )

        return PreviewResult(
            stats=BilletwebPreviewStats(
                total_rows=total_rows,
                rows_unpaid_invalid=rows_unpaid_invalid,
                rows_to_process=len(parsed_rows),
                existing_depositors=0,  # Will be filled by preview()
                new_depositors=0,  # Will be filled by preview()
                duplicates_in_file=duplicates_in_file,
                already_registered=0,  # Will be filled by preview()
                errors_count=len(errors),
            ),
            errors=errors,
            warnings=warnings,
            parsed_rows=parsed_rows,
            slot_mapping=slot_mapping,
        )

    async def preview(
        self,
        edition: Edition,
        file_content: bytes,
        filename: str,
    ) -> BilletwebPreviewResponse:
        """Preview a Billetweb import without making changes.

        Args:
            edition: The edition to import depositors into
            file_content: Raw CSV file content
            filename: Original filename for logging

        Returns:
            BilletwebPreviewResponse with statistics and any errors
        """
        # Get deposit slots for this edition via repository (async-safe)
        slot_repo = DepositSlotRepository(self.db)
        deposit_slots, _ = await slot_repo.list_by_edition(edition.id)

        # Parse the CSV file
        result = self._parse_csv(file_content, deposit_slots)

        # If there are parsing errors, return early
        if result.errors:
            return BilletwebPreviewResponse(
                stats=result.stats,
                errors=result.errors,
                warnings=result.warnings,
                can_import=False,
                available_slots=[
                    s.description or f"{s.start_datetime.strftime('%A %d %B %Hh')}-{s.end_datetime.strftime('%Hh')}"
                    for s in deposit_slots
                ],
            )

        # Check which emails already exist in the database
        existing_depositors = 0
        new_depositors = 0
        already_registered = 0

        from sqlalchemy import select

        for row in result.parsed_rows:
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
                else:
                    existing_depositors += 1
            else:
                new_depositors += 1

        # Update stats
        result.stats.existing_depositors = existing_depositors
        result.stats.new_depositors = new_depositors
        result.stats.already_registered = already_registered

        # Add warning for already registered
        if already_registered > 0:
            result.warnings.append(
                f"{already_registered} déposant(s) déjà inscrit(s) à cette édition seront ignorés."
            )

        # Compute slot occupancy and list type breakdown
        ed_repo = EditionDepositorRepository(self.db)
        slot_occupancy = []
        incoming_per_slot: dict[str, int] = {}
        list_type_counts = ListTypeBreakdown()

        # Count incoming per slot from parsed rows (excluding already registered)
        for row in result.parsed_rows:
            seance_normalized = self._normalize_for_comparison(row.seance)
            sid = result.slot_mapping.get(seance_normalized)
            if sid:
                incoming_per_slot[sid] = incoming_per_slot.get(sid, 0) + 1
            # Count by list type
            if row.list_type == ListType.LIST_1000.value:
                list_type_counts.list_1000 += 1
            elif row.list_type == ListType.LIST_2000.value:
                list_type_counts.list_2000 += 1
            else:
                list_type_counts.standard += 1

        for slot in deposit_slots:
            current = await ed_repo.count_by_slot(slot.id)
            incoming = incoming_per_slot.get(slot.id, 0)
            over = (current + incoming) > slot.max_capacity
            desc = slot.description or f"{slot.start_datetime.strftime('%A %d %B %Hh')}-{slot.end_datetime.strftime('%Hh')}"
            slot_occupancy.append(SlotOccupancy(
                slot_id=slot.id,
                slot_description=desc,
                current=current,
                incoming=incoming,
                max_capacity=slot.max_capacity,
                over_capacity=over,
            ))
            if over:
                result.warnings.append(
                    f"Créneau « {desc} » : capacité dépassée ({current + incoming}/{slot.max_capacity})."
                )

        return BilletwebPreviewResponse(
            stats=result.stats,
            errors=result.errors,
            warnings=result.warnings,
            can_import=len(result.errors) == 0,
            available_slots=[
                s.description or f"{s.start_datetime.strftime('%A %d %B %Hh')}-{s.end_datetime.strftime('%Hh')}"
                for s in deposit_slots
            ],
            slot_occupancy=slot_occupancy,
            list_type_breakdown=list_type_counts,
        )

    async def _process_rows(
        self,
        parsed_rows: list[ParsedRow],
        slot_mapping: dict[str, str],
        edition: Edition,
        imported_by: User,
        import_log: BilletwebImportLog | None = None,
        send_emails: bool = True,
        background_tasks: "BackgroundTasks | None" = None,
    ) -> tuple[int, int, int, int, int]:
        """Process parsed rows: create/link depositors, send emails.

        This method is shared between CSV import and API sync.

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

    async def import_file(
        self,
        edition: Edition,
        file_content: bytes,
        filename: str,
        file_size: int,
        imported_by: User,
        ignore_errors: bool = False,
        send_emails: bool = True,
        background_tasks: "BackgroundTasks | None" = None,
    ) -> tuple[BilletwebImportLog, int, int]:
        """Import depositors from a Billetweb CSV file.

        Args:
            edition: The edition to import depositors into
            file_content: Raw CSV file content
            filename: Original filename for logging
            file_size: File size in bytes
            imported_by: User performing the import
            ignore_errors: If True, skip rows with errors instead of failing
            send_emails: If True, send invitation/notification emails
            background_tasks: FastAPI BackgroundTasks for async email sending

        Returns:
            Tuple of (import_log, invitations_sent, notifications_sent)

        Raises:
            ValueError: If there are validation errors and ignore_errors is False
        """
        # Get deposit slots for this edition via repository (async-safe)
        slot_repo = DepositSlotRepository(self.db)
        deposit_slots, _ = await slot_repo.list_by_edition(edition.id)

        # Parse the CSV file
        result = self._parse_csv(file_content, deposit_slots)

        # Check for errors
        if result.errors and not ignore_errors:
            raise ValueError(
                f"Le fichier contient {len(result.errors)} erreur(s). "
                "Corrigez le fichier ou utilisez l'option 'ignorer les erreurs'."
            )

        # Check slot capacity before importing
        ed_repo = EditionDepositorRepository(self.db)
        slot_map = {s.id: s for s in deposit_slots}
        incoming_per_slot: dict[str, int] = {}
        for row in result.parsed_rows:
            seance_normalized = self._normalize_for_comparison(row.seance)
            sid = result.slot_mapping.get(seance_normalized)
            if sid:
                incoming_per_slot[sid] = incoming_per_slot.get(sid, 0) + 1

        for sid, incoming in incoming_per_slot.items():
            slot = slot_map.get(sid)
            if slot:
                current = await ed_repo.count_by_slot(sid)
                if current + incoming > slot.max_capacity:
                    desc = slot.description or f"{slot.start_datetime.strftime('%d/%m %Hh')}"
                    msg = (
                        f"Créneau « {desc} » : capacité dépassée "
                        f"({current + incoming}/{slot.max_capacity})."
                    )
                    if not ignore_errors:
                        raise ValueError(msg)
                    logger.warning(msg)

        # Create import log
        import_log = BilletwebImportLog(
            edition_id=edition.id,
            imported_by_id=imported_by.id,
            filename=filename,
            file_size_bytes=file_size,
            total_rows=result.stats.total_rows,
            rows_skipped_unpaid=result.stats.rows_unpaid_invalid,
            rows_skipped_duplicate=result.stats.duplicates_in_file,
            rows_skipped_invalid=len(result.errors) if ignore_errors else 0,
            import_started_at=datetime.now(timezone.utc),
        )
        self.db.add(import_log)
        await self.db.flush()  # Get the ID

        # Process rows using shared method
        existing_linked, new_created, already_registered, invitations_sent, notifications_sent = (
            await self._process_rows(
                parsed_rows=result.parsed_rows,
                slot_mapping=result.slot_mapping,
                edition=edition,
                imported_by=imported_by,
                import_log=import_log,
                send_emails=send_emails,
                background_tasks=background_tasks,
            )
        )

        # Update import log with results
        import_log.rows_imported = existing_linked + new_created
        import_log.existing_depositors_linked = existing_linked
        import_log.new_depositors_created = new_created
        import_log.rows_skipped_already_registered = already_registered
        import_log.import_completed_at = datetime.now(timezone.utc)

        await self.db.commit()

        return import_log, invitations_sent, notifications_sent

    async def import_from_rows(
        self,
        parsed_rows: list[ParsedRow],
        slot_mapping: dict[str, str],
        edition: Edition,
        imported_by: User,
        send_emails: bool = True,
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
