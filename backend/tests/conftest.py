"""Pytest configuration and fixtures."""

import asyncio
from collections.abc import AsyncGenerator, Generator
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.main import app
from app.models import Role, User
from app.models.base import Base, get_db_session
from app.services import AuthService

# Use SQLite for tests (in-memory)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    async_session_factory = async_sessionmaker(
        test_engine,
        expire_on_commit=False,
        autoflush=False,
    )

    async with async_session_factory() as session:
        # Insert default roles
        roles = [
            Role(id=1, name="depositor", description="Déposant"),
            Role(id=2, name="volunteer", description="Bénévole"),
            Role(id=3, name="manager", description="Gestionnaire"),
            Role(id=4, name="administrator", description="Administrateur"),
        ]
        for role in roles:
            session.add(role)
        await session.commit()

        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test HTTP client."""

    async def override_get_db_session():
        yield db_session

    app.dependency_overrides[get_db_session] = override_get_db_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_service(db_session: AsyncSession) -> AuthService:
    """Create an auth service instance for testing."""
    return AuthService(db_session)


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user with password."""
    from sqlalchemy import select

    # Get depositor role
    result = await db_session.execute(select(Role).where(Role.name == "depositor"))
    role = result.scalar_one()

    user = User(
        email="test@example.com",
        first_name="Jean",
        last_name="Dupont",
        role_id=role.id,
        password_hash=AuthService.hash_password("TestPassword1!"),
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    # Load role relationship
    result = await db_session.execute(
        select(User).where(User.id == user.id)
    )
    return result.scalar_one()


@pytest_asyncio.fixture
async def inactive_user(db_session: AsyncSession) -> User:
    """Create an inactive test user."""
    from sqlalchemy import select

    result = await db_session.execute(select(Role).where(Role.name == "depositor"))
    role = result.scalar_one()

    user = User(
        email="inactive@example.com",
        first_name="Marie",
        last_name="Martin",
        role_id=role.id,
        invitation_token="test-invitation-token",
        is_active=False,
        is_verified=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> User:
    """Create an admin user."""
    from sqlalchemy import select

    result = await db_session.execute(select(Role).where(Role.name == "administrator"))
    role = result.scalar_one()

    user = User(
        email="admin@example.com",
        first_name="Admin",
        last_name="User",
        role_id=role.id,
        password_hash=AuthService.hash_password("AdminPassword1!"),
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
def sample_edition_data() -> dict[str, Any]:
    """Sample edition data for tests."""
    return {
        "name": "Bourse Printemps 2025",
        "start_datetime": "2025-03-15T09:00:00",
        "end_datetime": "2025-03-16T18:00:00",
        "location": "Salle des fêtes de Plaisance-du-Touch",
    }


@pytest.fixture
def sample_user_data() -> dict[str, Any]:
    """Sample user data for tests."""
    return {
        "email": "test@example.com",
        "first_name": "Jean",
        "last_name": "Dupont",
        "phone": "0612345678",
    }


@pytest.fixture
def sample_article_data() -> dict[str, Any]:
    """Sample article data for tests."""
    return {
        "description": "Pantalon bleu taille 8 ans",
        "category": "clothing",
        "size": "8 ans",
        "price": "5.00",
        "line_number": 1,
    }
