/**
 * SQLite-backed reviews + report store.
 *
 * Persistence: DB file path comes from REVIEWS_DB_PATH (default ./reviews.db).
 * On Railway this should point at a mounted volume path like /data/reviews.db.
 *
 * Schema is migrated on boot — safe to re-run.
 */
import Database from 'better-sqlite3'
import { dirname } from 'node:path'
import { mkdirSync } from 'node:fs'

export type ReviewRow = Readonly<{
  id: number
  slug: string
  name: string
  stars: number
  text: string
  created_at: string
  hidden: number
}>

export type Aggregate = Readonly<{
  count: number
  average: number | null
  distribution: Readonly<{ 1: number; 2: number; 3: number; 4: number; 5: number }>
}>

const DB_PATH = process.env.REVIEWS_DB_PATH || './reviews.db'

const dir = dirname(DB_PATH)
if (dir && dir !== '.' && dir !== '/') {
  try {
    mkdirSync(dir, { recursive: true })
  } catch {
    /* dir may already exist */
  }
}

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT    NOT NULL,
    name        TEXT    NOT NULL,
    stars       INTEGER NOT NULL CHECK(stars >= 1 AND stars <= 5),
    text        TEXT    NOT NULL DEFAULT '',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    hidden      INTEGER NOT NULL DEFAULT 0,
    ip_hash     TEXT
  );
  CREATE INDEX IF NOT EXISTS reviews_slug_idx       ON reviews(slug);
  CREATE INDEX IF NOT EXISTS reviews_created_at_idx ON reviews(created_at);

  CREATE TABLE IF NOT EXISTS reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id   INTEGER NOT NULL,
    reason      TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    reporter_ip_hash TEXT,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS reports_review_id_idx ON reports(review_id);
`)

const insertReview = db.prepare<[string, string, number, string, string | null]>(`
  INSERT INTO reviews (slug, name, stars, text, ip_hash) VALUES (?, ?, ?, ?, ?)
`)

const listReviews = db.prepare<[string]>(`
  SELECT id, slug, name, stars, text, created_at, hidden
  FROM reviews
  WHERE slug = ? AND hidden = 0
  ORDER BY datetime(created_at) DESC
`)

const reviewById = db.prepare<[number]>(`
  SELECT id, slug, name, stars, text, created_at, hidden FROM reviews WHERE id = ?
`)

const insertReport = db.prepare<[number, string | null, string | null]>(`
  INSERT INTO reports (review_id, reason, reporter_ip_hash) VALUES (?, ?, ?)
`)

const aggregateForSlug = db.prepare<[string]>(`
  SELECT
    COUNT(*)                                   AS count,
    COALESCE(AVG(stars), 0)                    AS average,
    SUM(CASE WHEN stars = 1 THEN 1 ELSE 0 END) AS s1,
    SUM(CASE WHEN stars = 2 THEN 1 ELSE 0 END) AS s2,
    SUM(CASE WHEN stars = 3 THEN 1 ELSE 0 END) AS s3,
    SUM(CASE WHEN stars = 4 THEN 1 ELSE 0 END) AS s4,
    SUM(CASE WHEN stars = 5 THEN 1 ELSE 0 END) AS s5
  FROM reviews WHERE slug = ? AND hidden = 0
`)

const aggregatesAll = db.prepare(`
  SELECT
    slug,
    COUNT(*)                                   AS count,
    COALESCE(AVG(stars), 0)                    AS average
  FROM reviews
  WHERE hidden = 0
  GROUP BY slug
`)

const recentByIp = db.prepare<[string, string, string]>(`
  SELECT id FROM reviews
  WHERE slug = ? AND ip_hash = ? AND datetime(created_at) > datetime('now', ?)
  LIMIT 1
`)

export const createReview = (
  slug: string,
  name: string,
  stars: number,
  text: string,
  ipHash: string | null,
): number => {
  const info = insertReview.run(slug, name, stars, text, ipHash)
  return Number(info.lastInsertRowid)
}

export const getReviews = (slug: string): readonly ReviewRow[] =>
  listReviews.all(slug) as ReviewRow[]

export const getReview = (id: number): ReviewRow | undefined =>
  reviewById.get(id) as ReviewRow | undefined

export const createReport = (
  reviewId: number,
  reason: string | null,
  reporterIpHash: string | null,
): number => {
  const info = insertReport.run(reviewId, reason, reporterIpHash)
  return Number(info.lastInsertRowid)
}

export const getAggregate = (slug: string): Aggregate => {
  const row = aggregateForSlug.get(slug) as {
    count: number
    average: number
    s1: number
    s2: number
    s3: number
    s4: number
    s5: number
  }
  return {
    count: row.count,
    average: row.count > 0 ? Math.round(row.average * 10) / 10 : null,
    distribution: { 1: row.s1, 2: row.s2, 3: row.s3, 4: row.s4, 5: row.s5 },
  }
}

export const getAllAggregates = (): Readonly<Record<string, { count: number; average: number }>> => {
  const rows = aggregatesAll.all() as Array<{ slug: string; count: number; average: number }>
  const out: Record<string, { count: number; average: number }> = {}
  for (const r of rows) {
    out[r.slug] = { count: r.count, average: Math.round(r.average * 10) / 10 }
  }
  return out
}

export const hasRecentFromIp = (slug: string, ipHash: string, windowSql: string): boolean => {
  const row = recentByIp.get(slug, ipHash, windowSql) as { id: number } | undefined
  return !!row
}

export const dbPath = DB_PATH
