# syntax=docker/dockerfile:1

###
# Builder stage
###
FROM node:20-alpine AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

###
# Runtime stage (standalone)
###
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Needed for HEALTHCHECK
RUN apk add --no-cache curl

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs

COPY --from=builder /app/public ./public

# Standalone output includes the server.js entrypoint plus required files.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD sh -c "curl -fsS http://$(hostname -i):${PORT}/api/health || exit 1"

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

