#!/usr/bin/env bash
# =============================================================================
# campus_connect — Restore Script
# Usage:
#   ./restore.sh --list                          # list available backups
#   ./restore.sh --backup 20240115_020000        # restore specific timestamp
#   ./restore.sh --latest                        # restore most recent backup
#   ./restore.sh --latest --only postgres        # restore only postgres
#   ./restore.sh --latest --only minio
#   ./restore.sh --latest --only redis
#   ./restore.sh --dry-run --latest              # preview without restoring
# =============================================================================
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../backup.env" 2>/dev/null || true

BACKUP_ROOT="${BACKUP_ROOT:-/home/campus_connect/campus-connect/backups}"
DB_CONTAINER="${DB_CONTAINER:-campus_connect_db}"
MINIO_CONTAINER="${MINIO_CONTAINER:-campus_connect_minio}"
REDIS_CONTAINER="${REDIS_CONTAINER:-campus_connect_redis}"
DOCKER_NETWORK="${DOCKER_NETWORK:-campus_connect_net}"
PG_USER="${POSTGRES_USER:-connect}"
PG_DB="${POSTGRES_DB:-campus_connect}"
PG_PASSWORD="${POSTGRES_PASSWORD:-}"
MINIO_URL="${MINIO_URL:-http://minio:9000}"
MINIO_USER="${MINIO_ROOT_USER:-}"
MINIO_PASS="${MINIO_ROOT_PASSWORD:-}"
MINIO_BUCKET="${NEXT_PUBLIC_MINIO_BUCKET:-campus-connect}"

DRY_RUN=false
ONLY=""
BACKUP_TS=""
ACTION=""

log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
ok()   { log "✅ $*"; }
warn() { log "⚠️  $*"; }
fail() { log "❌ $*"; exit 1; }

# ── Parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --list)      ACTION="list" ;;
    --latest)    ACTION="restore"; BACKUP_TS="latest" ;;
    --backup)    ACTION="restore"; BACKUP_TS="${2:-}"; shift ;;
    --only)      ONLY="${2:-}"; shift ;;
    --dry-run)   DRY_RUN=true ;;
    *) fail "Unknown argument: $1" ;;
  esac
  shift
done

[[ -z "$ACTION" ]] && { echo "Usage: $0 --list | --latest | --backup TIMESTAMP [--only postgres|minio|redis] [--dry-run]"; exit 1; }

# ── List backups ──────────────────────────────────────────────────────────────
list_backups() {
  echo ""
  echo "Available backups in ${BACKUP_ROOT}:"
  echo "────────────────────────────────────────────────────────────"
  for tier in monthly weekly daily; do
    [[ -d "${BACKUP_ROOT}/${tier}" ]] || continue
    echo ""
    echo "  ${tier^^}:"
    find "${BACKUP_ROOT}/${tier}" -maxdepth 1 -type d -name "2*" | sort -r | while read -r d; do
      ts=$(basename "$d")
      size=$(du -sh "$d" | cut -f1)
      manifest="${d}/MANIFEST.txt"
      [[ -f "$manifest" ]] && echo "    📦 ${ts}  (${size})" || echo "    📦 ${ts}  (${size}) ⚠️ no manifest"
    done
  done
  echo ""
}

# ── Find backup dir ───────────────────────────────────────────────────────────
find_backup_dir() {
  if [[ "$BACKUP_TS" == "latest" ]]; then
    BACKUP_DIR=$(find "$BACKUP_ROOT" -maxdepth 2 -type d -name "2*" | sort -r | head -1)
    [[ -z "$BACKUP_DIR" ]] && fail "No backups found in $BACKUP_ROOT"
  else
    BACKUP_DIR=$(find "$BACKUP_ROOT" -maxdepth 2 -type d -name "${BACKUP_TS}" | head -1)
    [[ -z "$BACKUP_DIR" ]] && fail "Backup not found: $BACKUP_TS"
  fi
  log "Using backup: $BACKUP_DIR"
}

# ── Safety confirmation ───────────────────────────────────────────────────────
confirm() {
  if [[ "$DRY_RUN" == "true" ]]; then
    warn "DRY RUN — no changes will be made"
    return
  fi
  echo ""
  warn "⚠️  This will OVERWRITE live data!"
  warn "   Target: $(hostname)"
  warn "   Backup: $BACKUP_DIR"
  [[ -n "$ONLY" ]] && warn "   Scope : $ONLY only"
  echo ""
  read -rp "Type 'yes I am sure' to proceed: " answer
  [[ "$answer" == "yes I am sure" ]] || fail "Aborted"
}

# ── Restore PostgreSQL ────────────────────────────────────────────────────────
restore_postgres() {
  local dump_file
  dump_file=$(find "$BACKUP_DIR" -name "postgres_*.sql.gz" | head -1)
  [[ -z "$dump_file" ]] && fail "No postgres dump found in $BACKUP_DIR"

  log "── Restoring PostgreSQL from $(basename "$dump_file") …"

  if [[ "$DRY_RUN" == "true" ]]; then
    ok "DRY RUN: would restore $dump_file → ${DB_CONTAINER}:${PG_DB}"
    return
  fi

  log "   Stopping app containers …"
  docker stop campus_connect_app_prod   2>/dev/null || true
  docker stop campus_connect_app_dev    2>/dev/null || true
  docker stop campus_connect_worker_prod 2>/dev/null || true
  docker stop campus_connect_worker_dev  2>/dev/null || true

  # Terminate active connections
  docker exec -e PGPASSWORD="$PG_PASSWORD" "$DB_CONTAINER" \
    psql -U "$PG_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${PG_DB}' AND pid <> pg_backend_pid();" \
  || fail "Failed to terminate connections"

  # Drop database (must be separate — cannot run inside a transaction block)
  docker exec -e PGPASSWORD="$PG_PASSWORD" "$DB_CONTAINER" \
    psql -U "$PG_USER" -d postgres -c "DROP DATABASE IF EXISTS ${PG_DB};" \
  || fail "Failed to drop database"

  # Recreate database
  docker exec -e PGPASSWORD="$PG_PASSWORD" "$DB_CONTAINER" \
    psql -U "$PG_USER" -d postgres -c "CREATE DATABASE ${PG_DB} OWNER ${PG_USER};" \
  || fail "Failed to create database"

  # Restore
  zcat "$dump_file" \
  | docker exec -i -e PGPASSWORD="$PG_PASSWORD" "$DB_CONTAINER" \
    pg_restore -U "$PG_USER" -d "$PG_DB" --no-owner --role="$PG_USER" \
  || fail "pg_restore failed"

  ok "PostgreSQL restored ← $(basename "$dump_file")"

  log "   Restarting app containers …"
  docker start campus_connect_app_prod   2>/dev/null || true
  docker start campus_connect_worker_prod 2>/dev/null || true
}

# ── Restore MinIO ─────────────────────────────────────────────────────────────
restore_minio() {
  local minio_dir="${BACKUP_DIR}/minio"
  [[ -d "$minio_dir" ]] || fail "No minio backup found in $BACKUP_DIR"

  local count
  count=$(find "$minio_dir" -type f | wc -l)
  log "── Restoring MinIO (${count} objects) …"

  if [[ "$DRY_RUN" == "true" ]]; then
    ok "DRY RUN: would restore ${count} objects from $minio_dir → ${MINIO_BUCKET}"
    return
  fi

  docker run --rm \
    --network "${DOCKER_NETWORK}" \
    -v "${minio_dir}:/restore:ro" \
    --entrypoint /bin/sh \
    minio/mc:latest \
    -c "mc alias set dst '${MINIO_URL}' '${MINIO_USER}' '${MINIO_PASS}' --quiet && mc mb --ignore-existing dst/${MINIO_BUCKET} && mc mirror --quiet /restore dst/${MINIO_BUCKET}" \
  || fail "MinIO restore failed"

  ok "MinIO restored ← $minio_dir (${count} objects)"
}

# ── Restore Redis ─────────────────────────────────────────────────────────────
restore_redis() {
  local rdb_file
  rdb_file=$(find "$BACKUP_DIR" -name "redis_*.rdb.gz" | head -1)
  [[ -z "$rdb_file" ]] && fail "No redis backup found in $BACKUP_DIR"

  log "── Restoring Redis from $(basename "$rdb_file") …"

  if [[ "$DRY_RUN" == "true" ]]; then
    ok "DRY RUN: would restore $rdb_file → $REDIS_CONTAINER"
    return
  fi

  docker stop "$REDIS_CONTAINER" || fail "Could not stop Redis"

  REDIS_VOLUME=$(docker inspect "$REDIS_CONTAINER" \
    --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Source}}{{end}}{{end}}' 2>/dev/null || echo "")

  if [[ -n "$REDIS_VOLUME" ]]; then
    zcat "$rdb_file" > "${REDIS_VOLUME}/dump.rdb"
    ok "Redis RDB restored via volume mount"
  else
    zcat "$rdb_file" > /tmp/dump.rdb
    docker cp /tmp/dump.rdb "${REDIS_CONTAINER}:/data/dump.rdb"
    rm /tmp/dump.rdb
    ok "Redis RDB restored via docker cp"
  fi

  docker start "$REDIS_CONTAINER" || fail "Could not restart Redis"
  ok "Redis restored ← $(basename "$rdb_file")"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  if [[ "$ACTION" == "list" ]]; then
    list_backups
    exit 0
  fi

  find_backup_dir
  confirm

  log "════════════════════════════════════════════════════"
  log "Campus Connect Restore — $(date)"
  log "════════════════════════════════════════════════════"

  if [[ -z "$ONLY" || "$ONLY" == "postgres" ]]; then restore_postgres; fi
  if [[ -z "$ONLY" || "$ONLY" == "minio"    ]]; then restore_minio;    fi
  if [[ -z "$ONLY" || "$ONLY" == "redis"    ]]; then restore_redis;    fi

  if [[ "$DRY_RUN" == "true" ]]; then
    ok "DRY RUN complete — no data was modified"
  else
    ok "Restore complete ✓"
  fi
}

main "$@"