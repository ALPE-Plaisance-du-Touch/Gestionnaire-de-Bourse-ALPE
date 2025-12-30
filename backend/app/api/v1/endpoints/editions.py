"""Edition API endpoints."""

import math
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import DBSession, require_role
from app.exceptions import (
    EditionClosedError,
    EditionNotFoundError,
    ValidationError,
)
from app.models import User
from app.schemas import (
    EditionCreate,
    EditionListResponse,
    EditionResponse,
    EditionStatusUpdate,
    EditionUpdate,
)
from app.services import EditionService

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
