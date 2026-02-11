#!/usr/bin/env python3
"""
Seed script to mark all payouts as PAID for edition closure testing.

Depends on: seed_payouts.py (must be run first)

Usage:
    docker-compose exec backend python scripts/seed_closure.py

WARNING: Only run this AFTER testing payout scenarios (G-16 to G-24, A-E05)
that depend on PENDING payouts. This script marks everything as PAID
to enable the edition closure test (A-03).
"""

import asyncio
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Edition, ItemList, Payout, User
from app.models.base import async_session_factory


async def main():
    print("=" * 60)
    print("BOURSE ALPE - Seed Closure (mark all payouts PAID)")
    print("=" * 60)

    async with async_session_factory() as session:
        try:
            # Get active edition
            result = await session.execute(select(Edition).where(Edition.name == "Bourse Printemps 2026"))
            edition = result.scalar_one_or_none()
            if not edition:
                raise RuntimeError("Edition 'Bourse Printemps 2026' not found.")

            # Get admin
            result = await session.execute(select(User).where(User.email == "admin@alpe-bourse.fr"))
            admin = result.scalar_one_or_none()
            if not admin:
                raise RuntimeError("Admin user not found.")

            print(f"\nEdition: {edition.name}")

            # Find all pending payouts for this edition
            result = await session.execute(
                select(Payout)
                .join(ItemList, Payout.item_list_id == ItemList.id)
                .where(
                    ItemList.edition_id == edition.id,
                    Payout.status != "paid",
                )
            )
            pending_payouts = result.scalars().all()

            if not pending_payouts:
                print("\n  = All payouts already PAID")
            else:
                now = datetime.utcnow()
                for payout in pending_payouts:
                    payout.status = "paid"
                    payout.payment_method = "cash"
                    payout.paid_at = now
                    payout.processed_by_id = admin.id

                    # Update list status
                    result = await session.execute(
                        select(ItemList).where(ItemList.id == payout.item_list_id)
                    )
                    item_list = result.scalar_one()
                    item_list.status = "payout_completed"

                    print(f"  + List #{item_list.number}: payout {payout.net_amount}E -> PAID (cash)")

            await session.commit()

            print("\n" + "=" * 60)
            print("Seed closure completed!")
            print("=" * 60)
            print(f"\nPayouts marked PAID: {len(pending_payouts)}")
            print("Edition is now ready for closure test (A-03)")

        except Exception as e:
            await session.rollback()
            print(f"\nError: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
