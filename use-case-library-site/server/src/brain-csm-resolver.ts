/**
 * Resolve a customer's CSM by looking up their contact email in HubSpot.
 *
 * Flow:
 *   1. GET /crm/v3/objects/contacts/{email} with associations=companies
 *      → resolves the primary associated company id
 *   2. GET /crm/v3/objects/companies/{id}?properties=csm
 *      → returns the HubSpot owner id assigned as CSM
 *   3. Map owner id → email via a one-shot owners cache loaded on first
 *      use, then refreshed at most once per hour. Email is matched against
 *      the known CSM roster to produce a handle.
 *
 * Falls back gracefully: if any step fails or the resolved CSM is not in
 * the known roster, returns null and the caller keeps the URL-provided
 * csm_handle.
 *
 * Env:
 *   HUBSPOT_TOKEN — Bearer token for api.hubspot.com. Falls back to a
 *                   no-op resolver when missing so local dev stays unblocked.
 */
const TOKEN = process.env.HUBSPOT_TOKEN || ''

// CSM roster: handle ⇄ motion email. Keep this in sync with index.ts
// CSM_ROSTER. Email comparison is lowercase; whitespace trimmed.
const CSM_EMAIL_TO_HANDLE: Record<string, string> = {
  'ale@motionapp.com': 'ale',
  'aoife@motionapp.com': 'aoife',
  'carissa@motionapp.com': 'carissa',
  'josh@motionapp.com': 'josh',
  'krishna@motionapp.com': 'krishna',
  'quinn@motionapp.com': 'quinn',
  'rabia@motionapp.com': 'rabia',
  'sophia@motionapp.com': 'sophia',
}

let ownerCache: { byId: Record<string, string>; loadedAt: number } | null = null
const OWNER_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

const fetchHubSpot = async <T>(path: string): Promise<T | null> => {
  if (!TOKEN) return null
  try {
    const resp = await fetch(`https://api.hubspot.com${path}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    if (!resp.ok) return null
    return (await resp.json()) as T
  } catch {
    return null
  }
}

// Build owner id → email map. Pages through /crm/v3/owners. Pinned to one
// hour TTL so newly added CSMs land in the map without a redeploy.
const loadOwners = async (log: (msg: string) => void): Promise<Record<string, string>> => {
  const now = Date.now()
  if (ownerCache && now - ownerCache.loadedAt < OWNER_CACHE_TTL_MS) {
    return ownerCache.byId
  }
  const byId: Record<string, string> = {}
  let after: string | undefined
  for (let i = 0; i < 10; i++) {
    const path = `/crm/v3/owners?limit=100${after ? `&after=${encodeURIComponent(after)}` : ''}`
    const page = await fetchHubSpot<{
      results: Array<{ id: string; email: string }>
      paging?: { next?: { after?: string } }
    }>(path)
    if (!page || !Array.isArray(page.results)) break
    for (const owner of page.results) {
      if (owner.email) byId[String(owner.id)] = owner.email.trim().toLowerCase()
    }
    if (!page.paging?.next?.after) break
    after = page.paging.next.after
  }
  ownerCache = { byId, loadedAt: now }
  log(`[csm-resolver] loaded ${Object.keys(byId).length} HubSpot owners into cache`)
  return byId
}

type ContactResponse = {
  id: string
  associations?: {
    companies?: { results?: Array<{ id: string; type: string }> }
  }
}

type CompanyResponse = {
  id: string
  properties?: { csm?: string }
}

export type CsmResolveResult =
  | { ok: true; handle: string; source: 'hubspot' }
  | { ok: false; reason: string }

export const resolveCsmFromHubSpot = async (
  email: string,
  log: (msg: string) => void,
): Promise<CsmResolveResult> => {
  if (!TOKEN) return { ok: false, reason: 'no_hubspot_token' }
  const cleanEmail = email.trim().toLowerCase()
  if (!cleanEmail) return { ok: false, reason: 'empty_email' }

  // 1. Contact lookup
  const contactPath = `/crm/v3/objects/contacts/${encodeURIComponent(cleanEmail)}?idProperty=email&associations=companies`
  const contact = await fetchHubSpot<ContactResponse>(contactPath)
  if (!contact) return { ok: false, reason: 'contact_not_found' }

  const companyEdges = contact.associations?.companies?.results || []
  if (companyEdges.length === 0) return { ok: false, reason: 'no_associated_company' }
  const companyId = companyEdges[0]!.id

  // 2. Company lookup with csm property
  const company = await fetchHubSpot<CompanyResponse>(
    `/crm/v3/objects/companies/${encodeURIComponent(companyId)}?properties=csm`,
  )
  if (!company) return { ok: false, reason: 'company_not_found' }

  const csmOwnerId = company.properties?.csm
  if (!csmOwnerId) return { ok: false, reason: 'no_csm_on_company' }

  // 3. Map owner id → email via cache
  const owners = await loadOwners(log)
  const ownerEmail = owners[String(csmOwnerId)]
  if (!ownerEmail) return { ok: false, reason: 'owner_id_not_in_cache' }

  const handle = CSM_EMAIL_TO_HANDLE[ownerEmail]
  if (!handle) return { ok: false, reason: `owner_${ownerEmail}_not_in_roster` }

  return { ok: true, handle, source: 'hubspot' }
}
