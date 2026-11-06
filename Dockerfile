# Build stage
FROM node:22-alpine AS build

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source and config
COPY tsconfig.json ./
COPY src/ src/

# Build the application
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

# Enable corepack and install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from build stage
COPY --from=build /app/dist dist/

# Create data directory and set ownership
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose interlink server port
EXPOSE 3458

# Health check for the interlink server
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3458/health || exit 1

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["pnpm", "start"]