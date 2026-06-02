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
 *   GET  /one-pager                           (customer-facing capabilities one-pager, standalone HTML)
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
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import fastifyMultipart from '@fastify/multipart'

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
import { sendBrainChecklistEmail, type BrainChecklistFile, type BrainChecklistSection } from './brain-checklist-email.js'
import { sendBrainChecklistSlack } from './brain-checklist-slack.js'
import { SLUG_RE, hashIp, validateFlag, validateReview } from './reviews.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = resolve(__dirname, '..', 'public')

// Standalone marketing pages bundled with the server (copied from src/ on build).
// Read once at startup so requests are served from memory.
const ONE_PAGER_HTML = readFileSync(resolve(__dirname, 'one-pager.html'), 'utf-8')
const HOW_TO_BUILD_THE_BRAIN_HTML = readFileSync(resolve(__dirname, 'how-to-build-the-brain.html'), 'utf-8')

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

// Multipart support for the brain-checklist endpoint.
// 10MB per file, 25MB total cap enforced inside the handler.
await server.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 30,
    fields: 30,
  },
})

// Brain checklist submission from the customer-facing /how-to-build-the-brain page.
// Accepts multipart form with text fields (workspace_name, contact_email,
// <section>_context) and file fields (<section>_files). Routes the submission to
// the CSM team via email with files attached. See brain-checklist-email.ts.
const BRAIN_CHECKLIST_SECTIONS: ReadonlyArray<{ key: string; label: string }> = [
  { key: 'brand_context', label: 'Brand context' },
  { key: 'customer_reviews', label: 'Customer reviews and voice of customer' },
  { key: 'personas', label: 'Persona and ICP docs' },
  { key: 'product_catalog', label: 'Product catalog' },
  { key: 'winning_briefs', label: 'Past winning briefs and concepts' },
  { key: 'other', label: 'Anything else' },
]
const BRAIN_CHECKLIST_FIELD_KEYS = new Set(BRAIN_CHECKLIST_SECTIONS.map((s) => s.key))
const BRAIN_CHECKLIST_MAX_TOTAL_BYTES = 25 * 1024 * 1024

server.post('/api/brain-checklist', async (req, reply) => {
  if (!req.isMultipart()) {
    reply.code(400)
    return { error: 'invalid_request', message: 'Expected multipart/form-data.' }
  }

  let workspaceName = ''
  let contactEmail = ''
  const contextByKey: Record<string, string> = {}
  const filesByKey: Record<string, BrainChecklistFile[]> = {}
  let totalBytes = 0

  try {
    const parts = req.parts()
    for await (const part of parts) {
      if (part.type === 'field') {
        const name = String(part.fieldname)
        const value = typeof part.value === 'string' ? part.value : ''
        if (name === 'workspace_name') workspaceName = value.trim().slice(0, 200)
        else if (name === 'contact_email') contactEmail = value.trim().slice(0, 200)
        else if (name.endsWith('_context')) {
          const key = name.slice(0, -'_context'.length)
          if (BRAIN_CHECKLIST_FIELD_KEYS.has(key)) {
            contextByKey[key] = value.trim().slice(0, 4000)
          }
        }
      } else if (part.type === 'file') {
        const name = String(part.fieldname)
        if (!name.endsWith('_files')) {
          await part.toBuffer() // drain
          continue
        }
        const key = name.slice(0, -'_files'.length)
        if (!BRAIN_CHECKLIST_FIELD_KEYS.has(key)) {
          await part.toBuffer()
          continue
        }
        const buf = await part.toBuffer()
        if (part.file.truncated) {
          reply.code(413)
          return { error: 'file_too_large', message: `${part.filename} is over the 10MB per-file limit.` }
        }
        totalBytes += buf.length
        if (totalBytes > BRAIN_CHECKLIST_MAX_TOTAL_BYTES) {
          reply.code(413)
          return { error: 'payload_too_large', message: 'Total upload is over 25MB. Please trim it down or split into two submissions.' }
        }
        if (!filesByKey[key]) filesByKey[key] = []
        filesByKey[key].push({
          field: key,
          filename: part.filename || 'unnamed',
          mimeType: part.mimetype || 'application/octet-stream',
          buffer: buf,
        })
      }
    }
  } catch (err) {
    server.log.error({ err }, 'brain-checklist multipart parse failed')
    reply.code(400)
    return { error: 'parse_failed', message: 'Could not parse the submission. Please try again.' }
  }

  if (!workspaceName) {
    reply.code(400)
    return { error: 'missing_workspace_name', message: 'Workspace or brand name is required.' }
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!contactEmail || !emailRe.test(contactEmail)) {
    reply.code(400)
    return { error: 'invalid_email', message: 'A valid contact email is required.' }
  }

  const sections: BrainChecklistSection[] = BRAIN_CHECKLIST_SECTIONS.map((s) => ({
    key: s.key,
    label: s.label,
    context: contextByKey[s.key] || '',
    files: (filesByKey[s.key] || []).map((f) => ({ filename: f.filename, sizeBytes: f.buffer.length })),
  }))
  const flatFiles: BrainChecklistFile[] = []
  for (const key of BRAIN_CHECKLIST_FIELD_KEYS) {
    for (const f of filesByKey[key] || []) flatFiles.push(f)
  }

  const hasAnything = flatFiles.length > 0 || sections.some((s) => s.context.length > 0)
  if (!hasAnything) {
    reply.code(400)
    return { error: 'empty_submission', message: 'Add at least one file or some context to send.' }
  }

  const submission = {
    workspaceName,
    contactEmail,
    sections,
    files: flatFiles,
    submittedAt: new Date().toISOString(),
  }
  const logInfo = (msg: string): void => server.log.info(msg)

  // Slack is the primary delivery surface when configured. Email is kept as a
  // parallel channel so we have a durable inbox copy.
  const slackResult = await sendBrainChecklistSlack(submission, logInfo)
  const emailResult = await sendBrainChecklistEmail(submission, logInfo)

  if (!slackResult.ok && !emailResult.ok) {
    reply.code(502)
    return { error: 'delivery_failed', message: slackResult.message || emailResult.message }
  }
  return { ok: true }
})

// Standalone marketing pages. Registered before the static handler so they
// resolve cleanly with or without a trailing slash.
server.get('/one-pager', async (_, reply) => {
  reply.header('content-type', 'text/html; charset=utf-8')
  reply.header('cache-control', 'public, max-age=300')
  return ONE_PAGER_HTML
})
server.get('/one-pager/', async (_, reply) => {
  reply.header('content-type', 'text/html; charset=utf-8')
  reply.header('cache-control', 'public, max-age=300')
  return ONE_PAGER_HTML
})
server.get('/how-to-build-the-brain', async (_, reply) => {
  reply.header('content-type', 'text/html; charset=utf-8')
  reply.header('cache-control', 'public, max-age=300')
  return HOW_TO_BUILD_THE_BRAIN_HTML
})
server.get('/how-to-build-the-brain/', async (_, reply) => {
  reply.header('content-type', 'text/html; charset=utf-8')
  reply.header('cache-control', 'public, max-age=300')
  return HOW_TO_BUILD_THE_BRAIN_HTML
})

// Static frontend.
await server.register(fastifyStatic, {
  root: PUBLIC_DIR,
  prefix: '/',
  wildcard: false,
})

// Personal pages — standalone HTML routes served from server/public.
// Each entry maps a clean URL to a file in PUBLIC_DIR.
const PERSONAL_PAGES: Record<string, string> = {
  '/alysha': 'alysha.html',
}
for (const [route, file] of Object.entries(PERSONAL_PAGES)) {
  server.get(route, async (_, reply) => {
    return reply.sendFile(file)
  })
}

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
