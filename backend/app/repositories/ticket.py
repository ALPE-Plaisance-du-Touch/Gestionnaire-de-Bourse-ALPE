"""Ticket repository for database operations."""

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.ticket import Ticket, TicketMessage
from app.models.user import User


class TicketRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, ticket: Ticket) -> Ticket:
        self.db.add(ticket)
        await self.db.flush()
        await self.db.refresh(ticket)
        return ticket

    async def get_by_id(self, ticket_id: str) -> Ticket | None:
        result = await self.db.execute(
            select(Ticket)
            .options(
                joinedload(Ticket.created_by).joinedload(User.role),
                joinedload(Ticket.assigned_to).joinedload(User.role),
                joinedload(Ticket.edition),
                joinedload(Ticket.messages).joinedload(TicketMessage.sender).joinedload(User.role),
            )
            .where(Ticket.id == ticket_id)
        )
        return result.unique().scalar_one_or_none()

    async def list_for_edition(
        self,
        edition_id: str,
        user: User,
        status: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Ticket], int]:
        base_query = select(Ticket).where(Ticket.edition_id == edition_id)

        # Depositors only see their own tickets
        if user.is_depositor:
            base_query = base_query.where(
                (Ticket.created_by_id == user.id) | (Ticket.assigned_to_id == user.id)
            )

        if status:
            base_query = base_query.where(Ticket.status == status)

        # Count
        count_result = await self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        # Fetch with relations
        result = await self.db.execute(
            base_query
            .options(
                joinedload(Ticket.created_by),
                joinedload(Ticket.assigned_to),
                joinedload(Ticket.messages),
            )
            .order_by(Ticket.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        tickets = list(result.unique().scalars().all())

        return tickets, total

    async def get_unread_count(self, user: User, edition_id: str) -> int:
        """Count tickets with unread messages visible to user."""
        query = (
            select(func.count(TicketMessage.ticket_id.distinct()))
            .select_from(TicketMessage)
            .join(Ticket, TicketMessage.ticket_id == Ticket.id)
            .where(
                Ticket.edition_id == edition_id,
                TicketMessage.sender_id != user.id,
                TicketMessage.is_read == False,  # noqa: E712
            )
        )

        # Depositors only see their own tickets; staff sees all
        if user.is_depositor:
            query = query.where(
                (Ticket.created_by_id == user.id) | (Ticket.assigned_to_id == user.id)
            )

        result = await self.db.execute(query)
        return result.scalar_one()

    async def get_unread_count_for_ticket(
        self, ticket_id: str, user_id: str
    ) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(TicketMessage)
            .where(
                TicketMessage.ticket_id == ticket_id,
                TicketMessage.sender_id != user_id,
                TicketMessage.is_read == False,  # noqa: E712
            )
        )
        return result.scalar_one()

    async def mark_messages_as_read(
        self, ticket_id: str, user_id: str
    ) -> None:
        """Mark all messages in a ticket as read for a given user (except their own)."""
        await self.db.execute(
            update(TicketMessage)
            .where(
                TicketMessage.ticket_id == ticket_id,
                TicketMessage.sender_id != user_id,
                TicketMessage.is_read == False,  # noqa: E712
            )
            .values(is_read=True)
        )

    async def add_message(self, message: TicketMessage) -> TicketMessage:
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message
