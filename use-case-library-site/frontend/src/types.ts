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

export type RatingSummary = Readonly<{ count: number; average: number }>

export type Catalog = Readonly<{
  categories: readonly Category[]
  use_cases: readonly UseCaseMeta[]
  total_use_cases: number
  proven_count: number
  experimental_count: number
  ref: string
  cached_at: string
  ratings: Readonly<Record<string, RatingSummary>>
}>

export type Review = Readonly<{
  id: number
  name: string
  stars: number
  text: string
  created_at: string
}>

export type ReviewAggregate = Readonly<{
  count: number
  average: number | null
  distribution: Readonly<{ 1: number; 2: number; 3: number; 4: number; 5: number }>
}>

export type ReviewsResponse = Readonly<{
  slug: string
  aggregate: ReviewAggregate
  reviews: readonly Review[]
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
