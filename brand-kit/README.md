# brand-kit

Runneth builds a complete brand kit for any client: identity, visual system, voice, application patterns, and anti-patterns. Dense enough that another agent can produce on-brand work without ever seeing the original brand.

After the first kit is built, Runneth automatically appends a standing instruction to `/agent/user.md` so every future branded output (HTML pages, decks, ads, emails, briefs, dashboards) auto-consults the brand-kit library. Brand kits become an active primitive, not a static reference.

Pairs with `landing-page-summary` (upstream) and `optimize-landing-page` (parallel).

Install time: ~30 seconds. First run will auto-install Playwright + Chromium if not already present (~90 seconds, one time per sandbox).

Requires: nothing pre-installed. Skill bootstraps Playwright on first use. Works strongest when `landing-page-summary` is also installed in the same sandbox.

## What gets installed

| File | Destination | Behavior |
| --- | --- | --- |
| `SKILL.md` | `/agent/.agents/skills/brand-kit/SKILL.md` | Overwrite (skill upgrade) |
| `reference-example.md` | `/agent/.agents/skills/brand-kit/reference-example.md` | Overwrite |
| `seed/_index.md` | `/agent/brain/brand-kit/_index.md` | Skipped if file exists |
| INDEX.md routing entry for the saved-kits library | `/agent/INDEX.md` | Appended if not present |
| user.md usage snippet | `/agent/user.md` | Appended by the skill **after the first kit is built**, guarded by a sentinel comment so it cannot be added twice |

The skill itself is auto-discovered via Runneth's available-skills mechanism, so no `/agent/.agents/skills/...` entry is added to `/agent/INDEX.md` (per Runneth's index rules). Only the durable library at `/agent/brain/brand-kit/` is indexed.

The skill itself creates `/agent/brain/brand-kit/` and `/agent/brain/brand-kit/_history/` on first run.

## Install in a fresh sandbox

```bash
# 1. Install the skill so Runneth auto-discovers it
mkdir -p /agent/.agents/skills/brand-kit
cp SKILL.md /agent/.agents/skills/brand-kit/SKILL.md
cp reference-example.md /agent/.agents/skills/brand-kit/reference-example.md

# 2. Seed the local index (skipped if already present)
mkdir -p /agent/brain/brand-kit
[ -f /agent/brain/brand-kit/_index.md ] || cp seed/_index.md /agent/brain/brand-kit/_index.md

# 3. Add the global INDEX.md routing entry (skipped if already present)
grep -q "^- path: /agent/brain/brand-kit/ " /agent/INDEX.md 2>/dev/null || echo "- path: /agent/brain/brand-kit/ | aliases: brand kits, saved brand kits, brand library, brand guides, brand systems | note: Brand kit library produced by the brand-kit skill. One markdown source of truth per brand at <slug>--brand-kit.md (current version). Per-brand changelog under _history/<slug>/<archived-ts>.md. Local routing index at _index.md. HTML deliverables in ./artifacts/<slug>--brand-kit.html. After first build, the saved-preferences file carries a sentinel-guarded usage instruction so future branded outputs auto-consult this library. | created: {{INSTALL_DATE}} | updated: {{INSTALL_DATE}}" >> /agent/INDEX.md
```

Note: the `brand-kit` skill itself is auto-discovered by Runneth via the system prompt's available-skills mechanism, so no INDEX entry is added for the SKILL.md file. Only the saved-kits library is indexed.

```bash
# (end of install commands)
```

Replace `{{INSTALL_DATE}}` with today's date if you want exact provenance.

On first run, the skill auto-installs Playwright and Chromium. No manual setup.

## How it works

The skill is auto-discovered by Runneth via the `<available_skills>` block in the system prompt. When the user asks to build a brand kit, Runneth opens `SKILL.md` and follows it.

Three input modes:

1. **From a URL** (most common). Skill invokes `landing-page-summary` fresh for the target URL(s), then runs computed-DOM extraction via Playwright for accurate visual system values.
2. **From files**. Skill reads existing brand docs, style guides, or prior brand-kit outputs.
3. **From scratch**. Skill asks for seed inputs in one conversational batch.

The single most important rule: **computed DOM styles, not raw stylesheet variables**. Webflow, Framer, and similar frameworks declare every token in their stylesheets including unused template defaults. Raw stylesheet extraction gives wrong colors and fonts. This skill verifies every visual value against the live DOM and against screenshots.

Outputs:

- **Markdown source of truth** at `/agent/brain/brand-kit/<slug>--brand-kit.md`. Read by other skills (optimize-landing-page, future ad-builders) and by the user.md usage instruction.
- **Brand-styled HTML** at `./artifacts/<slug>--brand-kit.html`. The primary shareable artifact. Styled in the brand's own visual system so anyone opening it can immediately feel whether inferences are correct. Screenshots embedded as base64 alongside every inferred value.

## Active-primitive behavior (the user.md snippet)

After the first successful brand-kit build, the skill appends this block to `/agent/user.md`:

```markdown
<!-- runneth-apps:brand-kit:usage v1 -->
## Brand kit usage

When generating any branded output (HTML pages, landing pages, decks, social posts, emails, ad concepts, briefs, one-pagers, dashboards, internal docs styled for a client), first check `/agent/brain/brand-kit/_index.md` for an applicable brand kit. If one exists for the target brand, read the markdown source and apply:

- Visual system: colors (computed-DOM values only), typography, components, border radius, spacing rhythm
- Voice: register, sentence length, signature words, headline patterns
- Anti-patterns: words and visual choices to avoid

Brand kit selection:
1. Use the brand explicitly named in the request.
2. If none named, use the default workspace's brand.
3. If still ambiguous, ask once before generating.

If no brand kit exists for the target brand and the output is brand-sensitive, mention the gap once and offer to build one via the `brand-kit` skill. Do not invent brand guidelines.

The brand kit overrides generic design-system defaults for that brand's outputs. Motion's HTML design system is the fallback when no brand kit applies.
<!-- /runneth-apps:brand-kit:usage v1 -->
```

The sentinel comments make the append idempotent. Subsequent brand-kit builds (same brand or different brand) check for the sentinel and skip the append. Adding a new brand kit shows up automatically in `/agent/brain/brand-kit/_index.md`, which the user.md instruction reads on every future turn.

To uninstall the behavior, remove the entire block from sentinel to sentinel from `/agent/user.md`.

## File layout after install + first build

```
/agent/.agents/skills/brand-kit/
├── SKILL.md
└── reference-example.md
/agent/brain/brand-kit/
├── _index.md
├── <slug>--brand-kit.md                         ← current markdown source of truth
└── _history/
    └── <slug>/
        └── 2026-05-13T14-22-08-04-00.md         ← prior versions on re-build
./artifacts/<slug>--brand-kit.html               ← brand-styled HTML deliverable
/agent/user.md                                   ← contains the v1 usage sentinel block
```

## Freshness contract (inherited from landing-page-summary)

This skill never reads a saved landing page summary directly. It always invokes `landing-page-summary` fresh in the same conversation. Stale summaries silently corrupt brand inference (especially color and voice), so the freshness gate is enforced upstream.

On re-build of an existing brand kit, the prior markdown is archived to `_history/<slug>/<archived-iso>.md` before overwrite. The per-brand history folder is the brand-kit changelog.

## Fallbacks

- **landing-page-summary not installed:** brand-kit falls back to WebFetch + computed DOM extraction. Quality is degraded (no nav hover, no exit-intent). Skill notes this in Gaps and recommends installing landing-page-summary.
- **Playwright install fails:** skill falls back to summary-only mode. Color and font values are downgraded to "low confidence" and the kit is flagged as needing visual verification.
- **Login-walled brand site:** skill asks for screenshots or credentials before continuing.

## Version history

See `install-config.json` changelog.
