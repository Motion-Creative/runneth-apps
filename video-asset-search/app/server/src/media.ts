import { statSync, openSync, readSync, closeSync, existsSync } from 'node:fs'
import path from 'node:path'
import type { FastifyReply } from 'fastify'

// Paths resolved at runtime from asset-db.ts
export const CLIPS_DIR   = '{{BRAIN_PATH}}/clips'
export const SOURCES_DIR = '{{BRAIN_PATH}}/sources'

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.m4v': 'video/x-m4v',
  '.webm': 'video/webm',
}
const mimeFor = (p: string) => MIME[path.extname(p).toLowerCase()] ?? 'application/octet-stream'

const readRange = (filePath: string, start: number, end: number): Buffer => {
  const len = end - start + 1
  const buf = Buffer.alloc(len)
  const fd = openSync(filePath, 'r')
  try { readSync(fd, buf, 0, len, start) } finally { closeSync(fd) }
  return buf
}

const parseRange = (header: string, size: number): [number, number] => {
  const m = header.match(/bytes=(\d*)-(\d*)/)
  const start = m?.[1] ? parseInt(m[1], 10) : 0
  const end   = m?.[2] ? parseInt(m[2], 10) : size - 1
  return [Math.max(0, start), Math.min(end, size - 1)]
}

export const serveClip = (filename: string, reply: FastifyReply): Buffer | null => {
  if (filename.includes('/') || filename.includes('..')) return null
  const fp = path.join(CLIPS_DIR, filename)
  if (!existsSync(fp)) return null
  const stat = statSync(fp)
  reply.status(200).headers({
    'Content-Type': mimeFor(fp),
    'Content-Length': stat.size,
    'Accept-Ranges': 'bytes',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    'Cache-Control': 'public, max-age=86400',
  })
  return readRange(fp, 0, stat.size - 1)
}

// Serve a source video by its absolute path on disk (used by the shot-ID endpoint)
export const serveSourceByAbsPath = (absPath: string, rangeHeader: string | undefined, reply: FastifyReply): Buffer | null => {
  const fp = absPath
  if (!fp.startsWith(SOURCES_DIR) || !existsSync(fp)) return null
  return _rangeServe(fp, rangeHeader, reply)
}

const _rangeServe = (fp: string, rangeHeader: string | undefined, reply: FastifyReply): Buffer | null => {
  const stat  = statSync(fp)
  const size  = stat.size
  const mime  = mimeFor(fp)

  if (rangeHeader) {
    const [start, end] = parseRange(rangeHeader, size)
    reply.status(206).headers({ 'Content-Type': mime, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 })
    return readRange(fp, start, end)
  }

  const probeEnd = Math.min(262143, size - 1)
  reply.status(206).headers({ 'Content-Type': mime, 'Content-Range': `bytes 0-${probeEnd}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': probeEnd + 1 })
  return readRange(fp, 0, probeEnd)
}

export const serveSource = (encodedPath: string, rangeHeader: string | undefined, reply: FastifyReply): Buffer | null => {
  let rel: string
  try { rel = decodeURIComponent(encodedPath) } catch { return null }
  const fp = path.resolve(SOURCES_DIR, rel)
  if (!fp.startsWith(SOURCES_DIR) || !existsSync(fp)) return null
  return _rangeServe(fp, rangeHeader, reply)
}
