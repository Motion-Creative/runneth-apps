# creative-strategy

The full creative-strategy framework as one self-contained, installable Runneth package: an orchestrator plus 15 independently callable skills across three layers.

- **Foundation:** brand-intake, product-catalog, review-audit, brand-relevant-keywords, competitor-analysis
- **Strategy:** creative-strategy-engine
- **Execution:** hook-writing, hook-tactics, hook-voice-patterns, hook-analysis, hook-evaluator, creative-mechanics, visual-formats, creative-analysis, voice-copy-standards

## Design notes

- **Self-contained.** No dependency on any other package. If a `brand-audit` bundle already exists in the org, the engine may read it as extra context, but it is not required.
- **Harness-neutral skill bodies.** No environment-specific tool names, so each skill installs and runs standalone in any org. Runneth-specific behavior (per-brand storage under `/agent/brain/creative-strategy/`, INDEX wiring) lives in the orchestrator and install-config, not in the skill bodies.
- **Overlap is intentional.** Several skills here also ship in the `brand-audit` and `creative-deep-dive` packages. Installing this package overwrites those skill files with this package's canonical, cleaned copies. This is the consolidated end-to-end install.
- **creative-strategy-engine** is the updated framework provided by Alysha (the 7-step engine: product, customer, micropersona, offer, funnel stage, messaging lens, formats).

## Files

`SKILL.md` orchestrator, `skills/*.md` the 15 leaf skills, `install-config.json` install manifest, `post-install-intro.md`, `seed/_index.md`.
