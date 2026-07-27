/**
 * fetch-capture.mjs — no-browser capture for tech-stack detection.
 *
 * Produces the SAME capture shape as scan.js (the Playwright capture) but using a
 * plain HTTPS fetch. Use this when the agent browser (Chromium) is not available in
 * the sandbox. It follows redirects, reads the response headers, parses every
 * external host referenced by <script>/<link>/<img>/<iframe> plus inline-script
 * hosts, and keeps the raw HTML so detect.mjs can match inline snippets (fbq, gtag,
 * klaviyo, Shopify, etc.).
 *
 * Trade-off vs the browser: tags injected purely at runtime by a tag manager, with
 * no marker in the initial HTML, can be missed. Most vendors still leave an inline
 * loader or script src in the HTML, so coverage is high but not identical.
 *
 * Usage: node fetch-capture.mjs "<URL>" ["<outPath>"]
 */
import fs from 'fs';
import urlSafety from './url-safety.cjs';

const { assertPublicHttpUrl } = urlSafety;

let url = process.argv[2];
const outPath = process.argv[3] || './workdir/techscan.json';
if (!url) { console.error('URL required'); process.exit(1); }

try {
  url = (await assertPublicHttpUrl(url)).href;
} catch (error) {
  console.error('URL rejected: ' + (error.message || error));
  process.exit(1);
}

function hostOf(u) { try { return new URL(u).host.toLowerCase(); } catch { return ''; } }

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function fetchWithValidatedRedirects(initialUrl, maxRedirects = 5) {
  let currentUrl = initialUrl;
  for (let redirects = 0; redirects <= maxRedirects; redirects += 1) {
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      headers: { 'user-agent': UA, 'accept': 'text/html,application/xhtml+xml' },
    });
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && response.status !== 304 && location) {
      if (redirects === maxRedirects) throw new Error('too many redirects');
      currentUrl = (await assertPublicHttpUrl(location, currentUrl)).href;
      continue;
    }
    return response;
  }
  throw new Error('too many redirects');
}

let resp, html = '', status = null, finalUrl = url, headers = {};
let setCookieValues = [];
try {
  resp = await fetchWithValidatedRedirects(url);
  status = resp.status;
  finalUrl = resp.url || url;
  setCookieValues = typeof resp.headers.getSetCookie === 'function'
    ? resp.headers.getSetCookie()
    : [resp.headers.get('set-cookie')].filter(Boolean);
  resp.headers.forEach((v, k) => {
    if (k.toLowerCase() !== 'set-cookie') headers[k.toLowerCase()] = v;
  });
  html = await resp.text();
} catch (e) {
  console.error('fetch failed: ' + (e.message || e));
  process.exit(1);
}

const base = hostOf(finalUrl);
const hostSet = new Set();
const requests = [];

// External resource references in markup.
const attrRe = /(?:src|href|data-src|content)\s*=\s*["']([^"']+)["']/gi;
let m;
while ((m = attrRe.exec(html)) !== null) {
  let u = m[1];
  if (u.startsWith('//')) u = 'https:' + u;
  if (!/^https?:\/\//i.test(u)) continue;
  const h = hostOf(u);
  if (h && !hostSet.has(h)) { hostSet.add(h); requests.push({ url: u.slice(0, 300), host: h, type: 'markup-ref' }); }
}
// Bare hosts referenced inside inline scripts (e.g. connect.facebook.net, klaviyo).
const hostRe = /(?:https?:)?\/\/([a-z0-9.-]+\.[a-z]{2,})(?:[\/"'\s])/gi;
while ((m = hostRe.exec(html)) !== null) {
  const h = m[1].toLowerCase();
  if (h && !hostSet.has(h)) { hostSet.add(h); requests.push({ url: '//' + h, host: h, type: 'inline-ref' }); }
}

// Cookies from Set-Cookie (only first-party ones the initial response sets).
const cookies = [];
for (const setCookie of setCookieValues) {
  for (const part of String(setCookie).split(/,(?=[^;,]+=)/)) {
    const nm = part.split(';')[0].split('=')[0].trim();
    if (nm) cookies.push({ name: nm, domain: base });
  }
}

let metaGenerator = '';
const gm = /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i.exec(html);
if (gm) metaGenerator = gm[1];

const capture = {
  inputUrl: url,
  finalUrl,
  status,
  scannedAt: new Date().toISOString(),
  captureMode: 'fetch',
  requestHosts: [...hostSet].sort(),
  requests,
  mainHeaders: headers,
  cookies,
  windowKeys: [],
  metaGenerator,
  html: html.slice(0, 400000),
};

fs.writeFileSync(outPath, JSON.stringify(capture, null, 2));
console.log('WROTE ' + outPath + ' status=' + status + ' hosts=' + capture.requestHosts.length + ' cookies=' + cookies.length + ' mode=fetch');
