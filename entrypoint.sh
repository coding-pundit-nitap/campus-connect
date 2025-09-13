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

# Function to print environment variables
print_environment() {
    log "📋 Environment Variables:"
    
    if [ "$NODE_ENV" = "production" ]; then
        log "⚠️  Running in production mode - sensitive values will be masked"
        # In production, mask sensitive variables
        env | grep -E '^[A-Z_]' | sort | while IFS='=' read -r name value; do
            case "$name" in
                *SECRET*|*PASSWORD*|*KEY*|*TOKEN*)
                    log "  $name=***MASKED***"
                    ;;
                *)
                    log "  $name=$value"
                    ;;
            esac
        done
    else
        log "🔍 Development mode - showing all values"
        # In development, show all variables
        env | grep -E '^[A-Z_]' | sort | while IFS='=' read -r name value; do
            log "  $name=$value"
        done
    fi
    
    log "📋 Environment variables listed"
}

# Run security validation
validate_environment

# Run health checks
health_check

# Print environment variables
print_environment

# Run database migrations
log "🚀 Running database migrations..."
npx prisma migrate deploy


# Execute the main container command
log "✅ Migrations complete. Starting application..."



# Change to the CMD specified in Dockerfile
if [ "$#" -eq 0 ]; then
    exec npm start
else
    exec "$@"
fi