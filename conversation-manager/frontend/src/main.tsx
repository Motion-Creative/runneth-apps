import React, { useEffect, useState, useCallback, useRef } from 'react'
import { createRoot } from 'react-dom/client'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppInfo { name: string; route: string; url: string }

interface Conversation {
  id: string
  title: string
  status: 'active' | 'waiting' | 'done'
  thinking: boolean
  autoDone: boolean
  preview: string | null
  unseen: boolean
  apps: AppInfo[]
  source: 'slack' | 'web'
  runnethUrl: string
  started_at: string
  updated_at: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  created_at: string
  local?: boolean
}

interface ArchivedConv {
  id: string
  title: string
  runnethUrl: string
  updated_at: string
}

// ── API ───────────────────────────────────────────────────────────────────────

const API = '/conversation-manager/api'

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!r.ok) {
    const b = await r.json().catch(() => ({}))
    throw new Error(b.error ?? `API ${r.status}`)
  }
  return r.json()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function rel(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const m = Math.floor((Date.now() - d.getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const dy = Math.floor(h / 24)
  if (dy === 1) return 'yesterday'
  if (dy < 7) return `${dy}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function full(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// ── Message panel ─────────────────────────────────────────────────────────────

function MessagePanel({ conv, onClose }: { conv: Conversation; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Mark seen immediately on open
    apiFetch(`/conversations/${conv.id}/seen`, { method: 'POST' }).catch(() => {})
    apiFetch(`/conversations/${conv.id}/messages`)
      .then(setMessages)
      .finally(() => setLoading(false))
  }, [conv.id])

  // Poll for new messages while panel is open (e.g. agent responds while you watch)
  useEffect(() => {
    const id = setInterval(async () => {
      const msgs = await apiFetch(`/conversations/${conv.id}/messages`).catch(() => null)
      if (msgs) {
        setMessages(msgs)
        apiFetch(`/conversations/${conv.id}/seen`, { method: 'POST' }).catch(() => {})
      }
    }, 5000)
    return () => clearInterval(id)
  }, [conv.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  async function handleSend() {
    if (!replyText.trim() || sending) return
    setSending(true)
    setSendError(null)
    const text = replyText.trim()
    try {
      await apiFetch(`/conversations/${conv.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      setMessages(prev => [...prev, {
        id: `local-${Date.now()}`,
        role: 'user',
        text,
        created_at: new Date().toISOString(),
        local: true,
      }])
      setReplyText('')
      textareaRef.current?.focus()
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="panel">
        {/* Header */}
        <div className="panel-header">
          <div className="panel-header-left">
            {conv.thinking && (
              <span className="pill pill-thinking">
                <span className="thinking-dot pulse" />
                Thinking
              </span>
            )}
            <span className="panel-title">{conv.title}</span>
          </div>
          <div className="panel-header-right">
            <a href={conv.runnethUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
              Open in Runneth ↗
            </a>
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {/* Messages */}
        <div className="message-list">
          {loading ? (
            <p className="message-empty">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="message-empty">No messages yet.</p>
          ) : (
            <>
              {messages.length >= 6 && (
                <div className="message-older">
                  <a href={conv.runnethUrl} target="_blank" rel="noreferrer">View full conversation ↗</a>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.role === 'user' ? 'message-row-user' : 'message-row-assistant'}`}>
                  <div className={`message-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-assistant'} ${msg.local ? 'bubble-local' : ''}`}>
                    <p className="message-text">{msg.text}</p>
                    {msg.local && <span className="message-local-badge">Sent from board</span>}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Reply */}
        <div className="reply-box">
          {sendError && <p className="reply-error">{sendError}</p>}
          <div className="reply-row">
            <textarea
              ref={textareaRef}
              className="reply-input"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply... (Enter to send, Shift+Enter for new line)"
              rows={3}
              disabled={sending}
            />
            <button
              className="btn btn-primary"
              onClick={handleSend}
              disabled={!replyText.trim() || sending}
              style={{ opacity: !replyText.trim() || sending ? 0.4 : 1, alignSelf: 'flex-end' }}
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
          <p className="reply-meta">
            Started {full(conv.started_at)} · Last active {rel(conv.updated_at)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

function Card({ conv, onOpen, onArchive, onMarkDone, onUnmarkDone }: {
  conv: Conversation
  onOpen: () => void
  onArchive: () => void
  onMarkDone: () => void
  onUnmarkDone: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      className={[
        'conv-card',
        conv.thinking ? 'conv-card-thinking' : conv.status === 'waiting' ? 'conv-card-waiting' : '',
        conv.unseen ? 'conv-card-unseen' : '',
      ].filter(Boolean).join(' ')}
      onClick={onOpen}
    >
      <div className="conv-card-top">
        {conv.thinking ? (
          <span className="pill pill-thinking">
            <span className="thinking-dot pulse" />
            Thinking
          </span>
        ) : conv.status === 'done' ? (
          <span className="pill pill-done" title={conv.autoDone ? 'Auto-detected as done' : 'Marked as done'}>
            {conv.autoDone ? '✓ Done' : 'Done'}
          </span>
        ) : (
          <span className={`pill ${conv.status === 'waiting' ? 'pill-waiting' : 'pill-active'}`}>
            {conv.status === 'waiting' ? 'Waiting on me' : 'Active'}
          </span>
        )}
        <span className="conv-card-time" title={full(conv.updated_at)}>{rel(conv.updated_at)}</span>
        <div className="menu-wrap" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-ghost btn-sm menu-trigger" onClick={() => setMenuOpen(o => !o)}>•••</button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button className="menu-item" onClick={() => { setMenuOpen(false); onOpen() }}>View messages</button>
              <div className="menu-divider" />
              {conv.status === 'done' ? (
                <button className="menu-item" onClick={() => { setMenuOpen(false); onUnmarkDone() }}>Unmark done</button>
              ) : (
                <button className="menu-item" onClick={() => { setMenuOpen(false); onMarkDone() }}>Mark as done</button>
              )}
              <button className="menu-item menu-item-muted" onClick={() => { setMenuOpen(false); onArchive() }}>Archive</button>
            </div>
          )}
        </div>
      </div>
      <div className="conv-card-title-row">
        <p className="conv-card-title">{conv.title}</p>
        {conv.source === 'slack' && (
          <span className="source-badge source-badge-slack" title="Slack">
            <svg width="10" height="10" viewBox="0 0 122.8 122.8" xmlns="http://www.w3.org/2000/svg">
              <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9z" fill="#2eb67d"/>
              <path d="M32.3 77.6c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#2eb67d"/>
              <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2z" fill="#36c5f0"/>
              <path d="M45.2 32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9H45.2z" fill="#36c5f0"/>
              <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2z" fill="#e01e5a"/>
              <path d="M90.5 45.2c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#e01e5a"/>
              <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9z" fill="#ecb22e"/>
              <path d="M77.6 90.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"/>
            </svg>
          </span>
        )}
      </div>
      {conv.preview && (
        <p className="conv-card-preview">{conv.preview}</p>
      )}
      {conv.apps.length > 0 && (
        <div className="conv-card-apps">
          <span className="app-tag-label">Apps</span>
          {conv.apps.map(app => (
            <a
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noreferrer"
              className="app-tag"
              onClick={e => e.stopPropagation()}
              title={`Open ${app.name}`}
            >
              {app.name} ↗
            </a>
          ))}
        </div>
      )}
      <p className="conv-card-started">Started {rel(conv.started_at)}</p>
    </div>
  )
}

// ── Archive view ──────────────────────────────────────────────────────────────

function ArchiveView({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<ArchivedConv[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch('/archived').then(setItems).finally(() => setLoading(false))
  }, [])

  async function restore(id: string) {
    await apiFetch(`/conversations/${id}`, { method: 'PUT', body: JSON.stringify({ archived: false }) })
    setItems(p => p.filter(c => c.id !== id))
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="btn btn-ghost" onClick={onBack}>← Board</button>
        <span className="topbar-title">Archive</span>
      </header>
      <main className="archive-main">
        {loading ? (
          <p className="empty-msg">Loading...</p>
        ) : items.length === 0 ? (
          <p className="empty-msg">Nothing archived. Conversations auto-archive after 48 hours of inactivity.</p>
        ) : (
          <div className="archive-list">
            {items.map(conv => (
              <div key={conv.id} className="card">
                <div className="flex-between">
                  <span className="caption text-secondary">{rel(conv.updated_at)}</span>
                  <div className="flex-center gap-1">
                    <a href={conv.runnethUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">Open ↗</a>
                    <button className="btn btn-secondary btn-sm" onClick={() => restore(conv.id)}>Restore</button>
                  </div>
                </div>
                <p className="conv-card-title" style={{ marginTop: 8 }}>{conv.title}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ── App ───────────────────────────────────────────────────────────────────────

const COLUMNS = [
  { id: 'active' as const,  label: 'Active',        hint: 'Agent is streaming' },
  { id: 'waiting' as const, label: 'Waiting on me', hint: 'Needs your reply' },
  { id: 'done' as const,    label: 'Done',          hint: 'Resolved' },
]

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openConv, setOpenConv] = useState<Conversation | null>(null)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'board' | 'archive'>('board')

  const load = useCallback(async () => {
    try {
      setConversations(await apiFetch('/conversations'))
      setError(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load conversations.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const id = setInterval(load, 10000)
    return () => clearInterval(id)
  }, [load])

  useEffect(() => {
    if (openConv) {
      const updated = conversations.find(c => c.id === openConv.id)
      if (updated) setOpenConv(updated)
    }
  }, [conversations])

  function handleOpen(conv: Conversation) {
    // Optimistically clear unseen so the dot disappears immediately
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unseen: false } : c))
    setOpenConv(conv)
  }

  async function handleMarkDone(id: string, done: boolean) {
    // done=true → explicitly done; done=false → explicitly active (overrides auto-done)
    await apiFetch(`/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ manualStatus: done ? 'done' : 'active' }),
    })
    setConversations(prev => prev.map(c =>
      c.id === id ? { ...c, status: done ? 'done' : 'active' } : c
    ))
  }

  async function handleArchive(id: string) {
    await apiFetch(`/conversations/${id}`, { method: 'PUT', body: JSON.stringify({ archived: true }) })
    setConversations(prev => prev.filter(c => c.id !== id))
    if (openConv?.id === id) setOpenConv(null)
  }

  if (view === 'archive') return <ArchiveView onBack={() => setView('board')} />

  const filtered = conversations.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase())
  )

  const thinkingCount = conversations.filter(c => c.thinking).length
  const waitingCount = conversations.filter(c => c.status === 'waiting').length

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-logo">Runneth</span>
          <span className="topbar-subtitle">Conversations</span>
        </div>
        <div className="topbar-right">
          {thinkingCount > 0 && (
            <span className="pill pill-thinking">
              <span className="thinking-dot pulse" style={{ width: 7, height: 7 }} />
              {thinkingCount} thinking
            </span>
          )}
          {waitingCount > 0 && (
            <span className="pill pill-waiting">{waitingCount} waiting on you</span>
          )}
          <input
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
          />
          <button className="btn btn-secondary btn-sm" onClick={() => setView('archive')}>Archive</button>
          <button className="btn btn-ghost btn-sm" onClick={load} title="Refresh">↻</button>
        </div>
      </header>

      <main className="board">
        {error ? (
          <p className="full-msg" style={{ color: 'var(--error-9)' }}>{error}</p>
        ) : loading ? (
          <p className="full-msg">Loading...</p>
        ) : (
          COLUMNS.map(col => {
            const cards = filtered.filter(c => c.status === col.id)
            const thinkingInCol = cards.filter(c => c.thinking).length
            return (
              <section key={col.id} className="column">
                <div className="column-header">
                  <span className="column-label">{col.label}</span>
                  {thinkingInCol > 0 && (
                    <span className="pill pill-thinking" style={{ fontSize: 11 }}>
                      <span className="thinking-dot pulse" style={{ width: 6, height: 6 }} />
                      {thinkingInCol}
                    </span>
                  )}
                  <span className="pill" style={{ marginLeft: 'auto' }}>{cards.length}</span>
                </div>
                <div className="column-body">
                  {cards.length === 0 ? (
                    <p className="column-empty">{col.hint}</p>
                  ) : (
                    cards.map(conv => (
                      <Card
                        key={conv.id}
                        conv={conv}
                        onOpen={() => handleOpen(conv)}
                        onMarkDone={() => handleMarkDone(conv.id, true)}
                        onUnmarkDone={() => handleMarkDone(conv.id, false)}
                        onArchive={() => handleArchive(conv.id)}
                      />
                    ))
                  )}
                </div>
              </section>
            )
          })
        )}
      </main>

      {openConv && (
        <MessagePanel conv={openConv} onClose={() => { setOpenConv(null); load() }} />
      )}
    </div>
  )
}

// ── Global styles (Motion design system) ─────────────────────────────────────

const css = document.createElement('style')
css.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --gray-0: #ffffff; --gray-1: #fcfcfc; --gray-2: #f8f8f8; --gray-3: #f3f3f3;
    --gray-4: #ededed; --gray-5: #e8e8e8; --gray-6: #e2e2e2; --gray-7: #dbdbdb;
    --gray-8: #c7c7c7; --gray-9: #8f8f8f; --gray-10: #858585; --gray-11: #6f6f6f;
    --gray-12: #171717;
    --primary-3: #eafad1; --primary-7: #aecc75; --primary-9: #c1f14b; --primary-11: #627d20;
    --error-9: #e5484d;
    --font: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
    --radius-compact: 8px; --radius-control: 10px; --radius-surface: 16px;
    --shadow-card: 0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.24), 0 4px 8px 0 rgba(0,0,0,0.1);
    --shadow-modal: 0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.24), 0 8px 16px 0 rgba(0,0,0,0.12);
  }

  html, body { height: 100%; font-family: var(--font); font-size: 14px; line-height: 20px;
    letter-spacing: -0.006em; color: var(--gray-12); background: var(--gray-2);
    -webkit-font-smoothing: antialiased; }

  /* Layout */
  .app { min-height: 100vh; display: flex; flex-direction: column; }
  .flex-center { display: flex; align-items: center; }
  .flex-between { display: flex; align-items: center; justify-content: space-between; }
  .gap-1 { gap: 8px; }
  .caption { font-size: 12px; line-height: 16px; letter-spacing: 0; }
  .text-secondary { color: var(--gray-11); }

  /* Topbar */
  .topbar { display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; height: 56px; background: var(--gray-0);
    border-bottom: 1px solid var(--gray-5); position: sticky; top: 0; z-index: 20;
    gap: 12px; }
  .topbar-left { display: flex; align-items: baseline; gap: 8px; flex-shrink: 0; }
  .topbar-logo { font-weight: 700; font-size: 15px; letter-spacing: -0.4px; }
  .topbar-subtitle { font-size: 13px; color: var(--gray-9); font-weight: 400; }
  .topbar-title { font-size: 14px; font-weight: 500; color: var(--gray-11); }
  .topbar-right { display: flex; align-items: center; gap: 8px; }

  /* Buttons */
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    height: 32px; padding: 0 12px; font-family: var(--font); font-size: 14px;
    font-weight: 500; line-height: 20px; letter-spacing: -0.006em; border: none;
    border-radius: var(--radius-control); cursor: pointer; white-space: nowrap;
    text-decoration: none; transition: opacity 0.1s; }
  .btn:hover { opacity: 0.8; }
  .btn:disabled { opacity: 0.4; cursor: default; }
  .btn-primary { background: var(--gray-12); color: var(--gray-0); }
  .btn-secondary { background: var(--gray-0); color: var(--gray-12); border: 1px solid var(--gray-6); }
  .btn-ghost { background: transparent; color: var(--gray-12); }
  .btn-sm { height: 28px; padding: 0 10px; font-size: 13px; }

  /* Pills */
  .pill { display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 8px;
    font-size: 12px; font-weight: 500; border-radius: var(--radius-compact);
    background: var(--gray-3); color: var(--gray-12); white-space: nowrap; }
  .pill-thinking { background: #eff6ff; color: #2563eb; }
  .pill-waiting { background: #fffbeb; color: #d97706; }
  .pill-active { background: #eff6ff; color: #2563eb; }
  .pill-done { background: #f0fdf4; color: #16a34a; }

  /* Search */
  .search-input { height: 32px; padding: 0 12px; font-family: var(--font); font-size: 13px;
    color: var(--gray-12); background: var(--gray-3); border: 1px solid var(--gray-5);
    border-radius: var(--radius-control); outline: none; width: 180px; }
  .search-input:focus { border-color: var(--primary-7); }
  .search-input::placeholder { color: var(--gray-9); }

  /* Board */
  .board { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;
    padding: 24px; max-width: 1200px; margin: 0 auto; align-items: start; width: 100%; }
  .full-msg { grid-column: 1/-1; text-align: center; color: var(--gray-9); padding: 64px; }

  /* Columns */
  .column { background: var(--gray-0); border-radius: var(--radius-surface);
    border: 1px solid var(--gray-5); overflow: hidden; }
  .column-header { display: flex; align-items: center; gap: 8px; padding: 14px 16px 12px;
    border-bottom: 1px solid var(--gray-4); }
  .column-label { font-weight: 600; font-size: 13px; flex: 1; }
  .column-body { padding: 12px; display: flex; flex-direction: column; gap: 8px; min-height: 60px; }
  .column-empty { font-size: 12px; color: var(--gray-8); text-align: center; padding: 20px 0; }

  /* Conversation cards */
  .conv-card { background: var(--gray-0); border: 1px solid var(--gray-5);
    border-left: 3px solid var(--gray-7); border-radius: var(--radius-compact);
    padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; cursor: pointer;
    transition: box-shadow 0.12s; }
  .conv-card:hover { box-shadow: var(--shadow-card); }
  .conv-card-thinking { border-left-color: #3b82f6; }
  .conv-card-waiting { border-left-color: #f59e0b; }
  .conv-card-top { display: flex; align-items: center; gap: 6px; }
  .conv-card-time { font-size: 11px; color: var(--gray-9); margin-left: auto; }
  .conv-card-title { font-weight: 600; font-size: 14px; line-height: 1.45; color: var(--gray-12); }
  .conv-card-preview { font-size: 12px; color: var(--gray-11); line-height: 1.5;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .conv-card-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; }
  .source-badge { flex-shrink: 0; font-size: 10px; font-weight: 600; padding: 2px 6px;
    border-radius: 5px; letter-spacing: 0.2px; }
  .source-badge-slack { background: #4a154b12; padding: 3px 5px; display: inline-flex; align-items: center; }
  .conv-card-apps { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
  .app-tag-label { font-size: 11px; font-weight: 600; color: var(--gray-9);
    text-transform: uppercase; letter-spacing: 0.4px; margin-right: 2px; }
  .app-tag { display: inline-flex; align-items: center; gap: 3px; height: 20px; padding: 0 7px;
    font-size: 11px; font-weight: 500; border-radius: 6px; text-decoration: none;
    background: var(--primary-3); color: var(--primary-11);
    border: 1px solid var(--primary-7); transition: opacity 0.1s; }
  .app-tag:hover { opacity: 0.75; }
  .conv-card-started { font-size: 11px; color: var(--gray-8); }
  .conv-card-unseen { background: #fafcff; }

  /* Card menu */
  .menu-wrap { position: relative; }
  .menu-trigger { color: var(--gray-8); letter-spacing: 1px; padding: 0 4px; }
  .menu-dropdown { position: absolute; right: 0; top: calc(100% + 4px); z-index: 30;
    background: var(--gray-0); border: 1px solid var(--gray-5); border-radius: var(--radius-compact);
    box-shadow: var(--shadow-modal); min-width: 160px; overflow: hidden; }
  .menu-item { display: block; width: 100%; text-align: left; background: none; border: none;
    padding: 9px 14px; font-size: 13px; font-family: var(--font); color: var(--gray-12);
    cursor: pointer; letter-spacing: -0.006em; }
  .menu-item:hover { background: var(--gray-2); }
  .menu-item-muted { color: var(--gray-9); }
  .menu-divider { height: 1px; background: var(--gray-4); margin: 2px 0; }

  /* Thinking dot */
  .thinking-dot { width: 7px; height: 7px; border-radius: 50%; background: #3b82f6;
    display: inline-block; flex-shrink: 0; }
  @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.35; transform:scale(0.7); } }
  .pulse { animation: pulse 1.6s ease-in-out infinite; }

  /* Panel overlay */
  .panel-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center; z-index: 100; padding: 24px; }
  .panel { background: var(--gray-0); border-radius: var(--radius-surface); width: 100%;
    max-width: 600px; max-height: 88vh; display: flex; flex-direction: column;
    box-shadow: var(--shadow-modal); overflow: hidden; }
  .panel-header { display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border-bottom: 1px solid var(--gray-4); gap: 12px; flex-shrink: 0; }
  .panel-header-left { display: flex; align-items: center; gap: 8px; flex: 1; overflow: hidden; }
  .panel-header-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .panel-title { font-weight: 600; font-size: 14px; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; }

  /* Messages */
  .message-list { flex: 1; overflow-y: auto; padding: 16px 18px;
    display: flex; flex-direction: column; gap: 10px; }
  .message-empty { color: var(--gray-9); font-size: 13px; text-align: center; padding: 32px; }
  .message-older { text-align: center; }
  .message-older a { font-size: 12px; color: var(--gray-9); }
  .message-row { display: flex; }
  .message-row-user { justify-content: flex-end; }
  .message-row-assistant { justify-content: flex-start; }
  .message-bubble { max-width: 82%; padding: 9px 13px; border-radius: 12px;
    line-height: 1.55; font-size: 13px; }
  .bubble-user { background: var(--gray-12); color: var(--gray-0); border-bottom-right-radius: 4px; }
  .bubble-assistant { background: var(--gray-3); color: var(--gray-12); border-bottom-left-radius: 4px; }
  .bubble-local { background: #1d4ed8; }
  .message-text { white-space: pre-wrap; word-break: break-word; }
  .message-local-badge { display: block; font-size: 10px; opacity: 0.6; margin-top: 4px; }

  /* Reply */
  .reply-box { border-top: 1px solid var(--gray-4); padding: 12px 18px; flex-shrink: 0; }
  .reply-row { display: flex; gap: 8px; align-items: flex-end; }
  .reply-input { flex: 1; border: 1px solid var(--gray-6); border-radius: var(--radius-compact);
    padding: 9px 12px; font-size: 13px; font-family: var(--font); resize: none; outline: none;
    background: var(--gray-2); color: var(--gray-12); line-height: 1.5; }
  .reply-input:focus { border-color: var(--primary-7); background: var(--gray-0); }
  .reply-input::placeholder { color: var(--gray-9); }
  .reply-error { font-size: 12px; color: var(--error-9); margin-bottom: 8px; }
  .reply-meta { font-size: 11px; color: var(--gray-8); margin-top: 8px; }

  /* Card (base) */
  .card { background: var(--gray-0); border: 1px solid var(--gray-6);
    border-radius: var(--radius-surface); padding: 16px; }

  /* Archive */
  .archive-main { max-width: 600px; margin: 32px auto; padding: 0 24px; }
  .archive-list { display: flex; flex-direction: column; gap: 8px; }
  .empty-msg { color: var(--gray-9); font-size: 14px; text-align: center; padding-top: 48px; }

  @media (max-width: 900px) { .board { grid-template-columns: 1fr 1fr; } }
  @media (max-width: 600px) { .board { grid-template-columns: 1fr; } }
`
document.head.appendChild(css)

createRoot(document.getElementById('root')!).render(<App />)
