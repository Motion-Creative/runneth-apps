export const colors = {
  primary: '#5047eb',
  primaryLight: '#ede9ff',
  background: '#ffffff',
  backgroundSection: '#f7f7fa',
  textDark: '#111111',
  textBody: '#1a1a1a',
  textMuted: '#6b7280',
  textSubtle: '#9ca3af',
  border: '#e5e7eb',
  borderSubtle: '#f0f0f0',
  positive: '#16a34a',
  experimentalBg: '#fff7ed',
  experimentalText: '#9a3412',
  experimentalBorder: '#fed7aa',
} as const

export const categoryAccents: Record<string, string> = {
  'agent-foundations': '#5047eb',
  'creative-operations': '#0ea5e9',
  'creative-production': '#f59e0b',
  'growth-cro': '#16a34a',
  'integrations-ads': '#a855f7',
}

export const accent = (slug: string | undefined): string =>
  (slug && categoryAccents[slug]) || colors.primary

export const fonts = {
  sans: '"Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const

export const radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 999 } as const

export const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'
export const easeArr = [0.22, 1, 0.36, 1] as const
export const durationMs = 300

export const heroGradientHome = 'linear-gradient(180deg, #ede9ff 0%, #f5f3ff 30%, #ffffff 100%)'
export const heroGradientDetail = (a: string): string => `linear-gradient(180deg, ${a}1a 0%, #ffffff 90%)`
export const cardTileGradient = (a: string): string => `linear-gradient(135deg, ${a}1f 0%, ${a}08 100%)`
