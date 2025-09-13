#!/bin/bash
# test-minio-upload.sh - Specific test for MinIO upload functionality with Nginx

set -e

echo "🧪 Testing MinIO Upload Functionality with Nginx Proxy"
echo "====================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to test if containers are running
test_containers() {
    log_info "Checking if Docker containers are running..."
    
    local containers=("college_connect_nginx_dev" "college_connect_app_dev" "college_connect_minio")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            log_success "Container running: $container"
        else
            log_error "Container not running: $container"
            echo ""
            log_info "Start the development environment with:"
            echo "  pnpm docker:dev:up"
            echo ""
            exit 1
        fi
    done
}

# Test Nginx health check
test_nginx_health() {
    log_info "Testing Nginx health check..."
    
    if curl -f -s http://localhost:8080/nginx-health > /dev/null; then
        log_success "Nginx health check passed"
    else
        log_error "Nginx health check failed"
        log_info "Check if Nginx container is running and healthy"
        exit 1
    fi
}

# Test MinIO API through Nginx proxy
test_minio_api() {
    log_info "Testing MinIO API through Nginx proxy..."
    
    # Test MinIO health endpoint through proxy
    if curl -f -s http://localhost:9000/minio/health/live > /dev/null; then
        log_success "MinIO API accessible through Nginx proxy (port 9000)"
    else
        log_error "MinIO API not accessible through Nginx proxy"
        log_info "Check if MinIO container is running and Nginx is proxying correctly"
        exit 1
    fi
}

# Test presigned URL generation
test_presigned_url() {
    log_info "Testing presigned URL generation..."
    
    # Create a test request to the upload API
    local response=$(curl -s -X POST http://localhost/api/upload \
        -H "Content-Type: application/json" \
        -d '{
            "fileName": "test.txt",
            "fileType": "text/plain", 
            "fileSize": 100
        }' || echo "CURL_FAILED")
    
    if [[ "$response" == "CURL_FAILED" ]]; then
        log_error "Could not reach upload API endpoint"
        log_info "Make sure the app is running and accessible at http://localhost"
        return 1
    fi
    
    # Check if the response contains a presigned URL
    if echo "$response" | grep -q "uploadUrl"; then
        log_success "Upload API is responding"
        
        # Extract and validate the URL
        local upload_url=$(echo "$response" | grep -o '"uploadUrl":"[^"]*"' | cut -d'"' -f4)
        if [[ "$upload_url" =~ localhost:9000 ]]; then
            log_success "Presigned URL correctly points to localhost:9000 (Nginx proxy)"
            echo "  URL host: $(echo "$upload_url" | cut -d'/' -f3)"
        else
            log_error "Presigned URL does not point to localhost:9000"
            echo "  URL: $upload_url"
            log_info "This indicates the NEXT_PUBLIC_MINIO_ENDPOINT is misconfigured"
        fi
    else
        # Check if it's an auth error (which is expected without authentication)
        if echo "$response" | grep -q "Unauthorized"; then
            log_warning "Upload API requires authentication (this is normal)"
            log_info "To test with authentication, log in through the UI first"
        else
            log_error "Upload API returned unexpected response:"
            echo "$response"
        fi
    fi
}

# Test actual file upload (if possible)
test_file_upload() {
    log_info "Testing actual file upload..."
    
    # Create a temporary test file
    local test_file="/tmp/nginx-test-upload.txt"
    echo "Test upload via Nginx proxy $(date)" > "$test_file"
    
    # This would require authentication, so we just test the endpoint accessibility
    log_info "File upload test requires authentication - testing endpoint availability"
    
    # Test if we can reach the MinIO server for direct upload
    local test_response=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:9000/ || echo "000")
    
    if [[ "$test_response" =~ ^[23] ]]; then
        log_success "MinIO server reachable for file uploads"
    else
        log_error "MinIO server not reachable (HTTP $test_response)"
    fi
    
    # Clean up
    rm -f "$test_file"
}

# Check environment configuration
check_env_config() {
    log_info "Checking environment configuration..."
    
    if [[ -f ".env.local" ]]; then
        if grep -q "NEXT_PUBLIC_MINIO_ENDPOINT.*localhost:9000" .env.local; then
            log_success "NEXT_PUBLIC_MINIO_ENDPOINT correctly set to localhost:9000"
        else
            log_error "NEXT_PUBLIC_MINIO_ENDPOINT not set to localhost:9000"
            log_info "Please update .env.local with:"
            echo '  NEXT_PUBLIC_MINIO_ENDPOINT="http://localhost:9000"'
        fi
        
        if grep -q "MINIO_ENDPOINT.*minio:9000" .env.local; then
            log_success "MINIO_ENDPOINT correctly set to internal Docker service"
        else
            log_error "MINIO_ENDPOINT not set to minio:9000"
            log_info "Please update .env.local with:"
            echo '  MINIO_ENDPOINT="http://minio:9000"'
        fi
    else
        log_warning ".env.local not found"
        log_info "Please copy the development environment file:"
        echo "  cp .env.development .env.local"
    fi
}

# Show troubleshooting information
show_troubleshooting() {
    echo ""
    echo "🔧 Troubleshooting Tips"
    echo "======================"
    echo ""
    echo "If MinIO uploads are not working:"
    echo ""
    echo "1. Verify environment configuration:"
    echo "   • NEXT_PUBLIC_MINIO_ENDPOINT=\"http://localhost:9000\""
    echo "   • MINIO_ENDPOINT=\"http://minio:9000\""
    echo ""
    echo "2. Restart the development environment:"
    echo "   docker compose --profile dev down"
    echo "   docker compose --profile dev up -d"
    echo ""
    echo "3. Check container logs:"
    echo "   docker logs college_connect_nginx_dev"
    echo "   docker logs college_connect_minio"
    echo "   docker logs college_connect_app_dev"
    echo ""
    echo "4. Test file upload through the UI:"
    echo "   • Go to http://localhost"
    echo "   • Log in to the application"
    echo "   • Try uploading a file through any upload interface"
    echo ""
    echo "5. If you see CORS errors or connection issues:"
    echo "   • Make sure both MINIO_ENDPOINT and NEXT_PUBLIC_MINIO_ENDPOINT are correctly set"
    echo "   • The dual client approach should handle the proxy correctly"
    echo ""
    echo "6. For manual Nginx setup (without Docker Compose):"
    echo "   • Use the nginx configuration from nginx/conf.d/dev.conf"
    echo "   • Make sure MinIO is accessible at localhost:9000 through the proxy"
    echo "   • Set NEXT_PUBLIC_MINIO_ENDPOINT to your proxy URL"
    echo ""
}

# Main test flow
main() {
    echo ""
    test_containers
    echo ""
    test_nginx_health
    echo ""
    test_minio_api
    echo ""
    check_env_config
    echo ""
    test_presigned_url
    echo ""
    test_file_upload
    echo ""
    
    log_success "MinIO upload test completed!"
    show_troubleshooting
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi