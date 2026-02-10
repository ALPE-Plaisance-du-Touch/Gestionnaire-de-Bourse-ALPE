#!/usr/bin/env python3
"""
Seed script to create sales data for E2E testing.

Depends on: seed_articles.py (must be run first)

Usage:
    docker-compose exec backend python scripts/seed_sales.py

Creates 5 sales:
- 010101 Pantalon bleu    5.00 cash
- 010102 T-shirt rouge    3.00 card
- 010103 Robe fleurie     8.00 check
- 100101 Manteau hiver   15.00 cash
- 100102 Monopoly        10.00 cash

Results: List #101 = 16.00E gross, List #1001 = 25.00E gross
8 articles remain ON_SALE for volunteer tests.
"""

import asyncio
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Article, Edition, Sale, User
from app.models.base import async_session_factory


# ---------------------------------------------------------------------------
# Sales to create
# ---------------------------------------------------------------------------

SALES = [
    {"barcode": "010101", "price": Decimal("5.00"), "payment_method": "cash"},
    {"barcode": "010102", "price": Decimal("3.00"), "payment_method": "card"},
    {"barcode": "010103", "price": Decimal("8.00"), "payment_method": "check"},
    {"barcode": "100101", "price": Decimal("15.00"), "payment_method": "cash"},
    {"barcode": "100102", "price": Decimal("10.00"), "payment_method": "cash"},
]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    print("=" * 60)
    print("BOURSE ALPE - Seed Sales")
    print("=" * 60)

    async with async_session_factory() as session:
        try:
            # Get edition and seller
            result = await session.execute(select(Edition).where(Edition.name == "Bourse Printemps 2026"))
            edition = result.scalar_one_or_none()
            if not edition:
                raise RuntimeError("Edition 'Bourse Printemps 2026' not found. Run seed.py first.")

            result = await session.execute(select(User).where(User.email == "volunteer@alpe-bourse.fr"))
            seller = result.scalar_one_or_none()
            if not seller:
                raise RuntimeError("Volunteer user not found. Run seed.py first.")

            print(f"\nEdition: {edition.name}")
            print(f"Seller: {seller.email}")

            now = datetime.utcnow()
            created = 0
            skipped = 0

            for sale_data in SALES:
                barcode = sale_data["barcode"]

                # Find article by barcode
                result = await session.execute(
                    select(Article).where(Article.barcode == barcode)
                )
                article = result.scalar_one_or_none()
                if not article:
                    print(f"  ! Article with barcode {barcode} not found, skipping")
                    skipped += 1
                    continue

                # Check if already sold
                if article.status == "sold":
                    print(f"  = Article {barcode} ({article.description}) already sold, skipping")
                    skipped += 1
                    continue

                # Create sale
                sale = Sale(
                    edition_id=edition.id,
                    article_id=article.id,
                    seller_id=seller.id,
                    sold_at=now,
                    price=sale_data["price"],
                    payment_method=sale_data["payment_method"],
                    register_number=1,
                )
                session.add(sale)

                # Update article status
                article.status = "sold"

                print(f"  + Sold: {barcode} {article.description} - {sale_data['price']}E ({sale_data['payment_method']})")
                created += 1

            await session.commit()

            # Count remaining ON_SALE
            result = await session.execute(
                select(Article).where(Article.status == "on_sale")
            )
            remaining = len(result.scalars().all())

            print("\n" + "=" * 60)
            print("Seed sales completed!")
            print("=" * 60)
            print(f"\nSales created: {created}")
            print(f"Skipped: {skipped}")
            print(f"Articles still ON_SALE: {remaining}")
            print(f"\nRecap by list:")
            print(f"  List #101:  3 sold = 16.00E gross")
            print(f"  List #1001: 2 sold = 25.00E gross")
            print(f"  List #2001: 0 sold = 0.00E gross")

        except Exception as e:
            await session.rollback()
            print(f"\nError: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
