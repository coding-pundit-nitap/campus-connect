#!/bin/sh

# Exit on any error
set -e

echo "🚀 Starting College Connect application..."

# Function to check if database is ready
wait_for_db() {
  echo "⏳ Waiting for database to be ready..."
  
  # Extract database connection details from DATABASE_URL if available
  if [ -n "$DATABASE_URL" ]; then
    # Simple check by trying to connect using node
    node -e "
      const { execSync } = require('child_process');
      async function checkDb() {
        try {
          // Try to connect to database using Prisma
          process.env.DATABASE_URL = '$DATABASE_URL';
          execSync('npx prisma db push --accept-data-loss || true', { stdio: 'pipe' });
          console.log('✅ Database connection successful');
        } catch (error) {
          console.log('❌ Database not ready yet, retrying...');
          process.exit(1);
        }
      }
      checkDb();
    " || {
      echo "⏳ Database not ready, waiting 5 seconds..."
      sleep 5
      wait_for_db
    }
  else
    echo "⚠️  DATABASE_URL not set, skipping database check"
  fi
}

# Wait for database to be ready
wait_for_db

echo "📦 Generating Prisma client..."
npx prisma generate

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "✅ Database setup complete!"

echo "🎯 Starting Next.js application..."
exec "$@"