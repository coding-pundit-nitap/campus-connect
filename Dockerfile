# ---- Dependencies ----
# Stage 1: Install dependencies
FROM node:24-alpine AS deps
WORKDIR /app

# Add security updates and remove unnecessary packages
RUN apk add --no-cache libc6-compat openssl curl && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- Builder ----
# Stage 2: Build the application
FROM node:24-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat curl && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MINIO_ENDPOINT
ARG NEXT_PUBLIC_MINIO_BUCKET

# Set environment variables for the build process
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MINIO_ENDPOINT=$NEXT_PUBLIC_MINIO_ENDPOINT
ENV NEXT_PUBLIC_MINIO_BUCKET=$NEXT_PUBLIC_MINIO_BUCKET

# Build the application
RUN pnpm prisma generate
RUN pnpm build
RUN pnpm prune --prod --ignore-scripts

# ---- Runner ----
# Stage 3: Production image with security hardening
FROM node:24-alpine AS runner
WORKDIR /app

# Security environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install security updates and remove unnecessary packages
RUN apk add --no-cache dumb-init curl && \
    apk upgrade && \
    rm -rf /var/cache/apk/* && \
    rm -rf /usr/share/man/* && \
    rm -rf /tmp/*

# Create system user with restricted permissions FIRST
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs --home /home/nextjs --shell /bin/false nextjs

# Create corepack cache directory with proper permissions
RUN mkdir -p /home/nextjs/.cache/node/corepack && \
    chown -R nextjs:nodejs /home/nextjs/.cache

# Enable corepack as root before switching users
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy only production assets with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# For standalone builds, copy the entire .next directory
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --chown=nextjs:nodejs entrypoint.sh ./

# Fix line endings and make executable
RUN sed -i 's/\r$//' ./entrypoint.sh && \
    chmod +x ./entrypoint.sh

RUN find /app -type d -exec chmod 755 {} \; && \
    find /app -type f -exec chmod 644 {} \;

# Add execute permissions ONLY where necessary
RUN chmod 555 /app/entrypoint.sh && \
    chmod +x /app/node_modules/.bin/* && \
    find /app/node_modules/.prisma/client -name "query_engine-*" -exec chmod +x {} \;


# Switch to non-root user - ENABLE THIS FOR PRODUCTION
USER nextjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Use the entrypoint script
CMD ["./entrypoint.sh"]