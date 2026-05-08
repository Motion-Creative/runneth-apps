import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'

const t = {
  bg: '#ffffff', bgSub: '#f9f9f8', border: '#e8e7e3',
  text: '#1a1918', textMid: '#4a4845', textSub: '#9b9895',
}

function App() {
  const [health, setHealth] = useState<'checking' | 'ok' | 'error'>('checking')

  useEffect(() => {
    fetch('./api/health')
      .then(r => r.ok ? setHealth('ok') : setHealth('error'))
      .catch(() => setHealth('error'))
  }, [])

  const dot = health === 'ok' ? '#22c55e' : health === 'error' ? '#ef4444' : '#f59e0b'
  const label = health === 'ok' ? 'Running' : health === 'error' ? 'Unreachable' : 'Checking...'

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      background: t.bg, minHeight: '100vh', color: t.text,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 32, padding: 40,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 20, border: `1px solid ${t.border}`,
          background: t.bgSub, marginBottom: 24,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: t.textMid }}>{label}</span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          Image Gen Server
        </h1>
        <p style={{ color: t.textSub, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
          This app serves as the reference image CDN for static ad generation.
          Ad generation happens in chat — this server provides stable public URLs for NB2.
        </p>
      </div>

      <div style={{
        border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden',
        width: '100%', maxWidth: 480,
      }}>
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${t.border}`, background: t.bgSub }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: t.textSub }}>
            Available endpoints
          </span>
        </div>
        {[
          { method: 'GET', path: '/api/health', desc: 'Health check' },
          { method: 'GET', path: '/api/ref-images/:brand/:product/:filename', desc: 'Serve a reference image for NB2' },
        ].map(ep => (
          <div key={ep.path} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px',
            borderBottom: `1px solid ${t.border}`,
          }}>
            <span style={{
              flexShrink: 0, fontSize: 10, fontWeight: 700, padding: '3px 8px',
              borderRadius: 4, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
              fontFamily: 'monospace',
            }}>{ep.method}</span>
            <div>
              <div style={{ fontSize: 12, fontFamily: 'monospace', color: t.text, marginBottom: 3 }}>{ep.path}</div>
              <div style={{ fontSize: 11, color: t.textSub }}>{ep.desc}</div>
            </div>
          </div>
        ))}
        <div style={{ padding: '12px 18px' }}>
          <p style={{ fontSize: 11, color: t.textSub, margin: 0, lineHeight: 1.6 }}>
            To generate an ad, go to chat and say: <strong>"generate an ad for [product]"</strong>
          </p>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
