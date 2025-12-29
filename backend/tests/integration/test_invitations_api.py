"""Integration tests for invitations API endpoints."""

import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Role, User
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


@pytest.fixture
async def pending_invitation(db_session: AsyncSession) -> User:
    """Create a pending invitation (user not activated)."""
    result = await db_session.execute(select(Role).where(Role.name == "depositor"))
    role = result.scalar_one()

    user = User(
        email="pending@example.com",
        first_name="Pending",
        last_name="User",
        role_id=role.id,
        invitation_token="pending-token-123",
        invitation_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        is_active=False,
        is_verified=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def activated_invitation(db_session: AsyncSession) -> User:
    """Create an activated invitation (user with password)."""
    result = await db_session.execute(select(Role).where(Role.name == "depositor"))
    role = result.scalar_one()

    user = User(
        email="activated@example.com",
        first_name="Activated",
        last_name="User",
        role_id=role.id,
        password_hash=AuthService.hash_password("Password123!"),
        is_active=True,
        is_verified=True,
        invitation_hidden=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def multiple_invitations(db_session: AsyncSession) -> list[User]:
    """Create multiple invitations for bulk operations."""
    result = await db_session.execute(select(Role).where(Role.name == "depositor"))
    role = result.scalar_one()

    users = []
    for i in range(5):
        user = User(
            email=f"invite{i}@example.com",
            first_name=f"Invite{i}",
            last_name="User",
            role_id=role.id,
            invitation_token=f"token-{i}",
            invitation_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            is_active=False,
            is_verified=False,
        )
        db_session.add(user)
        users.append(user)

    await db_session.commit()
    for user in users:
        await db_session.refresh(user)

    return users


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


@pytest.mark.asyncio
class TestDeleteInvitation:
    """Tests for DELETE /api/v1/invitations/{id}."""

    async def test_delete_pending_invitation_as_manager(
        self,
        client: AsyncClient,
        manager_user: User,
        pending_invitation: User,
        db_session: AsyncSession,
    ):
        """Manager can delete a pending invitation."""
        token = await get_manager_token(client, manager_user)

        response = await client.delete(
            f"/api/v1/invitations/{pending_invitation.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 204

        # Verify user is deleted
        result = await db_session.execute(
            select(User).where(User.id == pending_invitation.id)
        )
        assert result.scalar_one_or_none() is None

    async def test_delete_pending_invitation_as_admin(
        self,
        client: AsyncClient,
        admin_user: User,
        pending_invitation: User,
        db_session: AsyncSession,
    ):
        """Admin can delete a pending invitation."""
        token = await get_admin_token(client, admin_user)

        response = await client.delete(
            f"/api/v1/invitations/{pending_invitation.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 204

    async def test_delete_activated_invitation_hides_from_list(
        self,
        client: AsyncClient,
        manager_user: User,
        activated_invitation: User,
        db_session: AsyncSession,
    ):
        """Deleting activated invitation hides it but preserves user."""
        token = await get_manager_token(client, manager_user)

        response = await client.delete(
            f"/api/v1/invitations/{activated_invitation.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 204

        # Verify user still exists but is hidden
        await db_session.refresh(activated_invitation)
        assert activated_invitation.invitation_hidden is True
        assert activated_invitation.is_active is True  # Account preserved

    async def test_delete_nonexistent_invitation(
        self,
        client: AsyncClient,
        manager_user: User,
    ):
        """Deleting non-existent invitation returns 404."""
        token = await get_manager_token(client, manager_user)

        response = await client.delete(
            "/api/v1/invitations/nonexistent-uuid",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404

    async def test_delete_invitation_unauthorized(
        self,
        client: AsyncClient,
        pending_invitation: User,
    ):
        """Unauthenticated request returns 401."""
        response = await client.delete(
            f"/api/v1/invitations/{pending_invitation.id}",
        )

        assert response.status_code == 401

    async def test_delete_invitation_forbidden_for_depositor(
        self,
        client: AsyncClient,
        test_user: User,
        pending_invitation: User,
    ):
        """Depositor cannot delete invitations."""
        token = await get_user_token(client, test_user)

        response = await client.delete(
            f"/api/v1/invitations/{pending_invitation.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403


@pytest.mark.asyncio
class TestBulkDeleteInvitations:
    """Tests for POST /api/v1/invitations/bulk-delete."""

    async def test_bulk_delete_success(
        self,
        client: AsyncClient,
        manager_user: User,
        multiple_invitations: list[User],
        db_session: AsyncSession,
    ):
        """Manager can bulk delete multiple invitations."""
        token = await get_manager_token(client, manager_user)
        ids_to_delete = [str(u.id) for u in multiple_invitations[:3]]

        response = await client.post(
            "/api/v1/invitations/bulk-delete",
            json={"ids": ids_to_delete},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert data["deleted"] == 3
        assert data["not_found"] == 0

        # Verify users are deleted
        for inv_id in ids_to_delete:
            result = await db_session.execute(
                select(User).where(User.id == inv_id)
            )
            assert result.scalar_one_or_none() is None

    async def test_bulk_delete_with_nonexistent_ids(
        self,
        client: AsyncClient,
        manager_user: User,
        multiple_invitations: list[User],
    ):
        """Bulk delete with some non-existent IDs reports not_found."""
        token = await get_manager_token(client, manager_user)
        ids = [str(multiple_invitations[0].id), "nonexistent-1", "nonexistent-2"]

        response = await client.post(
            "/api/v1/invitations/bulk-delete",
            json={"ids": ids},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 3
        assert data["deleted"] == 1
        assert data["not_found"] == 2

    async def test_bulk_delete_mixed_pending_and_activated(
        self,
        client: AsyncClient,
        manager_user: User,
        pending_invitation: User,
        activated_invitation: User,
        db_session: AsyncSession,
    ):
        """Bulk delete handles both pending and activated invitations."""
        token = await get_manager_token(client, manager_user)
        ids = [str(pending_invitation.id), str(activated_invitation.id)]

        response = await client.post(
            "/api/v1/invitations/bulk-delete",
            json={"ids": ids},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert data["deleted"] == 2

        # Pending should be deleted
        result = await db_session.execute(
            select(User).where(User.id == pending_invitation.id)
        )
        assert result.scalar_one_or_none() is None

        # Activated should be hidden but exist
        await db_session.refresh(activated_invitation)
        assert activated_invitation.invitation_hidden is True

    async def test_bulk_delete_empty_list_validation(
        self,
        client: AsyncClient,
        manager_user: User,
    ):
        """Bulk delete with empty list returns validation error."""
        token = await get_manager_token(client, manager_user)

        response = await client.post(
            "/api/v1/invitations/bulk-delete",
            json={"ids": []},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 422

    async def test_bulk_delete_unauthorized(
        self,
        client: AsyncClient,
    ):
        """Unauthenticated request returns 401."""
        response = await client.post(
            "/api/v1/invitations/bulk-delete",
            json={"ids": ["some-id"]},
        )

        assert response.status_code == 401

    async def test_bulk_delete_forbidden_for_depositor(
        self,
        client: AsyncClient,
        test_user: User,
        multiple_invitations: list[User],
    ):
        """Depositor cannot bulk delete invitations."""
        token = await get_user_token(client, test_user)

        response = await client.post(
            "/api/v1/invitations/bulk-delete",
            json={"ids": [str(multiple_invitations[0].id)]},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403

    async def test_bulk_delete_as_admin(
        self,
        client: AsyncClient,
        admin_user: User,
        multiple_invitations: list[User],
    ):
        """Admin can bulk delete invitations."""
        token = await get_admin_token(client, admin_user)
        ids = [str(u.id) for u in multiple_invitations[:2]]

        response = await client.post(
            "/api/v1/invitations/bulk-delete",
            json={"ids": ids},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.json()["deleted"] == 2
