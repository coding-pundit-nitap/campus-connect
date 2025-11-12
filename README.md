# 🎓 Campus Connect

A comprehensive, containerized marketplace platform designed specifically for campus communities. It enables students and staff to buy and sell products within their campus ecosystem, all running on a modern, production-ready stack with Docker, Nginx, PostgreSQL, Redis, Elasticsearch, MinIO, and BullMQ.

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Technology Stack](#️-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Docker Usage](#-docker-usage)
- [Available Scripts](#-available-scripts)
- [Project Structure](#-project-structure)
- [Authentication](#-authentication)
- [Contributing](#-contributing)

## 🎯 About

Campus Connect is a modern web application built with Next.js that serves as a marketplace platform for campus communities. It allows users to:

- **Browse Products**: Explore various products available within the campus community.
- **Manage Shops**: Create and manage their own shops to sell products.
- **Shopping Cart**: Add products to a cart and manage orders.
- **User Authentication**: Secure login/registration system with Better Auth.
- **Order Management**: Track orders from placement to completion.
- **Seller Dashboard**: Comprehensive seller tools and verification system.
- **Real-time Notifications**: Get instant updates via Server-Sent Events.

## ✨ Features

- 🛒 **Full-Featured Marketplace**: A complete e-commerce platform.
- 🏪 **Multi-Vendor Support**: Enables multiple shops and sellers.
- 🛍️ **Shopping Cart**: Persistent cart with shop-specific organization.
- 📱 **Responsive Design**: Mobile-first UI for a seamless experience on any device.
- 🔐 **Secure Authentication**: Robust user authentication powered by Better Auth.
- 📊 **Order Tracking**: Real-time order status updates for buyers and sellers.
- 🔔 **Real-time Notifications**: SSE-based notifications with Redis Pub/Sub.
- 🔍 **Full-text Search**: Elasticsearch-powered search with PostgreSQL fallback.
- 💾 **Object Storage**: Integrated with MinIO for scalable file storage.
- ⚡ **Redis Caching**: Utilizes Redis for message queuing.
- 📝 **Structured Logging**: Production-grade logging with Pino.
- 🛡️ **Rate Limiting**: Nginx-based rate limiting for API protection.
- 🐳 **Fully Containerized**: Production-ready Docker setup.

## 🛠️ Technology Stack

### Frontend

- **[Next.js 16](https://nextjs.org/)** - React framework with App Router.
- **[React 19](https://react.dev/)** - The library for web and native user interfaces.
- **[TypeScript](https://www.typescriptlang.org/)** - For type safety.
- **[Tailwind CSS 4](https://tailwindcss.com/)** - A utility-first CSS framework.
- **[Shadcn/ui](https://ui.shadcn.com/)** - For accessible and reusable UI components.
- **[TanStack Query](https://tanstack.com/query)** - For server state management.
- **[Zod](https://zod.dev/)** - For schema validation.

### Backend

- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** - Server-side logic.
- **[Prisma 7](https://www.prisma.io/)** - Next-generation Node.js and TypeScript ORM.
- **[Better Auth](https://better-auth.com/)** - For handling authentication.
- **[BullMQ](https://docs.bullmq.io/)** - For background job processing.
- **[Pino](https://getpino.io/)** - For structured logging.

### Infrastructure

- **[Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)** - Containerization.
- **[Nginx](https://www.nginx.com/)** - Reverse proxy with rate limiting.
- **[PostgreSQL 17](https://www.postgresql.org/)** - Primary relational database.
- **[Redis](https://redis.io/)** - Cache, Pub/Sub, and job queues.
- **[Elasticsearch 9](https://www.elastic.co/)** - Full-text search engine.
- **[MinIO](https://min.io/)** - S3-compatible object storage.

### Development Tools

- **[pnpm](https://pnpm.io/)** - Fast, disk space-efficient package manager.
- **[ESLint](https://eslint.org/)** & **[Prettier](https://prettier.io/)** - Code linting and formatting.
- **[Husky](https://typicode.github.io/husky/#/)** & **[lint-staged](https://github.com/okonet/lint-staged)** - Git hooks.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v20 or higher)
- **[pnpm](https://pnpm.io/installation)**
- **[Docker](https://docs.docker.com/get-docker/)**
- **[Docker Compose](https://docs.docker.com/compose/install/)**

## 🚀 Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/coding-pundit-nitap/campus-connect.git
    cd campus-connect
    ```

2.  **Set up environment variables:**

    ```bash
    cp .env.example .env
    cp .env.local.example .env.local
    ```

3.  **Build and start the services:**
    This single command will build the necessary Docker images and start all the services defined in `compose.yml` for the development environment.

    ```bash
    pnpm docker:dev:up
    ```

4.  **Access the application:**
    - **🌐 Main Application**: [http://localhost](http://localhost)
    - **🗄️ MinIO Console**: [http://localhost:9001](http://localhost:9001)
    - **📀 Prisma Studio**: [http://localhost:5555](http://localhost:5555)
    - **🔍 Elasticsearch**: [http://localhost:9200](http://localhost:9200)

## ⚙️ Configuration

### Environment Files

- `.env`: Infrastructure services (PostgreSQL, MinIO, Redis)
- `.env.local`: Development application variables
- `.env.production`: Production application variables

### Elasticsearch Security (Production)

For production, enable Elasticsearch security:

```bash
# In .env.production
ES_SECURITY_ENABLED=true
ES_USERNAME=elastic
ES_PASSWORD=your-secure-password
```

## 🐳 Docker Usage

### Development

```bash
pnpm docker:dev:up      # Start all services
pnpm docker:dev:down    # Stop all services
pnpm docker:dev:logs    # View logs
pnpm docker:db:migrate  # Run migrations
```

### Production

```bash
cp .env.production.example .env.production
# Edit .env.production with secure credentials

pnpm docker:prod:build
pnpm docker:prod:up -d
```

## 📜 Available Scripts

### Application & Database

| Script             | Description                                  |
| :----------------- | :------------------------------------------- |
| `pnpm dev`         | Starts the Next.js development server.       |
| `pnpm build`       | Builds the application for production.       |
| `pnpm validate`    | Runs linting, formatting, and type checking. |
| `pnpm db:generate` | Generates the Prisma client.                 |
| `pnpm db:migrate`  | Applies database migrations.                 |

### Docker Commands

| Script                               | Description                              |
| :----------------------------------- | :--------------------------------------- |
| `pnpm docker:dev:up`                 | Starts the development environment.      |
| `pnpm docker:dev:down`               | Stops the development environment.       |
| `pnpm docker:prod:up`                | Starts the production environment.       |
| `pnpm docker:db:migrate`             | Runs Prisma migrations in dev container. |
| `pnpm docker:sync-search`            | Syncs Elasticsearch indices (dev).       |
| `pnpm docker:sync-search:prod`       | Syncs Elasticsearch indices (prod).      |
| `pnpm docker:cleanup:orphaned-files` | Cleans up orphaned MinIO files (dev).    |

### Maintenance Scripts

| Script                                   | Description                              |
| :--------------------------------------- | :--------------------------------------- |
| `pnpm docker:cleanup:orphaned-files:dry` | Preview orphaned files without deleting. |
| `pnpm docker:cleanup:orphaned-files`     | Delete orphaned files from MinIO.        |
| `pnpm docker:sync-search`                | Re-index all data to Elasticsearch.      |

## 📁 Project Structure

```
campus-connect/
├── nginx/                # Nginx configuration (rate limiting, proxying)
├── prisma/               # Database schema and migrations
├── scripts/              # Maintenance scripts (workers, cleanup, sync)
├── src/
│   ├── app/              \# Next.js App Router pages and API routes
│   ├── components/       \# Reusable React components
│   ├── lib/              \# Utility functions and libraries (db, auth)
│   ├── types/            \# TypeScript type definitions
│   └── ...
├── .env.example          \# Example for common infrastructure variables
├── .env.local.example    \# Example for development app variables
├── .env.production.example \# Example for production app variables
├── compose.yml    \# Docker services orchestration
├── Dockerfile            \# Multi-stage Docker build for the app
└── package.json          \# Project dependencies and scripts
```

## 🔐 Authentication

Authentication is handled by **Better Auth** with:

- Email/password authentication
- Google OAuth support
- Role-based access control (USER, ADMIN)
- Session management with secure cookies

## 🔔 Background Workers

The application uses BullMQ for background processing:

- **Notification Worker**: Processes and delivers notifications via Redis Pub/Sub
- **Search Worker**: Syncs data changes to Elasticsearch indices

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b yourname/feature-description`
3. **Commit changes**: Keep commits small and descriptive
4. **Keep PRs small**: Aim for **under 300 lines** per PR
5. **Open a Pull Request** against the `main` branch

---

Built with ❤️ for the Coding Pundits community.
