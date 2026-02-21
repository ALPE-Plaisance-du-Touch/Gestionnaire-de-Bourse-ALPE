"""Billetweb API endpoints."""

import math
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import DBSession, require_role
from app.models import User
from app.repositories import BilletwebImportLogRepository, EditionDepositorRepository, EditionRepository
from app.repositories.deposit_slot import DepositSlotRepository
from app.repositories.user import UserRepository
from app.schemas.billetweb import (
    BilletwebImportLogResponse,
    EditionDepositorWithUserResponse,
    EditionDepositorsListResponse,
    ManualDepositorCreateRequest,
)

router = APIRouter()


async def get_edition_or_404(db: DBSession, edition_id: str):
    """Get edition by ID or raise 404."""
    repo = EditionRepository(db)
    edition = await repo.get_by_id(edition_id)
    if not edition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )
    return edition


@router.get(
    "/depositors",
    response_model=EditionDepositorsListResponse,
    summary="List edition depositors",
    description="List all depositors registered for an edition.",
)
async def list_edition_depositors(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
    list_type: str | None = Query(None, description="Filter by list type (standard, list_1000, list_2000)"),
    slot_id: str | None = Query(None, description="Filter by deposit slot ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
):
    """List depositors for an edition."""
    # Verify edition exists
    await get_edition_or_404(db, edition_id)

    repo = EditionDepositorRepository(db)
    depositors, total = await repo.list_by_edition(
        edition_id,
        list_type=list_type,
        slot_id=slot_id,
        page=page,
        limit=limit,
    )

    # Transform to response model
    items = []
    for dep in depositors:
        items.append(
            EditionDepositorWithUserResponse(
                id=dep.id,
                edition_id=dep.edition_id,
                user_id=dep.user_id,
                deposit_slot_id=dep.deposit_slot_id,
                list_type=dep.list_type,
                billetweb_order_ref=dep.billetweb_order_ref,
                billetweb_session=dep.billetweb_session,
                billetweb_tarif=dep.billetweb_tarif,
                imported_at=dep.imported_at,
                postal_code=dep.postal_code,
                city=dep.city,
                created_at=dep.created_at,
                user_email=dep.user.email,
                user_first_name=dep.user.first_name,
                user_last_name=dep.user.last_name,
                user_phone=dep.user.phone,
                slot_start_datetime=dep.deposit_slot.start_datetime if dep.deposit_slot else None,
                slot_end_datetime=dep.deposit_slot.end_datetime if dep.deposit_slot else None,
            )
        )

    return EditionDepositorsListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 0,
    )


@router.post(
    "/depositors/manual",
    response_model=EditionDepositorWithUserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Manually add depositor",
    description="Manually add a depositor to an edition with a deposit slot.",
)
async def create_manual_depositor(
    edition_id: str,
    request: ManualDepositorCreateRequest,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Manually add a depositor to an edition."""
    edition = await get_edition_or_404(db, edition_id)

    if edition.is_closed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Impossible de modifier une édition clôturée",
        )

    # Verify deposit slot exists and belongs to edition
    slot_repo = DepositSlotRepository(db)
    slot = await slot_repo.get_by_id(request.deposit_slot_id)
    if not slot or slot.edition_id != edition_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Créneau de dépôt introuvable",
        )

    # Verify slot not full
    depositor_repo = EditionDepositorRepository(db)
    slot_count = await depositor_repo.count_by_slot(slot.id)
    if slot_count >= slot.max_capacity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ce créneau est complet",
        )

    # Find or create user
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(request.email)
    if not user:
        user = await user_repo.create(
            email=request.email,
            first_name=request.first_name,
            last_name=request.last_name,
            role_name="depositor",
            phone=request.phone,
            is_active=False,
        )

    # Verify user not already registered
    if await depositor_repo.exists(edition_id, user.id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ce déposant est déjà inscrit à cette édition",
        )

    # Create edition depositor
    dep = await depositor_repo.create(
        edition_id=edition_id,
        user_id=user.id,
        deposit_slot_id=request.deposit_slot_id,
        list_type=request.list_type,
        postal_code=request.postal_code,
        city=request.city,
    )

    return EditionDepositorWithUserResponse(
        id=dep.id,
        edition_id=dep.edition_id,
        user_id=dep.user_id,
        deposit_slot_id=dep.deposit_slot_id,
        list_type=dep.list_type,
        billetweb_order_ref=dep.billetweb_order_ref,
        billetweb_session=dep.billetweb_session,
        billetweb_tarif=dep.billetweb_tarif,
        imported_at=dep.imported_at,
        postal_code=dep.postal_code,
        city=dep.city,
        created_at=dep.created_at,
        user_email=user.email,
        user_first_name=user.first_name,
        user_last_name=user.last_name,
        user_phone=user.phone,
        slot_start_datetime=slot.start_datetime,
        slot_end_datetime=slot.end_datetime,
    )


@router.get(
    "/import-logs",
    response_model=list[BilletwebImportLogResponse],
    summary="List import logs",
    description="List all Billetweb import logs for an edition.",
)
async def list_import_logs(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """List import logs for an edition."""
    # Verify edition exists
    await get_edition_or_404(db, edition_id)

    repo = BilletwebImportLogRepository(db)
    logs, _ = await repo.list_by_edition(edition_id, page=page, limit=limit)

    return [BilletwebImportLogResponse.model_validate(log) for log in logs]


@router.get(
    "/stats",
    summary="Get import statistics",
    description="Get import statistics for an edition.",
)
async def get_import_stats(
    edition_id: str,
    db: DBSession,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Get import statistics for an edition."""
    # Verify edition exists
    await get_edition_or_404(db, edition_id)

    depositor_repo = EditionDepositorRepository(db)
    import_repo = BilletwebImportLogRepository(db)

    total_depositors = await depositor_repo.count_by_edition(edition_id)
    total_imports = await import_repo.count_imports_for_edition(edition_id)
    total_imported = await import_repo.get_total_imported_for_edition(edition_id)
    latest_import = await import_repo.get_latest_import(edition_id)

    # Count depositors who haven't received their invitation email yet
    from app.services import EditionService
    edition_service = EditionService(db)
    pending_invitations = await edition_service.get_pending_invitations_count(edition_id)

    return {
        "total_depositors": total_depositors,
        "total_imports": total_imports,
        "total_imported": total_imported,
        "pending_invitations": pending_invitations,
        "latest_import": BilletwebImportLogResponse.model_validate(latest_import) if latest_import else None,
    }
