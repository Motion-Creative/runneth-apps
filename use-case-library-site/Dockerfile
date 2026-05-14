# Multi-stage build for the Use Case Library site.
# Final image: a single Node process serving the API and the static SPA on $PORT.

FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Install workspace deps using the lockfile.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY frontend/package.json frontend/
COPY server/package.json server/
RUN pnpm install --frozen-lockfile || pnpm install

# Build frontend, then server. Frontend dist lands in server/public per vite.config.ts.
COPY . .
RUN pnpm --filter use-case-library-frontend build
RUN pnpm --filter use-case-library-server build

# Runtime image: only what's needed to run the server.
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Production deps only for the server.
COPY --from=builder /app/server/package.json /app/server/
COPY --from=builder /app/server/dist /app/server/dist
COPY --from=builder /app/server/public /app/server/public
WORKDIR /app/server
RUN pnpm install --prod --ignore-workspace

ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", "dist/index.js"]
