import fs from 'node:fs'
import path from 'node:path'

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

const server = Fastify({
  logger: false,
})

type InjectMethod = 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT'

server.get('/api/health', async () => {
  return {
    ok: true,
  }
})

server.get('/api/hello', async (_, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  return {
    message: 'Hello from your Buildeth app backend',
  }
})

server.get('/api/sqlite', async (_, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  return {
    ok: true,
    sqlite: getSqliteInfo(),
  }
})

server.all('/api/echo', async (request, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  return {
    body: JSON.stringify(request.body ?? ''),
    method: request.method,
  }
})

interface FsEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modified?: string
}

server.get<{ Querystring: { dir?: string } }>('/api/fs/list', async (request, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  const rawDir = request.query.dir ?? '/'
  // Sanitize: resolve to absolute, disallow path traversal tricks
  const resolved = path.resolve('/', rawDir.replace(/\0/g, ''))

  try {
    const entries = fs.readdirSync(resolved, { withFileTypes: true })
    const result: FsEntry[] = entries.map((e) => {
      const fullPath = path.join(resolved, e.name)
      let size: number | undefined
      let modified: string | undefined
      try {
        const stat = fs.statSync(fullPath)
        size = stat.size
        modified = stat.mtime.toISOString()
      } catch {
        // ignore stat errors
      }
      // Follow symlinks when determining type
      let isDir = e.isDirectory()
      if (!isDir && e.isSymbolicLink()) {
        try { isDir = fs.statSync(fullPath).isDirectory() } catch { /* broken symlink */ }
      }
      return {
        name: e.name,
        path: fullPath,
        type: isDir ? 'directory' : 'file',
        size,
        modified,
      }
    })
    // Directories first, then files, both alphabetically
    result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return { ok: true, path: resolved, entries: result }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    reply.status(400)
    return { ok: false, error: message }
  }
})

server.get<{ Querystring: { path?: string } }>('/api/fs/read', async (request, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  const rawPath = request.query.path ?? ''
  if (!rawPath) {
    reply.status(400)
    return { ok: false, error: 'Missing path parameter' }
  }
  const resolved = path.resolve('/', rawPath.replace(/\0/g, ''))
  try {
    const stat = fs.statSync(resolved)
    if (stat.isDirectory()) {
      reply.status(400)
      return { ok: false, error: 'Path is a directory' }
    }
    // Limit file reads to 500 KB to keep responses manageable
    const MAX = 512 * 1024
    if (stat.size > MAX) {
      return { ok: true, path: resolved, truncated: true, content: null, size: stat.size }
    }
    const content = fs.readFileSync(resolved, 'utf8')
    return { ok: true, path: resolved, truncated: false, content, size: stat.size }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    reply.status(400)
    return { ok: false, error: message }
  }
})

server.post<{ Body: { path?: string; content?: string } }>('/api/fs/write', async (request, reply) => {
  reply.header('content-type', 'application/json; charset=utf-8')
  const { path: rawPath, content } = request.body ?? {}
  if (!rawPath) { reply.status(400); return { ok: false, error: 'Missing path' } }
  if (content === undefined) { reply.status(400); return { ok: false, error: 'Missing content' } }
  const resolved = path.resolve('/', rawPath.replace(/\0/g, ''))
  try {
    fs.writeFileSync(resolved, content, 'utf8')
    return { ok: true, path: resolved }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    reply.status(400)
    return { ok: false, error: message }
  }
})

const toResponseHeaders = (
  headers: Readonly<Record<string, number | string | readonly string[] | undefined>>
): Readonly<Record<string, string>> => {
  const resolved: Record<string, string> = {}

  for (const [key, rawValue] of Object.entries(headers)) {
    if (typeof rawValue === 'undefined') {
      continue
    }

    if (Array.isArray(rawValue)) {
      resolved[key] = rawValue.join(',')
      continue
    }

    resolved[key] = String(rawValue)
  }

  return resolved
}

const resolveInjectMethod = (rawMethod: string): InjectMethod => {
  const normalized = rawMethod.toUpperCase()
  switch (normalized) {
    case 'DELETE':
    case 'GET':
    case 'HEAD':
    case 'OPTIONS':
    case 'PATCH':
    case 'POST':
    case 'PUT':
      return normalized
    default:
      throw new Error(`Unsupported HTTP method: ${rawMethod}`)
  }
}

const resolveInjectPayload = (
  payload: unknown
): Readonly<Record<string, unknown>> | readonly unknown[] | string | Uint8Array | undefined => {
  if (typeof payload === 'undefined' || payload === null) {
    return undefined
  }

  if (typeof payload === 'string') {
    return payload
  }

  if (payload instanceof Uint8Array) {
    return payload
  }

  if (payload instanceof ArrayBuffer) {
    return Buffer.from(payload)
  }

  if (ArrayBuffer.isView(payload)) {
    return Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength)
  }

  if (Array.isArray(payload)) {
    return payload
  }

  if (typeof payload === 'object') {
    return payload as Readonly<Record<string, unknown>>
  }

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
