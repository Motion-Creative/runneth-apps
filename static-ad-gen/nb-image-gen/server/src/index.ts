import { readFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, resolve as resolvePath } from 'node:path'
import Fastify from 'fastify'
import {
  loadBuildethMemoryTools,
  loadBuildethMotionTools,
  loadBuildethReminderTools,
  runWithBuildethToolRuntime,
} from './buildeth-tools.js'
import { runWithBuildethRuntime, type BuildethRuntimeContext } from './runtime.js'

// ─── Server ────────────────────────────────────────────────────────────────

const server = Fastify({ logger: false, bodyLimit: 10 * 1024 * 1024 })

// Strip Content-Length before Fastify's body parser sees it.
// The buildeth proxy layer modifies request bodies after Content-Length is set,
// causing FST_ERR_CTP_INVALID_CONTENT_LENGTH on large POSTs.
server.addHook('onRequest', async (req) => {
  delete (req.headers as Record<string, string | undefined>)['content-length']
})

type InjectMethod = 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT'

// ─── Health ────────────────────────────────────────────────────────────────
server.get('/api/health', async () => ({ ok: true, service: 'nb-image-gen' }))

// ─── Reference image CDN ────────────────────────────────────────────────────
// GET /api/ref-images/:brand/:product/:filename
// Serves any adgen reference image at a stable public URL for NB2 imageUrls.
// Security: path components must be alphanumeric/hyphen/underscore/dot only.
// Resolved path must stay under /agent/brain — no directory traversal.

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp']
const BRAIN_ROOT  = '/agent/brain'

function safeReadImage(filePath: string): Buffer | null {
  try {
    const ext = filePath.toLowerCase().slice(filePath.lastIndexOf('.'))
    if (!ALLOWED_EXT.includes(ext)) return null
    const resolved = resolvePath(filePath)
    if (!resolved.startsWith(BRAIN_ROOT)) return null
    if (!existsSync(resolved)) return null
    return readFileSync(resolved)
  } catch {
    return null
  }
}

server.get('/api/ref-images/:brand/:product/:filename', async (request, reply) => {
  const { brand, product, filename } = request.params as {
    brand: string; product: string; filename: string
  }

  // Sanitise path components — no dots-only segments, no traversal
  const safe = (s: string) => /^[a-zA-Z0-9_\-\.]+$/.test(s) && !s.startsWith('..')
  if (!safe(brand) || !safe(product) || !safe(filename)) {
    reply.status(400); return { error: 'Invalid path' }
  }

  const filePath = `${BRAIN_ROOT}/${brand}/adgen/${product}/reference-images/${filename}`
  const buf = safeReadImage(filePath)
  if (!buf) { reply.status(404); return { error: 'Not found' } }

  const ext = filename.toLowerCase()
  const mime = ext.endsWith('.png') ? 'image/png' : ext.endsWith('.webp') ? 'image/webp' : 'image/jpeg'
  reply.header('Content-Type', mime)
  reply.header('Cache-Control', 'public, max-age=86400')
  return reply.send(buf)
})

// ─── Buildeth plumbing ──────────────────────────────────────────────────────

const toResponseHeaders = (
  headers: Readonly<Record<string, number | string | readonly string[] | undefined>>
): Readonly<Record<string, string>> => {
  const resolved: Record<string, string> = {}
  for (const [key, rawValue] of Object.entries(headers)) {
    if (typeof rawValue === 'undefined') continue
    if (Array.isArray(rawValue)) { resolved[key] = rawValue.join(','); continue }
    resolved[key] = String(rawValue)
  }
  return resolved
}

const resolveInjectMethod = (rawMethod: string): InjectMethod => {
  const normalized = rawMethod.toUpperCase()
  switch (normalized) {
    case 'DELETE': case 'GET': case 'HEAD': case 'OPTIONS':
    case 'PATCH':  case 'POST': case 'PUT': return normalized
    default: throw new Error(`Unsupported HTTP method: ${rawMethod}`)
  }
}

const resolveInjectPayload = (
  payload: unknown
): Readonly<Record<string, unknown>> | readonly unknown[] | string | Uint8Array | undefined => {
  if (typeof payload === 'undefined' || payload === null) return undefined
  if (typeof payload === 'string') return payload
  if (payload instanceof Uint8Array) return payload
  if (payload instanceof ArrayBuffer) return Buffer.from(payload)
  if (ArrayBuffer.isView(payload)) return Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength)
  if (Array.isArray(payload)) return payload
  if (typeof payload === 'object') return payload as Readonly<Record<string, unknown>>
  return String(payload)
}

const serverReady = server.ready()

export {
  loadBuildethMemoryTools,
  loadBuildethMotionTools,
  loadBuildethReminderTools,
  runWithBuildethToolRuntime,
} from './buildeth-tools.js'

export {
  buildBuildethCliInvocation,
  execBuildethCli,
  getBuildethRuntime,
  type BuildethCliInput,
  type BuildethCliInvocation,
  type BuildethCliName,
  type BuildethCliResult,
  type BuildethRuntimeContext,
} from './runtime.js'

export type BuildethBackendRequest = Readonly<{
  method: string
  path: string
  headers: Readonly<Record<string, string>>
  body?: unknown
  runtime: BuildethRuntimeContext
}>

export type BuildethBackendResponse = Readonly<{
  status: number
  headers?: Readonly<Record<string, string>>
  body?: unknown
}>

export const handleRequest = async (
  request: BuildethBackendRequest
): Promise<BuildethBackendResponse> => {
  return await runWithBuildethRuntime(request.runtime, async () => {
    return await runWithBuildethToolRuntime(request.runtime, async () => {
      await serverReady
      const response = await server.inject({
        headers: request.headers,
        method: resolveInjectMethod(request.method),
        payload: resolveInjectPayload(request.body),
        url: request.path,
      })
      return {
        status: response.statusCode,
        headers: toResponseHeaders(response.headers),
        body: response.rawPayload,
      }
    })
  })
}
