/**
 * Standalone Fastify server for the Use Case Library.
 *
 * One process. Serves:
 *   /api/health
 *   /api/catalog                              (catalog + per-slug rating aggregates)
 *   /api/use-case/:slug
 *   POST /api/refresh
 *   GET  /api/reviews/:slug                   (list reviews + aggregate)
 *   POST /api/reviews/:slug                   (submit review)
 *   POST /api/reviews/:slug/:id/flag          (flag a review → emails support)
 *   everything else  → static frontend from ./public/, with SPA fallback to index.html
 *
 * Env:
 *   PORT (default 3000)
 *   HOST (default 0.0.0.0)
 *   RUNNETH_APPS_REF (default main)  — git ref of Motion-Creative/runneth-apps to read from
 *   REVIEWS_DB_PATH                  — SQLite file path (default ./reviews.db)
 *   RESEND_API_KEY                   — flag-email transport (falls back to log-only)
 *   FLAG_TO_EMAIL                    — flag recipient (default support@motionapp.com)
 *   FLAG_FROM_EMAIL                  — flag sender (default onboarding@resend.dev)
 *   IP_HASH_SECRET                   — server-side salt for hashing IPs (rate-limit cohort key)
 */
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'

import { assembleCatalog, cacheStats, clearCache, loadUseCaseDetail } from './github.js'
import {
  createReport,
  createReview,
  dbPath,
  getAggregate,
  getAllAggregates,
  getReview,
  getReviews,
  hasRecentFromIp,
} from './db.js'
import { sendFlagEmail } from './email.js'
import { SLUG_RE, hashIp, validateFlag, validateReview } from './reviews.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '..', 'public')

const server = Fastify({ logger: { level: process.env.LOG_LEVEL ?? 'info' } })

server.log.info(`reviews db: ${dbPath}`)

server.get('/api/health', async () => ({
  ok: true,
  cache: cacheStats(),
  reviews_db: dbPath,
}))

server.get('/api/catalog', async (_, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  reply.header('cache-control', 'public, max-age=30')
  try {
    const catalog = await assembleCatalog()
    const aggregates = getAllAggregates()
    const ratings: Record<string, { count: number; average: number }> = {}
    for (const u of catalog.use_cases) {
      ratings[u.slug] = aggregates[u.slug] ?? { count: 0, average: 0 }
    }
    return { ...catalog, ratings }
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

server.get<{ Params: { slug: string } }>('/api/reviews/:slug', async (request, reply) => {
  const { slug } = request.params
  if (!SLUG_RE.test(slug)) {
    reply.code(400)
    return { error: 'invalid_slug' }
  }
  reply.header('content-type', 'application/json; charset=utf-8')
  reply.header('cache-control', 'no-store')
  const reviews = getReviews(slug).map((r) => ({
    id: r.id,
    name: r.name,
    stars: r.stars,
    text: r.text,
    created_at: r.created_at,
  }))
  return { slug, aggregate: getAggregate(slug), reviews }
})

server.post<{ Params: { slug: string } }>('/api/reviews/:slug', async (request, reply) => {
  const { slug } = request.params
  if (!SLUG_RE.test(slug)) {
    reply.code(400)
    return { error: 'invalid_slug' }
  }
  const parsed = validateReview(request.body)
  if ('errors' in parsed) {
    reply.code(400)
    return { error: 'validation_failed', details: parsed.errors }
  }
  const ipHash = hashIp(request.ip)
  if (hasRecentFromIp(slug, ipHash, '-1 day')) {
    reply.code(429)
    return { error: 'rate_limited', message: 'You already reviewed this in the last 24 hours.' }
  }
  const id = createReview(slug, parsed.value.name, parsed.value.stars, parsed.value.text, ipHash)
  reply.code(201)
  return {
    ok: true,
    review: {
      id,
      slug,
      name: parsed.value.name,
      stars: parsed.value.stars,
      text: parsed.value.text,
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
    },
    aggregate: getAggregate(slug),
  }
})

server.post<{ Params: { slug: string; id: string } }>(
  '/api/reviews/:slug/:id/flag',
  async (request, reply) => {
    const { slug, id } = request.params
    if (!SLUG_RE.test(slug)) {
      reply.code(400)
      return { error: 'invalid_slug' }
    }
    const reviewId = Number(id)
    if (!Number.isFinite(reviewId) || reviewId <= 0) {
      reply.code(400)
      return { error: 'invalid_review_id' }
    }
    const parsed = validateFlag(request.body)
    if ('errors' in parsed) {
      reply.code(400)
      return { error: 'validation_failed', details: parsed.errors }
    }
    const review = getReview(reviewId)
    if (!review || review.slug !== slug) {
      reply.code(404)
      return { error: 'review_not_found' }
    }
    const ipHash = hashIp(request.ip)
    createReport(reviewId, parsed.value.reason, ipHash)
    // Fire-and-forget the email — we don't want to block the user response on SMTP.
    sendFlagEmail(
      {
        reviewId,
        slug,
        reviewerName: review.name,
        stars: review.stars,
        reviewText: review.text,
        reason: parsed.value.reason,
        flaggedAt: new Date().toISOString(),
      },
      (msg) => server.log.info(msg),
    ).catch((err) => {
      server.log.error({ err }, 'flag email failed')
    })
    return { ok: true }
  },
)

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
  // Prune stale entries to keep the Map bounded.
  for (const [k, t] of lastRefreshByIp) if (now - t > 60_000) lastRefreshByIp.delete(k)
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
