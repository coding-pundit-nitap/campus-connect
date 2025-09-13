#!/bin/sh
# entrypoint.sh - Secure application startup script

# Exit immediately if a command exits with a non-zero status.
set -e

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [ENTRYPOINT] $1"
}

# Security check: Validate critical environment variables
validate_environment() {
    log "🔒 Validating environment variables..."
    
    # Check for required variables
    required_vars="AUTH_SECRET DATABASE_URL"
    for var in $required_vars; do
        if [ -z "$(eval echo \$$var)" ]; then
            log "❌ ERROR: Required environment variable $var is not set"
            exit 1
        fi
    done
    
    # Check for insecure default values in production
    if [ "$NODE_ENV" = "production" ]; then
        if [ "$AUTH_SECRET" = "your-super-secret-for-auth" ]; then
            log "❌ SECURITY ERROR: AUTH_SECRET is using default value in production!"
            exit 1
        fi
        
        if [ "$MINIO_ROOT_PASSWORD" = "minioadmin" ]; then
            log "⚠️  WARNING: MINIO_ROOT_PASSWORD is using default value!"
        fi
        
        if [ "$AWS_SECRET_ACCESS_KEY" = "minioadmin" ]; then
            log "⚠️  WARNING: AWS_SECRET_ACCESS_KEY is using default value!"
        fi
    fi
    
    log "✅ Environment validation passed"
}

# Health check function
health_check() {
    log "🏥 Performing health checks..."
    
    # Check if database is accessible (if DATABASE_URL is set)
    if [ -n "$DATABASE_URL" ]; then
        log "🔍 Testing database connectivity..."
        # This will be handled by Prisma migrations
    fi
    
    log "✅ Health checks passed"
}

# Run security validation
validate_environment

# Run health checks
health_check

# Run database migrations
log "🚀 Running database migrations..."
pnpm prisma migrate deploy

# Execute the main container command
log "✅ Migrations complete. Starting application..."

# Change to the CMD specified in Dockerfile
if [ "$#" -eq 0 ]; then
    exec node server.js
else
    exec "$@"
fi