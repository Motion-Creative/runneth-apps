import { useState, useCallback, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { readMountedAppPaths } from './app-paths'

// ── Types ─────────────────────────────────────────────────────────────────────

type Platform = 'ig' | 'tt' | 'comm' | 'insense' | 'fiverr' | string
type Arch = string
type VidConfidence = 'confirmed' | 'likely' | 'verify'
type Tier = 1 | 2 | 3
type Product = string
type Urgency = 'urgent' | 'normal' | 'low'

interface Handle { platform: Platform; handle: string; url: string }

interface Creator {
  id: string; name: string; arch: Arch; tier: Tier
  handles: Handle[]; followers: string; engagement: string; rate: string
  vid: VidConfidence; vidEvidence: string
  fitWhy: string; briefAngle: string; caveats: string; dm: string
}

interface VIPCreator {
  id: string; name: string; handle: string; handleUrl: string
  role: string; product: Product; urgency: Urgency
  urgencyNote?: string
  briefAngle: string; strategicNote: string; doNotDo?: string
}

interface Ambassador {
  name: string; handle: string; handleUrl: string
  niche: string; followers: string; code: string
  contentCount: string; lastActive: string; notes: string
  nextBrief: string
}

interface CreatorData {
  brandName: string
  brandSubtitle: string
  personas: Record<string, string>
  selectionCriteria: Array<{ main: string; sub: string }>
  disqualifiers: Array<{ main: string; sub: string }>
  tierDescriptions: { tier1: string; tier2: string; tier3: string }
  sourcingPlatform: { name: string; importNote?: string } | null
  vipCreators: VIPCreator[]
  ambassadors: Ambassador[]
  creators: Creator[]
  priorityCallouts: string[]
}

// ── Load data from API ────────────────────────────────────────────────────────

function useCreatorData() {
  const [data, setData] = useState<CreatorData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { apiBasePath } = readMountedAppPaths()

  useEffect(() => {
    fetch(`${apiBasePath}/creators`)
      .then(r => r.json())
      .then(d => setData(d as CreatorData))
      .catch(() => setError('Failed to load creator data'))
  }, [apiBasePath])

  return { data, error }
}

// ── Style constants ───────────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<string, string> = {
  ig: 'Instagram', tt: 'TikTok', comm: 'Community / Platform', insense: 'Insense', fiverr: 'Fiverr'
}
const PLATFORM_COLORS: Record<string, { bg: string; color: string }> = {
  ig:     { bg: '#fce7f3', color: '#9d174d' },
  tt:     { bg: '#f0f9ff', color: '#0369a1' },
  comm:   { bg: '#ededed', color: '#6f6f6f' },
  insense:{ bg: '#f0fdf4', color: '#166534' },
  fiverr: { bg: '#fff7ed', color: '#c2410c' },
}
// Persona colours are assigned dynamically by position in the brand's persona list.
// Any brand gets a consistent, visually distinct colour per segment regardless of what they name them.
const PERSONA_PALETTE = [
  { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe', avatar: '#3b82f6' },
  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', avatar: '#16a34a' },
  { bg: '#faf5ff', color: '#9333ea', border: '#e9d5ff', avatar: '#9333ea' },
  { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', avatar: '#ea580c' },
  { bg: '#ecfeff', color: '#0891b2', border: '#a5f3fc', avatar: '#0891b2' },
  { bg: '#fefce8', color: '#ca8a04', border: '#fef08a', avatar: '#ca8a04' },
  { bg: '#fef3c7', color: '#92400e', border: '#fde68a', avatar: '#92400e' },
  { bg: '#eef2ff', color: '#6366f1', border: '#c7d2fe', avatar: '#6366f1' },
]
const DEFAULT_ARCH_COLOR = { bg: '#f3f3f3', color: '#6f6f6f', border: '#e2e2e2', avatar: '#8f8f8f' }

function getPersonaColor(personas: Record<string, string>, arch: string) {
  const idx = Object.keys(personas).indexOf(arch)
  if (idx === -1) return DEFAULT_ARCH_COLOR
  return PERSONA_PALETTE[idx % PERSONA_PALETTE.length]
}
const VID_CONFIG: Record<VidConfidence, { label: string; icon: string; barBg: string; barBorder: string; textColor: string; badgeBg: string; badgeColor: string; badgeBorder: string }> = {
  confirmed: { label: '✓ Confirmed on camera', icon: '🎥', barBg: '#f0fdf4', barBorder: '#bbf7d0', textColor: '#166534', badgeBg: '#dcfce7', badgeColor: '#166534', badgeBorder: '#bbf7d0' },
  likely:    { label: '~ Likely on camera',    icon: '🔍', barBg: '#fefce8', barBorder: '#fef08a', textColor: '#854d0e', badgeBg: '#fef9c3', badgeColor: '#854d0e', badgeBorder: '#fef08a' },
  verify:    { label: '! Verify style first',  icon: '⚠️', barBg: '#fef2f2', barBorder: '#fecaca', textColor: '#991b1b', badgeBg: '#fee2e2', badgeColor: '#991b1b', badgeBorder: '#fecaca' },
}
const PRODUCT_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  perform: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
  sleep:   { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  both:    { bg: '#f5f3ff', color: '#5b21b6', border: '#ddd6fe' },
}
const DEFAULT_PRODUCT_COLOR = { bg: '#f3f3f3', color: '#6f6f6f', border: '#e2e2e2' }

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:"Inter",-apple-system,BlinkMacSystemFont,sans-serif;font-size:14px;line-height:20px;letter-spacing:-.006em;color:#171717;background:#f8f8f8;-webkit-font-smoothing:antialiased}
a{color:inherit}
.app{min-height:100vh}
.header{background:#171717;padding:20px 32px;position:sticky;top:0;z-index:100}
.header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px}
.header h1{font-size:18px;font-weight:700;color:#fff;letter-spacing:-.02em}
.header-sub{font-size:12px;color:#c1f14b;font-weight:500;letter-spacing:.04em;text-transform:uppercase;display:block;margin-top:2px}
.header-meta{font-size:12px;color:#8f8f8f}
.page{max-width:1280px;margin:0 auto;padding:0 16px 48px}
.loading{text-align:center;padding:80px;color:#8f8f8f;font-size:15px}
.error-msg{text-align:center;padding:80px;color:#991b1b}
.tab-bar{display:flex;gap:0;border-bottom:2px solid #e2e2e2;margin-bottom:24px;padding-top:24px}
.tab-btn{padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;background:none;border:none;font-family:inherit;color:#6f6f6f;border-bottom:3px solid transparent;margin-bottom:-2px;transition:all .15s;letter-spacing:-.006em}
.tab-btn:hover{color:#171717}
.tab-btn.active{color:#171717;border-bottom-color:#171717}
.tab-count{display:inline-flex;align-items:center;justify-content:center;background:#ededed;color:#6f6f6f;border-radius:999px;font-size:11px;font-weight:600;padding:1px 7px;margin-left:6px}
.tab-btn.active .tab-count{background:#171717;color:#fff}
.urgent-badge{background:#fef2f2;color:#991b1b;border:1px solid #fecaca;border-radius:999px;font-size:11px;font-weight:700;padding:3px 9px;letter-spacing:.01em}
.section-heading{font-size:16px;font-weight:700;letter-spacing:-.02em;margin-bottom:4px}
.section-sub{font-size:13px;color:#6f6f6f;margin-bottom:16px}
.vip-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:12px;margin-bottom:32px}
.vip-card{background:#fff;border:1px solid #e2e2e2;border-radius:16px;overflow:hidden;transition:box-shadow .15s}
.vip-card:hover{box-shadow:0 0 0 1px rgba(0,0,0,.06),0 1px 2px -1px rgba(0,0,0,.24),0 4px 8px 0 rgba(0,0,0,.1)}
.vip-card-top{padding:14px 14px 12px;border-bottom:1px solid #ededed}
.vip-card-header{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px}
.vip-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0;color:#fff;background:#171717}
.vip-name{font-size:15px;font-weight:600;letter-spacing:-.01em;margin-bottom:2px}
.vip-handle{font-size:12px;color:#6f6f6f}
.vip-handle a{text-decoration:none;color:inherit}
.vip-handle a:hover{text-decoration:underline}
.vip-badges{display:flex;flex-wrap:wrap;gap:4px}
.urgent-note{background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:8px 12px;margin:8px 0 0}
.urgent-note-text{font-size:12px;color:#991b1b;font-weight:500}
.vip-card-body{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.vip-section-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8f8f8f;margin-bottom:3px}
.vip-text{font-size:13px;line-height:18px;color:#171717}
.vip-do-not{background:#fef9c3;border:1px solid #fef08a;border-radius:8px;padding:8px 10px}
.expand-btn{background:none;border:none;cursor:pointer;font-size:12px;font-weight:500;color:#6f6f6f;font-family:inherit;padding:0;text-decoration:underline;text-align:left}
.expand-btn:hover{color:#171717}
.detail{display:flex;flex-direction:column;gap:10px}
.amb-note{font-size:13px;color:#6f6f6f;background:#fff;border:1px solid #e2e2e2;border-radius:8px;padding:10px 14px;margin-bottom:16px}
.amb-note strong{color:#171717}
.amb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:8px;margin-bottom:12px}
.amb-card{background:#fff;border:1px solid #e2e2e2;border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:8px;transition:box-shadow .15s}
.amb-card:hover{box-shadow:0 0 0 1px rgba(0,0,0,.06),0 2px 6px rgba(0,0,0,.08)}
.amb-card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}
.amb-name{font-size:14px;font-weight:600;letter-spacing:-.01em}
.amb-handle{font-size:12px;color:#6f6f6f}
.amb-handle a{text-decoration:none;color:inherit}
.amb-handle a:hover{text-decoration:underline}
.amb-code{background:#171717;color:#c1f14b;border-radius:6px;font-size:11px;font-weight:700;padding:2px 8px;letter-spacing:.04em;white-space:nowrap}
.amb-meta{display:flex;gap:8px;flex-wrap:wrap}
.amb-pill{background:#f3f3f3;border-radius:999px;font-size:11px;font-weight:500;padding:2px 8px;color:#6f6f6f}
.amb-pill.active{background:#dcfce7;color:#166534}
.amb-pill.warn{background:#fef9c3;color:#92400e}
.amb-section-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8f8f8f;margin-bottom:2px}
.amb-text{font-size:12px;line-height:17px;color:#171717}
.amb-text.dim{color:#6f6f6f}
.brief-block{background:#f8f7ff;border:1px solid #ddd6fe;border-radius:7px;padding:8px 10px}
.brief-block .amb-text{color:#4c1d95}
.criteria-section{background:#171717;border-radius:16px;padding:24px;margin-bottom:16px}
.criteria-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#8f8f8f;margin-bottom:16px}
.criteria-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.criteria-col-label{font-size:12px;font-weight:600;margin-bottom:8px}
.criteria-col-label.pass{color:#c1f14b}
.criteria-col-label.fail{color:#f87171}
.criteria-list{display:flex;flex-direction:column;gap:4px}
.criteria-item{display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:17px}
.criteria-dot{flex-shrink:0;margin-top:2px;font-size:10px}
.criteria-main{color:#ededed;font-weight:500}
.criteria-sub{color:#8f8f8f;font-size:11px;margin-top:1px}
.tier-legend{background:#fff;border:1px solid #e2e2e2;border-radius:16px;padding:12px 20px;margin-bottom:16px;display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start}
.tier-legend-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6f6f6f;white-space:nowrap;align-self:center}
.tier-item{display:flex;align-items:flex-start;gap:8px}
.tier-sep{width:1px;background:#e2e2e2;align-self:stretch}
.tier-badge-pill{border-radius:999px;font-size:11px;font-weight:600;padding:2px 8px;white-space:nowrap;flex-shrink:0;margin-top:1px}
.tier-1-pill{background:#171717;color:#fff}
.tier-2-pill{background:#e8e8e8;color:#171717}
.tier-3-pill{background:#ededed;color:#6f6f6f}
.tier-desc{font-size:12px;color:#6f6f6f;line-height:16px}
.stats-bar{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.stat-chip{background:#fff;border:1px solid #e2e2e2;border-radius:10px;padding:6px 10px;display:flex;align-items:center;gap:4px}
.stat-n{font-size:18px;font-weight:700;letter-spacing:-.02em;color:#171717}
.stat-l{font-size:13px;color:#6f6f6f}
.stat-divider{width:1px;height:28px;background:#e2e2e2;align-self:center}
.filters{background:#fff;border:1px solid #e2e2e2;border-radius:16px;padding:10px 20px;margin-bottom:16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.filter-group{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.filter-label{font-size:12px;font-weight:500;color:#6f6f6f;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em}
.filter-btn{border:1px solid #e2e2e2;background:#fff;border-radius:8px;padding:4px 10px;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;color:#171717;font-family:inherit;white-space:nowrap}
.filter-btn:hover{background:#f3f3f3}
.filter-btn.active{background:#171717;color:#fff;border-color:#171717}
.filter-sep{width:1px;height:24px;background:#e2e2e2}
.search-input{border:1px solid #e2e2e2;border-radius:8px;padding:5px 10px;font-size:13px;font-family:inherit;outline:none;width:200px;color:#171717}
.search-input:focus{border-color:#8f8f8f}
.search-input::placeholder{color:#8f8f8f}
.results-meta{font-size:13px;color:#6f6f6f;margin-bottom:8px}
.results-meta strong{color:#171717}
.creator-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:8px}
.card{background:#fff;border:1px solid #e2e2e2;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;transition:box-shadow .15s}
.card:hover{box-shadow:0 0 0 1px rgba(0,0,0,.06),0 1px 2px -1px rgba(0,0,0,.24),0 4px 8px 0 rgba(0,0,0,.1)}
.card-top{padding:12px 14px 10px;border-bottom:1px solid #ededed}
.card-header{display:flex;align-items:flex-start;gap:10px;margin-bottom:8px}
.avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;flex-shrink:0;color:#fff}
.card-name{font-size:15px;font-weight:600;letter-spacing:-.01em;margin-bottom:3px}
.card-handles{display:flex;flex-wrap:wrap;gap:3px;align-items:center}
.handle-link{font-size:12px;color:#6f6f6f;text-decoration:none}
.handle-link:hover{color:#171717;text-decoration:underline}
.card-badges{display:flex;flex-wrap:wrap;gap:3px;margin-top:8px}
.badge{display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:999px;font-size:11px;font-weight:600}
.badge-arch{border:1px solid transparent}
.badge-tier-1{background:#171717;color:#fff}
.badge-tier-2{background:#e8e8e8;color:#171717}
.badge-tier-3{background:#ededed;color:#6f6f6f}
.badge-rate{background:#f3e8ff;color:#7e22ce;border:1px solid #e9d5ff}
.platform-badge{display:inline-flex;align-items:center;gap:2px;padding:2px 6px;border-radius:5px;font-size:11px;font-weight:600}
.card-stats{display:flex;gap:16px;margin-top:8px}
.card-stat{display:flex;flex-direction:column}
.stat-num{font-size:14px;font-weight:600;letter-spacing:-.01em}
.stat-lbl{font-size:11px;color:#6f6f6f}
.video-bar{padding:6px 14px;display:flex;gap:7px;align-items:flex-start}
.video-bar-text{font-size:12px;line-height:17px}
.video-bar-text strong{font-weight:600}
.dm-block{background:#f8f7ff;border:1px solid #ddd6fe;border-radius:8px;padding:10px 12px}
.dm-block.platform{background:#f3f3f3;border-color:#e2e2e2}
.dm-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}
.dm-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#7c3aed}
.dm-label.platform{color:#6f6f6f}
.dm-text{font-size:13px;line-height:19px;color:#171717;white-space:pre-line;font-style:italic}
.dm-text.platform{font-style:normal;color:#6f6f6f;font-size:12px}
.copy-btn{background:#7c3aed;color:#fff;border:none;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:background .15s}
.copy-btn:hover{background:#6d28d9}
.copy-btn.copied{background:#30a46c}
.card-body{padding:10px 14px;flex:1;display:flex;flex-direction:column;gap:10px}
.section-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#8f8f8f;margin-bottom:3px}
.card-text{font-size:13px;line-height:18px;color:#171717}
.caveat-block{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:8px 10px}
.caveat-block .card-text{color:#92400e;font-size:12px}
.empty-state{text-align:center;padding:48px;color:#6f6f6f}
.empty-state h3{font-size:16px;color:#171717;margin-bottom:8px}
@media(max-width:700px){.criteria-cols{grid-template-columns:1fr}}
@media(max-width:640px){
  .creator-grid,.vip-grid,.amb-grid{grid-template-columns:1fr}
  .header{padding:12px 16px}
  .tier-legend{flex-direction:column}
}
`

// ── VIP Card ──────────────────────────────────────────────────────────────────

function VIPCard({ v, productLabels }: { v: VIPCreator; productLabels: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false)
  const initials = v.name.split(' ').map(w => w[0]).slice(0, 2).join('')
  const productStyle = PRODUCT_COLORS[v.product] ?? DEFAULT_PRODUCT_COLOR

  return (
    <div className="vip-card">
      <div className="vip-card-top">
        <div className="vip-card-header">
          <div className="vip-avatar">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="vip-name">{v.name}</div>
            <div className="vip-handle"><a href={v.handleUrl} target="_blank" rel="noopener noreferrer">{v.handle}</a></div>
          </div>
        </div>
        <div className="vip-badges">
          <span className="badge" style={{ background: '#f3f3f3', color: '#6f6f6f', border: '1px solid #e2e2e2' }}>{v.role}</span>
          <span className="badge" style={{ background: productStyle.bg, color: productStyle.color, border: `1px solid ${productStyle.border}` }}>
            {productLabels[v.product] ?? v.product}
          </span>
          {v.urgency === 'urgent' && <span className="urgent-badge">🔴 URGENT</span>}
          {v.urgency === 'low' && <span className="badge" style={{ background: '#f3f3f3', color: '#8f8f8f', border: '1px solid #e2e2e2' }}>Hard brief</span>}
        </div>
        {v.urgencyNote && <div className="urgent-note"><div className="urgent-note-text">⚡ {v.urgencyNote}</div></div>}
      </div>
      <div className="vip-card-body">
        <div>
          <div className="vip-section-label">Brief angle</div>
          <div className="vip-text">{v.briefAngle}</div>
        </div>
        <button className="expand-btn" onClick={() => setExpanded(e => !e)}>
          {expanded ? '▾ Hide strategic notes' : '▸ Strategic notes'}
        </button>
        {expanded && (
          <div className="detail">
            <div><div className="vip-section-label">Strategic context</div><div className="vip-text">{v.strategicNote}</div></div>
            {v.doNotDo && (
              <div className="vip-do-not">
                <div className="vip-section-label" style={{ color: '#92400e' }}>⚠ Don't do this</div>
                <div className="vip-text">{v.doNotDo}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Ambassador Card ───────────────────────────────────────────────────────────

function AmbassadorCard({ a }: { a: Ambassador }) {
  const [expanded, setExpanded] = useState(false)
  const hasContent = a.contentCount !== 'No content yet'

  return (
    <div className="amb-card">
      <div className="amb-card-header">
        <div>
          <div className="amb-name">{a.name}</div>
          <div className="amb-handle"><a href={a.handleUrl} target="_blank" rel="noopener noreferrer">{a.handle}</a> · {a.niche} · {a.followers}</div>
        </div>
        {a.code && <span className="amb-code">{a.code}</span>}
      </div>
      <div className="amb-meta">
        <span className={`amb-pill ${hasContent ? 'active' : 'warn'}`}>
          {hasContent ? `📹 ${a.contentCount}` : '⚠ No content yet'}
        </span>
        <span className="amb-pill">Last active: {a.lastActive}</span>
      </div>
      {a.notes && <div className="amb-text dim">{a.notes}</div>}
      <button className="expand-btn" onClick={() => setExpanded(e => !e)}>
        {expanded ? '▾ Hide brief recommendation' : '▸ Next brief recommendation'}
      </button>
      {expanded && (
        <div className="brief-block">
          <div className="amb-section-label" style={{ color: '#5b21b6', marginBottom: 3 }}>Next brief</div>
          <div className="amb-text">{a.nextBrief}</div>
        </div>
      )}
    </div>
  )
}

// ── Access Tab ────────────────────────────────────────────────────────────────

function AccessTab({ data }: { data: CreatorData }) {
  const productLabels = { perform: 'AM Product', sleep: 'PM Product', both: 'Both products' }
  const activeMost = data.ambassadors.filter((_, i) => i < 7)
  const activeRest = data.ambassadors.slice(7)

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div className="section-heading">VIP & Key Relationships</div>
        <div className="section-sub">People with direct access through investor, partner, or existing commercial relationships. These need specific, considered briefs — not cold outreach.</div>
        <div className="vip-grid">
          {data.vipCreators.map(v => <VIPCard key={v.id} v={v} productLabels={productLabels} />)}
        </div>
      </div>
      <div>
        <div className="section-heading">Active Ambassador Programme</div>
        <div className="section-sub">Currently active creators in the programme.</div>
        {data.priorityCallouts.length > 0 && (
          <div className="amb-note">
            <strong>Priorities right now:</strong> {data.priorityCallouts.join(' · ')}
          </div>
        )}
        {activeMost.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6f6f6f', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Most active — posting regularly</div>
            <div className="amb-grid">{activeMost.map(a => <AmbassadorCard key={a.name} a={a} />)}</div>
          </div>
        )}
        {activeRest.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6f6f6f', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, marginTop: 16 }}>Onboarded — need chasing for video content</div>
            <div className="amb-grid">{activeRest.map(a => <AmbassadorCard key={a.name} a={a} />)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Creator Card ──────────────────────────────────────────────────────────────

function CreatorCard({ c, personas }: { c: Creator; personas: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const archColors = getPersonaColor(personas, c.arch)
  const vidConf = VID_CONFIG[c.vid]
  const isPlatformDM = c.dm.startsWith('N/A')
  const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('')
  const tierLabel = c.tier === 1 ? '● Tier 1 — Start This Week' : c.tier === 2 ? 'Tier 2' : 'Tier 3 — Bigger Campaign'
  const tierCls = `badge badge-tier-${c.tier}`

  const copyDM = useCallback(() => {
    navigator.clipboard.writeText(c.dm).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [c.dm])

  return (
    <div className="card">
      <div className="card-top">
        <div className="card-header">
          <div className="avatar" style={{ background: archColors.avatar }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="card-name">{c.name}</div>
            <div className="card-handles">
              {c.handles.map((h, i) => {
                const pc = PLATFORM_COLORS[h.platform] ?? { bg: '#f3f3f3', color: '#6f6f6f' }
                return (
                  <span key={h.handle} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {i > 0 && <span style={{ color: '#dbdbdb', fontSize: 11 }}> · </span>}
                    <span className="platform-badge" style={{ background: pc.bg, color: pc.color }}>
                      {PLATFORM_LABELS[h.platform] ?? h.platform}
                    </span>
                    <a className="handle-link" href={h.url} target="_blank" rel="noopener noreferrer">{h.handle}</a>
                  </span>
                )
              })}
            </div>
          </div>
        </div>
        <div className="card-badges">
          <span className="badge badge-arch" style={{ background: archColors.bg, color: archColors.color, borderColor: archColors.border }}>
            {personas[c.arch] ?? c.arch}
          </span>
          <span className={tierCls}>{tierLabel}</span>
          <span className="badge" style={{ background: vidConf.badgeBg, color: vidConf.badgeColor, border: `1px solid ${vidConf.badgeBorder}` }}>
            {vidConf.label}
          </span>
          {c.rate && <span className="badge badge-rate">{c.rate}</span>}
        </div>
        <div className="card-stats">
          <div className="card-stat"><span className="stat-num">{c.followers}</span><span className="stat-lbl">Followers</span></div>
          <div className="card-stat"><span className="stat-num" style={{ fontSize: 12, letterSpacing: 0 }}>{c.engagement}</span><span className="stat-lbl">Signal</span></div>
        </div>
      </div>
      <div className="video-bar" style={{ background: vidConf.barBg, borderBottom: `1px solid ${vidConf.barBorder}` }}>
        <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{vidConf.icon}</span>
        <div className="video-bar-text" style={{ color: vidConf.textColor }}>
          <strong>Video evidence:</strong> {c.vidEvidence}
        </div>
      </div>
      <div className="card-body">
        {isPlatformDM ? (
          <div className="dm-block platform">
            <div className="dm-header"><div className="dm-label platform">How to source</div></div>
            <div className="dm-text platform">{c.dm.replace('N/A — ', '')}</div>
          </div>
        ) : (
          <div className="dm-block">
            <div className="dm-header">
              <div className="dm-label">📩 First outreach DM</div>
              <button className={`copy-btn${copied ? ' copied' : ''}`} onClick={copyDM}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <div className="dm-text">{c.dm}</div>
          </div>
        )}
        <div><div className="section-label">Why fits</div><div className="card-text">{c.fitWhy}</div></div>
        <button className="expand-btn" onClick={() => setExpanded(e => !e)}>
          {expanded ? '▾ Hide brief angle & caveats' : '▸ Brief angle & caveats'}
        </button>
        {expanded && (
          <div className="detail">
            <div><div className="section-label">Best brief angle</div><div className="card-text">{c.briefAngle}</div></div>
            {c.caveats && (
              <div className="caveat-block">
                <div className="section-label" style={{ color: '#92400e' }}>⚠ Caveats</div>
                <div className="card-text">{c.caveats}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sourcing Tab ──────────────────────────────────────────────────────────────

function SourcingTab({ data }: { data: CreatorData }) {
  const [archFilter, setArchFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<Tier | 'all'>('all')
  const [vidFilter, setVidFilter] = useState<VidConfidence | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = data.creators.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.handles.some(h => h.handle.toLowerCase().includes(q))
    return (archFilter === 'all' || c.arch === archFilter)
      && (tierFilter === 'all' || c.tier === tierFilter)
      && (vidFilter === 'all' || c.vid === vidFilter)
      && matchSearch
  })

  const vidCounts = {
    confirmed: data.creators.filter(c => c.vid === 'confirmed').length,
    likely: data.creators.filter(c => c.vid === 'likely').length,
    verify: data.creators.filter(c => c.vid === 'verify').length,
  }
  const tier1Count = data.creators.filter(c => c.tier === 1).length

  return (
    <div>
      {/* Criteria */}
      <div className="criteria-section">
        <div className="criteria-title">Creator selection criteria</div>
        <div className="criteria-cols">
          <div>
            <div className="criteria-col-label pass">✓ What we need in a creator</div>
            <div className="criteria-list">
              {data.selectionCriteria.map(item => (
                <div className="criteria-item" key={item.main}>
                  <span className="criteria-dot" style={{ color: '#c1f14b' }}>●</span>
                  <div><div className="criteria-main">{item.main}</div><div className="criteria-sub">{item.sub}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="criteria-col-label fail">✗ Creator disqualifiers</div>
            <div className="criteria-list">
              {data.disqualifiers.map(item => (
                <div className="criteria-item" key={item.main}>
                  <span className="criteria-dot" style={{ color: '#f87171' }}>●</span>
                  <div><div className="criteria-main" style={{ color: '#ededed' }}>{item.main}</div><div className="criteria-sub">{item.sub}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tier legend */}
      <div className="tier-legend">
        <div className="tier-legend-title">What the tiers mean</div>
        <div className="tier-sep" />
        <div className="tier-item">
          <span className="tier-badge-pill tier-1-pill">● Tier 1</span>
          <div className="tier-desc">{data.tierDescriptions.tier1}</div>
        </div>
        <div className="tier-sep" />
        <div className="tier-item">
          <span className="tier-badge-pill tier-2-pill">Tier 2</span>
          <div className="tier-desc">{data.tierDescriptions.tier2}</div>
        </div>
        <div className="tier-sep" />
        <div className="tier-item">
          <span className="tier-badge-pill tier-3-pill">Tier 3</span>
          <div className="tier-desc">{data.tierDescriptions.tier3}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-chip"><span className="stat-n">{data.creators.length}</span><span className="stat-l">Total creators</span></div>
        <div className="stat-chip"><span className="stat-n">{tier1Count}</span><span className="stat-l">Tier 1 — start this week</span></div>
        <div className="stat-divider" />
        <div className="stat-chip"><span className="stat-n" style={{ color: '#166534' }}>{vidCounts.confirmed}</span><span className="stat-l">Video confirmed</span></div>
        <div className="stat-chip"><span className="stat-n" style={{ color: '#854d0e' }}>{vidCounts.likely}</span><span className="stat-l">Likely on camera</span></div>
        <div className="stat-chip"><span className="stat-n" style={{ color: '#991b1b' }}>{vidCounts.verify}</span><span className="stat-l">Verify first</span></div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <span className="filter-label">Persona</span>
          <button className={`filter-btn${archFilter === 'all' ? ' active' : ''}`} onClick={() => setArchFilter('all')}>All</button>
          {Object.entries(data.personas).map(([key, label]) => (
            <button key={key} className={`filter-btn${archFilter === key ? ' active' : ''}`} onClick={() => setArchFilter(key)}>{label}</button>
          ))}
        </div>
        <div className="filter-sep" />
        <div className="filter-group">
          <span className="filter-label">Tier</span>
          {(['all', 1, 2, 3] as const).map(t => (
            <button key={t} className={`filter-btn${tierFilter === t ? ' active' : ''}`} onClick={() => setTierFilter(t)}>
              {t === 'all' ? 'All' : `Tier ${t}`}
            </button>
          ))}
        </div>
        <div className="filter-sep" />
        <div className="filter-group">
          <span className="filter-label">Video</span>
          {(['all', 'confirmed', 'likely', 'verify'] as const).map(v => (
            <button key={v} className={`filter-btn${vidFilter === v ? ' active' : ''}`} onClick={() => setVidFilter(v)}>
              {v === 'all' ? 'All' : v === 'confirmed' ? 'Confirmed' : v === 'likely' ? 'Likely' : 'Verify first'}
            </button>
          ))}
        </div>
        <div className="filter-sep" />
        <input className="search-input" type="text" placeholder="Search name or handle…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="results-meta">Showing <strong>{filtered.length}</strong> of <strong>{data.creators.length}</strong> creators</div>

      {filtered.length === 0 ? (
        <div className="empty-state"><h3>No creators match these filters</h3><p>Try adjusting the filters above.</p></div>
      ) : (
        <div className="creator-grid">{filtered.map(c => <CreatorCard key={c.id} c={c} personas={data.personas} />)}</div>
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

function App() {
  const { data, error } = useCreatorData()
  const [activeTab, setActiveTab] = useState<'access' | 'sourcing'>('access')

  if (error) return <div className="error-msg">{error}</div>
  if (!data) return <div className="loading">Loading creator programme…</div>

  const urgentCount = data.vipCreators.filter(v => v.urgency === 'urgent').length
  const totalAccess = data.vipCreators.length + data.ambassadors.length

  return (
    <div className="app">
      <style>{CSS}</style>
      <header className="header">
        <div className="header-inner">
          <div>
            <h1>{data.brandName} — Creator Programme</h1>
            <span className="header-sub">{data.brandSubtitle}</span>
          </div>
          <div className="header-meta">
            {data.vipCreators.length} VIP · {data.ambassadors.length} ambassadors · {data.creators.length} to source
          </div>
        </div>
      </header>
      <div className="page">
        <div className="tab-bar">
          <button className={`tab-btn${activeTab === 'access' ? ' active' : ''}`} onClick={() => setActiveTab('access')}>
            Who We Have Access To
            <span className="tab-count">{totalAccess}</span>
            {urgentCount > 0 && <span className="urgent-badge" style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px' }}>🔴 {urgentCount} urgent</span>}
          </button>
          <button className={`tab-btn${activeTab === 'sourcing' ? ' active' : ''}`} onClick={() => setActiveTab('sourcing')}>
            Creator Sourcing List
            <span className="tab-count">{data.creators.length}</span>
          </button>
        </div>
        {activeTab === 'access' ? <AccessTab data={data} /> : <SourcingTab data={data} />}
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
