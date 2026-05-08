import { StrictMode, useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

interface TokenStatus {
  connected: boolean;
  expires_at?: number;
  days_remaining?: number;
  expired?: boolean;
  user_id?: string;
  name?: string;
}

type AppState = 'loading' | 'disconnected' | 'connected' | 'error';

const API = '/meta-connect/api';

const styles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0f0f10;
    color: #e8e8ed;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .card {
    background: #1c1c1e;
    border: 1px solid #2c2c2e;
    border-radius: 16px;
    padding: 40px;
    width: 420px;
    max-width: calc(100vw - 32px);
  }
  .logo-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
  }
  .logo-meta {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #0081FB, #0668E1);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 900;
    color: white;
    letter-spacing: -1px;
  }
  .logo-x {
    color: #636366;
    font-size: 18px;
  }
  .logo-runneth {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #7C3AED, #5B21B6);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
  h1 {
    font-size: 22px;
    font-weight: 700;
    color: #f2f2f7;
    margin-bottom: 8px;
  }
  .subtitle {
    font-size: 14px;
    color: #8e8e93;
    line-height: 1.5;
    margin-bottom: 28px;
  }
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 24px;
  }
  .status-connected {
    background: rgba(52, 199, 89, 0.15);
    color: #34c759;
    border: 1px solid rgba(52, 199, 89, 0.25);
  }
  .status-disconnected {
    background: rgba(255, 159, 10, 0.12);
    color: #ff9f0a;
    border: 1px solid rgba(255, 159, 10, 0.2);
  }
  .status-expired {
    background: rgba(255, 69, 58, 0.12);
    color: #ff453a;
    border: 1px solid rgba(255, 69, 58, 0.2);
  }
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }
  .info-grid {
    background: #2c2c2e;
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
  }
  .info-label { color: #8e8e93; }
  .info-value { color: #f2f2f7; font-weight: 500; }
  .info-value.warning { color: #ff9f0a; }
  .info-value.danger { color: #ff453a; }
  .btn {
    width: 100%;
    padding: 14px;
    border-radius: 10px;
    border: none;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.1s;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  .btn:active { transform: scale(0.98); }
  .btn:disabled { opacity: 0.5; cursor: default; }
  .btn-primary {
    background: #0081FB;
    color: white;
  }
  .btn-primary:hover:not(:disabled) { opacity: 0.88; }
  .btn-secondary {
    background: #2c2c2e;
    color: #f2f2f7;
    border: 1px solid #3a3a3c;
  }
  .btn-secondary:hover:not(:disabled) { background: #3a3a3c; }
  .btn-danger {
    background: transparent;
    color: #ff453a;
    border: 1px solid rgba(255, 69, 58, 0.3);
  }
  .btn-danger:hover:not(:disabled) { background: rgba(255, 69, 58, 0.08); }
  .error-box {
    background: rgba(255, 69, 58, 0.1);
    border: 1px solid rgba(255, 69, 58, 0.25);
    border-radius: 8px;
    padding: 12px;
    font-size: 13px;
    color: #ff453a;
    margin-bottom: 16px;
    line-height: 1.4;
  }
  .success-box {
    background: rgba(52, 199, 89, 0.1);
    border: 1px solid rgba(52, 199, 89, 0.25);
    border-radius: 8px;
    padding: 12px;
    font-size: 13px;
    color: #34c759;
    margin-bottom: 16px;
  }
  .scopes {
    font-size: 12px;
    color: #636366;
    margin-top: 4px;
    line-height: 1.5;
  }
  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [status, setStatus] = useState<TokenStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [actionLoading, setActionLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/status`);
      const data: TokenStatus = await res.json();
      setStatus(data);
      setAppState(data.connected ? 'connected' : 'disconnected');
    } catch {
      setAppState('error');
    }
  }, []);

  useEffect(() => {
    // Check for ?connected=1 or ?error=... from OAuth callback redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === '1') {
      setMessage('Connected successfully! Your token is valid for 60 days.');
      setMessageType('success');
      window.history.replaceState({}, '', '/meta-connect');
    } else if (params.get('error')) {
      setMessage(decodeURIComponent(params.get('error') ?? 'Unknown error'));
      setMessageType('error');
      window.history.replaceState({}, '', '/meta-connect');
    }
    checkStatus();
  }, [checkStatus]);

  const handleConnect = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/auth-url`);
      const data = await res.json() as { url?: string; error?: string; message?: string };
      if (data.url) {
        // Open in a popup — Facebook blocks loading in iframes
        const popup = window.open(data.url, 'meta-oauth', 'width=600,height=700,left=200,top=100');
        if (!popup) {
          // Fallback if popups are blocked: new tab
          window.open(data.url, '_blank');
        }
        // Poll for completion — when the token is saved, update the UI
        const poll = setInterval(async () => {
          try {
            const statusRes = await fetch(`${API}/status`);
            const statusData: TokenStatus = await statusRes.json();
            if (statusData.connected) {
              clearInterval(poll);
              setStatus(statusData);
              setAppState('connected');
              setMessage('Connected! Your token is valid for 60 days.');
              setMessageType('success');
              setActionLoading(false);
              try { popup?.close(); } catch { /* ignore */ }
            }
          } catch { /* keep polling */ }
        }, 2000);
        // Stop polling after 5 minutes if nothing happens
        setTimeout(() => {
          clearInterval(poll);
          setActionLoading(false);
        }, 300000);
      } else {
        setMessage(data.message ?? data.error ?? 'Failed to get auth URL. Check META_APP_ID and META_APP_SECRET secrets.');
        setMessageType('error');
        setActionLoading(false);
      }
    } catch {
      setMessage('Could not reach the backend. Try refreshing.');
      setMessageType('error');
      setActionLoading(false);
    }
  };

  const handleRefresh = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${API}/refresh`, { method: 'POST' });
      const data = await res.json() as { ok?: boolean; days_remaining?: number; error?: string; message?: string };
      if (data.ok) {
        setMessage(`Token refreshed! Now valid for ${data.days_remaining} more days.`);
        setMessageType('success');
        await checkStatus();
      } else {
        setMessage(data.message ?? data.error ?? 'Refresh failed');
        setMessageType('error');
      }
    } catch {
      setMessage('Refresh request failed. Try again.');
      setMessageType('error');
    }
    setActionLoading(false);
  };

  const handleDisconnect = async () => {
    if (!confirm('Remove the stored Meta token? You\'ll need to reconnect.')) return;
    setActionLoading(true);
    try {
      await fetch(`${API}/disconnect`, { method: 'POST' });
      setStatus(null);
      setAppState('disconnected');
      setMessage(null);
    } catch { /* ignore */ }
    setActionLoading(false);
  };

  const daysColor = (days: number | undefined) => {
    if (!days || days <= 0) return 'danger';
    if (days < 10) return 'warning';
    return '';
  };

  const expiryDate = (ts: number | undefined) => {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="card">
        <div className="logo-row">
          <div className="logo-meta">f</div>
          <span className="logo-x">×</span>
          <div className="logo-runneth">🐸</div>
        </div>

        <h1>Meta Connect</h1>
        <p className="subtitle">
          Connect your Meta Ads account to Runneth. Your token auto-refreshes and never blocks a campaign launch.
        </p>

        {appState === 'loading' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <div className="spinner" style={{ borderTopColor: '#636366', borderColor: '#3a3a3c' }} />
          </div>
        )}

        {appState === 'connected' && status && (
          <>
            <div className={`status-badge ${status.expired ? 'status-expired' : 'status-connected'}`}>
              <span className="dot" />
              {status.expired ? 'Token expired' : 'Connected'}
            </div>

            <div className="info-grid">
              {status.name && (
                <div className="info-row">
                  <span className="info-label">Account</span>
                  <span className="info-value">{status.name}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Expires</span>
                <span className={`info-value ${daysColor(status.days_remaining)}`}>
                  {expiryDate(status.expires_at)}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Days remaining</span>
                <span className={`info-value ${daysColor(status.days_remaining)}`}>
                  {status.days_remaining !== undefined
                    ? status.days_remaining <= 0
                      ? 'Expired'
                      : `${status.days_remaining} days`
                    : '—'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Scopes</span>
                <span className="info-value" style={{ fontSize: 12, color: '#636366' }}>ads_management · ads_read · business_management</span>
              </div>
            </div>

            {message && (
              <div className={messageType === 'success' ? 'success-box' : 'error-box'}>{message}</div>
            )}

            <button className="btn btn-secondary" onClick={handleRefresh} disabled={actionLoading}>
              {actionLoading ? <span className="spinner" style={{ borderTopColor: '#aaa', borderColor: '#555' }} /> : '↻ Refresh Token (extend 60 days)'}
            </button>
            <button className="btn btn-primary" onClick={handleConnect} disabled={actionLoading}>
              Reconnect with Meta
            </button>
            <button className="btn btn-danger" onClick={handleDisconnect} disabled={actionLoading}>
              Disconnect
            </button>
          </>
        )}

        {appState === 'disconnected' && (
          <>
            <div className="status-badge status-disconnected">
              <span className="dot" />
              Not connected
            </div>

            {message && (
              <div className={messageType === 'success' ? 'success-box' : 'error-box'}>{message}</div>
            )}

            <button className="btn btn-primary" onClick={handleConnect} disabled={actionLoading}>
              {actionLoading
                ? <><span className="spinner" /> Getting auth URL…</>
                : <><span style={{ fontSize: 18, lineHeight: 1 }}>f</span> Connect with Meta</>}
            </button>
            <p className="scopes">Requests: ads_management · ads_read · business_management</p>
          </>
        )}

        {appState === 'error' && (
          <>
            <div className="error-box">Could not reach the app backend. Make sure the app is running and try refreshing.</div>
            <button className="btn btn-secondary" onClick={checkStatus}>Retry</button>
          </>
        )}
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>
);
