---
hero_headline: "Runneth reads your account the way you do."
hero_subhead: "Two reference files per channel: a KPI map that says which metric (and what spend bar) grades each slice, and a naming key that decodes your campaign names."
install_time: "~2 minutes for the first audit, ~30 seconds per workspace after"
requires: "At least one connected ad platform"
---

## Super powers this unlocks

- A **KPI map** per connected channel: every strategy/slice in the account paired with the one primary KPI you grade it on. Meta, TikTok, Pinterest, AppLovin, Snapchat, anything else.
- A confirmed **spend threshold** baked into the map: a creative is never called a winner until it clears the bar, so Runneth always judges on spend + KPI together — not a great cost-per-result on $40 of spend.
- A **naming key** per channel: a decoder for your campaign / ad set / ad names, built from the names actually in your account. Tokenized, underscore-separated, or free-form — it reads them all.
- It reads your workspace goal as a signal — Motion defaults it to ROAS, so if you've changed it, Runneth treats that as a hint about what you actually care about — but the real map is more nuanced than one metric.
- Every performance question Runneth answers from this point forward reads both files first — grading each slice on your real KPI (above the spend threshold) and interpreting every name the way you would.
- Unknown channels get researched automatically before their files get written.
- Re-run it any time your account changes — it refreshes both files and shows you what moved.

## How it works

The audit runs once per workspace and produces, for every connected ad platform, a KPI map (`<channel>-strategy.md`), a naming key (`naming-key.md`), and an alignment-check `funnel-map.html` you scan and react to.

On first run, it appends a single block to `/agent/user.md` that tells Runneth to read both files before any performance answer — to grade each slice on the KPI map (overriding the ROAS-default workspace goal, always paired with the spend threshold) and to decode names with the naming key.

There's no scheduled routine to manage. When your account changes, re-run the audit: it archives the prior files, re-derives both, and surfaces a short diff of what changed.

## A real example

Alysha runs the audit on her DTC client. Meta and TikTok are both connected. The audit produces, per channel:

- A **KPI map** for Meta: prospecting and retargeting slices, both graded on Purchase ($/purchase), $14K/day.
- A **KPI map** for TikTok: a single creator-led slice graded on Add to Cart, because TikTok-attributed Purchase under-reports.
- A **naming key** for each, decoding tokens like `pr` (prospecting), `lal` (lookalike), and `FF` (Form Fill) — with the messy free-form names spelled out in worked examples.

The audit also flags that Motion's default spend threshold of $50 looks low for a $14K/day account; Alysha confirms $250. From now on Runneth won't crown a creative that hasn't spent at least that.

The next time someone asks "what's working on TikTok?", Runneth reads the KPI map, only considers creatives past the spend threshold, grades them on Add-to-Cart efficiency — not the Purchase ROAS the workspace goal would have surfaced — and uses the naming key to label each campaign correctly.

A month later the team renames their campaigns and adds a "Form Fill" event. Alysha re-runs the audit; Runneth refreshes both files and shows her the diff — a new slice and three decoded tokens — in one message.
