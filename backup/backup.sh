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

# ── Config & Env Loading ──────────────────────────────────────────────────────
load_env() {
  local env_file="$1"
  if [[ -f "$env_file" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      # Trim leading/trailing whitespace
      line="${line#"${line%%[![:space:]]*}"}"
      line="${line%"${line##*[![:space:]]}"}"

      # Skip comments and empty lines
      if [[ "$line" =~ ^# ]] || [[ -z "$line" ]]; then
        continue
      fi

      if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
        local key="${BASH_REMATCH[1]}"
        local val="${BASH_REMATCH[2]}"

        key="${key#"${key%%[![:space:]]*}"}"
        key="${key%"${key##*[![:space:]]}"}"
        val="${val#"${val%%[![:space:]]*}"}"
        val="${val%"${val##*[![:space:]]}"}"

        # If quoted, strip quotes
        if [[ "$val" =~ ^\"(.*)\"$ ]] || [[ "$val" =~ ^\'(.*)\'$ ]]; then
          val="${BASH_REMATCH[1]}"
        else
          # Strip inline comments for unquoted values (only if preceded by whitespace)
          if [[ "$val" =~ ^([^#]*)[[:space:]]+#.*$ ]]; then
            val="${BASH_REMATCH[1]}"
          fi
          val="${val#"${val%%[![:space:]]*}"}"
          val="${val%"${val##*[![:space:]]}"}"
        fi

        export "$key"="$val"
      fi
    done < "$env_file"
  fi
}

load_env "${SCRIPT_DIR}/../.env"

BACKUP_ROOT="${BACKUP_ROOT:-$HOME/backups/campus_connect}"
RETENTION_DAILY="${RETENTION_DAILY:-7}"
RETENTION_WEEKLY="${RETENTION_WEEKLY:-4}"
RETENTION_MONTHLY="${RETENTION_MONTHLY:-6}"
LOG_FILE="${LOG_FILE:-${SCRIPT_DIR}/backup.log}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DAY_OF_WEEK=$(date +%u)
DAY_OF_MONTH=$(date +%d)

# Ensure the log directory exists, fall back to SCRIPT_DIR if not writable
LOG_DIR="$(dirname "$LOG_FILE")"
if ! mkdir -p "$LOG_DIR" 2>/dev/null || [ ! -w "$LOG_DIR" ]; then
  LOG_FILE="${SCRIPT_DIR}/backup.log"
  LOG_DIR="${SCRIPT_DIR}"
  if ! mkdir -p "$LOG_DIR" 2>/dev/null || [ ! -w "$LOG_DIR" ]; then
    LOG_FILE="/tmp/backup.log"
    LOG_DIR="/tmp"
    if ! mkdir -p "$LOG_DIR" 2>/dev/null || [ ! -w "$LOG_DIR" ]; then
      LOG_FILE="/dev/null"
    fi
  fi
  if [[ "$LOG_FILE" != "/dev/null" ]]; then
    echo "⚠️ Warning: Configured log path not writable. Falling back to ${LOG_FILE}"
  fi
fi

# Dynamic container name discovery with hardcoded fallbacks
DB_CONTAINER="${DB_CONTAINER:-$(docker compose -f "${SCRIPT_DIR}/../compose.yml" ps db --format '{{.Names}}' 2>/dev/null | head -n 1)}"
DB_CONTAINER="${DB_CONTAINER:-campus_connect_db}"

MINIO_CONTAINER="${MINIO_CONTAINER:-$(docker compose -f "${SCRIPT_DIR}/../compose.yml" ps minio --format '{{.Names}}' 2>/dev/null | head -n 1)}"
MINIO_CONTAINER="${MINIO_CONTAINER:-campus_connect_minio}"

REDIS_CONTAINER="${REDIS_CONTAINER:-$(docker compose -f "${SCRIPT_DIR}/../compose.yml" ps redis --format '{{.Names}}' 2>/dev/null | head -n 1)}"
REDIS_CONTAINER="${REDIS_CONTAINER:-campus_connect_redis}"

# Postgres credentials mapping
PG_USER="${POSTGRES_USER:-connect}"
PG_DB="${POSTGRES_DB:-campus_connect}"
PG_PASSWORD="${POSTGRES_PASSWORD:-}"

# MinIO credentials mapping
MINIO_URL="${MINIO_URL:-${MINIO_ENDPOINT:-http://minio:9000}}"
MINIO_USER="${MINIO_ROOT_USER:-}"
MINIO_PASS="${MINIO_ROOT_PASSWORD:-}"
MINIO_BUCKET="${NEXT_PUBLIC_MINIO_BUCKET:-campus-connect}"

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE" || true; }
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

  # Verify if BACKUP_ROOT is writable, fall back if not
  if ! mkdir -p "$BACKUP_ROOT" 2>/dev/null || [ ! -w "$BACKUP_ROOT" ]; then
    local fallback="$HOME/backups/campus_connect"
    if [[ "$BACKUP_ROOT" != "$fallback" ]]; then
      warn "Configured BACKUP_ROOT ($BACKUP_ROOT) is not writable. Falling back to $fallback"
    fi
    BACKUP_ROOT="$fallback"
    if ! mkdir -p "$BACKUP_ROOT" 2>/dev/null || [ ! -w "$BACKUP_ROOT" ]; then
      fail "Backup root directory ($BACKUP_ROOT) is not writable and fallback failed"
    fi
  fi

  BACKUP_DIR="${BACKUP_ROOT}/${TIER}/${TIMESTAMP}"

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

  docker compose -f "${SCRIPT_DIR}/../compose.yml" run --rm \
    -v "${out}:/backup" \
    --entrypoint /bin/sh \
    create-buckets \
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

  # Fetch the timestamp of the last save before starting the BGSAVE
  local start_save
  start_save=$(docker exec "$REDIS_CONTAINER" redis-cli LASTSAVE 2>/dev/null | tr -d '\r\n')
  if [[ -z "$start_save" || ! "$start_save" =~ ^[0-9]+$ ]]; then
    start_save=0
  fi

  # Trigger BGSAVE
  docker exec "$REDIS_CONTAINER" redis-cli BGSAVE >/dev/null 2>&1 || true
  
  # Wait for LASTSAVE timestamp to increase, indicating BGSAVE has finished
  local current_save
  local save_success=false
  for i in $(seq 1 30); do
    sleep 1
    current_save=$(docker exec "$REDIS_CONTAINER" redis-cli LASTSAVE 2>/dev/null | tr -d '\r\n')
    if [[ -n "$current_save" && "$current_save" =~ ^[0-9]+$ && "$current_save" -gt "$start_save" ]]; then
      save_success=true
      break
    fi
  done

  if [ "$save_success" = false ]; then
    warn "Redis BGSAVE completion check timed out. Attempting to copy dump.rdb anyway."
  fi

  local temp_dir
  temp_dir=$(mktemp -d)
  trap 'rm -rf "$temp_dir"' RETURN EXIT
  docker cp "${REDIS_CONTAINER}:/data/dump.rdb" "${temp_dir}/dump.rdb" \
    && gzip -9 -c "${temp_dir}/dump.rdb" > "$out" \
    || fail "Redis backup failed"
  rm -rf "$temp_dir"
  trap - RETURN EXIT

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

# ── 6. Offsite sync ───────────────────────────────────────────────────────────
offsite_sync() {
  if [[ "$OFFSITE" != "true" ]]; then
    return 0
  fi

  log "── Offsite sync via rclone …"
  local remote="${OFFSITE_REMOTE:-gdrive:campus-connect-backups}"
  
  if ! rclone sync "$BACKUP_ROOT" "$remote" --fast-list; then
    warn "Offsite sync failed, but local backup was saved successfully"
  else
    ok "Offsite sync completed → $remote"
  fi
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