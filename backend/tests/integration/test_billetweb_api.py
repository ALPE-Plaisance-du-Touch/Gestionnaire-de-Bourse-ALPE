"""Integration tests for Billetweb API endpoints."""

from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DepositSlot, Edition, Role, User
from app.models.edition import EditionStatus
from app.services import AuthService


@pytest.fixture
async def manager_user(db_session: AsyncSession) -> User:
    """Create a manager user."""
    result = await db_session.execute(select(Role).where(Role.name == "manager"))
    role = result.scalar_one()

    user = User(
        email="manager@example.com",
        first_name="Manager",
        last_name="User",
        role_id=role.id,
        password_hash=AuthService.hash_password("ManagerPassword1!"),
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


async def get_admin_token(client: AsyncClient, admin_user: User) -> str:
    """Get authentication token for admin user."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@example.com",
            "password": "AdminPassword1!",
        },
    )
    return response.json()["access_token"]


@pytest.fixture
async def configured_edition(db_session: AsyncSession, admin_user: User) -> Edition:
    """Create a configured edition (ready for Billetweb import)."""
    edition = Edition(
        name="Bourse Automne 2025",
        start_datetime=datetime(2025, 11, 5, 9, 0),
        end_datetime=datetime(2025, 11, 6, 18, 0),
        location="Salle des fêtes",
        status=EditionStatus.CONFIGURED,
        commission_rate=15.0,
        deposit_start_datetime=datetime(2025, 11, 5, 14, 0),
        deposit_end_datetime=datetime(2025, 11, 5, 22, 0),
        created_by_id=admin_user.id,
    )
    db_session.add(edition)
    await db_session.commit()
    await db_session.refresh(edition)
    return edition


class TestBilletwebStatsEndpoint:
    """Tests for GET /editions/{id}/billetweb/stats."""

    @pytest.mark.asyncio
    async def test_stats_requires_authentication(
        self, client: AsyncClient, configured_edition: Edition
    ):
        """Test that stats endpoint requires authentication."""
        response = await client.get(
            f"/api/v1/editions/{configured_edition.id}/billetweb/stats"
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_stats_returns_zeros_for_new_edition(
        self, client: AsyncClient, configured_edition: Edition, admin_user: User
    ):
        """Test stats for edition with no imports."""
        token = await get_admin_token(client, admin_user)

        response = await client.get(
            f"/api/v1/editions/{configured_edition.id}/billetweb/stats",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["total_depositors"] == 0
        assert data["total_imports"] == 0


class TestBilletwebDepositorsEndpoint:
    """Tests for GET /editions/{id}/billetweb/depositors."""

    @pytest.mark.asyncio
    async def test_depositors_requires_authentication(
        self, client: AsyncClient, configured_edition: Edition
    ):
        """Test that depositors endpoint requires authentication."""
        response = await client.get(
            f"/api/v1/editions/{configured_edition.id}/billetweb/depositors"
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_depositors_returns_empty_list_for_new_edition(
        self, client: AsyncClient, configured_edition: Edition, admin_user: User
    ):
        """Test depositors list for edition with no imports."""
        token = await get_admin_token(client, admin_user)

        response = await client.get(
            f"/api/v1/editions/{configured_edition.id}/billetweb/depositors",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["items"] == []
        assert data["total"] == 0
