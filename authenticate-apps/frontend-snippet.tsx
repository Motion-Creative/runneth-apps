// authenticate-apps · React frontend auth gate
//
// Drop LoginScreen and the auth state block into your app's main.tsx (or
// equivalent). The component calls the JSON API endpoints added by auth.mjs
// so it works alongside the same Fastify plugin — no extra backend changes.
//
// Works in cross-origin iframes (Motion app previewer) because every fetch
// uses credentials: 'include' and the plugin sets SameSite=None; Secure.
//
// Usage
// -----
// 1. Add LoginScreen before your App component (copy the component below).
// 2. In your App component, add the auth state block shown at the bottom.
// 3. That's it — no other changes needed.

import { useEffect, useMemo, useState } from 'react'
import { readMountedAppPaths } from './app-paths'  // adjust path if needed

// ---------------------------------------------------------------------------
// LoginScreen component — copy this into your main.tsx
// ---------------------------------------------------------------------------

export const LoginScreen = ({
  apiBasePath,
  onLogin,
}: {
  apiBasePath: string
  onLogin: () => void
}) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) return
    setLoading(true)
    setLoginError(null)
    try {
      const r = await fetch(`${apiBasePath}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })
      if (r.ok) {
        onLogin()
      } else {
        const data = await r.json().catch(() => ({})) as { error?: string }
        setLoginError(data.error || 'Invalid username or password')
      }
    } catch (err) {
      setLoginError(`Login failed: ${err instanceof Error ? err.message : 'network error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#0a0a0a',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <form
        onSubmit={(e) => { e.preventDefault(); handleLogin() }}
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#111',
          border: '1px solid #1a1a1a',
          borderRadius: 12,
          padding: '32px 28px',
        }}
      >
        <div style={{
          fontSize: 20,
          fontWeight: 600,
          color: '#fff',
          letterSpacing: -0.3,
          marginBottom: 6,
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
        }}>
          Sign in
        </div>
        <div style={{
          fontSize: 12,
          color: '#555',
          marginBottom: 24,
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
        }}>
          Runneth · Motion internal
        </div>

        {loginError && (
          <div style={{
            background: '#2a1414',
            border: '1px solid #4a1f1f',
            color: '#d6a3a3',
            fontSize: 12,
            padding: '8px 12px',
            borderRadius: 6,
            marginBottom: 14,
          }}>
            {loginError}
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={{
            display: 'block',
            fontSize: 11,
            color: '#777',
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 500,
            marginBottom: 6,
            fontFamily: 'inherit',
          }}>
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            autoCapitalize="off"
            autoCorrect="off"
            required
            style={{
              width: '100%',
              background: '#0a0a0a',
              border: '1px solid #222',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 13,
              color: '#e5e5e5',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{
            display: 'block',
            fontSize: 11,
            color: '#777',
            textTransform: 'uppercase',
            letterSpacing: 1,
            fontWeight: 500,
            marginBottom: 6,
            fontFamily: 'inherit',
          }}>
            Password
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{
              width: '100%',
              background: '#0a0a0a',
              border: '1px solid #222',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 13,
              color: '#e5e5e5',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            background: '#4d7dff',
            color: '#fff',
            border: 0,
            borderRadius: 6,
            padding: '11px 14px',
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            fontFamily: 'inherit',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Auth state block — add inside your App component
// ---------------------------------------------------------------------------
//
// const App = (): JSX.Element => {
//   // ... your existing state ...
//   const { apiBasePath } = useMemo(() => readMountedAppPaths(), [])
//
//   // --- auth gate (add these) ---
//   const [authStatus, setAuthStatus] = useState<'checking' | 'authed' | 'unauthed'>('checking')
//
//   useEffect(() => {
//     fetch(`${apiBasePath}/auth/status`, { credentials: 'include' })
//       .then((r) => r.ok ? setAuthStatus('authed') : setAuthStatus('unauthed'))
//       .catch(() => setAuthStatus('unauthed'))
//   }, [apiBasePath])
//
//   // Guard your data fetches so they only run when authenticated:
//   useEffect(() => {
//     if (authStatus !== 'authed') return
//     fetch(`${apiBasePath}/your-data-endpoint`)
//       // ...
//   }, [apiBasePath, authStatus])  // <-- add authStatus to deps
//
//   if (authStatus === 'checking') return <div>Loading...</div>
//   if (authStatus === 'unauthed') return <LoginScreen apiBasePath={apiBasePath} onLogin={() => setAuthStatus('authed')} />
//   // --- end auth gate ---
//
//   // ... rest of your component ...
// }
