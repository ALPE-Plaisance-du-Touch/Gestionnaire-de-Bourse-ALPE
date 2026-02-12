"""Payout management API endpoints."""

from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from io import BytesIO

from app.dependencies import DBSession, require_role
from app.exceptions import (
    EditionNotFoundError,
    PayoutAlreadyPaidError,
    PayoutNotFoundError,
    ValidationError,
)
from app.models import User
from app.schemas.payout import (
    CalculatePayoutsResponse,
    PayoutDashboardResponse,
    PayoutResponse,
    PayoutStatsResponse,
    RecordPaymentRequest,
    UpdatePayoutNotesRequest,
)
from app.services.payout import (
    calculate_payouts,
    generate_all_receipts,
    generate_payout_excel_export,
    generate_receipt,
    get_payout_dashboard,
    get_payout_detail,
    get_payout_stats,
    list_payouts,
    recalculate_payout,
    record_payment,
    update_payout_notes,
)

router = APIRouter()

ManagerRole = Annotated[User, Depends(require_role(["manager", "administrator"]))]


@router.post(
    "/editions/{edition_id}/payouts/calculate",
    response_model=CalculatePayoutsResponse,
    summary="Calculate payouts for all depositors",
)
async def calculate_payouts_endpoint(
    edition_id: str,
    db: DBSession,
    current_user: ManagerRole,
):
    try:
        return await calculate_payouts(edition_id, current_user, db)
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.get(
    "/editions/{edition_id}/payouts",
    summary="List payouts for an edition",
)
async def list_payouts_endpoint(
    edition_id: str,
    db: DBSession,
    current_user: ManagerRole,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    payout_status: str | None = Query(None, alias="status"),
    search: str | None = None,
):
    try:
        return await list_payouts(
            edition_id, db,
            page=page, per_page=per_page,
            status=payout_status, search=search,
        )
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")


@router.get(
    "/editions/{edition_id}/payouts/stats",
    response_model=PayoutStatsResponse,
    summary="Get payout statistics",
)
async def get_payout_stats_endpoint(
    edition_id: str,
    db: DBSession,
    current_user: ManagerRole,
):
    try:
        return await get_payout_stats(edition_id, db)
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")


@router.get(
    "/editions/{edition_id}/payouts/dashboard",
    response_model=PayoutDashboardResponse,
    summary="Get detailed payout dashboard statistics",
)
async def get_payout_dashboard_endpoint(
    edition_id: str,
    db: DBSession,
    current_user: ManagerRole,
):
    try:
        return await get_payout_dashboard(edition_id, db)
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")


@router.get(
    "/editions/{edition_id}/payouts/export-excel",
    summary="Export payouts as Excel file",
)
async def export_payouts_excel_endpoint(
    edition_id: str,
    db: DBSession,
    current_user: ManagerRole,
):
    try:
        excel_bytes, filename = await generate_payout_excel_export(edition_id, db)
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")

    return StreamingResponse(
        BytesIO(excel_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/editions/{edition_id}/closure-report",
    summary="Download edition closure report PDF",
)
async def download_closure_report_endpoint(
    edition_id: str,
    db: DBSession,
    current_user: ManagerRole,
):
    from app.repositories import EditionRepository, PayoutRepository
    from app.services.closure_report_pdf import generate_closure_report_pdf

    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise HTTPException(status_code=404, detail="Edition not found")

    payout_repo = PayoutRepository(db)
    stats = await payout_repo.get_stats(edition_id)
    payouts_list, _ = await payout_repo.list_by_edition(edition_id, offset=0, limit=10000)

    full_payouts = []
    for p in payouts_list:
        full_payout = await payout_repo.get_by_id(p.id)
        full_payouts.append(full_payout)

    closed_by = f"{current_user.first_name} {current_user.last_name}"
    pdf_bytes = generate_closure_report_pdf(edition, stats, full_payouts, closed_by)

    edition_name = edition.name.replace(" ", "_") if edition.name else "Edition"
    filename = f"Rapport_Cloture_{edition_name}.pdf"

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/editions/{edition_id}/payouts/{payout_id}",
    response_model=PayoutResponse,
    summary="Get payout details",
)
async def get_payout_detail_endpoint(
    edition_id: str,
    payout_id: str,
    db: DBSession,
    current_user: ManagerRole,
):
    try:
        return await get_payout_detail(payout_id, db)
    except PayoutNotFoundError:
        raise HTTPException(status_code=404, detail="Payout not found")


@router.get(
    "/editions/{edition_id}/payouts/{payout_id}/receipt",
    summary="Download payout receipt PDF",
)
async def download_receipt_endpoint(
    edition_id: str,
    payout_id: str,
    db: DBSession,
    current_user: ManagerRole,
):
    try:
        pdf_bytes, filename = await generate_receipt(payout_id, db)
    except PayoutNotFoundError:
        raise HTTPException(status_code=404, detail="Payout not found")

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post(
    "/editions/{edition_id}/payouts/{payout_id}/pay",
    response_model=PayoutResponse,
    summary="Record a payout payment",
)
async def record_payment_endpoint(
    edition_id: str,
    payout_id: str,
    request: RecordPaymentRequest,
    db: DBSession,
    current_user: ManagerRole,
):
    try:
        return await record_payment(
            payout_id,
            request.payment_method,
            request.payment_reference,
            request.notes,
            current_user,
            db,
        )
    except PayoutNotFoundError:
        raise HTTPException(status_code=404, detail="Payout not found")
    except PayoutAlreadyPaidError as e:
        raise HTTPException(status_code=409, detail=e.message)
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.put(
    "/editions/{edition_id}/payouts/{payout_id}/notes",
    response_model=PayoutResponse,
    summary="Update payout notes",
)
async def update_notes_endpoint(
    edition_id: str,
    payout_id: str,
    request: UpdatePayoutNotesRequest,
    db: DBSession,
    current_user: ManagerRole,
):
    try:
        return await update_payout_notes(
            payout_id, request.notes, request.is_absent, current_user, db
        )
    except PayoutNotFoundError:
        raise HTTPException(status_code=404, detail="Payout not found")


@router.post(
    "/editions/{edition_id}/payouts/{payout_id}/recalculate",
    response_model=PayoutResponse,
    summary="Recalculate a single payout",
)
async def recalculate_payout_endpoint(
    edition_id: str,
    payout_id: str,
    db: DBSession,
    current_user: ManagerRole,
):
    try:
        return await recalculate_payout(payout_id, current_user, db)
    except PayoutNotFoundError:
        raise HTTPException(status_code=404, detail="Payout not found")
    except PayoutAlreadyPaidError as e:
        raise HTTPException(status_code=409, detail=e.message)


@router.post(
    "/editions/{edition_id}/payouts/{payout_id}/remind",
    summary="Send reminder email to absent depositor",
)
async def send_payout_reminder_endpoint(
    edition_id: str,
    payout_id: str,
    background_tasks: BackgroundTasks,
    db: DBSession,
    current_user: ManagerRole,
):
    from app.repositories import EditionRepository, PayoutRepository
    from app.services.email import email_service

    payout_repo = PayoutRepository(db)
    payout = await payout_repo.get_by_id(payout_id)
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")

    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)

    depositor = payout.depositor
    background_tasks.add_task(
        email_service.send_payout_reminder_email,
        to_email=depositor.email,
        first_name=depositor.first_name,
        net_amount=f"{payout.net_amount:.2f}",
        edition_name=edition.name if edition else None,
        location=getattr(edition, "location", None),
    )

    # Track reminder in notes
    from datetime import datetime
    reminder_note = f"Relance envoyee le {datetime.now().strftime('%d/%m/%Y')}"
    if payout.notes:
        payout.notes = f"{payout.notes} | {reminder_note}"
    else:
        payout.notes = reminder_note
    await db.commit()

    return {"message": "Email de relance envoye"}


@router.post(
    "/editions/{edition_id}/payouts/bulk-remind",
    summary="Send reminder emails to all unpaid depositors",
)
async def send_bulk_payout_reminders(
    edition_id: str,
    background_tasks: BackgroundTasks,
    db: DBSession,
    current_user: ManagerRole,
):
    from datetime import datetime

    from sqlalchemy import select
    from sqlalchemy.orm import joinedload

    from app.models import ItemList
    from app.models.payout import Payout
    from app.repositories import EditionRepository
    from app.services.email import email_service

    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise HTTPException(status_code=404, detail="Edition not found")

    # Get all unpaid payouts (pending or ready) with depositor info
    result = await db.execute(
        select(Payout)
        .options(joinedload(Payout.depositor))
        .where(
            Payout.item_list_id.in_(
                select(ItemList.id).where(ItemList.edition_id == edition_id)
            ),
            Payout.status.in_(["pending", "ready"]),
            Payout.paid_at.is_(None),
        )
    )
    payouts = list(result.unique().scalars().all())

    if not payouts:
        return {"emails_queued": 0, "message": "Aucun deposant a relancer"}

    reminder_note = f"Relance bulk le {datetime.now().strftime('%d/%m/%Y')}"
    for payout in payouts:
        depositor = payout.depositor
        background_tasks.add_task(
            email_service.send_payout_reminder_email,
            to_email=depositor.email,
            first_name=depositor.first_name,
            net_amount=f"{payout.net_amount:.2f}",
            edition_name=edition.name,
            location=edition.location,
        )
        if payout.notes:
            payout.notes = f"{payout.notes} | {reminder_note}"
        else:
            payout.notes = reminder_note

    await db.commit()

    return {
        "emails_queued": len(payouts),
        "message": f"{len(payouts)} email(s) de relance envoye(s)",
    }


@router.post(
    "/editions/{edition_id}/payouts/receipts",
    summary="Generate all receipts as a single PDF",
)
async def generate_all_receipts_endpoint(
    edition_id: str,
    db: DBSession,
    current_user: ManagerRole,
):
    try:
        pdf_bytes, filename = await generate_all_receipts(edition_id, db)
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
