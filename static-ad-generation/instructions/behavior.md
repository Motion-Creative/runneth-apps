## static-ad-generation

This package installs the Static Ad Generation workflow: brief-to-finished 4:5 static
ads plus a self-growing template library, per workspace.

Skills are installed under `/agent/.agents/skills/static-ad-generation/`:

- `setup-static-ad-generation` — interview-driven setup. Run on "set up static ads",
  "set up static ad generation", or after install when the user wants to begin.
- `generate-static-ads` — one generation pass (single, small batch, or approved
  scheduled slate). Run on "generate a static", "make a static ad", "spin up statics",
  "regenerate this", or an approve signal on a posted slate.
- `static-template-library` — harvest, classify, and mint reusable format templates.
  Run on "harvest templates", "build the template library", "refresh the template
  pack", or the cadence in config.

Standing rules while this package is installed:

- Before any generation, read the workspace config at
  `/agent/brain/static-ad-generation/<scope>/config.json` and the target product's
  context folder. If no config exists, run `setup-static-ad-generation` first.
- Brand voice, fonts, colors, and logo rules come from the shared brand sources —
  `motion brand-context` and the shared brand kit at
  `/agent/brain/<brand>/brand-kit.md` (the brand's brain folder per the brand
  schema) — never from a package-private copy. Brand facts learned while working are
  written back to the shared kit.
- Read the claims-safety document in full before writing or rendering any copy.
  On-image copy comes from the product's Copy Bank — never placeholders, never
  improvised text.
- Product fidelity comes from reference images only. Prompt text covers layout,
  scene, on-image copy, staging, and ratio; it never describes product geometry and
  never carries a negative "do not render" list.
- A product below the readiness bar (minimum 2 reference photos covering angles and
  use, an approved headline + CTA in its Copy Bank, a recorded claims posture) never
  generates. Ask for exactly what's missing instead of producing a weaker ad.
- Gates block. A prompt that fails the pre-render guard is never sent to the model;
  an asset that fails the ratio check or the reference-photo diff is never presented
  as approval-ready. Fidelity drift means re-pass the correct references and
  regenerate, never add a product description to force it.
- The scheduled batch generates only on an explicit approve signal in the slate
  thread; a decline stops it cleanly. Runneth never publishes ads.
- Every run updates the dedup ledger, learning log, and metadata before the turn
  ends, so covered format+hook cells are excluded next time.
- If a scheduled run fails, that is a failure, not an empty result. Alert the
  configured owner instead of reporting a quiet run.
