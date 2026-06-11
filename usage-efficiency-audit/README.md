# usage-efficiency-audit

Watcher and audit. Daily check on whether a workspace has crossed 80% of its included Runneth plan for the current billing cycle. When it has, runs a personalized efficiency audit on the team's actual conversation history, generates an openable HTML page with concrete recommendations, and posts a friend-voice heads-up to Slack with the link. Fires once per cycle.

## What it does

- Reads `/agent/brain/usage-efficiency/<workspace-slug>.json` for config
- Computes the current billing cycle window from the saved anniversary day
- Pulls cycle-to-date cost from the local Postgres conversation store
- Compares to the configured threshold (80% of the included plan by default)
- If the threshold is crossed and the cycle hasn't been notified yet, runs pattern detection on the team's real conversations, builds an openable HTML page, and posts to Slack
- Marks the cycle as notified so it stays quiet until the next cycle

## Customer-facing copy guardrails

The customer never sees dollar figures, internal pricing tiers, or scarcity language. The audit speaks in percentage of plan used, days until reset, and (when appropriate) "the next tier 3x's your usage."

## Files

- `SKILL.md` — the main audit + watcher skill
- `setup-usage-efficiency-audit/SKILL.md` — one-time setup and reconfigure
- `install-config.json` — install schema for the use case library
- `marketing.md` — library detail page copy
- `use-case.json` — library manifest
- `post-install-intro.md` — first-message shown after install completes
