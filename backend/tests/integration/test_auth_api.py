"""Integration tests for authentication API endpoints."""

import pytest
from httpx import AsyncClient

from app.models import User
from app.services import AuthService


@pytest.mark.asyncio
class TestLoginEndpoint:
    """Tests for POST /api/v1/auth/login."""

    async def test_login_success(self, client: AsyncClient, test_user: User):
        """Successful login should return tokens and user data."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPassword1!",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["token_type"] == "bearer"

    async def test_login_invalid_email(self, client: AsyncClient, test_user: User):
        """Login with invalid email should return 401."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "wrong@example.com",
                "password": "TestPassword1!",
            },
        )

        assert response.status_code == 401
        assert "Invalid" in response.json()["detail"]

    async def test_login_invalid_password(self, client: AsyncClient, test_user: User):
        """Login with invalid password should return 401."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "WrongPassword1!",
            },
        )

        assert response.status_code == 401

    async def test_login_inactive_user(self, client: AsyncClient, inactive_user: User):
        """Login with inactive user should return 401."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "inactive@example.com",
                "password": "TestPassword1!",
            },
        )

        assert response.status_code == 401

    async def test_login_missing_fields(self, client: AsyncClient):
        """Login with missing fields should return 422."""
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com"},
        )

        assert response.status_code == 422


@pytest.mark.asyncio
class TestRefreshEndpoint:
    """Tests for POST /api/v1/auth/refresh."""

    async def test_refresh_success(self, client: AsyncClient, test_user: User):
        """Valid refresh token should return new tokens."""
        # First login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPassword1!",
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        # Refresh
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_refresh_invalid_token(self, client: AsyncClient):
        """Invalid refresh token should return 401."""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid-token"},
        )

        assert response.status_code == 401


@pytest.mark.asyncio
class TestLogoutEndpoint:
    """Tests for POST /api/v1/auth/logout."""

    async def test_logout_success(self, client: AsyncClient, test_user: User):
        """Logout should return 204."""
        # First login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPassword1!",
            },
        )
        access_token = login_response.json()["access_token"]

        # Logout
        response = await client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert response.status_code == 204

    async def test_logout_unauthenticated(self, client: AsyncClient):
        """Logout without auth should return 401."""
        response = await client.post("/api/v1/auth/logout")
        assert response.status_code == 401


@pytest.mark.asyncio
class TestMeEndpoint:
    """Tests for GET /api/v1/auth/me."""

    async def test_get_current_user(self, client: AsyncClient, test_user: User):
        """Should return current user profile."""
        # First login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPassword1!",
            },
        )
        access_token = login_response.json()["access_token"]

        # Get profile
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["first_name"] == "Jean"
        assert data["last_name"] == "Dupont"

    async def test_get_current_user_unauthenticated(self, client: AsyncClient):
        """Should return 401 when not authenticated."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Should return 401 with invalid token."""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        assert response.status_code == 401


@pytest.mark.asyncio
class TestActivateEndpoint:
    """Tests for POST /api/v1/auth/activate."""

    async def test_activate_success(self, client: AsyncClient, inactive_user: User):
        """Account activation should succeed with valid token."""
        response = await client.post(
            "/api/v1/auth/activate",
            json={
                "token": "test-invitation-token",
                "password": "NewPassword1!",
                "accept_terms": True,
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["is_active"] is True
        assert data["is_verified"] is True

    async def test_activate_invalid_token(self, client: AsyncClient):
        """Invalid token should return 400."""
        response = await client.post(
            "/api/v1/auth/activate",
            json={
                "token": "invalid-token",
                "password": "NewPassword1!",
                "accept_terms": True,
            },
        )

        assert response.status_code == 400

    async def test_activate_weak_password(self, client: AsyncClient, inactive_user: User):
        """Weak password should return 422."""
        response = await client.post(
            "/api/v1/auth/activate",
            json={
                "token": "test-invitation-token",
                "password": "weak",
                "accept_terms": True,
            },
        )

        assert response.status_code == 422

    async def test_activate_terms_not_accepted(self, client: AsyncClient, inactive_user: User):
        """Terms not accepted should return 422."""
        response = await client.post(
            "/api/v1/auth/activate",
            json={
                "token": "test-invitation-token",
                "password": "NewPassword1!",
                "accept_terms": False,
            },
        )

        assert response.status_code == 422


@pytest.mark.asyncio
class TestPasswordResetEndpoints:
    """Tests for password reset endpoints."""

    async def test_request_reset_always_returns_202(self, client: AsyncClient, test_user: User):
        """Request password reset should always return 202 (prevent enumeration)."""
        # Existing email
        response = await client.post(
            "/api/v1/auth/password/reset-request",
            json={"email": "test@example.com"},
        )
        assert response.status_code == 202

        # Non-existing email (should still return 202)
        response = await client.post(
            "/api/v1/auth/password/reset-request",
            json={"email": "nonexistent@example.com"},
        )
        assert response.status_code == 202

    async def test_reset_invalid_token(self, client: AsyncClient):
        """Reset with invalid token should return 400."""
        response = await client.post(
            "/api/v1/auth/password/reset",
            json={
                "token": "invalid-token",
                "password": "NewPassword1!",
            },
        )

        assert response.status_code == 400


@pytest.mark.asyncio
class TestRateLimitHeaders:
    """Tests for rate limit headers in responses."""

    async def test_rate_limit_headers_present(self, client: AsyncClient):
        """Rate limit headers should be present in responses."""
        response = await client.get("/api/v1")

        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
