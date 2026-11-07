# Build stage
FROM node:26-alpine AS build

# Install corepack (not included in Node 26+ Alpine by default)
RUN npm install -g corepack@latest

# Enable corepack and install pnpm 12
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Disable supply-chain minimum release age check for lockfile-verified installs
RUN pnpm config set minimum-release-age 0

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy protobuf definitions
COPY proto/ proto/
COPY buf.yaml buf.gen.yaml ./

# Generate protobuf types
RUN pnpm proto:generate

# Copy source and config
COPY tsconfig.json ./
COPY src/ src/

# Build the application
RUN pnpm build

# Production stage
FROM node:26-alpine AS production

# Install corepack
RUN npm install -g corepack@latest

# Enable corepack and install pnpm 12
RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Disable supply-chain minimum release age check for lockfile-verified installs
RUN pnpm config set minimum-release-age 0

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built application from build stage
COPY --from=build /app/dist dist/

# Create data directory and set ownership
RUN mkdir -p /app/data && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["pnpm", "start"]