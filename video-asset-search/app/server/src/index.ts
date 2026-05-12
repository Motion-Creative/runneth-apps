import Fastify from 'fastify'
import fs from 'node:fs'
import path from 'node:path'
import {
  loadBuildethMemoryTools, loadBuildethMotionTools,
  loadBuildethReminderTools, runWithBuildethToolRuntime,
} from './buildeth-tools.js'
import { runWithBuildethRuntime, type BuildethRuntimeContext } from './runtime.js'
import {
  getStatus, getShots, getShotById, getTotalShotCount,
  CLIPS_DIR, SOURCES_DIR,
} from './asset-db.js'
import { serveClip, serveSource, serveSourceByAbsPath } from './media.js'
import { hybridSearch } from './search-hybrid.js'

const server = Fastify({ logger: false })

server.get('/api/health', async () => ({ ok: true }))

server.get('/api/status', async (_, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  try { return getStatus() } catch (e) { reply.status(500); return { error: String(e) } }
})

server.get('/api/shots', async (request, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  const q = request.query as Record<string, string>
  try {
    return {
      shots: getShots(Math.min(parseInt(q.limit ?? '200', 10), 500), parseInt(q.offset ?? '0', 10), q.sort === 'folder' ? 'folder' : 'recency'),
      total: getTotalShotCount(),
    }
  } catch (e) { reply.status(500); return { error: String(e) } }
})

server.get('/api/shots/:id', async (request, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  const { id } = request.params as { id: string }
  const shot = getShotById(id)
  if (!shot) { reply.status(404); return { error: 'Not found' } }
  return shot
})

server.post('/api/search-vector', async (request, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  const body      = request.body as { vector?: number[]; limit?: number; query?: string }
  const vector    = body?.vector
  const limit     = body?.limit ?? 200
  const queryText = body?.query ?? ''

  if (!Array.isArray(vector) || vector.length !== 384) {
    reply.status(400); return { error: 'vector must be a 384-element number array' }
  }

  try {
    return hybridSearch(queryText, vector, limit)
  } catch (e) { reply.status(500); return { error: String(e) } }
})

// Source video by shot ID (avoids URL encoding issues with complex filenames)
server.get('/api/media/source/:shotId', async (request, reply) => {
  const { shotId } = request.params as { shotId: string }
  const shot = getShotById(shotId) as Record<string,unknown> | null
  const sourceVideoPath = shot?.source_video as string | undefined
  if (!shot || !sourceVideoPath) { reply.status(404); return reply.send(Buffer.from('Not found')) }
  const body = serveSourceByAbsPath(sourceVideoPath, request.headers['range'], reply)
  if (!body) { reply.status(404); return reply.send(Buffer.from('Not found')) }
  return reply.send(body)
})

server.get('/api/media/clips/:filename', async (request, reply) => {
  const { filename } = request.params as { filename: string }
  const body = serveClip(filename, reply)
  if (!body) { reply.status(404); return reply.send(Buffer.from('Not found')) }
  return reply.send(body)
})

server.get('/api/media/sources/*', async (request, reply) => {
  const rawPath     = (request.params as { '*': string })['*']
  const rangeHeader = request.headers['range']
  const body = serveSource(rawPath, rangeHeader, reply)
  if (!body) { reply.status(404); return reply.send(Buffer.from('Not found')) }
  return reply.send(body)
})

type InjectMethod = 'DELETE'|'GET'|'HEAD'|'OPTIONS'|'PATCH'|'POST'|'PUT'
const toResponseHeaders = (h: Record<string,number|string|readonly string[]|undefined>): Record<string,string> => {
  const o: Record<string,string> = {}
  for (const [k,v] of Object.entries(h)) {
    if (v===undefined) continue
    o[k] = Array.isArray(v) ? (v as string[]).join(',') : String(v)
  }
  return o
}
const resolveMethod = (m: string): InjectMethod => {
  const n = m.toUpperCase()
  if (['DELETE','GET','HEAD','OPTIONS','PATCH','POST','PUT'].includes(n)) return n as InjectMethod
  throw new Error(`Unsupported: ${m}`)
}
const resolvePayload = (p: unknown) => {
  if (p==null) return undefined
  if (typeof p==='string'||p instanceof Uint8Array) return p
  if (p instanceof ArrayBuffer) return Buffer.from(p)
  if (ArrayBuffer.isView(p)) return Buffer.from((p as ArrayBufferView).buffer)
  if (Array.isArray(p)||typeof p==='object') return p as Record<string,unknown>
  return String(p)
}
const serverReady = server.ready()

export { loadBuildethMemoryTools, loadBuildethMotionTools, loadBuildethReminderTools, runWithBuildethToolRuntime } from './buildeth-tools.js'
export { buildBuildethCliInvocation, execBuildethCli, getBuildethRuntime, type BuildethCliInput, type BuildethCliInvocation, type BuildethCliName, type BuildethCliResult, type BuildethRuntimeContext } from './runtime.js'

export const handleRequest = async (request: {
  method: string; path: string; headers: Readonly<Record<string,string>>; body?: unknown; runtime: BuildethRuntimeContext
}): Promise<{ status: number; headers?: Readonly<Record<string,string>>; body?: unknown }> => {
  return await runWithBuildethRuntime(request.runtime, async () =>
    await runWithBuildethToolRuntime(request.runtime, async () => {
      await serverReady
      const r = await server.inject({ headers: request.headers, method: resolveMethod(request.method), payload: resolvePayload(request.body), url: request.path })
      return { status: r.statusCode, headers: toResponseHeaders(r.headers), body: r.rawPayload }
    })
  )
}
