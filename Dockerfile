# ==============================================================================
# ---- Base Stage ----
# ==============================================================================
# This common stage prepares a Node.js environment with pnpm.
FROM node:24-alpine AS base
WORKDIR /app

# Add security updates and essential packages, then clean up.
RUN apk add --no-cache libc6-compat openssl curl dumb-init && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

# Enable and activate pnpm.
RUN corepack enable && corepack prepare pnpm@latest --activate


# ==============================================================================
# ---- Dependencies Stage ----
# ==============================================================================
# This stage installs all dependencies (prod and dev).
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts


# ==============================================================================
# ---- Development Stage ----
# ==============================================================================
# This is a minimal image for development. Code is mounted via volumes.
FROM base AS dev
# No extra commands needed, inherits from base.


# ==============================================================================
# ---- Builder Stage ----
# ==============================================================================
# This stage builds the Next.js application for production.
FROM base AS builder
ENV NODE_ENV=production

# Copy dependencies from the 'deps' stage.
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application source code.
COPY . .

# Accept build arguments for Next.js public environment variables.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MINIO_ENDPOINT
ARG NEXT_PUBLIC_MINIO_BUCKET
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
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root system user and group for security.
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs --home /home/nextjs --shell /bin/false nextjs

# Create corepack cache directory with proper permissions for the non-root user.
RUN mkdir -p /home/nextjs/.cache/node/corepack && \
    chown -R nextjs:nodejs /home/nextjs/.cache

# Copy built assets from the 'builder' stage with correct ownership.
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --chown=nextjs:nodejs ./scripts/entrypoint.sh ./scripts/entrypoint.sh

# 1. Set a secure baseline for all files.
RUN chmod -R u=rwX,go=rX /app

# 2. Add execute permissions ONLY where necessary.
RUN chmod 555 /app/scripts/entrypoint.sh && \
    chmod +x /app/node_modules/.bin/* && \
    find /app/node_modules/.prisma/client -name "query_engine-*" -exec chmod +x {} \;

# Switch to the non-root user.
USER nextjs
EXPOSE 3000

# Use dumb-init to properly handle process signals and run the app.
ENTRYPOINT ["dumb-init", "--", "./scripts/entrypoint.sh"]
CMD ["node_modules/.bin/next", "start"]