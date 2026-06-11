#!/usr/bin/env bash
# =============================================================================
# campus_connect — Backup Verification Script
# Tests integrity of backups WITHOUT restoring to production
# Usage: ./verify.sh [--latest | --backup TIMESTAMP]
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../backup.env" 2>/dev/null || true

BACKUP_ROOT="${BACKUP_ROOT:-$HOME/backups/campus_connect}"
DB_CONTAINER="${DB_CONTAINER:-campus_connect_db}"
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

  local size
  size=$(stat -c%s "$dump_file" 2>/dev/null || stat -f%z "$dump_file")
  if (( size > 1024 )); then
    ok "Postgres dump size OK ($(numfmt --to=iec-i --suffix=B "$size" 2>/dev/null || echo ${size}B))"
  else
    fail "Postgres dump too small: ${size} bytes"
  fi

  if gzip -t "$dump_file" 2>/dev/null; then
    ok "Postgres gzip integrity OK"
  else
    fail "Postgres dump is corrupted (gzip check failed)"
  fi

  log "   Testing pg_restore into temp DB …"
  local test_db="verify_${RANDOM}"
  local restore_success=false
  local table_count=0

  # Ensure database is dropped even if restore fails
  if docker exec -e PGPASSWORD="$PG_PASSWORD" "$DB_CONTAINER" psql -U "$PG_USER" -d postgres -c "CREATE DATABASE ${test_db};" >/dev/null 2>&1; then
    
    # Attempt restore (capture exit code safely)
    if zcat "$dump_file" | docker exec -i -e PGPASSWORD="$PG_PASSWORD" "$DB_CONTAINER" pg_restore -U "$PG_USER" -d "$test_db" --no-owner 2>/dev/null; then
      restore_success=true
      # Fetch table count
      local query_res
      query_res=$(docker exec -e PGPASSWORD="$PG_PASSWORD" "$DB_CONTAINER" psql -U "$PG_USER" -d "$test_db" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ' || echo "0")
      if [[ "$query_res" =~ ^[0-9]+$ ]]; then
        table_count="$query_res"
      fi
    fi
    
    # Always clean up the temp database
    docker exec -e PGPASSWORD="$PG_PASSWORD" "$DB_CONTAINER" psql -U "$PG_USER" -d postgres -c "DROP DATABASE IF EXISTS ${test_db};" >/dev/null 2>&1 || true
  fi

  if [ "$restore_success" = true ] && (( table_count > 0 )); then
    ok "Postgres restore test: ${table_count} tables found"
  else
    fail "Postgres restore test failed (restored success: $restore_success, table count: $table_count)"
  fi
}

# ── 3. MinIO objects ──────────────────────────────────────────────────────────
verify_minio() {
  local minio_dir="${BACKUP_DIR}/minio"

  [[ -d "$minio_dir" ]] || { fail "No minio backup directory found"; return; }

  local count
  count=$(find "$minio_dir" -type f | wc -l)
  (( count > 0 )) && ok "MinIO backup has ${count} objects" || fail "MinIO backup is empty"

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

  if gzip -t "$rdb_file" 2>/dev/null; then
    ok "Redis gzip integrity OK"
  else
    fail "Redis backup is corrupted (gzip check failed)"
  fi

  local magic
  magic=$(zcat "$rdb_file" 2>/dev/null | head -c 5 || echo "")
  [[ "$magic" == "REDIS" ]] \
    && ok "Redis RDB magic bytes valid" \
    || fail "Redis RDB magic bytes invalid — file may be corrupt"
}

# ── 5. Age check ──────────────────────────────────────────────────────────────
verify_age() {
  local max_age_hours=25
  local now
  now=$(date +%s)
  
  local ts
  ts=$(basename "$BACKUP_DIR")
  
  # Format timestamp: YYYYMMDD_HHMMSS -> YYYY-MM-DD HH:MM:SS
  local formatted_ts="${ts:0:4}-${ts:4:2}-${ts:6:2} ${ts:9:2}:${ts:11:2}:${ts:13:2}"
  
  local backup_epoch
  backup_epoch=$(date -d "${formatted_ts}" +%s 2>/dev/null || echo 0)
  
  # Fallback: if date parsing fails (e.g. on BusyBox date), use directory modification time
  if (( backup_epoch == 0 )); then
    backup_epoch=$(stat -c%Y "$BACKUP_DIR" 2>/dev/null || stat -f%m "$BACKUP_DIR" 2>/dev/null || echo 0)
  fi

  local age_hours=0
  if (( backup_epoch > 0 )); then
    age_hours=$(( (now - backup_epoch) / 3600 ))
  fi

  if (( age_hours < max_age_hours && backup_epoch > 0 )); then
    ok "Backup age: ${age_hours}h (under ${max_age_hours}h limit)"
  else
    fail "Backup is stale or timestamp invalid: ${age_hours}h old (epoch: $backup_epoch)"
  fi
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