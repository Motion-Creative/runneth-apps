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

  const baseShadow = copied ? '0 10px 24px rgba(63, 181, 92, 0.32)' : '0 10px 24px rgba(28, 24, 14, 0.22)'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1.5, boxShadow: copied ? '0 14px 30px rgba(63,181,92,0.40)' : '0 14px 30px rgba(28,24,14,0.32)' }}
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
            <CopyGlyph size={preset.iconSize} />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

const CopyGlyph = ({ size }: { size: number }): JSX.Element => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="9" y="9" width="11" height="12" rx="2" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
    <path d="M5 15V5a2 2 0 0 1 2-2h9" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const CheckGlyph = ({ size }: { size: number }): JSX.Element => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 12.5l4 4 10-10" stroke="#ffffff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
