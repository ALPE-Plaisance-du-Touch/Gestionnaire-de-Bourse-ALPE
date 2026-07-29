#!/usr/bin/env bash
#
# Version guard: every file carrying the version number must agree.
#
# Five values had drifted apart before this existed (pyproject 0.1.0, __init__ 0.1.0,
# main.py 1.0.0-rc hardcoded twice, package.json 0.0.0, 0.23 in the docs), which makes
# "the displayed version is the deployed version" impossible to trust.
#
# backend/app/__init__.py is the source of truth; pyproject.toml reads it dynamically
# via [tool.hatch.version] and is therefore not checked here.
#
# Exits non-zero with an actionable message on mismatch.

set -euo pipefail

cd "$(dirname "$0")/.."

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

# --- source of truth ---------------------------------------------------------
BACKEND_VERSION=$(
  grep -oE '__version__ = "[^"]+"' backend/app/__init__.py \
    | head -1 | sed 's/.*"\(.*\)"/\1/'
) || true

[ -n "${BACKEND_VERSION:-}" ] \
  || fail "could not read __version__ from backend/app/__init__.py"

# Semver, optionally with a pre-release suffix (1.2.3 or 1.2.3-beta.1).
if ! printf '%s' "$BACKEND_VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$'; then
  fail "backend/app/__init__.py: '$BACKEND_VERSION' is not a valid semver"
fi

# --- files that must agree ---------------------------------------------------
PKG_VERSION=$(node -p "require('./frontend/package.json').version")
LOCK_VERSION=$(node -p "require('./frontend/package-lock.json').version")
LOCK_ROOT_VERSION=$(node -p "require('./frontend/package-lock.json').packages[''].version")

status=0
check() {
  local label="$1" actual="$2"
  if [ "$actual" != "$BACKEND_VERSION" ]; then
    echo "MISMATCH: $label is '$actual', expected '$BACKEND_VERSION'" >&2
    status=1
  else
    echo "  ok  $label = $actual"
  fi
}

echo "Source of truth: backend/app/__init__.py = $BACKEND_VERSION"
check "frontend/package.json" "$PKG_VERSION"
check "frontend/package-lock.json (.version)" "$LOCK_VERSION"
check "frontend/package-lock.json (.packages[''])" "$LOCK_ROOT_VERSION"

if [ "$status" -ne 0 ]; then
  cat >&2 <<EOF

To fix: set the same version everywhere, starting from the source of truth.
  1. edit backend/app/__init__.py       (the version everything else follows)
  2. edit frontend/package.json
  3. cd frontend && npm install --package-lock-only   (updates the lockfile)
EOF
  exit 1
fi

echo "All version files agree on $BACKEND_VERSION"
