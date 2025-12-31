"""User and Role models."""

from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.edition_depositor import EditionDepositor
    from app.models.item_list import ItemList


class RoleType(str, Enum):
    """User role types."""

    DEPOSITOR = "depositor"
    VOLUNTEER = "volunteer"
    MANAGER = "manager"
    ADMINISTRATOR = "administrator"


class Role(Base):
    """Role model for RBAC."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    users: Mapped[list["User"]] = relationship("User", back_populates="role")


class User(Base, UUIDMixin, TimestampMixin):
    """User model."""

    __tablename__ = "users"

    # Authentication
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Profile
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Plaisance-du-Touch resident (for priority slots)
    is_local_resident: Mapped[bool] = mapped_column(Boolean, default=False)

    # Role
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    role: Mapped["Role"] = relationship("Role", back_populates="users")

    # Invitation token for account activation
    invitation_token: Mapped[str | None] = mapped_column(String(255), nullable=True)
    invitation_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    # Flag to hide invitation from list (soft delete for invitation display)
    invitation_hidden: Mapped[bool] = mapped_column(Boolean, default=False)

    # Last login tracking
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    item_lists: Mapped[list["ItemList"]] = relationship(
        "ItemList", back_populates="depositor"
    )
    edition_registrations: Mapped[list["EditionDepositor"]] = relationship(
        "EditionDepositor", back_populates="user"
    )

    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"

    @property
    def is_depositor(self) -> bool:
        """Check if user is a depositor."""
        return self.role.name == RoleType.DEPOSITOR.value

    @property
    def is_volunteer(self) -> bool:
        """Check if user is a volunteer."""
        return self.role.name == RoleType.VOLUNTEER.value

    @property
    def is_manager(self) -> bool:
        """Check if user is a manager."""
        return self.role.name == RoleType.MANAGER.value

    @property
    def is_administrator(self) -> bool:
        """Check if user is an administrator."""
        return self.role.name == RoleType.ADMINISTRATOR.value
