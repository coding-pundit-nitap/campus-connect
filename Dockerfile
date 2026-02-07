FROM node:25-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl curl dumb-init \
    && apk upgrade \
    && rm -rf /var/cache/apk/* \
    && rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg \
    && npm install -g corepack@latest \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

FROM base AS prisma-gen
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL:-postgresql://placeholder}
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile \
    && pnpm prisma generate


FROM base AS deps
WORKDIR /app

COPY --from=prisma-gen /app/src/generated ./src/generated
COPY --from=prisma-gen /app/workers/generated ./workers/generated
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

FROM base AS prod-deps
WORKDIR /app

COPY --from=prisma-gen /app/src/generated ./src/generated
COPY --from=prisma-gen /app/workers/generated ./workers/generated
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts

FROM deps AS dev

FROM base AS app-builder
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma-gen /app/src/generated ./src/generated
COPY . .
RUN pnpm build

FROM base AS worker-builder
ENV NODE_ENV=production


COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma-gen /app/workers/generated ./workers/generated
COPY . .
RUN pnpm build:worker

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs --home /home/nextjs --shell /bin/false nextjs \
    && mkdir -p /home/nextjs/.cache/node/corepack \
    && chown -R nextjs:nodejs /home/nextjs/.cache

# Copy standalone output (includes required node_modules)
COPY --from=app-builder /app/.next/standalone ./
COPY --from=app-builder /app/public ./public
COPY --from=app-builder /app/.next/static ./.next/static

RUN mkdir -p .next/cache \
    && chown -R nextjs:nodejs .next/cache \
    && chmod -R u=rwX,go=rX /app

USER nextjs
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]


FROM base AS worker-runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs --home /home/worker --shell /bin/false worker

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=worker-builder /app/dist ./dist
COPY --from=prisma-gen /app/workers/generated ./workers/generated

USER worker
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/workers/index.js"]

FROM base AS migrator
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs --home /home/migrator --shell /bin/false migrator

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prisma-gen /app/src/generated ./src/generated
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

USER migrator
CMD ["pnpm", "prisma", "migrate", "deploy"]
