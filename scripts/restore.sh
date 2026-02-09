#!/usr/bin/env bash
# =============================================================================
# Database restore script for Bourse ALPE
# Restores a MariaDB backup from a .sql.gz file
# RTO target: < 4 hours (REQ-NF-012)
# =============================================================================
set -euo pipefail

# Defaults
CONTAINER="bourse-db"
DB_USER="root"
DB_PASSWORD=""
DB_NAME="bourse_alpe"
AUTO_CONFIRM=false

usage() {
    echo "Usage: $0 [OPTIONS] <backup-file.sql.gz>"
    echo ""
    echo "Options:"
    echo "  -c CONTAINER    Docker container name (default: bourse-db)"
    echo "  -u USER         Database user (default: root)"
    echo "  -p PASSWORD     Database password"
    echo "  -n NAME         Database name (default: bourse_alpe)"
    echo "  --yes           Skip confirmation prompt"
    echo "  -h              Show this help"
    exit 1
}

# Parse options
while [[ $# -gt 0 ]]; do
    case $1 in
        -c) CONTAINER="$2"; shift 2 ;;
        -u) DB_USER="$2"; shift 2 ;;
        -p) DB_PASSWORD="$2"; shift 2 ;;
        -n) DB_NAME="$2"; shift 2 ;;
        --yes) AUTO_CONFIRM=true; shift ;;
        -h) usage ;;
        -*) echo "Unknown option: $1"; usage ;;
        *) BACKUP_FILE="$1"; shift ;;
    esac
done

# Validate arguments
if [ -z "${BACKUP_FILE:-}" ]; then
    echo "[ERROR] Backup file path is required"
    usage
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "[ERROR] Backup file not found: $BACKUP_FILE"
    exit 1
fi

if [ -z "$DB_PASSWORD" ]; then
    echo "[ERROR] Database password is required (-p)"
    exit 1
fi

echo "=============================================="
echo "  Bourse ALPE - Database Restore"
echo "=============================================="
echo "  File:      $BACKUP_FILE"
echo "  Container: $CONTAINER"
echo "  Database:  $DB_NAME"
echo "  User:      $DB_USER"
echo "=============================================="

# Step 1: Verify backup integrity
echo ""
echo "[1/4] Verifying backup integrity..."
if ! gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    echo "[ERROR] Backup file is corrupted or not a valid gzip file!"
    exit 1
fi
echo "  Integrity check: OK"

# Step 2: Confirmation
if [ "$AUTO_CONFIRM" = false ]; then
    echo ""
    echo "WARNING: This will REPLACE all data in database '$DB_NAME'."
    read -rp "Are you sure you want to proceed? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Restore cancelled."
        exit 0
    fi
fi

# Step 3: Restore
echo ""
echo "[2/4] Restoring database..."
START_TIME=$(date +%s)

if gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER" mariadb \
    -u "$DB_USER" \
    -p"$DB_PASSWORD" \
    "$DB_NAME"; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    echo "  Restore complete in ${DURATION}s"
else
    echo "[ERROR] Restore failed!"
    exit 1
fi

# Step 4: Post-restore verification
echo ""
echo "[3/4] Verifying restored database..."
TABLE_COUNT=$(docker exec "$CONTAINER" mariadb \
    -u "$DB_USER" \
    -p"$DB_PASSWORD" \
    -N -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='${DB_NAME}';" 2>/dev/null)

echo "  Tables found: $TABLE_COUNT"

if [ "$TABLE_COUNT" -eq 0 ]; then
    echo "[ERROR] No tables found after restore - something went wrong!"
    exit 1
fi

# List tables
echo "  Tables:"
docker exec "$CONTAINER" mariadb \
    -u "$DB_USER" \
    -p"$DB_PASSWORD" \
    -N -e "SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA='${DB_NAME}' ORDER BY TABLE_NAME;" 2>/dev/null | \
    while IFS=$'\t' read -r name rows; do
        printf "    %-30s %s rows\n" "$name" "$rows"
    done

echo ""
echo "[4/4] Restore successful!"
echo "  Duration: ${DURATION}s"
echo "  Tables: $TABLE_COUNT"
