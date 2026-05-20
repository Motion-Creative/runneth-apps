#!/usr/bin/env python3
"""
render-review.py — Render the read-only review HTML for a import-from-ai manifest.

The HTML is structured viewing. Approval happens in chat, not in this file.
Items are numbered globally (1..N), grouped by category, and visually flagged
for conflicts and promotion candidates.

Usage:
    python3 render-review.py \
        --manifest ./workdir/imports/<import-id>/manifest.json \
        --output ./artifacts/import-review-<import-id>.html \
        [--design-system /path/to/design-system.json]
"""

import argparse
import html
import json
import sys
from pathlib import Path


DEFAULT_TOKENS = {
    "primary": "#0F172A",
    "accent": "#3B82F6",
    "muted_bg": "#F8FAFC",
    "card_bg": "#FFFFFF",
    "card_border": "#E2E8F0",
    "text_primary": "#0F172A",
    "text_muted": "#64748B",
    "warn_bg": "#FEF3C7",
    "warn_border": "#FACC15",
    "warn_text": "#92400E",
    "conflict_bg": "#FEE2E2",
    "conflict_border": "#F87171",
    "conflict_text": "#991B1B",
    "behavioral_bg": "#DCFCE7",
    "behavioral_border": "#4ADE80",
    "behavioral_text": "#166534",
    "contextual_bg": "#E0E7FF",
    "contextual_border": "#818CF8",
    "contextual_text": "#3730A3",
    "raise_bg": "#DBEAFE",
    "raise_border": "#60A5FA",
    "raise_text": "#1E40AF",
    "skip_bg": "#F1F5F9",
    "skip_text": "#64748B",
    "font_family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
}


CATEGORY_LABELS = {
    "saved_memory": "Saved memories",
    "custom_instruction": "Custom instructions",
    "project": "Projects",
    "project_knowledge": "Project knowledge",
    "saved_info": "Saved info",
    "gem": "Gems",
    "recurring_preference": "Recurring preferences",
    "voice_pattern": "Voice patterns",
    "key_decision": "Key decisions",
    "working_session": "Working sessions",
    "unknown": "Other",
}


CATEGORY_ORDER = [
    "custom_instruction",
    "saved_memory",
    "saved_info",
    "gem",
    "project",
    "project_knowledge",
    "recurring_preference",
    "voice_pattern",
    "key_decision",
    "working_session",
    "unknown",
]


def load_tokens(design_system_path: str | None) -> dict:
    tokens = dict(DEFAULT_TOKENS)
    if not design_system_path:
        return tokens
    p = Path(design_system_path)
    if not p.exists():
        return tokens
    try:
        ds = json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return tokens
    colors = ds.get("colors") or {}
    fonts = ds.get("fonts") or {}
    if isinstance(colors, dict):
        if colors.get("primary"):
            tokens["primary"] = colors["primary"]
        if colors.get("accent"):
            tokens["accent"] = colors["accent"]
    if isinstance(fonts, dict) and fonts.get("body"):
        tokens["font_family"] = fonts["body"]
    return tokens


BUCKET_DESCRIPTIONS = {
    "behavioral": "Appends to your profile. Loads every session.",
    "contextual": "Lives in imports. Surfaces via INDEX when relevant.",
}


def render_item(item: dict, tokens: dict) -> str:
    number = item.get("number")
    title = html.escape(item.get("title", ""))
    content = html.escape(item.get("content", ""))
    snippet = content if len(content) <= 600 else content[:600] + "&hellip;"
    triage = item.get("triage") or {}
    bucket = triage.get("bucket", "contextual")
    raise_flags = triage.get("raise_flags") or []
    action = triage.get("suggested_action", "import")
    reason = html.escape(triage.get("reason", ""))
    conflict = triage.get("conflict") or {}

    badges = []
    if bucket == "behavioral":
        badges.append(("Behavioral: appends to your profile", "behavioral"))
    elif bucket == "contextual":
        badges.append(("Contextual: imports only", "contextual"))
    if action == "skip":
        badges.append(("Suggested: skip", "skip"))

    if "raise_to_org" in raise_flags:
        badges.append(("Raise candidate: team brain", "raise"))
    if "raise_to_user_md" in raise_flags:
        badges.append(("Raise candidate: standing instructions (admin only)", "raise"))

    if conflict:
        conflict_with = ", ".join(html.escape(p) for p in (conflict.get("conflict_with") or []))
        note = html.escape(conflict.get("note", ""))
        badges.append((f"Conflict: {note} ({conflict_with})", "conflict"))

    badge_html = "".join(
        f'<span class="badge badge-{kind}">{label}</span>'
        for (label, kind) in badges
    )

    source = html.escape(item.get("source", "")) or "&mdash;"
    confidence = html.escape(triage.get("durability_confidence") or item.get("source_confidence", ""))
    return f"""
    <article class="item" id="item-{number}">
      <header class="item-header">
        <span class="item-number">#{number}</span>
        <h3 class="item-title">{title}</h3>
        <span class="item-action">{html.escape(action)}</span>
      </header>
      <div class="item-meta">
        <span class="meta-pill">bucket: {html.escape(bucket)}</span>
        <span class="meta-pill">durability: {confidence or 'n/a'}</span>
        <span class="meta-pill">source: {source}</span>
      </div>
      {f'<div class="item-badges">{badge_html}</div>' if badges else ''}
      <pre class="item-content">{snippet}</pre>
      {f'<p class="item-reason"><strong>Why this call:</strong> {reason}</p>' if reason else ''}
    </article>
    """


def render_html(manifest: dict, tokens: dict) -> str:
    items = manifest.get("items", [])
    grouped: dict[str, list[dict]] = {}
    for item in items:
        cat = item.get("triage", {}).get("suggested_category") or item.get("category", "unknown")
        grouped.setdefault(cat, []).append(item)

    sections_html = []
    for cat in CATEGORY_ORDER:
        bucket = grouped.get(cat) or []
        if not bucket:
            continue
        label = CATEGORY_LABELS.get(cat, cat)
        items_html = "\n".join(render_item(it, tokens) for it in bucket)
        sections_html.append(f"""
        <section class="category" id="cat-{cat}">
          <h2 class="category-title">{html.escape(label)} <span class="category-count">({len(bucket)})</span></h2>
          {items_html}
        </section>
        """)

    stats = manifest.get("stats", {})
    by_cat = stats.get("by_category", {})
    conflicts_count = sum(
        1 for it in items if (it.get("triage") or {}).get("conflict")
    )
    behavioral_count = sum(
        1 for it in items if (it.get("triage") or {}).get("bucket") == "behavioral"
    )
    contextual_count = sum(
        1 for it in items if (it.get("triage") or {}).get("bucket") == "contextual"
    )
    raise_count = sum(
        1 for it in items if (it.get("triage") or {}).get("raise_flags")
    )

    summary_pills = []
    for cat in CATEGORY_ORDER:
        if cat in by_cat:
            summary_pills.append(
                f'<a href="#cat-{cat}" class="summary-pill">{html.escape(CATEGORY_LABELS.get(cat, cat))} &middot; {by_cat[cat]}</a>'
            )

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Context Import Review &middot; {html.escape(manifest.get('import_id', ''))}</title>
<style>
  :root {{
    --primary: {tokens['primary']};
    --accent: {tokens['accent']};
    --muted-bg: {tokens['muted_bg']};
    --card-bg: {tokens['card_bg']};
    --card-border: {tokens['card_border']};
    --text-primary: {tokens['text_primary']};
    --text-muted: {tokens['text_muted']};
    --warn-bg: {tokens['warn_bg']};
    --warn-border: {tokens['warn_border']};
    --warn-text: {tokens['warn_text']};
    --conflict-bg: {tokens['conflict_bg']};
    --conflict-border: {tokens['conflict_border']};
    --conflict-text: {tokens['conflict_text']};
    --behavioral-bg: {tokens['behavioral_bg']};
    --behavioral-border: {tokens['behavioral_border']};
    --behavioral-text: {tokens['behavioral_text']};
    --contextual-bg: {tokens['contextual_bg']};
    --contextual-border: {tokens['contextual_border']};
    --contextual-text: {tokens['contextual_text']};
    --raise-bg: {tokens['raise_bg']};
    --raise-border: {tokens['raise_border']};
    --raise-text: {tokens['raise_text']};
    --skip-bg: {tokens['skip_bg']};
    --skip-text: {tokens['skip_text']};
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    font-family: {tokens['font_family']};
    background: var(--muted-bg);
    color: var(--text-primary);
    line-height: 1.55;
  }}
  .wrap {{ max-width: 920px; margin: 0 auto; padding: 32px 24px 80px; }}
  header.page-header {{
    border-bottom: 1px solid var(--card-border);
    padding-bottom: 20px;
    margin-bottom: 28px;
  }}
  h1 {{ margin: 0 0 6px; font-size: 26px; }}
  .subtitle {{ color: var(--text-muted); font-size: 14px; }}
  .summary-pills {{ margin: 18px 0 4px; display: flex; flex-wrap: wrap; gap: 8px; }}
  .summary-pill {{
    text-decoration: none;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 13px;
    color: var(--text-primary);
  }}
  .summary-pill:hover {{ border-color: var(--accent); }}
  .callout {{
    background: var(--warn-bg);
    border: 1px solid var(--warn-border);
    color: var(--warn-text);
    padding: 14px 16px;
    border-radius: 10px;
    margin: 14px 0 24px;
    font-size: 14px;
  }}
  .category {{ margin-top: 36px; }}
  .category-title {{ font-size: 18px; margin: 0 0 12px; }}
  .category-count {{ color: var(--text-muted); font-weight: 400; font-size: 14px; }}
  .item {{
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: 10px;
    padding: 16px 18px;
    margin-bottom: 12px;
  }}
  .item-header {{ display: flex; align-items: baseline; gap: 12px; }}
  .item-number {{
    color: var(--accent);
    font-weight: 700;
    font-size: 14px;
    min-width: 44px;
  }}
  .item-title {{ margin: 0; font-size: 16px; flex: 1; }}
  .item-action {{
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }}
  .item-meta {{
    margin: 8px 0 6px 56px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }}
  .meta-pill {{
    font-size: 11px;
    color: var(--text-muted);
    background: var(--muted-bg);
    border: 1px solid var(--card-border);
    padding: 2px 8px;
    border-radius: 999px;
  }}
  .item-badges {{ margin: 8px 0 6px 56px; display: flex; flex-wrap: wrap; gap: 6px; }}
  .badge {{
    font-size: 12px;
    padding: 3px 10px;
    border-radius: 999px;
    border: 1px solid transparent;
    font-weight: 500;
  }}
  .badge-conflict {{ background: var(--conflict-bg); border-color: var(--conflict-border); color: var(--conflict-text); }}
  .badge-behavioral {{ background: var(--behavioral-bg); border-color: var(--behavioral-border); color: var(--behavioral-text); }}
  .badge-contextual {{ background: var(--contextual-bg); border-color: var(--contextual-border); color: var(--contextual-text); }}
  .badge-raise {{ background: var(--raise-bg); border-color: var(--raise-border); color: var(--raise-text); }}
  .badge-skip {{ background: var(--skip-bg); color: var(--skip-text); }}
  .item-content {{
    background: var(--muted-bg);
    border: 1px solid var(--card-border);
    border-radius: 8px;
    padding: 12px 14px;
    margin: 10px 0 6px 56px;
    font-size: 13px;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: anywhere;
    color: var(--text-primary);
    font-family: inherit;
  }}
  .item-reason {{
    margin: 6px 0 0 56px;
    font-size: 13px;
    color: var(--text-muted);
  }}
  footer.page-footer {{
    margin-top: 48px;
    padding-top: 18px;
    border-top: 1px solid var(--card-border);
    color: var(--text-muted);
    font-size: 13px;
  }}
</style>
</head>
<body>
  <div class="wrap">
    <header class="page-header">
      <h1>Context Import Review</h1>
      <div class="subtitle">
        {html.escape(manifest.get('source_provider', 'unknown').upper())}
        &middot; {len(items)} items
        &middot; {stats.get('deduped_items', 0)} deduped
        &middot; imported {html.escape(manifest.get('imported_at', ''))}
      </div>
      <div class="summary-pills">{''.join(summary_pills)}</div>
      <div class="callout">
        <strong>{behavioral_count} behavioral</strong> items will append to your profile and load every session.
        <strong>{contextual_count} contextual</strong> items will go to imports and surface via INDEX when relevant.
        <br><br>
        Review is read-only. Approve in chat by number, range, or category.
        Examples: <code>approve 1-15, 22</code> &middot; <code>approve all preferences, skip working sessions</code> &middot;
        <code>approve all but 7</code> &middot; <code>approve all, raise 3 to org</code> &middot;
        <code>approve all, move 12 to behavioral</code>.
        {f'<br><br><strong>{conflicts_count} conflict(s)</strong> flagged below — resolve those explicitly before approving.' if conflicts_count else ''}
        {f'<br><strong>{raise_count} raise candidate(s)</strong> — items that may belong at the team or standing-instruction level. Call them out explicitly in chat.' if raise_count else ''}
      </div>
    </header>
    {''.join(sections_html)}
    <footer class="page-footer">
      Import ID: <code>{html.escape(manifest.get('import_id', ''))}</code> &middot;
      User: <code>{html.escape(manifest.get('user_handle', ''))}</code>
    </footer>
  </div>
</body>
</html>
"""


def main() -> int:
    p = argparse.ArgumentParser(description="Render import-from-ai review HTML.")
    p.add_argument("--manifest", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--design-system", default=None)
    args = p.parse_args()

    manifest_path = Path(args.manifest)
    if not manifest_path.exists():
        print(f"ERROR: manifest not found: {manifest_path}", file=sys.stderr)
        return 2
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    tokens = load_tokens(args.design_system)
    html_text = render_html(manifest, tokens)

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html_text, encoding="utf-8")
    print(json.dumps({"ok": True, "output_path": str(out_path)}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
