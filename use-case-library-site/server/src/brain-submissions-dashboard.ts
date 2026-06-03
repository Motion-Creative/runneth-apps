/**
 * Server-rendered HTML dashboard for brain checklist submissions.
 *
 * Self-contained markup with inline styles and a small client-side script for
 * multi-select + bulk-download. Renders the submissions list passed in, with
 * download links that include the dashboard token so anyone clicking a link
 * stays authenticated.
 *
 * Auth: dashboard routes are gated by BRAIN_DASHBOARD_TOKEN. The page reads it
 * from the request and propagates it into every download link.
 */
import type { StoredSubmission } from './brain-submissions-db.js'

// Per-section recommendation for where each uploaded section should land in
// the customer's brain. Mirrors the Slack-side helper so the dashboard always
// shows the same routing guidance the team uses for triage. When sections
// change, update this map alongside brain-checklist-slack.ts.
const BRAIN_STRUCTURE_BY_KEY: Record<string, string> = {
  brand_context: '`/agent/workspaces/<workspaceId>/config/brand-context/brand_context.json` for canonical brand setup. Reference docs (the original PDF, brand book, voice guide) → `/agent/brain/brand-context/<name>.<ext>` with an `/agent/INDEX.md` entry tagged `brand-context, voice, positioning`.',
  competitor_research: '`/agent/brain/competitors/<competitor-slug>/` per competitor with original files, screenshots, and a short distilled note at `/agent/brain/competitors/_swipe-summary.md` covering category whitespace, recurring hooks, recurring formats, what to avoid. Cross-link both in `/agent/INDEX.md`.',
  personas: '`/agent/brain/personas/<persona-name>.md` per persona, with frontmatter capturing the persona name, primary pain, awareness stage, channels, anti-persona notes. Index entry tagged `persona, ICP, target audience`.',
  product_catalog: '`/agent/brain/product-catalog/<source>.<ext>` for the raw catalog and `/agent/brain/product-catalog/_facts.md` for the distilled facts Runneth should never invent or break (SKU list, claims, restrictions). Index entry tagged `product, claims, SKU`.',
  connected_systems: 'Free-text only. Capture the list in `/agent/brain/customers/<slug>/summary.md` under a `### Systems and integrations` section. For each system note what lives there (briefs, reviews, assets, project tracking). For first-class Runneth integrations or Pipedream-connected apps, open a follow-up to walk the customer through `oauth-connect` on their first session.',
  winning_briefs: '`/agent/brain/templates/brief-<concept-name>.md` per brief saved as `kind=template-example` in `/agent/INDEX.md` with a short note on why it worked. Helps Runneth pattern-match for similar future asks.',
  other: 'Route by content type. Competitor research → `/agent/brain/competitors/`. Landing page audits → `/agent/brain/landing-pages/`. Channel strategy → `/agent/brain/paid-strategy/<channel>/<workspace-slug>/`. Call notes → `/agent/brain/meetings/`. Templates → `/agent/brain/templates/` as `kind=template-source`.',
}

// Render the recommendation with simple inline code support. The text uses
// backticks for path/keyword highlights; convert them to <code> spans.
const renderRecHtml = (text: string): string => {
  const escaped = esc(text)
  let out = ''
  let inCode = false
  for (const ch of escaped) {
    if (ch === '`') {
      out += inCode ? '</code>' : '<code>'
      inCode = !inCode
    } else {
      out += ch
    }
  }
  if (inCode) out += '</code>'
  return out
}

const fmtBytes = (n: number): string => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

const fmtDateTime = (iso: string): string => {
  // Render as 2026-06-02 18:42 UTC. Keep it deterministic and readable.
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
  if (isNaN(d.getTime())) return iso
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  })

const SECTION_LABELS: Record<string, string> = {
  brand_context: 'Brand context',
  customer_reviews: 'Customer reviews and VOC',
  competitor_research: 'Competitor research and swipe files',
  personas: 'Persona and ICP',
  product_catalog: 'Product catalog',
  winning_briefs: 'Past winning briefs',
  connected_systems: 'Other systems',
  other: 'Anything else',
}

const CSM_DISPLAY_NAME: Record<string, string> = {
  ale: 'Ale',
  aoife: 'Aoife',
  carissa: 'Carissa',
  josh: 'Josh',
  krishna: 'Krishna',
  quinn: 'Quinn',
  rabia: 'Rabia',
  sophia: 'Sophia',
  unassigned: 'Unassigned',
}

export type DashboardInput = {
  submissions: StoredSubmission[]
  counts: Record<string, number>
  activeCsm: string
  roster: readonly string[]
  token: string
}

export const renderDashboard = (input: DashboardInput): string => {
  const { submissions, counts, activeCsm, roster, token } = input
  const totalFiles = submissions.reduce((acc, s) => acc + s.file_count, 0)
  const totalBytes = submissions.reduce((acc, s) => acc + s.total_bytes, 0)
  const grandTotal = Object.values(counts).reduce((a, b) => a + b, 0)

  const tabHref = (csm: string): string => {
    const params = new URLSearchParams({ token })
    if (csm !== 'all') params.set('csm', csm)
    return `/brain-submissions?${params.toString()}`
  }

  const tabs = [
    { key: 'all', label: 'All', count: grandTotal },
    ...roster.map((c) => ({ key: c, label: CSM_DISPLAY_NAME[c] || c, count: counts[c] || 0 })),
    { key: 'unassigned', label: 'Unassigned', count: counts['unassigned'] || 0 },
  ]

  const tabsHtml = tabs.map((t) => {
    const isActive = t.key === activeCsm
    const cls = 'csm-tab' + (isActive ? ' active' : '')
    return `<a class="${cls}" href="${tabHref(t.key)}">${esc(t.label)}<span class="count">${t.count}</span></a>`
  }).join('')

  const subRows = submissions
    .map((s) => {
      const sectionBlocks = s.sections
        .filter((sec) => sec.context || sec.files.length > 0)
        .map((sec) => {
          const fileList =
            sec.files.length > 0
              ? sec.files.map((f) => `<span class="file-chip">${esc(f.filename)} <span class="muted">(${fmtBytes(f.sizeBytes)})</span></span>`).join(' ')
              : '<span class="muted">(no files)</span>'
          const ctx = sec.context ? `<div class="ctx">${esc(sec.context)}</div>` : '<div class="ctx muted">(no context)</div>'
          const rec = BRAIN_STRUCTURE_BY_KEY[sec.key]
          const recBlock = rec
            ? `<div class="rec"><div class="rec-label">Recommended brain home</div><div class="rec-body">${renderRecHtml(rec)}</div></div>`
            : ''
          return `
            <div class="section">
              <div class="section-head">${esc(SECTION_LABELS[sec.key] || sec.key)}</div>
              <div class="section-files">${fileList}</div>
              ${ctx}
              ${recBlock}
            </div>`
        })
        .join('')

      // Per-file rows for the table (multi-select)
      const fileRows = s.sections
        .flatMap((sec) =>
          sec.files.map((f, i) => ({ section: sec.key, file: f, idx: i })),
        )
        .filter((x) => x.file)
      // We don't have file IDs here on the per-section list (sections come from JSON), so use the inline files from the live DB row
      // Instead expose a single hidden input with the submission id and let the client fetch the per-submission file list.

      return `
        <article class="submission">
          <header class="submission-head">
            <div>
              <h3>${esc(s.workspace_name)}</h3>
              <div class="muted small">${esc(s.contact_email)} · ${fmtDateTime(s.created_at)} · ${s.file_count} file${s.file_count === 1 ? '' : 's'} · ${fmtBytes(s.total_bytes)}</div>
            </div>
            <div>
              <a class="btn btn-secondary" href="/api/brain-submissions/${s.id}/zip?token=${encodeURIComponent(token)}">Download all (.zip)</a>
            </div>
          </header>
          <div class="sections">${sectionBlocks || '<div class="muted">(no content)</div>'}</div>
          <details class="files-detail">
            <summary>Files (${s.file_count})</summary>
            <div class="files-table" data-submission-id="${s.id}" data-token="${esc(token)}">
              <div class="files-loading muted">Loading file list…</div>
            </div>
          </details>
        </article>`
    })
    .join('')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Brain submissions</title>
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--gray-0:#fff;--gray-2:#f8f8f8;--gray-3:#f3f3f3;--gray-5:#e8e8e8;--gray-6:#e2e2e2;--gray-9:#8f8f8f;--gray-11:#6f6f6f;--gray-12:#171717;--green:#c1f14b;--green-soft:#eafad1;--green-text:#627d20}
  body{font-family:"Inter",sans-serif;font-size:14px;line-height:1.55;color:var(--gray-12);background:var(--gray-2);-webkit-font-smoothing:antialiased}
  .top{background:var(--gray-12);color:#fff;padding:28px 32px}
  .top-inner{max-width:1080px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
  .top h1{font-size:22px;font-weight:600;letter-spacing:-0.017em;margin-bottom:4px}
  .top .sub{color:rgba(255,255,255,0.6);font-size:13px}
  .top .stats{display:flex;gap:12px;flex-wrap:wrap}
  .stat{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:8px 14px;color:#fff;font-size:13px}
  .stat strong{font-weight:600;color:var(--green)}
  .container{max-width:1080px;margin:0 auto;padding:32px}
  .toolbar{position:sticky;top:0;background:var(--gray-2);padding:14px 0;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;z-index:5;border-bottom:1px solid var(--gray-5)}
  .selection-summary{font-size:13px;color:var(--gray-11)}
  .selection-summary strong{color:var(--gray-12)}
  .btn{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 14px;border:none;border-radius:8px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;text-decoration:none;transition:background 0.15s,opacity 0.15s}
  .btn-primary{background:var(--green);color:var(--gray-12)}
  .btn-primary:hover{background:#b7e73a}
  .btn-primary:disabled{opacity:0.4;cursor:not-allowed}
  .btn-secondary{background:white;border:1px solid var(--gray-6);color:var(--gray-12)}
  .btn-secondary:hover{background:var(--gray-3)}
  .csm-tabs{background:white;border-bottom:1px solid var(--gray-6);padding:0 32px;display:flex;gap:2px;overflow-x:auto;-webkit-overflow-scrolling:touch}
  .csm-tab{display:inline-flex;align-items:center;gap:8px;padding:14px 16px;font-size:13px;font-weight:500;color:var(--gray-11);text-decoration:none;border-bottom:2px solid transparent;white-space:nowrap;transition:color 0.15s,border-color 0.15s}
  .csm-tab:hover{color:var(--gray-12)}
  .csm-tab.active{color:var(--gray-12);font-weight:600;border-bottom-color:var(--gray-12)}
  .csm-tab .count{background:var(--gray-3);color:var(--gray-11);font-size:11px;font-weight:500;padding:1px 7px;border-radius:100px;min-width:18px;text-align:center}
  .csm-tab.active .count{background:var(--green-soft);color:var(--green-text);font-weight:600}
  .submission{background:white;border:1px solid var(--gray-6);border-radius:14px;padding:24px 28px;margin-bottom:14px}
  .submission-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}
  .submission-head h3{font-size:17px;font-weight:600;letter-spacing:-0.013em;margin-bottom:4px}
  .muted{color:var(--gray-11)}
  .small{font-size:12px}
  .sections{display:flex;flex-direction:column;gap:14px}
  .section{background:var(--gray-2);border:1px solid var(--gray-5);border-radius:10px;padding:14px 16px}
  .section-head{font-size:13px;font-weight:600;color:var(--gray-12);margin-bottom:8px}
  .section-files{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
  .file-chip{display:inline-flex;align-items:center;gap:6px;background:white;border:1px solid var(--gray-6);border-radius:6px;padding:3px 8px;font-size:12px;color:var(--gray-12)}
  .ctx{font-size:13px;color:var(--gray-12);line-height:1.5;background:white;border:1px solid var(--gray-6);border-radius:6px;padding:10px 12px;white-space:pre-wrap}
  .rec{margin-top:10px;background:var(--green-soft);border:1px solid rgba(193,241,75,0.5);border-radius:6px;padding:10px 12px}
  .rec-label{font-size:11px;font-weight:600;color:var(--green-text);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px}
  .rec-body{font-size:13px;color:var(--gray-12);line-height:1.55;word-break:break-word}
  .rec-body code{background:white;border:1px solid rgba(193,241,75,0.45);border-radius:4px;padding:1px 5px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}
  details.files-detail{margin-top:16px;border-top:1px solid var(--gray-5);padding-top:12px}
  details.files-detail summary{font-size:13px;font-weight:500;cursor:pointer;color:var(--gray-12);user-select:none}
  details.files-detail summary:hover{color:var(--gray-9)}
  .files-table{margin-top:10px;display:flex;flex-direction:column;gap:6px}
  .files-loading{padding:8px 0;font-size:12px}
  .file-row{display:grid;grid-template-columns:24px 1fr auto auto;gap:12px;align-items:center;padding:8px 12px;background:var(--gray-2);border:1px solid var(--gray-5);border-radius:8px;font-size:13px}
  .file-row input[type=checkbox]{width:16px;height:16px;cursor:pointer;accent-color:var(--gray-12)}
  .file-row .name{font-weight:500;color:var(--gray-12);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .file-row .name .pill{display:inline-block;background:var(--green-soft);color:var(--green-text);font-size:11px;font-weight:500;padding:1px 8px;border-radius:100px;margin-right:6px}
  .file-row .size{font-size:12px;color:var(--gray-11)}
  .file-row a{font-size:12px;color:var(--gray-12);text-decoration:none;background:white;border:1px solid var(--gray-6);border-radius:6px;padding:4px 8px;transition:background 0.15s}
  .file-row a:hover{background:var(--gray-3)}
  .empty{background:white;border:1px dashed var(--gray-6);border-radius:14px;padding:48px 24px;text-align:center;color:var(--gray-11)}
  .empty strong{display:block;font-size:16px;font-weight:600;color:var(--gray-12);margin-bottom:6px}
</style>
</head>
<body>
  <header class="top">
    <div class="top-inner">
      <div>
        <h1>Brain submissions</h1>
        <div class="sub">From the customer-facing brain checklist at <a href="/how-to-build-the-brain" style="color:var(--green);text-decoration:none">/how-to-build-the-brain</a></div>
      </div>
      <div class="stats">
        <div class="stat"><strong>${submissions.length}</strong> submission${submissions.length === 1 ? '' : 's'}${activeCsm !== 'all' ? ' from ' + esc(CSM_DISPLAY_NAME[activeCsm] || activeCsm) : ''}</div>
        <div class="stat"><strong>${totalFiles}</strong> file${totalFiles === 1 ? '' : 's'}</div>
        <div class="stat"><strong>${fmtBytes(totalBytes)}</strong> total</div>
      </div>
    </div>
  </header>

  <nav class="csm-tabs">${tabsHtml}</nav>

  <div class="container">
    <div class="toolbar">
      <div class="selection-summary"><strong id="sel-count">0</strong> file<span id="sel-plural">s</span> selected</div>
      <div>
        <button class="btn btn-secondary" id="select-all">Select all</button>
        <button class="btn btn-secondary" id="select-none">Clear</button>
        <button class="btn btn-primary" id="download-selected" disabled>Download selected (.zip)</button>
      </div>
    </div>

    ${submissions.length === 0
      ? '<div class="empty"><strong>No submissions yet.</strong>When customers send their first checklist, it lands here.</div>'
      : subRows}
  </div>

  <form id="bulk-form" method="POST" action="/api/brain-submissions/zip-form" style="display:none">
    <input type="hidden" name="token" value="${esc(token)}" />
    <input type="hidden" name="file_ids" id="bulk-file-ids" />
  </form>

  <script>
    const TOKEN = ${JSON.stringify(token)};
    const selected = new Set();

    function updateSelection() {
      const n = selected.size;
      document.getElementById('sel-count').textContent = String(n);
      document.getElementById('sel-plural').textContent = n === 1 ? '' : 's';
      document.getElementById('download-selected').disabled = n === 0;
    }

    async function loadFiles(container) {
      const subId = container.getAttribute('data-submission-id');
      try {
        const resp = await fetch('/api/brain-submissions/' + subId + '/files?token=' + encodeURIComponent(TOKEN));
        if (!resp.ok) {
          container.innerHTML = '<div class="muted small">Could not load file list (' + resp.status + ').</div>';
          return;
        }
        const data = await resp.json();
        const files = data.files || [];
        if (files.length === 0) {
          container.innerHTML = '<div class="muted small">No files.</div>';
          return;
        }
        container.innerHTML = files.map(function (f) {
          const url = '/api/brain-submissions/' + subId + '/files/' + f.id + '/download?token=' + encodeURIComponent(TOKEN);
          const sectionLabel = (${JSON.stringify(SECTION_LABELS)})[f.section_key] || f.section_key;
          return '<div class="file-row" data-file-id="' + f.id + '">' +
            '<input type="checkbox" class="file-cb" data-file-id="' + f.id + '" />' +
            '<div class="name"><span class="pill">' + escapeHtml(sectionLabel) + '</span>' + escapeHtml(f.filename) + '</div>' +
            '<div class="size">' + fmtBytes(f.size_bytes) + '</div>' +
            '<a href="' + url + '" download>Download</a>' +
            '</div>';
        }).join('');
        container.querySelectorAll('.file-cb').forEach(function (cb) {
          cb.addEventListener('change', function () {
            const id = Number(cb.getAttribute('data-file-id'));
            if (cb.checked) selected.add(id); else selected.delete(id);
            updateSelection();
          });
        });
      } catch (err) {
        container.innerHTML = '<div class="muted small">Could not load file list.</div>';
      }
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
      });
    }

    function fmtBytes(n) {
      if (n < 1024) return n + ' B';
      if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
      return (n / 1024 / 1024).toFixed(1) + ' MB';
    }

    // Lazy-load file lists when details opens
    document.querySelectorAll('.files-detail').forEach(function (d) {
      const container = d.querySelector('.files-table');
      let loaded = false;
      d.addEventListener('toggle', function () {
        if (d.open && !loaded) { loaded = true; loadFiles(container); }
      });
    });

    document.getElementById('select-all').addEventListener('click', async function () {
      // Make sure all details are open + loaded, then check all
      const allDetails = Array.from(document.querySelectorAll('.files-detail'));
      for (const d of allDetails) {
        if (!d.open) { d.open = true; }
        const c = d.querySelector('.files-table');
        if (c && !c.dataset.loaded) {
          await loadFiles(c);
          c.dataset.loaded = '1';
        }
      }
      document.querySelectorAll('.file-cb').forEach(function (cb) {
        cb.checked = true;
        selected.add(Number(cb.getAttribute('data-file-id')));
      });
      updateSelection();
    });

    document.getElementById('select-none').addEventListener('click', function () {
      document.querySelectorAll('.file-cb').forEach(function (cb) { cb.checked = false; });
      selected.clear();
      updateSelection();
    });

    document.getElementById('download-selected').addEventListener('click', function () {
      if (selected.size === 0) return;
      const ids = Array.from(selected).join(',');
      document.getElementById('bulk-file-ids').value = ids;
      document.getElementById('bulk-form').submit();
    });
  </script>
</body>
</html>`
}
