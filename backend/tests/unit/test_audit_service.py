"""Tests for audit logging service."""

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.models.audit_log import AuditLog
from app.services.audit import log_action, list_audit_logs


@pytest.mark.asyncio
class TestLogAction:
    """Tests for log_action function."""

    async def test_log_action_basic(self, db_session: AsyncSession):
        """Should create an audit log entry."""
        await log_action(db_session, action="login", detail="test@example.com")

        result = await db_session.execute(select(AuditLog))
        log = result.scalar_one()

        assert log.action == "login"
        assert log.detail == "test@example.com"
        assert log.result == "success"

    async def test_log_action_with_user(self, db_session: AsyncSession, test_user: User):
        """Should record user info when user is provided."""
        await log_action(
            db_session,
            action="profile_updated",
            user=test_user,
            entity_type="user",
            entity_id=test_user.id,
        )

        result = await db_session.execute(select(AuditLog))
        log = result.scalar_one()

        assert log.user_id == test_user.id
        assert log.user_email == test_user.email
        assert log.entity_type == "user"
        assert log.entity_id == test_user.id

    async def test_log_action_failure(self, db_session: AsyncSession):
        """Should record failure result."""
        await log_action(
            db_session, action="login_failed", detail="bad@example.com", result="failure"
        )

        result = await db_session.execute(select(AuditLog))
        log = result.scalar_one()

        assert log.action == "login_failed"
        assert log.result == "failure"

    async def test_log_action_never_raises(self, db_session: AsyncSession):
        """log_action should never raise even on error."""
        # Pass a closed session to trigger an error internally
        await db_session.close()
        # This should not raise
        await log_action(db_session, action="test")


@pytest.mark.asyncio
class TestListAuditLogs:
    """Tests for list_audit_logs function."""

    async def test_list_returns_empty(self, db_session: AsyncSession):
        """Should return empty list when no logs exist."""
        logs, total = await list_audit_logs(db_session)
        assert logs == []
        assert total == 0

    async def test_list_returns_logs(self, db_session: AsyncSession):
        """Should return logs after creating some."""
        await log_action(db_session, action="login", detail="user1@test.com")
        await log_action(db_session, action="logout", detail="user1@test.com")

        logs, total = await list_audit_logs(db_session)
        assert total == 2
        assert len(logs) == 2

    async def test_list_filter_by_action(self, db_session: AsyncSession):
        """Should filter logs by action type."""
        await log_action(db_session, action="login", detail="user1@test.com")
        await log_action(db_session, action="logout", detail="user1@test.com")
        await log_action(db_session, action="login", detail="user2@test.com")

        logs, total = await list_audit_logs(db_session, action="login")
        assert total == 2
        assert all(log.action == "login" for log in logs)

    async def test_list_pagination(self, db_session: AsyncSession):
        """Should paginate results."""
        for i in range(5):
            await log_action(db_session, action="login", detail=f"user{i}@test.com")

        logs, total = await list_audit_logs(db_session, page=1, limit=2)
        assert total == 5
        assert len(logs) == 2

        logs2, _ = await list_audit_logs(db_session, page=2, limit=2)
        assert len(logs2) == 2
