/**
 * Email helper for brain-checklist submissions from the customer-facing
 * /how-to-build-the-brain page.
 *
 * Uses Resend when RESEND_API_KEY is set. Otherwise logs the email payload
 * to the server log and returns success — keeps local dev unblocked.
 *
 * Env:
 *   RESEND_API_KEY        — Resend API key
 *   BRAIN_CHECKLIST_TO    — recipient (default support@motionapp.com)
 *   BRAIN_CHECKLIST_FROM  — sender (default onboarding@resend.dev)
 */
import { Resend } from 'resend'

const TO = process.env.BRAIN_CHECKLIST_TO || 'support@motionapp.com'
const FROM = process.env.BRAIN_CHECKLIST_FROM || 'onboarding@resend.dev'

const apiKey = process.env.RESEND_API_KEY
const client = apiKey ? new Resend(apiKey) : null

export type BrainChecklistFile = Readonly<{
  field: string
  filename: string
  mimeType: string
  buffer: Buffer
}>

export type BrainChecklistSection = Readonly<{
  key: string
  label: string
  context: string
  files: ReadonlyArray<{ filename: string; sizeBytes: number }>
}>

export type BrainChecklistPayload = Readonly<{
  workspaceName: string
  contactEmail: string
  sections: ReadonlyArray<BrainChecklistSection>
  files: ReadonlyArray<BrainChecklistFile>
  submittedAt: string
}>

const fmtBytes = (n: number): string => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

const renderBody = (p: BrainChecklistPayload): string => {
  const lines: string[] = []
  lines.push(`A new brain checklist was submitted from /how-to-build-the-brain.`)
  lines.push('')
  lines.push(`Workspace:    ${p.workspaceName}`)
  lines.push(`Contact:      ${p.contactEmail}`)
  lines.push(`Submitted at: ${p.submittedAt}`)
  lines.push('')
  lines.push('---')
  for (const section of p.sections) {
    if (!section.context && section.files.length === 0) continue
    lines.push('')
    lines.push(`### ${section.label}`)
    if (section.files.length > 0) {
      lines.push('Files:')
      for (const f of section.files) {
        lines.push(`  - ${f.filename} (${fmtBytes(f.sizeBytes)})`)
      }
    } else {
      lines.push('Files: (none)')
    }
    if (section.context) {
      lines.push('Context:')
      for (const ln of section.context.split('\n')) lines.push(`  ${ln}`)
    } else {
      lines.push('Context: (none provided)')
    }
  }
  lines.push('')
  lines.push('---')
  lines.push('Files for each section are attached to this email.')
  return lines.join('\n')
}

export const sendBrainChecklistEmail = async (
  payload: BrainChecklistPayload,
  log: (msg: string) => void,
): Promise<{ ok: true } | { ok: false; message: string }> => {
  const subject = `[Runneth brain] new checklist from ${payload.workspaceName}`
  const body = renderBody(payload)

  if (!client) {
    log(
      `[brain-checklist] RESEND_API_KEY not set — would have sent to ${TO}\n` +
        `subject: ${subject}\n${body}\n` +
        `attachments: ${payload.files.length} file(s)`,
    )
    return { ok: true }
  }

  const attachments = payload.files.map((f) => ({
    filename: f.filename,
    content: f.buffer.toString('base64'),
  }))

  try {
    const result = await client.emails.send({
      from: FROM,
      to: TO,
      replyTo: payload.contactEmail,
      subject,
      text: body,
      attachments,
    })
    if (result.error) {
      const errMsg = JSON.stringify(result.error)
      log(`[brain-checklist] Resend send failed: ${errMsg}`)
      return { ok: false, message: 'Email delivery failed.' }
    }
    return { ok: true }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    log(`[brain-checklist] Resend threw: ${errMsg}`)
    return { ok: false, message: 'Email delivery threw an error.' }
  }
}
