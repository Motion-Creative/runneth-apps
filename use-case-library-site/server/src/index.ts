/**
 * Standalone Fastify server for the Use Case Library.
 *
 * One process. Serves:
 *   /api/health
 *   /api/catalog
 *   /api/use-case/:slug
 *   POST /api/refresh
 *   everything else  → static frontend from ./public/, with SPA fallback to index.html
 *
 * Env:
 *   PORT (default 3000)
 *   HOST (default 0.0.0.0)
 *   RUNNETH_APPS_REF (default main) — git ref of Motion-Creative/runneth-apps to read from
 */
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'

import { assembleCatalog, cacheStats, clearCache, loadUseCaseDetail } from './github.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '..', 'public')

const server = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } })

const SLUG_RE = /^[a-z0-9-]+$/

server.get('/api/health', async () => ({ ok: true, cache: cacheStats() }))

server.get('/api/catalog', async (_, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  reply.header('cache-control', 'public, max-age=30')
  try {
    return await assembleCatalog()
  } catch (err) {
    reply.code(502)
    return {
      error: 'catalog_unavailable',
      message: err instanceof Error ? err.message : String(err),
    }
  }
})

server.get<{ Params: { slug: string } }>('/api/use-case/:slug', async (request, reply) => {
  const { slug } = request.params
  if (!SLUG_RE.test(slug)) {
    reply.code(400)
    return { error: 'invalid_slug' }
  }
  reply.header('content-type', 'application/json; charset=utf-8')
  reply.header('cache-control', 'public, max-age=30')
  try {
    const detail = await loadUseCaseDetail(slug)
    if (!detail) {
      reply.code(404)
      return { error: 'not_found', slug }
    }
    return detail
  } catch (err) {
    reply.code(502)
    return {
      error: 'detail_unavailable',
      message: err instanceof Error ? err.message : String(err),
    }
  }
})

// Refresh: 1 call / 30s per IP.
const lastRefreshByIp = new Map<string, number>()
server.post('/api/refresh', async (request, reply) => {
  const ip = (request.ip ?? 'unknown').toString()
  const last = lastRefreshByIp.get(ip) ?? 0
  const now = Date.now()
  if (now - last < 30_000) {
    reply.code(429)
    return { error: 'rate_limited', retry_after_ms: 30_000 - (now - last) }
  }
  lastRefreshByIp.set(ip, now)
  clearCache()
  return { ok: true, refreshed_at: new Date().toISOString() }
})

// Static frontend.
await server.register(fastifyStatic, {
  root: PUBLIC_DIR,
  prefix: '/',
  wildcard: false,
})

// SPA fallback: anything that didn't match an /api route or a static file -> index.html.
server.setNotFoundHandler((request, reply) => {
  if (request.url.startsWith('/api/')) {
    reply.code(404)
    return reply.send({ error: 'not_found', path: request.url })
  }
  return reply.sendFile('index.html')
})

const PORT = Number(process.env.PORT ?? 3000)
const HOST = process.env.HOST ?? '0.0.0.0'

server.listen({ port: PORT, host: HOST }).catch((err) => {
  server.log.error(err)
  process.exit(1)
})
