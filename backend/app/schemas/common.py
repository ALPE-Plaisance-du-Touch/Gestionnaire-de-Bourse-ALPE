"""Common schemas shared across the API."""

from typing import Generic, TypeVar

from pydantic import BaseModel, Field


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response schema."""

    items: list[T]
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., ge=1, description="Current page number")
    limit: int = Field(..., ge=1, le=100, description="Items per page")
    pages: int = Field(..., ge=0, description="Total number of pages")


class ErrorResponse(BaseModel):
    """Standard error response schema."""

    code: str = Field(..., description="Error code for programmatic handling")
    message: str = Field(..., description="Human-readable error message")
    details: dict | None = Field(None, description="Additional error details")


class MessageResponse(BaseModel):
    """Simple message response schema."""

    message: str
