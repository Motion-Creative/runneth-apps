# competitor-intel

Weekly competitive intelligence scan. Tracks a configured list of competitor brands,
pulls their full active ad portfolios, runs survival cohort analysis, diffs against last week's
saved baseline, and delivers a delta-first report to a Slack channel automatically.

The value is in the delta. "Brand X launched 6 UGC ads targeting the solopreneur burnout angle this
week — first new messaging territory in three weeks" is intelligence. A list of their active ads
is a fact sheet. Every report answers: **what should the team pay attention to this week?**

Install time: ~2 minutes. No upstream use cases required.

---

## What gets installed

| File | Destination | On exists |
|------|-------------|-----------|
| `SKILL.md` | `/agent/.agents/skills/competitor-intel/SKILL.md` | Overwrite |
| `setup-competitor-intel/SKILL.md` | `/agent/.agents/skills/setup-competitor-intel/SKILL.md` | Overwrite |
| `seed/inspoBrands.json` | `/agent/brain/competition/{{WORKSPACE_SLUG}}/inspoBrands.json` | Skip |
| `seed/baselines/.gitkeep` | `/agent/brain/competition/{{WORKSPACE_SLUG}}/baselines/.gitkeep` | Skip |

Post-install: the `setup-competitor-intel` skill runs automatically to configure the watchlist,
Slack channel, and weekly schedule.

---

## Install in a fresh sandbox

```bash
# 1. Copy the skill files
mkdir -p /agent/.agents/skills/competitor-intel
cp SKILL.md /agent/.agents/skills/competitor-intel/SKILL.md

mkdir -p /agent/.agents/skills/setup-competitor-intel
cp setup-competitor-intel/SKILL.md /agent/.agents/skills/setup-competitor-intel/SKILL.md

# 2. Seed the brain directory (replace {{WORKSPACE_SLUG}} with the actual slug)
WORKSPACE_SLUG="your-workspace-slug"
mkdir -p /agent/brain/competition/${WORKSPACE_SLUG}/baselines
[ -f /agent/brain/competition/${WORKSPACE_SLUG}/inspoBrands.json ] || \
  cp seed/inspoBrands.json /agent/brain/competition/${WORKSPACE_SLUG}/inspoBrands.json

# 3. Post-install: invoke setup
# Say "set up competitor watch" in chat, or Runneth will prompt you automatically.
```

---

## How it works

**Setup (one time):** The `setup-competitor-intel` skill walks through:
1. Selecting 3–5 competitor brands by name or domain
2. Resolving each brand in Motion's ad library (uses `motion search-brands`)
3. Configuring the Slack channel to deliver to
4. Setting the weekly schedule (default: Monday 9am workspace timezone)

**Every run:**
1. Reads the workspace inspo brands file for brand IDs
2. Pulls each competitor's full active portfolio (two-pass: newest + oldest sort, merged and deduplicated)
3. Pulls recently killed ads (inactive, paused within last 7 days)
4. Pulls brand context for each competitor
5. Runs survival cohort analysis: long-runners (60+ days), survivors (15–59d), testing zone (7–14d), fresh tests (<7d)
6. Extracts messaging themes, hook types, format mix, test clusters, and feature emphasis
7. Diffs against last week's saved baseline: what's new, what survived, what stopped
8. Generates a delta-first report
9. Posts a teaser message to the Slack channel, with the full report in a thread reply
10. Writes the new baseline for next week's diff

**First run:** Establishes baselines only. No delta report (nothing to compare against yet).
Second run onward produces the weekly delta intelligence.

---

## What this creates at runtime

```
/agent/brain/competition/{{WORKSPACE_SLUG}}/
  inspoBrands.json                    — saved brands, Slack config, schedule
  baselines/
    {brand-slug}.json               — weekly snapshot per competitor (overwritten each run)
```

---

## What to customize

| Token | Description | Required | Fallback |
|-------|-------------|----------|---------|
| `WORKSPACE_ID` | Motion workspace ID | Yes | None |
| `WORKSPACE_NAME` | Human-readable workspace or brand name | Yes | None |
| `WORKSPACE_SLUG` | URL-safe workspace name (derived at install) | Yes | None |

All tokens are set automatically by the `setup-competitor-intel` skill.
The watchlist itself (brands, Slack channel, schedule) is configured interactively by that skill.

---

## Triggers

The skill runs automatically on the scheduled reminder. It also fires on explicit request in chat:

| Phrase | What happens |
|--------|-------------|
| "competitor scan" | Full scan of all watchlisted brands |
| "competitor watch" | Same |
| "run competitor watch" | Same |
| "what are competitors doing" | Same |
| "competitive intel" | Same |
| "what changed in the market" | Same |
| "set up competitor watch" | Invokes `setup-competitor-intel` for add/remove/reconfigure |
| "add a competitor" | Invokes `setup-competitor-intel` to add one brand |
| "remove a competitor" | Invokes `setup-competitor-intel` to remove one brand |

---

## How Runneth operates this use case

On every scheduled or triggered run, Runneth:

1. Reads `/agent/brain/competition/{{WORKSPACE_SLUG}}/inspoBrands.json` for brand IDs and config
2. Runs `motion workspace-goal` to resolve workspace context
3. Runs `motion inspo-creatives --brand-id {id} --status active --sort newestLaunchDate --limit 150` for each brand
4. Runs the same call with `--sort oldestLaunchDate` and merges by creative ID
5. Runs `motion inspo-creatives --brand-id {id} --status inactive --sort newestLaunchDate --limit 150` for recently killed ads
6. Runs `motion inspo-context --brand-id {id}` for brand context
7. Loads baseline from `/agent/brain/competition/{{WORKSPACE_SLUG}}/baselines/{slug}.json`
8. Computes survival cohorts, messaging themes, test clusters, and delta vs baseline
9. Writes the full report and Slack teaser to `./workdir/`
10. Posts to Slack via `slack send` (teaser to channel, full report as thread reply)
11. Overwrites baselines with the new weekly snapshot

---

## Fallbacks

- **Brand not in Motion's ad library:** Skipped with a note in the report. Suggest trying `motion search-brands` with a different term.
- **No Slack channel configured:** Full report delivered in the current chat thread.
- **No previous baseline:** First-run mode — full landscape report, labeled "Baseline established."
- **Empty portfolio (0 active ads):** Noted in the report, not treated as an error.
- **Own-brand data unavailable:** Comparison table skipped, noted in the report.

---

## Version history

- **1.0.0** (2026-05-20) — Initial release. Translated from the `competitor-intel` skill in
  `motion-creative-plugin`. MCP tools replaced with native `motion` CLI. Watchlist and baselines
  moved from `~/.claude/` to workspace-scoped brain storage. Setup skill handles configuration
  and scheduling.
