"""Invitation service for managing depositor invitations."""

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.exceptions import DuplicateEmailError, InvalidTokenError
from app.models import User
from app.repositories import UserRepository


class InvitationService:
    """Service for managing invitations."""

    def __init__(self, db: AsyncSession):
        """Initialize invitation service with database session."""
        self.db = db
        self.user_repo = UserRepository(db)

    @staticmethod
    def generate_token() -> str:
        """Generate a secure random invitation token."""
        return secrets.token_urlsafe(32)

    @staticmethod
    def get_expiry() -> datetime:
        """Get the expiration datetime for a new invitation token."""
        return datetime.now(timezone.utc) + timedelta(
            days=settings.invitation_token_expire_days
        )

    async def create_invitation(
        self,
        email: str,
        first_name: str | None = None,
        last_name: str | None = None,
        list_type: str = "standard",
        created_by_id: str | None = None,
    ) -> tuple[User, str]:
        """Create a new invitation for a depositor.

        Returns:
            Tuple of (user, invitation_token)
        """
        # Check if email already exists
        existing = await self.user_repo.get_by_email(email)
        if existing:
            if existing.is_active and existing.password_hash:
                raise DuplicateEmailError(email)
            # User exists but not activated - regenerate token
            token = self.generate_token()
            await self.user_repo.set_invitation_token(
                existing, token, self.get_expiry()
            )
            return existing, token

        # Create new user with invitation
        token = self.generate_token()
        user = await self.user_repo.create(
            email=email,
            first_name=first_name or "Déposant",
            last_name=last_name or "",
            role_name="depositor",
            is_active=False,
            is_verified=False,
            invitation_token=token,
            invitation_expires_at=self.get_expiry(),
        )

        return user, token

    async def create_bulk_invitations(
        self,
        invitations: list[dict],
        created_by_id: str | None = None,
    ) -> dict:
        """Create multiple invitations at once.

        Args:
            invitations: List of dicts with email, first_name, last_name, list_type

        Returns:
            Dict with total, created, duplicates, errors counts and details
        """
        result = {
            "total": len(invitations),
            "created": 0,
            "duplicates": 0,
            "errors": [],
        }

        for i, inv in enumerate(invitations, 1):
            try:
                email = inv.get("email")
                if not email:
                    result["errors"].append({
                        "line": i,
                        "email": "",
                        "error": "Email is required",
                    })
                    continue

                await self.create_invitation(
                    email=email,
                    first_name=inv.get("first_name"),
                    last_name=inv.get("last_name"),
                    list_type=inv.get("list_type", "standard"),
                    created_by_id=created_by_id,
                )
                result["created"] += 1

            except DuplicateEmailError:
                result["duplicates"] += 1
            except Exception as e:
                result["errors"].append({
                    "line": i,
                    "email": inv.get("email", ""),
                    "error": str(e),
                })

        return result

    async def resend_invitation(self, invitation_id: str) -> tuple[User, str]:
        """Resend an invitation by generating a new token.

        Args:
            invitation_id: The user ID of the invitation to resend

        Returns:
            Tuple of (user, new_token)
        """
        user = await self.user_repo.get_by_id(invitation_id)
        if not user:
            raise InvalidTokenError("Invitation not found")

        if user.is_active and user.password_hash:
            raise InvalidTokenError("Account already activated")

        # Generate new token
        token = self.generate_token()
        await self.user_repo.set_invitation_token(user, token, self.get_expiry())

        return user, token

    async def get_invitation_by_token(self, token: str) -> User | None:
        """Get an invitation by its token."""
        return await self.user_repo.get_by_invitation_token(token)

    async def validate_invitation_token(self, token: str) -> User:
        """Validate an invitation token and return the user.

        Raises:
            InvalidTokenError: If token is invalid or account already activated
            TokenExpiredError: If token has expired
        """
        from app.exceptions import TokenExpiredError

        user = await self.user_repo.get_by_invitation_token(token)
        if not user:
            raise InvalidTokenError("Invalid invitation token")

        if user.is_active and user.password_hash:
            raise InvalidTokenError("Account already activated")

        if user.invitation_expires_at:
            expires = user.invitation_expires_at
            if expires.tzinfo is None:
                expires = expires.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > expires:
                raise TokenExpiredError("Invitation token has expired")

        return user
