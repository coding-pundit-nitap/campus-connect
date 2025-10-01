# College Connect - Nginx Reverse Proxy Setup

This document explains how to run the College Connect application with Nginx as a reverse proxy in both development and production environments.

## Overview

The application now uses Nginx as a reverse proxy to handle all incoming traffic and route it to the appropriate backend services:

- **Application**: Next.js app running on port 3000 (internal)
- **MinIO S3 API**: Object storage API on port 9000 (proxied)
- **MinIO Console**: Web interface on port 9001 (proxied)
- **PostgreSQL**: Database on port 5432 (direct access for development)
- **Nginx**: Reverse proxy on port 80 (main entry point)

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │────│    Nginx    │────│  Next.js    │
│             │    │   Port 80   │    │  Port 3000  │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ├────────────────────┐
                          │                    │
                   ┌─────────────┐    ┌─────────────┐
                   │    MinIO    │    │ PostgreSQL  │
                   │ Ports 9000  │    │  Port 5432  │
                   │      9001   │    │             │
                   └─────────────┘    └─────────────┘
```

## Environment Variables

### Development Environment (`.env.local`)

```bash
# NextAuth Configuration
AUTH_SECRET="your-super-secret-for-auth"
AUTH_URL="http://localhost"

# Database Configuration
DATABASE_URL="postgresql://myuser:mypassword@db:5432/college_connect"
DIRECT_URL="postgresql://myuser:mypassword@db:5432/college_connect"

# MinIO S3-Compatible Storage
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
NEXT_PUBLIC_MINIO_BUCKET=college-connect
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1

# MinIO Endpoints
MINIO_ENDPOINT="http://minio:9000"                    # Internal service-to-service
NEXT_PUBLIC_MINIO_ENDPOINT="http://localhost:9000"    # Browser access via Nginx

# Application Configuration
NEXT_PUBLIC_API_URL="/api"
```

### Production Environment (`.env.production`)

```bash
# NextAuth Configuration - CHANGE THESE!
AUTH_SECRET="CHANGE-THIS-TO-A-SECURE-64-CHARACTER-SECRET"
AUTH_URL="http://localhost"  # Change to your domain with HTTPS

# Database Configuration
DATABASE_URL="postgresql://myuser:mypassword@db:5432/college_connect"
DIRECT_URL="postgresql://myuser:mypassword@db:5432/college_connect"

# MinIO S3-Compatible Storage - CHANGE THESE!
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=changeme123
NEXT_PUBLIC_MINIO_BUCKET=college-connect
AWS_ACCESS_KEY_ID=admin
AWS_SECRET_ACCESS_KEY=changeme123
AWS_REGION=us-east-1

# MinIO Endpoints
MINIO_ENDPOINT="http://minio:9000"                    # Internal service-to-service
NEXT_PUBLIC_MINIO_ENDPOINT="http://localhost:9000"    # Browser access via Nginx

# Application Configuration
NEXT_PUBLIC_API_URL="/api"
```

## Quick Start

### Development with Nginx

1. **Copy environment file:**

   ```bash
   cp .env.development .env.local
   ```

2. **Start development environment:**

   ```bash
   pnpm docker:dev:up
   ```

3. **Access the application:**
   - Main App: http://localhost
   - MinIO Console: http://localhost:9001
   - Nginx Health: http://localhost:8080/nginx-health

### Production with Nginx

1. **Copy and configure environment file:**

   ```bash
   cp .env.production .env.production
   # Edit .env.production and change all default passwords!
   ```

2. **Build and start production environment:**

   ```bash
   pnpm docker:prod:build
   pnpm docker:prod:up
   ```

3. **Access the application:**
   - Main App: http://localhost
   - MinIO Console: http://localhost:9001
   - Nginx Health: http://localhost:8080/nginx-health

## Detailed Setup Instructions

### Prerequisites

- Docker and Docker Compose
- pnpm (for running scripts)

### Environment Setup

1. **Create Development Environment File:**

   ```bash
   cp .env.development .env.local
   ```

2. **Create Production Environment File:**

   ```bash
   cp .env.production .env.production
   ```

3. **Configure Production Secrets:**

   ```bash
   # Generate a secure AUTH_SECRET
   openssl rand -base64 32

   # Update .env.production with:
   # - Strong AUTH_SECRET (64+ characters)
   # - Secure MINIO_ROOT_PASSWORD
   # - Your domain in AUTH_URL (with HTTPS in real deployment)
   ```

### Development Workflow

1. **Start all services:**

   ```bash
   pnpm docker:dev:up
   ```

2. **View logs:**

   ```bash
   # All services
   pnpm docker:dev:logs

   # App only
   pnpm docker:dev:logs-app

   # Nginx only
   pnpm docker:dev:logs-nginx
   ```

3. **Stop services:**
   ```bash
   pnpm docker:dev:down
   ```

### Production Deployment

1. **Build images:**

   ```bash
   pnpm docker:prod:build
   ```

2. **Start services:**

   ```bash
   pnpm docker:prod:up
   ```

3. **Monitor logs:**
   ```bash
   pnpm docker:prod:logs
   ```

## Health Checks and Monitoring

### Health Check Endpoints

- **Nginx Health**: `http://localhost:8080/nginx-health`
- **App Health**: `http://localhost:8080/health/app` (proxied)
- **MinIO Health**: `http://localhost:8080/health/minio` (proxied)
- **Direct App Health**: `http://localhost/api/health/status`

### Service Dependencies

The services start in this order:

1. PostgreSQL
2. MinIO
3. MinIO bucket creation
4. Next.js application
5. Nginx (after app is healthy)

### Monitoring Commands

```bash
# Check service status
docker-compose ps

# Check service health
docker-compose exec nginx-dev curl -f http://localhost:8080/nginx-health
docker-compose exec nginx-dev curl -f http://localhost:8080/health/app
docker-compose exec nginx-dev curl -f http://localhost:8080/health/minio

# View real-time logs
docker-compose logs -f nginx-dev
docker-compose logs -f app-dev
```

### Clean Reset

To completely reset the environment:

```bash
# Stop all services
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Rebuild from scratch
pnpm docker:dev:build
pnpm docker:dev:up
```

## Security Considerations

### Development Environment

- Uses default credentials (acceptable for local development)
- HTTP endpoints (acceptable for localhost)
- Relaxed rate limiting
- Basic security headers

### Production Environment

⚠️ **CRITICAL SECURITY REQUIREMENTS:**

1. **Change All Default Passwords:**
   - `AUTH_SECRET`: Use 64+ character random string
   - `MINIO_ROOT_PASSWORD`: Use strong password
   - `POSTGRES_PASSWORD`: Use strong password (if exposed)

2. **Use HTTPS in Real Production:**
   - Update `AUTH_URL` to use `https://`
   - Configure SSL certificates in Nginx
   - Update `NEXT_PUBLIC_MINIO_ENDPOINT` to use `https://`

3. **Network Security:**
   - Don't expose PostgreSQL port in production
   - Use Docker networks for internal communication
   - Configure firewall rules appropriately

4. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use secrets management for production
   - Regularly rotate credentials

## Additional Scripts

The following npm scripts are available:

```bash
# Development
pnpm docker:dev:build       # Build dev containers
pnpm docker:dev:up          # Start dev environment
pnpm docker:dev:down        # Stop dev environment
pnpm docker:dev:logs        # View all dev logs
pnpm docker:dev:logs-app    # View app logs only
pnpm docker:dev:logs-nginx  # View nginx logs only

# Production
pnpm docker:prod:build      # Build prod containers
pnpm docker:prod:up         # Start prod environment
pnpm docker:prod:down       # Stop prod environment
pnpm docker:prod:logs       # View all prod logs
pnpm docker:prod:logs-app   # View app logs only
pnpm docker:prod:logs-nginx # View nginx logs only

# Utilities
pnpm docker:db:logs         # View database logs
pnpm docker:db:psql         # Connect to PostgreSQL
pnpm docker:prune           # Clean up Docker resources
```
