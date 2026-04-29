import Fastify from 'fastify'
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'

import {
  loadBuildethMemoryTools,
  loadBuildethMotionTools,
  loadBuildethReminderTools,
  runWithBuildethToolRuntime,
} from './buildeth-tools.js'
import { runWithBuildethRuntime, type BuildethRuntimeContext } from './runtime.js'

export type BuildethBackendRequest = Readonly<{
  method: string
  path: string
  headers: Readonly<Record<string, string>>
  body?: unknown
  runtime: BuildethRuntimeContext
}>

export type BuildethBackendResponse = Readonly<{
  status: number
  headers?: Readonly<Record<string, string>>
  body?: unknown
}>

// ── Constants ─────────────────────────────────────────────────────────────────

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000

// ── Runtime DB (read-only singleton) ──────────────────────────────────────────

const runtimeDbPath = '/agent/.runtime/conversations.db'
let _runtimeDb: DatabaseSync | null = null

function getRuntimeDb(): DatabaseSync {
  if (_runtimeDb) return _runtimeDb
  _runtimeDb = new DatabaseSync(runtimeDbPath, { readOnly: true })
  return _runtimeDb
}

// ── Config ─────────────────────────────────────────────────────────────────────

interface AppConfig { orgId: string; workspaceId: string }

let _config: AppConfig | null = null

function getConfig(): AppConfig {
  if (_config) return _config
  const appRoot = process.env.BUILDETH_APP_ROOT ?? '/agent/apps/conversation-manager'
  const configPath = path.join(appRoot, 'data', 'config.json')
  try {
    _config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    return _config!
  } catch {
    throw new Error(
      `Missing config. Create ${configPath} with { "orgId": "...", "workspaceId": "..." }.\n` +
      'Find these in your Runneth URL: projects.motionapp.com/organization/{orgId}/{workspaceId}/chat/...'
    )
  }
}

// ── JSON stores ──────────────────────────────────────────────────────────────

const dataDir = path.join(process.env.BUILDETH_APP_ROOT ?? '/agent/apps/conversation-manager', 'data')
const notesPath = path.join(dataDir, 'notes.json')
const repliesPath = path.join(dataDir, 'replies.json')

interface NotesStore {
  [id: string]: {
    archived?: boolean
    // 'done' = explicitly marked done
    // 'active' = explicitly unmarked (overrides auto-done)
    // null/undefined = no override, use auto-detection
    manualStatus?: 'done' | 'active' | null
  }
}
interface RepliesStore { [id: string]: Array<{ id: string; text: string; created_at: string }> }

function readJson<T>(p: string, fallback: T): T {
  try { fs.mkdirSync(path.dirname(p), { recursive: true }); return JSON.parse(fs.readFileSync(p, 'utf8')) }
  catch { return fallback }
}
function writeJson(p: string, d: unknown): void {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, JSON.stringify(d, null, 2))
}
const seenPath = path.join(dataDir, 'seen.json')
interface SeenStore { [id: string]: string } // conversationId -> ISO timestamp

const readNotes = (): NotesStore => readJson<NotesStore>(notesPath, {})
const writeNotes = (s: NotesStore): void => writeJson(notesPath, s)
const readReplies = (): RepliesStore => readJson<RepliesStore>(repliesPath, {})
const writeReplies = (s: RepliesStore): void => writeJson(repliesPath, s)
const readSeen = (): SeenStore => readJson<SeenStore>(seenPath, {})
const writeSeen = (s: SeenStore): void => writeJson(seenPath, s)

// ── Auto-done detection ──────────────────────────────────────────────────────────────

const DONE_PATTERNS = [
  /let me know if (you |there's |there are )?anything/i,
  /let me know if you('d like| need| want| have)/i,
  /is there anything (else|I can)/i,
  /anything else (I can|you need|you'd like)/i,
  /hope (that |this )?helps/i,
  /hope (that |this )?(was |is )?useful/i,
  /feel free to (reach out|ask|let me know)/i,
  /reach out if (you|there)/i,
  /you('re| are) all set/i,
  /all (done|set)[.!]?\s*$/i,
  /there you go/i,
  /here('s| is) (your|the) /i,  // "here's your X" — delivered something
  /^done[.!]?\s*$/im,
  /happy to help/i,
  /let me know (if|how) (you|that|it)/i,
]

function isLikelyDone(lastAssistantText: string): boolean {
  if (!lastAssistantText) return false
  // Check the last 300 chars — closing signals are almost always at the end
  const tail = lastAssistantText.slice(-300)
  return DONE_PATTERNS.some(p => p.test(tail))
}

// ── App map ──────────────────────────────────────────────────────────────────

interface AppInfo { name: string; route: string; url: string }

function getConversationApps(): Map<string, AppInfo[]> {
  const map = new Map<string, AppInfo[]>()
  const host = process.env.SPAWNETH_HOST ?? ''
  try {
    const appsDir = '/agent/apps'
    const entries = fs.readdirSync(appsDir)
    for (const entry of entries) {
      const manifestPath = path.join(appsDir, entry, 'buildeth.app.json')
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        const convId: string = manifest.conversationId
        const appName: string = manifest.name
        const route: string = manifest.route
        if (!convId || !appName || !route) continue
        if (!map.has(convId)) map.set(convId, [])
        map.get(convId)!.push({
          name: appName,
          route,
          url: host ? `https://${host}${route}` : route,
        })
      } catch { /* skip unreadable manifests */ }
    }
  } catch { /* skip if apps dir unreadable */ }
  return map
}

// ── Conversation resolution ───────────────────────────────────────────────────

interface ResolvedConv {
  id: string
  title: string
  status: 'active' | 'waiting' | 'done'
  thinking: boolean
  autoDone: boolean  // true if status=done was inferred, not manually set
  preview: string | null
  unseen: boolean
  apps: AppInfo[]
  source: 'slack' | 'web'
  runnethUrl: string
  started_at: string
  updated_at: string
}

function makeRunnethUrl(workspaceId: string, conversationId: string): string {
  const { orgId } = getConfig()
  return `https://projects.motionapp.com/organization/${orgId}/${workspaceId}/chat/${conversationId}`
}

function resolveConversations(): ResolvedConv[] {
  const db = getRuntimeDb()
  const notes = readNotes()
  const seen = readSeen()
  const replies = readReplies()
  const appMap = getConversationApps()
  const cutoff = Date.now() - FORTY_EIGHT_HOURS_MS

  const rows = db.prepare(`
    SELECT
      c.conversation_id,
      c.conversation_json,
      c.active_execution_json,
      c.created_at_ms,
      c.updated_at_ms,
      m_last.message_json   AS last_message_json,
      m_asst.message_json   AS last_assistant_json
    FROM conversations c
    LEFT JOIN messages m_last ON (
      m_last.conversation_id = c.conversation_id
      AND m_last.sequence_number = (
        SELECT MAX(sequence_number) FROM messages WHERE conversation_id = c.conversation_id
      )
    )
    LEFT JOIN messages m_asst ON (
      m_asst.conversation_id = c.conversation_id
      AND m_asst.sequence_number = (
        SELECT MAX(sequence_number) FROM messages
        WHERE conversation_id = c.conversation_id
          AND JSON_EXTRACT(message_json, '$.role') = 'assistant'
      )
    )
    ORDER BY c.updated_at_ms DESC
  `).all() as Array<{
    conversation_id: string
    conversation_json: string
    active_execution_json: string | null
    created_at_ms: number
    updated_at_ms: number
    last_message_json: string | null
    last_assistant_json: string | null
  }>

  const result: ResolvedConv[] = []

  for (const r of rows) {
    let convData: { title?: string; workspaceId?: string; externalProvider?: string } = {}
    try { convData = JSON.parse(r.conversation_json) } catch {}
    const title = convData.title?.trim()
    if (!title) continue

    const manuallyArchived = notes[r.conversation_id]?.archived === true
    const tooOld = r.updated_at_ms < cutoff
    if (manuallyArchived || tooOld) continue

    const thinking = r.active_execution_json !== null

    let lastRole: string | null = null
    try { lastRole = JSON.parse(r.last_message_json!).role ?? null } catch {}

    // Only mark 'waiting' if the last assistant message has actual readable text.
    // Slack action messages (data-slack-reply, tool calls) have no text and
    // should not count as "agent last spoke."
    const lastAssistantHasText = r.last_assistant_json
      ? extractText(r.last_assistant_json).length > 0
      : false

    const localReplies = replies[r.conversation_id] ?? []
    const lastLocalReply = localReplies.length > 0
      ? new Date(localReplies[localReplies.length - 1].created_at).getTime()
      : 0
    const userRepliedLocally = lastLocalReply > r.updated_at_ms

    const manualStatus = notes[r.conversation_id]?.manualStatus ?? null
    const source: 'slack' | 'web' = convData.externalProvider === 'slack' ? 'slack' : 'web'

    // Auto-done: detect closing language in the last assistant message
    const lastAssistantText = r.last_assistant_json ? extractText(r.last_assistant_json) : ''
    const autoDone = isLikelyDone(lastAssistantText)

    const status: 'active' | 'waiting' | 'done' = thinking
      ? 'active'
      : manualStatus === 'done'
        ? 'done'
        : manualStatus === 'active'
          ? ((lastRole === 'assistant' && lastAssistantHasText && !userRepliedLocally) ? 'waiting' : 'active')
          : source === 'slack'
            ? 'done'
            : autoDone
              ? 'done'
              : (lastRole === 'assistant' && lastAssistantHasText && !userRepliedLocally)
                ? 'waiting'
                : 'active'

    // Preview: last assistant message, capped at 120 chars
    let preview: string | null = null
    if (r.last_assistant_json) {
      const text = extractText(r.last_assistant_json)
      if (text) preview = text.length > 120 ? text.slice(0, 120).trimEnd() + '...' : text
    }

    // Unseen: updated since user last opened this conversation
    const lastSeen = seen[r.conversation_id]
    const unseen = !lastSeen || new Date(r.updated_at_ms) > new Date(lastSeen)

    const workspaceId = convData.workspaceId ?? getConfig().workspaceId

    result.push({
      id: r.conversation_id,
      title,
      status,
      thinking,
      autoDone: status === 'done' && manualStatus !== 'done',
      preview,
      unseen,
      apps: appMap.get(r.conversation_id) ?? [],
      source,
      runnethUrl: makeRunnethUrl(workspaceId, r.conversation_id),
      started_at: new Date(r.created_at_ms).toISOString(),
      updated_at: new Date(r.updated_at_ms).toISOString(),
    })
  }

  return result
}

// ── Message extraction ────────────────────────────────────────────────────────

interface MessageSummary {
  id: string
  role: 'user' | 'assistant'
  text: string
  created_at: string
}

function extractText(messageJson: string): string {
  try {
    const msg = JSON.parse(messageJson)
    const parts: Array<{ type: string; text?: string; data?: Record<string, unknown> }> = msg.parts ?? []

    // Assistant Slack replies
    const slackPart = parts.find(p => p.type === 'data-slack-reply')
    if (slackPart?.data) {
      const d = slackPart.data as { shouldRespond?: boolean; reply?: Array<{ text?: string }> }
      if (d.shouldRespond && d.reply?.length) {
        return d.reply.map(r => r.text ?? '').join('\n').trim()
      }
      if (d.shouldRespond === false) return '(no reply sent to Slack)'
    }

    // Standard text parts
    const raw = parts
      .filter(p => p.type === 'text')
      .map(p => p.text ?? '')
      .join('')
      .trim()
    if (!raw) return ''

    // Slack inbound user messages store payload as JSON in the text part
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.kind === 'slack_inbound_user_message' && parsed?.currentMessage?.text) {
        return parsed.currentMessage.text
      }
    } catch { /* not JSON, use raw */ }

    return raw
  } catch { return '' }
}

// ── Server ────────────────────────────────────────────────────────────────────

const server = Fastify({ logger: false })

server.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
  try { done(null, JSON.parse(body as string)) } catch (err) { done(err as Error, undefined) }
})

server.get('/api/health', async () => ({ ok: true }))

// GET /api/conversations
server.get('/api/conversations', async (_, reply) => {
  try {
    return resolveConversations()
  } catch (e: unknown) {
    reply.status(500); return { error: String(e) }
  }
})

// GET /api/archived
server.get('/api/archived', async (_, reply) => {
  try {
    const db = getRuntimeDb()
    const notes = readNotes()
    const cutoff = Date.now() - FORTY_EIGHT_HOURS_MS

    const rows = db.prepare(`
      SELECT conversation_id, conversation_json, created_at_ms, updated_at_ms
      FROM conversations ORDER BY updated_at_ms DESC
    `).all() as Array<{
      conversation_id: string
      conversation_json: string
      created_at_ms: number
      updated_at_ms: number
    }>

    return rows
      .filter((r) => {
        let d: { title?: string } = {}
        try { d = JSON.parse(r.conversation_json) } catch {}
        if (!d.title?.trim()) return false
        return notes[r.conversation_id]?.archived === true || r.updated_at_ms < cutoff
      })
      .map((r) => {
        let d: { title?: string; workspaceId?: string } = {}
        try { d = JSON.parse(r.conversation_json) } catch {}
        const wid = d.workspaceId ?? getConfig().workspaceId
        return {
          id: r.conversation_id,
          title: d.title ?? '',
          runnethUrl: makeRunnethUrl(wid, r.conversation_id),
          updated_at: new Date(r.updated_at_ms).toISOString(),
          started_at: new Date(r.created_at_ms).toISOString(),
        }
      })
  } catch (e: unknown) {
    reply.status(500); return { error: String(e) }
  }
})

// GET /api/conversations/:id/messages — last 6 messages
server.get('/api/conversations/:id/messages', async (request, reply) => {
  try {
    const { id } = request.params as { id: string }
    const db = getRuntimeDb()

    const rows = db.prepare(`
      SELECT message_id, message_json, sequence_number
      FROM messages
      WHERE conversation_id = ?
      ORDER BY sequence_number DESC
      LIMIT 6
    `).all(id) as Array<{ message_id: string; message_json: string; sequence_number: number }>

    const messages: MessageSummary[] = rows
      .reverse()
      .map((r) => {
        let role: 'user' | 'assistant' = 'assistant'
        let createdAt = ''
        try {
          const m = JSON.parse(r.message_json)
          role = m.role === 'user' ? 'user' : 'assistant'
          createdAt = m.createdAt ?? ''
        } catch {}
        return {
          id: r.message_id,
          role,
          text: extractText(r.message_json),
          created_at: createdAt,
        }
      })
      .filter((m) => m.text.length > 0)

    // Merge in locally stored replies (POC mode)
    const localReplies = (readReplies()[id] ?? []).map((r) => ({
      id: r.id,
      role: 'user' as const,
      text: r.text,
      created_at: r.created_at,
      local: true,
    }))

    return [...messages, ...localReplies]
  } catch (e: unknown) {
    reply.status(500); return { error: String(e) }
  }
})

// POST /api/conversations/:id/seen — mark conversation as seen now
server.post('/api/conversations/:id/seen', async (request, reply) => {
  try {
    const { id } = request.params as { id: string }
    const store = readSeen()
    store[id] = new Date().toISOString()
    writeSeen(store)
    return { ok: true }
  } catch (e: unknown) {
    reply.status(500); return { error: String(e) }
  }
})

// POST /api/conversations/:id/reply — store reply locally (POC)
server.post('/api/conversations/:id/reply', async (request, reply) => {
  try {
    const { id } = request.params as { id: string }
    const { text } = request.body as { text: string }
    if (!text?.trim()) { reply.status(400); return { error: 'text required' } }
    const store = readReplies()
    if (!store[id]) store[id] = []
    const entry = { id: `local-${Date.now()}`, text: text.trim(), created_at: new Date().toISOString() }
    store[id].push(entry)
    writeReplies(store)
    return { ok: true, message: entry }
  } catch (e: unknown) {
    reply.status(500); return { error: String(e) }
  }
})

// PUT /api/conversations/:id — update archived flag or manualStatus
server.put('/api/conversations/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string }
    const body = request.body as { archived?: boolean; manualStatus?: 'done' | 'active' | null }
    const store = readNotes()
    const existing = store[id] ?? {}
    store[id] = {
      ...existing,
      ...(body.archived !== undefined ? { archived: body.archived } : {}),
      ...('manualStatus' in body ? { manualStatus: body.manualStatus } : {}),
    }
    writeNotes(store)
    return { ok: true }
  } catch (e: unknown) {
    reply.status(500); return { error: String(e) }
  }
})

// ── Fastify wiring ────────────────────────────────────────────────────────────

type InjectMethod = 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT'

const toResponseHeaders = (
  headers: Readonly<Record<string, number | string | readonly string[] | undefined>>
): Readonly<Record<string, string>> => {
  const resolved: Record<string, string> = {}
  for (const [key, v] of Object.entries(headers)) {
    if (v === undefined) continue
    resolved[key] = Array.isArray(v) ? v.join(',') : String(v)
  }
  return resolved
}

const resolveInjectMethod = (m: string): InjectMethod => {
  const n = m.toUpperCase()
  if (['DELETE','GET','HEAD','OPTIONS','PATCH','POST','PUT'].includes(n)) return n as InjectMethod
  throw new Error(`Unsupported HTTP method: ${m}`)
}

const resolveInjectPayload = (p: unknown) => {
  if (p === undefined || p === null) return undefined
  if (typeof p === 'string' || p instanceof Uint8Array) return p
  if (Array.isArray(p)) return p
  if (typeof p === 'object') return p as Record<string, unknown>
  return String(p)
}

const serverReady = server.ready()

export {
  loadBuildethMemoryTools,
  loadBuildethMotionTools,
  loadBuildethReminderTools,
  runWithBuildethToolRuntime,
} from './buildeth-tools.js'

export {
  buildBuildethCliInvocation,
  execBuildethCli,
  getBuildethRuntime,
  type BuildethCliInput,
  type BuildethCliInvocation,
  type BuildethCliName,
  type BuildethCliResult,
  type BuildethRuntimeContext,
} from './runtime.js'

export const handleRequest = async (
  request: BuildethBackendRequest
): Promise<BuildethBackendResponse> => {
  return await runWithBuildethRuntime(request.runtime, async () => {
    return await runWithBuildethToolRuntime(request.runtime, async () => {
      await serverReady
      const response = await server.inject({
        headers: request.headers,
        method: resolveInjectMethod(request.method),
        payload: resolveInjectPayload(request.body),
        url: request.path,
      })
      return {
        status: response.statusCode,
        headers: toResponseHeaders(response.headers),
        body: response.rawPayload,
      }
    })
  })
}
