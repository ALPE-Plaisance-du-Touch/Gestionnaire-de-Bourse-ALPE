"""User schemas for API requests and responses."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    phone: str | None = Field(None, max_length=20)


class UserCreate(UserBase):
    """Schema for creating a new user (admin only)."""

    role: str = Field(..., pattern="^(depositor|volunteer|manager|administrator)$")
    password: str | None = Field(None, min_length=8)
    is_local_resident: bool = False


class UserUpdate(BaseModel):
    """Schema for admin updating a user."""

    email: EmailStr | None = None
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=20)
    role: str | None = Field(None, pattern="^(depositor|volunteer|manager|administrator)$")
    is_active: bool | None = None
    is_local_resident: bool | None = None


class UserSelfUpdate(BaseModel):
    """Schema for user updating their own profile."""

    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=20)
    address: str | None = None


class UserResponse(BaseModel):
    """Response schema for user data."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: str | None = None
    address: str | None = None
    role: str
    is_active: bool
    is_verified: bool
    is_local_resident: bool
    created_at: datetime
    last_login_at: datetime | None = None

    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"


class UserListResponse(BaseModel):
    """Response schema for paginated user list."""

    items: list[UserResponse]
    total: int
    page: int
    limit: int
    pages: int
