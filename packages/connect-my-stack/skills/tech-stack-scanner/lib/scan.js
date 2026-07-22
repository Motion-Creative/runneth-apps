/**
 * scan.js — headless-browser capture for tech-stack detection.
 *
 * Loads a URL in Chromium (via Playwright), captures every signal builtwith-style
 * detection needs, and writes a raw capture JSON to ./workdir/. It does NOT interpret
 * anything — detect.mjs does the matching against signatures.json.
 *
 * What it captures:
 *   - finalUrl / status                (redirects, reachability)
 *   - requests[]  {url, host, type}    (network fingerprint — the strongest signal)
 *   - mainHeaders {}                   (server, x-powered-by, etc.; cookie values removed)
 *   - cookies[]   {name, domain}       (session/tracking cookies)
 *   - windowKeys[]                     (JS globals like Shopify, dataLayer, klaviyo)
 *   - metaGenerator                    (<meta name="generator">)
 *   - html                            (rendered DOM, capped)
 *
 * Usage: NODE_PATH="$PW_NODE_PATH" node scan.js "<URL>" ["<outPath>"]
 */
let chromium; try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('playwright-core')); }
const { assertPublicHttpUrl } = require('./url-safety.cjs');

if (process.argv.includes('--check')) process.exit(0);

function hostOf(u) {
  try { return new URL(u).host.toLowerCase(); } catch { return ''; }
}

function sanitizeHeaders(headers) {
  return Object.fromEntries(
    Object.entries(headers || {}).filter(([name]) => name.toLowerCase() !== 'set-cookie'),
  );
}

(async () => {
  let url = process.argv[2];
  const outPath = process.argv[3] || './workdir/techscan.json';
  if (!url) { console.error('URL required'); process.exit(1); }
  try {
    url = (await assertPublicHttpUrl(url)).href;
  } catch (error) {
    console.error('URL rejected: ' + (error.message || error));
    process.exit(1);
  }

  const requests = [];
  const seen = new Set();

  // Chromium running as root in a container generally requires --no-sandbox.
  // Non-root environments retain Chromium's sandbox.
  const launchArgs = typeof process.getuid === 'function' && process.getuid() === 0
    ? ['--no-sandbox']
    : [];
  const browser = await chromium.launch({ headless: true, args: launchArgs });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    viewport: { width: 1366, height: 900 },
  });

  // Validate the main navigation, redirects, and subresources before Chromium
  // can contact them. This prevents customer-controlled pages from reaching
  // localhost, private networks, or cloud metadata endpoints through the VM.
  await context.route('**/*', async (route) => {
    try {
      const requestUrl = new URL(route.request().url());
      if (requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:') {
        await assertPublicHttpUrl(requestUrl.href);
      }
      await route.continue();
    } catch {
      await route.abort('blockedbyclient');
    }
  });

  // Register network listener BEFORE navigation — interception must be set up first.
  context.on('request', (req) => {
    const u = req.url();
    const h = hostOf(u);
    const key = h + '|' + req.resourceType();
    if (h && !seen.has(key)) {
      seen.add(key);
      requests.push({ url: u.slice(0, 300), host: h, type: req.resourceType() });
    }
  });

  const page = await context.newPage();
  let status = null, finalUrl = url, mainHeaders = {};

  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    if (resp) {
      status = resp.status();
      finalUrl = resp.url();
      try { mainHeaders = sanitizeHeaders(resp.headers()); } catch { mainHeaders = {}; }
    }
  } catch (e) {
    // Fall back to a looser wait — networkidle can time out on chatty sites.
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      if (resp) { status = resp.status(); finalUrl = resp.url(); mainHeaders = sanitizeHeaders(resp.headers()); }
    } catch (e2) {
      console.error('navigation failed: ' + (e2.message || e2));
    }
  }

  // Let late-firing tags (tag managers, pixels, chat widgets) load.
  await page.waitForTimeout(3500);

  let html = '', windowKeys = [], metaGenerator = '', cookies = [];
  try { html = (await page.content() || '').slice(0, 400000); } catch {}
  try {
    windowKeys = await page.evaluate(() => {
      try { return Object.getOwnPropertyNames(window).slice(0, 2000); } catch { return []; }
    });
  } catch {}
  try {
    metaGenerator = await page.evaluate(() => {
      const m = document.querySelector('meta[name="generator"]');
      return m ? (m.getAttribute('content') || '') : '';
    });
  } catch {}
  try {
    const ck = await context.cookies();
    cookies = ck.map((c) => ({ name: c.name, domain: c.domain }));
  } catch {}

  await browser.close();

  const capture = {
    inputUrl: url,
    finalUrl,
    status,
    scannedAt: new Date().toISOString(),
    requestHosts: [...new Set(requests.map((r) => r.host))].sort(),
    requests,
    mainHeaders,
    cookies,
    windowKeys,
    metaGenerator,
    html,
  };

  require('fs').writeFileSync(outPath, JSON.stringify(capture, null, 2));
  console.log('WROTE ' + outPath + ' status=' + status + ' hosts=' + capture.requestHosts.length + ' cookies=' + cookies.length);
})();
