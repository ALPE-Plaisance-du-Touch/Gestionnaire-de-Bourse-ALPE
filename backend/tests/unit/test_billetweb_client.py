"""Tests for BilletwebClient."""

import asyncio
import time

import httpx
import pytest

from app.services.billetweb_client import (
    BILLETWEB_BASE_URL,
    BilletwebAPIError,
    BilletwebAuthError,
    BilletwebClient,
    BilletwebRateLimitError,
)


class TestBilletwebClientAuth:
    """Test authentication parameter handling."""

    def test_auth_params(self):
        client = BilletwebClient(user="testuser", api_key="testkey123")
        params = client._auth_params()
        assert params == {"user": "testuser", "key": "testkey123"}


class TestBilletwebClientRequests:
    """Test HTTP request handling with mocked responses."""

    @pytest.fixture
    def client(self):
        return BilletwebClient(user="u", api_key="k")

    @pytest.mark.asyncio
    async def test_get_events_success(self, client, monkeypatch):
        mock_events = [{"id": "1", "name": "Event 1"}, {"id": "2", "name": "Event 2"}]

        async def mock_request(self, method, url, **kwargs):
            return httpx.Response(200, json=mock_events, request=httpx.Request("GET", url))

        monkeypatch.setattr(httpx.AsyncClient, "request", mock_request)
        result = await client.get_events()
        assert len(result) == 2
        assert result[0]["name"] == "Event 1"

    @pytest.mark.asyncio
    async def test_get_events_single_dict_wraps_in_list(self, client, monkeypatch):
        mock_event = {"id": "1", "name": "Single Event"}

        async def mock_request(self, method, url, **kwargs):
            return httpx.Response(200, json=mock_event, request=httpx.Request("GET", url))

        monkeypatch.setattr(httpx.AsyncClient, "request", mock_request)
        result = await client.get_events()
        assert isinstance(result, list)
        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_auth_error_401(self, client, monkeypatch):
        async def mock_request(self, method, url, **kwargs):
            return httpx.Response(401, text="Unauthorized", request=httpx.Request("GET", url))

        monkeypatch.setattr(httpx.AsyncClient, "request", mock_request)
        with pytest.raises(BilletwebAuthError):
            await client.get_events()

    @pytest.mark.asyncio
    async def test_auth_error_403(self, client, monkeypatch):
        async def mock_request(self, method, url, **kwargs):
            return httpx.Response(403, text="Forbidden", request=httpx.Request("GET", url))

        monkeypatch.setattr(httpx.AsyncClient, "request", mock_request)
        with pytest.raises(BilletwebAuthError):
            await client.get_events()

    @pytest.mark.asyncio
    async def test_rate_limit_error(self, client, monkeypatch):
        async def mock_request(self, method, url, **kwargs):
            return httpx.Response(429, text="Too Many Requests", request=httpx.Request("GET", url))

        monkeypatch.setattr(httpx.AsyncClient, "request", mock_request)
        with pytest.raises(BilletwebRateLimitError):
            await client.get_events()

    @pytest.mark.asyncio
    async def test_server_error(self, client, monkeypatch):
        async def mock_request(self, method, url, **kwargs):
            return httpx.Response(500, text="Internal Server Error", request=httpx.Request("GET", url))

        monkeypatch.setattr(httpx.AsyncClient, "request", mock_request)
        with pytest.raises(BilletwebAPIError) as exc_info:
            await client.get_events()
        assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    async def test_timeout_error(self, client, monkeypatch):
        async def mock_request(self, method, url, **kwargs):
            raise httpx.TimeoutException("timeout")

        monkeypatch.setattr(httpx.AsyncClient, "request", mock_request)
        with pytest.raises(BilletwebAPIError, match="timeout"):
            await client.get_events()

    @pytest.mark.asyncio
    async def test_connect_error(self, client, monkeypatch):
        async def mock_request(self, method, url, **kwargs):
            raise httpx.ConnectError("connection refused")

        monkeypatch.setattr(httpx.AsyncClient, "request", mock_request)
        with pytest.raises(BilletwebAPIError, match="Unable to connect"):
            await client.get_events()

    @pytest.mark.asyncio
    async def test_get_sessions(self, client, monkeypatch):
        mock_sessions = [{"id": "s1", "name": "Session 1"}]

        async def mock_request(self, method, url, **kwargs):
            assert "/event/evt123/dates" in str(url)
            return httpx.Response(200, json=mock_sessions, request=httpx.Request("GET", url))

        monkeypatch.setattr(httpx.AsyncClient, "request", mock_request)
        result = await client.get_sessions("evt123")
        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_get_attendees(self, client, monkeypatch):
        mock_attendees = [{"id": "a1", "name": "Dupont"}]

        async def mock_request(self, method, url, **kwargs):
            assert "/event/evt123/attendees" in str(url)
            return httpx.Response(200, json=mock_attendees, request=httpx.Request("GET", url))

        monkeypatch.setattr(httpx.AsyncClient, "request", mock_request)
        # Reset rate limit timer to avoid wait
        client._last_attendees_call = 0
        result = await client.get_attendees("evt123")
        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_get_attendees_with_last_update(self, client, monkeypatch):
        captured_params = {}

        async def mock_request(self, method, url, **kwargs):
            captured_params.update(kwargs.get("params", {}))
            return httpx.Response(200, json=[], request=httpx.Request("GET", url))

        monkeypatch.setattr(httpx.AsyncClient, "request", mock_request)
        client._last_attendees_call = 0
        await client.get_attendees("evt123", last_update=1700000000)
        assert captured_params.get("last_update") == "1700000000"

    @pytest.mark.asyncio
    async def test_test_connection(self, client, monkeypatch):
        async def mock_request(self, method, url, **kwargs):
            return httpx.Response(200, json=[], request=httpx.Request("GET", url))

        monkeypatch.setattr(httpx.AsyncClient, "request", mock_request)
        result = await client.test_connection()
        assert result is True
