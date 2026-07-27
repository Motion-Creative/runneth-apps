/**
 * detect.mjs — match a raw browser capture against signatures.json.
 *
 * Usage: node detect.mjs <captureJson> [signaturesJson] [--json] [--customer]
 *
 * Modes:
 *   default   BuiltWith-style output using the raw signature categories. Use for
 *             competitor/standalone tech scans where technical buckets are right.
 *   --customer  Customer-onboarding output: remaps categories to Runneth's real
 *             integration categories, renames ad tracking tags to ads language
 *             ("Meta ads", not "Meta Pixel"), separates Meta/TikTok as Motion ad
 *             platforms, drops the double-listing of matched hosts, and orders
 *             categories for a marketer. Use this from connect-my-stack.
 *   --json    Emit the machine payload instead of the human report (combines with
 *             --customer).
 */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const customer = args.includes('--customer');
const files = args.filter((a) => !a.startsWith('--'));
const capturePath = files[0];
const sigPath = files[1] || path.join(path.dirname(new URL(import.meta.url).pathname), 'signatures.json');

if (!capturePath) { console.error('capture json path required'); process.exit(1); }

const cap = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
const { signatures } = JSON.parse(fs.readFileSync(sigPath, 'utf8'));

const hosts = (cap.requestHosts || []).map((h) => h.toLowerCase());
const html = (cap.html || '').toLowerCase();
const winKeys = new Set(cap.windowKeys || []);
const cookieNames = (cap.cookies || []).map((c) => (c.name || '').toLowerCase());
const meta = (cap.metaGenerator || '').toLowerCase();
const headers = {};
for (const [k, v] of Object.entries(cap.mainHeaders || {})) headers[k.toLowerCase()] = String(v).toLowerCase();
const matchedNetworkHosts = new Set();

// --- Customer-mode remapping tables ---------------------------------------
// Raw engine category -> Runneth's real integration category. Anything not
// mapped falls to "Other" (infra/dev noise a marketer does not connect).
const CATEGORY_MAP = {
  'Advertising Pixel': 'Paid channels',
  'Analytics': 'Analytics & attribution',
  'Attribution': 'Analytics & attribution',
  'Attribution / Data Layer': 'Analytics & attribution',
  'CDP / Tag Manager': 'Analytics & attribution',
  'Analytics / Heatmaps': 'Site & product analytics',
  'Analytics / Session Replay': 'Site & product analytics',
  'A-B Testing': 'Site & product analytics',
  'Personalization': 'Site & product analytics',
  'Personalization / A-B Testing': 'Site & product analytics',
  'CRM / Marketing': 'CRM & sales',
  'Chat / Support': 'Voice of customer',
  'Reviews / UGC': 'Voice of customer',
  'Ecommerce Platform': 'Store & revenue',
  'Merchandising / Upsell': 'Store & revenue',
  'Payments': 'Store & revenue',
  'Payments / BNPL': 'Store & revenue',
  'Subscriptions': 'Store & revenue',
  'Email / SMS': 'Email & SMS',
  'Lifecycle / CDP': 'Email & SMS',
  'Popups / Conversion': 'Email & SMS',
};
// Ad tracking tags are named in ads language, never "Pixel"/"Tag"/"Insight".
const AD_RENAME = {
  'Meta Pixel': 'Meta ads',
  'TikTok Pixel': 'TikTok ads',
  'Google Ads / Conversion': 'Google ads',
  'Pinterest Tag': 'Pinterest ads',
  'Snapchat Pixel': 'Snapchat ads',
  'LinkedIn Insight': 'LinkedIn ads',
  'Reddit Pixel': 'Reddit ads',
  'Twitter/X Pixel': 'X ads',
};
// Marketer-facing category order; "Other" always last.
const CANON_ORDER = [
  'CRM & sales', 'Voice of customer', 'Email & SMS', 'Store & revenue',
  'Paid channels', 'Analytics & attribution', 'Site & product analytics',
  'Audience & social research', 'Briefing & project management',
  'Bring your creative assets', 'Workspace & data sources',
  'Use Runneth where you work', 'Custom', 'Other',
];

function matchNetwork(subs) {
  for (const s of subs) {
    const t = s.toLowerCase();
    const matchingHosts = hosts.filter((h) => h.includes(t));
    const matchingRequests = (cap.requests || []).filter((request) =>
      String(request.url || '').toLowerCase().includes(t),
    );
    if (matchingHosts.length || matchingRequests.length) {
      matchingHosts.forEach((host) => matchedNetworkHosts.add(host));
      matchingRequests.forEach((request) => {
        const host = String(request.host || '').toLowerCase();
        if (host) matchedNetworkHosts.add(host);
      });
      return `network:${s}`;
    }
  }
  return null;
}
function matchHtml(res) {
  for (const r of res) {
    try { if (new RegExp(r, 'i').test(html)) return `html:${r}`; } catch { if (html.includes(r.toLowerCase())) return `html:${r}`; }
  }
  return null;
}
function matchGlobal(names) {
  for (const n of names) if (winKeys.has(n)) return `js:window.${n}`;
  return null;
}
function matchCookie(subs) {
  for (const s of subs) { const t = s.toLowerCase(); if (cookieNames.some((c) => c.includes(t))) return `cookie:${s}`; }
  return null;
}
function matchMeta(subs) {
  for (const s of subs) if (meta.includes(s.toLowerCase())) return `meta:${s}`;
  return null;
}
function matchHeader(obj) {
  for (const [k, needle] of Object.entries(obj)) {
    const val = headers[k.toLowerCase()];
    if (val && (val.includes(needle.toLowerCase()) || (() => { try { return new RegExp(needle, 'i').test(val); } catch { return false; } })())) {
      return `header:${k}`;
    }
  }
  return null;
}

const detected = [];
for (const sig of signatures) {
  const evidence = [];
  if (sig.network) { const m = matchNetwork(sig.network); if (m) evidence.push(m); }
  if (sig.global) { const m = matchGlobal(sig.global); if (m) evidence.push(m); }
  if (sig.header) { const m = matchHeader(sig.header); if (m) evidence.push(m); }
  if (sig.cookie) { const m = matchCookie(sig.cookie); if (m) evidence.push(m); }
  if (sig.meta) { const m = matchMeta(sig.meta); if (m) evidence.push(m); }
  if (sig.html) { const m = matchHtml(sig.html); if (m) evidence.push(m); }
  if (evidence.length) {
    // html-only evidence is weaker than a network/js/header/cookie signal.
    const strong = evidence.some((e) => !e.startsWith('html:'));
    detected.push({ name: sig.name, category: sig.category, confidence: strong ? 'high' : 'medium', evidence });
  }
}

// In customer mode, remap categories to Runneth's taxonomy and rename ad tags.
const remapped = customer
  ? detected.map((d) => ({
      ...d,
      name: AD_RENAME[d.name] || d.name,
      category: CATEGORY_MAP[d.category] || 'Other',
    }))
  : detected;
const motionAdPlatforms = customer
  ? remapped.filter((d) => d.name === 'Meta ads' || d.name === 'TikTok ads')
  : [];
const view = customer
  ? remapped.filter((d) => d.name !== 'Meta ads' && d.name !== 'TikTok ads')
  : remapped;

const byCat = {};
for (const d of view) (byCat[d.category] ||= []).push(d);

const catOrder = customer
  ? Object.keys(byCat).sort((a, b) => {
      const ia = CANON_ORDER.indexOf(a); const ib = CANON_ORDER.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    })
  : Object.keys(byCat).sort();

// Hosts that a signature matched are never also reported as unmatched, in
// either output mode.
const base = (() => { try { return new URL(cap.finalUrl || cap.inputUrl).host.replace(/^www\./, ''); } catch { return ''; } })();
const unmatched = hosts.filter((h) => {
  if (!base || h.endsWith(base) || h.includes(base.split('.')[0])) return false;
  if (matchedNetworkHosts.has(h)) return false;
  return true;
});

const payload = {
  target: cap.finalUrl || cap.inputUrl,
  status: cap.status,
  scannedAt: cap.scannedAt,
  mode: customer ? 'customer' : 'default',
  totalDetected: view.length,
  categories: catOrder.length,
  detected: view,
  byCategory: byCat,
  ...(customer ? { motionAdPlatforms: motionAdPlatforms.map((d) => d.name) } : {}),
  unmatchedThirdPartyHosts: unmatched,
};

if (asJson) { console.log(JSON.stringify(payload, null, 2)); process.exit(0); }

const lines = [];
lines.push(`# Tech stack — ${payload.target}`);
lines.push(`_${payload.totalDetected} technologies across ${payload.categories} categories · HTTP ${payload.status ?? 'n/a'} · scanned ${cap.scannedAt}_`);
lines.push('');
for (const cat of catOrder) {
  lines.push(`## ${cat}`);
  for (const d of byCat[cat]) {
    const flag = d.confidence === 'high' ? '' : ' _(likely)_';
    lines.push(customer
      ? `- **${d.name}**${flag}`
      : `- **${d.name}**${flag}  \`${d.evidence.join(', ')}\``);
  }
  lines.push('');
}
if (customer && payload.motionAdPlatforms.length) {
  lines.push('## Ad platforms available through Motion');
  lines.push(payload.motionAdPlatforms.map((name) => `- **${name}**`).join('\n'));
  lines.push('');
}
if (payload.unmatchedThirdPartyHosts.length) {
  lines.push('## Other third-party hosts (no signature match)');
  lines.push(payload.unmatchedThirdPartyHosts.map((h) => `\`${h}\``).join(' '));
}
console.log(lines.join('\n'));
