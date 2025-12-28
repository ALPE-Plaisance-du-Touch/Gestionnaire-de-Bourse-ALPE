"""Authentication schemas for API requests and responses."""

import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# Password validation pattern: min 8 chars, 1 letter, 1 digit, 1 special char
PASSWORD_PATTERN = re.compile(
    r"^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$"
)


class LoginRequest(BaseModel):
    """Request schema for user login."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """Response schema for JWT tokens."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Token validity in seconds")


class RefreshTokenRequest(BaseModel):
    """Request schema for token refresh."""

    refresh_token: str


class ActivateAccountRequest(BaseModel):
    """Request schema for account activation via invitation."""

    token: str = Field(..., description="Invitation token received by email")
    password: str = Field(
        ...,
        min_length=8,
        description="Min 8 chars, 1 letter, 1 digit, 1 special character",
    )
    first_name: str | None = Field(None, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=20)
    accept_terms: bool = Field(..., description="Must accept CGU/RGPD")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets security requirements."""
        if not PASSWORD_PATTERN.match(v):
            raise ValueError(
                "Password must contain at least 8 characters, "
                "one letter, one digit, and one special character (@$!%*#?&)"
            )
        return v

    @field_validator("phone")
    @classmethod
    def validate_french_phone(cls, v: str | None) -> str | None:
        """Validate French phone number format."""
        if v is None:
            return v
        # Remove spaces and dots
        cleaned = v.replace(" ", "").replace(".", "").replace("-", "")
        # French phone: starts with 0 and has 10 digits, or +33 with 11 chars
        if cleaned.startswith("+33"):
            cleaned = "0" + cleaned[3:]
        if not re.match(r"^0[1-9]\d{8}$", cleaned):
            raise ValueError("Invalid French phone number format")
        return cleaned

    @field_validator("accept_terms")
    @classmethod
    def must_accept_terms(cls, v: bool) -> bool:
        """Ensure terms are accepted."""
        if not v:
            raise ValueError("You must accept the terms and conditions")
        return v


class PasswordResetRequest(BaseModel):
    """Request schema for password reset request."""

    email: EmailStr


class PasswordReset(BaseModel):
    """Request schema for password reset."""

    token: str
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets security requirements."""
        if not PASSWORD_PATTERN.match(v):
            raise ValueError(
                "Password must contain at least 8 characters, "
                "one letter, one digit, and one special character (@$!%*#?&)"
            )
        return v


class UserResponse(BaseModel):
    """Response schema for user data."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    first_name: str
    last_name: str
    phone: str | None = None
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login_at: datetime | None = None

    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"


class LoginResponse(BaseModel):
    """Response schema for successful login."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
