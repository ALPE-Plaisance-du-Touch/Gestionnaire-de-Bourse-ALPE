"""Health endpoint tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test that health check endpoint returns healthy status."""
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.asyncio
async def test_api_root(client: AsyncClient):
    """Test that API root endpoint returns version info."""
    response = await client.get("/api/v1")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Bourse ALPE API"
    assert "version" in data
    assert "docs" in data
