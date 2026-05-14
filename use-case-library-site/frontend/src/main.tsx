import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'

import { fetchCatalog } from './api'
import { Modal } from './Modal'
import { Home } from './pages/Home'
import { All } from './pages/All'
import { colors } from './theme'
import type { Catalog } from './types'
import './style.css'

const App = (): JSX.Element => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
)

const AppShell = (): JSX.Element => {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchCatalog()
      .then((c) => {
        if (!cancelled) setCatalog(c)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load catalog.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) return <ErrorState message={error} />
  if (!catalog) return <LoadingState />

  return (
    <>
      <Routes>
        <Route path="/" element={<Home catalog={catalog} />} />
        <Route path="/all" element={<All catalog={catalog} />} />
        <Route path="/use-case/:slug" element={<LegacyDetailRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      <Modal />
    </>
  )
}

const Footer = (): JSX.Element => (
  <footer
    style={{
      borderTop: `1px solid ${colors.borderSubtle}`,
      padding: '32px 24px',
      textAlign: 'center',
      color: colors.textMuted,
      fontSize: 13,
    }}
  >
    Made by Motion. Source on{' '}
    <a
      href="https://github.com/Motion-Creative/runneth-apps"
      target="_blank"
      rel="noreferrer"
      style={{ color: colors.primary, fontWeight: 600 }}
    >
      GitHub
    </a>
    .
  </footer>
)

const LoadingState = (): JSX.Element => (
  <main style={{ padding: 80, textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>
    Loading the library…
  </main>
)

const ErrorState = ({ message }: { message: string }): JSX.Element => (
  <main style={{ padding: 80, textAlign: 'center', color: colors.textMuted, fontSize: 14 }}>
    <p>Could not load the catalog.</p>
    <p style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 12, color: colors.textSubtle }}>{message}</p>
  </main>
)

const LegacyDetailRedirect = (): JSX.Element => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  useEffect(() => {
    if (slug && /^[a-z0-9-]+$/.test(slug)) {
      navigate({ pathname: '/', search: `?card=${encodeURIComponent(slug)}` }, { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }, [slug, navigate])
  return <LoadingState />
}

const rootNode = document.getElementById('root')
if (rootNode === null) {
  throw new Error('Missing #root element')
}

createRoot(rootNode).render(<App />)
