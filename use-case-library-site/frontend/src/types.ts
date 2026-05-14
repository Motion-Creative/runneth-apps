export type Category = Readonly<{
  slug: string
  title: string
  order: number
  blurb: string
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

export type Catalog = Readonly<{
  categories: readonly Category[]
  use_cases: readonly UseCaseMeta[]
  total_use_cases: number
  proven_count: number
  experimental_count: number
  ref: string
  cached_at: string
}>

export type MarketingDoc = Readonly<{ frontmatter: Record<string, string>; body: string }>

export type UseCaseDetail = Readonly<{
  manifest: UseCaseMeta & {
    description: string | null
    has_install_config: boolean
    github_url: string
    last_pulled: string
  }
  marketing: MarketingDoc | null
  install_config: Readonly<Record<string, unknown>> | null
  readme: string | null
}>
