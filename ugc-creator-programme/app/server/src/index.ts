import { readFileSync, existsSync } from 'node:fs'
import Fastify from 'fastify'

import {
  loadBuildethMemoryTools,
  loadBuildethMotionTools,
  loadBuildethReminderTools,
  runWithBuildethToolRuntime,
} from './buildeth-tools.js'
import { getSqliteInfo } from './sqlite.js'
import { runWithBuildethRuntime, type BuildethRuntimeContext } from './runtime.js'

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

const server = Fastify({ logger: false })

type InjectMethod = 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT'

// ── Creator data path ─────────────────────────────────────────────────────────
// Reads from the brain seed installed at setup time.
// Update this path if you move the creators.json file.
const CREATORS_DATA_PATH = '/agent/brain/ugc-creator-programme/creators.json'

server.get('/api/health', async () => ({ ok: true }))

server.get('/api/creators', async (_, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  if (!existsSync(CREATORS_DATA_PATH)) {
    reply.status(404)
    return { error: `creators.json not found at ${CREATORS_DATA_PATH}. Run the setup skill to populate creator data.` }
  }
  try {
    const raw = readFileSync(CREATORS_DATA_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    reply.status(500)
    return { error: 'Failed to parse creators.json', detail: String(err) }
  }
})

server.get('/api/sqlite', async (_, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  return { ok: true, sqlite: getSqliteInfo() }
})

server.all('/api/echo', async (request, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  return { body: JSON.stringify(request.body ?? ''), method: request.method }
})

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
    case 'PATCH': case 'POST': case 'PUT': return normalized
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
