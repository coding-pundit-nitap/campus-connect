#!/bin/sh
# entrypoint.sh

# Run the database migration
echo "Running database migrations..."
pnpm prisma migrate deploy

# Execute the main container command (the one specified in CMD)
exec "$@"