/**
 * asset-db.ts — Read-only database access for the Node.js app backend.
 * Reads from the SQLite DB written by the Python pipeline.
 * Uses Node's native node:sqlite (DatabaseSync — synchronous, no await needed).
 */

import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'

const DB_PATH    = '{{BRAIN_PATH}}/{{DB_FILENAME}}'
const CLIPS_DIR  = '{{BRAIN_PATH}}/clips'
const SOURCES_DIR = '{{BRAIN_PATH}}/sources'

let _db: DatabaseSync | null = null
const db = (): DatabaseSync => {
  if (_db === null) _db = new DatabaseSync(DB_PATH)
  return _db
}

const countOf = (row: unknown): number => {
  if (!row) return 0
  const v = Object.values(row as Record<string, unknown>)[0]
  return typeof v === 'number' ? v : parseInt(String(v ?? '0'), 10) || 0
}

export const clipUrlById = (clipPath: string | null): string | null => {
  if (!clipPath) return null
  return `/api/media/clips/${encodeURIComponent(path.basename(clipPath))}`
}

export const sourceUrlById = (shotId: string, sourceVideo: string | null): string | null => {
  if (!sourceVideo) return null
  return `/api/media/source/${shotId}`
}

const formatTC = (secs: number): string => {
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

const enrich = (r: Record<string, unknown>) => ({
  ...r,
  clip_url:   clipUrlById(r.clip_path as string | null),
  source_url: sourceUrlById(r.id as string, r.source_video as string | null),
  tc_display: `${formatTC(r.timecode_start as number)} → ${formatTC(r.timecode_end as number)}`,
})

// ── Status ────────────────────────────────────────────────────────────────────

export const getStatus = () => ({
  total_shots:      countOf(db().prepare('SELECT COUNT(*) FROM shots').get()),
  total_videos:     countOf(db().prepare('SELECT COUNT(DISTINCT source_filename) FROM shots').get()),
  processing_count: countOf(db().prepare("SELECT COUNT(*) FROM source_videos WHERE status IN ('pending','processing')").get()),
  last_processed_at: (() => {
    const r = db().prepare('SELECT MAX(processed_at) FROM shots').get() as Record<string, unknown>
    return r ? (String(Object.values(r)[0] ?? '') || null) : null
  })(),
})

// ── Browse ────────────────────────────────────────────────────────────────────

export const getShots = (limit = 100, offset = 0, sort = 'recency') => {
  const order = sort === 'folder' ? 'source_folder ASC, processed_at DESC' : 'processed_at DESC'
  const rows = db().prepare(`
    SELECT id, source_video, source_filename, source_folder,
           timecode_start, timecode_end, shot_type, people_in_frame,
           product_in_frame, talking_direction, shooting_style,
           concept_action_type, description, clip_path, processed_at
    FROM shots ORDER BY ${order} LIMIT ? OFFSET ?
  `).all(limit, offset) as Record<string, unknown>[]
  return rows.map(enrich)
}

export const getTotalShotCount = () =>
  countOf(db().prepare('SELECT COUNT(*) FROM shots').get())

export const getShotById = (id: string) => {
  const row = db().prepare(`
    SELECT id, source_video, source_filename, source_folder,
           timecode_start, timecode_end, shot_type, people_in_frame,
           product_in_frame, talking_direction, shooting_style,
           concept_action_type, description, clip_path, processed_at
    FROM shots WHERE id=?
  `).get(id) as Record<string, unknown> | null
  return row ? enrich(row) : null
}

// ── Vector search ─────────────────────────────────────────────────────────────

export const getAllShotsForVectorSearch = () => {
  const rows = db().prepare(`
    SELECT id, source_video, source_filename, source_folder,
           timecode_start, timecode_end, shot_type, people_in_frame,
           product_in_frame, talking_direction, shooting_style,
           concept_action_type, description, clip_path, embedding
    FROM shots WHERE embedding IS NOT NULL
  `).all() as Array<Record<string, unknown> & { embedding: Uint8Array }>

  return rows.map(r => ({
    id:                  r.id as string,
    source_video:        r.source_video as string,
    source_filename:     r.source_filename as string,
    source_folder:       r.source_folder as string | null,
    timecode_start:      r.timecode_start as number,
    timecode_end:        r.timecode_end as number,
    shot_type:           r.shot_type as string | null,
    people_in_frame:     r.people_in_frame as string | null,
    product_in_frame:    r.product_in_frame as string | null,
    talking_direction:   r.talking_direction as string | null,
    shooting_style:      r.shooting_style as string | null,
    concept_action_type: r.concept_action_type as string | null,
    description:         r.description as string | null,
    clip_path:           r.clip_path as string | null,
    clip_url:            clipUrlById(r.clip_path as string | null),
    source_url:          sourceUrlById(r.id as string, r.source_video as string | null),
    tc_display:          `${formatTC(r.timecode_start as number)} → ${formatTC(r.timecode_end as number)}`,
    vec: new Float32Array(r.embedding.buffer, r.embedding.byteOffset, r.embedding.byteLength / 4),
  }))
}

// ── FTS5 BM25 (hybrid search leg) ────────────────────────────────────────────

export const ftsSearch = (queryText: string, limit = 50): Array<{ shot_id: string }> => {
  const safe = queryText.replace(/[^a-zA-Z0-9\s]/g, ' ').trim().replace(/\s+/g, ' ')
  if (!safe) return []
  try {
    return db().prepare(
      'SELECT shot_id FROM chunks_fts WHERE chunks_fts MATCH ? ORDER BY bm25(chunks_fts) LIMIT ?'
    ).all(safe, limit) as Array<{ shot_id: string }>
  } catch {
    return []
  }
}

export { CLIPS_DIR, SOURCES_DIR }
