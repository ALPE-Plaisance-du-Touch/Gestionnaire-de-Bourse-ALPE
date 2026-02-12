#!/usr/bin/env bash
# =============================================================================
# Daily backup script for Bourse ALPE MariaDB database
# Supports retention policy: 30 days rolling + 1st of month kept 12 months
# =============================================================================
set -euo pipefail

# Defaults
CONTAINER="bourse-db"
BACKUP_DIR="./backups"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="bourse_alpe"
PREFIX="backup"
RETENTION_DAYS=30
MONTHLY_RETENTION_DAYS=365

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -c CONTAINER    Docker container name (default: bourse-db)"
    echo "  -d DIR          Backup directory (default: ./backups)"
    echo "  -u USER         Database user (default: root)"
    echo "  -p PASSWORD     Database password"
    echo "  -n NAME         Database name (default: bourse_alpe)"
    echo "  -x PREFIX       Backup file prefix (default: backup)"
    echo "  -h              Show this help"
    exit 1
}

while getopts "c:d:u:p:n:x:h" opt; do
    case $opt in
        c) CONTAINER="$OPTARG" ;;
        d) BACKUP_DIR="$OPTARG" ;;
        u) DB_USER="$OPTARG" ;;
        p) DB_PASSWORD="$OPTARG" ;;
        n) DB_NAME="$OPTARG" ;;
        x) PREFIX="$OPTARG" ;;
        h) usage ;;
        *) usage ;;
    esac
done

# Validate password
if [ -z "$DB_PASSWORD" ]; then
    echo "[ERROR] Database password is required (-p)"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate filename
TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
FILENAME="${PREFIX}-${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "[$(date -Iseconds)] Starting backup of ${DB_NAME} from ${CONTAINER}..."

# Execute dump
if docker exec "$CONTAINER" mariadb-dump \
    -u "$DB_USER" \
    -p"$DB_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    "$DB_NAME" | gzip > "$FILEPATH"; then

    SIZE=$(du -h "$FILEPATH" | cut -f1)
    echo "[$(date -Iseconds)] Backup complete: ${FILEPATH} (${SIZE})"
else
    echo "[$(date -Iseconds)] ERROR: Backup failed!"
    rm -f "$FILEPATH"
    exit 1
fi

# Verify backup integrity
if ! gunzip -t "$FILEPATH" 2>/dev/null; then
    echo "[$(date -Iseconds)] ERROR: Backup file is corrupted!"
    exit 1
fi

echo "[$(date -Iseconds)] Integrity check passed."

# --- Retention policy ---
# Delete daily backups older than 30 days, except 1st of month
echo "[$(date -Iseconds)] Applying retention policy..."

find "$BACKUP_DIR" -name "${PREFIX}-*.sql.gz" -type f -mtime +"$RETENTION_DAYS" | while read -r file; do
    # Extract date from filename (PREFIX-YYYY-MM-DD_HHmmss.sql.gz)
    basename=$(basename "$file")
    file_day=$(echo "$basename" | grep -oP '\d{4}-\d{2}-\K\d{2}')

    if [ "$file_day" = "01" ]; then
        # Keep 1st of month backups for 12 months
        age_days=$(( ($(date +%s) - $(date -r "$file" +%s)) / 86400 ))
        if [ "$age_days" -gt "$MONTHLY_RETENTION_DAYS" ]; then
            echo "  Removing old monthly backup: $basename"
            rm -f "$file"
        else
            echo "  Keeping monthly backup: $basename"
        fi
    else
        echo "  Removing old daily backup: $basename"
        rm -f "$file"
    fi
done

echo "[$(date -Iseconds)] Backup process complete."
