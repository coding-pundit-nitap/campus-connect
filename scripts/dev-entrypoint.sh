#!/bin/sh
set -e

# This script is for the development environment.
# It runs Prisma migrations only when the Prisma client is not generated.

PRISMA_CLIENT_DIR="/app/node_modules/.prisma/client"

if [ ! -d "$PRISMA_CLIENT_DIR" ]; then
  echo "🚀 Prisma client not found. Running migrations..."
  pnpm prisma migrate dev
  echo "✅ Migrations finished."
else
  echo "✅ Prisma client found. Skipping migrations."
fi

echo "🚀 Starting Next.js development server..."
# Execute the main container command (pnpm dev)
exec "$@"
