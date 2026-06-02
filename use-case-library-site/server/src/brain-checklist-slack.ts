/**
 * Slack delivery for brain-checklist submissions from the customer-facing
 * /how-to-build-the-brain page.
 *
 * Posts a structured parent message to BRAIN_CHECKLIST_SLACK_CHANNEL with the
 * full submission payload and a per-section brain-structure recommendation,
 * then uploads each submitted file into the same thread so reviewers see the
 * artifacts alongside the context.
 *
 * Env:
 *   BRAIN_CHECKLIST_SLACK_TOKEN    — Slack bot token (xoxb-...) with chat:write
 *                                    and files:write scopes. Falls back to
 *                                    log-only mode when unset.
 *   BRAIN_CHECKLIST_SLACK_CHANNEL  — channel ID (e.g. C0123456789).
 */
import type { BrainChecklistFile, BrainChecklistPayload } from './brain-checklist-email.js'

const TOKEN = process.env.BRAIN_CHECKLIST_SLACK_TOKEN
const CHANNEL = process.env.BRAIN_CHECKLIST_SLACK_CHANNEL

// Per-section brain-structure recommendations. Tells the reviewer where each
// uploaded file should land in the customer's brain so routing is consistent.
const BRAIN_STRUCTURE_BY_KEY: Record<string, string> = {
  brand_context: '`/agent/workspaces/<workspaceId>/config/brand-context/brand_context.json` for canonical brand setup. Reference docs (the original PDF, brand book, voice guide) → `/agent/brain/brand-context/<name>.<ext>` with an `/agent/INDEX.md` entry tagged `brand-context, voice, positioning`.',
  customer_reviews: '`/agent/brain/reviews/<source>-<YYYY-MM>.csv` for the raw export. A short distilled VOC note at `/agent/brain/reviews/_voc-summary.md` summarising pain points, objections, transformation moments, standout language. Cross-link both in `/agent/INDEX.md`.',
  personas: '`/agent/brain/personas/<persona-name>.md` per persona, with frontmatter capturing the persona name, primary pain, awareness stage, channels, anti-persona notes. Index entry tagged `persona, ICP, target audience`.',
  product_catalog: '`/agent/brain/product-catalog/<source>.<ext>` for the raw catalog and `/agent/brain/product-catalog/_facts.md` for the distilled facts Runneth should never invent or break (SKU list, claims, restrictions). Index entry tagged `product, claims, SKU`.',
  connected_systems: 'Free-text only, no files. Capture the list in `/agent/brain/customers/<slug>/summary.md` under a `### Systems and integrations` section so it surfaces on every future turn. For each named system, note what lives there (briefs, assets, project tracking, decisions). If any are first-class Runneth integrations (Notion, Google Drive, Slack, HubSpot, Linear, Notion, Intercom) or Pipedream-connected apps (Airtable, Asana, Monday, ClickUp, Figma, Dropbox), open a follow-up to walk the customer through `oauth-connect` for each one on their first session.',
  winning_briefs: '`/agent/brain/templates/brief-<concept-name>.md` per brief saved as `kind=template-example` in `/agent/INDEX.md` with a short note on why it worked. Helps Runneth pattern-match for similar future asks.',
  other: 'Route by content type using the same rules as the categories above. For competitor research → `/agent/brain/competitors/`. For landing page audits → `/agent/brain/landing-pages/`. For channel strategy → `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md`. For call notes → `/agent/brain/meetings/`. For templates → `/agent/brain/templates/` as `kind=template-source`.',
}

const fmtBytes = (n: number): string => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

const renderMainText = (p: BrainChecklistPayload): string => {
  const lines: string[] = []
  lines.push(`:brain: *New brain checklist submission from ${p.workspaceName}*`)
  lines.push(`*Contact:* ${p.contactEmail}`)
  lines.push(`*Submitted at:* ${p.submittedAt}`)
  lines.push('')
  for (const section of p.sections) {
    if (!section.context && section.files.length === 0) continue
    lines.push(`*${section.label}*`)
    if (section.files.length > 0) {
      const list = section.files.map((f) => `\`${f.filename}\` (${fmtBytes(f.sizeBytes)})`).join(', ')
      lines.push(`  • Files: ${list}`)
    } else {
      lines.push('  • Files: _(none)_')
    }
    if (section.context) {
      lines.push(`  • Context: ${section.context}`)
    } else {
      lines.push('  • Context: _(none provided)_')
    }
    const rec = BRAIN_STRUCTURE_BY_KEY[section.key]
    if (rec) lines.push(`  • *Recommended brain home:* ${rec}`)
    lines.push('')
  }
  lines.push('_Files are attached as replies in this thread._')
  return lines.join('\n')
}

type SlackPostResult = { ok: true; ts: string } | { ok: false; message: string }

const slackApi = async <T>(method: string, body: Record<string, unknown>): Promise<T> => {
  const resp = await fetch(`https://slack.com/api/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  })
  const json = (await resp.json()) as T
  return json
}

const slackPostMessage = async (text: string): Promise<SlackPostResult> => {
  const json = await slackApi<{ ok: boolean; ts?: string; error?: string }>('chat.postMessage', {
    channel: CHANNEL,
    text,
    unfurl_links: false,
  })
  if (!json.ok || !json.ts) return { ok: false, message: json.error || 'unknown error' }
  return { ok: true, ts: json.ts }
}

// Upload a file using the files.upload v2 flow:
//   1. files.getUploadURLExternal -> upload_url + file_id
//   2. POST file bytes to upload_url
//   3. files.completeUploadExternal with channel + thread_ts
const slackUploadFile = async (
  file: BrainChecklistFile,
  threadTs: string,
  log: (msg: string) => void,
): Promise<void> => {
  try {
    const params = new URLSearchParams({
      filename: file.filename,
      length: String(file.buffer.length),
    })
    const getUrlResp = await fetch(`https://slack.com/api/files.getUploadURLExternal?${params.toString()}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
    const getUrl = (await getUrlResp.json()) as { ok: boolean; upload_url?: string; file_id?: string; error?: string }
    if (!getUrl.ok || !getUrl.upload_url || !getUrl.file_id) {
      log(`[brain-checklist-slack] getUploadURLExternal failed for ${file.filename}: ${getUrl.error}`)
      return
    }
    const uploadResp = await fetch(getUrl.upload_url, {
      method: 'POST',
      body: new Uint8Array(file.buffer),
      headers: { 'Content-Type': file.mimeType || 'application/octet-stream' },
    })
    if (!uploadResp.ok) {
      log(`[brain-checklist-slack] external upload failed for ${file.filename}: ${uploadResp.status}`)
      return
    }
    const complete = await slackApi<{ ok: boolean; error?: string }>('files.completeUploadExternal', {
      files: [{ id: getUrl.file_id, title: `${file.field}: ${file.filename}` }],
      channel_id: CHANNEL,
      thread_ts: threadTs,
    })
    if (!complete.ok) {
      log(`[brain-checklist-slack] completeUploadExternal failed for ${file.filename}: ${complete.error}`)
    }
  } catch (err) {
    log(`[brain-checklist-slack] upload threw for ${file.filename}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const sendBrainChecklistSlack = async (
  payload: BrainChecklistPayload,
  log: (msg: string) => void,
): Promise<{ ok: true } | { ok: false; message: string }> => {
  if (!TOKEN || !CHANNEL) {
    log(
      `[brain-checklist-slack] BRAIN_CHECKLIST_SLACK_TOKEN or BRAIN_CHECKLIST_SLACK_CHANNEL not set — would have posted to ${CHANNEL || '(no channel)'}\n` +
        renderMainText(payload) +
        `\nattachments: ${payload.files.length} file(s)`,
    )
    return { ok: true }
  }

  const text = renderMainText(payload)
  const main = await slackPostMessage(text)
  if (!main.ok) {
    log(`[brain-checklist-slack] chat.postMessage failed: ${main.message}`)
    return { ok: false, message: `Slack post failed: ${main.message}` }
  }

  // Upload each file as a threaded reply. Best-effort: individual failures
  // are logged but do not block the main submission success.
  for (const file of payload.files) {
    await slackUploadFile(file, main.ts, log)
  }

  return { ok: true }
}
