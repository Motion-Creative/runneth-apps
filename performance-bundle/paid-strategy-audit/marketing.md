---
hero_headline: "Every performance question, answered through the team's actual strategy."
hero_subhead: "Channel-agnostic strategy briefs that override workspace goals and spend thresholds. Drift catches itself every Friday."
install_time: "~2 minutes for the first audit, ~30 seconds per workspace after"
requires: "At least one connected ad platform"
status: "proven"
---

## Super powers this unlocks

- One strategy brief per connected channel. Meta, TikTok, Pinterest, AppLovin, Snapchat, anything else.
- Unknown channels get researched automatically. The audit teaches itself how to read a new platform before producing the brief.
- Names can be anything. Tokenized, underscore-separated, free-form. The detective parser handles all of it.
- Every performance question Runneth answers from this point forward reads the brief first — and uses the brief's validated metrics, not the workspace goal or spend threshold from the system prompt.
- Friday drift check catches strategy shifts and pings the channels you configured. Briefs only get rewritten on your confirmation.

## How it works

The audit runs once per workspace and produces a `<channel>-strategy.md` for every connected ad platform plus an alignment-check `funnel-map.html` you scan and react to. If you have two or more channels, it also synthesizes a cross-channel `overall-strategy.md`.

On first run, it appends a single block to `/agent/user.md` that tells Runneth to read the brief before any performance answer — and to use the brief's validated-metric mapping as the override on whatever workspace defaults the system prompt is carrying.

The drift routine runs every Friday at 9am local. It diffs current data against the brief and posts to your configured channels with per-item reactions for confirmation. ✅ adopts the new read, ❌ keeps the old brief, ❓ holds for your reply.

## A real example

Alysha runs the audit on her DTC client. Meta and TikTok are both connected. The audit produces:

- `meta-strategy.md` reading Meta as a two-step funnel (Prospecting → Retargeting), both Purchase-optimized, $14K/day
- `tiktok-strategy.md` reading TikTok as creator-led top-of-funnel, optimizing for Add to Cart because TikTok-attributed Purchase under-reports
- `overall-strategy.md` synthesizing that TikTok feeds Meta retargeting

The next time someone asks "what's working in the account?", Runneth pulls both briefs, sees that the team grades TikTok on Add to Cart, and answers about TikTok using ATC efficiency — not the Purchase ROAS the workspace goal would have surfaced.

Friday morning, the drift routine catches that a new "Form Fill" optimization event appeared in three Meta campaigns. It posts to `#growth-team` tagging Alysha, who reacts ✅. The Meta brief gets rewritten with the new event. The next deck reflects it automatically.
