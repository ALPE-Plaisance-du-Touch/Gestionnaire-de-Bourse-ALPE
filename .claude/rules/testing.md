# Testing

## Strategy
- Write a test for **every bug fix** (regression guard) and every feature
- Do not test the trivial: getters, thin wrappers, framework glue
- Prefer **integration tests** over unit tests when verifying a data flow

## Naming and structure
- Frontend: `*.test.tsx` / `*.test.ts`, **colocated** with the source
- Backend: `backend/tests/unit/` and `backend/tests/integration/`
- Name the **behaviour**, not the implementation:
  `shows error message on duplicate name`, not `test handleSubmit`
- **Arrange / Act / Assert**
- One assertion per concept — several `expect` are fine when they check the same behaviour
- **No logic in a test**: no `if`, no loop. A test reads top to bottom.

## Commands

```bash
docker compose exec frontend npm test     # vitest, non-interactive
docker compose exec backend pytest        # backend, on in-memory SQLite
make test-backend-mariadb                 # same suite, against MariaDB
```

Locally, without Docker: `npm test` from `frontend/`.
Never run bare `vitest` — it enters watch mode and hangs.

**Which backend database.** The suite defaults to in-memory SQLite: fast, no service
needed. Production runs on MariaDB, and SQLite silently accepts what MariaDB rejects —
column precision, quoted defaults. Run the MariaDB target before merging anything that
touches a model, a migration or a query. Point `TEST_DATABASE_URL` at another database
to override.

## Development cycle

```
Write code + tests
      ↓
   Commit
      ↓
Run the full suite ──fail──→ Fix → Commit → (re-run)
      ↓ pass
Check in a browser ──fail──→ Fix → Commit → (re-check)
      ↓ pass
    Push
```

1. Write the implementation **and** its tests, commit them together
2. Run the whole suite; on failure, fix and commit the fix as its own `fix:` commit
3. Verify functionally in a browser on the local environment: rendering,
   interactions, console errors, layout on the target viewport
4. Push only when both are green

**Rules**
- Never push code whose tests fail
- Never push code that was not functionally verified
- Each fix is **its own commit** — never amend the original

## Reading a failure before fixing it
A red test means one of three things. Tell them apart before touching anything:

1. **The code is wrong** → fix the code, keep the test
2. **The UI legitimately changed** (label renamed, text became an icon) → realign the
   test on the new behaviour, keep its original intent
3. **The test is flaky** → find the root cause; a timeout raised until it passes
   hides the bug instead of fixing it

Never weaken an assertion to get to green: no `.skip`, no deleted test, no
`expect(true).toBe(true)`, no assertion loosened to something that always passes.

## Known traps in this project
- **Responsive duplication**: pages render data twice — a mobile card (`md:hidden`)
  and a table row (`hidden md:table`). jsdom applies no media query, so both are in
  the DOM and `getByText` throws "Found multiple elements". Scope the query with
  `within(screen.getByRole('table'))`, or query by role.
- **Modal focus trap**: `Modal` focuses its own container from a
  `requestAnimationFrame`. If it fires mid-typing it steals focus and silently drops
  the remaining keystrokes, leaving the submit button disabled. Wait for the trap to
  settle before interacting.
- **`vi.clearAllMocks()` in `beforeEach`** wipes implementations set at `vi.mock()`
  declaration time. Re-arm them inside the `beforeEach`.
- **Mock every API the component calls from a timer** (debounced lookups, queries on
  open). An unmocked one rejects after the test ends and pollutes unrelated files.
- **SQLite hides schema defects.** It ignores decimal precision and accepts a
  `server_default` written as a string. Two real bugs surfaced only once the suite ran
  on MariaDB: `server_default="CURRENT_TIMESTAMP"` compiled to a quoted literal
  (`DEFAULT 'CURRENT_TIMESTAMP'`, error 1067), and a value of `15.0` overflowing
  `Numeric(5, 4)`. Use `server_default=func.now()`, never the string.
- **Commission rates are stored as a fraction**, not a percentage: `0.20` means 20%.
  The column is `Numeric(5, 4)`, so anything from 10 upwards is rejected by MariaDB.
