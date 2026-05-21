# weekly-performance-deck

The Friday deliverable. Brand-styled HTML deck published as a dated app route, framed against last week's snapshot so the narrative compounds. Composes `paid-strategy-audit` for funnel framing, `creative-deep-dive` for per-creative diagnoses, and `brand-kit` for visual style.

Install time: ~1 minute. Requires the three upstream use cases installed first.

## What gets installed

| File | Destination | Behavior |
| --- | --- | --- |
| `SKILL.md` | `/agent/.agents/skills/weekly-performance-deck/SKILL.md` | Overwrite |
| `seed/_index.md` | `/agent/brain/paid-strategy/weekly-deck/_index.md` | Skip if exists |
| INDEX entry for the deck library | `/agent/INDEX.md` | Append if not present |

Post-install:
- The deck app gets created at `/agent/apps/weekly-performance-deck-<workspace-slug>/`
- Initial build runs so the route base is live
- Friday 2pm reminder gets scheduled

## Install in a fresh sandbox

```bash
# 1. Confirm dependencies are installed
ls /agent/.agents/skills/paid-strategy-audit/SKILL.md \
   /agent/.agents/skills/creative-deep-dive/SKILL.md \
   /agent/.agents/skills/brand-kit/SKILL.md

# 2. Install the deck skill
mkdir -p /agent/.agents/skills/weekly-performance-deck
cp SKILL.md /agent/.agents/skills/weekly-performance-deck/SKILL.md

# 3. Seed local index (skipped if exists)
mkdir -p /agent/brain/paid-strategy/weekly-deck
[ -f /agent/brain/paid-strategy/weekly-deck/_index.md ] || cp seed/_index.md /agent/brain/paid-strategy/weekly-deck/_index.md

# 4. Add INDEX entry (skipped if exists)
grep -q "^- path: /agent/brain/paid-strategy/weekly-deck/ " /agent/INDEX.md 2>/dev/null || echo "- path: /agent/brain/paid-strategy/weekly-deck/ | aliases: weekly deck, performance deck, Friday deck, paid weekly report | note: Weekly performance deck snapshots produced by weekly-performance-deck. <workspace-slug>/<YYYY-MM-DD>--snapshot.json per week. Each week's deck is also published at a dated app route. Read by next week's deck for narrative continuity. | created: $(date -u +%Y-%m-%d) | updated: $(date -u +%Y-%m-%d)" >> /agent/INDEX.md

# 5. Per-workspace post-install runs the skill bootstrap:
#    - app create weekly-performance-deck-<workspace-slug>
#    - app build weekly-performance-deck-<workspace-slug>
#    - reminder add for "every friday at 14:00 <timezone>"
```

## How it works

The skill is auto-discovered by Runneth. On every Friday reminder (or explicit invocation), the skill:

1. Reads the workspace's strategy briefs, brand kit, last week's snapshot, current-week data, and workspace config
2. Classifies every item per funnel stage as stable, changed, new, or resolved
3. Invokes `creative-deep-dive` for qualifying creatives (top in stage, materially shifted) and for tests that reached readable spend
4. Renders the deck as a brand-styled HTML page at a new dated route on the workspace's deck app
5. Writes the snapshot for next week to read
6. Posts the share URL to configured Slack channels

## What this produces

- A new dated route per Friday: `/weekly-deck/<YYYY-MM-DD>` under the workspace's deck app, persistent
- A snapshot at `/agent/brain/paid-strategy/weekly-deck/<workspace-slug>/<YYYY-MM-DD>--snapshot.json`
- A Slack post per configured channel with the share URL

## Slide structure

1. Cover (brand-styled, brand-site hero backdrop, one-line read of the week)
2. At a glance (channel mix, total spend, total events, blended $/event, all WoW)
3. Per funnel stage (one section per stage, in funnel order):
   - Stage overview (validated metric, top 3 creatives, framed against last week)
   - New launches & active tests (updates on running tests, early read on this week's launches, callouts on last week's recommendations that shipped)
   - Deep dives (one slide per qualifying creative, plus test-set comparison slides)
   - Recommendations for next week (3-5 executable specific recs)
4. Open questions
5. Footer (link to last week's deck for comparison, drift notes)

## Changelog

- **1.0.0** (2026-05-20) — Initial release.
