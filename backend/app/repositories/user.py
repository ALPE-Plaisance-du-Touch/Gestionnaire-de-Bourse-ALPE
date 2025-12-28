"""User repository for database operations."""

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.exceptions import DuplicateEmailError, UserNotFoundError
from app.models import Role, User


class UserRepository:
    """Repository for user database operations."""

    def __init__(self, db: AsyncSession):
        """Initialize repository with database session."""
        self.db = db

    async def get_by_id(self, user_id: str) -> User | None:
        """Get a user by ID."""
        result = await self.db.execute(
            select(User).options(joinedload(User.role)).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        """Get a user by email."""
        result = await self.db.execute(
            select(User)
            .options(joinedload(User.role))
            .where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def get_by_invitation_token(self, token: str) -> User | None:
        """Get a user by invitation token."""
        result = await self.db.execute(
            select(User)
            .options(joinedload(User.role))
            .where(User.invitation_token == token)
        )
        return result.scalar_one_or_none()

    async def email_exists(self, email: str) -> bool:
        """Check if an email already exists."""
        result = await self.db.execute(
            select(func.count()).select_from(User).where(User.email == email.lower())
        )
        return result.scalar_one() > 0

    async def create(
        self,
        email: str,
        first_name: str,
        last_name: str,
        role_name: str,
        *,
        password_hash: str | None = None,
        phone: str | None = None,
        address: str | None = None,
        is_local_resident: bool = False,
        is_active: bool = False,
        is_verified: bool = False,
        invitation_token: str | None = None,
        invitation_expires_at: datetime | None = None,
    ) -> User:
        """Create a new user."""
        # Check for duplicate email
        if await self.email_exists(email):
            raise DuplicateEmailError(email)

        # Get role
        result = await self.db.execute(select(Role).where(Role.name == role_name))
        role = result.scalar_one_or_none()
        if not role:
            raise ValueError(f"Role '{role_name}' not found")

        user = User(
            email=email.lower(),
            first_name=first_name,
            last_name=last_name,
            role_id=role.id,
            password_hash=password_hash,
            phone=phone,
            address=address,
            is_local_resident=is_local_resident,
            is_active=is_active,
            is_verified=is_verified,
            invitation_token=invitation_token,
            invitation_expires_at=invitation_expires_at,
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        # Load role relationship
        result = await self.db.execute(
            select(User).options(joinedload(User.role)).where(User.id == user.id)
        )
        return result.scalar_one()

    async def update(self, user: User, **kwargs) -> User:
        """Update a user's attributes."""
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def update_last_login(self, user: User) -> User:
        """Update user's last login timestamp."""
        user.last_login_at = datetime.now(timezone.utc)
        await self.db.commit()
        return user

    async def set_invitation_token(
        self, user: User, token: str, expires_at: datetime
    ) -> User:
        """Set invitation token for a user."""
        user.invitation_token = token
        user.invitation_expires_at = expires_at
        await self.db.commit()
        return user

    async def clear_invitation_token(self, user: User) -> User:
        """Clear invitation token after use."""
        user.invitation_token = None
        user.invitation_expires_at = None
        await self.db.commit()
        return user

    async def activate(
        self,
        user: User,
        password_hash: str,
        *,
        first_name: str | None = None,
        last_name: str | None = None,
        phone: str | None = None,
    ) -> User:
        """Activate a user account."""
        user.password_hash = password_hash
        user.is_active = True
        user.is_verified = True
        user.invitation_token = None
        user.invitation_expires_at = None

        if first_name:
            user.first_name = first_name
        if last_name:
            user.last_name = last_name
        if phone:
            user.phone = phone

        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def list_users(
        self,
        *,
        role: str | None = None,
        is_active: bool | None = None,
        search: str | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[list[User], int]:
        """List users with filtering and pagination."""
        query = select(User).options(joinedload(User.role))

        # Apply filters
        if role:
            query = query.join(Role).where(Role.name == role)
        if is_active is not None:
            query = query.where(User.is_active == is_active)
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (User.first_name.ilike(search_pattern))
                | (User.last_name.ilike(search_pattern))
                | (User.email.ilike(search_pattern))
            )

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar_one()

        # Apply pagination
        query = query.offset((page - 1) * limit).limit(limit)
        query = query.order_by(User.created_at.desc())

        result = await self.db.execute(query)
        users = list(result.scalars().all())

        return users, total

    async def delete(self, user: User) -> None:
        """Delete a user (for tests, prefer anonymization in production)."""
        await self.db.delete(user)
        await self.db.commit()

    async def anonymize(self, user: User) -> User:
        """Anonymize a user for GDPR compliance."""
        user.email = f"deleted_{user.id}@anonymized.local"
        user.first_name = "Utilisateur"
        user.last_name = "Supprimé"
        user.phone = None
        user.address = None
        user.password_hash = None
        user.is_active = False
        user.invitation_token = None
        user.invitation_expires_at = None

        await self.db.commit()
        return user
