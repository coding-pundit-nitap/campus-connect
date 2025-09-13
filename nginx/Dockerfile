FROM nginx:1.25-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy configuration files
# These will be mounted as volumes from docker-compose.yml