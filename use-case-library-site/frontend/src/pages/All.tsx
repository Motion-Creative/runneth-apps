import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { FilterChip, UseCaseCard } from '../components'
import type { Catalog } from '../types'
import { accent, colors, easeArr } from '../theme'

type StatusFilter = 'all' | 'proven' | 'experimental'

export const All = ({ catalog }: { catalog: Catalog }): JSX.Element => {
  const [category, setCategory] = useState<string>('all')
  const [status, setStatus] = useState<StatusFilter>('all')

  const visible = useMemo(() => {
    return catalog.use_cases.filter((u) => {
      if (category !== 'all' && u.category !== category) return false
      if (status !== 'all' && u.status !== status) return false
      return true
    })
  }, [catalog, category, status])

  return (
    <div>
      <section style={{ padding: '60px 24px 24px', maxWidth: 1180, margin: '0 auto' }}>
        <h1
          style={{
            fontSize: 'clamp(34px, 5vw, 48px)',
            lineHeight: 1.05,
            letterSpacing: '-0.022em',
            fontWeight: 800,
            margin: 0,
            color: colors.textDark,
          }}
        >
          Every use case
        </h1>
        <p style={{ color: colors.textMuted, fontSize: 16, marginTop: 10 }}>
          Filter by team, by status, or both.
        </p>
      </section>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          <FilterChip label="All teams" active={category === 'all'} onClick={() => setCategory('all')} />
          {catalog.categories.map((cat) => (
            <FilterChip
              key={cat.slug}
              label={cat.title}
              accentHex={accent(cat.slug)}
              active={category === cat.slug}
              onClick={() => setCategory(cat.slug)}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          <FilterChip label="All status" active={status === 'all'} onClick={() => setStatus('all')} />
          <FilterChip label={`Proven · ${catalog.proven_count}`} active={status === 'proven'} onClick={() => setStatus('proven')} />
          <FilterChip
            label={`Experimental · ${catalog.experimental_count}`}
            active={status === 'experimental'}
            onClick={() => setStatus('experimental')}
          />
        </div>
      </div>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 24px 80px' }}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${category}-${status}`}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.25, ease: easeArr as unknown as number[] }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 22,
            }}
          >
            {visible.map((useCase, i) => (
              <UseCaseCard key={useCase.slug} useCase={useCase} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: colors.textMuted }}>
            No use cases match those filters.
          </div>
        )}
      </section>
    </div>
  )
}
