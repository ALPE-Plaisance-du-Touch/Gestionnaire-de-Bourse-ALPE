"""Integration tests for editions API endpoints."""

import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Edition, Role, User
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
    """Get authentication token for regular user."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "test@example.com",
            "password": "TestPassword1!",
        },
    )
    return response.json()["access_token"]


@pytest.fixture
async def draft_edition(db_session: AsyncSession, admin_user: User) -> Edition:
    """Create a draft edition."""
    edition = Edition(
        name="Bourse Printemps 2025",
        start_datetime=datetime(2025, 3, 15, 9, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2025, 3, 16, 18, 0, tzinfo=timezone.utc),
        location="Salle des fêtes",
        status=EditionStatus.DRAFT.value,
        created_by_id=admin_user.id,
    )
    db_session.add(edition)
    await db_session.commit()
    await db_session.refresh(edition)
    return edition


@pytest.fixture
async def configured_edition(db_session: AsyncSession, admin_user: User) -> Edition:
    """Create a configured edition."""
    edition = Edition(
        name="Bourse Automne 2025",
        start_datetime=datetime(2025, 9, 20, 9, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2025, 9, 21, 18, 0, tzinfo=timezone.utc),
        location="Salle des fêtes",
        status=EditionStatus.CONFIGURED.value,
        created_by_id=admin_user.id,
    )
    db_session.add(edition)
    await db_session.commit()
    await db_session.refresh(edition)
    return edition


@pytest.mark.asyncio
class TestCreateEdition:
    """Tests for POST /api/v1/editions."""

    async def test_create_edition_as_admin(
        self,
        client: AsyncClient,
        admin_user: User,
    ):
        """Admin can create an edition."""
        token = await get_admin_token(client, admin_user)

        response = await client.post(
            "/api/v1/editions",
            json={
                "name": "Bourse Test 2025",
                "start_datetime": "2025-03-15T09:00:00Z",
                "end_datetime": "2025-03-16T18:00:00Z",
                "location": "Salle des fêtes",
                "description": "Test edition",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Bourse Test 2025"
        assert data["status"] == "draft"
        assert data["location"] == "Salle des fêtes"
        assert data["description"] == "Test edition"

    async def test_create_edition_forbidden_for_manager(
        self,
        client: AsyncClient,
        manager_user: User,
    ):
        """Manager cannot create editions."""
        token = await get_manager_token(client, manager_user)

        response = await client.post(
            "/api/v1/editions",
            json={
                "name": "Bourse Test",
                "start_datetime": "2025-03-15T09:00:00Z",
                "end_datetime": "2025-03-16T18:00:00Z",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403

    async def test_create_edition_forbidden_for_depositor(
        self,
        client: AsyncClient,
        test_user: User,
    ):
        """Depositor cannot create editions."""
        token = await get_user_token(client, test_user)

        response = await client.post(
            "/api/v1/editions",
            json={
                "name": "Bourse Test",
                "start_datetime": "2025-03-15T09:00:00Z",
                "end_datetime": "2025-03-16T18:00:00Z",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403

    async def test_create_edition_duplicate_name(
        self,
        client: AsyncClient,
        admin_user: User,
        draft_edition: Edition,
    ):
        """Cannot create edition with duplicate name."""
        token = await get_admin_token(client, admin_user)

        response = await client.post(
            "/api/v1/editions",
            json={
                "name": draft_edition.name,
                "start_datetime": "2025-03-15T09:00:00Z",
                "end_datetime": "2025-03-16T18:00:00Z",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 409
        assert "existe déjà" in response.json()["detail"]

    async def test_create_edition_invalid_dates(
        self,
        client: AsyncClient,
        admin_user: User,
    ):
        """Cannot create edition with end date before start date."""
        token = await get_admin_token(client, admin_user)

        response = await client.post(
            "/api/v1/editions",
            json={
                "name": "Bourse Invalid",
                "start_datetime": "2025-03-16T09:00:00Z",
                "end_datetime": "2025-03-15T18:00:00Z",  # Before start
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 422

    async def test_create_edition_unauthorized(
        self,
        client: AsyncClient,
    ):
        """Unauthenticated request returns 401."""
        response = await client.post(
            "/api/v1/editions",
            json={
                "name": "Bourse Test",
                "start_datetime": "2025-03-15T09:00:00Z",
                "end_datetime": "2025-03-16T18:00:00Z",
            },
        )

        assert response.status_code == 401


@pytest.mark.asyncio
class TestListEditions:
    """Tests for GET /api/v1/editions."""

    async def test_list_editions_as_manager(
        self,
        client: AsyncClient,
        manager_user: User,
        draft_edition: Edition,
    ):
        """Manager can list editions."""
        token = await get_manager_token(client, manager_user)

        response = await client.get(
            "/api/v1/editions",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert len(data["items"]) >= 1

    async def test_list_editions_as_admin(
        self,
        client: AsyncClient,
        admin_user: User,
        draft_edition: Edition,
    ):
        """Admin can list editions."""
        token = await get_admin_token(client, admin_user)

        response = await client.get(
            "/api/v1/editions",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200

    async def test_list_editions_forbidden_for_depositor(
        self,
        client: AsyncClient,
        test_user: User,
    ):
        """Depositor cannot list editions."""
        token = await get_user_token(client, test_user)

        response = await client.get(
            "/api/v1/editions",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403

    async def test_list_editions_with_pagination(
        self,
        client: AsyncClient,
        admin_user: User,
        draft_edition: Edition,
        configured_edition: Edition,
    ):
        """Pagination works correctly."""
        token = await get_admin_token(client, admin_user)

        response = await client.get(
            "/api/v1/editions?page=1&limit=1",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["total"] >= 2
        assert data["pages"] >= 2


@pytest.mark.asyncio
class TestGetEdition:
    """Tests for GET /api/v1/editions/{id}."""

    async def test_get_edition_as_manager(
        self,
        client: AsyncClient,
        manager_user: User,
        draft_edition: Edition,
    ):
        """Manager can get edition details."""
        token = await get_manager_token(client, manager_user)

        response = await client.get(
            f"/api/v1/editions/{draft_edition.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == draft_edition.id
        assert data["name"] == draft_edition.name

    async def test_get_edition_not_found(
        self,
        client: AsyncClient,
        admin_user: User,
    ):
        """Non-existent edition returns 404."""
        token = await get_admin_token(client, admin_user)

        response = await client.get(
            "/api/v1/editions/nonexistent-id",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404


@pytest.mark.asyncio
class TestUpdateEdition:
    """Tests for PUT /api/v1/editions/{id}."""

    async def test_update_edition_as_admin(
        self,
        client: AsyncClient,
        admin_user: User,
        draft_edition: Edition,
    ):
        """Admin can update edition."""
        token = await get_admin_token(client, admin_user)

        response = await client.put(
            f"/api/v1/editions/{draft_edition.id}",
            json={
                "name": "Bourse Modifiée",
                "location": "Nouveau lieu",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Bourse Modifiée"
        assert data["location"] == "Nouveau lieu"

    async def test_update_edition_as_manager(
        self,
        client: AsyncClient,
        manager_user: User,
        draft_edition: Edition,
    ):
        """Manager can update edition."""
        token = await get_manager_token(client, manager_user)

        response = await client.put(
            f"/api/v1/editions/{draft_edition.id}",
            json={
                "description": "Updated description",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200


@pytest.mark.asyncio
class TestDeleteEdition:
    """Tests for DELETE /api/v1/editions/{id}."""

    async def test_delete_draft_edition_as_admin(
        self,
        client: AsyncClient,
        admin_user: User,
        draft_edition: Edition,
        db_session: AsyncSession,
    ):
        """Admin can delete draft edition."""
        token = await get_admin_token(client, admin_user)

        response = await client.delete(
            f"/api/v1/editions/{draft_edition.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 204

        # Verify edition is deleted
        result = await db_session.execute(
            select(Edition).where(Edition.id == draft_edition.id)
        )
        assert result.scalar_one_or_none() is None

    async def test_delete_configured_edition_fails(
        self,
        client: AsyncClient,
        admin_user: User,
        configured_edition: Edition,
    ):
        """Cannot delete non-draft edition."""
        token = await get_admin_token(client, admin_user)

        response = await client.delete(
            f"/api/v1/editions/{configured_edition.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 409
        assert "brouillon" in response.json()["detail"]

    async def test_delete_edition_forbidden_for_manager(
        self,
        client: AsyncClient,
        manager_user: User,
        draft_edition: Edition,
    ):
        """Manager cannot delete editions."""
        token = await get_manager_token(client, manager_user)

        response = await client.delete(
            f"/api/v1/editions/{draft_edition.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403


@pytest.mark.asyncio
class TestUpdateEditionStatus:
    """Tests for PATCH /api/v1/editions/{id}/status."""

    async def test_transition_draft_to_configured(
        self,
        client: AsyncClient,
        admin_user: User,
        draft_edition: Edition,
    ):
        """Admin can transition from draft to configured."""
        token = await get_admin_token(client, admin_user)

        response = await client.patch(
            f"/api/v1/editions/{draft_edition.id}/status",
            json={"status": "configured"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.json()["status"] == "configured"

    async def test_invalid_transition(
        self,
        client: AsyncClient,
        admin_user: User,
        draft_edition: Edition,
    ):
        """Invalid status transition returns error."""
        token = await get_admin_token(client, admin_user)

        # Draft cannot go directly to in_progress
        response = await client.patch(
            f"/api/v1/editions/{draft_edition.id}/status",
            json={"status": "in_progress"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 422
        assert "non autorisée" in response.json()["detail"]

    async def test_status_update_forbidden_for_manager(
        self,
        client: AsyncClient,
        manager_user: User,
        draft_edition: Edition,
    ):
        """Manager cannot update status."""
        token = await get_manager_token(client, manager_user)

        response = await client.patch(
            f"/api/v1/editions/{draft_edition.id}/status",
            json={"status": "configured"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403
