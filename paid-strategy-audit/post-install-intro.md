# Paid strategy audit

## What just opened up
Runneth now keeps two reference files for every connected ad platform on this workspace: a **KPI map** (the primary KPI for each strategy/slice, plus a confirmed spend threshold) and a **naming key** (a decoder for your campaign / ad set / ad names). Every future performance question reads both first — so Runneth grades each slice on your real KPI (overriding the ROAS-default workspace goal), never calls a creative a winner until it clears the spend threshold (always spend + KPI together), and reads every name the way you do. Re-run it any time your account changes to refresh both files.

## Try this now
1. **Run the first audit per channel**: `Run the paid strategy audit on all my connected channels.`
   _You'll get back:_ a KPI map and a naming key per channel, saved to `/agent/brain/paid-strategy/<channel>/<workspace-slug>/`.
2. **Ask a performance question and watch the KPI map override the default**: `What are my top performers on Meta this week?`
   _You'll get back:_ ranking by the primary KPI from the map (not the default workspace-goal), limited to creatives that cleared the spend threshold, with each campaign labeled using the naming key.
3. **Refresh after a change**: `Refresh the Meta KPI map and naming key; we just renamed our campaigns.`
   _You'll get back:_ both files re-derived against the new names, a short diff of what changed, and any ambiguous reads surfaced.

## Compounds with
- **brand-audit:** Brand strategy is the upstream foundation; the KPI map and naming key sit on top.
- **creative-deep-dive:** Per-creative diagnostics use the channel's primary KPIs from the map.
- **weekly-performance-deck:** Friday deck reads the KPI map for slices and metrics.
