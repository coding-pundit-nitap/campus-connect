# Campus Connect

> **A production-grade, batch-delivery marketplace built for a campus with a 100-metre altitude problem.**

[![Live Demo](https://img.shields.io/badge/Live-connect.nitap.ac.in-brightgreen?style=flat-square)](https://connect.nitap.ac.in)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/coding-pundit-nitap/campus-connect)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://docker.com/)

---

## Table of Contents

- [The Problem Worth Solving](#-the-problem-worth-solving)
- [The Solution: Batch & Climb](#-the-solution-batch--climb)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#️-tech-stack)
- [Key Technical Decisions](#-key-technical-decisions)
- [Project Structure](#-project-structure)
- [Data Model Highlights](#-data-model-highlights)
- [Background Worker Service](#-background-worker-service)
- [Monitoring & Observability](#-monitoring--observability)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#️-environment-variables)
- [Docker Usage](#-docker-usage)
- [Available Scripts](#-available-scripts)
- [Contributing](#-contributing)

---

## 🏔️ The Problem Worth Solving

At **NIT Arunachal Pradesh**, the campus hostels sit roughly **100 metres above** the Lower Market where all the vendors operate. Before Campus Connect existed:

- Vendors received fragmented, chaotic orders over WhatsApp with no structure.
- Each order meant a separate exhausting uphill trip — 10 orders meant 10 climbs.
- Students had zero delivery time guarantees — just "I'll come soon."
- Vendors were operating at a loss on delivery costs alone.

This is the **Altitude Gap** — a real, physical constraint that demanded a logistics-first solution, not a generic food-ordering clone.

---

## 🚀 The Solution: Batch & Climb

Campus Connect solves the Altitude Gap with a **scheduled batch delivery model**:

1. Students browse and place orders before a vendor-defined batch cutoff time.
2. Orders are automatically grouped into time-slot batches (e.g., "5 PM Batch").
3. When the cutoff hits, the system atomically locks the batch, generates delivery OTPs for every order, and notifies the vendor instantly.
4. The vendor makes a **single trip** up the hill with all batched orders.
5. OTP verification confirms delivery — the student shares their OTP only after receiving their items, preventing false completions.

**The result: 1 trip, N orders, zero chaos.**

---

## 🏗️ Architecture Overview

```
                     ┌──────────────────────────────────┐
                     │         Nginx (Reverse Proxy)    │
                     │    Rate Limiting · SSL · Routing │
                     └──────────┬───────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
  ┌───────▼──────┐    ┌─────────▼────────┐   ┌────────▼────────┐
  │  Next.js App │    │  Worker Service  │   │  MinIO (S3)     │
  │  App Router  │    │  (Separate proc) │   │  Object Storage │
  │  API Routes  │    │                  │   └─────────────────┘
  │  Server      │    │  ┌─────────────┐ │
  │  Actions     │    │  │Batch Closer │ │
  └───────┬──────┘    │  │ (node-cron) │ │
          │           │  ├─────────────┤ │
          │           │  │Notification │ │
          │           │  │Worker(BullMQ│ │
          │           │  ├─────────────┤ │
          │           │  │Audit Worker │ │
          │           │  │  (BullMQ)   │ │
          │           │  └─────────────┘ │
          │           └─────────┬────────┘
          │                     │
  ┌───────▼─────────────────────▼────────┐
  │               Redis                  │
  │   BullMQ Queues · Pub/Sub · Cache    │
  └───────────────────┬──────────────────┘
                      │
  ┌───────────────────▼──────────────────┐
  │           PostgreSQL 18              │
  │       Primary Relational Database    │
  └──────────────────────────────────────┘
```

**Real-time notification flow:**

```
Order event → Server Action → BullMQ enqueue
  → Notification Worker → prisma.notification.create
  → Redis PUBLISH user:{id}:notifications
  → SSE handler subscribes → browser EventSource
```

---

## 🛠️ Tech Stack

### Application

| Layer           | Technology                          | Version |
| --------------- | ----------------------------------- | ------- |
| Framework       | Next.js (App Router)                | 16      |
| Language        | TypeScript                          | 5.9     |
| UI Components   | React + Tailwind CSS v4 + shadcn/ui | 19 / 4  |
| ORM             | Prisma                              | 7       |
| Auth            | Better Auth (Email + Google OAuth)  | 1.4     |
| Forms           | React Hook Form + Zod               | —       |
| Server State    | TanStack Query                      | 5       |
| Background Jobs | BullMQ                              | 5       |
| Scheduled Tasks | node-cron                           | 4       |
| Logging         | Pino                                | 10      |
| PDF Generation  | @react-pdf/renderer                 | 4       |

### Infrastructure

| Service    | Image                            | Purpose                      |
| ---------- | -------------------------------- | ---------------------------- |
| PostgreSQL | `postgres:18.1-alpine`           | Primary database             |
| Redis      | `redis:8.2.1-alpine`             | Job queues, Pub/Sub          |
| MinIO      | `minio/minio:RELEASE.2025-09-07` | S3-compatible object storage |
| Nginx      | `nginx:1.29-alpine`              | Reverse proxy, rate limiting |

### Observability (Production)

| Tool              | Image                                           | Purpose                           |
| ----------------- | ----------------------------------------------- | --------------------------------- |
| Prometheus        | `prom/prometheus:v3.9.1`                        | Metrics scraping & alerting rules |
| Grafana           | `grafana/grafana:12.3.2`                        | Dashboards (6 pre-provisioned)    |
| Loki              | `grafana/loki:3.6.4`                            | Log aggregation                   |
| Promtail          | `grafana/promtail:3.6.4`                        | Docker log shipping to Loki       |
| Alertmanager      | `prom/alertmanager:v0.28.1`                     | Email alerting via SMTP           |
| cAdvisor          | `gcr.io/cadvisor/cadvisor:v0.55.1`              | Container resource metrics        |
| node-exporter     | `prom/node-exporter:v1.8.2`                     | Host-level metrics                |
| postgres-exporter | `prometheuscommunity/postgres-exporter:v0.18.1` | DB metrics                        |
| redis-exporter    | `oliver006/redis_exporter:v1.80.2`              | Redis metrics                     |

---

## ✨ Key Technical Decisions

### Dual Prisma Client Generation

The schema generates two completely separate Prisma clients — one at `src/generated/client` for the Next.js process and one at `workers/generated/client` for the worker process. Each process has its own connection pool and generated types, keeping the two runtimes fully decoupled while sharing a single source-of-truth schema.

### Worker Service as a Separate Process

The workers run as an entirely separate Node.js process (`workers/index.ts`), built with its own `tsconfig.worker.json` and deployed as its own Docker container (`worker-runner`). A crash in the worker never takes down the web app, and each can be scaled or restarted independently.

### Multi-Stage Docker Build

Seven named build stages produce lean, secure runtime images:

| Stage            | Purpose                                                  |
| ---------------- | -------------------------------------------------------- |
| `base`           | Node 24 Alpine + pnpm corepack setup                     |
| `deps`           | Full install + `prisma generate` (both client targets)   |
| `prod-deps`      | Production-only install                                  |
| `app-builder`    | `next build` with public env vars baked in as build args |
| `worker-builder` | `tsc -p tsconfig.worker.json`                            |
| `runner`         | Next.js standalone output, non-root `nextjs` user        |
| `worker-runner`  | Compiled worker dist, non-root `worker` user             |
| `migrator`       | Runs `prisma migrate deploy`, non-root `migrator` user   |

All runtime containers run as non-root system users. Production containers set `read_only: true` filesystems with explicit `tmpfs` mounts and drop all Linux capabilities except the minimum required.

### Batch Scheduling Design: Slot vs. Instance

`BatchSlot` is the _template_ — a shop's reusable "5 PM Batch" config stored as `cutoff_time_minutes: 1020` (minutes from midnight). `Batch` is the _instance_ — today's actual run with a concrete `cutoff_time` datetime and a lifecycle `status`. This separation means shops can modify their slot schedule without corrupting historical batch records, and the cron job only ever queries `Batch` rows.

### OTP-Gated Delivery

On batch lock, the worker generates a 4-digit OTP per order and persists it to the `Order` row. The OTP is visible to the student in-app. The vendor can only mark delivery complete after the student reads it aloud — making fraudulent completion impossible without physical presence.

### Real-time via SSE + Redis Pub/Sub (No WebSocket Server)

The Next.js route at `/api/notifications/stream` opens a Server-Sent Events connection and subscribes to `user:{id}:notifications` and `broadcast:notifications` Redis channels via `ioredis`. When the notification worker publishes to a channel, every connected SSE client for that user receives the event instantly — without a dedicated WebSocket server.

### Delivery Address Snapshot

At order creation, the full delivery address is serialized into `Order.delivery_address_snapshot` (JSON string). Even if the user later edits or deletes their address, historical orders retain the exact address used at time of purchase — which matters for dispute resolution.

### Denormalized Review Aggregates

`Product` carries `rating_sum` and `review_count` directly on the row. Average rating reads are O(1) (`rating_sum / review_count`) rather than an aggregate query over the `Review` table. Both fields are updated transactionally with each `Review` write.

### Admin Audit Log (Async, Non-Blocking)

Every admin action is dispatched to the `AUDIT_QUEUE` BullMQ queue by `lib/audit/audit-producer.ts` in the main app. The `auditWorker` (concurrency: 5) processes these asynchronously — so audit logging never adds latency to the admin API response path.

### Automated PostgreSQL Backups

`prodrigestivill/postgres-backup-local` runs every 6 hours with `--format=custom --compress=9`. Retention: 7 daily, 4 weekly, 6 monthly backups. Enabled in both `dev` and `prod` profiles.

---

## 📁 Project Structure

```
campus-connect/                     214 directories, 602 files
│
├── nginx/
│   ├── nginx.conf                  # Base config: worker processes, logging format
│   └── conf.d/
│       ├── dev.conf                # Dev: proxies app + Prisma Studio + MinIO
│       └── prod.conf               # Prod: stricter headers, rate limits
│
├── prisma/
│   ├── schema.prisma               # Single source of truth — 2 client targets
│   └── migrations/                 # 4 migrations (init → Feb 2026)
│
├── monitoring/                     # Full observability config, checked into repo
│   ├── prometheus/
│   │   ├── prometheus.yml          # Scrape configs for all 7 exporters + app
│   │   └── rules.yml               # Alert rules
│   ├── alertmanager/
│   │   ├── alertmanager.yml.template
│   │   └── alertmanager-entrypoint.sh  # envsubst at container startup — no secrets in repo
│   ├── grafana/
│   │   ├── dashboards/             # 6 pre-provisioned JSON dashboards
│   │   │   ├── app-nextjs.json
│   │   │   ├── campus-connect-overview.json
│   │   │   ├── docker-containers.json
│   │   │   ├── node-overview.json
│   │   │   ├── postgres.json
│   │   │   └── redis.json
│   │   └── provisioning/           # Auto-wired datasources + dashboard loader
│   ├── loki/loki-config.yaml
│   └── promtail/promtail-config.yaml
│
├── backup/
│   ├── backup.sh                   # Manual backup trigger
│   ├── restore.sh                  # Restore from file
│   └── verify.sh                   # Verify backup integrity
│
├── workers/                        # Separate Node.js process — NOT part of Next.js
│   ├── index.ts                    # Entrypoint: starts workers + SIGTERM handler
│   ├── batch/
│   │   └── batch-closer.ts         # node-cron every minute
│   ├── notification/
│   │   ├── consumer.ts             # BullMQ Worker: persist + Redis PUBLISH
│   │   └── types.ts
│   ├── audit/
│   │   ├── consumer.ts             # BullMQ Worker: write AdminAuditLog rows
│   │   └── types.ts
│   ├── scripts/
│   │   └── cleanup-orphaned-files.ts  # MinIO ↔ DB reconciliation script
│   └── lib/                        # Isolated worker-local infrastructure
│       ├── prisma.ts               # Own Prisma singleton (workers/generated/client)
│       ├── redis.ts                # ioredis publisher
│       ├── redis-connection.ts     # BullMQ ConnectionOptions (REDIS_URL or REDIS_HOST)
│       └── logger.ts
│
└── src/
    ├── app/
    │   ├── api/                    # Next.js Route Handlers
    │   │   ├── auth/               # Better Auth catch-all + custom register
    │   │   ├── notifications/stream/ # SSE endpoint — Redis subscribe → EventSource
    │   │   ├── metrics/            # prom-client exposition for Prometheus scrape
    │   │   ├── health/status|database  # Liveness + readiness probes
    │   │   ├── orders/[id]/pdf/    # React PDF receipt generation
    │   │   ├── search/             # Product, order, and global search
    │   │   ├── upload/             # Presigned MinIO URL handler
    │   │   └── ...                 # shops, products, cart, reviews, seller, vendor
    │   │
    │   ├── actions/                # Next.js Server Actions (form mutations)
    │   │   ├── admin/              # 12 admin action files
    │   │   ├── vendor/             # batch-actions, batch-slot-actions, individual-delivery
    │   │   └── ...                 # cart, orders, product, shops, user, addresses
    │   │
    │   ├── (public)/               # Unauthenticated pages (home, shops, product, legal)
    │   ├── (private)/              # Auth-required: orders, checkout, vendor dashboard
    │   └── (protected)/            # Admin-only: 11 admin panel pages
    │
    ├── components/                 # ~200 components, co-located by feature
    │   ├── ui/                     # shadcn/ui primitives (35 components)
    │   ├── shared/                 # Cross-feature: product cards, filters, badges
    │   ├── owned-shop/             # Vendor dashboard, batch cards, order management
    │   ├── admin/                  # Admin data tables, dialogs, stats
    │   └── ...                     # checkout, cart-drawer, orders, sidebar, pdf
    │
    ├── hooks/                      # ~40 custom hooks, split by concern
    │   ├── queries/                # TanStack Query hooks (one per data domain)
    │   ├── ui/                     # Form state, filter state, drawer state
    │   └── utils/                  # useInfiniteScroll, useLiveNotifications, useOnlineStatus
    │
    ├── repositories/               # Data access layer — all Prisma queries
    │   └── *.repository.ts         # 13 repositories, one per entity domain
    │
    ├── services/                   # Business logic — called by API routes + actions
    │   └── */                      # 14 service domains, api + core service variants
    │
    ├── lib/
    │   ├── auth.ts                 # Better Auth server config
    │   ├── prisma.ts               # Prisma singleton (app process)
    │   ├── redis.ts                # ioredis client (publisher + subscriber)
    │   ├── notification-emitter.ts # Enqueues to BullMQ notification queue
    │   ├── audit/audit-producer.ts # Enqueues to BullMQ audit queue
    │   └── utils/                  # 15 utility modules (image, order, shop, timezone…)
    │
    ├── validations/                # Zod schemas for all API inputs (12 files)
    ├── types/                      # Shared TypeScript types (12 files)
    └── rbac.ts                     # Role-based access control
```

---

## 🗃️ Data Model Highlights

**Batch lifecycle:** `OPEN → LOCKED → IN_TRANSIT → COMPLETED | CANCELLED`
Batches transition via the cron worker (OPEN→LOCKED) and vendor actions thereafter. Order statuses mirror this: `NEW → BATCHED → OUT_FOR_DELIVERY → COMPLETED`.

**Seller verification:** `NOT_STARTED → PENDING → REQUIRES_ACTION → VERIFIED | REJECTED`
Shops cannot accept orders until `verification_status = VERIFIED` and `is_active = true`. All admin transitions are recorded in `AdminAuditLog`.

**Soft deletes on Products and Shops** — `deleted_at` timestamps preserve order history integrity after a product or shop is removed.

**`PlatformSettings`** is a singleton row (`id = "default"`) holding the global `platform_fee`. The fee is read at checkout and locked into `Order.platform_fee` — past orders are unaffected by future fee changes.

**`StockWatch`** — users subscribe to out-of-stock products. When a vendor restocks, the app enqueues notifications to all watchers via the notification queue.

---

## ⚙️ Background Worker Service

The worker process (`workers/index.ts`) manages three concurrent concerns and handles its own graceful shutdown.

### 1. Batch Closer (node-cron, every minute)

```
every 60s:
  1. Find all OPEN batches where cutoff_time < now
  2. Atomically set status = LOCKED (updateMany)
  3. Bulk-set contained orders to BATCHED
  4. For each newly locked batch:
       a. Generate a 4-digit OTP per order
       b. Enqueue SEND_NOTIFICATION → vendor ("Batch Ready!")
  5. Find LOCKED batches idle > 30 minutes
       → Enqueue WARNING notification → vendor ("Orders Waiting!")
```

### 2. Notification Worker (BullMQ, concurrency: 5)

**`SEND_NOTIFICATION`** — Creates a `Notification` row and publishes to `user:{id}:notifications`.

**`BROADCAST_NOTIFICATION`** — Creates a `BroadcastNotification` row and publishes to `broadcast:notifications`. Read status tracked per-user in `BroadcastReadStatus`.

### 3. Audit Worker (BullMQ, concurrency: 5)

Receives `AuditJobData` dispatched by `lib/audit/audit-producer.ts` in the main app and writes `AdminAuditLog` rows asynchronously — keeping audit writes off the critical admin API path.

---

## 📊 Monitoring & Observability

The full observability stack deploys under the `prod` Docker Compose profile. Zero overhead in development.

**Metrics:** `app (/api/metrics) + postgres + redis + node + cAdvisor exporters` → Prometheus → Grafana

**6 pre-provisioned Grafana dashboards:**

- `campus-connect-overview` — business metrics: orders, revenue, batch throughput
- `app-nextjs` — request rates, response times, error rates
- `docker-containers` — per-container CPU/memory/network via cAdvisor
- `node-overview` — host CPU, memory, disk, network
- `postgres` — query performance, connections, table sizes
- `redis` — memory, hit rate, command throughput

**Logs:** Promtail scrapes Docker container logs → Loki → Grafana Explore

**Alerting:** `monitoring/prometheus/rules.yml` defines alert rules. Alertmanager renders `alertmanager.yml.template` via `envsubst` at startup — injecting SMTP credentials from env vars with no secrets committed to the repo.

---

## 📋 Prerequisites

- **Node.js** v20+
- **pnpm** — `npm install -g corepack && corepack enable && corepack prepare pnpm@latest --activate`
- **Docker** v24+
- **Docker Compose** v2.20+

---

## 🚀 Installation & Setup

### 1. Clone

```bash
git clone https://github.com/coding-pundit-nitap/campus-connect.git
cd campus-connect
```

### 2. Environment files

```bash
cp .env.example .env
cp .env.local.example .env.local
```

### 3. Start the development environment

```bash
pnpm docker:dev:up
```

This single command orchestrates the full stack in dependency order:

```
db (healthy)  ──────────────┐
redis (healthy) ────────────┤──→ migrator-dev ──→ app-dev + worker-dev + prisma-studio
minio (healthy) ────────────┤                          ↑
create-buckets (complete) ──┘                      nginx-dev
```

### 4. Access the services

| Service       | URL                   |
| ------------- | --------------------- |
| Application   | http://localhost      |
| MinIO Console | http://localhost:9001 |
| Prisma Studio | http://localhost:5555 |

---

## ⚙️ Environment Variables

### `.env` — Infrastructure (all services)

```env
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_REGION=us-east-1
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_REGION=us-east-1
NEXT_PUBLIC_MINIO_BUCKET=campus-connect
MINIO_ENDPOINT=http://minio:9000
NEXT_PUBLIC_MINIO_ENDPOINT=http://localhost:9000

POSTGRES_USER=connect
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=campus_connect

DATABASE_URL=postgresql://connect:mypassword@db:5432/campus_connect?schema=public&connection_limit=10&pgbouncer=true
DIRECT_URL=postgresql://connect:mypassword@db:5432/campus_connect

REDIS_URL=redis://redis:6379

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
ALERT_EMAIL_FROM=alerts@yourdomain.com
ALERT_EMAIL_TO=admin@yourdomain.com
NOTIFICATION_EMAIL_FROM=notifications@example.com

# Monitoring
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=changeme
```

### `.env.local` — App secrets (development)

```env
BETTER_AUTH_URL=http://localhost
NEXT_PUBLIC_APP_URL=http://localhost
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### `.env.production` — Production overrides

```env
BETTER_AUTH_URL=https://your-production-auth-url

NEXT_PUBLIC_APP_URL=https://your-production-app-url
NEXT_PUBLIC_API_URL=/api
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## 🐳 Docker Usage

### Development

```bash
pnpm docker:dev:up              # Start full stack
pnpm docker:dev:build           # Rebuild images after package.json changes
pnpm docker:dev:logs            # Stream all logs
pnpm docker:dev:logs-app        # Tail app only
docker compose logs -f worker-dev  # Tail worker only
pnpm docker:db:migrate          # Create + apply new migration
pnpm docker:db:psql             # Interactive psql shell
pnpm docker:dev:down            # Stop and remove containers
```

### Production

```bash
cp .env.production.example .env.production
# Fill in all production values

pnpm docker:prod:build
docker compose --profile prod up -d

pnpm docker:prod:logs
pnpm docker:prod:logs-worker
```

---

## 📜 Available Scripts

### Application

| Script              | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `pnpm dev`          | Next.js dev server (outside Docker)                  |
| `pnpm build`        | Production Next.js build                             |
| `pnpm build:worker` | Compile worker TypeScript → `dist/workers`           |
| `pnpm validate`     | typecheck + lint + format check (required before PR) |
| `pnpm typecheck`    | `tsc --noEmit`                                       |
| `pnpm lint:fix`     | ESLint auto-fix                                      |
| `pnpm format`       | Prettier write                                       |

### Database

| Script                   | Description                                |
| ------------------------ | ------------------------------------------ |
| `pnpm db:migrate`        | Create + apply migration (local dev)       |
| `pnpm db:deploy`         | Apply existing migrations (CI/prod)        |
| `pnpm db:studio`         | Open Prisma Studio locally                 |
| `pnpm docker:db:migrate` | `migrate dev` inside running dev container |
| `pnpm docker:db:psql`    | Interactive psql shell                     |

### Redis Diagnostics

| Script                       | Description             |
| ---------------------------- | ----------------------- |
| `pnpm redis:cli`             | Interactive Redis CLI   |
| `pnpm redis:memory`          | Memory breakdown        |
| `pnpm redis:keyspace`        | Key distribution        |
| `pnpm redis:pubsub:channels` | Active Pub/Sub channels |
| `pnpm redis:bigkeys`         | Find large keys         |
| `pnpm redis:flushall`        | ⚠️ Flush all data       |

### Maintenance

| Script                            | Description                              |
| --------------------------------- | ---------------------------------------- |
| `pnpm cleanup:orphaned-files:dry` | Preview MinIO files with no DB reference |
| `pnpm cleanup:orphaned-files`     | Delete orphaned MinIO files              |

---

## 🤝 Contributing

The `husky` + `lint-staged` pre-commit hook runs Prettier and ESLint on every staged file automatically.

**Branching:**

```bash
git checkout -b yourname/short-description
# e.g. git checkout -b aryan/stock-restock-notifications
```

**Layering rules:** API routes and Server Actions call **services** → services call **repositories** → repositories call **Prisma**. Never skip a layer.

**New DB changes:**

```bash
pnpm docker:db:migrate
# enter a descriptive name e.g. add_restock_notification_flag
```

**Before every PR:**

```bash
pnpm validate   # must be fully clean
```

**PR size:** Keep PRs under 300 lines. Split large features into incremental, reviewable chunks.

**Commit style** ([Conventional Commits](https://www.conventionalcommits.org/)):

```
feat(batch): support same-day batch rescheduling by vendor
fix(worker): prevent duplicate OTP generation on BullMQ retry
chore(deps): upgrade prisma 7.2 → 7.3
```

---

## 📄 License

Maintained by **Coding Club @ NIT Arunachal Pradesh** (Coding Pundit). See [LICENSE](./LICENSE) for details.

---

<p align="center">
  Built with ❤️ at NIT Arunachal Pradesh &nbsp;·&nbsp;
  <a href="https://connect.nitap.ac.in">connect.nitap.ac.in</a>
</p>
