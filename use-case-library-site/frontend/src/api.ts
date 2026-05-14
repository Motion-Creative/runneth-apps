import type { Catalog, UseCaseDetail } from './types'

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
