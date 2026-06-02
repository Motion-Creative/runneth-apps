/**
 * SQLite-backed brain checklist submissions store.
 *
 * Persistence: DB file path comes from BRAIN_SUBMISSIONS_DB_PATH (default
 * /data/brain-submissions.db, matching the reviews.db convention). On Railway
 * this should point at a mounted volume path so data survives redeploys.
 *
 * Schema is migrated on boot — safe to re-run.
 *
 * Files are stored as BLOBs alongside their metadata. 10MB per file and 25MB
 * per submission caps are already enforced at the route layer, so the SQLite
 * page-size defaults are fine.
 */
import Database from 'better-sqlite3'
import { dirname } from 'node:path'
import { mkdirSync } from 'node:fs'

import type { BrainChecklistFile, BrainChecklistSection } from './brain-checklist-email.js'

const DB_PATH = process.env.BRAIN_SUBMISSIONS_DB_PATH || '/data/brain-submissions.db'

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
  CREATE TABLE IF NOT EXISTS brain_submissions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    workspace_name  TEXT    NOT NULL,
    contact_email   TEXT    NOT NULL,
    sections_json   TEXT    NOT NULL,
    submitted_at    TEXT    NOT NULL,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS brain_submissions_created_at_idx ON brain_submissions(created_at);

  CREATE TABLE IF NOT EXISTS brain_submission_files (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id   INTEGER NOT NULL,
    section_key     TEXT    NOT NULL,
    filename        TEXT    NOT NULL,
    mime_type       TEXT    NOT NULL,
    size_bytes      INTEGER NOT NULL,
    data            BLOB    NOT NULL,
    FOREIGN KEY (submission_id) REFERENCES brain_submissions(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS brain_submission_files_submission_idx
    ON brain_submission_files(submission_id);
`)

export const dbPath = DB_PATH

export type StoredSubmission = Readonly<{
  id: number
  workspace_name: string
  contact_email: string
  sections: ReadonlyArray<BrainChecklistSection>
  submitted_at: string
  created_at: string
  file_count: number
  total_bytes: number
}>

export type StoredFile = Readonly<{
  id: number
  submission_id: number
  section_key: string
  filename: string
  mime_type: string
  size_bytes: number
}>

const insertSubmission = db.prepare(`
  INSERT INTO brain_submissions (workspace_name, contact_email, sections_json, submitted_at)
  VALUES (@workspace_name, @contact_email, @sections_json, @submitted_at)
`)

const insertFile = db.prepare(`
  INSERT INTO brain_submission_files (submission_id, section_key, filename, mime_type, size_bytes, data)
  VALUES (@submission_id, @section_key, @filename, @mime_type, @size_bytes, @data)
`)

export const persistSubmission = (input: {
  workspaceName: string
  contactEmail: string
  sections: ReadonlyArray<BrainChecklistSection>
  files: ReadonlyArray<BrainChecklistFile>
  submittedAt: string
}): number => {
  const tx = db.transaction(() => {
    const info = insertSubmission.run({
      workspace_name: input.workspaceName,
      contact_email: input.contactEmail,
      sections_json: JSON.stringify(input.sections),
      submitted_at: input.submittedAt,
    })
    const subId = Number(info.lastInsertRowid)
    for (const f of input.files) {
      insertFile.run({
        submission_id: subId,
        section_key: f.field,
        filename: f.filename,
        mime_type: f.mimeType,
        size_bytes: f.buffer.length,
        data: f.buffer,
      })
    }
    return subId
  })
  return tx()
}

const listSubmissionsStmt = db.prepare(`
  SELECT
    s.id, s.workspace_name, s.contact_email, s.sections_json, s.submitted_at, s.created_at,
    COALESCE(COUNT(f.id), 0) AS file_count,
    COALESCE(SUM(f.size_bytes), 0) AS total_bytes
  FROM brain_submissions s
  LEFT JOIN brain_submission_files f ON f.submission_id = s.id
  GROUP BY s.id
  ORDER BY s.created_at DESC
  LIMIT ?
`)

export const listSubmissions = (limit = 200): StoredSubmission[] => {
  const rows = listSubmissionsStmt.all(limit) as Array<{
    id: number
    workspace_name: string
    contact_email: string
    sections_json: string
    submitted_at: string
    created_at: string
    file_count: number
    total_bytes: number
  }>
  return rows.map((r) => ({
    id: r.id,
    workspace_name: r.workspace_name,
    contact_email: r.contact_email,
    sections: JSON.parse(r.sections_json) as BrainChecklistSection[],
    submitted_at: r.submitted_at,
    created_at: r.created_at,
    file_count: r.file_count,
    total_bytes: r.total_bytes,
  }))
}

const listSubmissionsSinceStmt = db.prepare(`
  SELECT
    s.id, s.workspace_name, s.contact_email, s.sections_json, s.submitted_at, s.created_at,
    COALESCE(COUNT(f.id), 0) AS file_count,
    COALESCE(SUM(f.size_bytes), 0) AS total_bytes
  FROM brain_submissions s
  LEFT JOIN brain_submission_files f ON f.submission_id = s.id
  WHERE s.created_at > ?
  GROUP BY s.id
  ORDER BY s.created_at ASC
`)

export const listSubmissionsSince = (sinceIso: string): StoredSubmission[] => {
  const rows = listSubmissionsSinceStmt.all(sinceIso) as Array<{
    id: number
    workspace_name: string
    contact_email: string
    sections_json: string
    submitted_at: string
    created_at: string
    file_count: number
    total_bytes: number
  }>
  return rows.map((r) => ({
    id: r.id,
    workspace_name: r.workspace_name,
    contact_email: r.contact_email,
    sections: JSON.parse(r.sections_json) as BrainChecklistSection[],
    submitted_at: r.submitted_at,
    created_at: r.created_at,
    file_count: r.file_count,
    total_bytes: r.total_bytes,
  }))
}

const listFilesForSubmissionStmt = db.prepare(`
  SELECT id, submission_id, section_key, filename, mime_type, size_bytes
  FROM brain_submission_files
  WHERE submission_id = ?
  ORDER BY id ASC
`)

export const listFilesForSubmission = (submissionId: number): StoredFile[] => {
  return listFilesForSubmissionStmt.all(submissionId) as StoredFile[]
}

const getFileBytesStmt = db.prepare(`
  SELECT filename, mime_type, data
  FROM brain_submission_files
  WHERE id = ?
`)

export const getFileBytes = (
  fileId: number,
): { filename: string; mime_type: string; data: Buffer } | null => {
  const row = getFileBytesStmt.get(fileId) as { filename: string; mime_type: string; data: Buffer } | undefined
  return row || null
}

const getFileBytesByIdsStmt = db.prepare(`
  SELECT id, filename, mime_type, data, section_key, submission_id
  FROM brain_submission_files
  WHERE id IN (SELECT value FROM json_each(?))
`)

export const getFilesByIds = (
  ids: number[],
): Array<{ id: number; filename: string; mime_type: string; data: Buffer; section_key: string; submission_id: number }> => {
  if (ids.length === 0) return []
  return getFileBytesByIdsStmt.all(JSON.stringify(ids)) as Array<{
    id: number
    filename: string
    mime_type: string
    data: Buffer
    section_key: string
    submission_id: number
  }>
}
