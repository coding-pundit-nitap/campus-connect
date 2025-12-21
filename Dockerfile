# ==============================================================================
# ---- Base Stage ----
# ==============================================================================
# This common stage prepares a Node.js environment with pnpm.
FROM node:25-alpine AS base
WORKDIR /app

# Add security updates, essential packages, and setup pnpm in a single layer.
RUN apk add --no-cache libc6-compat openssl curl dumb-init \
    && apk upgrade \
    && rm -rf /var/cache/apk/* \
    && rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg \
    && npm install -g corepack@latest \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

# ==============================================================================
# ---- Dependencies Stage ----
# ==============================================================================
# This stage installs all dependencies and generates Prisma client once.
FROM base AS deps
WORKDIR /app

ARG DATABASE_URL="postgresql://connect:invalidpassword@db:5432/campus_connect?schema=public&connection_limit=10&pgbouncer=true"
ENV DATABASE_URL=$DATABASE_URL
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts \
    && pnpm prisma generate

FROM base AS prod-deps
WORKDIR /app

ARG DATABASE_URL="postgresql://connect:invalidpassword@db:5432/campus_connect?schema=public&connection_limit=10&pgbouncer=true"
ENV DATABASE_URL=$DATABASE_URL
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts \
    && pnpm prisma generate

# ==============================================================================
# ---- Development Stage ----
# ==============================================================================
FROM deps AS dev
# Uses deps stage which already has node_modules and generated Prisma client.
# Code mounted via volumes in Compose.

# ==============================================================================
# ---- Builder Stage ----
# ==============================================================================
FROM base AS app-builder
ENV NODE_ENV=production

# Accept build arguments for Next.js public environment variables.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MINIO_ENDPOINT
ARG NEXT_PUBLIC_MINIO_BUCKET
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MINIO_ENDPOINT=$NEXT_PUBLIC_MINIO_ENDPOINT
ENV NEXT_PUBLIC_MINIO_BUCKET=$NEXT_PUBLIC_MINIO_BUCKET

# Copy node_modules with generated Prisma client from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma/generated ./prisma/generated
COPY . .
RUN pnpm build

FROM base AS worker-builder
ENV NODE_ENV=production

ARG DATABASE_URL="postgresql://connect:invalidpassword@db:5432/campus_connect?schema=public&connection_limit=10&pgbouncer=true"
ENV DATABASE_URL=$DATABASE_URL

# Copy node_modules with generated Prisma client from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma/generated ./prisma/generated
COPY . .
RUN pnpm build:worker

# ==============================================================================
# ---- Runner Stage ----
# ==============================================================================
# This is the final, optimized production image with security hardening.
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root system user and group for security.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs --home /home/nextjs --shell /bin/false nextjs \
    && mkdir -p /home/nextjs/.cache/node/corepack \
    && chown -R nextjs:nodejs /home/nextjs/.cache

# Copy standalone output (includes required node_modules)
COPY --from=app-builder /app/.next/standalone ./
COPY --from=app-builder /app/public ./public
COPY --from=app-builder /app/.next/static ./.next/static

# Create .next/cache for image optimization with proper ownership
RUN mkdir -p .next/cache \
    && chown -R nextjs:nodejs .next/cache \
    && chmod -R u=rwX,go=rX /app

USER nextjs
EXPOSE 3000

# Use dumb-init to properly handle process signals and run the app.
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]


# ==============================================================================
# ---- Worker Runner Stage ----
# ==============================================================================
FROM base AS worker-runner
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root system user for security.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs --home /home/worker --shell /bin/false worker

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=worker-builder /app/dist ./dist
COPY --from=worker-builder /app/prisma/generated ./prisma/generated

USER worker
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/workers/index.js"]

# ==============================================================================
# ---- Migrator Stage ----
# ==============================================================================
FROM base AS migrator
WORKDIR /app

# Create a non-root system user for security.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs --home /home/migrator --shell /bin/false migrator

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/prisma/generated ./prisma/generated
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

USER migrator
CMD ["pnpm", "prisma", "migrate", "deploy"]
