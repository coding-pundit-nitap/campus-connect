#!/usr/bin/env bash
# =============================================================================
# campus_connect — Critical Backup Script
# Backs up: PostgreSQL → MinIO → Redis
# Usage: ./backup.sh [--offsite]
# =============================================================================
set -euo pipefail
IFS=$'\n\t'

# ── Config ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../backup.env" 2>/dev/null || true

BACKUP_ROOT="${BACKUP_ROOT:-/home/campus_connect/campus-connect/backups}"
RETENTION_DAILY="${RETENTION_DAILY:-7}"
RETENTION_WEEKLY="${RETENTION_WEEKLY:-4}"
RETENTION_MONTHLY="${RETENTION_MONTHLY:-6}"
LOG_FILE="${LOG_FILE:-${SCRIPT_DIR}/../backup/backup.log}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DAY_OF_WEEK=$(date +%u)   # 1=Mon … 7=Sun
DAY_OF_MONTH=$(date +%d)

# Docker container names (must match your compose)
DB_CONTAINER="${DB_CONTAINER:-campus_connect_db}"
MINIO_CONTAINER="${MINIO_CONTAINER:-campus_connect_minio}"
REDIS_CONTAINER="${REDIS_CONTAINER:-campus_connect_redis}"
DOCKER_NETWORK="${DOCKER_NETWORK:-campus_connect_net}"

# Postgres creds
PG_USER="${POSTGRES_USER:-connect}"
PG_DB="${POSTGRES_DB:-campus_connect}"
PG_PASSWORD="${POSTGRES_PASSWORD:-}"

# MinIO creds
MINIO_URL="${MINIO_URL:-http://minio:9000}"
MINIO_USER="${MINIO_ROOT_USER:-}"
MINIO_PASS="${MINIO_ROOT_PASSWORD:-}"
MINIO_BUCKET="${NEXT_PUBLIC_MINIO_BUCKET:-campus-connect}"

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
ok()   { log "✅ $*"; }
warn() { log "⚠️  $*"; }
fail() { log "❌ $*"; exit 1; }

bytes_human() { numfmt --to=iec-i --suffix=B "$1" 2>/dev/null || echo "${1}B"; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

container_running() {
  docker ps --format '{{.Names}}' | grep -q "^${1}$"
}

# ── Determine backup tier ─────────────────────────────────────────────────────
if [[ "$DAY_OF_MONTH" == "01" ]]; then
  TIER="monthly"
elif [[ "$DAY_OF_WEEK" == "7" ]]; then
  TIER="weekly"
else
  TIER="daily"
fi

BACKUP_DIR="${BACKUP_ROOT}/${TIER}/${TIMESTAMP}"
OFFSITE=false
[[ "${1:-}" == "--offsite" || "${2:-}" == "--offsite" ]] && OFFSITE=true

# ── Pre-flight ────────────────────────────────────────────────────────────────
preflight() {
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "Campus Connect Backup — ${TIER^^} — ${TIMESTAMP}"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  require_cmd docker
  require_cmd gzip
  [[ "$OFFSITE" == "true" ]] && require_cmd rclone

  container_running "$DB_CONTAINER"    || fail "DB container not running: $DB_CONTAINER"
  container_running "$MINIO_CONTAINER" || fail "MinIO container not running: $MINIO_CONTAINER"
  container_running "$REDIS_CONTAINER" || fail "Redis container not running: $REDIS_CONTAINER"

  # Disk space check — need at least 2 GB free
  AVAIL=$(df -k "$BACKUP_ROOT" 2>/dev/null | awk 'NR==2{print $4}' || df -k "$HOME" | awk 'NR==2{print $4}')
  (( AVAIL > 2097152 )) || fail "Low disk space: $(bytes_human $((AVAIL*1024))) free"

  mkdir -p "$BACKUP_DIR"
  ok "Pre-flight passed → $BACKUP_DIR"
}

# ── 1. PostgreSQL ─────────────────────────────────────────────────────────────
backup_postgres() {
  log "── PostgreSQL dump …"
  local out="${BACKUP_DIR}/postgres_${PG_DB}_${TIMESTAMP}.sql.gz"

  docker exec -e PGPASSWORD="$PG_PASSWORD" "$DB_CONTAINER" \
    pg_dump -U "$PG_USER" --no-password \
            --format=custom \
            --compress=0 \
            "$PG_DB" \
  | gzip -9 > "$out" \
  || fail "PostgreSQL dump failed"

  local size
  size=$(stat -c%s "$out" 2>/dev/null || stat -f%z "$out")
  ok "PostgreSQL → $(bytes_human "$size") → $out"
}

# ── 2. MinIO (object storage) ─────────────────────────────────────────────────
backup_minio() {
  log "── MinIO sync …"
  local out="${BACKUP_DIR}/minio"
  mkdir -p "$out"

  docker run --rm \
    --network "${DOCKER_NETWORK}" \
    -v "${out}:/backup" \
    --entrypoint /bin/sh \
    minio/mc:latest \
    -c "mc alias set src '${MINIO_URL}' '${MINIO_USER}' '${MINIO_PASS}' --quiet && mc mirror --quiet src/${MINIO_BUCKET} /backup" \
  || fail "MinIO mirror failed"

  local count
  count=$(find "$out" -type f | wc -l)
  ok "MinIO → ${count} objects → $out"
}

# ── 3. Redis ──────────────────────────────────────────────────────────────────
backup_redis() {
  log "── Redis snapshot …"
  local out="${BACKUP_DIR}/redis_${TIMESTAMP}.rdb.gz"

  docker exec "$REDIS_CONTAINER" redis-cli BGSAVE >/dev/null
  sleep 2
  for i in $(seq 1 15); do
    status=$(docker exec "$REDIS_CONTAINER" redis-cli LASTSAVE)
    [[ "$status" -gt 0 ]] && break
    sleep 2
  done

  docker cp "${REDIS_CONTAINER}:/data/dump.rdb" - \
  | gzip -9 > "$out" \
  || fail "Redis backup failed"

  local size
  size=$(stat -c%s "$out" 2>/dev/null || stat -f%z "$out")
  ok "Redis → $(bytes_human "$size") → $out"
}

# ── 4. Write manifest ─────────────────────────────────────────────────────────
write_manifest() {
  local manifest="${BACKUP_DIR}/MANIFEST.txt"
  {
    echo "=============================="
    echo "Campus Connect Backup Manifest"
    echo "=============================="
    echo "Timestamp : ${TIMESTAMP}"
    echo "Tier      : ${TIER}"
    echo "Host      : $(hostname)"
    echo ""
    echo "Files:"
    find "$BACKUP_DIR" -type f | sort | while read -r f; do
      size=$(stat -c%s "$f" 2>/dev/null || stat -f%z "$f")
      printf "  %-60s %s\n" "$(basename "$f")" "$(bytes_human "$size")"
    done
    echo ""
    echo "Total: $(du -sh "$BACKUP_DIR" | cut -f1)"
  } > "$manifest"
  ok "Manifest written"
}

# ── 5. Retention cleanup ──────────────────────────────────────────────────────
cleanup_old_backups() {
  log "── Cleaning old backups …"
  mkdir -p "${BACKUP_ROOT}/daily" "${BACKUP_ROOT}/weekly" "${BACKUP_ROOT}/monthly"

  find "${BACKUP_ROOT}/daily" -maxdepth 1 -type d -name "2*" \
    | sort -r | tail -n +$(( RETENTION_DAILY + 1 )) \
    | xargs -r rm -rf
  ok "Kept last ${RETENTION_DAILY} daily backups"

  find "${BACKUP_ROOT}/weekly" -maxdepth 1 -type d -name "2*" \
    | sort -r | tail -n +$(( RETENTION_WEEKLY + 1 )) \
    | xargs -r rm -rf
  ok "Kept last ${RETENTION_WEEKLY} weekly backups"

  find "${BACKUP_ROOT}/monthly" -maxdepth 1 -type d -name "2*" \
    | sort -r | tail -n +$(( RETENTION_MONTHLY + 1 )) \
    | xargs -r rm -rf
  ok "Kept last ${RETENTION_MONTHLY} monthly backups"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  START=$(date +%s)

  preflight
  backup_postgres
  backup_minio
  backup_redis
  write_manifest
  cleanup_old_backups
  offsite_sync

  END=$(date +%s)
  ELAPSED=$(( END - START ))
  TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  ok "Backup complete in ${ELAPSED}s — ${TOTAL_SIZE} — ${BACKUP_DIR}"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

main "$@"