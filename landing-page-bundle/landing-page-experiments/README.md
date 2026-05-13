# landing-page-experiments

Runneth generates a prioritized A/B test backlog for any landing page. 10-20 tests grouped by element and hypothesis type, each with verbatim current state, specific variant copy, primary metric, guardrail, expected lift band, win-rate prior, min sample size estimate, effort, score, and "why this might lose" failure mode.

Pairs with `landing-page-summary` (upstream evidence), `brand-kit` (variant copy stays on-brand), and `optimize-landing-page` (audit history avoids suggesting fixes already shipped).

Install time: ~15 seconds. No bootstrap needed by this skill directly. If `landing-page-summary` is installed, it provides the Playwright-backed evidence layer. If not, this skill falls back to WebFetch.

Requires: nothing pre-installed. Strongly recommended: `landing-page-summary`, `brand-kit`, `optimize-landing-page`.

## What gets installed

| File | Destination | Behavior |
| --- | --- | --- |
| `SKILL.md` | `/agent/.agents/skills/landing-page-experiments/SKILL.md` | Overwrite (skill upgrade) |
| `seed/_index.md` | `/agent/brain/experiments/_index.md` | Skipped if file exists |
| INDEX.md routing entry for the experiments library | `/agent/INDEX.md` | Appended if not present |

The skill itself is auto-discovered via Runneth's available-skills mechanism, so no `/agent/.agents/skills/...` entry is added to `/agent/INDEX.md` (per Runneth's index rules). Only the durable library at `/agent/brain/experiments/` is indexed.

The skill creates `/agent/brain/experiments/` on first run.

## Install in a fresh sandbox

```bash
# 1. Install the skill so Runneth auto-discovers it
mkdir -p /agent/.agents/skills/landing-page-experiments
cp SKILL.md /agent/.agents/skills/landing-page-experiments/SKILL.md

# 2. Seed the local index (skipped if already present)
mkdir -p /agent/brain/experiments
[ -f /agent/brain/experiments/_index.md ] || cp seed/_index.md /agent/brain/experiments/_index.md

# 3. Add the global INDEX.md routing entry (skipped if already present, single-line format)
grep -q "^- path: /agent/brain/experiments/ " /agent/INDEX.md 2>/dev/null || echo "- path: /agent/brain/experiments/ | aliases: experiments, ab tests, test backlog, landing page experiments, experiment backlogs, test ideas | note: Experiment backlog library produced by the landing-page-experiments skill. One folder per page at <slug>--<domain>/ with date-stamped backlog files. Each backlog is a scored, prioritized list of 10-20 A/B tests with current state, variant copy, expected lift, win-rate prior, min sample size, effort, and why-this-might-lose. Local routing index at _index.md. Source summaries in /agent/brain/landing-pages/. | created: {{INSTALL_DATE}} | updated: {{INSTALL_DATE}}" >> /agent/INDEX.md
```

Replace `{{INSTALL_DATE}}` with today's date for exact provenance.

## How it works

The skill is auto-discovered by Runneth via the `<available_skills>` block in the system prompt. When the user asks for test ideas, an experiment backlog, or "what should we A/B test", Runneth opens `SKILL.md` and follows it.

Six phases:

1. **Fresh LP summary** via `landing-page-summary`. Never reads saved summaries directly.
2. **Read prior context.** Prior CRO audits (so tests don't repeat fixes already shipped), prior backlogs (so tests don't repeat themselves), brand kit if present (so variant copy stays on-brand).
3. **Generate the backlog.** 10-20 tests, scored by `(expected lift) x (win-rate prior) / effort`. Coverage requirements: 2+ tests per element, 1+ per hypothesis type with prior > 25%, max 4 per element.
4. **Compose the artifact.** Top 3 ship-now block, full backlog by element and by hypothesis, every test as a complete decision record, filtered-out section for transparency, dependencies and sequencing.
5. **Index hygiene.** Update local `_index.md` and global `/agent/INDEX.md`.
6. **Surface readout.** 5-line summary plus a file link widget to open the backlog.

## What makes this different from `optimize-landing-page`'s test queue

`optimize-landing-page` returns 3 tests as an audit appendix. They're tied to the top 3 fixes.

`landing-page-experiments` returns 10-20 tests as the primary deliverable. Coverage is deliberate (every element, every hypothesis type with non-trivial win rate). Each test carries scoring components, sample size math, and an honest failure mode. The output is a sprint plan, not an audit appendix.

Use them together:

- `optimize-landing-page` once a quarter to find what's wrong.
- `landing-page-experiments` every sprint after the audit fixes ship, to plan what's next.

## Freshness and drift

The skill always invokes `landing-page-summary` fresh. Never reads saved summaries directly. Stale page state corrupts test ideation just like it corrupts audits and brand kits.

The `landing-page-summary` weekly refresh routine flags experiment backlogs whose pages changed materially (in Phase F, cross-skill drift flags). When you see a `WARN: page changed since backlog generated` flag on a row in `/agent/brain/experiments/_index.md`, regenerate that backlog.

## File layout after install + a few backlogs

```
/agent/.agents/skills/landing-page-experiments/SKILL.md
/agent/brain/experiments/
├── _index.md
└── <slug>--<domain>/
    ├── 2026-05-13.md                            ← first backlog
    ├── 2026-06-04.md                            ← after audit fixes shipped
    └── 2026-07-15.md                            ← page changed materially, refreshed
./artifacts/experiments.<host>.<date>.md          ← copy the user opens this turn
```

## No routine

This skill intentionally has no recurring routine. Experiment ideation is event-driven (after audit, after win, after loss, sprint planning), not time-driven. The `landing-page-summary` weekly routine surfaces drift flags so you know when a backlog needs refreshing.

## Fallbacks

- **landing-page-summary not installed:** falls back to WebFetch. Visual and form claims are weaker; flagged in the artifact header.
- **brand-kit not installed:** variant copy uses Motion's HTML design-system fallback for visual specs and generic best-practice voice. Flagged as a gap.
- **optimize-landing-page not installed or no prior audits:** skill proceeds without prior-audit filtering. Some tests in the backlog may overlap with future audit findings.

## Version history

See `install-config.json` changelog.
