# Multi-stage build for CMS Application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY apps/cms ./apps/cms
COPY apps/discovery/src/shared ./apps/discovery/src/shared

# Build the application
RUN npm run build:cms

# Production stage
FROM node:18-alpine AS production

# Install ffmpeg for media processing
RUN apk add --no-cache ffmpeg

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Create uploads directory
RUN mkdir -p uploads && chown -R nestjs:nodejs uploads
RUN mkdir -p uploads/media/original uploads/media/processed
RUN chown -R nestjs:nodejs uploads

# Change to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "dist/apps/cms/main"]
