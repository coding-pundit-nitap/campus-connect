FROM node:25-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl curl dumb-init \
    && apk upgrade \
    && rm -rf /var/cache/apk/* \
    && rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg \
    && npm install -g corepack@latest \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

FROM base AS deps
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL:-postgresql://placeholder}
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts \
    && pnpm prisma generate

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/src/generated ./src/generated
COPY --from=deps /app/workers/generated ./workers/generated
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts

# Development target
FROM deps AS dev

FROM base AS app-builder
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated
COPY . .
RUN pnpm build

FROM base AS worker-builder
ENV NODE_ENV=production


COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/workers/generated ./workers/generated
COPY . .
RUN pnpm build:worker

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs --home /home/nextjs --shell /bin/false nextjs \
    && mkdir -p /home/nextjs/.cache/node/corepack \
    && chown -R nextjs:nodejs /home/nextjs/.cache

COPY --from=app-builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=app-builder --chown=nextjs:nodejs /app/public ./public
COPY --from=app-builder --chown=nextjs:nodejs /app/.next/static ./.next/static

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

COPY --from=prod-deps --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=worker-builder --chown=worker:nodejs /app/dist ./dist
COPY --from=deps --chown=worker:nodejs /app/workers/generated ./workers/generated

USER worker
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/workers/index.js"]

FROM base AS migrator
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs --home /home/migrator --shell /bin/false migrator

COPY --from=prod-deps --chown=migrator:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=migrator:nodejs /app/src/generated ./src/generated
COPY --chown=migrator:nodejs package.json pnpm-lock.yaml ./
COPY --chown=migrator:nodejs prisma ./prisma
COPY --chown=migrator:nodejs prisma.config.ts ./prisma.config.ts

USER migrator
CMD ["pnpm", "prisma", "migrate", "deploy"]
