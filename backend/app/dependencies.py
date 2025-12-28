"""FastAPI dependencies for dependency injection."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.base import get_db_session

# HTTP Bearer token security scheme
security = HTTPBearer(auto_error=False)

# Type alias for database session dependency
DBSession = Annotated[AsyncSession, Depends(get_db_session)]


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: DBSession,
):
    """Get current user from JWT token (optional, returns None if not authenticated)."""
    if credentials is None:
        return None

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        # TODO: Fetch user from database
        # user = await user_repository.get_by_id(db, user_id)
        # return user
        return {"id": user_id}  # Placeholder
    except JWTError:
        return None


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: DBSession,
):
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
    current_user=Depends(get_current_user),
):
    """Get current active user (raises 403 if user is not active)."""
    # TODO: Check if user is active
    # if not current_user.is_active:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Inactive user",
    #     )
    return current_user


def require_role(allowed_roles: list[str]):
    """Dependency factory to require specific roles."""

    async def role_checker(current_user=Depends(get_current_active_user)):
        # TODO: Check user role
        # if current_user.role.name not in allowed_roles:
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail="Insufficient permissions",
        #     )
        return current_user

    return role_checker


# Role-based dependencies
RequireDepositor = Depends(require_role(["depositor", "volunteer", "manager", "administrator"]))
RequireVolunteer = Depends(require_role(["volunteer", "manager", "administrator"]))
RequireManager = Depends(require_role(["manager", "administrator"]))
RequireAdmin = Depends(require_role(["administrator"]))
