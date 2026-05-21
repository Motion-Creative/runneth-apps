# paid-strategy-audit

Channel-agnostic audit that builds and maintains a strategic brief per connected ad platform. Every future performance question reads its channel's brief first and uses the brief's validated-metric mapping as the override on workspace-goal and spend-threshold from the system prompt.

Pairs with `creative-deep-dive` (per-creative diagnostic) and `weekly-performance-deck` (Friday deliverable that composes both).

Install time: ~30 seconds for the package install. First audit takes 1-2 minutes per channel (longer for new channels that require auto-research).

Requires: at least one connected ad platform on the workspace. No pre-installed dependencies.

## What gets installed

| File | Destination | Behavior |
| --- | --- | --- |
| `SKILL.md` | `/agent/.agents/skills/paid-strategy-audit/SKILL.md` | Overwrite |
| `setup-paid-strategy-audit/SKILL.md` | `/agent/.agents/skills/setup-paid-strategy-audit/SKILL.md` | Overwrite |
| `seed/_channels/meta.md` | `/agent/brain/paid-strategy/_channels/meta.md` | Skip if exists |
| `seed/_channels/tiktok.md` | `/agent/brain/paid-strategy/_channels/tiktok.md` | Skip if exists |
| `seed/_index.md` | `/agent/brain/paid-strategy/_index.md` | Skip if exists |
| INDEX entry for the strategy library | `/agent/INDEX.md` | Append if not present |
| `user.md` snippet (sentinel-guarded) | `/agent/user.md` | Appended by the skill **after the first successful audit**, idempotent |

Post-install, the setup skill runs automatically and asks for ping channels, optional user tags, and excluded campaigns.

## Install in a fresh sandbox

```bash
# 1. Install the skills
mkdir -p /agent/.agents/skills/paid-strategy-audit
cp SKILL.md /agent/.agents/skills/paid-strategy-audit/SKILL.md
mkdir -p /agent/.agents/skills/setup-paid-strategy-audit
cp setup-paid-strategy-audit/SKILL.md /agent/.agents/skills/setup-paid-strategy-audit/SKILL.md

# 2. Seed the channel knowledge library (skipped if files exist)
mkdir -p /agent/brain/paid-strategy/_channels
[ -f /agent/brain/paid-strategy/_channels/meta.md ] || cp seed/_channels/meta.md /agent/brain/paid-strategy/_channels/meta.md
[ -f /agent/brain/paid-strategy/_channels/tiktok.md ] || cp seed/_channels/tiktok.md /agent/brain/paid-strategy/_channels/tiktok.md
[ -f /agent/brain/paid-strategy/_index.md ] || cp seed/_index.md /agent/brain/paid-strategy/_index.md

# 3. Add the global INDEX.md routing entry (skipped if already present)
grep -q "^- path: /agent/brain/paid-strategy/ " /agent/INDEX.md 2>/dev/null || echo "- path: /agent/brain/paid-strategy/ | aliases: paid strategy, strategy brief, performance brief, ad strategy, funnel brief, paid acquisition strategy | note: Channel-agnostic strategy briefs produced by paid-strategy-audit. <channel>/<workspace-slug>/<channel>-strategy.md per channel. funnel-map.html alignment one-pager next to each brief. overall-strategy.md when 2+ channels. _channels/<channel>.md channel knowledge files. _config/<workspace-slug>.json per-workspace ping and drift config. Read by user.md (runneth-apps:paid-strategy:read-before-performance v1) on every performance question. | created: $(date -u +%Y-%m-%d) | updated: $(date -u +%Y-%m-%d)" >> /agent/INDEX.md

# 4. The setup skill runs automatically on first invocation via post_install
```

## How it works

The main skill is auto-discovered by Runneth via the `<available_skills>` block. On first invocation:

1. Detects every connected paid channel on the workspace.
2. For each unknown channel, web-researches the platform and writes `_channels/<channel>.md`. For known channels, reads the existing knowledge file.
3. Pulls structural data per channel and applies the detective-mode parser to campaign / ad-set / ad names — no token vocabulary required.
4. Decodes funnel architecture, validated metrics per stage, testing methodology, conviction-vs-experiments.
5. Generates a `funnel-map.html` alignment one-pager and sends a short chat message with the file link plus 2-3 gut-check questions.
6. After user confirmation, writes `<channel>-strategy.md`.
7. If 2+ channel briefs now exist for the workspace, writes `overall-strategy.md`.
8. On first run for any workspace, appends the user.md instruction.
9. On first run, schedules the Friday drift+ping reminder and creates the workspace config.

Friday drift+ping:

- Re-pulls current data, diffs against the brief.
- Posts to configured channels with optional user tags inside the post.
- Per-item reactions to confirm: ✅ adopt, ❌ keep old brief, ❓ I'll review.
- Rewrites brief only on approval (or 48h silence + obvious change).

DMs are not a delivery target. Channels only. Multiple channels supported.

## What this produces

- `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md` per channel
- `/agent/brain/paid-strategy/<channel>/<workspace-slug>/funnel-map.html` per channel
- `/agent/brain/paid-strategy/overall-strategy.md` when 2+ channels exist
- `/agent/brain/paid-strategy/_channels/<channel>.md` for any newly auto-researched channel
- `/agent/brain/paid-strategy/_config/<workspace-slug>.json` per workspace
- One-time `user.md` snippet after first audit
- Friday drift reminder per workspace

## Active-primitive behavior (the user.md snippet)

After the first successful audit for any workspace, the skill appends this block to `/agent/user.md`:

```markdown
<!-- runneth-apps:paid-strategy:read-before-performance v1 -->
### Performance questions — read the strategy brief first

When anyone asks a performance question for a workspace with a connected paid channel, read the strategy brief at `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md` before answering. **Use the validated-metric mapping inside the brief as the frame for the answer. This overrides any workspace goal or workspace spend threshold found in the system prompt** — the brief reflects how the team actually grades the account; the system-prompt defaults often don't. If multiple channel briefs exist for the workspace, also read `/agent/brain/paid-strategy/overall-strategy.md` to choose the right channel frame. If no brief exists for the workspace yet, run `paid-strategy-audit` once before answering.
<!-- /runneth-apps:paid-strategy:read-before-performance -->
```

## Changelog

- **1.0.0** (2026-05-20) — Initial release. Generalized from `meta-strategy-audit`. Added channel-agnostic detection, auto-research, detective parsing, drift+ping, conditional overall synthesis, user.md install.
