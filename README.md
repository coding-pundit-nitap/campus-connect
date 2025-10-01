# 🎓 College Connect

A comprehensive, containerized marketplace platform designed specifically for college communities. It enables students and staff to buy and sell products within their campus ecosystem, all running on a modern, production-ready stack with Docker, Nginx, PostgreSQL, Redis, and MinIO.

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

College Connect is a modern web application built with Next.js that serves as a marketplace platform for college communities. It allows users to:

- **Browse Products**: Explore various products available within the college community.
- **Manage Shops**: Create and manage their own shops to sell products.
- **Shopping Cart**: Add products to a cart and manage orders.
- **User Authentication**: Secure login/registration system with NextAuth.
- **Order Management**: Track orders from placement to completion.
- **Seller Dashboard**: Comprehensive seller tools and verification system.

## ✨ Features

- 🛒 **Full-Featured Marketplace**: A complete e-commerce platform.
- 🏪 **Multi-Vendor Support**: Enables multiple shops and sellers.
- 🛍️ **Shopping Cart**: Persistent cart with shop-specific organization.
- 📱 **Responsive Design**: Mobile-first UI for a seamless experience on any device.
- 🔐 **Secure Authentication**: Robust user authentication powered by NextAuth.js.
- 📊 **Order Tracking**: Real-time order status updates for buyers and sellers.
- 💾 **Object Storage**: Integrated with MinIO for scalable file storage (e.g., product images).
- ⚡ **Redis Caching**: Utilizes Redis for improved performance and session management.
- 🐳 **Fully Containerized**: Production-ready Docker setup for development and deployment.

## 🛠️ Technology Stack

### Frontend

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router.
- **[TypeScript](https://www.typescriptlang.org/)** - For type safety.
- **[Tailwind CSS 4](https://tailwindcss.com/)** - A utility-first CSS framework.
- **[Shadcn/ui](https://ui.shadcn.com/)** & **[Radix UI](https://www.radix-ui.com/)** - For accessible and reusable UI components.
- **[TanStack Query](https://tanstack.com/query)** - For server state management and data fetching.
- **[Zod](https://zod.dev/)** - For schema validation.

### Backend

- **[Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)** - For server-side logic.
- **[Prisma](https://www.prisma.io/)** - Next-generation Node.js and TypeScript ORM.
- **[NextAuth.js](https://next-auth.js.org/)** - For handling authentication.

### Infrastructure

- **[Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)** - For containerization and orchestration.
- **[Nginx](https://www.nginx.com/)** - As a reverse proxy and web server.
- **[PostgreSQL](https://www.postgresql.org/)** - As the primary relational database.
- **[Redis](https://redis.io/)** - As an in-memory cache and data store.
- **[MinIO](https://min.io/)** - As an S3-compatible object storage server.

### Development Tools

- **[pnpm](https://pnpm.io/)** - Fast, disk space-efficient package manager.
- **[ESLint](https://eslint.org/)** & **[Prettier](https://prettier.io/)** - For code linting and formatting.
- **[Husky](https://typicode.github.io/husky/#/)** & **[lint-staged](https://github.com/okonet/lint-staged)** - For running checks on Git hooks.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

- **[Node.js](https://nodejs.org/)** (v20 or higher recommended)
- **[pnpm](https://pnpm.io/installation)**
- **[Docker](https://docs.docker.com/get-docker/)**
- **[Docker Compose](https://docs.docker.com/compose/install/)**

## 🚀 Installation

This project is designed to be run with Docker. The following steps will get your development environment up and running.

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/connects-college/college-connect.git](https://github.com/connects-college/college-connect.git)
    cd college-connect
    ```

2.  **Set up environment variables:**
    Copy the example environment files. These are pre-configured for the Docker setup.

    ```bash
    # For common services like Postgres & MinIO
    cp .env.example .env

    # For the Next.js app in development
    cp .env.local.example .env.local
    ```

3.  **Build and start the services:**
    This single command will build the necessary Docker images and start all the services defined in `docker-compose.yml` for the development environment.

    ```bash
    pnpm docker:dev:up
    ```

    The first run might take a few minutes to download images and build containers. Subsequent runs will be much faster.

4.  **Access the application:**
    Once all services are running, you can access them at:
    - **🌐 Main Application**: [http://localhost](http://localhost)
    - **🗄️ MinIO Console**: [http://localhost:9001](http://localhost:9001) (Use credentials from `.env`)
    - **📀 Prisma Studio**: [http://localhost:5555](http://localhost:5555)

That's it! The entire stack, including the database, object storage, cache, and the Next.js app with hot-reloading, is now running.

## ⚙️ Configuration

The project uses a multi-layered `.env` file system for configuration:

- `.env`: Defines common environment variables for infrastructure services managed by Docker Compose (e.g., PostgreSQL and MinIO credentials).
- `.env.local`: Contains variables specifically for the Next.js application in the **development** environment. This file is used by `app-dev`.
- `.env.production`: Contains variables for the Next.js application in the **production** environment. This file is used by `app-prod`.

**Note:** For file uploads to work correctly through the Nginx reverse proxy, two separate MinIO endpoint URLs are used:

- `MINIO_ENDPOINT`: The internal Docker network address (`http://minio:9000`) for server-to-server communication.
- `NEXT_PUBLIC_MINIO_ENDPOINT`: The public-facing address (`http://localhost:9000`) that the browser uses to upload files to pre-signed URLs.

## 🐳 Docker Usage

The entire application stack is managed via Docker Compose profiles to separate development and production environments.

### Development

The `dev` profile is designed for local development with hot-reloading and debugging tools.

- **Start all development services:**
  ```bash
  pnpm docker:dev:up
  ```
- **Stop all development services:**
  ```bash
  pnpm docker:dev:down
  ```
- **View logs from all services:**
  ```bash
  pnpm docker:dev:logs
  ```
- **Run a database migration:**
  This command executes `prisma migrate dev` inside the running application container.
  ```bash
  pnpm docker:db:migrate
  ```

### Production

The `prod` profile builds a hardened, optimized, and multi-stage Docker image for the Next.js application.

- **⚠️ Before you start:**
  1.  Copy the production environment file: `cp .env.production.example .env.production`.
  2.  **Change all default passwords and secrets** in `.env` and `.env.production`.

- **Build and start production services:**

  ```bash
  pnpm docker:prod:build
  pnpm docker:prod:up -d # The -d flag runs the containers in detached mode
  ```

- **Stop production services:**
  ```bash
  pnpm docker:prod:down
  ```

## 📜 Available Scripts

All scripts are defined in `package.json` and can be run with `pnpm <script-name>`.

### Application & Database

| Script             | Description                                           |
| :----------------- | :---------------------------------------------------- |
| `pnpm dev`         | Starts the Next.js development server with Turbopack. |
| `pnpm build`       | Builds the application for production.                |
| `pnpm start`       | Starts the production server.                         |
| `pnpm validate`    | Runs linting, formatting checks, and type checking.   |
| `pnpm db:generate` | Generates the Prisma client.                          |
| `pnpm db:migrate`  | Applies database migrations for development.          |
| `pnpm db:studio`   | Opens the Prisma Studio GUI.                          |

### Docker Commands

| Script                   | Description                                                     |
| :----------------------- | :-------------------------------------------------------------- |
| `pnpm docker:dev:up`     | Starts the complete development environment.                    |
| `pnpm docker:dev:down`   | Stops the development environment.                              |
| `pnpm docker:dev:logs`   | Tails logs from all development containers.                     |
| `pnpm docker:prod:up`    | Starts the complete production environment.                     |
| `pnpm docker:prod:down`  | Stops the production environment.                               |
| `pnpm docker:prod:logs`  | Tails logs from all production containers.                      |
| `pnpm docker:db:migrate` | Runs Prisma migrations in the dev container.                    |
| `pnpm docker:db:deploy`  | Runs Prisma migrations in the prod container.                   |
| `pnpm docker:db:psql`    | Opens a `psql` shell to the database container.                 |
| `pnpm docker:prune`      | Removes all unused Docker data (containers, networks, volumes). |

## 📁 Project Structure

```

college-connect/
├── nginx/                \# Nginx configuration files
├── prisma/               \# Database schema and migrations
├── public/               \# Static assets
├── scripts/              \# Shell scripts (e.g., entrypoint for Docker)
├── src/
│   ├── app/              \# Next.js App Router pages and API routes
│   ├── components/       \# Reusable React components
│   ├── lib/              \# Utility functions and libraries (db, auth)
│   ├── types/            \# TypeScript type definitions
│   └── ...
├── .env.example          \# Example for common infrastructure variables
├── .env.local.example    \# Example for development app variables
├── .env.production.example \# Example for production app variables
├── docker-compose.yml    \# Docker services orchestration
├── Dockerfile            \# Multi-stage Docker build for the app
└── package.json          \# Project dependencies and scripts
```

## 🔐 Authentication

Authentication is handled by **NextAuth.js** using a JWT session strategy. The configuration supports standard credential-based logins and can be easily extended to include OAuth providers like Google or GitHub.

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1.  **Fork the repository.**
2.  **Create a feature branch:** `git checkout -b yourname/feature-description`.
3.  **Commit your changes:** Keep commits small and descriptive.
4.  **Keep Pull Requests small:** Aim for changes **under 300 lines** per PR for easier review.
5.  **Open a Pull Request** against the `main` branch.

---

Built with ❤️ for the Coding Pundits community.
