# Multi-stage build for the Use Case Library site.
# Final image: one Node process serving the API and the static SPA on $PORT.

# ─── Builder ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# pnpm via corepack (pinned to packageManager in package.json).
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Build tools for native modules (better-sqlite3 falls back to source build
# if no prebuilt for our libc/arch is shipped).
RUN apk add --no-cache python3 make g++

# Install with a frozen lockfile for reproducible builds.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY frontend/package.json frontend/
COPY server/package.json server/
RUN pnpm install --frozen-lockfile

# Build: frontend dist → server/public, server tsc → server/dist
COPY . .
RUN pnpm --filter use-case-library-frontend build
RUN pnpm --filter use-case-library-server build

# pnpm deploy bundles the server with only its production node_modules,
# its built dist/, and its built public/ at the bundle root.
RUN pnpm --filter use-case-library-server deploy --prod /app/bundle

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
# Default to /data so a mounted Railway volume at /data persists reviews.
# Override with REVIEWS_DB_PATH env var if you mount the volume elsewhere.
ENV REVIEWS_DB_PATH=/data/reviews.db

# Self-contained bundle: package.json + node_modules + dist + public.
COPY --from=builder /app/bundle ./
RUN mkdir -p /data

# Smoke check that the runtime layout is correct before container starts taking traffic.
RUN node -e "require('node:fs').accessSync('./dist/index.js'); require('node:fs').accessSync('./public/index.html')"

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" >/dev/null || exit 1

EXPOSE 3000

CMD ["node", "dist/index.js"]
