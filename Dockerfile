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
# ---- Dependencies Stage ----
# ==============================================================================
# This stage installs all dependencies.
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

FROM base AS prod-deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts

# ==============================================================================
# ---- Development Stage ----
# ==============================================================================
FROM base AS dev
# Code mounted via volumes in Compose

# ==============================================================================
# ---- Builder Stage ----
# ==============================================================================
FROM base AS app-builder
ENV NODE_ENV=production

# Accept build arguments for Next.js public environment variables.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MINIO_ENDPOINT
ARG NEXT_PUBLIC_MINIO_BUCKET
ARG DATABASE_URL="postgresql://connect:invalidpassword@db:5432/campus_connect?schema=public&connection_limit=10&pgbouncer=true"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_MINIO_ENDPOINT=$NEXT_PUBLIC_MINIO_ENDPOINT
ENV NEXT_PUBLIC_MINIO_BUCKET=$NEXT_PUBLIC_MINIO_BUCKET
ENV DATABASE_URL=$DATABASE_URL

COPY --from=deps /app/node_modules ./node_modules

COPY . .
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN pnpm prisma generate
RUN pnpm build

FROM base AS worker-builder
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules

COPY . .
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

ARG DATABASE_URL="postgresql://connect:invalidpassword@db:5432/campus_connect?schema=public&connection_limit=10&pgbouncer=true"
ENV DATABASE_URL=$DATABASE_URL

RUN pnpm prisma generate
RUN pnpm build:worker

# ==============================================================================
# ---- Runner Stage ----
# ==============================================================================
# This is the final, optimized production image with security hardening.
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root system user and group for security.
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs --home /home/nextjs --shell /bin/false nextjs

# Create corepack cache directory with proper permissions for the non-root user.
RUN mkdir -p /home/nextjs/.cache/node/corepack && \
    chown -R nextjs:nodejs /home/nextjs/.cache

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=app-builder /app/.next/standalone ./
COPY --from=app-builder /app/public ./public
COPY --from=app-builder /app/.next/static ./.next/static

# Create .next/cache for image optimization with proper ownership
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next/cache

# Permissions
RUN chmod -R u=rwX,go=rX /app

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

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=worker-builder /app/dist ./dist

USER node
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/workers/index.js"]

FROM base AS migrator
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

ARG DATABASE_URL="postgresql://connect:invalidpassword@db:5432/campus_connect?schema=public&connection_limit=10&pgbouncer=true"
ENV DATABASE_URL=$DATABASE_URL

RUN pnpm prisma generate

CMD ["pnpm", "prisma", "migrate", "deploy"]
