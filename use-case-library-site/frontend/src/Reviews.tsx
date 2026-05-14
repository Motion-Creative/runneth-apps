/**
 * Review components for the Use Case Library.
 *
 * - StarRating       — read-only stars, supports fractional fill (e.g., 4.7)
 * - StarPicker       — interactive 1-5 input
 * - ReviewsSection   — full list + write form + flag, used inside the detail modal
 */
import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchReviews, flagReview, submitReview } from './api'
import type { Review, ReviewsResponse } from './types'
import { brand, colors, radius } from './theme'

export const StarRating = ({
  value,
  size = 14,
  showNumber,
}: {
  value: number
  size?: number
  showNumber?: boolean
}): JSX.Element => {
  const clamped = Math.max(0, Math.min(5, value))
  const stars = [1, 2, 3, 4, 5]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ display: 'inline-flex', gap: 1 }} aria-label={`Rated ${clamped.toFixed(1)} out of 5`}>
        {stars.map((n) => {
          const fill = Math.max(0, Math.min(1, clamped - (n - 1)))
          return <Star key={n} size={size} fill={fill} />
        })}
      </span>
      {showNumber && (
        <span style={{ fontSize: Math.max(11, size - 2), color: colors.textMuted, fontWeight: 600 }}>
          {clamped.toFixed(1)}
        </span>
      )}
    </span>
  )
}

const Star = ({ size, fill }: { size: number; fill: number }): JSX.Element => {
  const id = `star-clip-${Math.random().toString(36).slice(2, 8)}`
  const path =
    'M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.6l-5.9 3.08 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={24 * fill} height="24" />
        </clipPath>
      </defs>
      <path d={path} fill="none" stroke={colors.textDark} strokeWidth={1.5} strokeLinejoin="round" />
      <path d={path} fill={brand.yellow} clipPath={`url(#${id})`} stroke={colors.textDark} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

export const StarPicker = ({
  value,
  onChange,
  size = 24,
}: {
  value: number
  onChange: (v: number) => void
  size?: number
}): JSX.Element => {
  const [hover, setHover] = useState<number | null>(null)
  const shown = hover ?? value
  return (
    <span
      style={{ display: 'inline-flex', gap: 4 }}
      role="radiogroup"
      aria-label="Star rating"
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= shown
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(null)}
            onClick={() => onChange(n)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 2,
              cursor: 'pointer',
              lineHeight: 0,
            }}
          >
            <Star size={size} fill={active ? 1 : 0} />
          </button>
        )
      })}
    </span>
  )
}

const formatDate = (iso: string): string => {
  // The API returns "YYYY-MM-DD HH:MM:SS" (UTC, no zone). Parse permissively.
  const isoWithT = iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z'
  const d = new Date(isoWithT)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export const ReviewsSection = ({ slug }: { slug: string }): JSX.Element => {
  const [data, setData] = useState<ReviewsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const r = await fetchReviews(slug)
      setData(r)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load reviews.')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <AggregateRow aggregate={data?.aggregate ?? null} loading={loading} />
      <WriteReviewForm slug={slug} onSubmitted={load} />
      <ReviewsList reviews={data?.reviews ?? []} slug={slug} loading={loading} error={error} />
    </div>
  )
}

const AggregateRow = ({
  aggregate,
  loading,
}: {
  aggregate: ReviewsResponse['aggregate'] | null
  loading: boolean
}): JSX.Element => {
  if (loading || !aggregate) {
    return <div style={{ height: 28, width: 200, background: colors.borderSubtle, borderRadius: 6 }} />
  }
  if (aggregate.count === 0) {
    return (
      <div style={{ color: colors.textMuted, fontSize: 14 }}>
        No reviews yet. Be the first to leave one.
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <StarRating value={aggregate.average ?? 0} size={20} />
      <span style={{ fontSize: 22, fontWeight: 700, color: colors.textDark, letterSpacing: '-0.01em' }}>
        {(aggregate.average ?? 0).toFixed(1)}
      </span>
      <span style={{ color: colors.textMuted, fontSize: 14 }}>
        {aggregate.count} {aggregate.count === 1 ? 'review' : 'reviews'}
      </span>
    </div>
  )
}

const WriteReviewForm = ({
  slug,
  onSubmitted,
}: {
  slug: string
  onSubmitted: () => Promise<void> | void
}): JSX.Element => {
  const [name, setName] = useState('')
  const [stars, setStars] = useState(0)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const canSubmit = name.trim().length > 0 && stars >= 1 && stars <= 5 && !submitting

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    const res = await submitReview(slug, { name: name.trim(), stars, text: text.trim() })
    if (res.ok) {
      setSuccess(true)
      setName('')
      setStars(0)
      setText('')
      await onSubmitted()
      window.setTimeout(() => setSuccess(false), 4000)
    } else {
      setError(res.message)
    }
    setSubmitting(false)
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        padding: 18,
        background: colors.backgroundSection,
        borderRadius: radius.lg,
        border: `1px solid ${colors.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: colors.textDark }}>Leave a review</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <StarPicker value={stars} onChange={setStars} size={26} />
        <span style={{ fontSize: 13, color: colors.textMuted }}>
          {stars > 0 ? `${stars} of 5` : 'Tap a star'}
        </span>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        maxLength={50}
        style={inputStyle}
      />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Optional — share what worked or didn't (2000 chars max)"
        maxLength={2000}
        rows={3}
        style={{ ...inputStyle, fontFamily: 'inherit', resize: 'vertical', minHeight: 72 }}
      />

      {error && <div style={{ color: '#b3261e', fontSize: 13 }}>{error}</div>}
      {success && <div style={{ color: '#1f7a3a', fontSize: 13 }}>Thanks — your review is live.</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            background: canSubmit ? colors.primary : colors.borderSubtle,
            color: canSubmit ? '#ffffff' : colors.textMuted,
            fontWeight: 600,
            fontSize: 14,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Posting…' : 'Post review'}
        </button>
      </div>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  fontSize: 14,
  background: '#ffffff',
  color: colors.textDark,
  outline: 'none',
}

const ReviewsList = ({
  reviews,
  slug,
  loading,
  error,
}: {
  reviews: readonly Review[]
  slug: string
  loading: boolean
  error: string | null
}): JSX.Element => {
  if (loading && reviews.length === 0) {
    return <div style={{ color: colors.textMuted, fontSize: 14 }}>Loading reviews…</div>
  }
  if (error) {
    return <div style={{ color: '#b3261e', fontSize: 14 }}>{error}</div>
  }
  if (reviews.length === 0) return <div />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {reviews.map((r) => (
        <ReviewItem key={r.id} review={r} slug={slug} />
      ))}
    </div>
  )
}

const ReviewItem = ({ review, slug }: { review: Review; slug: string }): JSX.Element => {
  const [showFlag, setShowFlag] = useState(false)
  const [reason, setReason] = useState('')
  const [flagState, setFlagState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [flagError, setFlagError] = useState<string | null>(null)

  const onFlag = async (): Promise<void> => {
    setFlagState('sending')
    setFlagError(null)
    const res = await flagReview(slug, review.id, reason.trim() || null)
    if (res.ok) {
      setFlagState('done')
      setShowFlag(false)
    } else {
      setFlagState('error')
      setFlagError(res.message || 'Could not send report.')
    }
  }

  return (
    <div
      style={{
        padding: 16,
        background: '#ffffff',
        borderRadius: radius.lg,
        border: `1px solid ${colors.borderSubtle}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <StarRating value={review.stars} size={14} />
        <span style={{ fontSize: 14, fontWeight: 700, color: colors.textDark }}>{review.name}</span>
        <span style={{ fontSize: 12, color: colors.textSubtle }}>{formatDate(review.created_at)}</span>
        <span style={{ flex: 1 }} />
        {flagState === 'done' ? (
          <span style={{ fontSize: 12, color: colors.textMuted }}>Reported · thanks</span>
        ) : (
          <button
            type="button"
            onClick={() => setShowFlag((v) => !v)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: colors.textSubtle,
              fontSize: 12,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {showFlag ? 'Cancel' : 'Report'}
          </button>
        )}
      </div>
      {review.text && (
        <div style={{ fontSize: 14, lineHeight: 1.55, color: colors.textBody, whiteSpace: 'pre-wrap' }}>
          {review.text}
        </div>
      )}
      {showFlag && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6 }}>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you reporting this? (optional)"
            maxLength={500}
            style={{ ...inputStyle, fontSize: 13 }}
          />
          {flagError && <div style={{ color: '#b3261e', fontSize: 12 }}>{flagError}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onFlag}
              disabled={flagState === 'sending'}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: `1px solid ${colors.textDark}`,
                background: 'transparent',
                color: colors.textDark,
                fontSize: 12,
                fontWeight: 600,
                cursor: flagState === 'sending' ? 'wait' : 'pointer',
              }}
            >
              {flagState === 'sending' ? 'Sending…' : 'Send report'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
