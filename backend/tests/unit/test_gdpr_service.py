"""Tests for GDPR service (export and anonymization)."""

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.services.gdpr import GDPRService


@pytest.mark.asyncio
class TestGDPRExport:
    """Tests for user data export."""

    async def test_export_contains_profile(self, db_session: AsyncSession, test_user: User):
        """Export should contain user profile data."""
        service = GDPRService(db_session)
        data = await service.export_user_data(test_user)

        assert "profile" in data
        assert data["profile"]["email"] == test_user.email
        assert data["profile"]["first_name"] == test_user.first_name
        assert data["profile"]["last_name"] == test_user.last_name

    async def test_export_contains_all_sections(self, db_session: AsyncSession, test_user: User):
        """Export should contain all expected data sections."""
        service = GDPRService(db_session)
        data = await service.export_user_data(test_user)

        assert "export_date" in data
        assert "profile" in data
        assert "edition_registrations" in data
        assert "item_lists" in data
        assert "sales_as_seller" in data
        assert "payouts" in data

    async def test_export_empty_collections_for_new_user(
        self, db_session: AsyncSession, test_user: User
    ):
        """New user with no activity should have empty collections."""
        service = GDPRService(db_session)
        data = await service.export_user_data(test_user)

        assert data["edition_registrations"] == []
        assert data["item_lists"] == []
        assert data["sales_as_seller"] == []
        assert data["payouts"] == []


@pytest.mark.asyncio
class TestGDPRDelete:
    """Tests for account deletion (anonymization)."""

    async def test_delete_anonymizes_user(self, db_session: AsyncSession, test_user: User):
        """Deleting account should anonymize personal data."""
        user_id = test_user.id
        service = GDPRService(db_session)
        await service.delete_account(test_user)

        result = await db_session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()

        assert user.first_name == "Utilisateur"
        assert user.last_name == "Supprimé"
        assert user.phone is None
        assert user.address is None
        assert user.password_hash is None
        assert user.is_active is False
        assert "@anonymized.local" in user.email

    async def test_delete_sets_gdpr_timestamps(self, db_session: AsyncSession, test_user: User):
        """Deleting account should set deleted_at and anonymized_at."""
        user_id = test_user.id
        service = GDPRService(db_session)
        await service.delete_account(test_user)

        result = await db_session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one()

        assert user.deleted_at is not None
        assert user.anonymized_at is not None
