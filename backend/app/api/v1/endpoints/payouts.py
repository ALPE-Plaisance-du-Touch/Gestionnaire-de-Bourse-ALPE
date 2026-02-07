"""Payout management API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
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
    PayoutResponse,
    PayoutStatsResponse,
    RecordPaymentRequest,
    UpdatePayoutNotesRequest,
)
from app.services.payout import (
    calculate_payouts,
    generate_all_receipts,
    generate_receipt,
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
