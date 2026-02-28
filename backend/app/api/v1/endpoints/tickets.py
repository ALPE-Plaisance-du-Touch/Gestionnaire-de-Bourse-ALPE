"""Ticket messaging API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.dependencies import CurrentActiveUser, DBSession
from app.exceptions import (
    AuthorizationError,
    EditionNotFoundError,
    NotFoundError,
    ValidationError,
)
from app.schemas.ticket import (
    CreateMessageRequest,
    CreateTicketRequest,
    TicketDetailResponse,
    TicketListResponse,
    TicketMessageResponse,
    TicketResponse,
    UnreadCountResponse,
)
from app.services import ticket as ticket_service

router = APIRouter()


@router.post(
    "",
    response_model=TicketDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new ticket",
)
async def create_ticket(
    edition_id: str,
    request: CreateTicketRequest,
    db: DBSession,
    current_user: CurrentActiveUser,
):
    try:
        return await ticket_service.create_ticket(
            edition_id=edition_id,
            subject=request.subject,
            content=request.content,
            user=current_user,
            db=db,
            assigned_to_id=request.assigned_to_id,
        )
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")
    except AuthorizationError:
        raise HTTPException(status_code=403, detail="Volunteers cannot create tickets")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.get(
    "",
    response_model=TicketListResponse,
    summary="List tickets for an edition",
)
async def list_tickets(
    edition_id: str,
    db: DBSession,
    current_user: CurrentActiveUser,
    ticket_status: str | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    try:
        return await ticket_service.list_tickets(
            edition_id=edition_id,
            user=current_user,
            db=db,
            status=ticket_status,
            page=page,
            per_page=per_page,
        )
    except EditionNotFoundError:
        raise HTTPException(status_code=404, detail="Edition not found")


@router.get(
    "/unread-count",
    response_model=UnreadCountResponse,
    summary="Get unread message count for current user",
)
async def get_unread_count(
    edition_id: str,
    db: DBSession,
    current_user: CurrentActiveUser,
):
    return await ticket_service.get_unread_count(
        user=current_user,
        edition_id=edition_id,
        db=db,
    )


@router.get(
    "/{ticket_id}",
    response_model=TicketDetailResponse,
    summary="Get ticket detail with messages",
)
async def get_ticket_detail(
    edition_id: str,
    ticket_id: str,
    db: DBSession,
    current_user: CurrentActiveUser,
):
    try:
        return await ticket_service.get_ticket_detail(
            ticket_id=ticket_id,
            user=current_user,
            db=db,
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")
    except AuthorizationError:
        raise HTTPException(status_code=403, detail="Access denied")


@router.post(
    "/{ticket_id}/messages",
    response_model=TicketMessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Reply to a ticket",
)
async def reply_to_ticket(
    edition_id: str,
    ticket_id: str,
    request: CreateMessageRequest,
    db: DBSession,
    current_user: CurrentActiveUser,
):
    try:
        return await ticket_service.reply_to_ticket(
            ticket_id=ticket_id,
            content=request.content,
            user=current_user,
            db=db,
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")
    except AuthorizationError:
        raise HTTPException(status_code=403, detail="Access denied")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.patch(
    "/{ticket_id}/close",
    response_model=TicketResponse,
    summary="Close a ticket (staff only)",
)
async def close_ticket(
    edition_id: str,
    ticket_id: str,
    db: DBSession,
    current_user: CurrentActiveUser,
):
    try:
        return await ticket_service.close_ticket(
            ticket_id=ticket_id,
            user=current_user,
            db=db,
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")
    except AuthorizationError:
        raise HTTPException(status_code=403, detail="Only managers can close tickets")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)


@router.patch(
    "/{ticket_id}/reopen",
    response_model=TicketResponse,
    summary="Reopen a closed ticket (staff only)",
)
async def reopen_ticket(
    edition_id: str,
    ticket_id: str,
    db: DBSession,
    current_user: CurrentActiveUser,
):
    try:
        return await ticket_service.reopen_ticket(
            ticket_id=ticket_id,
            user=current_user,
            db=db,
        )
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Ticket not found")
    except AuthorizationError:
        raise HTTPException(status_code=403, detail="Only managers can reopen tickets")
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)
