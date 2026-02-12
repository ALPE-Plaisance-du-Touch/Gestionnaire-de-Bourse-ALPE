#!/usr/bin/env python3
"""
Seed script to populate the database with E2E test data.

Usage:
    docker-compose exec backend python scripts/seed.py

Creates data matching tests/data/ fixtures for MCP Chrome DevTools E2E scenarios:
- 4 roles
- 8 test users (6 active + 2 inactive with invitation tokens)
- 5 editions (draft, configured, in_progress, closed, old_closed)
- 6 deposit slots on active edition
- 3 edition-depositor registrations
- 1 item list with 6 articles for standard depositor
"""

import asyncio
import sys
import uuid
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Article,
    DepositSlot,
    Edition,
    EditionDepositor,
    ItemList,
    Role,
    User,
)
from app.models.base import async_session_factory
from app.services import AuthService


# ---------------------------------------------------------------------------
# Data definitions (aligned with tests/data/ fixtures)
# ---------------------------------------------------------------------------

TEST_USERS = [
    {
        "email": "admin@alpe-bourse.fr",
        "first_name": "Sophie",
        "last_name": "Martin",
        "phone": "0561234567",
        "role": "administrator",
        "password": "Admin123!",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "manager@alpe-bourse.fr",
        "first_name": "Pierre",
        "last_name": "Dupont",
        "phone": "0561234568",
        "role": "manager",
        "password": "Manager123!",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "volunteer@alpe-bourse.fr",
        "first_name": "Marie",
        "last_name": "Leblanc",
        "phone": "0561234569",
        "role": "volunteer",
        "password": "Volunteer123!",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "deposant@example.com",
        "first_name": "Jean",
        "last_name": "Durand",
        "phone": "0612345678",
        "role": "depositor",
        "password": "Deposant123!",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "adherent@alpe-bourse.fr",
        "first_name": "Claire",
        "last_name": "Moreau",
        "phone": "0612345679",
        "role": "depositor",
        "password": "Adherent123!",
        "is_active": True,
        "is_verified": True,
        "is_local_resident": True,
    },
    {
        "email": "ami-adherent@example.com",
        "first_name": "Luc",
        "last_name": "Bernard",
        "phone": "0612345680",
        "role": "depositor",
        "password": "Ami12345!",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "inactif@example.com",
        "first_name": "Paul",
        "last_name": "Petit",
        "phone": None,
        "role": "depositor",
        "password": None,
        "is_active": False,
        "is_verified": False,
        "_invitation": "pending",
    },
    {
        "email": "expire@example.com",
        "first_name": "Anne",
        "last_name": "Robert",
        "phone": None,
        "role": "depositor",
        "password": None,
        "is_active": False,
        "is_verified": False,
        "_invitation": "expired",
    },
]

TEST_EDITIONS = [
    {
        "key": "active",
        "name": "Bourse Printemps 2026",
        "description": "Bourse de printemps ALPE Plaisance du Touch",
        "location": "Salle des fetes, 1 Place de la Mairie, Plaisance du Touch",
        "status": "in_progress",
        "start_datetime": datetime(2026, 3, 14, 9, 0),
        "end_datetime": datetime(2026, 3, 15, 18, 0),
        "declaration_deadline": datetime(2026, 2, 21, 23, 59),
        "deposit_start_datetime": datetime(2026, 3, 11, 9, 30),
        "deposit_end_datetime": datetime(2026, 3, 13, 22, 0),
        "retrieval_start_datetime": datetime(2026, 3, 16, 18, 30),
        "retrieval_end_datetime": datetime(2026, 3, 16, 19, 30),
        "commission_rate": Decimal("0.20"),
    },
    {
        "key": "draft",
        "name": "Bourse Automne 2026",
        "description": "Bourse d'automne ALPE",
        "location": "Salle des fetes, Plaisance du Touch",
        "status": "draft",
        "start_datetime": datetime(2026, 10, 17, 9, 0),
        "end_datetime": datetime(2026, 10, 18, 18, 0),
        "commission_rate": Decimal("0.20"),
    },
    {
        "key": "configured",
        "name": "Bourse Printemps 2027",
        "description": "Prochaine edition",
        "location": "Salle des fetes, Plaisance du Touch",
        "status": "configured",
        "start_datetime": datetime(2027, 3, 13, 9, 0),
        "end_datetime": datetime(2027, 3, 14, 18, 0),
        "declaration_deadline": datetime(2027, 2, 20, 23, 59),
        "deposit_start_datetime": datetime(2027, 3, 10, 9, 30),
        "deposit_end_datetime": datetime(2027, 3, 12, 22, 0),
        "retrieval_start_datetime": datetime(2027, 3, 15, 18, 30),
        "retrieval_end_datetime": datetime(2027, 3, 15, 19, 30),
        "commission_rate": Decimal("0.20"),
    },
    {
        "key": "closed",
        "name": "Bourse Automne 2025",
        "description": "Edition cloturee",
        "location": "Salle des fetes, Plaisance du Touch",
        "status": "closed",
        "start_datetime": datetime(2025, 10, 18, 9, 0),
        "end_datetime": datetime(2025, 10, 19, 18, 0),
        "commission_rate": Decimal("0.20"),
        "closed_at": datetime(2025, 10, 22, 10, 0),
    },
    {
        "key": "old_closed",
        "name": "Bourse Printemps 2024",
        "description": "Edition cloturee il y a plus d'un an",
        "location": "Salle des fetes, Plaisance du Touch",
        "status": "closed",
        "start_datetime": datetime(2024, 3, 16, 9, 0),
        "end_datetime": datetime(2024, 3, 17, 18, 0),
        "commission_rate": Decimal("0.20"),
        "closed_at": datetime(2024, 3, 20, 10, 0),
    },
]

DEPOSIT_SLOTS = [
    {
        "start_datetime": datetime(2026, 3, 11, 9, 30),
        "end_datetime": datetime(2026, 3, 11, 11, 30),
        "max_capacity": 20,
        "reserved_for_locals": False,
        "description": "Mercredi matin",
    },
    {
        "start_datetime": datetime(2026, 3, 11, 14, 0),
        "end_datetime": datetime(2026, 3, 11, 18, 0),
        "max_capacity": 40,
        "reserved_for_locals": False,
        "description": "Mercredi apres-midi",
    },
    {
        "start_datetime": datetime(2026, 3, 11, 20, 0),
        "end_datetime": datetime(2026, 3, 11, 22, 0),
        "max_capacity": 20,
        "reserved_for_locals": True,
        "description": "Mercredi soir (reserve Plaisancois)",
    },
    {
        "start_datetime": datetime(2026, 3, 12, 9, 30),
        "end_datetime": datetime(2026, 3, 12, 12, 0),
        "max_capacity": 15,
        "reserved_for_locals": False,
        "description": "Jeudi matin",
    },
    {
        "start_datetime": datetime(2026, 3, 12, 17, 0),
        "end_datetime": datetime(2026, 3, 12, 21, 0),
        "max_capacity": 32,
        "reserved_for_locals": False,
        "description": "Jeudi apres-midi/soir",
    },
    {
        "start_datetime": datetime(2026, 3, 13, 9, 30),
        "end_datetime": datetime(2026, 3, 13, 12, 0),
        "max_capacity": 15,
        "reserved_for_locals": True,
        "description": "Vendredi matin (reserve Plaisancois)",
    },
]

SAMPLE_ARTICLES = [
    {"description": "Pantalon bleu", "category": "clothing", "size": "8 ans", "price": Decimal("5.00")},
    {"description": "T-shirt rouge", "category": "clothing", "size": "6 ans", "price": Decimal("3.00")},
    {"description": "Robe fleurie", "category": "clothing", "size": "4 ans", "price": Decimal("8.00")},
    {"description": "Puzzle 100 pieces", "category": "toys", "price": Decimal("4.00")},
    {"description": "Livre Les Trois Mousquetaires", "category": "books", "price": Decimal("2.00")},
    {"description": "Lot de 3 petites voitures", "category": "toys", "price": Decimal("3.00"), "is_lot": True, "lot_quantity": 3},
]


# ---------------------------------------------------------------------------
# Seed functions
# ---------------------------------------------------------------------------

async def seed_roles(session: AsyncSession) -> dict[str, Role]:
    """Create default roles if they don't exist."""
    print("--- Seeding roles...")

    role_definitions = [
        {"id": 1, "name": "depositor", "description": "Deposant - peut declarer des articles"},
        {"id": 2, "name": "volunteer", "description": "Benevole - peut scanner et vendre"},
        {"id": 3, "name": "manager", "description": "Gestionnaire - peut configurer les editions"},
        {"id": 4, "name": "administrator", "description": "Administrateur - acces complet"},
    ]

    roles = {}
    for role_def in role_definitions:
        result = await session.execute(select(Role).where(Role.name == role_def["name"]))
        role = result.scalar_one_or_none()
        if not role:
            role = Role(**role_def)
            session.add(role)
            print(f"  + Created role: {role_def['name']}")
        else:
            print(f"  = Role exists: {role_def['name']}")
        roles[role_def["name"]] = role

    await session.flush()
    return roles


async def seed_users(session: AsyncSession, roles: dict[str, Role]) -> tuple[dict[str, User], dict[str, str]]:
    """Create 8 test users matching tests/data/users/accounts.json."""
    print("\n--- Seeding users...")

    now = datetime.utcnow()
    users = {}
    invitation_tokens = {}

    for user_data in TEST_USERS:
        result = await session.execute(select(User).where(User.email == user_data["email"]))
        user = result.scalar_one_or_none()

        if not user:
            role = roles[user_data["role"]]
            password_hash = AuthService.hash_password(user_data["password"]) if user_data["password"] else None

            user = User(
                email=user_data["email"],
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                phone=user_data.get("phone"),
                role_id=role.id,
                password_hash=password_hash,
                is_active=user_data["is_active"],
                is_verified=user_data["is_verified"],
                is_local_resident=user_data.get("is_local_resident", False),
            )

            invitation_type = user_data.get("_invitation")
            if invitation_type == "pending":
                token = str(uuid.uuid4())
                user.invitation_token = token
                user.invitation_expires_at = now + timedelta(days=7)
                invitation_tokens[user_data["email"]] = token
            elif invitation_type == "expired":
                token = str(uuid.uuid4())
                user.invitation_token = token
                user.invitation_expires_at = now - timedelta(days=1)
                invitation_tokens[user_data["email"]] = token

            session.add(user)
            status = f"(password: {user_data['password']})" if user_data["password"] else "(invitation)"
            print(f"  + Created user: {user_data['email']} {status}")
        else:
            print(f"  = User exists: {user_data['email']}")

        users[user_data["email"]] = user

    await session.flush()
    return users, invitation_tokens


async def seed_editions(session: AsyncSession, admin_user: User) -> dict[str, Edition]:
    """Create 5 test editions matching tests/data/valid/editions.json."""
    print("\n--- Seeding editions...")

    editions = {}
    for ed_data in TEST_EDITIONS:
        key = ed_data["key"]
        result = await session.execute(select(Edition).where(Edition.name == ed_data["name"]))
        edition = result.scalar_one_or_none()

        if not edition:
            # Build kwargs without internal 'key' field
            kwargs = {k: v for k, v in ed_data.items() if k != "key"}
            edition = Edition(created_by_id=admin_user.id, **kwargs)
            session.add(edition)
            print(f"  + Created edition: {ed_data['name']} (status={ed_data['status']})")
        else:
            print(f"  = Edition exists: {ed_data['name']}")

        editions[key] = edition

    await session.flush()
    return editions


async def seed_deposit_slots(session: AsyncSession, active_edition: Edition) -> list[DepositSlot]:
    """Create 6 deposit slots on active edition matching tests/data/valid/deposit_slots.json."""
    print("\n--- Seeding deposit slots...")

    result = await session.execute(
        select(DepositSlot).where(DepositSlot.edition_id == active_edition.id)
    )
    existing = result.scalars().all()
    if existing:
        print(f"  = {len(existing)} slots already exist for active edition")
        return list(existing)

    slots = []
    for slot_data in DEPOSIT_SLOTS:
        slot = DepositSlot(edition_id=active_edition.id, **slot_data)
        session.add(slot)
        slots.append(slot)
        print(f"  + Created slot: {slot_data['description']} ({slot_data['max_capacity']} places)")

    await session.flush()
    return slots


async def seed_registrations(
    session: AsyncSession,
    active_edition: Edition,
    users: dict[str, User],
    slots: list[DepositSlot],
) -> None:
    """Register 3 depositors on the active edition."""
    print("\n--- Seeding edition registrations...")

    registrations = [
        {
            "email": "deposant@example.com",
            "slot_index": 0,  # Mercredi matin
            "list_type": "standard",
            "postal_code": "31830",
            "city": "Plaisance du Touch",
        },
        {
            "email": "adherent@alpe-bourse.fr",
            "slot_index": 2,  # Mercredi soir (reserve locaux)
            "list_type": "list_1000",
            "postal_code": "31830",
            "city": "Plaisance du Touch",
        },
        {
            "email": "ami-adherent@example.com",
            "slot_index": 3,  # Jeudi matin
            "list_type": "list_2000",
            "postal_code": "31300",
            "city": "Toulouse",
        },
    ]

    for reg in registrations:
        user = users[reg["email"]]
        result = await session.execute(
            select(EditionDepositor).where(
                EditionDepositor.edition_id == active_edition.id,
                EditionDepositor.user_id == user.id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            print(f"  = Registration exists: {reg['email']}")
            continue

        ed_dep = EditionDepositor(
            edition_id=active_edition.id,
            user_id=user.id,
            deposit_slot_id=slots[reg["slot_index"]].id,
            list_type=reg["list_type"],
            postal_code=reg["postal_code"],
            city=reg["city"],
        )
        session.add(ed_dep)
        print(f"  + Registered: {reg['email']} -> {slots[reg['slot_index']].description} ({reg['list_type']})")

    await session.flush()


async def seed_item_list_and_articles(
    session: AsyncSession,
    depositor: User,
    active_edition: Edition,
) -> None:
    """Create a sample item list with 6 articles for the standard depositor."""
    print("\n--- Seeding item list and articles...")

    result = await session.execute(
        select(ItemList).where(
            ItemList.depositor_id == depositor.id,
            ItemList.edition_id == active_edition.id,
        )
    )
    existing_list = result.scalar_one_or_none()

    if existing_list:
        print(f"  = Item list already exists for {depositor.email}")
        return

    item_list = ItemList(
        depositor_id=depositor.id,
        edition_id=active_edition.id,
        number=101,
        list_type="standard",
        status="draft",
    )
    session.add(item_list)
    await session.flush()
    print(f"  + Created item list #{item_list.number}")

    for i, article_data in enumerate(SAMPLE_ARTICLES, start=1):
        article = Article(
            item_list_id=item_list.id,
            line_number=i,
            **article_data,
        )
        session.add(article)
        print(f"    + Article {i}: {article_data['description']} - {article_data['price']}E")

    await session.flush()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    """Run the seed script."""
    print("=" * 60)
    print("BOURSE ALPE - Database Seed Script (E2E)")
    print("=" * 60)

    async with async_session_factory() as session:
        try:
            roles = await seed_roles(session)
            users, invitation_tokens = await seed_users(session, roles)
            editions = await seed_editions(session, users["admin@alpe-bourse.fr"])
            slots = await seed_deposit_slots(session, editions["active"])
            await seed_registrations(session, editions["active"], users, slots)
            await seed_item_list_and_articles(
                session, users["deposant@example.com"], editions["active"]
            )

            await session.commit()

            print("\n" + "=" * 60)
            print("Seed completed successfully!")
            print("=" * 60)

            print("\nTest Credentials:")
            print("-" * 70)
            for user_data in TEST_USERS:
                pwd = user_data["password"] or "(no password)"
                active = "active" if user_data["is_active"] else "INACTIVE"
                print(f"  {user_data['role']:15} | {user_data['email']:30} | {pwd:15} | {active}")
            print("-" * 70)

            if invitation_tokens:
                print("\nInvitation Tokens (for auth E2E tests):")
                print("-" * 70)
                for email, token in invitation_tokens.items():
                    user_data = next(u for u in TEST_USERS if u["email"] == email)
                    inv_type = user_data.get("_invitation", "")
                    print(f"  {email}: {token} ({inv_type})")
                print("-" * 70)
                pending_token = invitation_tokens.get("inactif@example.com", "N/A")
                print(f"\n  Activation URL: http://localhost:5173/activate?token={pending_token}")

            print(f"\nEditions: {len(TEST_EDITIONS)} created")
            print(f"Deposit slots: {len(DEPOSIT_SLOTS)} on active edition")
            print(f"Registrations: 3 depositors on active edition")
            print(f"Articles: {len(SAMPLE_ARTICLES)} on list #101")

            print("\nAccess the app at: http://localhost:5173")
            print("API docs at: http://localhost:8000/docs")
            print("MailHog at: http://localhost:8025")

        except Exception as e:
            await session.rollback()
            print(f"\nError during seed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
