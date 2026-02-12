"""HTTP client for the Billetweb REST API."""

import asyncio
import logging
import time

import httpx

logger = logging.getLogger(__name__)

BILLETWEB_BASE_URL = "https://www.billetweb.fr/api"

# Rate limit: max 10 calls/min on /attendees, enforce 6s between calls
RATE_LIMIT_DELAY = 6.0


class BilletwebAPIError(Exception):
    """Generic Billetweb API error."""

    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


class BilletwebAuthError(BilletwebAPIError):
    """Authentication error (invalid credentials)."""
    pass


class BilletwebRateLimitError(BilletwebAPIError):
    """Rate limit exceeded."""
    pass


class BilletwebClient:
    """Async HTTP client for Billetweb API with rate limiting."""

    def __init__(self, user: str, api_key: str):
        self._user = user
        self._api_key = api_key
        self._last_attendees_call: float = 0

    def _auth_params(self) -> dict[str, str]:
        return {"user": self._user, "key": self._api_key}

    async def _request(self, method: str, path: str, params: dict | None = None) -> dict | list:
        url = f"{BILLETWEB_BASE_URL}{path}"
        all_params = {**self._auth_params(), **(params or {})}

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.request(method, url, params=all_params)
            except httpx.TimeoutException:
                raise BilletwebAPIError("Billetweb API timeout")
            except httpx.ConnectError:
                raise BilletwebAPIError("Unable to connect to Billetweb API")

        if response.status_code == 401 or response.status_code == 403:
            raise BilletwebAuthError(
                "Invalid Billetweb credentials",
                status_code=response.status_code,
            )

        if response.status_code == 429:
            raise BilletwebRateLimitError(
                "Billetweb API rate limit exceeded",
                status_code=429,
            )

        if response.status_code >= 400:
            raise BilletwebAPIError(
                f"Billetweb API error: {response.status_code} - {response.text[:200]}",
                status_code=response.status_code,
            )

        return response.json()

    async def _rate_limited_request(self, method: str, path: str, params: dict | None = None) -> dict | list:
        """Request with rate limiting for attendees endpoint."""
        now = time.monotonic()
        elapsed = now - self._last_attendees_call
        if elapsed < RATE_LIMIT_DELAY:
            await asyncio.sleep(RATE_LIMIT_DELAY - elapsed)

        try:
            return await self._request(method, path, params)
        finally:
            self._last_attendees_call = time.monotonic()

    async def test_connection(self) -> bool:
        """Test connection by fetching events list."""
        await self.get_events()
        return True

    async def get_events(self) -> list[dict]:
        """Get list of events."""
        result = await self._request("GET", "/events")
        if isinstance(result, dict):
            return [result]
        return result

    async def get_sessions(self, event_id: str) -> list[dict]:
        """Get sessions/dates for an event."""
        result = await self._request("GET", f"/event/{event_id}/dates")
        if isinstance(result, dict):
            return [result]
        return result

    async def get_attendees(
        self, event_id: str, *, last_update: int | None = None
    ) -> list[dict]:
        """Get attendees for an event with rate limiting."""
        params: dict = {}
        if last_update is not None:
            params["last_update"] = str(last_update)

        result = await self._rate_limited_request(
            "GET", f"/event/{event_id}/attendees", params
        )
        if isinstance(result, dict):
            return [result]
        return result
