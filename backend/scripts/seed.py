#!/usr/bin/env python3
"""
Seed script to populate the database with test data.

Usage:
    docker-compose exec backend python scripts/seed.py

This will create:
- Default roles (if not exist)
- Test users for each role
- A sample edition
- Sample item lists and articles
"""

import asyncio
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Article, Edition, ItemList, Role, User
from app.models.base import async_session_factory, engine, Base
from app.services import AuthService


# Test user credentials (using example.com per RFC 2606)
TEST_USERS = [
    {
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "Test",
        "phone": "0600000001",
        "role": "administrator",
        "password": "Admin123!",
    },
    {
        "email": "manager@example.com",
        "first_name": "Marie",
        "last_name": "Manager",
        "phone": "0600000002",
        "role": "manager",
        "password": "Manager123!",
    },
    {
        "email": "volunteer@example.com",
        "first_name": "Vincent",
        "last_name": "Volunteer",
        "phone": "0600000003",
        "role": "volunteer",
        "password": "Volunteer123!",
    },
    {
        "email": "depositor@example.com",
        "first_name": "Denis",
        "last_name": "Depositor",
        "phone": "0600000004",
        "role": "depositor",
        "password": "Depositor123!",
    },
    {
        "email": "depositor2@example.com",
        "first_name": "Danielle",
        "last_name": "Deuxieme",
        "phone": "0600000005",
        "role": "depositor",
        "password": "Depositor123!",
    },
]

# Sample edition
SAMPLE_EDITION = {
    "name": "Bourse de Printemps 2025",
    "location": "Salle des fêtes de Plaisance-du-Touch",
    "description": "Édition de test pour le développement",
    "start_datetime": datetime.now(timezone.utc) + timedelta(days=30),
    "end_datetime": datetime.now(timezone.utc) + timedelta(days=31),
    "deposit_start_datetime": datetime.now(timezone.utc) + timedelta(days=1),
    "deposit_end_datetime": datetime.now(timezone.utc) + timedelta(days=25),
    "declaration_deadline": datetime.now(timezone.utc) + timedelta(days=20),
    "commission_rate": Decimal("0.20"),
    "status": "registrations_open",
}

# Sample articles for depositor
SAMPLE_ARTICLES = [
    {"description": "Pantalon bleu", "category": "clothing", "size": "8 ans", "price": Decimal("5.00")},
    {"description": "T-shirt rouge", "category": "clothing", "size": "6 ans", "price": Decimal("3.00")},
    {"description": "Robe fleurie", "category": "clothing", "size": "4 ans", "price": Decimal("8.00")},
    {"description": "Puzzle 100 pièces", "category": "toys", "price": Decimal("4.00")},
    {"description": "Livre Les Trois Mousquetaires", "category": "books", "price": Decimal("2.00")},
    {"description": "Lot de 3 petites voitures", "category": "toys", "price": Decimal("3.00"), "is_lot": True, "lot_quantity": 3},
]


async def seed_roles(session: AsyncSession) -> dict[str, Role]:
    """Create default roles if they don't exist."""
    print("📦 Seeding roles...")

    role_definitions = [
        {"id": 1, "name": "depositor", "description": "Déposant - peut déclarer des articles"},
        {"id": 2, "name": "volunteer", "description": "Bénévole - peut scanner et vendre"},
        {"id": 3, "name": "manager", "description": "Gestionnaire - peut configurer les éditions"},
        {"id": 4, "name": "administrator", "description": "Administrateur - accès complet"},
    ]

    roles = {}
    for role_def in role_definitions:
        result = await session.execute(select(Role).where(Role.name == role_def["name"]))
        role = result.scalar_one_or_none()

        if not role:
            role = Role(**role_def)
            session.add(role)
            print(f"  ✅ Created role: {role_def['name']}")
        else:
            print(f"  ⏭️  Role exists: {role_def['name']}")

        roles[role_def["name"]] = role

    await session.flush()
    return roles


async def seed_users(session: AsyncSession, roles: dict[str, Role]) -> dict[str, User]:
    """Create test users."""
    print("\n👥 Seeding users...")

    users = {}
    for user_data in TEST_USERS:
        result = await session.execute(select(User).where(User.email == user_data["email"]))
        user = result.scalar_one_or_none()

        if not user:
            role = roles[user_data["role"]]
            user = User(
                email=user_data["email"],
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                phone=user_data["phone"],
                role_id=role.id,
                password_hash=AuthService.hash_password(user_data["password"]),
                is_active=True,
                is_verified=True,
            )
            session.add(user)
            print(f"  ✅ Created user: {user_data['email']} (password: {user_data['password']})")
        else:
            print(f"  ⏭️  User exists: {user_data['email']}")

        users[user_data["email"]] = user

    await session.flush()
    return users


async def seed_edition(session: AsyncSession) -> Edition:
    """Create a sample edition."""
    print("\n📅 Seeding edition...")

    result = await session.execute(select(Edition).where(Edition.name == SAMPLE_EDITION["name"]))
    edition = result.scalar_one_or_none()

    if not edition:
        edition = Edition(**SAMPLE_EDITION)
        session.add(edition)
        print(f"  ✅ Created edition: {SAMPLE_EDITION['name']}")
    else:
        print(f"  ⏭️  Edition exists: {SAMPLE_EDITION['name']}")

    await session.flush()
    return edition


async def seed_item_lists_and_articles(
    session: AsyncSession,
    users: dict[str, User],
    edition: Edition
) -> None:
    """Create sample item lists and articles for depositors."""
    print("\n📝 Seeding item lists and articles...")

    depositor = users.get("depositor@example.com")
    if not depositor:
        print("  ⚠️  Depositor user not found, skipping")
        return

    # Check if list already exists
    result = await session.execute(
        select(ItemList).where(
            ItemList.depositor_id == depositor.id,
            ItemList.edition_id == edition.id,
        )
    )
    existing_list = result.scalar_one_or_none()

    if existing_list:
        print(f"  ⏭️  Item list already exists for depositor")
        return

    # Create item list
    item_list = ItemList(
        depositor_id=depositor.id,
        edition_id=edition.id,
        number=101,
        list_type="standard",
        status="draft",
    )
    session.add(item_list)
    await session.flush()
    print(f"  ✅ Created item list #{item_list.number}")

    # Create articles
    for i, article_data in enumerate(SAMPLE_ARTICLES, start=1):
        article = Article(
            item_list_id=item_list.id,
            line_number=i,
            **article_data,
        )
        session.add(article)
        print(f"    📦 Added article: {article_data['description']} - {article_data['price']}€")

    await session.flush()


async def main():
    """Run the seed script."""
    print("=" * 60)
    print("🌱 BOURSE ALPE - Database Seed Script")
    print("=" * 60)

    async with async_session_factory() as session:
        try:
            # Seed in order
            roles = await seed_roles(session)
            users = await seed_users(session, roles)
            edition = await seed_edition(session)
            await seed_item_lists_and_articles(session, users, edition)

            # Commit all changes
            await session.commit()

            print("\n" + "=" * 60)
            print("✅ Seed completed successfully!")
            print("=" * 60)
            print("\n📋 Test Credentials:")
            print("-" * 40)
            for user_data in TEST_USERS:
                print(f"  {user_data['role']:15} | {user_data['email']:25} | {user_data['password']}")
            print("-" * 40)
            print("\n🌐 Access the app at: http://localhost:5173")
            print("📚 API docs at: http://localhost:8000/docs")

        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error during seed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
