echo "Running database migrations..."
pnpm prisma migrate deploy

exec "$@"