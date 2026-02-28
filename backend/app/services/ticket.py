"""Ticket service for messaging between depositors and staff."""

import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import (
    AuthorizationError,
    EditionNotFoundError,
    NotFoundError,
    ValidationError,
)
from app.models import User
from app.models.ticket import Ticket, TicketMessage, TicketStatus
from app.repositories import EditionRepository, TicketRepository, UserRepository
from app.schemas.ticket import (
    TicketDetailResponse,
    TicketListResponse,
    TicketMessageResponse,
    TicketResponse,
    UnreadCountResponse,
)

logger = logging.getLogger(__name__)


def _user_can_access_ticket(user: User, ticket: Ticket) -> bool:
    """Check if a user has access to a ticket."""
    if not user.is_depositor:
        return True  # Staff sees everything
    return ticket.created_by_id == user.id or ticket.assigned_to_id == user.id


def _ticket_to_response(
    ticket: Ticket, unread_count: int = 0
) -> TicketResponse:
    created_by = ticket.created_by
    assigned_to = ticket.assigned_to

    last_message_at = None
    if ticket.messages:
        last_message_at = ticket.messages[-1].created_at

    return TicketResponse(
        id=ticket.id,
        edition_id=ticket.edition_id,
        subject=ticket.subject,
        status=ticket.status,
        created_by_id=ticket.created_by_id,
        created_by_name=f"{created_by.first_name} {created_by.last_name}",
        assigned_to_id=ticket.assigned_to_id,
        assigned_to_name=(
            f"{assigned_to.first_name} {assigned_to.last_name}"
            if assigned_to
            else None
        ),
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        closed_at=ticket.closed_at,
        last_message_at=last_message_at,
        unread_count=unread_count,
    )


def _message_to_response(message: TicketMessage) -> TicketMessageResponse:
    sender = message.sender
    return TicketMessageResponse(
        id=message.id,
        sender_id=message.sender_id,
        sender_name=f"{sender.first_name} {sender.last_name}",
        content=message.content,
        is_read=message.is_read,
        created_at=message.created_at,
    )


async def create_ticket(
    edition_id: str,
    subject: str,
    content: str,
    user: User,
    db: AsyncSession,
    assigned_to_id: str | None = None,
) -> TicketDetailResponse:
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    # Depositors cannot assign tickets — they go to staff generically
    if user.is_depositor:
        assigned_to_id = None

    # Staff creating a ticket must specify a depositor
    if not user.is_depositor and assigned_to_id:
        user_repo = UserRepository(db)
        target = await user_repo.get_by_id(assigned_to_id)
        if not target:
            raise ValidationError("Target user not found")

    ticket = Ticket(
        edition_id=edition_id,
        created_by_id=user.id,
        assigned_to_id=assigned_to_id,
        subject=subject,
        status=TicketStatus.OPEN.value,
    )
    ticket_repo = TicketRepository(db)
    ticket = await ticket_repo.create(ticket)

    # Add the first message
    message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=user.id,
        content=content,
        is_read=True,  # Author has already read their own message
    )
    await ticket_repo.add_message(message)
    await db.commit()

    # Reload with relations
    ticket = await ticket_repo.get_by_id(ticket.id)

    response = _ticket_to_response(ticket)
    return TicketDetailResponse(
        **response.model_dump(),
        messages=[_message_to_response(m) for m in ticket.messages],
    )


async def reply_to_ticket(
    ticket_id: str,
    content: str,
    user: User,
    db: AsyncSession,
) -> TicketMessageResponse:
    ticket_repo = TicketRepository(db)
    ticket = await ticket_repo.get_by_id(ticket_id)

    if not ticket:
        raise NotFoundError("Ticket not found")

    if not _user_can_access_ticket(user, ticket):
        raise AuthorizationError("You do not have access to this ticket")

    if ticket.status == TicketStatus.CLOSED.value:
        raise ValidationError("Cannot reply to a closed ticket")

    message = TicketMessage(
        ticket_id=ticket.id,
        sender_id=user.id,
        content=content,
    )
    await ticket_repo.add_message(message)
    await db.commit()

    # Send email notification if staff replies to depositor
    if not user.is_depositor:
        depositor = ticket.created_by if ticket.assigned_to_id is None else ticket.assigned_to
        if depositor and depositor.is_depositor:
            try:
                from app.services.email import email_service

                await email_service.send_ticket_reply_email(
                    to_email=depositor.email,
                    ticket_subject=ticket.subject,
                    reply_preview=content[:200],
                    edition_name=ticket.edition.name,
                )
            except Exception:
                logger.warning("Failed to send ticket reply notification email")

    # Reload message with sender
    ticket = await ticket_repo.get_by_id(ticket_id)
    msg = ticket.messages[-1]
    return _message_to_response(msg)


async def list_tickets(
    edition_id: str,
    user: User,
    db: AsyncSession,
    status: str | None = None,
    page: int = 1,
    per_page: int = 20,
) -> TicketListResponse:
    edition_repo = EditionRepository(db)
    edition = await edition_repo.get_by_id(edition_id)
    if not edition:
        raise EditionNotFoundError(edition_id)

    ticket_repo = TicketRepository(db)
    offset = (page - 1) * per_page
    tickets, total = await ticket_repo.list_for_edition(
        edition_id=edition_id,
        user=user,
        status=status,
        offset=offset,
        limit=per_page,
    )

    ticket_responses = []
    for ticket in tickets:
        unread = await ticket_repo.get_unread_count_for_ticket(ticket.id, user.id)
        ticket_responses.append(_ticket_to_response(ticket, unread_count=unread))

    return TicketListResponse(tickets=ticket_responses, total=total)


async def get_ticket_detail(
    ticket_id: str,
    user: User,
    db: AsyncSession,
) -> TicketDetailResponse:
    ticket_repo = TicketRepository(db)
    ticket = await ticket_repo.get_by_id(ticket_id)

    if not ticket:
        raise NotFoundError("Ticket not found")

    if not _user_can_access_ticket(user, ticket):
        raise AuthorizationError("You do not have access to this ticket")

    # Mark messages as read
    await ticket_repo.mark_messages_as_read(ticket_id, user.id)
    await db.commit()

    response = _ticket_to_response(ticket)
    return TicketDetailResponse(
        **response.model_dump(),
        messages=[_message_to_response(m) for m in ticket.messages],
    )


async def close_ticket(
    ticket_id: str, user: User, db: AsyncSession
) -> TicketResponse:
    if user.is_depositor:
        raise AuthorizationError("Only staff can close tickets")

    ticket_repo = TicketRepository(db)
    ticket = await ticket_repo.get_by_id(ticket_id)

    if not ticket:
        raise NotFoundError("Ticket not found")

    if ticket.status == TicketStatus.CLOSED.value:
        raise ValidationError("Ticket is already closed")

    ticket.status = TicketStatus.CLOSED.value
    ticket.closed_at = datetime.now(timezone.utc)
    await db.commit()

    return _ticket_to_response(ticket)


async def reopen_ticket(
    ticket_id: str, user: User, db: AsyncSession
) -> TicketResponse:
    if user.is_depositor:
        raise AuthorizationError("Only staff can reopen tickets")

    ticket_repo = TicketRepository(db)
    ticket = await ticket_repo.get_by_id(ticket_id)

    if not ticket:
        raise NotFoundError("Ticket not found")

    if ticket.status != TicketStatus.CLOSED.value:
        raise ValidationError("Ticket is not closed")

    ticket.status = TicketStatus.OPEN.value
    ticket.closed_at = None
    await db.commit()

    return _ticket_to_response(ticket)


async def get_unread_count(
    user: User, edition_id: str, db: AsyncSession
) -> UnreadCountResponse:
    ticket_repo = TicketRepository(db)
    count = await ticket_repo.get_unread_count(user, edition_id)
    return UnreadCountResponse(unread_count=count)
