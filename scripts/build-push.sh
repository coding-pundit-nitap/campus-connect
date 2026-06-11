#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Load environment variables if available
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  # Export vars needed for build or configuration
  export $(grep -v '^#' .env | xargs)
fi

# Configuration with environment fallback or defaults
REGISTRY="${DOCKER_REGISTRY:-}"
TAG="${IMAGE_TAG:-latest}"
PUSH_IMAGES=true

# Parse args
for arg in "$@"; do
  case $arg in
    --no-push)
      PUSH_IMAGES=false
      shift
      ;;
    --registry=*)
      REGISTRY="${arg#*=}"
      shift
      ;;
    --tag=*)
      TAG="${arg#*=}"
      shift
      ;;
    *)
      # Unknown option
      ;;
  esac
done

if [ -z "$REGISTRY" ]; then
  # If we're not pushing and REGISTRY is empty, set a dummy registry for tag resolving
  if [ "$PUSH_IMAGES" = false ]; then
    REGISTRY="local-build"
  else
    echo "❌ Error: DOCKER_REGISTRY is not set. Specify it in .env or run with --registry=your-registry" >&2
    exit 1
  fi
fi

echo "=========================================================="
echo "🚀 Starting Campus Connect Local Build & Push Process"
echo "   Registry : $REGISTRY"
echo "   Tag      : $TAG"
echo "   Push     : $PUSH_IMAGES"
echo "=========================================================="

# Resolve build variables
MINIO_BUCKET="${NEXT_PUBLIC_MINIO_BUCKET:-campus-connect}"
MINIO_ENDPOINT="${NEXT_PUBLIC_MINIO_ENDPOINT:-http://localhost:9000}"
APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost}"

# Array of build targets and their output image names
# Format: "target_name:image_suffix"
SERVICES=(
  "migrator:campus-connect-migrator"
  "runner:campus-connect-app"
  "worker-runner:campus-connect-worker"
  "nginx-prod-image:campus-connect-nginx"
  "prometheus-prod-image:campus-connect-prometheus"
  "alertmanager-prod-image:campus-connect-alertmanager"
  "grafana-prod-image:campus-connect-grafana"
  "loki-prod-image:campus-connect-loki"
  "promtail-prod-image:campus-connect-promtail"
)

for service in "${SERVICES[@]}"; do
  TARGET="${service%%:*}"
  IMAGE_NAME="${service#*:}"
  FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"

  echo "📦 Building target '$TARGET' -> '$FULL_IMAGE_NAME'..."

  # Extra arguments for runner (Next.js app)
  BUILD_ARGS=()
  if [ "$TARGET" = "runner" ]; then
    BUILD_ARGS=(
      "--build-arg" "NEXT_PUBLIC_MINIO_BUCKET=$MINIO_BUCKET"
      "--build-arg" "NEXT_PUBLIC_MINIO_ENDPOINT=$MINIO_ENDPOINT"
      "--build-arg" "NEXT_PUBLIC_APP_URL=$APP_URL"
    )
  fi

  docker build \
    --target "$TARGET" \
    "${BUILD_ARGS[@]}" \
    -t "$FULL_IMAGE_NAME" \
    .

  if [ "$PUSH_IMAGES" = true ]; then
    echo "📤 Pushing '$FULL_IMAGE_NAME' to registry..."
    docker push "$FULL_IMAGE_NAME"
  fi
done

echo "🏁 Process complete! Images built successfully."
