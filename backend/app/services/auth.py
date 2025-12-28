"""Authentication service for user authentication and token management."""

import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.exceptions import (
    AuthenticationError,
    InvalidTokenError,
    TokenExpiredError,
    UserNotFoundError,
)
from app.models import User
from app.schemas import (
    ActivateAccountRequest,
    LoginRequest,
    LoginResponse,
    TokenResponse,
)
from app.schemas.auth import UserResponse


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: AsyncSession):
        """Initialize auth service with database session."""
        self.db = db

    # -------------------------------------------------------------------------
    # Password Hashing
    # -------------------------------------------------------------------------

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt."""
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify a password against its hash."""
        return bcrypt.checkpw(
            password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )

    # -------------------------------------------------------------------------
    # JWT Token Management
    # -------------------------------------------------------------------------

    @staticmethod
    def create_access_token(user_id: str, role: str) -> str:
        """Create a new JWT access token."""
        expires = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
        payload = {
            "sub": user_id,
            "role": role,
            "type": "access",
            "exp": expires,
            "iat": datetime.now(timezone.utc),
        }
        return jwt.encode(
            payload,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )

    @staticmethod
    def create_refresh_token(user_id: str) -> str:
        """Create a new JWT refresh token."""
        expires = datetime.now(timezone.utc) + timedelta(
            days=settings.refresh_token_expire_days
        )
        payload = {
            "sub": user_id,
            "type": "refresh",
            "exp": expires,
            "iat": datetime.now(timezone.utc),
            "jti": secrets.token_hex(16),  # Unique token ID
        }
        return jwt.encode(
            payload,
            settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
        )

    @staticmethod
    def decode_token(token: str) -> dict:
        """Decode and validate a JWT token."""
        try:
            payload = jwt.decode(
                token,
                settings.jwt_secret_key,
                algorithms=[settings.jwt_algorithm],
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError("Token has expired")
        except jwt.InvalidTokenError:
            raise InvalidTokenError("Invalid token")

    @staticmethod
    def create_token_response(user: User) -> TokenResponse:
        """Create a token response for a user."""
        access_token = AuthService.create_access_token(user.id, user.role.name)
        refresh_token = AuthService.create_refresh_token(user.id)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.access_token_expire_minutes * 60,
        )

    # -------------------------------------------------------------------------
    # Authentication Operations
    # -------------------------------------------------------------------------

    async def login(self, request: LoginRequest) -> LoginResponse:
        """Authenticate a user and return tokens."""
        # Find user by email
        result = await self.db.execute(
            select(User).where(User.email == request.email.lower())
        )
        user = result.scalar_one_or_none()

        if not user:
            raise AuthenticationError("Invalid email or password")

        # Check if user is active
        if not user.is_active:
            raise AuthenticationError("Account is not activated")

        # Verify password
        if not user.password_hash:
            raise AuthenticationError("Account requires activation")

        if not self.verify_password(request.password, user.password_hash):
            raise AuthenticationError("Invalid email or password")

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.commit()

        # Generate tokens
        token_response = self.create_token_response(user)

        # Build user response
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            role=user.role.name,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login_at=user.last_login_at,
        )

        return LoginResponse(
            access_token=token_response.access_token,
            refresh_token=token_response.refresh_token,
            expires_in=token_response.expires_in,
            user=user_response,
        )

    async def refresh_tokens(self, refresh_token: str) -> TokenResponse:
        """Refresh access token using a valid refresh token."""
        # Decode refresh token
        payload = self.decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise InvalidTokenError("Invalid token type")

        user_id = payload.get("sub")
        if not user_id:
            raise InvalidTokenError("Invalid token payload")

        # Find user
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            raise InvalidTokenError("User not found or inactive")

        # Generate new tokens
        return self.create_token_response(user)

    async def get_current_user(self, user_id: str) -> User:
        """Get the current authenticated user."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise UserNotFoundError("User not found")

        return user

    # -------------------------------------------------------------------------
    # Account Activation
    # -------------------------------------------------------------------------

    async def activate_account(self, request: ActivateAccountRequest) -> User:
        """Activate a user account using an invitation token."""
        # Find user by invitation token
        result = await self.db.execute(
            select(User).where(User.invitation_token == request.token)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise InvalidTokenError("Invalid invitation token")

        # Check if already activated
        if user.is_active and user.password_hash:
            raise InvalidTokenError("Account already activated")

        # Check token expiration
        if user.invitation_expires_at:
            if datetime.now(timezone.utc) > user.invitation_expires_at.replace(
                tzinfo=timezone.utc
            ):
                raise TokenExpiredError("Invitation token has expired")

        # Update user data
        user.password_hash = self.hash_password(request.password)
        user.is_active = True
        user.is_verified = True
        user.invitation_token = None
        user.invitation_expires_at = None

        # Update profile if provided
        if request.first_name:
            user.first_name = request.first_name
        if request.last_name:
            user.last_name = request.last_name
        if request.phone:
            user.phone = request.phone

        await self.db.commit()
        await self.db.refresh(user)

        return user

    # -------------------------------------------------------------------------
    # Invitation Token Generation
    # -------------------------------------------------------------------------

    @staticmethod
    def generate_invitation_token() -> str:
        """Generate a secure random invitation token."""
        return secrets.token_urlsafe(32)

    @staticmethod
    def get_invitation_expiry() -> datetime:
        """Get the expiration datetime for a new invitation token."""
        return datetime.now(timezone.utc) + timedelta(
            days=settings.invitation_token_expire_days
        )

    async def create_invitation_for_user(self, user: User) -> str:
        """Create a new invitation token for a user."""
        token = self.generate_invitation_token()
        user.invitation_token = token
        user.invitation_expires_at = self.get_invitation_expiry()

        await self.db.commit()
        return token

    # -------------------------------------------------------------------------
    # Password Reset
    # -------------------------------------------------------------------------

    async def request_password_reset(self, email: str) -> str | None:
        """Request a password reset for a user.

        Returns the reset token if user exists, None otherwise.
        Note: Always returns the same response to prevent email enumeration.
        """
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        user = result.scalar_one_or_none()

        if not user or not user.is_active:
            # Return None but don't reveal if user exists
            return None

        # Generate and store reset token (reusing invitation token field)
        token = self.generate_invitation_token()
        user.invitation_token = token
        user.invitation_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)

        await self.db.commit()
        return token

    async def reset_password(self, token: str, new_password: str) -> User:
        """Reset a user's password using a valid reset token."""
        result = await self.db.execute(
            select(User).where(User.invitation_token == token)
        )
        user = result.scalar_one_or_none()

        if not user:
            raise InvalidTokenError("Invalid reset token")

        # Check token expiration
        if user.invitation_expires_at:
            if datetime.now(timezone.utc) > user.invitation_expires_at.replace(
                tzinfo=timezone.utc
            ):
                raise TokenExpiredError("Reset token has expired")

        # Update password
        user.password_hash = self.hash_password(new_password)
        user.invitation_token = None
        user.invitation_expires_at = None

        await self.db.commit()
        await self.db.refresh(user)

        return user
