import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'

import { easeArr, radius } from './theme'
import { DetailContent } from './pages/DetailContent'

const getCardSlug = (search: string): string | null => {
  const slug = new URLSearchParams(search).get('card')
  if (!slug) return null
  return /^[a-z0-9-]+$/.test(slug) ? slug : null
}

export const Modal = (): JSX.Element => {
  const location = useLocation()
  const navigate = useNavigate()
  const slug = getCardSlug(location.search)
  const isOpen = slug !== null

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-no-scroll')
    } else {
      document.body.classList.remove('modal-no-scroll')
    }
    return () => {
      document.body.classList.remove('modal-no-scroll')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const close = (): void => {
    navigate({ pathname: location.pathname, search: '' })
  }

  return (
    <AnimatePresence>
      {isOpen && slug && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: easeArr as unknown as number[] }}
          onClick={close}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17, 17, 17, 0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '40px 16px',
            overflowY: 'auto',
          }}
        >
          <motion.div
            key="shell"
            initial={{ opacity: 0, scale: 0.97, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.32, ease: easeArr as unknown as number[] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 820,
              maxHeight: 'calc(100vh - 80px)',
              background: '#ffffff',
              borderRadius: radius.xl,
              overflow: 'hidden',
              boxShadow: '0 30px 70px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 36,
                height: 36,
                borderRadius: 999,
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 2,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <path d="M3 3l8 8M11 3l-8 8" stroke="#111111" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </button>
            <div style={{ overflowY: 'auto' }}>
              <DetailContent slug={slug} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
