# ---- Dependencies ----
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Prisma needs this for its engine
RUN apk add --no-cache libc6-compat

# Install pnpm
RUN npm install -g pnpm

# Copy only package files and install all dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod=false

# ---- Builder ----
# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy dependencies from the 'deps' stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client for the correct platform (linux)
RUN pnpm prisma generate

# Build the Next.js application for production
RUN pnpm build

# ---- Runner ----
# Stage 3: Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Set the environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install pnpm
RUN npm install -g pnpm

# Install ONLY production dependencies
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile

# Copy the built application and necessary files from the 'builder' stage
# And set the correct ownership for the non-root user
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy and set up the entrypoint script for migrations
COPY --chown=nextjs:nodejs entrypoint.sh .
RUN chmod +x entrypoint.sh

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the entrypoint to our script
ENTRYPOINT ["./entrypoint.sh"]

# The command that the entrypoint script will run after migrations
CMD ["node", "server.js"]