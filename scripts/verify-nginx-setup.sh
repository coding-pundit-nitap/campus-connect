#!/bin/bash
# verify-nginx-setup.sh - Script to verify Nginx reverse proxy setup

set -e

echo "🔍 College Connect - Nginx Setup Verification"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
check_docker() {
    log_info "Checking Docker availability..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        exit 1
    fi
    
    log_success "Docker is available and running"
}

# Check if required files exist
check_files() {
    log_info "Checking required configuration files..."
    
    local files=(
        "nginx/nginx.conf"
        "nginx/conf.d/dev.conf"
        "nginx/conf.d/prod.conf"
        "nginx/Dockerfile"
        "docker-compose.yml"
        ".env.development"
        ".env.production"
        "DOC.md"
    )
    
    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            log_success "Found: $file"
        else
            log_error "Missing: $file"
            exit 1
        fi
    done
}

# Test Docker Compose configuration
test_compose_config() {
    log_info "Testing Docker Compose configuration..."
    
    if [[ ! -f ".env" ]]; then
        log_warning "Creating .env file from .env.example for testing..."
        cp .env.example .env
    fi
    
    if docker compose config > /dev/null 2>&1; then
        log_success "Docker Compose configuration is valid"
    else
        log_error "Docker Compose configuration has errors"
        docker compose config
        exit 1
    fi
}

# Test Nginx configuration syntax
test_nginx_config() {
    log_info "Testing Nginx configuration syntax..."
    
    # Create a test upstream configuration
    cat > /tmp/nginx-test-upstream.conf << 'EOF'
upstream app_test {
    server 127.0.0.1:3000;
}

upstream minio_api_test {
    server 127.0.0.1:9000;
}

server {
    listen 80;
    server_name localhost;
    
    location / {
        proxy_pass http://app_test;
        proxy_set_header Host $host;
    }
}
EOF
    
    if docker run --rm \
        -v "$PWD/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" \
        -v "/tmp/nginx-test-upstream.conf:/etc/nginx/conf.d/default.conf:ro" \
        nginx:1.25-alpine nginx -t > /dev/null 2>&1; then
        log_success "Nginx configuration syntax is valid"
    else
        log_error "Nginx configuration has syntax errors"
        docker run --rm \
            -v "$PWD/nginx/nginx.conf:/etc/nginx/nginx.conf:ro" \
            -v "/tmp/nginx-test-upstream.conf:/etc/nginx/conf.d/default.conf:ro" \
            nginx:1.25-alpine nginx -t
        exit 1
    fi
    
    # Clean up
    rm -f /tmp/nginx-test-upstream.conf
}

# Check environment file setup
check_env_files() {
    log_info "Checking environment file setup..."
    
    if [[ -f ".env.local" ]]; then
        log_success "Development environment file (.env.local) exists"
        
        # Check for critical variables
        if grep -q "NEXT_PUBLIC_MINIO_ENDPOINT.*localhost:9000" .env.local; then
            log_success "MinIO endpoint correctly configured for Nginx proxy"
        else
            log_warning "MinIO endpoint may not be configured for Nginx proxy"
        fi
    else
        log_warning "Development environment file (.env.local) not found"
        log_info "Run: cp .env.development .env.local"
    fi
    
    if [[ -f ".env.production" ]]; then
        log_success "Production environment file exists"
        
        # Check for default passwords
        if grep -q "CHANGE-THIS" .env.production; then
            log_warning "Production environment still contains default values"
            log_info "Please update .env.production with secure credentials"
        fi
    else
        log_warning "Production environment file not found"
        log_info "Run: cp .env.production .env.production"
    fi
}

# Display summary and next steps
show_summary() {
    echo ""
    echo "🎉 Verification Complete!"
    echo "========================"
    echo ""
    echo -e "${GREEN}Your Nginx reverse proxy setup is ready!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start development environment:"
    echo "   pnpm docker:dev:up"
    echo ""
    echo "2. Access your application:"
    echo "   • Main App: http://localhost"
    echo "   • MinIO Console: http://localhost:9001"
    echo "   • Health Check: http://localhost:8080/nginx-health"
    echo ""
    echo "3. For production setup, see DOC.md"
    echo ""
    echo "4. Test file upload functionality through the UI"
    echo ""
}

# Main verification flow
main() {
    echo ""
    check_docker
    echo ""
    check_files
    echo ""
    test_compose_config
    echo ""
    test_nginx_config
    echo ""
    check_env_files
    echo ""
    show_summary
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi