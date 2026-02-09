#!/usr/bin/env bash
# =============================================================================
# Setup cron job for daily database backup at 3:00 AM
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"
LOG_FILE="/var/log/bourse-backup.log"

if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "ERROR: backup.sh not found at $BACKUP_SCRIPT"
    exit 1
fi

# Prompt for DB password if not set
if [ -z "${DB_PASSWORD:-}" ]; then
    read -rsp "Enter database root password: " DB_PASSWORD
    echo
fi

CRON_CMD="0 3 * * * ${BACKUP_SCRIPT} -p '${DB_PASSWORD}' >> ${LOG_FILE} 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -qF "$BACKUP_SCRIPT"; then
    echo "Cron job for backup already exists. Replacing..."
    crontab -l | grep -vF "$BACKUP_SCRIPT" | crontab -
fi

# Add cron job
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

echo "Cron job installed:"
echo "  Schedule: Daily at 3:00 AM"
echo "  Script:   $BACKUP_SCRIPT"
echo "  Log:      $LOG_FILE"
echo ""
echo "Verify with: crontab -l"
