#!/usr/bin/env python3
"""
Seed script to create payout records for E2E testing.

Depends on: seed_sales.py (must be run first)

Usage:
    docker-compose exec backend python scripts/seed_payouts.py

Creates 3 payouts (commission_rate=20%):
- List #101  (standard):  16.00 - 3.20 - 0.00 = 12.80 PAID (cash)
- List #1001 (list_1000): 25.00 - 5.00 - 1.00 = 19.00 PENDING
- List #2001 (list_2000):  0.00 - 0.00 - 2.50 =  0.00 PENDING

Mix of statuses for filter testing.
"""

import asyncio
import sys
from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Article, Edition, ItemList, Payout, User
from app.models.base import async_session_factory


TWO_PLACES = Decimal("0.01")

LIST_FEES = {
    "standard": Decimal("0.00"),
    "list_1000": Decimal("1.00"),
    "list_2000": Decimal("2.50"),
}


def _round(value: Decimal) -> Decimal:
    return value.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    print("=" * 60)
    print("BOURSE ALPE - Seed Payouts")
    print("=" * 60)

    async with async_session_factory() as session:
        try:
            # Get active edition
            result = await session.execute(select(Edition).where(Edition.name == "Bourse Printemps 2026"))
            edition = result.scalar_one_or_none()
            if not edition:
                raise RuntimeError("Edition 'Bourse Printemps 2026' not found. Run seed.py first.")

            commission_rate = edition.commission_rate or Decimal("0.20")
            print(f"\nEdition: {edition.name} (commission={commission_rate})")

            # Get admin for processed_by
            result = await session.execute(select(User).where(User.email == "admin@alpe-bourse.fr"))
            admin = result.scalar_one_or_none()
            if not admin:
                raise RuntimeError("Admin user not found.")

            # Get all item lists for this edition
            result = await session.execute(
                select(ItemList).where(ItemList.edition_id == edition.id)
            )
            item_lists = result.scalars().all()
            print(f"Found {len(item_lists)} item lists")

            created = 0
            skipped = 0

            for item_list in item_lists:
                # Check if payout already exists
                result = await session.execute(
                    select(Payout).where(Payout.item_list_id == item_list.id)
                )
                existing = result.scalar_one_or_none()
                if existing:
                    print(f"\n  = Payout for list #{item_list.number} already exists ({existing.status}), skipping")
                    skipped += 1
                    continue

                # Count articles and calculate gross
                result = await session.execute(
                    select(Article).where(Article.item_list_id == item_list.id)
                )
                articles = result.scalars().all()
                total_articles = len(articles)

                if total_articles == 0:
                    continue

                sold_articles = 0
                gross_amount = Decimal("0.00")
                for article in articles:
                    if article.status == "sold":
                        sold_articles += 1
                        gross_amount += article.price

                unsold_articles = total_articles - sold_articles
                commission_amount = _round(gross_amount * commission_rate)
                list_fees = LIST_FEES.get(item_list.list_type, Decimal("0.00"))
                net_amount = _round(gross_amount - commission_amount - list_fees)
                if net_amount < 0:
                    net_amount = Decimal("0.00")

                payout = Payout(
                    gross_amount=gross_amount,
                    commission_amount=commission_amount,
                    list_fees=list_fees,
                    net_amount=net_amount,
                    total_articles=total_articles,
                    sold_articles=sold_articles,
                    unsold_articles=unsold_articles,
                    status="pending",
                    item_list_id=item_list.id,
                    depositor_id=item_list.depositor_id,
                )
                session.add(payout)

                print(f"\n  + Payout for list #{item_list.number} ({item_list.list_type}):")
                print(f"    Articles: {sold_articles}/{total_articles} sold")
                print(f"    Gross: {gross_amount}E, Commission: {commission_amount}E, Fees: {list_fees}E")
                print(f"    Net: {net_amount}E -> PENDING")

                created += 1

            await session.flush()

            # Mark list #101 payout as PAID (for mixed status testing)
            result = await session.execute(
                select(ItemList).where(
                    ItemList.edition_id == edition.id,
                    ItemList.number == 101,
                )
            )
            list_101 = result.scalar_one_or_none()
            if list_101:
                result = await session.execute(
                    select(Payout).where(Payout.item_list_id == list_101.id)
                )
                payout_101 = result.scalar_one_or_none()
                if payout_101 and payout_101.status == "pending":
                    payout_101.status = "paid"
                    payout_101.payment_method = "cash"
                    payout_101.paid_at = datetime.utcnow()
                    payout_101.processed_by_id = admin.id
                    list_101.status = "payout_completed"
                    print(f"\n  * List #101 payout marked PAID (cash)")

            await session.commit()

            print("\n" + "=" * 60)
            print("Seed payouts completed!")
            print("=" * 60)
            print(f"\nPayouts created: {created}")
            print(f"Skipped: {skipped}")
            print(f"\nRecap:")
            print(f"  List #101:  12.80E net -> PAID (cash)")
            print(f"  List #1001: 19.00E net -> PENDING")
            print(f"  List #2001:  0.00E net -> PENDING")

        except Exception as e:
            await session.rollback()
            print(f"\nError: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
