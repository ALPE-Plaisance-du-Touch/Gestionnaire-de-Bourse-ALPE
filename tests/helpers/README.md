# Test Helpers

Helper procedures for MCP Chrome DevTools E2E test scenarios.

These are **not executable scripts** — they are step-by-step instructions
for Claude Code to follow when running tests via Chrome DevTools MCP.

## Files

| File | Purpose |
|------|---------|
| `mcp-actions.md` | Reusable MCP action sequences (login, create edition, etc.) |

## Data Files

All test fixtures are in `tests/data/`:

```
tests/data/
├── users/accounts.json         # 8 test user profiles
├── valid/
│   ├── editions.json           # Edition fixtures (active, draft, closed...)
│   ├── deposit_slots.json      # Deposit slot configurations
│   ├── articles.json           # 10 valid article types
│   ├── invitations.json        # Invitation fixtures + bulk CSV content
│   ├── sales.json              # Sale fixtures (cash, card, check)
│   ├── payouts.json            # Payout fixtures + expected calculations
│   └── billetweb_e2e.csv       # Valid Billetweb import file (5 rows)
└── invalid/
    ├── auth.json               # Invalid auth data (wrong pw, XSS, SQL injection...)
    ├── articles.json           # Invalid articles (price, forbidden, lots...)
    ├── editions.json           # Invalid editions (dates, duplicate name...)
    └── billetweb_malformed.csv # Malformed CSV for G-E01
```
