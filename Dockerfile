# ---- Dependencies ----
# Stage 1: Install dependencies
FROM node:24-alpine AS deps
WORKDIR /app

# Add security updates and remove unnecessary packages
RUN apk add --no-cache libc6-compat openssl && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# ---- Builder ----
# Stage 2: Build the application
FROM node:24-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .

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
RUN apk add --no-cache dumb-init && \
    apk upgrade && \
    rm -rf /var/cache/apk/* && \
    rm -rf /usr/share/man/* && \
    rm -rf /tmp/*

RUN corepack enable && corepack prepare pnpm@latest --activate

# Create system user with restricted permissions
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs --no-create-home --disabled-password nextjs

# Copy only production assets with proper ownership
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --chown=nextjs:nodejs entrypoint.sh ./

# Fix line endings and make executable
RUN sed -i 's/\r$//' ./entrypoint.sh && \
    chmod +x ./entrypoint.sh

# Remove write permissions from application files
RUN chmod -R 755 /app && \
    chmod -R 444 /app/node_modules && \
    chmod -R 444 /app/public && \
    chmod -R 444 /app/.next && \
    chmod 555 /app/entrypoint.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Use the entrypoint script
CMD ["./entrypoint.sh"]

