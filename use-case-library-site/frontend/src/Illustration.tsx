import type { ReactElement } from 'react'

import { brand } from './theme'

const INK = brand.offBlack

type IconName =
  | 'abSplit'
  | 'arrowRight'
  | 'bell'
  | 'book'
  | 'brandPalette'
  | 'chatBubble'
  | 'checkmarkCircle'
  | 'clipboardCheck'
  | 'connector'
  | 'dashboard'
  | 'databaseSearch'
  | 'download'
  | 'filmSearch'
  | 'folder'
  | 'globe'
  | 'imageCheck'
  | 'lock'
  | 'multipleTypes'
  | 'network'
  | 'people'
  | 'playCircle'
  | 'refresh'
  | 'report'
  | 'search'
  | 'shield'
  | 'star'
  | 'target'
  | 'testTube'

const ICON_BY_SLUG: Record<string, IconName> = {
  'team-member-memory': 'people',
  'plan-mode': 'checkmarkCircle',
  'self-iteration-loop': 'refresh',
  'share-use-case': 'download',
  'conversation-manager': 'chatBubble',
  'corpus-search': 'databaseSearch',
  'file-explorer': 'dashboard',
  'routine-storage-audit': 'search',
  'authenticate-apps': 'lock',
  bootcamp: 'book',
  'brief-qa': 'clipboardCheck',
  'creative-qa': 'imageCheck',
  'review-library': 'star',
  'video-qa': 'playCircle',
  'video-asset-search': 'filmSearch',
  'static-ad-gen': 'multipleTypes',
  'landing-page-summary': 'report',
  'brand-kit': 'brandPalette',
  'optimize-landing-page': 'target',
  'landing-page-experiments': 'abSplit',
  'csm-alerts': 'bell',
  'meta-connect-use-case': 'network',
  'building-integrations': 'connector',
  'integration-capabilities-library': 'folder',
  'add-roles-permissions': 'shield',
}

const iconPaths: Record<IconName, ReactElement> = {
  abSplit: (
    <>
      <rect x="4" y="6" width="6.5" height="12" rx="2" />
      <rect x="13.5" y="6" width="6.5" height="12" rx="2" />
      <path d="M6.2 14h2.1" />
      <path d="M6 10.5c.2-1 .8-1.5 1.3-1.5s1.1.5 1.3 1.5L9 13" />
      <path d="M15.8 9h1.9c1 0 1.7.5 1.7 1.4 0 .7-.5 1.2-1.1 1.3.8.1 1.3.7 1.3 1.5 0 .9-.7 1.6-1.8 1.6h-2" />
      <path d="M12 9v6" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  bell: (
    <>
      <path d="M7 10a5 5 0 0 1 10 0v3.5c0 1.7 1.1 3.1 2 4H5c.9-.9 2-2.3 2-4V10Z" />
      <path d="M10 20h4" />
      <path d="M10.5 5.2A4.9 4.9 0 0 1 12 5a4.9 4.9 0 0 1 1.5.2" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.5c2.7-1.2 5-1.1 7 .4v14c-2-1.5-4.3-1.6-7-.4v-14Z" />
      <path d="M19 5.5c-2.7-1.2-5-1.1-7 .4v14c2-1.5 4.3-1.6 7-.4v-14Z" />
      <path d="M12 5.9v14" />
    </>
  ),
  brandPalette: (
    <>
      <path d="M12 4.5c-4.8 0-8 3.2-8 7.5 0 4 3 7.5 7.5 7.5h1.2c1 0 1.6-.6 1.6-1.4 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.5 1.6-1.5h1.2c2.2 0 3.9-1.7 3.9-4 0-3.1-3.1-5.7-8-5.7Z" />
      <circle cx="8.5" cy="11" r="1" fill={INK} stroke="none" />
      <circle cx="11.5" cy="8.5" r="1" fill={INK} stroke="none" />
      <circle cx="15" cy="10.5" r="1" fill={INK} stroke="none" />
      <circle cx="10.5" cy="14.5" r="1" fill={INK} stroke="none" />
    </>
  ),
  chatBubble: (
    <>
      <path d="M5 6.5c0-1.4 1.1-2.5 2.5-2.5h9c1.4 0 2.5 1.1 2.5 2.5v6.2c0 1.4-1.1 2.5-2.5 2.5H10l-5 4.8V6.5Z" />
      <path d="M8.5 8.5h7" />
      <path d="M8.5 11.5h5" />
    </>
  ),
  checkmarkCircle: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 12 2.5 2.5L16 9.5" />
    </>
  ),
  clipboardCheck: (
    <>
      <rect x="6" y="5" width="12" height="16" rx="2.5" />
      <path d="M9.5 5.5V4h5v1.5" />
      <path d="m9 13 2 2 4-5" />
      <path d="M9 18h6" />
    </>
  ),
  connector: (
    <>
      <rect x="3.5" y="6" width="7.5" height="8.5" rx="2.2" />
      <rect x="13" y="9.5" width="7.5" height="8.5" rx="2.2" />
      <path d="M7.3 14.5v1.2c0 1.6 1.3 2.8 2.8 2.8h1.7" />
      <path d="M16.8 9.5V8.3c0-1.6-1.3-2.8-2.8-2.8h-1.7" />
      <path d="m10 16.4 2 2.1-2 2.1" />
      <path d="m14 7.6-2-2.1 2-2.1" />
    </>
  ),
  dashboard: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M8 8h3" />
      <path d="M14 8h2" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </>
  ),
  databaseSearch: (
    <>
      <ellipse cx="10" cy="6" rx="5" ry="2.5" />
      <path d="M5 6v8c0 1.4 2.2 2.5 5 2.5 1.4 0 2.7-.3 3.6-.8" />
      <path d="M5 10c0 1.4 2.2 2.5 5 2.5 1.1 0 2.1-.2 3-.5" />
      <circle cx="16" cy="16" r="3.5" />
      <path d="m18.5 18.5 2 2" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 17v2h14v-2" />
    </>
  ),
  filmSearch: (
    <>
      <rect x="4" y="6" width="12" height="10" rx="2" />
      <path d="M7 6v10" />
      <path d="M13 6v7" />
      <circle cx="16.5" cy="16.5" r="3" />
      <path d="m18.8 18.8 1.7 1.7" />
    </>
  ),
  folder: (
    <>
      <path d="M4 7h6l2 2h8v9.5c0 .8-.7 1.5-1.5 1.5h-13c-.8 0-1.5-.7-1.5-1.5V7Z" />
      <path d="M4 11h16" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4c2 2.2 3 4.9 3 8s-1 5.8-3 8" />
      <path d="M12 4c-2 2.2-3 4.9-3 8s1 5.8 3 8" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2.5" />
      <path d="M8 10V7.8C8 5.4 9.7 4 12 4s4 1.4 4 3.8V10" />
      <path d="M12 14v2" />
    </>
  ),
  imageCheck: (
    <>
      <rect x="4" y="5" width="14" height="12" rx="2.5" />
      <path d="m7 14 3.5-3.5 3 3 2-2L18 14" />
      <path d="m15.5 19 1.8 1.8 3.7-4" />
      <circle cx="8.5" cy="8.5" r="1" />
    </>
  ),
  multipleTypes: (
    <>
      <rect x="4" y="5" width="7" height="7" rx="2" />
      <rect x="13" y="5" width="7" height="7" rx="2" />
      <rect x="4" y="14" width="7" height="5" rx="2" />
      <path d="M14 16h5" />
      <path d="M14 19h3" />
    </>
  ),
  network: (
    <>
      <circle cx="7" cy="12" r="3" />
      <circle cx="17" cy="7" r="3" />
      <circle cx="17" cy="17" r="3" />
      <path d="m9.7 10.7 4.6-2.4" />
      <path d="m9.7 13.3 4.6 2.4" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.8 19c1-3.8 2.8-5.5 5.2-5.5S13.2 15.2 14.2 19" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M14.6 14.4c2.5.3 4.1 1.8 5 4.6" />
    </>
  ),
  playCircle: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="m10 8.8 6 3.2-6 3.2V8.8Z" />
    </>
  ),
  refresh: (
    <>
      <path d="M18.5 9A7 7 0 0 0 6 7.5L4 10" />
      <path d="M4 5v5h5" />
      <path d="M5.5 15A7 7 0 0 0 18 16.5l2-2.5" />
      <path d="M20 19v-5h-5" />
    </>
  ),
  report: (
    <>
      <rect x="6" y="4" width="12" height="16" rx="2.5" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h3.5" />
    </>
  ),
  search: (
    <>
      <rect x="5" y="5" width="11" height="14" rx="2.5" />
      <path d="M8 9h5" />
      <path d="M8 12h4" />
      <circle cx="16" cy="16" r="3" />
      <path d="m18.2 18.2 2 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 4 19 6.5V12c0 4-2.5 6.8-7 8-4.5-1.2-7-4-7-8V6.5L12 4Z" />
      <path d="m9 12 2 2 4-5" />
    </>
  ),
  star: (
    <path d="m12 4 2.4 5 5.5.8-4 3.8.9 5.4-4.8-2.6L7.2 19l.9-5.4-4-3.8 5.5-.8L12 4Z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.2" fill={INK} stroke="none" />
    </>
  ),
  testTube: (
    <>
      <path d="M9 4h7" />
      <path d="M11 4v5.5l-4.2 7.3C5.8 18.5 7 20 9 20h5c2 0 3.2-1.5 2.2-3.2L12 9.5V4" />
      <path d="M8.5 16h7" />
    </>
  ),
}

const MotionIcon = ({ name }: { name: IconName }): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    width="54"
    height="54"
    fill="none"
    stroke={INK}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {iconPaths[name]}
  </svg>
)

export const Illustration = ({ slug, category }: { slug: string; category: string }): ReactElement => {
  const icon = ICON_BY_SLUG[slug] ?? 'dashboard'

  return (
    <svg viewBox="0 0 200 110" width="100%" height="100%" fill="none" aria-hidden>
      <rect x="68" y="23" width="64" height="64" rx="18" fill="#FFFFFF" />
      <rect x="68" y="23" width="64" height="64" rx="18" stroke={INK} strokeWidth="2.2" />
      <g transform="translate(73 28)">
        <MotionIcon name={icon} />
      </g>
    </svg>
  )
}
