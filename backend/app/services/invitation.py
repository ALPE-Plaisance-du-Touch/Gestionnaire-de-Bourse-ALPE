"""Invitation service for managing depositor invitations."""

import secrets
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.exceptions import DuplicateEmailError, InvalidTokenError
from app.models import User
from app.repositories import UserRepository

if TYPE_CHECKING:
    from fastapi import BackgroundTasks


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
        background_tasks: "BackgroundTasks | None" = None,
    ) -> dict:
        """Create multiple invitations at once.

        Args:
            invitations: List of dicts with email, first_name, last_name, list_type
            created_by_id: ID of the user creating the invitations
            background_tasks: FastAPI BackgroundTasks for sending emails

        Returns:
            Dict with total, created, duplicates, errors counts and details
        """
        from app.services.email import email_service

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

                user, token = await self.create_invitation(
                    email=email,
                    first_name=inv.get("first_name"),
                    last_name=inv.get("last_name"),
                    list_type=inv.get("list_type", "standard"),
                    created_by_id=created_by_id,
                )
                result["created"] += 1

                # Queue email if background_tasks provided
                if background_tasks:
                    background_tasks.add_task(
                        email_service.send_invitation_email,
                        to_email=user.email,
                        token=token,
                        first_name=user.first_name,
                    )

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

    async def list_invitations(
        self,
        status_filter: str | None = None,
    ) -> list[User]:
        """List invitations with optional status filter.

        Args:
            status_filter: Optional filter - 'pending', 'expired', 'activated', or None for all

        Returns:
            List of users matching the filter
        """
        from sqlalchemy import or_

        if status_filter == "activated":
            # Query users who were invited and are now active (activated their account)
            # These are depositors who have is_active=True and password_hash set
            query = select(User).where(
                User.is_active == True,  # noqa: E712
                User.password_hash.isnot(None),
                User.role_id == 1,  # depositor role
                User.invitation_hidden == False,  # noqa: E712 - Not hidden from list
            )
            result = await self.db.execute(query)
            return list(result.scalars().all())

        # Query users who have an invitation token (not activated)
        query = select(User).where(
            User.invitation_token.isnot(None),
            User.is_active == False,  # noqa: E712
            User.invitation_hidden == False,  # noqa: E712 - Not hidden from list
        )

        result = await self.db.execute(query)
        pending_users = list(result.scalars().all())

        # Apply status filter for pending/expired
        now = datetime.now(timezone.utc)
        if status_filter == "pending":
            # Only non-expired
            return [
                u for u in pending_users
                if u.invitation_expires_at and u.invitation_expires_at.replace(tzinfo=timezone.utc) > now
            ]
        elif status_filter == "expired":
            # Only expired
            return [
                u for u in pending_users
                if u.invitation_expires_at and u.invitation_expires_at.replace(tzinfo=timezone.utc) <= now
            ]

        # status_filter is None (all) - include activated users too
        activated_query = select(User).where(
            User.is_active == True,  # noqa: E712
            User.password_hash.isnot(None),
            User.role_id == 1,  # depositor role
            User.invitation_hidden == False,  # noqa: E712 - Not hidden from list
        )
        activated_result = await self.db.execute(activated_query)
        activated_users = list(activated_result.scalars().all())

        return pending_users + activated_users

    async def list_pending_invitations(
        self,
        status_filter: str | None = None,
    ) -> list[User]:
        """List invitations that are pending (not yet activated).

        Deprecated: Use list_invitations instead.

        Args:
            status_filter: Optional filter - 'pending', 'expired', 'activated', or None for all

        Returns:
            List of users with pending invitations
        """
        return await self.list_invitations(status_filter)

    async def delete_invitation(self, invitation_id: str) -> bool:
        """Delete an invitation.

        For pending invitations: deletes the user entirely.
        For activated users: hides from invitation list but preserves the user account.

        Args:
            invitation_id: The user ID of the invitation to delete

        Returns:
            True if deleted, False if not found
        """
        user = await self.user_repo.get_by_id(invitation_id)
        if not user:
            return False

        # Check if user is a depositor (role_id = 1)
        if user.role_id != 1:
            return False

        if user.is_active and user.password_hash:
            # User has activated their account - hide from invitation list
            user.invitation_hidden = True
            await self.db.commit()
        else:
            # Pending invitation - delete the user entirely
            await self.db.delete(user)
            await self.db.commit()

        return True

    async def bulk_delete_invitations(self, invitation_ids: list[str]) -> dict:
        """Delete multiple invitations at once.

        Args:
            invitation_ids: List of user IDs to delete

        Returns:
            Dict with total, deleted, not_found counts
        """
        result = {
            "total": len(invitation_ids),
            "deleted": 0,
            "not_found": 0,
        }

        for invitation_id in invitation_ids:
            deleted = await self.delete_invitation(invitation_id)
            if deleted:
                result["deleted"] += 1
            else:
                result["not_found"] += 1

        return result
