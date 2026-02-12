"""Label generation API endpoints."""

from io import BytesIO
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.dependencies import DBSession, require_role
from app.models import User
from app.models.edition_depositor import EditionDepositor
from app.repositories import EditionRepository, ItemListRepository
from app.schemas import LabelGenerationRequest, LabelStatsResponse
from app.schemas.label import LabelGenerationMode
from app.services.label import generate_labels_pdf, _format_slot_label

router = APIRouter()


def get_item_list_repository(db: DBSession) -> ItemListRepository:
    return ItemListRepository(db)


def get_edition_repository(db: DBSession) -> EditionRepository:
    return EditionRepository(db)


ItemListRepoDep = Annotated[ItemListRepository, Depends(get_item_list_repository)]
EditionRepoDep = Annotated[EditionRepository, Depends(get_edition_repository)]


@router.post(
    "/editions/{edition_id}/labels/generate",
    summary="Generate labels PDF",
    description="Generate a PDF with labels for validated lists. Requires manager or admin role.",
)
async def generate_labels(
    edition_id: str,
    request: LabelGenerationRequest,
    db: DBSession,
    item_list_repo: ItemListRepoDep,
    edition_repo: EditionRepoDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Generate labels PDF for validated lists in an edition."""
    # Get edition
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise HTTPException(status_code=404, detail="Édition non trouvée")

    # Check edition status
    if edition.status not in ("registrations_open", "in_progress"):
        raise HTTPException(
            status_code=400,
            detail="Les étiquettes ne peuvent être générées que pour les éditions au statut « Inscriptions ouvertes » ou « En cours ».",
        )

    # Get lists based on generation mode
    slot_label = None

    if request.mode == LabelGenerationMode.SLOT:
        lists = await item_list_repo.get_lists_for_labels_by_slot(
            edition_id, request.slot_id
        )
        # Get slot label for PDF
        from app.models.deposit_slot import DepositSlot
        from sqlalchemy import select

        slot_result = await db.execute(
            select(DepositSlot).where(DepositSlot.id == request.slot_id)
        )
        slot = slot_result.scalar_one_or_none()
        if slot:
            slot_label = _format_slot_label(slot)

    elif request.mode in (LabelGenerationMode.SELECTION, LabelGenerationMode.INDIVIDUAL):
        lists = await item_list_repo.get_lists_for_labels_by_depositors(
            edition_id, request.depositor_ids
        )

    else:  # COMPLETE
        lists = await item_list_repo.get_lists_for_labels(edition_id)

    if not lists:
        raise HTTPException(
            status_code=404,
            detail="Aucune liste validée trouvée pour les critères sélectionnés.",
        )

    # Generate PDF
    pdf_bytes = generate_labels_pdf(lists, edition, slot_label)

    # Build filename
    filename = f"Etiquettes_{edition.name.replace(' ', '_')}"
    if slot_label:
        filename += f"_{slot_label.replace(' ', '_')}"
    filename += ".pdf"

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/editions/{edition_id}/labels/stats",
    response_model=LabelStatsResponse,
    summary="Get label statistics",
    description="Get statistics about label generation for an edition.",
)
async def get_label_stats(
    edition_id: str,
    item_list_repo: ItemListRepoDep,
    edition_repo: EditionRepoDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Get label generation statistics for an edition."""
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise HTTPException(status_code=404, detail="Édition non trouvée")

    stats = await item_list_repo.get_label_stats(edition_id)
    return LabelStatsResponse(**stats)
