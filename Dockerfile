# ---- Dependencies ----
# Stage 1: Install dependencies
FROM node:24-alpine AS deps
WORKDIR /app

# Prisma needs this for its engine
RUN apk add --no-cache libc6-compat

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate


# Copy only package files and install all dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Builder ----
# Stage 2: Build the application
FROM node:24-alpine AS builder
WORKDIR /app

# Install pnpm in builder
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client for the correct platform (linux)
RUN pnpm prisma generate

# Build the Next.js application for production
RUN pnpm build

# Prune devDependencies to keep prod-only
RUN pnpm prune --prod


# ---- Runner ----
# Stage 3: Production image
FROM node:24-alpine AS runner
WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy only production node_modules and build output
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy and set up the entrypoint script for migrations
COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the entrypoint to our script
ENTRYPOINT ["./entrypoint.sh"]

# The command that the entrypoint script will run after migrations
CMD ["node", "server.js"]