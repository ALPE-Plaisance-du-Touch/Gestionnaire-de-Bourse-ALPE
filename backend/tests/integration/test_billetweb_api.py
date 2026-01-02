"""Integration tests for Billetweb import API endpoints."""

from datetime import datetime, timezone
from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DepositSlot, Edition, Role, User
from app.models.edition import EditionStatus
from app.services import AuthService

# Path to test fixtures
FIXTURES_PATH = Path(__file__).parent.parent / "fixtures"


def load_fixture(filename: str) -> bytes:
    """Load a test fixture file."""
    filepath = FIXTURES_PATH / filename
    with open(filepath, "rb") as f:
        return f.read()


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


async def get_manager_token(client: AsyncClient, manager_user: User) -> str:
    """Get authentication token for manager user."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "manager@example.com",
            "password": "ManagerPassword1!",
        },
    )
    return response.json()["access_token"]


async def get_user_token(client: AsyncClient, test_user: User) -> str:
    """Get authentication token for regular user (depositor)."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "TestPassword1!",
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
        sale_start_datetime=datetime(2025, 11, 6, 9, 0),
        sale_end_datetime=datetime(2025, 11, 6, 17, 0),
        created_by_id=admin_user.id,
    )
    db_session.add(edition)
    await db_session.commit()
    await db_session.refresh(edition)
    return edition


@pytest.fixture
async def draft_edition(db_session: AsyncSession, admin_user: User) -> Edition:
    """Create a draft edition (not ready for import)."""
    edition = Edition(
        name="Bourse Printemps 2026",
        start_datetime=datetime(2026, 3, 15, 9, 0),
        end_datetime=datetime(2026, 3, 16, 18, 0),
        status=EditionStatus.DRAFT,
        created_by_id=admin_user.id,
    )
    db_session.add(edition)
    await db_session.commit()
    await db_session.refresh(edition)
    return edition


@pytest.fixture
async def deposit_slots(db_session: AsyncSession, configured_edition: Edition) -> list[DepositSlot]:
    """Create deposit slots matching the test fixture dates."""
    slot1 = DepositSlot(
        edition_id=configured_edition.id,
        start_datetime=datetime(2025, 11, 5, 20, 0),
        end_datetime=datetime(2025, 11, 5, 22, 0),
        max_capacity=20,
    )
    slot2 = DepositSlot(
        edition_id=configured_edition.id,
        start_datetime=datetime(2025, 11, 6, 14, 0),
        end_datetime=datetime(2025, 11, 6, 16, 0),
        max_capacity=20,
    )
    db_session.add(slot1)
    db_session.add(slot2)
    await db_session.commit()
    return [slot1, slot2]


class TestBilletwebPreviewEndpoint:
    """Tests for POST /editions/{id}/billetweb/preview."""

    @pytest.mark.asyncio
    async def test_preview_requires_authentication(
        self, client: AsyncClient, configured_edition: Edition
    ):
        """Test that preview endpoint requires authentication."""
        content = load_fixture("billetweb_valid.csv")

        response = await client.post(
            f"/api/v1/editions/{configured_edition.id}/billetweb/preview",
            files={"file": ("test.csv", content, "text/csv")},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_preview_requires_manager_role(
        self, client: AsyncClient, configured_edition: Edition, test_user: User
    ):
        """Test that preview requires manager or admin role."""
        token = await get_user_token(client, test_user)
        content = load_fixture("billetweb_valid.csv")

        response = await client.post(
            f"/api/v1/editions/{configured_edition.id}/billetweb/preview",
            files={"file": ("test.csv", content, "text/csv")},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_preview_valid_file(
        self,
        client: AsyncClient,
        configured_edition: Edition,
        deposit_slots: list[DepositSlot],
        admin_user: User,
    ):
        """Test preview with a valid CSV file."""
        token = await get_admin_token(client, admin_user)
        content = load_fixture("billetweb_valid.csv")

        response = await client.post(
            f"/api/v1/editions/{configured_edition.id}/billetweb/preview",
            files={"file": ("test.csv", content, "text/csv")},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["can_import"] is True
        assert data["stats"]["total_rows"] == 3
        assert len(data["errors"]) == 0

    @pytest.mark.asyncio
    async def test_preview_with_manager_role(
        self,
        client: AsyncClient,
        configured_edition: Edition,
        deposit_slots: list[DepositSlot],
        manager_user: User,
    ):
        """Test that managers can use the preview endpoint."""
        token = await get_manager_token(client, manager_user)
        content = load_fixture("billetweb_valid.csv")

        response = await client.post(
            f"/api/v1/editions/{configured_edition.id}/billetweb/preview",
            files={"file": ("test.csv", content, "text/csv")},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_preview_rejects_non_csv_file(
        self, client: AsyncClient, configured_edition: Edition, admin_user: User
    ):
        """Test that only CSV files are accepted."""
        token = await get_admin_token(client, admin_user)

        response = await client.post(
            f"/api/v1/editions/{configured_edition.id}/billetweb/preview",
            files={"file": ("test.xlsx", b"fake excel content", "application/vnd.ms-excel")},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 400
        assert "csv" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_preview_rejects_draft_edition(
        self, client: AsyncClient, draft_edition: Edition, admin_user: User
    ):
        """Test that preview is rejected for draft editions."""
        token = await get_admin_token(client, admin_user)
        content = load_fixture("billetweb_valid.csv")

        response = await client.post(
            f"/api/v1/editions/{draft_edition.id}/billetweb/preview",
            files={"file": ("test.csv", content, "text/csv")},
            headers={"Authorization": f"Bearer {token}"},
        )

        # 409 Conflict is returned for invalid edition status
        assert response.status_code == 409

    @pytest.mark.asyncio
    async def test_preview_missing_columns(
        self,
        client: AsyncClient,
        configured_edition: Edition,
        deposit_slots: list[DepositSlot],
        admin_user: User,
    ):
        """Test preview with missing required columns."""
        token = await get_admin_token(client, admin_user)
        content = load_fixture("billetweb_missing_columns.csv")

        response = await client.post(
            f"/api/v1/editions/{configured_edition.id}/billetweb/preview",
            files={"file": ("test.csv", content, "text/csv")},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["can_import"] is False
        assert len(data["errors"]) > 0


class TestBilletwebImportEndpoint:
    """Tests for POST /editions/{id}/billetweb/import."""

    @pytest.mark.asyncio
    async def test_import_requires_authentication(
        self, client: AsyncClient, configured_edition: Edition
    ):
        """Test that import endpoint requires authentication."""
        content = load_fixture("billetweb_valid.csv")

        response = await client.post(
            f"/api/v1/editions/{configured_edition.id}/billetweb/import",
            files={"file": ("test.csv", content, "text/csv")},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_import_requires_manager_role(
        self, client: AsyncClient, configured_edition: Edition, test_user: User
    ):
        """Test that import requires manager or admin role."""
        token = await get_user_token(client, test_user)
        content = load_fixture("billetweb_valid.csv")

        response = await client.post(
            f"/api/v1/editions/{configured_edition.id}/billetweb/import",
            files={"file": ("test.csv", content, "text/csv")},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403


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
