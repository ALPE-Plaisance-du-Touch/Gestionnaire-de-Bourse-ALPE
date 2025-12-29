"""Unit tests for the authentication service."""

import pytest
from datetime import datetime, timedelta, timezone

from app.exceptions import (
    AuthenticationError,
    InvalidTokenError,
    TokenExpiredError,
)
from app.schemas import ActivateAccountRequest, LoginRequest
from app.services import AuthService


class TestPasswordHashing:
    """Tests for password hashing functionality."""

    def test_hash_password_returns_different_hash(self):
        """Password hash should be different from original password."""
        password = "TestPassword1!"
        hashed = AuthService.hash_password(password)
        assert hashed != password

    def test_hash_password_is_deterministic_with_salt(self):
        """Same password should produce different hashes (salt)."""
        password = "TestPassword1!"
        hash1 = AuthService.hash_password(password)
        hash2 = AuthService.hash_password(password)
        assert hash1 != hash2  # Different salts

    def test_verify_password_correct(self):
        """Correct password should verify successfully."""
        password = "TestPassword1!"
        hashed = AuthService.hash_password(password)
        assert AuthService.verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Incorrect password should fail verification."""
        password = "TestPassword1!"
        wrong_password = "WrongPassword1!"
        hashed = AuthService.hash_password(password)
        assert AuthService.verify_password(wrong_password, hashed) is False


class TestJWTTokens:
    """Tests for JWT token generation and validation."""

    def test_create_access_token(self):
        """Access token should be created successfully."""
        user_id = "test-user-id"
        role = "depositor"
        token = AuthService.create_access_token(user_id, role)
        assert token is not None
        assert isinstance(token, str)

    def test_create_refresh_token(self):
        """Refresh token should be created successfully."""
        user_id = "test-user-id"
        token = AuthService.create_refresh_token(user_id)
        assert token is not None
        assert isinstance(token, str)

    def test_decode_valid_access_token(self):
        """Valid access token should decode successfully."""
        user_id = "test-user-id"
        role = "depositor"
        token = AuthService.create_access_token(user_id, role)
        payload = AuthService.decode_token(token)

        assert payload["sub"] == user_id
        assert payload["role"] == role
        assert payload["type"] == "access"

    def test_decode_valid_refresh_token(self):
        """Valid refresh token should decode successfully."""
        user_id = "test-user-id"
        token = AuthService.create_refresh_token(user_id)
        payload = AuthService.decode_token(token)

        assert payload["sub"] == user_id
        assert payload["type"] == "refresh"
        assert "jti" in payload  # Unique token ID

    def test_decode_invalid_token(self):
        """Invalid token should raise InvalidTokenError."""
        with pytest.raises(InvalidTokenError):
            AuthService.decode_token("invalid-token")

    def test_decode_tampered_token(self):
        """Tampered token should raise InvalidTokenError."""
        token = AuthService.create_access_token("test-user", "depositor")
        tampered_token = token[:-10] + "0123456789"
        with pytest.raises(InvalidTokenError):
            AuthService.decode_token(tampered_token)


class TestInvitationToken:
    """Tests for invitation token generation."""

    def test_generate_invitation_token(self):
        """Invitation token should be generated successfully."""
        token = AuthService.generate_invitation_token()
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 20  # Should be a secure token

    def test_generate_unique_tokens(self):
        """Each generated token should be unique."""
        tokens = [AuthService.generate_invitation_token() for _ in range(10)]
        assert len(set(tokens)) == 10

    def test_get_invitation_expiry(self):
        """Invitation expiry should be in the future."""
        expiry = AuthService.get_invitation_expiry()
        now = datetime.now(timezone.utc)
        assert expiry > now
        # Should be approximately 7 days in the future
        delta = expiry - now
        assert delta.days >= 6
        assert delta.days <= 8


@pytest.mark.asyncio
class TestLogin:
    """Tests for login functionality."""

    async def test_login_success(self, auth_service, test_user):
        """Successful login should return tokens and user data."""
        request = LoginRequest(
            email="test@example.com",
            password="TestPassword1!",
        )
        response = await auth_service.login(request)

        assert response.access_token is not None
        assert response.refresh_token is not None
        assert response.user.email == "test@example.com"

    async def test_login_wrong_email(self, auth_service, test_user):
        """Login with wrong email should raise AuthenticationError."""
        request = LoginRequest(
            email="wrong@example.com",
            password="TestPassword1!",
        )
        with pytest.raises(AuthenticationError):
            await auth_service.login(request)

    async def test_login_wrong_password(self, auth_service, test_user):
        """Login with wrong password should raise AuthenticationError."""
        request = LoginRequest(
            email="test@example.com",
            password="WrongPassword1!",
        )
        with pytest.raises(AuthenticationError):
            await auth_service.login(request)

    async def test_login_inactive_user(self, auth_service, inactive_user):
        """Login with inactive user should raise AuthenticationError."""
        request = LoginRequest(
            email="inactive@example.com",
            password="TestPassword1!",
        )
        with pytest.raises(AuthenticationError):
            await auth_service.login(request)


@pytest.mark.asyncio
class TestRefreshTokens:
    """Tests for token refresh functionality."""

    async def test_refresh_tokens_success(self, auth_service, test_user):
        """Valid refresh token should generate new tokens."""
        # First login to get a refresh token
        login_request = LoginRequest(
            email="test@example.com",
            password="TestPassword1!",
        )
        login_response = await auth_service.login(login_request)

        # Refresh tokens
        new_tokens = await auth_service.refresh_tokens(login_response.refresh_token)

        assert new_tokens.access_token is not None
        assert new_tokens.refresh_token is not None
        # New tokens should be different
        assert new_tokens.access_token != login_response.access_token

    async def test_refresh_with_access_token_fails(self, auth_service, test_user):
        """Using access token for refresh should fail."""
        login_request = LoginRequest(
            email="test@example.com",
            password="TestPassword1!",
        )
        login_response = await auth_service.login(login_request)

        with pytest.raises(InvalidTokenError):
            await auth_service.refresh_tokens(login_response.access_token)

    async def test_refresh_with_invalid_token(self, auth_service):
        """Invalid refresh token should raise InvalidTokenError."""
        with pytest.raises(InvalidTokenError):
            await auth_service.refresh_tokens("invalid-token")


@pytest.mark.asyncio
class TestAccountActivation:
    """Tests for account activation functionality."""

    async def test_activate_account_success(self, auth_service, inactive_user, db_session):
        """Account activation should succeed with valid token."""
        request = ActivateAccountRequest(
            token="test-invitation-token",
            password="NewPassword1!",
            accept_terms=True,
        )
        user = await auth_service.activate_account(request)

        assert user.is_active is True
        assert user.is_verified is True
        assert user.invitation_token is None

    async def test_activate_with_profile_update(self, auth_service, inactive_user):
        """Activation should update profile if provided."""
        request = ActivateAccountRequest(
            token="test-invitation-token",
            password="NewPassword1!",
            first_name="Updated",
            last_name="Name",
            phone="0611223344",
            accept_terms=True,
        )
        user = await auth_service.activate_account(request)

        assert user.first_name == "Updated"
        assert user.last_name == "Name"
        assert user.phone == "0611223344"

    async def test_activate_invalid_token(self, auth_service):
        """Invalid invitation token should raise InvalidTokenError."""
        request = ActivateAccountRequest(
            token="invalid-token",
            password="NewPassword1!",
            accept_terms=True,
        )
        with pytest.raises(InvalidTokenError):
            await auth_service.activate_account(request)

    async def test_activate_already_activated(self, auth_service, test_user, db_session):
        """Activating already active account should raise InvalidTokenError."""
        # Set a token on the active user for testing
        test_user.invitation_token = "some-token"
        await db_session.commit()

        request = ActivateAccountRequest(
            token="some-token",
            password="NewPassword1!",
            accept_terms=True,
        )
        with pytest.raises(InvalidTokenError):
            await auth_service.activate_account(request)
