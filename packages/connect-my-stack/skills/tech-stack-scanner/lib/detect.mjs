/**
 * detect.mjs — match a raw browser capture against signatures.json.
 *
 * Usage: node detect.mjs <captureJson> [signaturesJson] [--json]
 * Prints a human-readable report by default; add --json for a machine payload.
 */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const files = args.filter((a) => !a.startsWith('--'));
const capturePath = files[0];
const sigPath = files[1] || path.join(path.dirname(new URL(import.meta.url).pathname), 'signatures.json');

if (!capturePath) { console.error('capture json path required'); process.exit(1); }

const cap = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
const { signatures } = JSON.parse(fs.readFileSync(sigPath, 'utf8'));

const hosts = (cap.requestHosts || []).map((h) => h.toLowerCase());
const reqUrls = (cap.requests || []).map((r) => (r.url || '').toLowerCase());
const html = (cap.html || '').toLowerCase();
const winKeys = new Set(cap.windowKeys || []);
const cookieNames = (cap.cookies || []).map((c) => (c.name || '').toLowerCase());
const meta = (cap.metaGenerator || '').toLowerCase();
const headers = {};
for (const [k, v] of Object.entries(cap.mainHeaders || {})) headers[k.toLowerCase()] = String(v).toLowerCase();
const matchedNetworkHosts = new Set();

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

const byCat = {};
for (const d of detected) (byCat[d.category] ||= []).push(d);
const catOrder = Object.keys(byCat).sort();

const payload = {
  target: cap.finalUrl || cap.inputUrl,
  status: cap.status,
  scannedAt: cap.scannedAt,
  totalDetected: detected.length,
  categories: catOrder.length,
  detected,
  byCategory: byCat,
  unmatchedThirdPartyHosts: hosts.filter((h) => {
    const base = (() => { try { return new URL(cap.finalUrl || cap.inputUrl).host.replace(/^www\./, ''); } catch { return ''; } })();
    return base && !matchedNetworkHosts.has(h) && !h.endsWith(base) && !h.includes(base.split('.')[0]);
  }),
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
    lines.push(`- **${d.name}**${flag}  \`${d.evidence.join(', ')}\``);
  }
  lines.push('');
}
if (payload.unmatchedThirdPartyHosts.length) {
  lines.push('## Other third-party hosts (no signature match)');
  lines.push(payload.unmatchedThirdPartyHosts.map((h) => `\`${h}\``).join(' '));
}
console.log(lines.join('\n'));
