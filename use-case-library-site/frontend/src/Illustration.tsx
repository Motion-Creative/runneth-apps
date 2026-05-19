/**
 * 24 themed SVG glyphs, one per slug.
 * Same family: viewBox 200x110, 2-2.5px stroke, round caps. Body strokes in
 * Off Black, accent sparks in brand Lime. The category color rides on the
 * tile background, not inside the glyph — keeps line work consistent.
 */
import { accent, brand } from './theme'

const BODY = brand.offBlack
const SPARK = brand.lime

const wrap = (children: React.ReactNode, _accentHex: string): JSX.Element => (
  <svg
    viewBox="0 0 200 110"
    preserveAspectRatio="xMidYMid meet"
    width="100%"
    height="100%"
    fill="none"
    stroke={BODY}
    strokeWidth={2.2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {children}
  </svg>
)

type GlyphFn = (a: string) => JSX.Element

const Star = ({ cx, cy, filled }: { cx: number; cy: number; filled: boolean }): JSX.Element => (
  <path
    d={`M${cx} ${cy - 6}l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z`}
    fill={filled ? SPARK : 'none'}
    stroke={SPARK}
  />
)

const Gear = ({ cx, cy, r, stroke }: { cx: number; cy: number; r: number; stroke: string }): JSX.Element => {
  const teeth = 8
  const elems: React.ReactNode[] = []
  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2
    const x = cx + Math.cos(angle) * (r + 4)
    const y = cy + Math.sin(angle) * (r + 4)
    elems.push(<path key={i} d={`M${x.toFixed(1)} ${y.toFixed(1)}l-2 -2`} stroke={stroke} />)
  }
  return (
    <>
      <circle cx={cx} cy={cy} r={r} stroke={stroke} />
      <circle cx={cx} cy={cy} r={r - 7} stroke={stroke} />
      {elems}
    </>
  )
}

  'add-roles-permissions': (a) => wrap(
    <>
      {/* Shield body */}
      <path d="M100 20l30 10v22c0 18-12 28-30 38-18-10-30-20-30-38V30z" />
      {/* Admin star inside shield */}
      <path d="M100 38l2.5 5 5.5 1-4 4 1 5.5-5-2.5-5 2.5 1-5.5-4-4 5.5-1z" fill={SPARK} stroke={SPARK} strokeWidth={1.5} />
      {/* Two member silhouettes flanking the shield */}
      <circle cx="56" cy="65" r="7" />
      <path d="M46 86c1-7 5-10 10-10s9 3 10 10" />
      <circle cx="144" cy="65" r="7" />
      <path d="M134 86c1-7 5-10 10-10s9 3 10 10" />
    </>,
    a
  ),
const fallback: GlyphFn = (a) =>
  wrap(
    <>
      <circle cx="100" cy="55" r="22" />
      <path d="M100 28l3 6 6 1-5 4 2 7-6-4-6 4 2-7-5-4 6-1z" fill={SPARK} stroke={SPARK} />
    </>,
    a
  )

const GLYPHS: Record<string, GlyphFn> = {
  'team-member-memory': (a) => wrap(
    <>
      {/* Three people — left, centre (highlighted), right */}
      <circle cx="66" cy="50" r="8" />
      <path d="M54 74c1-8 6-12 12-12s11 4 12 12" />
      <circle cx="100" cy="46" r="10" fill={SPARK} />
      <path d="M87 71c1-9 7-13 13-13s12 4 13 13" stroke={SPARK} />
      <circle cx="134" cy="50" r="8" />
      <path d="M122 74c1-8 6-12 12-12s11 4 12 12" />
      {/* Memory spark — clear of all head circles */}
      <path d="M100 18l2.5 5 5.5.8-4 3.8 1 5.4-5-2.6-5 2.6 1-5.4-4-3.8 5.5-.8z" fill={SPARK} stroke={SPARK} strokeWidth={1.5} />
    </>,
    a
  ),
  'plan-mode': (a) => wrap(
    <>
      <rect x="70" y="22" width="60" height="74" rx="6" />
      <line x1="82" y1="40" x2="118" y2="40" />
      <line x1="82" y1="55" x2="118" y2="55" />
      <line x1="82" y1="70" x2="118" y2="70" />
      <path d="M85 84l6 6 14-14" stroke={SPARK} strokeWidth={2.6} />
    </>,
    a
  ),
  'self-iteration-loop': (a) => wrap(
    <>
      <path d="M70 55a30 30 0 0 1 60 0" />
      <path d="M130 55a30 30 0 0 1-60 0" stroke={SPARK} />
      <path d="M130 55l8-5 -2 10z" fill={a} stroke="none" />
      <path d="M70 55l-8 5 2-10z" fill={SPARK} stroke="none" />
    </>,
    a
  ),
  'share-use-case': (a) => wrap(
    <>
      <rect x="68" y="42" width="64" height="46" rx="4" />
      <line x1="100" y1="42" x2="100" y2="88" stroke={SPARK} />
      <path d="M86 42c-6-10 7-18 14-8 7-10 20-2 14 8" stroke={SPARK} />
      <line x1="68" y1="62" x2="132" y2="62" />
      <circle cx="56" cy="32" r="2" fill={SPARK} stroke="none" />
      <circle cx="146" cy="36" r="2" fill={SPARK} stroke="none" />
      <circle cx="50" cy="80" r="2" fill={SPARK} stroke="none" />
    </>,
    a
  ),
  'conversation-manager': (a) => wrap(
    <>
      <rect x="56" y="28" width="28" height="60" rx="4" />
      <rect x="86" y="28" width="28" height="60" rx="4" />
      <rect x="116" y="28" width="28" height="60" rx="4" />
      <rect x="60" y="34" width="20" height="10" rx="2" fill={SPARK} stroke="none" />
      <rect x="60" y="48" width="20" height="8" rx="2" />
      <rect x="90" y="34" width="20" height="14" rx="2" />
      <rect x="90" y="52" width="20" height="8" rx="2" />
      <rect x="120" y="34" width="20" height="10" rx="2" />
    </>,
    a
  ),
  'corpus-search': (a) => wrap(
    <>
      {/* Brain — two hemispheres */}
      <path d="M92 22 C72 22 60 36 60 52 C60 64 66 74 76 78 C78 84 84 88 92 86 L92 22 Z" />
      <path d="M108 22 C128 22 140 36 140 52 C140 64 134 74 124 78 C122 84 116 88 108 86 L108 22 Z" />
      {/* Sulci (folds) */}
      <path d="M74 38 Q82 44 74 50" />
      <path d="M74 56 Q82 62 74 68" />
      <path d="M126 38 Q118 44 126 50" />
      <path d="M126 56 Q118 62 126 68" />
      {/* Magnifying glass — overlaid lower right */}
      <circle cx="132" cy="82" r="13" fill="#ffffff" stroke={SPARK} strokeWidth={2.4} />
      <line x1="142" y1="92" x2="156" y2="106" stroke={SPARK} strokeWidth={3} />
    </>,
    a
  ),
  'file-explorer': (a) => wrap(
    <>
      <path d="M52 36h22l8 8h30v44H52z" />
      <line x1="100" y1="56" x2="100" y2="74" />
      <path d="M100 64h22" />
      <rect x="122" y="56" width="22" height="14" rx="2" stroke={SPARK} />
      <rect x="122" y="76" width="22" height="14" rx="2" stroke={SPARK} />
    </>,
    a
  ),
  'routine-storage-audit': (a) => wrap(
    <>
      <rect x="64" y="22" width="56" height="70" rx="4" />
      <line x1="74" y1="36" x2="110" y2="36" />
      <line x1="74" y1="48" x2="110" y2="48" />
      <line x1="74" y1="60" x2="100" y2="60" />
      <circle cx="120" cy="76" r="12" stroke={SPARK} />
      <line x1="129" y1="84" x2="142" y2="96" stroke={SPARK} strokeWidth={2.6} />
    </>,
    a
  ),
  'authenticate-apps': (a) => wrap(
    <>
      <path d="M100 18l32 10v22c0 22-14 34-32 42-18-8-32-20-32-42V28z" />
      <circle cx="100" cy="56" r="7" fill={SPARK} stroke={SPARK} />
      <rect x="97" y="60" width="6" height="14" rx="2" fill={SPARK} stroke={SPARK} />
    </>,
    a
  ),
  bootcamp: (a) => wrap(
    <>
      <path d="M60 50l40-18 40 18-40 18z" />
      <path d="M76 58v18c0 6 11 10 24 10s24-4 24-10V58" />
      <line x1="140" y1="50" x2="140" y2="80" />
      <circle cx="140" cy="84" r="4" fill={SPARK} stroke={SPARK} />
    </>,
    a
  ),
  'brief-qa': (a) => wrap(
    <>
      <rect x="56" y="22" width="60" height="70" rx="4" />
      <line x1="66" y1="38" x2="106" y2="38" />
      <line x1="66" y1="50" x2="106" y2="50" />
      <line x1="66" y1="62" x2="92" y2="62" />
      <circle cx="132" cy="74" r="16" fill={SPARK} stroke="none" />
      <path d="M124 74l5 5 10-10" stroke="#ffffff" strokeWidth={2.6} />
    </>,
    a
  ),
  'creative-qa': (a) => wrap(
    <>
      <rect x="52" y="22" width="72" height="56" rx="4" />
      <path d="M60 60l16-16 14 12 14-10 18 18" />
      <circle cx="78" cy="40" r="4" fill={a} />
      <circle cx="130" cy="70" r="10" fill={SPARK} stroke="none" />
      <circle cx="130" cy="70" r="3.5" fill="#ffffff" />
      <line x1="130" y1="80" x2="130" y2="92" stroke={SPARK} strokeWidth={2.6} />
    </>,
    a
  ),
  'review-library': (a) => wrap(
    <>
      <path d="M60 28h66c4 0 8 4 8 8v36c0 4-4 8-8 8H80l-14 12V36c0-4 4-8 8-8z" />
      <Star cx={76} cy={50} filled />
      <Star cx={92} cy={50} filled />
      <Star cx={108} cy={50} filled />
      <Star cx={124} cy={50} filled />
      <Star cx={140} cy={50} filled={false} />
    </>,
    a
  ),
  'video-qa': (a) => wrap(
    <>
      <circle cx="92" cy="56" r="26" />
      <path d="M86 46l16 10-16 10z" fill={a} stroke="none" />
      <circle cx="138" cy="72" r="10" fill={SPARK} stroke="none" />
      <line x1="138" y1="82" x2="138" y2="94" stroke={SPARK} strokeWidth={2.6} />
    </>,
    a
  ),
  'video-asset-search': (a) => wrap(
    <>
      <rect x="52" y="34" width="80" height="44" rx="4" />
      <line x1="60" y1="34" x2="60" y2="78" />
      <line x1="124" y1="34" x2="124" y2="78" />
      <line x1="68" y1="42" x2="68" y2="50" />
      <line x1="68" y1="62" x2="68" y2="70" />
      <line x1="116" y1="42" x2="116" y2="50" />
      <line x1="116" y1="62" x2="116" y2="70" />
      <rect x="68" y="44" width="48" height="24" rx="2" />
      <circle cx="140" cy="76" r="10" stroke={SPARK} />
      <line x1="148" y1="84" x2="160" y2="96" stroke={SPARK} strokeWidth={2.6} />
    </>,
    a
  ),
  'static-ad-gen': (a) => wrap(
    <>
      <rect x="60" y="22" width="80" height="68" rx="4" />
      <rect x="68" y="30" width="64" height="24" rx="2" fill={a} fillOpacity={0.35} stroke={a} />
      <line x1="68" y1="62" x2="120" y2="62" />
      <line x1="68" y1="70" x2="108" y2="70" />
      <rect x="68" y="76" width="32" height="10" rx="3" fill={SPARK} stroke="none" />
      <path d="M138 24l2 5 5 1-5 2-2 5-2-5-5-2 5-1z" fill={SPARK} stroke={SPARK} />
    </>,
    a
  ),
  'landing-page-summary': (a) => wrap(
    <>
      <rect x="48" y="22" width="104" height="68" rx="4" />
      <line x1="48" y1="34" x2="152" y2="34" />
      <circle cx="56" cy="28" r="1.6" fill={a} />
      <circle cx="62" cy="28" r="1.6" fill={a} />
      <circle cx="68" cy="28" r="1.6" fill={a} />
      <rect x="56" y="42" width="68" height="14" rx="2" fill={SPARK} fillOpacity={0.25} stroke={SPARK} />
      <line x1="56" y1="64" x2="144" y2="64" />
      <line x1="56" y1="72" x2="120" y2="72" />
      <line x1="56" y1="80" x2="100" y2="80" />
    </>,
    a
  ),
  'brand-kit': (a) => wrap(
    <>
      <path d="M100 30c-22 0-40 16-40 30 0 10 8 14 16 14 6 0 8-4 8-8 0-6 6-6 12-6 14 0 24-10 24-18 0-8-10-12-20-12z" />
      <circle cx="78" cy="50" r="3.5" fill={SPARK} stroke="none" />
      <circle cx="92" cy="42" r="3.5" fill={a} />
      <circle cx="108" cy="42" r="3.5" fill={a} />
      <circle cx="120" cy="52" r="3.5" fill={SPARK} stroke="none" />
      <circle cx="94" cy="58" r="3.5" fill={a} />
      <path d="M118 78l16 14" strokeWidth={3} stroke={SPARK} />
    </>,
    a
  ),
  'optimize-landing-page': (a) => wrap(
    <>
      <rect x="48" y="22" width="80" height="58" rx="4" />
      <line x1="48" y1="34" x2="128" y2="34" />
      <rect x="56" y="42" width="48" height="12" rx="2" fill={a} fillOpacity={0.3} stroke={a} />
      <line x1="56" y1="60" x2="116" y2="60" />
      <line x1="56" y1="68" x2="104" y2="68" />
      <circle cx="138" cy="68" r="18" stroke={SPARK} />
      <circle cx="138" cy="68" r="10" stroke={SPARK} />
      <circle cx="138" cy="68" r="3" fill={SPARK} stroke="none" />
    </>,
    a
  ),
  'landing-page-experiments': (a) => wrap(
    <>
      <rect x="48" y="24" width="44" height="62" rx="4" />
      <rect x="108" y="24" width="44" height="62" rx="4" stroke={SPARK} />
      <rect x="54" y="32" width="32" height="10" rx="2" fill={a} fillOpacity={0.3} stroke={a} />
      <rect x="114" y="32" width="32" height="10" rx="2" fill={SPARK} fillOpacity={0.25} stroke={SPARK} />
      <line x1="54" y1="48" x2="86" y2="48" />
      <line x1="54" y1="56" x2="80" y2="56" />
      <line x1="114" y1="48" x2="146" y2="48" />
      <line x1="114" y1="56" x2="140" y2="56" />
      <text x="100" y="60" fontSize="11" fill={SPARK} stroke="none" fontWeight="700" textAnchor="middle">vs</text>
    </>,
    a
  ),
  'csm-alerts': (a) => wrap(
    <>
      <path d="M84 30c0-9 7-16 16-16s16 7 16 16v22c0 6 4 10 4 10H80s4-4 4-10z" />
      <path d="M100 86c-4 0-8-2-9-6h18c-1 4-5 6-9 6" />
      <circle cx="128" cy="34" r="8" fill={SPARK} stroke="none" />
    </>,
    a
  ),
  'meta-connect-use-case': (a) => wrap(
    <>
      <circle cx="84" cy="56" r="22" />
      <circle cx="116" cy="56" r="22" stroke={SPARK} />
      <line x1="100" y1="34" x2="100" y2="78" strokeWidth={3} />
    </>,
    a
  ),
  'building-integrations': (a) => wrap(
    <>
      <Gear cx={86} cy={56} r={22} stroke={a} />
      <Gear cx={126} cy={70} r={14} stroke={SPARK} />
    </>,
    a
  ),
  'integration-capabilities-library': (a) => wrap(
    <>
      <path d="M52 30c10-4 28-4 38 4v54c-10-8-28-8-38-4z" />
      <path d="M148 30c-10-4-28-4-38 4v54c10-8 28-8 38-4z" />
      <line x1="90" y1="34" x2="90" y2="84" />
      <rect x="124" y="62" width="14" height="20" rx="2" fill={SPARK} stroke="none" />
      <line x1="128" y1="62" x2="128" y2="56" stroke={SPARK} strokeWidth={2.6} />
      <line x1="134" y1="62" x2="134" y2="56" stroke={SPARK} strokeWidth={2.6} />
    </>,
    a
  ),
}

export const Illustration = ({ slug, category }: { slug: string; category: string }): JSX.Element => {
  const fn = GLYPHS[slug] ?? fallback
  return fn(accent(category))
}
