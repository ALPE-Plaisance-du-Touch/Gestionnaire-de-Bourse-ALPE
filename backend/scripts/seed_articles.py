#!/usr/bin/env python3
"""
Seed script to promote existing articles to ON_SALE and create additional lists.

Depends on: seed.py (must be run first)

Usage:
    docker-compose exec backend python scripts/seed_articles.py

Creates:
- List #101 (existing): 6 articles → ON_SALE with barcodes 010101-010106
- List #1001 (new, list_1000): 4 articles ON_SALE with barcodes 100101-100104
- List #2001 (new, list_2000): 3 articles ON_SALE with barcodes 200101-200103

Total: 13 articles ON_SALE with barcodes
"""

import asyncio
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Article, Edition, ItemList, User
from app.models.base import async_session_factory


# ---------------------------------------------------------------------------
# Data definitions
# ---------------------------------------------------------------------------

LIST_1001_ARTICLES = [
    {"description": "Manteau hiver bleu", "category": "clothing", "size": "6 ans", "price": Decimal("15.00")},
    {"description": "Jeu de societe Monopoly", "category": "games", "price": Decimal("10.00")},
    {"description": "Lot 3 pyjamas", "category": "clothing", "size": "4 ans", "price": Decimal("6.00"), "is_lot": True, "lot_quantity": 3},
    {"description": "Livre Le Petit Prince", "category": "books", "price": Decimal("5.00")},
]

LIST_2001_ARTICLES = [
    {"description": "Robe ete fleurie", "category": "clothing", "size": "3 ans", "price": Decimal("7.00")},
    {"description": "Poussette canne", "category": "stroller", "price": Decimal("35.00")},
    {"description": "Peluche lapin", "category": "toys", "price": Decimal("8.00")},
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_barcode(list_number: int, line_number: int) -> str:
    """Generate barcode in LLLLNN format."""
    return f"{list_number:04d}{line_number:02d}"


async def get_or_fail(session: AsyncSession, model, **filters):
    """Get a single row or raise an error."""
    stmt = select(model)
    for key, value in filters.items():
        stmt = stmt.where(getattr(model, key) == value)
    result = await session.execute(stmt)
    obj = result.scalar_one_or_none()
    if not obj:
        raise RuntimeError(f"{model.__name__} not found with {filters}")
    return obj


# ---------------------------------------------------------------------------
# Seed functions
# ---------------------------------------------------------------------------

async def promote_list_101(session: AsyncSession, item_list: ItemList) -> None:
    """Promote existing list #101 articles to ON_SALE with barcodes."""
    print("\n--- Promoting list #101 articles to ON_SALE...")

    if item_list.status == "checked_in":
        print(f"  = List #{item_list.number} already checked_in, skipping")
        return

    result = await session.execute(
        select(Article).where(Article.item_list_id == item_list.id).order_by(Article.line_number)
    )
    articles = result.scalars().all()

    for article in articles:
        article.status = "on_sale"
        article.conformity_certified = True
        article.barcode = make_barcode(item_list.number, article.line_number)
        print(f"  + Article {article.line_number}: {article.description} -> ON_SALE (barcode={article.barcode})")

    item_list.status = "checked_in"
    item_list.is_validated = True
    item_list.validated_at = datetime.utcnow()
    item_list.checked_in_at = datetime.utcnow()
    print(f"  + List #{item_list.number} -> checked_in, validated")

    await session.flush()


async def create_list_with_articles(
    session: AsyncSession,
    depositor: User,
    edition: Edition,
    list_number: int,
    list_type: str,
    articles_data: list[dict],
) -> None:
    """Create a new item list with ON_SALE articles and barcodes."""
    print(f"\n--- Creating list #{list_number} ({list_type}) for {depositor.email}...")

    result = await session.execute(
        select(ItemList).where(
            ItemList.depositor_id == depositor.id,
            ItemList.edition_id == edition.id,
            ItemList.number == list_number,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        print(f"  = List #{list_number} already exists, skipping")
        return

    now = datetime.utcnow()
    item_list = ItemList(
        depositor_id=depositor.id,
        edition_id=edition.id,
        number=list_number,
        list_type=list_type,
        status="checked_in",
        is_validated=True,
        validated_at=now,
        checked_in_at=now,
    )
    session.add(item_list)
    await session.flush()
    print(f"  + Created list #{list_number} (checked_in, validated)")

    for i, article_data in enumerate(articles_data, start=1):
        barcode = make_barcode(list_number, i)
        article = Article(
            item_list_id=item_list.id,
            line_number=i,
            status="on_sale",
            conformity_certified=True,
            barcode=barcode,
            **article_data,
        )
        session.add(article)
        print(f"    + Article {i}: {article_data['description']} - {article_data['price']}E (barcode={barcode})")

    await session.flush()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    print("=" * 60)
    print("BOURSE ALPE - Seed Articles (ON_SALE with barcodes)")
    print("=" * 60)

    async with async_session_factory() as session:
        try:
            # Get active edition
            edition = await get_or_fail(session, Edition, name="Bourse Printemps 2026")
            print(f"\nEdition: {edition.name} (status={edition.status})")

            # Get depositors
            deposant = await get_or_fail(session, User, email="deposant@example.com")
            adherent = await get_or_fail(session, User, email="adherent@alpe-bourse.fr")
            ami = await get_or_fail(session, User, email="ami-adherent@example.com")

            # Get existing list #101
            list_101 = await get_or_fail(
                session, ItemList,
                depositor_id=deposant.id,
                edition_id=edition.id,
                number=101,
            )

            # Step 1: Promote list #101 articles to ON_SALE
            await promote_list_101(session, list_101)

            # Step 2: Create list #1001 (ALPE member)
            await create_list_with_articles(
                session, adherent, edition,
                list_number=1001,
                list_type="list_1000",
                articles_data=LIST_1001_ARTICLES,
            )

            # Step 3: Create list #2001 (family/friends)
            await create_list_with_articles(
                session, ami, edition,
                list_number=2001,
                list_type="list_2000",
                articles_data=LIST_2001_ARTICLES,
            )

            await session.commit()

            print("\n" + "=" * 60)
            print("Seed articles completed!")
            print("=" * 60)
            print(f"\nList #101:  6 articles ON_SALE (barcodes 010101-010106)")
            print(f"List #1001: 4 articles ON_SALE (barcodes 100101-100104)")
            print(f"List #2001: 3 articles ON_SALE (barcodes 200101-200103)")
            print(f"Total: 13 articles ready for sale")

        except Exception as e:
            await session.rollback()
            print(f"\nError: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
