# ==============================================================================
# ---- Base Stage ----
# ==============================================================================
# This common stage prepares a Node.js environment with pnpm.
FROM node:25-alpine AS base
WORKDIR /app

# Add security updates and essential packages, then clean up.
RUN apk add --no-cache libc6-compat openssl curl dumb-init && \
    apk upgrade && \
    rm -rf /var/cache/apk/*

# Enable and activate pnpm.
RUN rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg \
    && npm install -g corepack@latest \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

# ==============================================================================
# ---- Dependencies Stage (Install ALL deps) ----
# ==============================================================================
# This stage installs all dependencies (prod and dev).
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# ==============================================================================
# ---- Production Dependencies Stage (Prune for Runner) ----
# ==============================================================================
FROM base AS prod-deps
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
RUN pnpm prune --prod --ignore-scripts

# ==============================================================================
# ---- Development Stage ----
# ==============================================================================
FROM base AS dev
# Code mounted via volumes in Compose

# ==============================================================================
# ---- Builder Stage (Build App + Keep DevTools for Migrator) ----
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
ARG DATABASE_URL="postgresql://connect:mypassword@db:5432/campus_connect?schema=public&connection_limit=10&pgbouncer=true"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MINIO_ENDPOINT=$NEXT_PUBLIC_MINIO_ENDPOINT
ENV NEXT_PUBLIC_MINIO_BUCKET=$NEXT_PUBLIC_MINIO_BUCKET
ENV DATABASE_URL=$DATABASE_URL

# Build the application.
RUN pnpm prisma generate
RUN pnpm build

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

# 1. Copy Pruned Node Modules (from prod-deps stage)
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# 2. Copy App Build (from builder stage)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# 3. Copy Scripts & Configs
COPY --chown=nextjs:nodejs ./scripts/entrypoint.sh ./scripts/entrypoint.sh
COPY --chown=nextjs:nodejs ./scripts/start-worker.ts ./scripts/start-worker.ts
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

# Permissions
RUN chmod -R u=rwX,go=rX /app
RUN chmod 555 /app/scripts/entrypoint.sh && \
    chmod +x /app/node_modules/.bin/* && \
    find /app/node_modules/.prisma/client -name "query_engine-*" -exec chmod +x {} \;

USER nextjs
EXPOSE 3000

# Use dumb-init to properly handle process signals and run the app.
ENTRYPOINT ["dumb-init", "--", "./scripts/entrypoint.sh"]
CMD ["node_modules/.bin/next", "start"]