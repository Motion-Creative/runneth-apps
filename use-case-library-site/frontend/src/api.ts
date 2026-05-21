import type { Catalog, Review, ReviewsResponse, UseCaseDetail } from './types'

// Standalone deploy: API is mounted at the same origin under /api.
const API_BASE = '/api'

export const fetchCatalog = async (): Promise<Catalog> => {
  const res = await fetch(`${API_BASE}/catalog`)
  if (!res.ok) throw new Error(`catalog ${res.status}`)
  return (await res.json()) as Catalog
}

export const fetchUseCase = async (slug: string): Promise<UseCaseDetail> => {
  const res = await fetch(`${API_BASE}/use-case/${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error(`use-case ${res.status}`)
  return (await res.json()) as UseCaseDetail
}

export const fetchReviews = async (slug: string): Promise<ReviewsResponse> => {
  const res = await fetch(`${API_BASE}/reviews/${encodeURIComponent(slug)}`)
  if (!res.ok) throw new Error(`reviews ${res.status}`)
  return (await res.json()) as ReviewsResponse
}

export type SubmitReviewInput = { name: string; stars: number; text: string }
export type SubmitReviewResult =
  | { ok: true; review: Review }
  | { ok: false; status: number; message: string }

export const submitReview = async (
  slug: string,
  input: SubmitReviewInput,
): Promise<SubmitReviewResult> => {
  const res = await fetch(`${API_BASE}/reviews/${encodeURIComponent(slug)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = (await res.json().catch(() => ({}))) as
    | { ok: true; review: Review }
    | { error?: string; message?: string; details?: Array<{ field: string; message: string }> }
  if (res.ok && 'ok' in data && data.ok) return data
  const message =
    'message' in data && typeof data.message === 'string'
      ? data.message
      : 'details' in data && Array.isArray(data.details) && data.details.length
      ? data.details.map((d) => `${d.field}: ${d.message}`).join(', ')
      : 'error' in data && typeof data.error === 'string'
      ? data.error
      : 'Could not submit review.'
  return { ok: false, status: res.status, message }
}

export const flagReview = async (
  slug: string,
  reviewId: number,
  reason: string | null,
): Promise<{ ok: boolean; message?: string }> => {
  const res = await fetch(
    `${API_BASE}/reviews/${encodeURIComponent(slug)}/${encodeURIComponent(String(reviewId))}/flag`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reason }),
    },
  )
  if (res.ok) return { ok: true }
  const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
  return { ok: false, message: data.message || data.error || `flag ${res.status}` }
}
