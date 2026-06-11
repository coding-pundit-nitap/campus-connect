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

# Group & Service Filtering Configuration
BUILD_APP=true
BUILD_MONITORING=true
HAS_POSITIONAL=false
REQUESTED_SERVICES=()

# Parse args
for arg in "$@"; do
  case $arg in
    --no-push)
      PUSH_IMAGES=false
      ;;
    --registry=*)
      REGISTRY="${arg#*=}"
      ;;
    --tag=*)
      TAG="${arg#*=}"
      ;;
    app)
      HAS_POSITIONAL=true
      BUILD_APP=true
      ;;
    monitoring)
      HAS_POSITIONAL=true
      BUILD_MONITORING=true
      ;;
    *)
      # If it's not a flag (starts with --), it's a specific service/alias request
      if [[ "$arg" != --* ]]; then
        HAS_POSITIONAL=true
        REQUESTED_SERVICES+=("$arg")
      fi
      ;;
  esac
done

# If positional arguments were specified, reset default groups
if [ "$HAS_POSITIONAL" = true ]; then
  # Only build app group if explicitly requested
  if [[ " ${*} " != *" app "* ]]; then
    BUILD_APP=false
  fi
  # Only build monitoring group if explicitly requested
  if [[ " ${*} " != *" monitoring "* ]]; then
    BUILD_MONITORING=false
  fi
fi

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
if [ "$HAS_POSITIONAL" = true ]; then
  echo "   Filters  : app=$BUILD_APP, monitoring=$BUILD_MONITORING, services=[${REQUESTED_SERVICES[*]:-}]"
else
  echo "   Filters  : Build all (no filters)"
fi
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

  # Filtering Logic
  if [ "$HAS_POSITIONAL" = true ]; then
    SHOULD_BUILD=false

    # Check if app group is requested
    if [ "$BUILD_APP" = true ] && [[ "$TARGET" =~ ^(migrator|runner|worker-runner)$ ]]; then
      SHOULD_BUILD=true
    fi

    # Check if monitoring group is requested
    if [ "$BUILD_MONITORING" = true ] && [[ ! "$TARGET" =~ ^(migrator|runner|worker-runner)$ ]]; then
      SHOULD_BUILD=true
    fi

    # Check for specific service names or aliases (like 'nginx', 'prometheus', etc.)
    for req in "${REQUESTED_SERVICES[@]}"; do
      if [ "$req" = "$TARGET" ] || [ "$req" = "$IMAGE_NAME" ] || [[ "$IMAGE_NAME" == *"$req"* ]]; then
        SHOULD_BUILD=true
      fi
    done

    if [ "$SHOULD_BUILD" = false ]; then
      echo "⏭️ Skipping '$TARGET' (does not match filters)"
      continue
    fi
  fi

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

echo "🏁 Process complete! Selected images built successfully."
