"""Integration tests for depositor lists API endpoints."""

import pytest
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Article, Edition, EditionDepositor, ItemList, Role, User
from app.models.edition import EditionStatus
from app.models.item_list import ListStatus, ListType
from app.services import AuthService


@pytest.fixture
async def depositor_user(db_session: AsyncSession) -> User:
    """Create a depositor user."""
    result = await db_session.execute(select(Role).where(Role.name == "depositor"))
    role = result.scalar_one()

    user = User(
        email="depositor@example.com",
        first_name="Depositor",
        last_name="User",
        role_id=role.id,
        password_hash=AuthService.hash_password("DepositorPassword1!"),
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def another_depositor(db_session: AsyncSession) -> User:
    """Create another depositor user."""
    result = await db_session.execute(select(Role).where(Role.name == "depositor"))
    role = result.scalar_one()

    user = User(
        email="another.depositor@example.com",
        first_name="Another",
        last_name="Depositor",
        role_id=role.id,
        password_hash=AuthService.hash_password("AnotherPassword1!"),
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def open_edition(db_session: AsyncSession, admin_user: User) -> Edition:
    """Create an edition with registrations open."""
    edition = Edition(
        name="Bourse Printemps 2025",
        start_datetime=datetime.now(timezone.utc) + timedelta(days=30),
        end_datetime=datetime.now(timezone.utc) + timedelta(days=31),
        location="Salle des fêtes",
        status=EditionStatus.REGISTRATIONS_OPEN.value,
        declaration_deadline=datetime.now(timezone.utc) + timedelta(days=20),
        created_by_id=admin_user.id,
    )
    db_session.add(edition)
    await db_session.commit()
    await db_session.refresh(edition)
    return edition


@pytest.fixture
async def closed_edition(db_session: AsyncSession, admin_user: User) -> Edition:
    """Create a closed edition (past deadline)."""
    edition = Edition(
        name="Bourse Passée 2024",
        start_datetime=datetime.now(timezone.utc) - timedelta(days=10),
        end_datetime=datetime.now(timezone.utc) - timedelta(days=9),
        location="Salle des fêtes",
        status=EditionStatus.CLOSED.value,
        declaration_deadline=datetime.now(timezone.utc) - timedelta(days=15),
        created_by_id=admin_user.id,
    )
    db_session.add(edition)
    await db_session.commit()
    await db_session.refresh(edition)
    return edition


@pytest.fixture
async def registered_depositor(
    db_session: AsyncSession, depositor_user: User, open_edition: Edition
) -> EditionDepositor:
    """Register depositor for an edition."""
    registration = EditionDepositor(
        user_id=depositor_user.id,
        edition_id=open_edition.id,
        list_type=ListType.STANDARD.value,
    )
    db_session.add(registration)
    await db_session.commit()
    await db_session.refresh(registration)
    return registration


@pytest.fixture
async def existing_list(
    db_session: AsyncSession,
    depositor_user: User,
    open_edition: Edition,
    registered_depositor: EditionDepositor,
) -> ItemList:
    """Create an existing draft list."""
    item_list = ItemList(
        number=100,
        list_type=ListType.STANDARD.value,
        status=ListStatus.DRAFT.value,
        depositor_id=depositor_user.id,
        edition_id=open_edition.id,
    )
    db_session.add(item_list)
    await db_session.commit()
    await db_session.refresh(item_list)
    return item_list


@pytest.fixture
async def validated_list(
    db_session: AsyncSession,
    depositor_user: User,
    open_edition: Edition,
    registered_depositor: EditionDepositor,
) -> ItemList:
    """Create a validated list."""
    item_list = ItemList(
        number=101,
        list_type=ListType.STANDARD.value,
        status=ListStatus.VALIDATED.value,
        is_validated=True,
        validated_at=datetime.now(timezone.utc),
        depositor_id=depositor_user.id,
        edition_id=open_edition.id,
    )
    db_session.add(item_list)
    await db_session.commit()
    await db_session.refresh(item_list)
    return item_list


async def get_depositor_token(client: AsyncClient, depositor_user: User) -> str:
    """Get authentication token for depositor user."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "depositor@example.com",
            "password": "DepositorPassword1!",
        },
    )
    return response.json()["access_token"]


async def get_another_depositor_token(client: AsyncClient, another_depositor: User) -> str:
    """Get authentication token for another depositor."""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": "another.depositor@example.com",
            "password": "AnotherPassword1!",
        },
    )
    return response.json()["access_token"]


@pytest.mark.asyncio
class TestGetMyEditions:
    """Tests for GET /api/v1/depositor/my-editions."""

    async def test_get_my_editions(
        self,
        client: AsyncClient,
        depositor_user: User,
        registered_depositor: EditionDepositor,
    ):
        """Depositor can get their editions."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.get(
            "/api/v1/depositor/my-editions",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["editions"]) >= 1

    async def test_get_my_editions_empty(
        self,
        client: AsyncClient,
        depositor_user: User,
    ):
        """Depositor with no registrations gets empty list."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.get(
            "/api/v1/depositor/my-editions",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["editions"] == []

    async def test_get_my_editions_unauthorized(self, client: AsyncClient):
        """Unauthenticated request returns 401."""
        response = await client.get("/api/v1/depositor/my-editions")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestGetMyLists:
    """Tests for GET /api/v1/depositor/editions/{edition_id}/lists."""

    async def test_get_my_lists(
        self,
        client: AsyncClient,
        depositor_user: User,
        open_edition: Edition,
        existing_list: ItemList,
    ):
        """Depositor can get their lists for an edition."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.get(
            f"/api/v1/depositor/editions/{open_edition.id}/lists",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_lists"] == 1
        assert data["max_lists"] == 2
        assert len(data["lists"]) == 1
        assert data["lists"][0]["number"] == 100

    async def test_get_my_lists_empty(
        self,
        client: AsyncClient,
        depositor_user: User,
        open_edition: Edition,
        registered_depositor: EditionDepositor,
    ):
        """Depositor with no lists gets empty list."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.get(
            f"/api/v1/depositor/editions/{open_edition.id}/lists",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total_lists"] == 0
        assert data["can_create_more"] is True

    async def test_get_my_lists_edition_not_found(
        self,
        client: AsyncClient,
        depositor_user: User,
    ):
        """Non-existent edition returns empty list (user not registered)."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.get(
            "/api/v1/depositor/editions/nonexistent-id/lists",
            headers={"Authorization": f"Bearer {token}"},
        )

        # The API returns empty list when user is not registered for the edition
        # (which includes non-existent editions)
        assert response.status_code == 200
        data = response.json()
        assert data["total_lists"] == 0


@pytest.mark.asyncio
class TestCreateList:
    """Tests for POST /api/v1/depositor/editions/{edition_id}/lists."""

    async def test_create_list(
        self,
        client: AsyncClient,
        depositor_user: User,
        open_edition: Edition,
        registered_depositor: EditionDepositor,
    ):
        """Depositor can create a list."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/editions/{open_edition.id}/lists",
            json={},  # Empty body, list_type determined by registration
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["number"] >= 100
        assert data["list_type"] == "standard"
        assert data["status"] == "draft"

    async def test_create_second_list(
        self,
        client: AsyncClient,
        depositor_user: User,
        open_edition: Edition,
        existing_list: ItemList,
    ):
        """Depositor can create a second list."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/editions/{open_edition.id}/lists",
            json={},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 201
        data = response.json()
        # Second list should have a different number
        assert data["number"] != existing_list.number

    async def test_create_third_list_fails(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        depositor_user: User,
        open_edition: Edition,
        registered_depositor: EditionDepositor,
    ):
        """Depositor cannot create more than 2 lists."""
        # Create 2 lists first
        for i in range(2):
            item_list = ItemList(
                number=100 + i,
                list_type=ListType.STANDARD.value,
                status=ListStatus.DRAFT.value,
                depositor_id=depositor_user.id,
                edition_id=open_edition.id,
            )
            db_session.add(item_list)
        await db_session.commit()

        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/editions/{open_edition.id}/lists",
            json={},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 409
        assert "maximum" in response.json()["detail"].lower()


@pytest.mark.asyncio
class TestGetListDetail:
    """Tests for GET /api/v1/depositor/lists/{list_id}."""

    async def test_get_list_detail(
        self,
        client: AsyncClient,
        depositor_user: User,
        existing_list: ItemList,
    ):
        """Depositor can get their list details."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.get(
            f"/api/v1/depositor/lists/{existing_list.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == existing_list.id
        assert data["number"] == 100
        assert "articles" in data

    async def test_get_list_detail_not_owner(
        self,
        client: AsyncClient,
        another_depositor: User,
        existing_list: ItemList,
    ):
        """Depositor cannot view another user's list."""
        token = await get_another_depositor_token(client, another_depositor)

        response = await client.get(
            f"/api/v1/depositor/lists/{existing_list.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403

    async def test_get_list_detail_not_found(
        self,
        client: AsyncClient,
        depositor_user: User,
    ):
        """Non-existent list returns 404."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.get(
            "/api/v1/depositor/lists/nonexistent-id",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404


@pytest.mark.asyncio
class TestValidateList:
    """Tests for POST /api/v1/depositor/lists/{list_id}/validate."""

    async def test_validate_list(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        depositor_user: User,
        existing_list: ItemList,
    ):
        """Depositor can validate a list with certified articles."""
        # Add a certified article first
        article = Article(
            line_number=1,
            category="clothing",
            description="Test article",
            price=5.00,
            conformity_certified=True,
            item_list_id=existing_list.id,
        )
        db_session.add(article)
        await db_session.commit()

        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/lists/{existing_list.id}/validate",
            json={"confirmation_accepted": True},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "validated"
        assert data["is_validated"] is True

    async def test_validate_list_without_confirmation(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        depositor_user: User,
        existing_list: ItemList,
    ):
        """Validation without confirmation fails."""
        # Add an article
        article = Article(
            line_number=1,
            category="clothing",
            description="Test article",
            price=5.00,
            conformity_certified=True,
            item_list_id=existing_list.id,
        )
        db_session.add(article)
        await db_session.commit()

        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/lists/{existing_list.id}/validate",
            json={"confirmation_accepted": False},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 422

    async def test_validate_already_validated_list(
        self,
        client: AsyncClient,
        depositor_user: User,
        validated_list: ItemList,
    ):
        """Cannot validate an already validated list."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/lists/{validated_list.id}/validate",
            json={"confirmation_accepted": True},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 409
        assert "déjà" in response.json()["detail"]


@pytest.mark.asyncio
class TestDeleteList:
    """Tests for DELETE /api/v1/depositor/lists/{list_id}."""

    async def test_delete_empty_draft_list(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        depositor_user: User,
        existing_list: ItemList,
    ):
        """Depositor can delete an empty draft list."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.delete(
            f"/api/v1/depositor/lists/{existing_list.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 204

        # Verify deletion
        result = await db_session.execute(
            select(ItemList).where(ItemList.id == existing_list.id)
        )
        assert result.scalar_one_or_none() is None

    async def test_delete_validated_list_fails(
        self,
        client: AsyncClient,
        depositor_user: User,
        validated_list: ItemList,
    ):
        """Cannot delete a validated list."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.delete(
            f"/api/v1/depositor/lists/{validated_list.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 409
        assert "brouillon" in response.json()["detail"]

    async def test_delete_list_with_articles_fails(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        depositor_user: User,
        existing_list: ItemList,
    ):
        """Cannot delete a list with articles."""
        # Add an article
        article = Article(
            line_number=1,
            category="clothing",
            description="Test article",
            price=5.00,
            item_list_id=existing_list.id,
        )
        db_session.add(article)
        await db_session.commit()

        token = await get_depositor_token(client, depositor_user)

        response = await client.delete(
            f"/api/v1/depositor/lists/{existing_list.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 409
