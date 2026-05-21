/**
 * Email helper for review flag notifications.
 *
 * Uses Resend when RESEND_API_KEY is set. Otherwise logs the email payload
 * to the server log and returns success — keeps local dev unblocked and
 * makes prod misconfiguration loud rather than silent (because the log
 * will show every "would have sent" message).
 *
 * Env:
 *   RESEND_API_KEY  — Resend API key
 *   FLAG_TO_EMAIL   — recipient (default support@motionapp.com)
 *   FLAG_FROM_EMAIL — sender (must be a Resend-verified domain in prod;
 *                     default onboarding@resend.dev for dev)
 */
import { Resend } from 'resend'

const TO = process.env.FLAG_TO_EMAIL || 'support@motionapp.com'
const FROM = process.env.FLAG_FROM_EMAIL || 'onboarding@resend.dev'

const apiKey = process.env.RESEND_API_KEY
const client = apiKey ? new Resend(apiKey) : null

export type FlagEmailPayload = Readonly<{
  reviewId: number
  slug: string
  reviewerName: string
  stars: number
  reviewText: string
  reason: string | null
  flaggedAt: string
}>

const renderBody = (p: FlagEmailPayload): string =>
  [
    'A review was flagged on the Runneth Use Case Library.',
    '',
    `Use case slug: ${p.slug}`,
    `URL:           https://usecases.motionapp.com/?card=${encodeURIComponent(p.slug)}`,
    '',
    `Reviewer:      ${p.reviewerName}`,
    `Stars:         ${p.stars}/5`,
    `Review:`,
    p.reviewText ? p.reviewText.split('\n').map((l) => `  ${l}`).join('\n') : '  (no text)',
    '',
    `Flag reason:   ${p.reason || '(none provided)'}`,
    `Flagged at:    ${p.flaggedAt}`,
    '',
    `Review ID:     ${p.reviewId}`,
    '',
    'To hide this review, run on the Railway service:',
    `  sqlite3 $REVIEWS_DB_PATH "UPDATE reviews SET hidden = 1 WHERE id = ${p.reviewId};"`,
  ].join('\n')

export const sendFlagEmail = async (
  payload: FlagEmailPayload,
  log: (msg: string) => void,
): Promise<void> => {
  const subject = `[Use Case Library] Review flagged · ${payload.slug} · #${payload.reviewId}`
  const body = renderBody(payload)

  if (!client) {
    log(
      `[email] RESEND_API_KEY not set — would have sent to ${TO}\n` +
        `subject: ${subject}\n${body}`,
    )
    return
  }

  try {
    const result = await client.emails.send({
      from: FROM,
      to: TO,
      subject,
      text: body,
    })
    if (result.error) {
      log(`[email] Resend send failed: ${JSON.stringify(result.error)}`)
    }
  } catch (err) {
    log(`[email] Resend threw: ${err instanceof Error ? err.message : String(err)}`)
  }
}
