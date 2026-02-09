"""Edition API endpoints."""

import logging
import math
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import DBSession, require_role
from app.exceptions import (
    EditionClosedError,
    EditionNotFoundError,
    ValidationError,
)
from app.models import User
from app.models.edition_depositor import EditionDepositor
from app.models.user import Role
from app.schemas import (
    ClosureCheckResponse,
    EditionCreate,
    EditionListResponse,
    EditionResponse,
    EditionStatusUpdate,
    EditionUpdate,
)
from app.services import EditionService
from app.services.email import email_service

logger = logging.getLogger(__name__)

router = APIRouter()


def get_edition_service(db: DBSession) -> EditionService:
    """Get EditionService instance."""
    return EditionService(db)


EditionServiceDep = Annotated[EditionService, Depends(get_edition_service)]


@router.get(
    "",
    response_model=EditionListResponse,
    summary="List editions",
    description="List all editions with optional filtering. Requires manager or admin role.",
)
async def list_editions(
    edition_service: EditionServiceDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
    status_filter: str | None = Query(
        None,
        alias="status",
        description="Filter by status",
    ),
    include_archived: bool = Query(
        False,
        description="Include archived editions",
    ),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """List editions with optional filtering and pagination."""
    editions, total = await edition_service.list_editions(
        status=status_filter,
        include_archived=include_archived,
        page=page,
        limit=limit,
    )

    return EditionListResponse(
        items=[EditionResponse.model_validate(e) for e in editions],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 0,
    )


@router.get(
    "/{edition_id}",
    response_model=EditionResponse,
    summary="Get edition",
    description="Get a single edition by ID. Requires manager or admin role.",
)
async def get_edition(
    edition_id: str,
    edition_service: EditionServiceDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Get a single edition by ID."""
    try:
        edition = await edition_service.get_edition(edition_id)
        return EditionResponse.model_validate(edition)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )


@router.post(
    "",
    response_model=EditionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create edition",
    description="Create a new edition in draft status. Admin only.",
)
async def create_edition(
    request: EditionCreate,
    edition_service: EditionServiceDep,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
):
    """Create a new edition.

    Only administrators can create editions.
    The edition will be created in 'draft' status.
    """
    try:
        edition = await edition_service.create_edition(request, current_user)
        return EditionResponse.model_validate(edition)
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT
            if "existe déjà" in e.message
            else status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )


@router.put(
    "/{edition_id}",
    response_model=EditionResponse,
    summary="Update edition",
    description="Update an edition. Admin can update all fields, managers can only configure dates.",
)
async def update_edition(
    edition_id: str,
    request: EditionUpdate,
    edition_service: EditionServiceDep,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Update an edition.

    Closed editions cannot be updated.
    """
    try:
        edition = await edition_service.update_edition(edition_id, request)
        return EditionResponse.model_validate(edition)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )
    except EditionClosedError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot modify a closed edition",
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT
            if "existe déjà" in e.message
            else status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )


@router.patch(
    "/{edition_id}/status",
    response_model=EditionResponse,
    summary="Update edition status",
    description="Update edition status (transition). Admin only.",
)
async def update_edition_status(
    edition_id: str,
    request: EditionStatusUpdate,
    edition_service: EditionServiceDep,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
):
    """Update edition status.

    Valid transitions:
    - draft → configured
    - configured → draft, registrations_open
    - registrations_open → configured, in_progress
    - in_progress → closed
    - closed → archived
    """
    try:
        edition = await edition_service.update_status(edition_id, request.status)
        return EditionResponse.model_validate(edition)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        )


@router.get(
    "/{edition_id}/closure-check",
    response_model=ClosureCheckResponse,
    summary="Check closure prerequisites",
    description="Check if an edition can be closed. Admin only.",
)
async def check_closure_prerequisites(
    edition_id: str,
    edition_service: EditionServiceDep,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
):
    """Check all prerequisites for closing an edition."""
    try:
        return await edition_service.check_closure_prerequisites(edition_id)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )


async def _notify_managers_of_closure(
    db: AsyncSession,
    edition_name: str,
    closed_by_name: str,
    closed_at: str,
    total_sales: str,
    total_depositors: int,
):
    """Background task to send closure notification to managers and admins."""
    result = await db.execute(
        select(User).join(Role).where(
            Role.name.in_(["manager", "administrator"]),
            User.is_active.is_(True),
        )
    )
    managers = result.scalars().all()

    for manager in managers:
        try:
            await email_service.send_edition_closed_email(
                to_email=manager.email,
                edition_name=edition_name,
                closed_by_name=closed_by_name,
                closed_at=closed_at,
                total_sales=total_sales,
                total_depositors=total_depositors,
            )
        except Exception as e:
            logger.error(f"Failed to notify {manager.email} of closure: {e}")


@router.post(
    "/{edition_id}/close",
    response_model=EditionResponse,
    summary="Close an edition",
    description="Close an edition after verifying prerequisites. Admin only.",
)
async def close_edition(
    edition_id: str,
    edition_service: EditionServiceDep,
    db: DBSession,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
):
    """Close an edition definitively."""
    try:
        edition = await edition_service.close_edition(edition_id, current_user)

        # Send notification emails in background
        from app.repositories.payout import PayoutRepository
        payout_repo = PayoutRepository(db)
        stats = await payout_repo.get_stats(edition_id)
        depositor_count = len(edition.depositors) if edition.depositors else 0

        background_tasks.add_task(
            _notify_managers_of_closure,
            db,
            edition.name,
            f"{current_user.first_name} {current_user.last_name}",
            edition.closed_at.strftime("%d/%m/%Y a %H:%M") if edition.closed_at else "",
            f"{stats['total_sales']:.2f}",
            depositor_count,
        )

        return EditionResponse.model_validate(edition)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.post(
    "/{edition_id}/archive",
    response_model=EditionResponse,
    summary="Archive a closed edition",
    description="Archive a closed edition. Admin only.",
)
async def archive_edition(
    edition_id: str,
    edition_service: EditionServiceDep,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
):
    """Archive a closed edition."""
    try:
        edition = await edition_service.archive_edition(edition_id)
        return EditionResponse.model_validate(edition)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.delete(
    "/{edition_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete edition",
    description="Delete an edition. Only draft editions can be deleted. Admin only.",
)
async def delete_edition(
    edition_id: str,
    edition_service: EditionServiceDep,
    current_user: Annotated[User, Depends(require_role(["administrator"]))],
):
    """Delete an edition.

    Only draft editions can be deleted.
    """
    try:
        await edition_service.delete_edition(edition_id)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message,
        )


@router.post(
    "/{edition_id}/deadline-reminder",
    summary="Send deadline reminder",
    description="Send a deadline reminder email to all depositors of this edition.",
)
async def send_deadline_reminder(
    edition_id: str,
    edition_service: EditionServiceDep,
    db: DBSession,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(require_role(["manager", "administrator"]))],
):
    """Send deadline reminder emails to all depositors."""
    try:
        edition = await edition_service.get_edition(edition_id)
    except EditionNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Edition {edition_id} not found",
        )

    if not edition.declaration_deadline:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Aucune date limite de declaration configuree pour cette edition",
        )

    deadline_str = edition.declaration_deadline.strftime("%d/%m/%Y")

    # Get all depositors with their user info
    from sqlalchemy.orm import joinedload

    result = await db.execute(
        select(EditionDepositor)
        .options(joinedload(EditionDepositor.user))
        .where(EditionDepositor.edition_id == edition_id)
    )
    depositors = list(result.unique().scalars().all())

    if not depositors:
        return {"emails_queued": 0, "message": "Aucun deposant inscrit a cette edition"}

    async def _send_reminders():
        sent = 0
        for dep in depositors:
            try:
                await email_service.send_deadline_reminder(
                    to_email=dep.user.email,
                    first_name=dep.user.first_name or "Deposant",
                    edition_name=edition.name,
                    deadline=deadline_str,
                )
                sent += 1
            except Exception as e:
                logger.error(f"Failed to send deadline reminder to {dep.user.email}: {e}")
        logger.info(f"Deadline reminders sent: {sent}/{len(depositors)}")

    background_tasks.add_task(_send_reminders)

    return {"emails_queued": len(depositors), "message": f"Envoi de {len(depositors)} rappels en cours"}
