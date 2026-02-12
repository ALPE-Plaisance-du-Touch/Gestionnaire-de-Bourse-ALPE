"""GDPR service for user data export and account deletion."""

import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models import Article, EditionDepositor, ItemList, Payout, Sale, User
from app.repositories import UserRepository

logger = logging.getLogger(__name__)


class GDPRService:
    """Service for GDPR compliance operations."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def export_user_data(self, user: User) -> dict:
        """Export all personal data for a user (GDPR right of access/portability).

        Returns a JSON-serializable dict containing all user data.
        """
        data: dict = {
            "export_date": datetime.now(timezone.utc).isoformat(),
            "profile": self._export_profile(user),
            "edition_registrations": [],
            "item_lists": [],
            "sales_as_seller": [],
            "payouts": [],
        }

        # Edition registrations
        result = await self.db.execute(
            select(EditionDepositor)
            .options(joinedload(EditionDepositor.edition))
            .where(EditionDepositor.user_id == user.id)
        )
        registrations = result.scalars().all()
        for reg in registrations:
            data["edition_registrations"].append({
                "edition_name": reg.edition.name if reg.edition else None,
                "list_type": reg.list_type,
                "registered_at": reg.created_at.isoformat() if reg.created_at else None,
                "postal_code": reg.postal_code,
                "city": reg.city,
                "address": reg.address,
            })

        # Item lists and articles
        result = await self.db.execute(
            select(ItemList)
            .options(
                joinedload(ItemList.articles),
                joinedload(ItemList.edition),
            )
            .where(ItemList.depositor_id == user.id)
        )
        lists = result.unique().scalars().all()
        for item_list in lists:
            list_data = {
                "edition_name": item_list.edition.name if item_list.edition else None,
                "list_number": item_list.number,
                "list_type": item_list.list_type,
                "status": item_list.status,
                "created_at": item_list.created_at.isoformat() if item_list.created_at else None,
                "articles": [],
            }
            for article in item_list.articles:
                list_data["articles"].append({
                    "description": article.description,
                    "category": article.category,
                    "price": str(article.price),
                    "status": article.status,
                    "barcode": article.barcode,
                })
            data["item_lists"].append(list_data)

        # Sales where user was the seller (volunteer)
        result = await self.db.execute(
            select(Sale)
            .options(joinedload(Sale.article))
            .where(Sale.seller_id == user.id)
        )
        sales = result.scalars().all()
        for sale in sales:
            data["sales_as_seller"].append({
                "sold_at": sale.sold_at.isoformat() if sale.sold_at else None,
                "price": str(sale.price),
                "payment_method": sale.payment_method,
                "register_number": sale.register_number,
            })

        # Payouts
        result = await self.db.execute(
            select(Payout).where(Payout.depositor_id == user.id)
        )
        payouts = result.scalars().all()
        for payout in payouts:
            data["payouts"].append({
                "gross_amount": str(payout.gross_amount),
                "commission_amount": str(payout.commission_amount),
                "net_amount": str(payout.net_amount),
                "status": payout.status,
                "payment_method": payout.payment_method,
                "paid_at": payout.paid_at.isoformat() if payout.paid_at else None,
            })

        return data

    async def delete_account(self, user: User) -> None:
        """Delete (anonymize) a user account (GDPR right to erasure).

        Anonymizes personal data while preserving transaction records
        for accounting/legal requirements.
        """
        await self.user_repo.anonymize(user)
        logger.info(f"User account anonymized for GDPR: {user.id}")

    def _export_profile(self, user: User) -> dict:
        """Export user profile data."""
        return {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "address": user.address,
            "role": user.role.name if user.role else None,
            "is_local_resident": user.is_local_resident,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None,
        }
