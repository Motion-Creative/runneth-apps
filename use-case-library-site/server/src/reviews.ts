/**
 * Validation + light spam mitigation for review submissions and flags.
 *
 * Identity is anonymous (display name only). To keep open writes from being
 * trivially spammed, we:
 *   - rate-limit per (slug, ip-hash) to one review per 24h
 *   - cap text length, normalize whitespace
 *   - drop obviously bad submissions silently with a 400
 */
import { createHash, randomBytes } from 'node:crypto'

const SECRET = process.env.IP_HASH_SECRET || randomBytes(32).toString('hex')

export const hashIp = (ip: string | null | undefined): string => {
  if (!ip) return 'unknown'
  return createHash('sha256').update(SECRET).update(ip).digest('hex').slice(0, 32)
}

export const SLUG_RE = /^[a-z0-9-]+$/
const NAME_MAX = 50
const TEXT_MAX = 2000

export type ReviewInput = Readonly<{
  name: string
  stars: number
  text: string
}>

export type ValidationError = Readonly<{ field: string; message: string }>

export const validateReview = (
  body: unknown,
): { value: ReviewInput } | { errors: ValidationError[] } => {
  const errors: ValidationError[] = []
  if (!body || typeof body !== 'object') {
    return { errors: [{ field: 'body', message: 'invalid_body' }] }
  }
  const b = body as Record<string, unknown>

  const rawName = typeof b.name === 'string' ? b.name.trim().replace(/\s+/g, ' ') : ''
  if (!rawName) errors.push({ field: 'name', message: 'name_required' })
  else if (rawName.length > NAME_MAX) errors.push({ field: 'name', message: 'name_too_long' })

  const stars = typeof b.stars === 'number' ? Math.floor(b.stars) : NaN
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    errors.push({ field: 'stars', message: 'stars_out_of_range' })
  }

  const rawText = typeof b.text === 'string' ? b.text.trim() : ''
  if (rawText.length > TEXT_MAX) errors.push({ field: 'text', message: 'text_too_long' })

  if (errors.length > 0) return { errors }
  return { value: { name: rawName, stars, text: rawText } }
}

export type FlagInput = Readonly<{ reason: string | null }>

export const validateFlag = (
  body: unknown,
): { value: FlagInput } | { errors: ValidationError[] } => {
  if (body === null || body === undefined) return { value: { reason: null } }
  if (typeof body !== 'object') return { errors: [{ field: 'body', message: 'invalid_body' }] }
  const b = body as Record<string, unknown>
  if (b.reason === undefined || b.reason === null) return { value: { reason: null } }
  if (typeof b.reason !== 'string') return { errors: [{ field: 'reason', message: 'invalid_reason' }] }
  const reason = b.reason.trim().slice(0, 500)
  return { value: { reason: reason.length > 0 ? reason : null } }
}
