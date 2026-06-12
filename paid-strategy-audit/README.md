# paid-strategy-audit

Channel-agnostic audit that builds and maintains two durable reference files per connected ad platform: a **KPI map** (the primary KPI for every strategy/slice in the account, plus the confirmed spend threshold) and a **naming key** (a decoder for the account's campaign / ad set / ad names). Every future performance question reads both first, so Runneth grades each slice on the team's real KPI — overriding the workspace-goal default, always paired with the account's confirmed spend threshold — and reads every name the way the team would.

It reads `motion workspace-goal` and `motion spend-threshold` as signals: the goal defaults to ROAS (a non-ROAS value means the user changed it on purpose), and the spend threshold is Motion's account-size default that gets confirmed with the user. A creative is never called a winner until it clears that threshold — verdicts always combine spend + KPI.

Scope is deliberately narrow: KPI map + naming key. It does not decode testing methodology, judge what's working, or recommend changes.

Pairs with `creative-deep-dive` (per-creative diagnostic) and `weekly-performance-deck` (Friday deliverable that composes both).

Install time: ~30 seconds for the package install. First audit takes 1-2 minutes per channel (longer for new channels that require auto-research).

Requires: at least one connected ad platform on the workspace. No pre-installed dependencies.

## What gets installed

| File | Destination | Behavior |
| --- | --- | --- |
| `SKILL.md` | `/agent/.agents/skills/paid-strategy-audit/SKILL.md` | Overwrite |
| `seed/_channels/meta.md` | `/agent/brain/paid-strategy/_channels/meta.md` | Skip if exists |
| `seed/_channels/tiktok.md` | `/agent/brain/paid-strategy/_channels/tiktok.md` | Skip if exists |
| `seed/_index.md` | `/agent/brain/paid-strategy/_index.md` | Skip if exists |
| INDEX entry for the strategy library | `/agent/INDEX.md` | Append if not present |
| `user.md` snippet (sentinel-guarded) | `/agent/user.md` | Appended by the skill **after the first successful audit**, idempotent |

Ping channels, excluded campaigns, and other per-workspace config are handled by the general setup use case — not by this skill.

## Install in a fresh sandbox

```bash
# 1. Install the skill
mkdir -p /agent/.agents/skills/paid-strategy-audit
cp SKILL.md /agent/.agents/skills/paid-strategy-audit/SKILL.md

# 2. Seed the channel knowledge library (skipped if files exist)
mkdir -p /agent/brain/paid-strategy/_channels
[ -f /agent/brain/paid-strategy/_channels/meta.md ] || cp seed/_channels/meta.md /agent/brain/paid-strategy/_channels/meta.md
[ -f /agent/brain/paid-strategy/_channels/tiktok.md ] || cp seed/_channels/tiktok.md /agent/brain/paid-strategy/_channels/tiktok.md
[ -f /agent/brain/paid-strategy/_index.md ] || cp seed/_index.md /agent/brain/paid-strategy/_index.md

# 3. Add the global INDEX.md routing entry (skipped if already present)
grep -q "^- path: /agent/brain/paid-strategy/ " /agent/INDEX.md 2>/dev/null || echo "- path: /agent/brain/paid-strategy/ | aliases: paid strategy, KPI map, naming key, spend threshold, strategy brief, performance brief, ad strategy, paid acquisition | note: Per-channel KPI map (<channel>/<workspace-slug>/<channel>-strategy.md) and naming key (naming-key.md) produced by paid-strategy-audit, plus funnel-map.html alignment one-pager. _channels/<channel>.md channel knowledge files. Read by user.md (runneth-apps:paid-strategy:read-before-performance v2) on every performance question. | created: $(date -u +%Y-%m-%d) | updated: $(date -u +%Y-%m-%d)" >> /agent/INDEX.md
```

## How it works

The main skill is auto-discovered by Runneth via the `<available_skills>` block. On first invocation:

1. Detects every connected paid channel on the workspace.
2. For each unknown channel, web-researches the platform and writes `_channels/<channel>.md`. For known channels, reads the existing knowledge file.
3. Pulls structural data per channel and decodes campaign / ad-set / ad names — building the naming key from the names actually in the account (no token vocabulary required).
4. Groups campaigns into the handful of slices the team runs (light funnel grouping), assigns the one primary KPI per slice (using the workspace goal as a hint), and confirms the spend threshold that gates what counts as a winner.
5. Generates a `funnel-map.html` alignment one-pager (KPI map + naming key) and sends a short chat message with the file link plus 2-3 gut-check questions.
6. After user confirmation, writes `naming-key.md` and `<channel>-strategy.md` (the KPI map).
7. On first run for any workspace, appends the user.md instruction.

There is no scheduled routine. Re-run the skill any time the account changes — it archives the prior files to `_history/`, re-derives both, and surfaces a short diff.

## What this produces

- `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md` (KPI map) per channel
- `/agent/brain/paid-strategy/<channel>/<workspace-slug>/naming-key.md` per channel
- `/agent/brain/paid-strategy/<channel>/<workspace-slug>/funnel-map.html` per channel
- `/agent/brain/paid-strategy/<channel>/<workspace-slug>/_history/<archived-iso>--<file>` on re-run
- `/agent/brain/paid-strategy/_channels/<channel>.md` for any newly auto-researched channel
- One-time `user.md` snippet after first audit

> The KPI map keeps the filename `<channel>-strategy.md` for continuity — `creative-deep-dive` and `weekly-performance-deck` read it by that name. Its contents are now the KPI map (slice → primary KPI), not a full strategy brief.

## Active-primitive behavior (the user.md snippet)

After the first successful audit for any workspace, the skill appends this block to `/agent/user.md` (and removes any older `v1` block):

```markdown
<!-- runneth-apps:paid-strategy:read-before-performance v2 -->
### Performance questions — read the KPI map and naming key first

When anyone asks a performance question for a workspace with a connected paid channel:

1. Read the channel's KPI map at `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md`. Grade each slice on the **primary KPI mapped there** — that overrides any single workspace-goal default (Motion defaults the goal to ROAS, which is often not how the team actually grades each slice). **Always pair the KPI with spend:** a creative must clear the map's confirmed **spend threshold** before you call it a top performer or a winner — below it, treat it as "not enough data," not a win or a loss. Use the map's confirmed threshold, not the raw system-prompt default.
2. Read the channel's naming key at `/agent/brain/paid-strategy/<channel>/<workspace-slug>/naming-key.md` and use it to interpret any campaign / ad set / ad name before you describe, group, or rank it — read the account the way the team does.

If no KPI map or naming key exists for the workspace+channel yet, run `paid-strategy-audit` once before answering.
<!-- /runneth-apps:paid-strategy:read-before-performance -->
```

## Changelog

- **2.0.0** (2026-06-05) — Trimmed to one focused job: find the right KPIs, spend threshold, and naming breakdowns. Replaced the full strategy brief with a focused **KPI map** (primary KPI per slice, plus a confirmed spend threshold) and a new durable **naming key** artifact. Cut testing-methodology decode, conviction-vs-experiments, and the cross-channel `overall-strategy.md` synthesis. Removed the Friday drift+ping routine, the dedicated `setup-paid-strategy-audit` skill, and the per-workspace `_config` file — a general setup use case handles ping/config now, and re-running the audit refreshes the files. Funnel decoding reduced to light slice grouping. Workspace goal and spend threshold are now read as signals (goal defaults to ROAS; non-ROAS = deliberate user signal) rather than ignored; the spend threshold is confirmed with the user and recorded, and every creative verdict combines spend + KPI. user.md snippet bumped to `v2` (now points at both the KPI map and the naming key, with the spend-threshold rule; replaces `v1`).
- **1.0.0** (2026-05-20) — Initial release. Generalized from `meta-strategy-audit`. Added channel-agnostic detection, auto-research, detective parsing, drift+ping, conditional overall synthesis, user.md install.
