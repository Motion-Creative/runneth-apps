/**
 * Runneth brand palette.
 *
 * Primary: Off Black (text + button fill). Neutrals: White / Silver / Keyline Silver.
 * Brand pops: Sky, Lime, Yellow. Used as category swatches and accent stripes.
 * Body color is always Off Black; brand pops live in pill swatches, tile washes,
 * and the hero gradient — never in body text.
 */

const offBlack = '#1C180E'

export const brand = {
  white: '#FFFFFF',
  silver: '#F6F6F6',
  keylineSilver: '#E6E5D9',
  grey: '#B2B2AB',
  offBlack,
  sky: '#AEE1ED',
  lime: '#CEFF5B',
  yellow: '#FFF95C',
} as const

export const colors = {
  primary: offBlack,
  primaryLight: brand.keylineSilver,
  background: brand.white,
  backgroundSection: brand.silver,
  textDark: offBlack,
  textBody: offBlack,
  textMuted: 'rgba(28, 24, 14, 0.62)',
  textSubtle: 'rgba(28, 24, 14, 0.38)',
  border: brand.keylineSilver,
  borderSubtle: '#EFEDE2',
  positive: '#3FB55C',
  experimentalBg: '#FFF7D6',
  experimentalText: '#6E5500',
  experimentalBorder: '#FFE99A',
} as const

export const categoryAccents: Record<string, string> = {
  'agent-foundations': brand.keylineSilver,
  'creative-operations': brand.sky,
  'creative-production': brand.lime,
  'growth-cro': brand.yellow,
}

export const accent = (slug: string | undefined): string =>
  (slug && categoryAccents[slug]) || brand.lime

const agentFoundationCardAccents = [brand.sky, brand.lime, brand.yellow] as const

export const cardAccent = (category: string | undefined, slug: string): string => {
  if (category !== 'agent-foundations') return accent(category)

  const hash = [...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return agentFoundationCardAccents[hash % agentFoundationCardAccents.length]
}

export const fonts = {
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const

export const radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 999 } as const

export const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'
export const easeArr = [0.22, 1, 0.36, 1] as const
export const durationMs = 300

export const heroGradientHome =
  'linear-gradient(180deg, #E8F6F9 0%, #F4FCDF 50%, #FFFDEE 80%, #FFFFFF 100%)'
export const heroGradientDetail = (a: string): string =>
  `linear-gradient(180deg, ${a}80 0%, #ffffff 90%)`
export const cardTileGradient = (a: string): string =>
  `linear-gradient(135deg, ${a}66 0%, ${a}1a 100%)`
