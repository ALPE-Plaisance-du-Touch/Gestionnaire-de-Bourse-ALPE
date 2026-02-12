"""Schemas for Billetweb API integration."""

from pydantic import BaseModel, Field


class BilletwebCredentialsRequest(BaseModel):
    """Request to save Billetweb API credentials."""

    user: str = Field(..., min_length=1, description="Billetweb API user identifier")
    api_key: str = Field(..., min_length=1, description="Billetweb API key")


class BilletwebCredentialsResponse(BaseModel):
    """Response showing Billetweb API configuration status."""

    configured: bool
    user: str | None = None
    api_key_masked: str | None = None


class BilletwebConnectionTestResponse(BaseModel):
    """Response from testing Billetweb API connection."""

    success: bool
    message: str
