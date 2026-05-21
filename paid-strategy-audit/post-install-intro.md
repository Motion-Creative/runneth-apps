# Paid strategy audit

## What just opened up
Runneth now maintains a strategic brief for every connected ad platform on this workspace. Every future performance question reads the relevant channel's brief first, uses the brief's validated-metric mapping as the override on workspace-goal, and never has to re-derive funnel structure or success criteria. A drift-and-ping routine catches when the brief goes stale.

## Try this now
1. **Run the first audit per channel**: `Run the paid strategy audit on all my connected channels.`
   _You'll get back:_ a per-channel brief saved to `/agent/brain/paid-strategy/<channel>/<workspace-slug>/`, with funnel shape, validated metrics, success criteria, and testing patterns.
2. **Ask a performance question and watch the brief override the default**: `What are my top performers on Meta this week?`
   _You'll get back:_ ranking by the validated metric from the brief (not the default workspace-goal), framed in the funnel architecture from the audit.
3. **Refresh after a strategy change**: `Refresh the Meta strategy brief; we just changed campaign structure.`
   _You'll get back:_ the brief re-derived against the new structure, drift acknowledged, and any open questions surfaced.

## Compounds with
- **brand-audit:** Brand strategy is the upstream foundation; channel briefs sit on top.
- **creative-deep-dive:** Per-creative diagnostics use the channel brief's validated metrics.
- **weekly-performance-deck:** Friday deck composes both audits into the narrative.
