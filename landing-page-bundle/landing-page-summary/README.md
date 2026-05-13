# landing-page-summary

Runneth visits any landing page with a real headless browser, then produces a recreation-quality spec of it. Every section, every CTA, every form field, the visual system, the voice. Output is a durable markdown file at a stable path that downstream skills (brand-kit, optimize-landing-page) can read.

This is the upstream skill for the landing-page bundle. brand-kit and optimize-landing-page both call this one when they need page context.

Install time: ~30 seconds. First skill run will auto-install Playwright + Chromium (~90 seconds, one time per sandbox).

Requires: nothing pre-installed. Skill bootstraps Playwright on first use.

## What gets installed

| File | Destination | Behavior |
| --- | --- | --- |
| `SKILL.md` | `/agent/.agents/skills/landing-page-summary/SKILL.md` | Overwrite (skill upgrade) |
| `seed/_index.md` | `/agent/brain/landing-pages/_index.md` | Skipped if file exists |
| INDEX.md routing entry for the saved-summaries library | `/agent/INDEX.md` | Appended if not present |

The skill itself is auto-discovered via Runneth's available-skills mechanism, so no `/agent/.agents/skills/...` entry is added to `/agent/INDEX.md` (per Runneth's index rules). Only the durable library at `/agent/brain/landing-pages/` is indexed.

The skill creates `/agent/brain/landing-pages/` and `/agent/brain/landing-pages/_history/` on first run.

## Install in a fresh sandbox

Run these exact commands from the unzipped `landing-page-summary/` folder:

```bash
# 1. Install the skill so Runneth auto-discovers it
mkdir -p /agent/.agents/skills/landing-page-summary
cp SKILL.md /agent/.agents/skills/landing-page-summary/SKILL.md

# 2. Seed the local index (skipped if already present)
mkdir -p /agent/brain/landing-pages
[ -f /agent/brain/landing-pages/_index.md ] || cp seed/_index.md /agent/brain/landing-pages/_index.md

# 3. Add the global INDEX.md routing entry (skipped if already present)
grep -q "^- path: /agent/brain/landing-pages/ " /agent/INDEX.md 2>/dev/null || echo "- path: /agent/brain/landing-pages/ | aliases: landing pages, saved landing pages, lp library, page summaries, landing page summaries | note: Landing page summary library produced by the landing-page-summary skill. One markdown file per page at <slug>--<domain>.md (current version, overwritten on re-fetch). Per-page changelog under _history/<slug>--<domain>/<fetched-ts>.md. Local routing index at _index.md. Used as evidence layer by brand-kit and optimize-landing-page. | created: {{INSTALL_DATE}} | updated: {{INSTALL_DATE}}" >> /agent/INDEX.md
```

Note: the `landing-page-summary` skill itself is auto-discovered by Runneth via the system prompt's available-skills mechanism, so no INDEX entry is added for the SKILL.md file. Only the saved-summaries library is indexed.

```bash
# (end of install commands)
```

Replace `{{INSTALL_DATE}}` with today's date in your sandbox before pasting if you want exact provenance.

On first run, the skill auto-installs Playwright and Chromium. No manual setup.

## How it works

The skill is auto-discovered by Runneth via the `<available_skills>` block in the system prompt. When the user asks to summarize a landing page, Runneth opens `SKILL.md` and follows it. The skill:

1. Bootstraps Playwright + Chromium on first run.
2. Loads the URL in a real headless browser.
3. Hovers every nav item and screenshots dropdowns (no inference, only observed).
4. Screenshots hero + 25/50/75/100% scroll positions.
5. Intercepts HubSpot form embeds (DOM extraction misses them).
6. Simulates exit-intent if no inline forms are found.
7. Composes a 17-section markdown spec at `/agent/brain/landing-pages/<slug>--<domain>.md`.
8. Archives any prior version of the same page to `_history/<slug>--<domain>/<fetched-ts>.md` so you can see how the page evolved over time.
9. Updates both the local `_index.md` and the global `/agent/INDEX.md`.

## Freshness contract

Stale landing page summaries silently corrupt downstream brand kits and CRO audits. To prevent that:

- **Default behaviour: always re-fetch.** Every invocation produces a fresh summary, even if a saved version exists.
- **Override: `--use-cached`** is the only way to reuse a saved summary. Only used when the user explicitly asks for it.
- **Archive-before-overwrite:** every re-fetch moves the prior summary to `_history/<slug>--<domain>/<fetched-iso>.md` before writing the new one. That folder is the in-system changelog for each page.
- **Downstream consumers (brand-kit, optimize-landing-page):** must call this skill rather than reading saved files directly. That guarantees they never operate on a stale summary.

## Self-maintaining library (weekly routine, self-closing loop)

After the first successful summary in a conversation, the skill offers to install a weekly routine. The routine is a closed loop: it adds, refreshes, prunes, reindexes, flags downstream drift, and reports its own footprint.

The seven phases run in order:

1. **Phase A. Discover and fetch.** Scan Motion creative-insights for ad destination URLs. Probe each existing URL for liveness. Summarize new URLs; re-fetch live ones; mark dead ones for retirement.
2. **Phase B. Material-change diff.** Compare each refreshed summary to the most recent archive. A change is MATERIAL only if it affects hero headline, primary CTA, pricing, form fields, or page intent. Everything else is NOISE.
3. **Phase C. History pruning.** Keep every MATERIAL-flagged archive, the oldest archive (origin), and the 4 most recent regardless. Delete the rest. Bounded by meaningful events, not elapsed time.
4. **Phase D. Retire dead URLs.** Move 404/dead pages and their history to `_retired/`. Stop re-fetching them. Preserve the historical record.
5. **Phase E. Index hygiene.** Sync `_index.md` and `/agent/INDEX.md` with the actual files. Remove stale entries, add missing ones, dedupe.
6. **Phase F. Cross-skill drift flags.** Flag brand kits whose source pages changed (rebuild may be needed). Flag CRO audits whose audited page changed (may be obsolete). Does not auto-trigger rebuilds.
7. **Phase G. Report.** One compact block listing new pages, refreshed pages, material changes, retired pages, hygiene operations, and cross-skill flags.

### Why this design

A routine that only adds and refreshes is a one-way pipe: over a year of weekly fetches you'd accumulate ~52 archives per page, orphan entries in `_index.md`, duplicate `/agent/INDEX.md` rows, silent staleness in brand-kit and CRO data. The phases above make the routine close on itself so the library and the indexes stay coherent without manual cleanup.

### What counts as a MATERIAL change

Only these:

- H1 hero headline text changed
- Primary CTA button text changed
- A pricing tier price number changed
- Visible form field count changed by 1+
- A form was added or removed
- Page intent classification changed (e.g. lead-magnet -> demo)

Microcopy tweaks, link reorders, non-hero image swaps, and timestamp differences are NOISE and are not flagged.

### Sentinel and offer behaviour

The offer is sentinel-guarded by the reminder title `LP library weekly refresh`. The skill asks at most once per conversation. The user can decline; the offer reappears in any new conversation that hasn't already installed the routine.

Default schedule: `weekly Monday 09:00` in the user's saved timezone (`/agent/.runtime/timezone`). The user can change the cadence when accepting the offer.

### Self-containment

The routine body is fully self-contained in the reminder. When the weekly reminder fires, Runneth executes it verbatim without needing to re-read this skill. The body lives inside the skill's Phase 6 instructions and includes every phase, every threshold, every invariant.

### Failure handling

A single failed fetch (timeout, network error) is transient. The routine retires a URL only after 2 consecutive weekly runs both fail, or a definitive 404/410 status. This prevents a flaky run from accidentally retiring an active page.

## File layout after install

```
/agent/.agents/skills/landing-page-summary/SKILL.md
/agent/brain/landing-pages/
├── _index.md
├── <slug>--<domain>.md                          ← current summary
└── _history/
    └── <slug>--<domain>/
        ├── 2026-05-13T14-22-08-04-00.md         ← prior versions, ISO timestamps in filename
        └── ...
```

## Data contract

Downstream skills (brand-kit, optimize-landing-page) depend on stable H2 anchors in the output markdown. See `DATA-CONTRACT.md` in this folder before renaming or reordering sections.

## Slug + domain convention

- `<slug>`: page purpose, lowercase, hyphenated. Examples: `homepage`, `demo-paid`, `pricing`, `hooks-tool`.
- `<domain>`: hostname of the final URL after redirects. Examples: `motionapp.com`, `go.motionapp.com`.
- Filename: `<slug>--<domain>.md`. Filename never carries a timestamp. The `_Fetched:` line inside the file holds the timestamp.

## Fallbacks

- **Playwright install fails:** the skill falls back to WebFetch-only and notes it as a gap. Quality is degraded (no screenshots, no nav hover, no exit-intent simulation, no HubSpot form interception).
- **JS-rendered / login-walled page:** skill notes the gap and asks the user for screenshots or credentials before continuing.
- **Same URL re-fetched in one conversation:** still re-fetches by default. Pass `--use-cached` to override.

## Version history

See `install-config.json` changelog.
