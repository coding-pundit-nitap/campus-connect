# 🎓 College Connect

A comprehensive marketplace platform designed specifically for college communities, enabling students and staff to buy and sell products within their campus ecosystem.

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Database](#database)
- [Docker Setup](#docker-setup)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [API Routes](#api-routes)
- [Contributing](#contributing)

## 🎯 About

College Connect is a modern web application built with Next.js that serves as a marketplace platform for college communities. It allows users to:

- **Browse Products**: Explore various products available within the college community
- **Manage Shops**: Create and manage their own shops to sell products
- **Shopping Cart**: Add products to cart and manage orders
- **User Authentication**: Secure login/registration system with NextAuth
- **Order Management**: Track orders from placement to completion
- **Seller Dashboard**: Comprehensive seller tools and verification system

## ✨ Features

- 🛒 **Marketplace**: Full-featured e-commerce platform
- 🏪 **Multi-vendor Support**: Multiple shops and sellers
- 🛍️ **Shopping Cart**: Persistent cart with shop-specific organization
- 📱 **Responsive Design**: Mobile-first responsive UI
- 🔐 **Authentication**: Secure user authentication with NextAuth
- 📊 **Order Tracking**: Real-time order status updates
- 💳 **Payment Integration**: Support for cash and online payments
- 🎨 **Modern UI**: Built with Tailwind CSS and Radix UI components
- 🐳 **Docker Support**: Containerized development and production environments

## 🛠️ Technology Stack

### Frontend

- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Shadcn/ui](https://ui.shadcn.com//)** - UI components
- **[Lucide React](https://lucide.dev/)** - Icons

### Backend & Database

- **[Prisma](https://www.prisma.io/)** - Database ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Primary database
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication

### State Management & Data Fetching

- **[TanStack Query](https://tanstack.com/query)** - Server state management
- **[Zod](https://zod.dev/)** - Schema validation

### Development Tools

- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Docker](https://www.docker.com/)** - Containerization
- **[pnpm](https://pnpm.io/)** - Package manager

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (recommended)
- **Docker** and **Docker Compose** (for containerized setup)
- **PostgreSQL** (if running without Docker)

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/connects-college/college-connect.git
   cd college-connect
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables (see [Configuration](#configuration))

4. **Set up the database**

   ```bash
   # Using Docker (recommended)
   pnpm docker:dev:up

   # Or start just the database
   docker-compose up db -d
   ```

5. **Run database migrations**

   ```bash
   pnpm db:migrate
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## ⚙️ Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/college_connect"

# NextAuth
AUTH_SECRET="your-auth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: External OAuth providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 💻 Development

### Available Scripts

| Script           | Description                             |
| ---------------- | --------------------------------------- |
| `pnpm dev`       | Start development server with Turbopack |
| `pnpm build`     | Build for production                    |
| `pnpm start`     | Start production server                 |
| `pnpm lint`      | Run ESLint                              |
| `pnpm format`    | Format code with Prettier               |
| `pnpm typecheck` | Run TypeScript type checking            |
| `pnpm validate`  | Run linting and format checking         |

### Database Scripts

| Script             | Description                     |
| ------------------ | ------------------------------- |
| `pnpm db:generate` | Generate Prisma client          |
| `pnpm db:migrate`  | Run database migrations         |
| `pnpm db:deploy`   | Deploy migrations to production |
| `pnpm db:studio`   | Open Prisma Studio              |

### Docker Scripts

| Script                  | Description                        |
| ----------------------- | ---------------------------------- |
| `pnpm docker:dev:build` | Build development container        |
| `pnpm docker:dev:up`    | Start development environment      |
| `pnpm docker:dev:down`  | Stop development environment       |
| `pnpm docker:prod:up`   | Start production environment       |
| `pnpm docker:db:psql`   | Connect to PostgreSQL in container |

## 🗄️ Database

The project uses PostgreSQL with Prisma ORM. The database schema includes:

- **Users**: User accounts with roles (USER, ADMIN)
- **Shops**: Seller shops with verification status
- **Products**: Product catalog with categories and inventory
- **Cart & Cart Items**: Shopping cart functionality
- **Orders & Order Items**: Order management system
- **Addresses**: User shipping addresses
- **Payouts**: Seller payment tracking

### Database Models

- `User` - User accounts and authentication
- `Account` - OAuth account linking
- `Session` - User sessions
- `Shop` - Seller shops
- `Product` - Product catalog
- `Cart` / `CartItem` - Shopping cart
- `Order` / `OrderItem` - Order management
- `UserAddress` - Shipping addresses
- `Payout` - Seller payments

## 🐳 Docker Setup

The project includes Docker configuration for both development and production:

### Development with Docker

```bash
# Start development environment
pnpm docker:dev:up

# View logs
pnpm docker:dev:logs

# Stop environment
pnpm docker:dev:down
```

### Production with Docker

```bash
# Build and start production
pnpm docker:prod:build
pnpm docker:prod:up

# View logs
pnpm docker:prod:logs
```

## 📁 Project Structure

```
college-connect/
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
├── src/
│   ├── actions/           # Server actions
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   ├── config/            # Configuration files
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── services/          # API service functions
│   └── types/             # TypeScript type definitions
├── docker-compose.yml     # Docker configuration
├── Dockerfile            # Container definition
└── package.json          # Dependencies and scripts
```

## 🔐 Authentication

The application uses NextAuth.js for authentication with:

- **JWT Strategy**: Stateless authentication
- **Prisma Adapter**: Database session storage
- **Role-based Access**: USER and ADMIN roles
- **OAuth Support**: Ready for Google/other providers

## 🛡️ API Routes

The application includes several API routes:

- `/api/auth/*` - Authentication endpoints
- `/api/cart/*` - Cart management
- `/api/orders/*` - Order processing
- `/api/shops/*` - Shop management
- `/api/users/*` - User management
- `/api/seller/*` - Seller operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch with your name (`git checkout -b yourname/feature-description`)
   - Example: `git checkout -b john/add-user-dashboard` or `git checkout -b sarah/fix-cart-bug`
3. Keep your changes **under 300 lines of code** per pull request for easier review
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin yourname/feature-description`)
6. Open a Pull Request

### Branch Naming Convention

- `yourname/feature-description` - For new features
- `yourname/fix-issue-description` - For bug fixes
- `yourname/update-component-name` - For updates/improvements

### Pull Request Guidelines

- **Maximum 300 lines** of code changes per PR
- Include a clear description of what was changed
- Reference any related issues
- Ensure all tests pass before submitting

## 📝 License

This project is private and proprietary to the coding pundit community.

---

Built with ❤️ for coding pundit communities
