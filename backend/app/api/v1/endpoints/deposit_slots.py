"""Deposit slot API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import DBSession, require_role
from app.exceptions import EditionNotFoundError, ValidationError
from app.models import User
from app.repositories import DepositSlotRepository
from app.repositories.edition_depositor import EditionDepositorRepository
from app.schemas import (
    DepositSlotCreate,
    DepositSlotListResponse,
    DepositSlotResponse,
    DepositSlotUpdate,
)
from app.services import EditionService

router = APIRouter()


def get_edition_service(db: DBSession) -> EditionService:
    """Get EditionService instance."""
    return EditionService(db)


def get_deposit_slot_repository(db: DBSession) -> DepositSlotRepository:
    """Get DepositSlotRepository instance."""
    return DepositSlotRepository(db)


EditionServiceDep = Annotated[EditionService, Depends(get_edition_service)]
DepositSlotRepoDep = Annotated[DepositSlotRepository, Depends(get_deposit_slot_repository)]


@router.get(
    "",
    response_model=DepositSlotListResponse,
    summary="List deposit slots",
    description="List all deposit slots for an edition.",
)
async def list_deposit_slots(
    edition_id: str,
    db: DBSession,
    edition_service: EditionServiceDep,
    repo: DepositSlotRepoDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """List all deposit slots for an edition."""
    # Verify edition exists
    try:
        await edition_service.get_edition(edition_id)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )

    slots, total = await repo.list_by_edition(edition_id)

    ed_repo = EditionDepositorRepository(db)
    items = []
    for s in slots:
        data = DepositSlotResponse.model_validate(s)
        data.registered_count = await ed_repo.count_by_slot(s.id)
        items.append(data)

    return DepositSlotListResponse(
        items=items,
        total=total,
    )


@router.post(
    "",
    response_model=DepositSlotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create deposit slot",
    description="Create a new deposit slot for an edition.",
)
async def create_deposit_slot(
    edition_id: str,
    request: DepositSlotCreate,
    edition_service: EditionServiceDep,
    repo: DepositSlotRepoDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Create a new deposit slot."""
    # Verify edition exists and is editable
    try:
        edition = await edition_service.get_edition(edition_id)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )

    if edition.is_closed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot modify a closed edition",
        )

    # Check for overlapping slots
    has_overlap = await repo.has_overlapping_slot(
        edition_id=edition_id,
        start_datetime=request.start_datetime,
        end_datetime=request.end_datetime,
    )

    if has_overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ce créneau chevauche un créneau existant",
        )

    slot = await repo.create(
        edition_id=edition_id,
        start_datetime=request.start_datetime,
        end_datetime=request.end_datetime,
        max_capacity=request.max_capacity,
        reserved_for_locals=request.reserved_for_locals,
        description=request.description,
    )

    return DepositSlotResponse.model_validate(slot)


@router.get(
    "/{slot_id}",
    response_model=DepositSlotResponse,
    summary="Get deposit slot",
    description="Get a single deposit slot by ID.",
)
async def get_deposit_slot(
    edition_id: str,
    slot_id: str,
    edition_service: EditionServiceDep,
    repo: DepositSlotRepoDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Get a single deposit slot."""
    # Verify edition exists
    try:
        await edition_service.get_edition(edition_id)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )

    slot = await repo.get_by_id(slot_id)

    if not slot or slot.edition_id != edition_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deposit slot {slot_id} not found",
        )

    return DepositSlotResponse.model_validate(slot)


@router.put(
    "/{slot_id}",
    response_model=DepositSlotResponse,
    summary="Update deposit slot",
    description="Update a deposit slot.",
)
async def update_deposit_slot(
    edition_id: str,
    slot_id: str,
    request: DepositSlotUpdate,
    edition_service: EditionServiceDep,
    repo: DepositSlotRepoDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Update a deposit slot."""
    # Verify edition exists and is editable
    try:
        edition = await edition_service.get_edition(edition_id)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )

    if edition.is_closed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot modify a closed edition",
        )

    slot = await repo.get_by_id(slot_id)

    if not slot or slot.edition_id != edition_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deposit slot {slot_id} not found",
        )

    # Check for overlapping slots if dates are changing
    if request.start_datetime or request.end_datetime:
        new_start = request.start_datetime or slot.start_datetime
        new_end = request.end_datetime or slot.end_datetime

        has_overlap = await repo.has_overlapping_slot(
            edition_id=edition_id,
            start_datetime=new_start,
            end_datetime=new_end,
            exclude_slot_id=slot_id,
        )

        if has_overlap:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Ce créneau chevauche un créneau existant",
            )

    # Build update kwargs
    update_data = request.model_dump(exclude_unset=True)
    updated_slot = await repo.update(slot, **update_data)

    return DepositSlotResponse.model_validate(updated_slot)


@router.delete(
    "/{slot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete deposit slot",
    description="Delete a deposit slot.",
)
async def delete_deposit_slot(
    edition_id: str,
    slot_id: str,
    edition_service: EditionServiceDep,
    repo: DepositSlotRepoDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Delete a deposit slot."""
    # Verify edition exists and is editable
    try:
        edition = await edition_service.get_edition(edition_id)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )

    if edition.is_closed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot modify a closed edition",
        )

    slot = await repo.get_by_id(slot_id)

    if not slot or slot.edition_id != edition_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deposit slot {slot_id} not found",
        )

    await repo.delete(slot)
