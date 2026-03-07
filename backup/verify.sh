#!/usr/bin/env bash
# =============================================================================
# campus_connect — Backup Verification Script
# Tests integrity of backups WITHOUT restoring to production
# Usage: ./verify.sh [--latest | --backup TIMESTAMP]
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../backup.env" 2>/dev/null || true

BACKUP_ROOT="${BACKUP_ROOT:-/backups/campus_connect}"
PG_USER="${POSTGRES_USER:-connect}"
PG_DB="${POSTGRES_DB:-campus_connect}"
PG_PASSWORD="${POSTGRES_PASSWORD:-}"
BACKUP_TS="${1:-latest}"
PASS=0; FAIL=0

log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
ok()   { log "✅ PASS — $*"; (( PASS++ )); }
fail() { log "❌ FAIL — $*"; (( FAIL++ )); }

# ── Find backup ───────────────────────────────────────────────────────────────
if [[ "$BACKUP_TS" == "latest" || "$BACKUP_TS" == "--latest" ]]; then
  BACKUP_DIR=$(find "$BACKUP_ROOT" -maxdepth 2 -type d -name "2*" | sort -r | head -1)
else
  BACKUP_DIR=$(find "$BACKUP_ROOT" -maxdepth 2 -type d -name "${BACKUP_TS}" | head -1)
fi
[[ -z "$BACKUP_DIR" ]] && { log "❌ No backup found"; exit 1; }

log "Verifying: $BACKUP_DIR"
echo "────────────────────────────────────────────────────────────"

# ── 1. Manifest ───────────────────────────────────────────────────────────────
verify_manifest() {
  local manifest="${BACKUP_DIR}/MANIFEST.txt"
  if [[ -f "$manifest" ]]; then
    ok "Manifest exists"
    grep -q "Timestamp" "$manifest" && ok "Manifest has timestamp" || fail "Manifest missing timestamp"
  else
    fail "No MANIFEST.txt found"
  fi
}

# ── 2. PostgreSQL dump ────────────────────────────────────────────────────────
verify_postgres() {
  local dump_file
  dump_file=$(find "$BACKUP_DIR" -name "postgres_*.sql.gz" | head -1)

  [[ -z "$dump_file" ]] && { fail "No postgres dump file found"; return; }

  # Check file exists and is not empty
  local size
  size=$(stat -c%s "$dump_file" 2>/dev/null || stat -f%z "$dump_file")
  (( size > 1024 )) && ok "Postgres dump size OK ($(numfmt --to=iec-i --suffix=B "$size" 2>/dev/null || echo ${size}B))" \
                     || fail "Postgres dump too small: ${size} bytes"

  # Check gzip integrity
  gzip -t "$dump_file" 2>/dev/null \
    && ok "Postgres gzip integrity OK" \
    || fail "Postgres dump is corrupted (gzip check failed)"

  # Restore into a temporary test database
  log "   Testing pg_restore into temp DB …"
  local test_db="verify_${RANDOM}"

  # Create test DB and restore
  docker exec campus_connect_db \
    psql -U "$PG_USER" -c "CREATE DATABASE ${test_db};" >/dev/null 2>&1 && \
  zcat "$dump_file" | \
    docker exec -i campus_connect_db \
    pg_restore -U "$PG_USER" -d "$test_db" --no-owner 2>/dev/null && \
  TABLE_COUNT=$(docker exec campus_connect_db \
    psql -U "$PG_USER" -d "$test_db" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ') && \
  docker exec campus_connect_db \
    psql -U "$PG_USER" -c "DROP DATABASE ${test_db};" >/dev/null 2>&1

  if (( TABLE_COUNT > 0 )); then
    ok "Postgres restore test: ${TABLE_COUNT} tables found"
  else
    fail "Postgres restore test: no tables found"
  fi
}

# ── 3. MinIO objects ──────────────────────────────────────────────────────────
verify_minio() {
  local minio_dir="${BACKUP_DIR}/minio"

  [[ -d "$minio_dir" ]] || { fail "No minio backup directory found"; return; }

  local count
  count=$(find "$minio_dir" -type f | wc -l)
  (( count > 0 )) && ok "MinIO backup has ${count} objects" || fail "MinIO backup is empty"

  # Check a sample of files are readable
  local sample
  sample=$(find "$minio_dir" -type f | head -5)
  local bad=0
  while IFS= read -r f; do
    [[ -r "$f" && -s "$f" ]] || (( bad++ ))
  done <<< "$sample"
  (( bad == 0 )) && ok "MinIO sample files readable" || fail "${bad} unreadable MinIO files"
}

# ── 4. Redis RDB ──────────────────────────────────────────────────────────────
verify_redis() {
  local rdb_file
  rdb_file=$(find "$BACKUP_DIR" -name "redis_*.rdb.gz" | head -1)

  [[ -z "$rdb_file" ]] && { fail "No redis backup found"; return; }

  gzip -t "$rdb_file" 2>/dev/null \
    && ok "Redis gzip integrity OK" \
    || fail "Redis backup is corrupted (gzip check failed)"

  # Check RDB magic bytes (REDIS in header)
  local magic
  magic=$(zcat "$rdb_file" | head -c 5)
  [[ "$magic" == "REDIS" ]] \
    && ok "Redis RDB magic bytes valid" \
    || fail "Redis RDB magic bytes invalid — file may be corrupt"
}

# ── 5. Age check ──────────────────────────────────────────────────────────────
verify_age() {
  local max_age_hours=25  # alert if backup older than 25 hours
  local now
  now=$(date +%s)
  local dir_ts
  dir_ts=$(basename "$BACKUP_DIR" | sed 's/_/ /')
  local backup_epoch
  backup_epoch=$(date -d "${dir_ts}" +%s 2>/dev/null || date -j -f "%Y%m%d %H%M%S" "${dir_ts}" +%s 2>/dev/null || echo 0)
  local age_hours=$(( (now - backup_epoch) / 3600 ))

  (( age_hours < max_age_hours )) \
    && ok "Backup age: ${age_hours}h (under ${max_age_hours}h limit)" \
    || fail "Backup is ${age_hours}h old — may be stale"
}

# ── Summary ───────────────────────────────────────────────────────────────────
main() {
  verify_manifest
  verify_postgres
  verify_minio
  verify_redis
  verify_age

  echo "────────────────────────────────────────────────────────────"
  echo "Results: ${PASS} passed, ${FAIL} failed"
  (( FAIL == 0 )) && echo "🟢 Backup is VALID" || echo "🔴 Backup has ISSUES — do not rely on it"
  (( FAIL == 0 ))
}

main "$@"