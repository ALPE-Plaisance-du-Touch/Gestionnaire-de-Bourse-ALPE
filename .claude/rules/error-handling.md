# Error Handling

## Principles
- **Fail fast**: detect early, surface immediately
- Handle the error **at the right level** — never catch just to swallow
- No silently swallowed exception: log it at minimum
- Use specific error types when the distinction drives different behaviour

## Boundaries

| Context | Behaviour |
|---|---|
| **System boundaries** (API endpoints, Billetweb sync, imports) | Catch, log, return a structured error |
| **Internal code** (services, repositories) | Let it propagate — no try/except around every call |
| **Background jobs** (cron, batch) | Catch at the top level, log, **keep going** on the remaining items |

## Backend

Business errors are typed exceptions inheriting from `AppException`
(`backend/app/exceptions.py`): `NotFoundError`, `ValidationError`,
`AuthenticationError`, `AuthorizationError`, plus domain-specific ones such as
`EditionNotFoundError`.

Services raise them. **Endpoints convert them to HTTP** — that is where the boundary
is:

```python
try:
    edition = await service.get_edition(edition_id)
except EditionNotFoundError:
    raise HTTPException(status_code=404, detail="Édition introuvable")
```

Do not catch an `AppException` inside a service just to re-raise it: let it reach the
endpoint.

| Exception | HTTP |
|---|---|
| `NotFoundError` | 404 |
| `ValidationError` | 422 |
| `AuthenticationError` | 401 |
| `AuthorizationError` | 403 |
| Conflict (duplicate) | 409 |

## Frontend

The Axios interceptor turns every API error into an `ApiException`
(`frontend/src/api/client.ts`) carrying `code`, `message`, `status` and an optional
`field`. Branch on `status`, not on the message text:

```ts
if (err instanceof ApiException && err.status === 409) {
  setError('Une édition avec ce nom existe déjà.');
}
```

React Query surfaces the error; render it, never let it fail silently.

## Logs
- Right level: `error` for failures, `warning` for recoverable, `info` for key events
- Include **context**: which operation, which resource, which identifiers
- **Never log sensitive data**: passwords, tokens, personal data

## Retry
- Retry only the **transient**: network, 5xx, rate limiting. Never a 4xx.
- Exponential backoff **with jitter**
- Bounded attempts (3 is the usual limit) — never infinite
- Log each attempt with its number

Applies mainly to the Billetweb API, the one external dependency here.

## User-facing errors
Useful, non-technical, in French — user-facing text is French, code is English.

**Never** expose a stack trace, an internal path, a SQL detail or an internal id to the
client. In production the API docs are disabled and `DEBUG` is off; do not undo that to
troubleshoot a live issue — read the logs.

Offline mode: a failed sale is queued in IndexedDB and synced on reconnect. A network
error there is an expected state, not a failure to report to the user.
