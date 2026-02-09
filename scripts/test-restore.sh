#!/usr/bin/env bash
# =============================================================================
# Automated restore test for Bourse ALPE
# Creates a temporary MariaDB container, backs up, restores, and verifies
# Run at least once per year (REQ-NF-012)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_CONTAINER="bourse-test-restore"
TEST_DB="bourse_test_restore"
TEST_PASSWORD="test_restore_pwd"
SOURCE_CONTAINER="bourse-db"
SOURCE_DB="bourse_alpe"
SOURCE_USER="root"
SOURCE_PASSWORD=""
TEMP_DIR=$(mktemp -d)
NETWORK="alpe-network"

cleanup() {
    echo ""
    echo "[CLEANUP] Removing temporary resources..."
    docker rm -f "$TEST_CONTAINER" 2>/dev/null || true
    rm -rf "$TEMP_DIR"
    echo "[CLEANUP] Done."
}
trap cleanup EXIT

usage() {
    echo "Usage: $0 -p <source-db-password> [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p PASSWORD     Source database root password (required)"
    echo "  -c CONTAINER    Source container name (default: bourse-db)"
    echo "  -n NAME         Source database name (default: bourse_alpe)"
    echo "  -h              Show this help"
    exit 1
}

while getopts "p:c:n:h" opt; do
    case $opt in
        p) SOURCE_PASSWORD="$OPTARG" ;;
        c) SOURCE_CONTAINER="$OPTARG" ;;
        n) SOURCE_DB="$OPTARG" ;;
        h) usage ;;
        *) usage ;;
    esac
done

if [ -z "$SOURCE_PASSWORD" ]; then
    echo "[ERROR] Source database password is required (-p)"
    usage
fi

echo "=============================================="
echo "  Bourse ALPE - Restore Test"
echo "=============================================="
echo ""

# Step 1: Create backup from source
echo "[1/5] Creating backup from source database..."
"$SCRIPT_DIR/backup.sh" \
    -c "$SOURCE_CONTAINER" \
    -d "$TEMP_DIR" \
    -u "$SOURCE_USER" \
    -p "$SOURCE_PASSWORD" \
    -n "$SOURCE_DB" \
    -x "test"

BACKUP_FILE=$(ls -t "$TEMP_DIR"/test-*.sql.gz | head -1)
echo "  Backup: $BACKUP_FILE"

# Step 2: Get source table info for comparison
echo ""
echo "[2/5] Collecting source database stats..."
SOURCE_TABLES=$(docker exec "$SOURCE_CONTAINER" mariadb \
    -u "$SOURCE_USER" \
    -p"$SOURCE_PASSWORD" \
    -N -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='${SOURCE_DB}';" 2>/dev/null)
echo "  Source tables: $SOURCE_TABLES"

# Step 3: Start temporary MariaDB container
echo ""
echo "[3/5] Starting temporary MariaDB container..."
docker run -d \
    --name "$TEST_CONTAINER" \
    -e MYSQL_ROOT_PASSWORD="$TEST_PASSWORD" \
    -e MYSQL_DATABASE="$TEST_DB" \
    mariadb:10.11 > /dev/null

# Wait for MariaDB to be ready
echo "  Waiting for MariaDB to start..."
for i in $(seq 1 30); do
    if docker exec "$TEST_CONTAINER" mariadb -u root -p"$TEST_PASSWORD" -e "SELECT 1" 2>/dev/null > /dev/null; then
        echo "  MariaDB ready after ${i}s"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "[ERROR] MariaDB failed to start within 30s"
        exit 1
    fi
    sleep 1
done

# Step 4: Restore into temporary container
echo ""
echo "[4/5] Restoring backup into test container..."
if gunzip -c "$BACKUP_FILE" | docker exec -i "$TEST_CONTAINER" mariadb \
    -u root \
    -p"$TEST_PASSWORD" \
    "$TEST_DB"; then
    echo "  Restore: OK"
else
    echo "[FAIL] Restore failed!"
    exit 1
fi

# Step 5: Verify
echo ""
echo "[5/5] Verifying restored database..."
RESTORED_TABLES=$(docker exec "$TEST_CONTAINER" mariadb \
    -u root \
    -p"$TEST_PASSWORD" \
    -N -e "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA='${TEST_DB}';" 2>/dev/null)

echo "  Source tables:   $SOURCE_TABLES"
echo "  Restored tables: $RESTORED_TABLES"

if [ "$SOURCE_TABLES" -eq "$RESTORED_TABLES" ]; then
    echo ""
    echo "=============================================="
    echo "  RESTORE TEST: PASSED"
    echo "=============================================="
    echo "  All $RESTORED_TABLES tables restored successfully."
    exit 0
else
    echo ""
    echo "=============================================="
    echo "  RESTORE TEST: FAILED"
    echo "=============================================="
    echo "  Table count mismatch!"
    exit 1
fi
