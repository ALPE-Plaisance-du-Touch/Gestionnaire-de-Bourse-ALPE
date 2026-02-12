#!/usr/bin/env bash
# =============================================================================
# Pre-edition snapshot backup for Bourse ALPE
# Run manually before starting a new edition event
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Creating pre-edition snapshot backup..."
"$SCRIPT_DIR/backup.sh" -x "pre-edition" "$@"
