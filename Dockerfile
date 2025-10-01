# ==============================================================================
# ---- Dependencies Stage ----
# ==============================================================================
# This stage installs all dependencies (prod and dev) using pnpm.
# The resulting node_modules will be copied to the builder stage.
FROM node:24-alpine AS deps
WORKDIR /app

# Add security updates and essential packages, then clean up apk cache.
RUN apk add --no-cache libc6-compat openssl curl && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

# Enable and activate pnpm.
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only package manifests to leverage Docker cache.
COPY package.json pnpm-lock.yaml ./
# Install all dependencies.
RUN pnpm install --frozen-lockfile --ignore-scripts

# ==============================================================================
# ---- Development Stage ----
# ==============================================================================
# This is a minimal image for the development environment.
# It only contains the Node.js runtime and necessary tools.
# Application code and node_modules are mounted via volumes in docker-compose.
FROM node:24-alpine AS dev
WORKDIR /app

# Add essential packages for development.
RUN apk add --no-cache libc6-compat openssl && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

# Enable and activate pnpm.
RUN corepack enable && corepack prepare pnpm@latest --activate

# ==============================================================================
# ---- Builder Stage ----
# ==============================================================================
# This stage builds the Next.js application for production.
FROM node:24-alpine AS builder
WORKDIR /app

# Add essential packages for building.
RUN apk add --no-cache libc6-compat curl && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

# Enable and activate pnpm.
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from the 'deps' stage.
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application source code.
COPY . .

# Accept build arguments for Next.js public environment variables.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MINIO_ENDPOINT
ARG NEXT_PUBLIC_MINIO_BUCKET

# Set environment variables for the build process.
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MINIO_ENDPOINT=$NEXT_PUBLIC_MINIO_ENDPOINT
ENV NEXT_PUBLIC_MINIO_BUCKET=$NEXT_PUBLIC_MINIO_BUCKET

# Build the application.
RUN pnpm prisma generate
RUN pnpm build
# Remove development dependencies to reduce image size.
RUN pnpm prune --prod --ignore-scripts

# ==============================================================================
# ---- Runner Stage ----
# ==============================================================================
# This is the final, optimized production image with security hardening.
FROM node:24-alpine AS runner
WORKDIR /app

# Set production environment variables.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install only 'dumb-init' for signal handling and perform security cleanup.
RUN apk add --no-cache dumb-init && \
    apk upgrade && \
    rm -rf /var/cache/apk/* && \
    rm -rf /usr/share/man/* && \
    rm -rf /tmp/*

# Create a non-root system user and group for security.
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs --home /home/nextjs --shell /bin/false nextjs

# Create corepack cache directory with proper permissions for the non-root user.
RUN mkdir -p /home/nextjs/.cache/node/corepack && \
    chown -R nextjs:nodejs /home/nextjs/.cache

# Enable pnpm as root before switching user.
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built assets from the 'builder' stage with correct ownership.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --chown=nextjs:nodejs ./scripts/entrypoint.sh ./scripts/entrypoint.sh

# Set secure file permissions.
RUN find /app -type d -exec chmod 755 {} \; && \
    find /app -type f -exec chmod 644 {} \;

# Add execute permissions ONLY where necessary.
RUN chmod 555 /app/scripts/entrypoint.sh && \
    chmod +x /app/node_modules/.bin/* && \
    find /app/node_modules/.prisma/client -name "query_engine-*" -exec chmod +x {} \;

# Switch to the non-root user.
USER nextjs

# Expose the application port.
EXPOSE 3000

# Use dumb-init to properly handle process signals.
ENTRYPOINT ["dumb-init", "--"]

# Set the default command to run the application.
CMD ["./scripts/entrypoint.sh"]