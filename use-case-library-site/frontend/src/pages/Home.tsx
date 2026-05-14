import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { FilterChip, UseCaseCard } from '../components'
import type { Catalog } from '../types'
import { accent, colors, easeArr, heroGradientHome } from '../theme'

export const Home = ({ catalog }: { catalog: Catalog }): JSX.Element => {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: catalog.use_cases.length }
    for (const cat of catalog.categories) {
      c[cat.slug] = catalog.use_cases.filter((u) => u.category === cat.slug).length
    }
    return c
  }, [catalog])

  const categoryOrder = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of catalog.categories) m.set(c.slug, c.order)
    return m
  }, [catalog.categories])

  const visible = useMemo(() => {
    if (activeCategory === 'all') {
      return [...catalog.use_cases].sort((a, b) => {
        const oa = categoryOrder.get(a.category) ?? 999
        const ob = categoryOrder.get(b.category) ?? 999
        return oa - ob
      })
    }
    return catalog.use_cases.filter((u) => u.category === activeCategory)
  }, [catalog, activeCategory, categoryOrder])

  return (
    <div>
      <section style={{ background: heroGradientHome, padding: '96px 24px 64px', textAlign: 'center' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h1
            style={{
              fontSize: 'clamp(42px, 6.5vw, 72px)',
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              fontWeight: 800,
              margin: 0,
              color: colors.textDark,
            }}
          >
            Runneth use case library
          </h1>
        </div>
      </section>

      <div className="tab-bar-sticky">
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <FilterChip label="All" count={counts.all} active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
          {catalog.categories.map((cat) => (
            <FilterChip
              key={cat.slug}
              label={cat.title}
              count={counts[cat.slug] ?? 0}
              active={activeCategory === cat.slug}
              accentHex={accent(cat.slug)}
              onClick={() => setActiveCategory(cat.slug)}
            />
          ))}
        </div>
      </div>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 80px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
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
      </section>
    </div>
  )
}
