# brand-audit

The brand-level strategic foundation. Six skills run in order to produce a durable per-workspace bundle. Every downstream creative-strategy use case reads this bundle as upstream context — it does not get re-derived on every creative review.

On-demand only: the first run asks two or three intake questions inline in chat (brand site, review sources, competitors); re-run any time to refresh — the prior bundle is archived and a short diff lands in chat. No scheduled routine, no Slack posts, no config files.

Pairs with `paid-strategy-audit` (parallel, channel-specific) and `creative-deep-dive` / `weekly-performance-deck` (downstream consumers).

Install time: ~30s install + 2 minutes first audit per workspace. Refresh: ~30-60 seconds.

Requires: a brand website URL. Review sources and competitor list are optional but strongly recommended.

## What gets installed

| File | Destination | Behavior |
| --- | --- | --- |
| `SKILL.md` | `/agent/.agents/skills/brand-audit/SKILL.md` | Overwrite |
| `skills/brand-intake.md` | `/agent/.agents/skills/brand-intake/SKILL.md` | Overwrite |
| `skills/product-catalog.md` | `/agent/.agents/skills/product-catalog/SKILL.md` | Overwrite |
| `skills/review-audit.md` | `/agent/.agents/skills/review-audit/SKILL.md` | Overwrite |
| `skills/brand-relevant-keywords.md` | `/agent/.agents/skills/brand-relevant-keywords/SKILL.md` | Overwrite |
| `skills/competitor-analysis.md` | `/agent/.agents/skills/competitor-analysis/SKILL.md` | Overwrite |
| `skills/creative-strategy-engine.md` | `/agent/.agents/skills/creative-strategy-engine/SKILL.md` | Overwrite |
| `seed/_index.md` | `/agent/brain/brand-audit/_index.md` | Skip if exists |
| INDEX entry for the brand-audit library | `/agent/INDEX.md` | Append if not present |
| `user.md` snippet (sentinel-guarded, v2) | `/agent/user.md` | Appended by the skill **after the first successful audit**, idempotent; removes any older v1 block |

The orchestrator and the six underlying skills all install as **independent top-level skills**. Runneth auto-discovers each one. Any of the six can be invoked standalone ("refresh competitor analysis", "run review-audit on this new NPS export") without going through the orchestrator.

## Install in a fresh sandbox

```bash
# 1. Install the orchestrator
mkdir -p /agent/.agents/skills/brand-audit
cp SKILL.md /agent/.agents/skills/brand-audit/SKILL.md

# 2. Install each of the 6 framework skills as independent top-level skills
for skill in brand-intake product-catalog review-audit brand-relevant-keywords competitor-analysis creative-strategy-engine; do
  mkdir -p /agent/.agents/skills/${skill}
  cp skills/${skill}.md /agent/.agents/skills/${skill}/SKILL.md
done

# 3. Seed local index
mkdir -p /agent/brain/brand-audit
[ -f /agent/brain/brand-audit/_index.md ] || cp seed/_index.md /agent/brain/brand-audit/_index.md

# 4. Add the global INDEX.md routing entry
grep -q "^- path: /agent/brain/brand-audit/ " /agent/INDEX.md 2>/dev/null || echo "- path: /agent/brain/brand-audit/ | aliases: brand audit, brand context, brand-strategy bundle, customer voice, persona matrix, competitor read, voice of customer, VOC | note: Durable brand-strategy bundle produced by brand-audit. Per workspace: brand-context.md (identity + voice), product-catalog.md, review-audit.md (VOC across 5 buckets), keywords.md, competitor-analysis.md, strategy.md (pain × persona × angle × awareness matrix — most-referenced). Refreshes on demand — re-run brand-audit. Read by creative-deep-dive and weekly-performance-deck. | created: $(date -u +%Y-%m-%d) | updated: $(date -u +%Y-%m-%d)" >> /agent/INDEX.md
```

## How it works

On first run for a workspace, the orchestrator asks two or three intake questions inline in chat — brand site URL (required), review sources (recommended), competitor shortlist (optional) — then invokes the six skills in order:

1. **brand-intake** → `brand-context.md`
2. **product-catalog** → `product-catalog.md`
3. **review-audit** → `review-audit.md`
4. **brand-relevant-keywords** → `keywords.md`
5. **competitor-analysis** → `competitor-analysis.md`
6. **creative-strategy-engine** → `strategy.md` (the pain × persona × angle matrix)

Output lives at `/agent/brain/brand-audit/<workspace-slug>/`. The intake answers are recorded inside the bundle files themselves (brand site in `brand-context.md`, review sources in `review-audit.md`, competitors in `competitor-analysis.md`) — there is no separate config file. The user.md instruction tells Runneth to read these files narrowly before any creative-strategy task.

There is no scheduled refresh. When the user asks to refresh ("refresh the brand", "refresh brand strategy"), the orchestrator archives the prior bundle to `_history/<archived-iso>/`, re-derives all six files from the recorded inputs, and shows a short diff in chat. Rolling back is a restore from history.

## Standalone skill invocation

Every one of the six skills is independently callable. Examples:

- "Run brand-intake on `https://newclient.com`" → `brand-intake` runs in isolation, writes `brand-context.md` only.
- "Refresh the competitor read for Hungryroot" → `competitor-analysis` runs standalone, updates only `competitor-analysis.md`.
- "Run review-audit on this new NPS export I just uploaded" → `review-audit` ingests the file, updates `review-audit.md`.

The bundle stays consistent because every standalone invocation writes to the same per-workspace path.

## What this produces

- `/agent/brain/brand-audit/<workspace-slug>/<6 files>.md` per workspace
- `/agent/brain/brand-audit/<workspace-slug>/_history/<archived-iso>/` on every refresh
- One-time `user.md` snippet after first audit (v2 sentinel; removes any v1 block)

## Changelog

- **2.0.0** (2026-06-12) — Cut the auto-invoked setup skill, the Monday refresh routine, the scheduled Slack diff posts with reaction handling, and the per-workspace `_config` JSON. Intake questions now run inline in chat on first run; refresh is on demand with an in-chat diff. user.md snippet bumped to v2.
- **1.0.1** (2026-05-21) — Added post-install intro.
- **1.0.0** (2026-05-20) — Initial release. Lifted Foundation + Strategy layers out of the creative-deep-dive bundle into a standalone durable use case.
