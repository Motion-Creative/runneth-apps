# Creative deep dive

## What just opened up
You can now ask Runneth to read any ad the way a strategist would: what the hook is actually doing, why it's working or not, and what the next test worth running is. Drop a creative ID or a full test set and get a mechanism-level teardown with specific iteration recommendations. Every diagnostic reads the brand-audit context so the analysis is grounded in your actual strategy, not generic best practices.

## Try this now
1. **Full deep dive on one creative**: `Deep dive on creative ID [creative-id].`
   _You'll get back:_ orchestrator pulls performance data, brand-audit context, runs the diagnostic stack, and writes the full teardown to `/agent/brain/creative-deep-dive/<workspace-slug>/<creative-id>/<date>--deep-dive.md`.
2. **Score one hook in isolation**: `Score this hook against our brand: [paste hook copy]`
   _You'll get back:_ hook-evaluator standalone with a rubric score, voice-pattern match, and specific revision suggestions.
3. **Run the diagnostic across a test set**: `Run a deep dive across all creatives in the [campaign] test, focus on hook tactics.`
   _You'll get back:_ a comparative analysis grouped by tactic, what's winning, what's not, and the next hook tests worth running.

## Compounds with
- **brand-audit:** Strategic Layer comes from here.
- **paid-strategy-audit:** Validated metrics from the channel brief frame the diagnostic.
- **weekly-performance-deck:** Per-creative deep dives feed the Friday deck.
