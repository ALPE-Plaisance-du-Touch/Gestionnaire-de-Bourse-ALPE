"""FastAPI dependencies for dependency injection."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.exceptions import InvalidTokenError, TokenExpiredError
from app.models import User
from app.models.base import get_db_session
from app.repositories import UserRepository
from app.services import AuthService

# HTTP Bearer token security scheme
security = HTTPBearer(auto_error=False)

# Type alias for database session dependency
DBSession = Annotated[AsyncSession, Depends(get_db_session)]


def get_auth_service(db: DBSession) -> AuthService:
    """Get AuthService instance."""
    return AuthService(db)


def get_user_repository(db: DBSession) -> UserRepository:
    """Get UserRepository instance."""
    return UserRepository(db)


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: DBSession,
) -> User | None:
    """Get current user from JWT token (optional, returns None if not authenticated)."""
    if credentials is None:
        return None

    token = credentials.credentials
    try:
        auth_service = AuthService(db)
        payload = auth_service.decode_token(token)

        # Check token type
        if payload.get("type") != "access":
            return None

        user_id = payload.get("sub")
        if user_id is None:
            return None

        # Fetch user from database
        user_repo = UserRepository(db)
        user = await user_repo.get_by_id(user_id)
        return user

    except (InvalidTokenError, TokenExpiredError):
        return None


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: DBSession,
) -> User:
    """Get current user from JWT token (required, raises 401 if not authenticated)."""
    user = await get_current_user_optional(credentials, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Get current active user (raises 403 if user is not active)."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user


def require_role(allowed_roles: list[str]):
    """Dependency factory to require specific roles."""

    async def role_checker(
        current_user: Annotated[User, Depends(get_current_active_user)],
    ) -> User:
        if current_user.role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker


# Type aliases for dependency injection
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentActiveUser = Annotated[User, Depends(get_current_active_user)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
UserRepositoryDep = Annotated[UserRepository, Depends(get_user_repository)]

# Role-based dependencies
RequireDepositor = Depends(require_role(["depositor", "volunteer", "manager", "administrator"]))
RequireVolunteer = Depends(require_role(["volunteer", "manager", "administrator"]))
RequireManager = Depends(require_role(["manager", "administrator"]))
RequireAdmin = Depends(require_role(["administrator"]))
