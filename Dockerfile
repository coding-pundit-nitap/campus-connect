FROM node:24-alpine AS base
WORKDIR /app

# Add security updates and essential packages, then clean up.
RUN apk add --no-cache libc6-compat openssl curl dumb-init

# Enable and activate pnpm.
RUN rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg \
    && npm install -g corepack@latest \
    && corepack enable \
    && corepack prepare pnpm@latest --activate

# This stage installs all dependencies.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod=false --ignore-scripts

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Install ONLY production dependencies
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Development target
FROM deps AS dev

FROM base AS app-builder
ENV NODE_ENV=production
ARG NEXT_PUBLIC_MINIO_BUCKET=campus-connect
ARG NEXT_PUBLIC_MINIO_ENDPOINT=http://localhost:9000
ARG NEXT_PUBLIC_APP_URL=http://localhost
ENV NEXT_PUBLIC_MINIO_BUCKET=${NEXT_PUBLIC_MINIO_BUCKET}
ENV NEXT_PUBLIC_MINIO_ENDPOINT=${NEXT_PUBLIC_MINIO_ENDPOINT}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL="postgresql://user:pass@db:5432/dbname?schema=public&connection_limit=5&pool_timeout=30"
ENV DATABASE_URL=$DATABASE_URL
# Generate Prisma client and build the application.
RUN pnpm exec prisma generate
RUN pnpm build

FROM base AS worker-builder
ENV NODE_ENV=production


COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DATABASE_URL="postgresql://user:pass@db:5432/dbname?schema=public&connection_limit=5&pool_timeout=30"
ENV DATABASE_URL=$DATABASE_URL
# Generate Prisma client and build the application.
RUN pnpm exec prisma generate
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
COPY --from=worker-builder --chown=worker:nodejs /app/workers/generated ./workers/generated

USER worker
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/workers/index.js"]

FROM base AS migrator
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs --home /home/migrator --shell /bin/false migrator

COPY --from=deps --chown=migrator:nodejs /app/node_modules ./node_modules
COPY --from=app-builder --chown=migrator:nodejs /app/src/generated ./src/generated
COPY --chown=migrator:nodejs package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=migrator:nodejs prisma ./prisma
COPY --chown=migrator:nodejs prisma.config.ts ./prisma.config.ts

USER migrator
CMD ["npx", "prisma", "migrate", "deploy"]


FROM nginx:1.29-alpine AS nginx-prod-image
COPY ./nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./nginx/conf.d/prod.conf /etc/nginx/conf.d/default.conf

FROM prom/prometheus:v3.9.1 AS prometheus-prod-image
COPY ./monitoring/prometheus/prometheus.yml /etc/prometheus/prometheus.yml
COPY ./monitoring/prometheus/rules.yml /etc/prometheus/rules.yml

FROM prom/alertmanager:v0.28.1 AS alertmanager-prod-image
COPY ./monitoring/alertmanager/alertmanager.yml.template /etc/alertmanager/alertmanager.yml.template
COPY ./monitoring/alertmanager/alertmanager-entrypoint.sh /alertmanager-entrypoint.sh
USER root
RUN chmod +x /alertmanager-entrypoint.sh \
    && chown -R nobody:nobody /etc/alertmanager
USER nobody

FROM grafana/grafana:12.3.2 AS grafana-prod-image
COPY ./monitoring/grafana/provisioning /etc/grafana/provisioning
COPY ./monitoring/grafana/dashboards /var/lib/grafana/dashboards

FROM grafana/loki:3.6.4 AS loki-prod-image
COPY ./monitoring/loki/loki-config.yaml /etc/loki/local-config.yaml

FROM grafana/promtail:3.6.4 AS promtail-prod-image
COPY ./monitoring/promtail/promtail-config.yaml /etc/promtail/config.yml

