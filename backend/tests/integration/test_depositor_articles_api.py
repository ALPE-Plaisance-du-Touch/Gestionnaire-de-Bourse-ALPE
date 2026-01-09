"""Integration tests for depositor articles API endpoints."""

import pytest
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Article, Edition, EditionDepositor, ItemList, Role, User
from app.models.article import ArticleStatus
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
async def draft_list(
    db_session: AsyncSession,
    depositor_user: User,
    open_edition: Edition,
    registered_depositor: EditionDepositor,
) -> ItemList:
    """Create a draft list for testing articles."""
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


@pytest.fixture
async def existing_article(
    db_session: AsyncSession,
    draft_list: ItemList,
) -> Article:
    """Create an existing article in the list."""
    article = Article(
        line_number=1,
        category="clothing",
        subcategory="tshirt",
        description="T-shirt bleu",
        price=Decimal("5.00"),
        size="8 ans",
        conformity_certified=True,
        item_list_id=draft_list.id,
    )
    db_session.add(article)
    await db_session.commit()
    await db_session.refresh(article)
    return article


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
class TestGetListArticles:
    """Tests for GET /api/v1/depositor/lists/{list_id}/articles."""

    async def test_get_articles(
        self,
        client: AsyncClient,
        depositor_user: User,
        draft_list: ItemList,
        existing_article: Article,
    ):
        """Depositor can get articles for their list."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.get(
            f"/api/v1/depositor/lists/{draft_list.id}/articles",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["items"]) == 1
        assert data["items"][0]["description"] == "T-shirt bleu"

    async def test_get_articles_empty_list(
        self,
        client: AsyncClient,
        depositor_user: User,
        draft_list: ItemList,
    ):
        """Empty list returns zero articles."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.get(
            f"/api/v1/depositor/lists/{draft_list.id}/articles",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []

    async def test_get_articles_not_owner(
        self,
        client: AsyncClient,
        another_depositor: User,
        draft_list: ItemList,
    ):
        """Cannot view articles of another user's list."""
        token = await get_another_depositor_token(client, another_depositor)

        response = await client.get(
            f"/api/v1/depositor/lists/{draft_list.id}/articles",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404


@pytest.mark.asyncio
class TestAddArticle:
    """Tests for POST /api/v1/depositor/lists/{list_id}/articles."""

    async def test_add_article(
        self,
        client: AsyncClient,
        depositor_user: User,
        draft_list: ItemList,
    ):
        """Depositor can add an article to their list."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/lists/{draft_list.id}/articles",
            json={
                "category": "clothing",
                "subcategory": "pants",
                "description": "Pantalon jean",
                "price": "8.00",
                "size": "10 ans",
                "conformity_certified": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["description"] == "Pantalon jean"
        assert data["category"] == "clothing"
        assert float(data["price"]) == 8.00

    async def test_add_article_with_lot(
        self,
        client: AsyncClient,
        depositor_user: User,
        draft_list: ItemList,
    ):
        """Depositor can add a lot article."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/lists/{draft_list.id}/articles",
            json={
                "category": "clothing",
                "subcategory": "body",
                "description": "Lot de bodys",
                "price": "3.00",
                "size": "18 mois",
                "is_lot": True,
                "lot_quantity": 3,
                "conformity_certified": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["is_lot"] is True
        assert data["lot_quantity"] == 3

    async def test_add_article_price_too_low(
        self,
        client: AsyncClient,
        depositor_user: User,
        draft_list: ItemList,
    ):
        """Cannot add article with price below minimum."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/lists/{draft_list.id}/articles",
            json={
                "category": "clothing",
                "description": "Article pas cher",
                "price": "0.50",
                "conformity_certified": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 422

    async def test_add_article_stroller_price_too_high(
        self,
        client: AsyncClient,
        depositor_user: User,
        draft_list: ItemList,
    ):
        """Stroller price cannot exceed 150€."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/lists/{draft_list.id}/articles",
            json={
                "category": "nursery",
                "subcategory": "stroller",
                "description": "Poussette luxe",
                "price": "200.00",
                "conformity_certified": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 422

    async def test_add_blacklisted_article(
        self,
        client: AsyncClient,
        depositor_user: User,
        draft_list: ItemList,
    ):
        """Cannot add blacklisted articles."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/lists/{draft_list.id}/articles",
            json={
                "category": "nursery",
                "subcategory": "car_seat",  # Blacklisted
                "description": "Siège auto",
                "price": "50.00",
                "conformity_certified": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 422
        assert "pas acceptés" in response.json()["detail"]

    async def test_add_article_to_validated_list(
        self,
        client: AsyncClient,
        depositor_user: User,
        validated_list: ItemList,
    ):
        """Cannot add article to validated list."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/lists/{validated_list.id}/articles",
            json={
                "category": "clothing",
                "description": "Test article",
                "price": "5.00",
                "conformity_certified": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 409

    async def test_add_lot_invalid_subcategory(
        self,
        client: AsyncClient,
        depositor_user: User,
        draft_list: ItemList,
    ):
        """Lots only allowed for bodys and pajamas."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/lists/{draft_list.id}/articles",
            json={
                "category": "clothing",
                "subcategory": "tshirt",  # Not allowed for lots
                "description": "Lot de t-shirts",
                "price": "5.00",
                "size": "18 mois",
                "is_lot": True,
                "lot_quantity": 3,
                "conformity_certified": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 422
        assert "bodys et pyjamas" in response.json()["detail"]


@pytest.mark.asyncio
class TestUpdateArticle:
    """Tests for PUT /api/v1/depositor/lists/{list_id}/articles/{article_id}."""

    async def test_update_article(
        self,
        client: AsyncClient,
        depositor_user: User,
        draft_list: ItemList,
        existing_article: Article,
    ):
        """Depositor can update their article."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.put(
            f"/api/v1/depositor/lists/{draft_list.id}/articles/{existing_article.id}",
            json={
                "description": "T-shirt rouge modifié",
                "price": "7.00",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "T-shirt rouge modifié"
        assert float(data["price"]) == 7.00

    async def test_update_article_partial(
        self,
        client: AsyncClient,
        depositor_user: User,
        draft_list: ItemList,
        existing_article: Article,
    ):
        """Can update only specific fields."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.put(
            f"/api/v1/depositor/lists/{draft_list.id}/articles/{existing_article.id}",
            json={
                "price": "10.00",
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert float(data["price"]) == 10.00
        # Description should remain unchanged
        assert data["description"] == "T-shirt bleu"

    async def test_update_article_not_found(
        self,
        client: AsyncClient,
        depositor_user: User,
        draft_list: ItemList,
    ):
        """Non-existent article returns 404."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.put(
            f"/api/v1/depositor/lists/{draft_list.id}/articles/nonexistent-id",
            json={"description": "Test"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404


@pytest.mark.asyncio
class TestDeleteArticle:
    """Tests for DELETE /api/v1/depositor/lists/{list_id}/articles/{article_id}."""

    async def test_delete_article(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        depositor_user: User,
        draft_list: ItemList,
        existing_article: Article,
    ):
        """Depositor can delete their article."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.delete(
            f"/api/v1/depositor/lists/{draft_list.id}/articles/{existing_article.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 204

        # Verify deletion
        result = await db_session.execute(
            select(Article).where(Article.id == existing_article.id)
        )
        assert result.scalar_one_or_none() is None

    async def test_delete_article_from_validated_list(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        depositor_user: User,
        validated_list: ItemList,
    ):
        """Cannot delete article from validated list."""
        # Add an article to the validated list
        article = Article(
            line_number=1,
            category="clothing",
            description="Test",
            price=Decimal("5.00"),
            item_list_id=validated_list.id,
        )
        db_session.add(article)
        await db_session.commit()
        await db_session.refresh(article)

        token = await get_depositor_token(client, depositor_user)

        response = await client.delete(
            f"/api/v1/depositor/lists/{validated_list.id}/articles/{article.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 409

    async def test_delete_article_not_found(
        self,
        client: AsyncClient,
        depositor_user: User,
        draft_list: ItemList,
    ):
        """Non-existent article returns 404."""
        token = await get_depositor_token(client, depositor_user)

        response = await client.delete(
            f"/api/v1/depositor/lists/{draft_list.id}/articles/nonexistent-id",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404


@pytest.mark.asyncio
class TestArticleConstraints:
    """Tests for article business rule constraints."""

    async def test_max_articles_limit(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        depositor_user: User,
        draft_list: ItemList,
    ):
        """Cannot exceed 24 articles per list."""
        # Add 24 articles
        for i in range(24):
            article = Article(
                line_number=i + 1,
                category="toys",
                description=f"Article {i+1}",
                price=Decimal("2.00"),
                conformity_certified=True,
                item_list_id=draft_list.id,
            )
            db_session.add(article)
        await db_session.commit()

        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/lists/{draft_list.id}/articles",
            json={
                "category": "toys",
                "description": "Article 25",
                "price": "2.00",
                "conformity_certified": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 409
        assert "24" in response.json()["detail"]

    async def test_max_clothing_limit(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        depositor_user: User,
        draft_list: ItemList,
    ):
        """Cannot exceed 12 clothing items per list."""
        # Add 12 clothing articles
        for i in range(12):
            article = Article(
                line_number=i + 1,
                category="clothing",
                description=f"Vêtement {i+1}",
                price=Decimal("5.00"),
                conformity_certified=True,
                item_list_id=draft_list.id,
            )
            db_session.add(article)
        await db_session.commit()

        token = await get_depositor_token(client, depositor_user)

        response = await client.post(
            f"/api/v1/depositor/lists/{draft_list.id}/articles",
            json={
                "category": "clothing",
                "description": "Vêtement 13",
                "price": "5.00",
                "conformity_certified": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 409
        assert "12" in response.json()["detail"]

    async def test_category_limit_coat(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
        depositor_user: User,
        draft_list: ItemList,
    ):
        """Max 1 coat per list."""
        # Add first coat
        article = Article(
            line_number=1,
            category="clothing",
            subcategory="coat",
            description="Manteau 1",
            price=Decimal("15.00"),
            conformity_certified=True,
            item_list_id=draft_list.id,
        )
        db_session.add(article)
        await db_session.commit()

        token = await get_depositor_token(client, depositor_user)

        # Try to add second coat
        response = await client.post(
            f"/api/v1/depositor/lists/{draft_list.id}/articles",
            json={
                "category": "clothing",
                "subcategory": "coat",
                "description": "Manteau 2",
                "price": "20.00",
                "conformity_certified": True,
            },
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 409
        assert "limite" in response.json()["detail"].lower()
