import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'

declare const Prism: {
  highlight: (code: string, grammar: unknown, language: string) => string
  languages: Record<string, unknown>
  plugins: { autoloader?: { languages_path: string } }
}

function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', md: 'markdown', html: 'markup', css: 'css',
    sh: 'bash', py: 'python', yaml: 'yaml', yml: 'yaml',
    toml: 'toml', rs: 'rust', go: 'go', txt: 'plain',
  }
  return map[ext] ?? 'plain'
}

interface FsEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modified?: string
}

interface ListResponse {
  ok: boolean
  path: string
  entries: FsEntry[]
  error?: string
}

interface ReadResponse {
  ok: boolean
  path: string
  content: string | null
  truncated: boolean
  size: number
  error?: string
}

const ROOT = '/agent'

/* ── Design tokens ─────────────────────────────────────────────────── */
const c = {
  gray0:  '#ffffff',
  gray1:  '#fcfcfc',
  gray2:  '#f8f8f8',
  gray3:  '#f3f3f3',
  gray4:  '#ededed',
  gray6:  '#e2e2e2',
  gray9:  '#8f8f8f',
  gray11: '#6f6f6f',
  gray12: '#171717',
  primary9:  '#c1f14b',
  primary11: '#627d20',
}

const sp = {
  s05: '4px',
  s1:  '8px',
  s15: '12px',
  s2:  '16px',
  s3:  '24px',
  s4:  '32px',
  s5:  '40px',
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function formatSize(bytes?: number): string {
  if (bytes === undefined) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/* ── Icons (inline SVG, no emoji) ───────────────────────────────────── */
function FolderIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M1.5 3.5A1 1 0 0 1 2.5 2.5H6l1.5 1.5H13.5a1 1 0 0 1 1 1V12.5a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1V3.5Z" fill={c.gray9} />
    </svg>
  )
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  const color: Record<string, string> = {
    ts: '#3178c6', tsx: '#3178c6', js: '#f7df1e', jsx: '#f7df1e',
    json: '#f76808', md: c.gray9, txt: c.gray9, html: '#e34c26',
    css: '#264de4', sh: c.gray12, py: '#3572a5', pdf: '#e5484d',
  }
  const fill = color[ext] ?? c.gray9
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M3.5 1.5H9.5L13.5 5.5V14.5a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V2.5a1 1 0 0 1 1-1Z" fill={fill} opacity="0.2" stroke={fill} strokeWidth="1" />
      <path d="M9.5 1.5V5.5H13.5" stroke={fill} strokeWidth="1" fill="none" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4.5 2.5L8 6l-3.5 3.5" stroke={c.gray9} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}


/* ── Breadcrumbs ────────────────────────────────────────────────────── */
function Breadcrumbs({ currentPath, onNavigate }: { currentPath: string; onNavigate: (p: string) => void }) {
  const segments = currentPath.replace(ROOT, '').split('/').filter(Boolean)
  const crumbs: { label: string; path: string }[] = [
    { label: 'agent', path: ROOT },
    ...segments.map((seg, i) => ({
      label: seg,
      path: ROOT + '/' + segments.slice(0, i + 1).join('/'),
    })),
  ]

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: sp.s05, flexWrap: 'wrap' }}>
      {crumbs.map((crumb, i) => (
        <React.Fragment key={crumb.path}>
          {i > 0 && <ChevronRight />}
          <button
            onClick={() => { if (i < crumbs.length - 1) onNavigate(crumb.path) }}
            style={{
              background: 'none',
              border: 'none',
              padding: `2px ${sp.s05}`,
              borderRadius: '6px',
              cursor: i === crumbs.length - 1 ? 'default' : 'pointer',
              fontSize: '13px',
              fontWeight: i === crumbs.length - 1 ? 600 : 400,
              color: i === crumbs.length - 1 ? c.gray12 : c.gray11,
              fontFamily: 'inherit',
              lineHeight: '20px',
            }}
            onMouseEnter={e => { if (i < crumbs.length - 1) (e.currentTarget as HTMLElement).style.background = c.gray3 }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
          >
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  )
}

/* ── Syntax highlighted code block ─────────────────────────────────── */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function HighlightedCode({ content, filePath }: { content: string; filePath: string }) {
  const ref = useRef<HTMLElement>(null)
  const lang = getLanguage(filePath)

  useEffect(() => {
    if (!ref.current) return
    if (typeof Prism !== 'undefined' && lang !== 'plain' && Prism.languages[lang]) {
      ref.current.innerHTML = Prism.highlight(content, Prism.languages[lang], lang)
    } else {
      ref.current.innerHTML = escapeHtml(content)
    }
  }, [content, lang])

  return (
    <pre style={{
      margin: 0,
      border: `1px solid ${c.gray6}`,
      borderRadius: '10px',
      padding: sp.s2,
      overflowX: 'auto',
    }}>
      <code ref={ref} className={lang !== 'plain' ? `language-${lang}` : undefined} />
    </pre>
  )
}

/* ── File viewer ────────────────────────────────────────────────────── */
const EDITABLE_EXTS = new Set(['md','txt','ts','tsx','js','jsx','json','css','html','sh','py','yaml','yml','toml','rs','go','env','gitignore'])

function isEditable(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? ''
  return EDITABLE_EXTS.has(ext)
}

function FileViewer({ filePath, onClose }: { filePath: string; onClose: () => void }) {
  const [content, setContent] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`api/fs/read?path=${encodeURIComponent(filePath)}`)
      .then(r => r.json() as Promise<ReadResponse>)
      .then(data => {
        if (!data.ok) throw new Error(data.error ?? 'Could not read file')
        setContent(data.content)
        setTruncated(data.truncated)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [filePath])

  const handleEdit = () => {
    setDraft(content ?? '')
    setSaveError(null)
    setSaved(false)
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setSaveError(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      const res = await fetch('api/fs/write', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: filePath, content: draft }),
      })
      const data = await res.json() as { ok: boolean; error?: string }
      if (!data.ok) throw new Error(data.error ?? 'Save failed')
      setContent(draft)
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // Clicking any parent crumb closes the viewer (returns to folder view)
  const navigateBreadcrumb = (p: string) => {
    if (p === filePath) return // current file, do nothing
    onClose() // going to any parent closes the viewer
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: c.gray0, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: '14px', lineHeight: '20px', letterSpacing: '-0.006em', WebkitFontSmoothing: 'antialiased' }}>
      {/* Viewer header — same structure as folder header */}
      <header style={{
        background: c.gray0,
        borderBottom: `1px solid ${c.gray6}`,
        padding: `${sp.s2} ${sp.s3}`,
        display: 'flex',
        flexDirection: 'column',
        gap: sp.s1,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Breadcrumbs currentPath={filePath} onNavigate={navigateBreadcrumb} />
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.s1, flexShrink: 0, marginLeft: sp.s2 }}>
            {saved && (
              <span style={{ fontSize: '12px', color: c.primary11, fontWeight: 500 }}>Saved</span>
            )}
            {saveError && (
              <span style={{ fontSize: '12px', color: '#cd2b31' }}>{saveError}</span>
            )}
            {!editing && !truncated && isEditable(filePath) && content !== null && (
              <button
                onClick={handleEdit}
                style={{
                  display: 'inline-flex', alignItems: 'center', height: '28px',
                  padding: `0 ${sp.s15}`, fontFamily: 'inherit', fontSize: '12px',
                  fontWeight: 500, border: `1px solid ${c.gray6}`, borderRadius: '8px',
                  cursor: 'pointer', background: c.gray0, color: c.gray12,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = c.gray3 }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.gray0 }}
              >
                Edit
              </button>
            )}
            {editing && (
              <>
                <button
                  onClick={handleCancel}
                  style={{
                    display: 'inline-flex', alignItems: 'center', height: '28px',
                    padding: `0 ${sp.s15}`, fontFamily: 'inherit', fontSize: '12px',
                    fontWeight: 500, border: `1px solid ${c.gray6}`, borderRadius: '8px',
                    cursor: 'pointer', background: c.gray0, color: c.gray12,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = c.gray3 }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = c.gray0 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: 'inline-flex', alignItems: 'center', height: '28px',
                    padding: `0 ${sp.s15}`, fontFamily: 'inherit', fontSize: '12px',
                    fontWeight: 500, border: 'none', borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    background: c.gray12, color: c.gray0, opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Viewer content */}
      <main style={{ flex: 1, overflow: 'auto', padding: sp.s3 }}>
        {loading && (
          <div style={{ color: c.gray9, fontSize: '13px' }}>Loading…</div>
        )}
        {error && (
          <div style={{ padding: sp.s2, background: '#ffefef', border: `1px solid #f3aeaf`, borderRadius: '10px', color: '#cd2b31', fontSize: '13px' }}>
            {error}
          </div>
        )}
        {truncated && (
          <div style={{ marginBottom: sp.s2, padding: sp.s15, background: '#fff1e7', border: `1px solid #f5c27a`, borderRadius: '10px', color: '#bd4b00', fontSize: '12px' }}>
            File exceeds 500 KB. Only a preview is available.
          </div>
        )}
        {!loading && !error && content !== null && !editing && (
          <HighlightedCode content={content} filePath={filePath} />
        )}
        {editing && (
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            spellCheck={false}
            style={{
              width: '100%',
              minHeight: '70vh',
              fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, 'Menlo', monospace",
              fontSize: '12.5px',
              lineHeight: '20px',
              color: c.gray12,
              background: c.gray0,
              border: `1px solid ${c.gray6}`,
              borderRadius: '10px',
              padding: sp.s2,
              resize: 'vertical',
              outline: 'none',
              letterSpacing: 0,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#aaa' }}
            onBlur={e => { e.currentTarget.style.borderColor = c.gray6 }}
          />
        )}
      </main>
    </div>
  )
}

/* ── App ────────────────────────────────────────────────────────────── */
function App() {
  const [currentPath, setCurrentPath] = useState<string>(ROOT)
  const [entries, setEntries] = useState<FsEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [openFile, setOpenFile] = useState<string | null>(null)

  const navigate = useCallback((dir: string) => {
    if (!dir.startsWith(ROOT)) return
    setCurrentPath(dir)
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`api/fs/list?dir=${encodeURIComponent(currentPath)}`)
      .then(r => r.json() as Promise<ListResponse>)
      .then(data => {
        if (!data.ok) throw new Error(data.error ?? 'Unknown error')
        setEntries(data.entries)
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [currentPath])

  const filtered = entries.filter(e => !e.name.startsWith('.'))

  if (openFile) {
    return <FileViewer filePath={openFile} onClose={() => setOpenFile(null)} />
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: c.gray0,
      color: c.gray12,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: '14px',
      lineHeight: '20px',
      letterSpacing: '-0.006em',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Header */}
      <header style={{
        background: c.gray0,
        borderBottom: `1px solid ${c.gray6}`,
        padding: `${sp.s2} ${sp.s3}`,
        display: 'flex',
        flexDirection: 'column',
        gap: sp.s1,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        {/* Breadcrumbs + item count */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Breadcrumbs currentPath={currentPath} onNavigate={navigate} />
          <span style={{ fontSize: '12px', color: c.gray11, flexShrink: 0, marginLeft: sp.s2 }}>
            {filtered.length} {filtered.length === 1 ? 'item' : 'items'}
          </span>
        </div>
      </header>

      {/* Content */}
      <main style={{ padding: `0 ${sp.s3} ${sp.s5}` }}>
        {loading && (
          <div style={{ padding: `${sp.s5} 0`, textAlign: 'center', color: c.gray9, fontSize: '13px' }}>
            Loading…
          </div>
        )}

        {error && (
          <div style={{
            margin: `${sp.s3} 0`,
            padding: sp.s2,
            background: '#ffefef',
            border: `1px solid #f3aeaf`,
            borderRadius: '10px',
            color: '#cd2b31',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ padding: `${sp.s5} 0`, textAlign: 'center', color: c.gray9, fontSize: '13px' }}>
            This directory is empty.
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${c.gray6}` }}>
                <th style={{ padding: `${sp.s1} ${sp.s15}`, textAlign: 'left', fontWeight: 500, fontSize: '12px', color: c.gray11, lineHeight: '16px', letterSpacing: 0 }}>
                  Name
                </th>
                <th style={{ padding: `${sp.s1} ${sp.s15}`, textAlign: 'right', fontWeight: 500, fontSize: '12px', color: c.gray11, lineHeight: '16px', letterSpacing: 0, whiteSpace: 'nowrap' }}>
                  Size
                </th>
                <th style={{ padding: `${sp.s1} ${sp.s15}`, textAlign: 'left', fontWeight: 500, fontSize: '12px', color: c.gray11, lineHeight: '16px', letterSpacing: 0, whiteSpace: 'nowrap' }}>
                  Modified
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr
                  key={entry.path}
                  onClick={() => {
                    if (entry.type === 'directory') navigate(entry.path)
                    else setOpenFile(entry.path)
                  }}
                  onMouseEnter={() => setHoveredRow(entry.path)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: `1px solid ${c.gray4}`,
                    cursor: 'pointer',
                    background: hoveredRow === entry.path ? c.gray2 : 'transparent',
                  }}
                >
                  <td style={{ padding: `9px ${sp.s15}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: sp.s1 }}>
                      {entry.type === 'directory'
                        ? <FolderIcon />
                        : <FileIcon name={entry.name} />
                      }
                      <span style={{
                        color: entry.type === 'directory' ? c.gray12 : c.gray12,
                        fontWeight: entry.type === 'directory' ? 500 : 400,
                        wordBreak: 'break-all',
                        lineHeight: '20px',
                      }}>
                        {entry.name}
                      </span>
                      {entry.type === 'directory' && hoveredRow === entry.path && (
                        <span style={{ marginLeft: 'auto', paddingLeft: sp.s1, flexShrink: 0 }}>
                          <ChevronRight />
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: `9px ${sp.s15}`, textAlign: 'right', color: c.gray11, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {entry.type === 'directory' ? '—' : formatSize(entry.size)}
                  </td>
                  <td style={{ padding: `9px ${sp.s15}`, color: c.gray11, whiteSpace: 'nowrap', fontSize: '12px' }}>
                    {formatDate(entry.modified)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<App />)
