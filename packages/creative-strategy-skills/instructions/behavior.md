# Creative Strategy Skills

This package installs Alysha's creative-strategy skill framework into `agent_skills`. It is a stack of 15 independently callable skills that take a brand from understanding to strategically mapped, executable ads. Skills-only: it installs no app, routine, brain seed, or secret.

## What is installed

The skills land at their normal skill paths so they auto-load and trigger on their own descriptions. Three layers:

- **Foundation** (understand the brand before any messaging): `brand-intake`, `product-catalog`, `review-audit`, `brand-relevant-keywords`, `competitor-analysis`.
- **Strategy** (map the plan): `creative-strategy-engine`.
- **Execution** (produce the creative): `hook-writing`, `hook-analysis`, `hook-evaluator`, `hook-tactics`, `hook-voice-patterns`, `creative-mechanics`, `visual-formats`, `creative-analysis`, `voice-copy-standards`.

## When to use them

- Reach for these on any creative-strategy request: building brand context, writing or grading hooks, mapping messaging angles, choosing ad formats, tearing down an existing ad, or enforcing spoken-first copy standards.
- Run foundation before strategy, and strategy before execution, when starting a brand cold. `brand-intake` is the prerequisite context layer for everything downstream.
- Each skill also stands alone. Follow the trigger guidance inside each `SKILL.md`; do not require the whole chain when the ask is narrow (for example "score this hook" uses `hook-evaluator` only).

## Notes

- Package install stages the skill files only. There is no build, routine, or setup step to run after install.
- These skills reason from brand context and customer language. They do not fabricate performance data; keep any metric claims grounded in real Motion data.
