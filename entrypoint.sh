#!/bin/sh
# entrypoint.sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run database migrations
echo "🚀 Running database migrations..."
pnpm prisma migrate deploy

# Execute the main container command (CMD)
echo "✅ Migrations complete. Starting application..."
exec "$@"