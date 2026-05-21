# Creative deep dive

## What just opened up
Runneth now has 9 standalone diagnostic skills plus an orchestrator that runs the full Execution-Diagnostic-Standards stack on any creative or test set. Each skill is independently callable: hook-analysis, hook-evaluator, creative-mechanics, hook-writing, hook-tactics, hook-voice-patterns, and more. The full orchestrator reads brand-audit's output as upstream context so it never re-derives strategy on every review.

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
