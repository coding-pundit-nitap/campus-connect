#!/bin/sh
# entrypoint.sh

# Exit immediately if a command exits with a non-zero status.
set -e

echo "✅ Entrypoint script started."

echo "🚀 Starting Next.js application..."
# Execute the main container command (the one specified in CMD of the Dockerfile)
exec "$@"