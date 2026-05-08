import * as fs from 'fs';

const TOKEN_FILE = '/agent/brain/integrations/meta-token.json';
const APP_SECRET_FILE = '/agent/brain/integrations/meta-app-secret.txt';
const SPAWNETH_HOST = process.env.SPAWNETH_HOST ?? '';
const REDIRECT_URI = `https://${SPAWNETH_HOST}/meta-connect/api/callback`;
const META_SCOPES = 'ads_management,ads_read';
const GRAPH_VERSION = 'v21.0';
const APP_ID = '1860764521712249';
const APP_SECRET = require('fs').readFileSync(APP_SECRET_FILE, 'utf-8').trim();

interface BuildethRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: unknown;
}

interface BuildethResponse {
  status: number;
  headers?: Record<string, string>;
  body: unknown;
}

interface MetaToken {
  access_token: string;
  token_type: string;
  expires_at: number;
  created_at: number;
  user_id?: string;
  name?: string;
}

interface GraphTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message: string; type: string; code: number };
}

interface GraphUserResponse {
  id?: string;
  name?: string;
  error?: { message: string };
}

function json(body: unknown, status = 200): BuildethResponse {
  return {
    status,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
    },
    body: JSON.stringify(body),
  };
}

function redirect(url: string): BuildethResponse {
  return {
    status: 302,
    headers: { location: url, 'access-control-allow-origin': '*' },
    body: '',
  };
}

function readToken(): MetaToken | null {
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')) as MetaToken;
    }
  } catch { /* ignore */ }
  return null;
}

function writeToken(token: MetaToken): void {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(token, null, 2), 'utf-8');
}

// Exchange auth code for a short-lived user token, then upgrade to long-lived (60 days).
async function exchangeCodeForLongLivedToken(code: string): Promise<MetaToken> {
  // Step 1: code → short-lived user token
  const shortRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:
      `client_id=${APP_ID}` +
      `&client_secret=${APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&code=${encodeURIComponent(code)}`,
  });
  const shortData = await shortRes.json() as GraphTokenResponse;
  if (!shortData.access_token) {
    throw new Error(shortData.error?.message ?? 'Code exchange failed');
  }

  // Step 2: short-lived user token → long-lived user token (60 days)
  const longRes = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:
      'grant_type=fb_exchange_token' +
      `&client_id=${APP_ID}` +
      `&client_secret=${APP_SECRET}` +
      `&fb_exchange_token=${encodeURIComponent(shortData.access_token)}`,
  });
  const longData = await longRes.json() as GraphTokenResponse;
  if (!longData.access_token) {
    throw new Error(longData.error?.message ?? 'Long-lived token exchange failed');
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = longData.expires_in ?? 5183944; // ~60 days default
  const token: MetaToken = {
    access_token: longData.access_token,
    token_type: longData.token_type ?? 'bearer',
    expires_at: now + expiresIn,
    created_at: now,
  };

  // Step 3: fetch user info to attach name/ID to the stored token
  try {
    const userRes = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/me?fields=id,name&access_token=${encodeURIComponent(longData.access_token)}`
    );
    const userData = await userRes.json() as GraphUserResponse;
    if (userData.id) token.user_id = userData.id;
    if (userData.name) token.name = userData.name;
  } catch { /* non-fatal */ }

  return token;
}

// Refresh a long-lived token before expiry (generates a new 60-day token).
async function refreshLongLivedToken(currentToken: string): Promise<MetaToken> {
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:
      'grant_type=fb_exchange_token' +
      `&client_id=${APP_ID}` +
      `&client_secret=${APP_SECRET}` +
      `&fb_exchange_token=${encodeURIComponent(currentToken)}`,
  });
  const data = await res.json() as GraphTokenResponse;
  if (!data.access_token) {
    throw new Error(data.error?.message ?? 'Token refresh failed');
  }
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: data.access_token,
    token_type: data.token_type ?? 'bearer',
    expires_at: now + (data.expires_in ?? 5183944),
    created_at: now,
  };
}

export async function handleRequest(request: BuildethRequest): Promise<BuildethResponse> {
  const { method, path } = request;

  if (method === 'OPTIONS') {
    return {
      status: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'content-type',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  if (path.endsWith('/health')) return json({ ok: true });

  // GET /api/status — return current token state (no secrets exposed)
  if (method === 'GET' && path.endsWith('/status')) {
    const token = readToken();
    if (!token) return json({ connected: false });
    const now = Math.floor(Date.now() / 1000);
    const daysLeft = Math.floor((token.expires_at - now) / 86400);
    return json({
      connected: true,
      expires_at: token.expires_at,
      days_remaining: daysLeft,
      expired: daysLeft <= 0,
      user_id: token.user_id,
      name: token.name,
    });
  }

  // GET /api/auth-url — return the Meta OAuth dialog URL
  if (method === 'GET' && path.endsWith('/auth-url')) {
    const authUrl =
      `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth` +
      `?client_id=${APP_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(META_SCOPES)}` +
      `&response_type=code`;
    return json({ url: authUrl });
  }

  // GET /api/callback — Meta redirects here after user authorizes
  if (method === 'GET' && path.includes('/callback')) {
    const url = new URL(`https://placeholder.com${path}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const errorDesc = url.searchParams.get('error_description');

    if (error) {
      return {
        status: 302,
        headers: { location: `/meta-connect?error=${encodeURIComponent(errorDesc ?? error)}` },
        body: '',
      };
    }

    if (!code) {
      return {
        status: 302,
        headers: { location: '/meta-connect?error=missing_code' },
        body: '',
      };
    }

    try {
      const token = await exchangeCodeForLongLivedToken(code);
      writeToken(token);
      return redirect('/meta-connect?connected=1');
    } catch (err: unknown) {
      const msg = encodeURIComponent(err instanceof Error ? err.message : 'unknown_error');
      return redirect(`/meta-connect?error=${msg}`);
    }
  }

  // POST /api/refresh — manually extend the stored token
  if (method === 'POST' && path.endsWith('/refresh')) {
    const stored = readToken();
    if (!stored) return json({ error: 'not_connected', message: 'No stored token to refresh.' }, 400);
    try {
      const refreshed = await refreshLongLivedToken(stored.access_token);
      // Preserve user info
      if (stored.user_id) refreshed.user_id = stored.user_id;
      if (stored.name) refreshed.name = stored.name;
      writeToken(refreshed);
      const now = Math.floor(Date.now() / 1000);
      return json({
        ok: true,
        days_remaining: Math.floor((refreshed.expires_at - now) / 86400),
        expires_at: refreshed.expires_at,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return json({ error: 'refresh_failed', message: msg }, 500);
    }
  }

  // POST /api/disconnect — remove the stored token
  if (method === 'POST' && path.endsWith('/disconnect')) {
    try {
      if (fs.existsSync(TOKEN_FILE)) fs.unlinkSync(TOKEN_FILE);
    } catch { /* ignore */ }
    return json({ ok: true, disconnected: true });
  }

  // GET /api/myip — returns the outbound IP as seen by an external service
  if (method === 'GET' && path.endsWith('/myip')) {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json() as { ip: string };
      return json({ ip: data.ip });
    } catch (err: unknown) {
      return json({ error: String(err) }, 500);
    }
  }

  return json({ error: 'not_found', path }, 404);
}
