/**
 * GitHub-backed content layer for the Use Case Library.
 *
 * Reads curated metadata from Motion-Creative/runneth-apps via raw.githubusercontent.com.
 * 60s in-memory TTL cache. Set RUNNETH_APPS_REF to override the default branch.
 *
 * Repo layout (see PR #22):
 *   .use-case-library/catalog.json     — { version, slugs[], excluded[] }
 *   .use-case-library/categories.json  — [ { slug, title, order, blurb } ]
 *   .use-case-library/voice-guide.md
 *   <github-path>/use-case.json        — curated metadata per slug
 *   <github-path>/marketing.md         — customer-facing copy per slug
 *   <github-path>/README.md            — original README
 *   <github-path>/install-config.json  — install spec (15 of 24)
 */

const REPO_OWNER = 'Motion-Creative'
const REPO_NAME = 'runneth-apps'

const resolveRef = (): string => process.env.RUNNETH_APPS_REF?.trim() || 'main'

const CACHE_TTL_MS = 60_000

type CacheEntry<T> = Readonly<{ value: T; expiresAt: number }>
const cache = new Map<string, CacheEntry<unknown>>()

const rawUrl = (path: string): string => {
  const ref = resolveRef()
  return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${ref}/${path}`
}

const fetchTextFresh = async (path: string): Promise<string | null> => {
  const res = await fetch(rawUrl(path), { headers: { 'User-Agent': 'use-case-library/1.0' } })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub fetch ${path} failed: ${res.status} ${res.statusText}`)
  return await res.text()
}

const fetchCached = async <T>(key: string, loader: () => Promise<T>): Promise<T> => {
  const now = Date.now()
  const entry = cache.get(key)
  if (entry && entry.expiresAt > now) return entry.value as T
  const value = await loader()
  cache.set(key, { value, expiresAt: now + CACHE_TTL_MS })
  return value
}

export const clearCache = (): void => {
  cache.clear()
}

export const cacheStats = (): { size: number; ttlMs: number; ref: string } => ({
  size: cache.size,
  ttlMs: CACHE_TTL_MS,
  ref: resolveRef(),
})

export type Category = Readonly<{ slug: string; title: string; order: number; blurb: string }>

export type Catalog = Readonly<{
  version: number
  slugs: readonly string[]
  excluded?: readonly { slug: string; reason: string }[]
}>

export type UseCaseMeta = Readonly<{
  slug: string
  display_title: string
  pitch: string
  status: 'proven' | 'experimental'
  category: string
  version?: string | null
  github_path: string
}>

export type InstallConfig = Readonly<Record<string, unknown>>

export type UseCaseDetail = Readonly<{
  manifest: UseCaseMeta & {
    description: string | null
    has_install_config: boolean
    github_url: string
    last_pulled: string
  }
  marketing: { frontmatter: Record<string, string>; body: string } | null
  install_config: InstallConfig | null
  readme: string | null
}>

export const loadCatalog = async (): Promise<Catalog> =>
  fetchCached('catalog', async () => {
    const text = await fetchTextFresh('.use-case-library/catalog.json')
    if (!text) throw new Error('catalog.json missing on the configured ref')
    return JSON.parse(text) as Catalog
  })

export const loadCategories = async (): Promise<readonly Category[]> =>
  fetchCached('categories', async () => {
    const text = await fetchTextFresh('.use-case-library/categories.json')
    if (!text) throw new Error('categories.json missing on the configured ref')
    return JSON.parse(text) as readonly Category[]
  })

const slugPathCache = new Map<string, string>()

const discoverSlugPath = async (slug: string): Promise<string | null> => {
  if (slugPathCache.has(slug)) return slugPathCache.get(slug)!
  const candidates = [slug, `landing-page-bundle/${slug}`]
  for (const candidate of candidates) {
    const text = await fetchTextFresh(`${candidate}/use-case.json`)
    if (text) {
      slugPathCache.set(slug, candidate)
      return candidate
    }
  }
  return null
}

export const loadUseCaseMeta = async (slug: string): Promise<UseCaseMeta | null> =>
  fetchCached(`meta:${slug}`, async () => {
    const path = await discoverSlugPath(slug)
    if (!path) return null
    const text = await fetchTextFresh(`${path}/use-case.json`)
    if (!text) return null
    const meta = JSON.parse(text) as UseCaseMeta
    return { ...meta, github_path: meta.github_path ?? path }
  })

const parseFrontmatter = (md: string): { frontmatter: Record<string, string>; body: string } => {
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(md)
  if (!match) return { frontmatter: {}, body: md }
  const [, fm, body] = match
  const frontmatter: Record<string, string> = {}
  for (const line of fm.split('\n')) {
    const m = /^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/.exec(line)
    if (!m) continue
    const [, k, rawV] = m
    let v = rawV.trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    frontmatter[k] = v
  }
  return { frontmatter, body }
}

export const loadUseCaseDetail = async (slug: string): Promise<UseCaseDetail | null> =>
  fetchCached(`detail:${slug}`, async () => {
    const meta = await loadUseCaseMeta(slug)
    if (!meta) return null
    const path = meta.github_path

    const [marketingText, installConfigText, readmeText] = await Promise.all([
      fetchTextFresh(`${path}/marketing.md`),
      fetchTextFresh(`${path}/install-config.json`),
      fetchTextFresh(`${path}/README.md`),
    ])

    const marketing = marketingText ? parseFrontmatter(marketingText) : null

    let installConfig: InstallConfig | null = null
    if (installConfigText) {
      try {
        installConfig = JSON.parse(installConfigText) as InstallConfig
      } catch {
        installConfig = null
      }
    }

    const firstParagraph = readmeText
      ? (readmeText.split(/\n\n+/).find((p) => p.trim() && !p.trim().startsWith('#')) ?? null)
      : null

    const description =
      (installConfig?.description as string | undefined) ??
      firstParagraph?.replace(/\*\*/g, '').trim() ??
      null

    return {
      manifest: {
        ...meta,
        description,
        has_install_config: installConfig !== null,
        github_url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/${resolveRef()}/${path}`,
        last_pulled: new Date().toISOString(),
      },
      marketing,
      install_config: installConfig,
      readme: readmeText,
    }
  })

export type AssembledCatalog = Readonly<{
  categories: readonly Category[]
  use_cases: readonly UseCaseMeta[]
  total_use_cases: number
  proven_count: number
  experimental_count: number
  ref: string
  cached_at: string
}>

export const assembleCatalog = async (): Promise<AssembledCatalog> => {
  const [catalog, categories] = await Promise.all([loadCatalog(), loadCategories()])
  const metas = await Promise.all(catalog.slugs.map((slug) => loadUseCaseMeta(slug)))
  const use_cases = metas.filter((m): m is UseCaseMeta => m !== null)

  const proven_count = use_cases.filter((u) => u.status === 'proven').length
  const experimental_count = use_cases.filter((u) => u.status === 'experimental').length

  return {
    categories,
    use_cases,
    total_use_cases: use_cases.length,
    proven_count,
    experimental_count,
    ref: resolveRef(),
    cached_at: new Date().toISOString(),
  }
}
