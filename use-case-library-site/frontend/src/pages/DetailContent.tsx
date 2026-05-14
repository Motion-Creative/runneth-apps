import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { marked } from 'marked'

import { CTA } from '../CTA'
import { CategoryPill, ExperimentalPill } from '../components'
import { fetchUseCase } from '../api'
import type { UseCaseDetail } from '../types'
import { accent, colors, easeArr, heroGradientDetail, radius } from '../theme'

export const DetailContent = ({ slug }: { slug: string }): JSX.Element => {
  const [detail, setDetail] = useState<UseCaseDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'how'>('overview')

  useEffect(() => {
    setDetail(null)
    setError(null)
    setTab('overview')
    let cancelled = false
    fetchUseCase(slug)
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load this use case.')
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  const accentHex = useMemo(() => accent(detail?.manifest.category), [detail?.manifest.category])
  const categoryTitle = useMemo(() => {
    const cat = detail?.manifest.category ?? ''
    return cat
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }, [detail?.manifest.category])

  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <p style={{ color: colors.textMuted, fontSize: 14 }}>Could not load this use case. {error}</p>
      </div>
    )
  }

  if (!detail) {
    return (
      <div style={{ padding: 32, minHeight: 320 }}>
        <div style={{ height: 14, width: 140, borderRadius: 6, background: colors.borderSubtle }} />
        <div style={{ height: 28, width: '70%', marginTop: 18, borderRadius: 8, background: colors.borderSubtle }} />
        <div style={{ height: 14, width: '90%', marginTop: 14, borderRadius: 6, background: colors.borderSubtle }} />
        <div style={{ height: 14, width: '80%', marginTop: 8, borderRadius: 6, background: colors.borderSubtle }} />
      </div>
    )
  }

  const fm = detail.marketing?.frontmatter ?? {}
  const heroHeadline = fm.hero_headline ?? detail.manifest.display_title
  const heroSubhead = fm.hero_subhead ?? detail.manifest.description ?? ''
  const installTime = fm.install_time ?? '—'
  const requires = fm.requires ?? '—'
  const version = detail.manifest.version ?? null
  const isExperimental = detail.manifest.status === 'experimental'

  return (
    <div>
      <div style={{ background: heroGradientDetail(accentHex), padding: '36px 32px 28px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <CategoryPill title={categoryTitle} accentHex={accentHex} />
          {isExperimental && <ExperimentalPill pulse />}
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 30,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            color: colors.textDark,
            fontWeight: 800,
          }}
        >
          {heroHeadline}
        </h1>
        {heroSubhead && (
          <p style={{ marginTop: 12, marginBottom: 18, color: colors.textBody, fontSize: 16, lineHeight: 1.55 }}>
            {heroSubhead}
          </p>
        )}
        <CTA githubPath={detail.manifest.github_path} size="lg" />
        <div style={{ display: 'flex', gap: 22, marginTop: 22, flexWrap: 'wrap', color: colors.textMuted, fontSize: 13 }}>
          <MetaRow label="Install time" value={installTime} />
          <MetaRow label="Requires" value={requires} />
          {version && <MetaRow label="Version" value={version} />}
        </div>
      </div>

      <div
        style={{
          padding: '14px 32px 0',
          borderBottom: `1px solid ${colors.borderSubtle}`,
          display: 'flex',
          gap: 6,
        }}
      >
        <TabButton label="Overview" active={tab === 'overview'} onClick={() => setTab('overview')} accentHex={accentHex} />
        <TabButton label="How it's built" active={tab === 'how'} onClick={() => setTab('how')} accentHex={accentHex} />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {tab === 'overview' ? (
          <motion.div
            key="ov"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 10, opacity: 0 }}
            transition={{ duration: 0.26, ease: easeArr as unknown as number[] }}
            style={{ padding: '24px 32px 36px' }}
          >
            <OverviewBody
              body={detail.marketing?.body ?? detail.manifest.description ?? ''}
              githubPath={detail.manifest.github_path}
              accentHex={accentHex}
            />
          </motion.div>
        ) : (
          <motion.div
            key="how"
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -10, opacity: 0 }}
            transition={{ duration: 0.26, ease: easeArr as unknown as number[] }}
            style={{ padding: '24px 32px 36px' }}
          >
            <HowItsBuilt detail={detail} accentHex={accentHex} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const MetaRow = ({ label, value }: { label: string; value: string }): JSX.Element => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, color: colors.textSubtle }}>{label}</span>
    <span style={{ fontSize: 13.5, color: colors.textDark, fontWeight: 600 }}>{value}</span>
  </div>
)

const TabButton = ({
  label,
  active,
  onClick,
  accentHex,
}: {
  label: string
  active: boolean
  onClick: () => void
  accentHex: string
}): JSX.Element => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: 'transparent',
      border: 'none',
      padding: '10px 12px 14px',
      cursor: 'pointer',
      fontSize: 14,
      fontWeight: active ? 700 : 500,
      color: active ? colors.textDark : colors.textMuted,
      borderBottom: `2px solid ${active ? accentHex : 'transparent'}`,
      marginBottom: -1,
    }}
  >
    {label}
  </button>
)

const OverviewBody = ({
  body,
  githubPath,
  accentHex,
}: {
  body: string
  githubPath: string
  accentHex: string
}): JSX.Element => {
  const html = useMemo(() => marked.parse(body || '', { async: false }) as string, [body])
  return (
    <div>
      <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
      <div
        style={{
          marginTop: 32,
          padding: 22,
          borderRadius: radius.lg,
          background: `${accentHex}0d`,
          border: `1px solid ${accentHex}26`,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 16, color: colors.textDark }}>
          Ready to give this to your Runneth?
        </div>
        <div style={{ color: colors.textMuted, fontSize: 14, lineHeight: 1.5 }}>
          Copy the install prompt. Paste it into your Runneth chat. It will set the whole thing up.
        </div>
        <div>
          <CTA githubPath={githubPath} size="lg" />
        </div>
      </div>
    </div>
  )
}

const HowItsBuilt = ({ detail, accentHex }: { detail: UseCaseDetail; accentHex: string }): JSX.Element => {
  const ic = detail.install_config ?? {}
  const installs = Array.isArray((ic as { installs?: unknown }).installs)
    ? ((ic as { installs: unknown[] }).installs as Array<Record<string, unknown>>)
    : []
  const customize = Array.isArray((ic as { customize?: unknown }).customize)
    ? ((ic as { customize: unknown[] }).customize as Array<Record<string, unknown>>)
    : []
  const changelog = Array.isArray((ic as { changelog?: unknown }).changelog)
    ? ((ic as { changelog: unknown[] }).changelog as Array<Record<string, unknown>>)
    : []
  const [readmeOpen, setReadmeOpen] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, color: colors.textBody, fontSize: 14.5, lineHeight: 1.6 }}>
      <section>
        <Heading>Source on GitHub</Heading>
        <a
          href={detail.manifest.github_url}
          target="_blank"
          rel="noreferrer"
          style={{ color: accentHex, fontWeight: 600, fontSize: 14 }}
        >
          {detail.manifest.github_url}
        </a>
      </section>

      {installs.length > 0 && (
        <section>
          <Heading>What gets installed</Heading>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {installs.slice(0, 12).map((i, idx) => {
              const file = (i.file as string | undefined) ?? (i.from as string | undefined) ?? (i.appends_to as string | undefined) ?? '—'
              const dest = (i.dest as string | undefined) ?? (i.to as string | undefined) ?? ''
              return (
                <li key={idx} style={{ margin: '4px 0' }}>
                  <code style={{ background: colors.backgroundSection, padding: '1px 6px', borderRadius: 4 }}>{file}</code>
                  {dest && <span style={{ color: colors.textMuted }}>{' → '}{dest}</span>}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {customize.length > 0 && (
        <section>
          <Heading>Customize tokens</Heading>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {customize.map((c, idx) => (
              <li key={idx} style={{ margin: '4px 0' }}>
                <code style={{ background: colors.backgroundSection, padding: '1px 6px', borderRadius: 4 }}>
                  {(c.token as string | undefined) ?? ''}
                </code>
                {c.description ? <span style={{ color: colors.textMuted }}>{' — '}{c.description as string}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {changelog.length > 0 && (
        <section>
          <Heading>Changelog</Heading>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {changelog.slice(0, 6).map((c, idx) => (
              <li key={idx} style={{ margin: '4px 0' }}>
                <strong>{(c.version as string | undefined) ?? ''}</strong>{' '}
                <span style={{ color: colors.textMuted }}>{(c.notes as string | undefined) ?? ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {detail.readme && (
        <section>
          <Heading>Full README</Heading>
          <button
            type="button"
            onClick={() => setReadmeOpen((v) => !v)}
            style={{
              background: 'transparent',
              color: accentHex,
              border: `1px solid ${accentHex}55`,
              padding: '6px 12px',
              borderRadius: 999,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {readmeOpen ? 'Hide README' : 'Show README'}
          </button>
          {readmeOpen && (
            <div
              className="markdown"
              style={{ marginTop: 16 }}
              dangerouslySetInnerHTML={{ __html: marked.parse(detail.readme, { async: false }) as string }}
            />
          )}
        </section>
      )}
    </div>
  )
}

const Heading = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <div style={{ fontWeight: 700, fontSize: 14, color: colors.textDark, marginBottom: 8 }}>
    {children}
  </div>
)
