import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { colors, easeArr } from './theme'

const REPO = 'https://github.com/Motion-Creative/runneth-apps/tree/main'

export const installPrompt = (githubPath: string): string =>
  `Integrate this into my Runneth and make sure it works with everything I already have running:\n\n${REPO}/${githubPath}`

type CTASize = 'lg' | 'md' | 'sm'

const sizePresets: Record<CTASize, { padX: number; padY: number; font: number; gap: number; iconSize: number }> = {
  lg: { padX: 22, padY: 14, font: 15.5, gap: 10, iconSize: 18 },
  md: { padX: 18, padY: 11, font: 14, gap: 8, iconSize: 16 },
  sm: { padX: 14, padY: 8, font: 13, gap: 6, iconSize: 14 },
}

export const CTA = ({
  githubPath,
  size = 'lg',
  fullWidth,
  onClickCapture,
}: {
  githubPath: string
  size?: CTASize
  fullWidth?: boolean
  onClickCapture?: (e: React.MouseEvent) => void
}): JSX.Element => {
  const [copied, setCopied] = useState(false)
  const preset = sizePresets[size]

  const onClick = async (e: React.MouseEvent): Promise<void> => {
    onClickCapture?.(e)
    e.stopPropagation()
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(installPrompt(githubPath))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2800)
    } catch {
      /* clipboard unavailable */
    }
  }

  const baseShadow = copied ? '0 10px 24px rgba(22, 163, 74, 0.28)' : '0 10px 24px rgba(80, 71, 235, 0.28)'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1.5, boxShadow: copied ? '0 14px 30px rgba(22,163,74,0.36)' : '0 14px 30px rgba(80,71,235,0.36)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.22, ease: easeArr as unknown as number[] }}
      style={{
        position: 'relative',
        display: fullWidth ? 'flex' : 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: preset.gap,
        width: fullWidth ? '100%' : undefined,
        padding: `${preset.padY}px ${preset.padX}px`,
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        background: copied ? colors.positive : colors.primary,
        color: '#ffffff',
        fontSize: preset.font,
        fontWeight: 600,
        letterSpacing: '-0.005em',
        boxShadow: baseShadow,
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="copied"
            initial={{ x: 6, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -6, opacity: 0 }}
            transition={{ duration: 0.22, ease: easeArr as unknown as number[] }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: preset.gap }}
          >
            <CheckGlyph size={preset.iconSize} />
            Copied. Paste it into your Runneth.
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ x: -6, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 6, opacity: 0 }}
            transition={{ duration: 0.22, ease: easeArr as unknown as number[] }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: preset.gap }}
          >
            Give this to my Runneth
            <SparkleGlyph size={preset.iconSize} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

const SparkleGlyph = ({ size }: { size: number }): JSX.Element => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" fill="#ffffff" />
    <circle cx="18.5" cy="5.5" r="1.25" fill="#ffffff" />
  </svg>
)

const CheckGlyph = ({ size }: { size: number }): JSX.Element => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 12.5l4 4 10-10" stroke="#ffffff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
