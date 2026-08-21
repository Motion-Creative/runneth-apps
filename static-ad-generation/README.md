# Static Ad Generation

Brief-to-finished static ad generation with a self-growing template engine. One shared
core — per-product context, claims safety, a reference-images-only prompt rule, hard
quality gates — behind two tracks: generate statics on demand (or on an approval-gated
weekly batch), and harvest competitor statics into reusable format templates that the
generation track draws from.

Abstracted from a production single-brand deployment that ran both tracks for months.

## Why it is shaped this way

- **Reference images carry fidelity, never words.** Prompts describe layout, scene,
  on-image copy, staging, and ratio only; product geometry in prose shrinks and
  distorts the product. Reference photos are passed before the prompt text.
- **A readiness bar gates every product.** Multiple real reference photos (different
  angles plus an in-use shot), an approved headline and CTA in the Copy Bank, and a
  recorded claims posture are hard requirements — a product below the bar never
  generates; the agent asks for exactly what's missing instead of producing a weaker
  ad.
- **Deterministic gates before and after the model.** A pre-render guard blocks
  placeholder leaks and banned claims before any generation call; ratio enforcement
  discards and retries; every asset is diffed against the actual reference photos
  before delivery. Nothing that fails a gate is presented as approval-ready.
- **Copy is never improvised.** On-image text comes from the product's Copy Bank,
  claims are checked against a central claims-safety document read in full.
- **Templates are an engine, not a folder.** A routing index scores patterns on
  own-account signal, cohort signal, and an untested bonus; a dedup ledger removes
  already-covered format+hook cells; newly approved templates get a guaranteed slot;
  learnings promote or hard-suppress patterns.
- **The scheduled path is approval-gated.** The weekly selection routine posts a
  proposed slate and waits; generation runs only on an explicit approve signal, and a
  decline stops it cleanly.

## What installs

- `instructions/behavior.md` — standing routing and safety rules.
- `skills/setup-static-ad-generation` — interview-driven setup: per-product context
  (reference photos, copy bank, claims rules), generation check, template seed,
  optional weekly batch routine.
- `skills/generate-static-ads` — the end-to-end generation pass: scope, context load,
  template + hook selection, reference-only prompt, guard, generate, ratio enforcement,
  fidelity diff, ID + naming, HTML brief delivery, record-keeping.
- `skills/static-template-library` — harvest competitor/cohort statics, classify
  against the pattern list, mint net-new reusable templates into the routing index.

Per-workspace state lives at `/agent/brain/static-ad-generation/<scope>/`. Brand
voice, fonts, colors, and logo rules come from the shared brand sources used by all
creative packages — `motion brand-context` and the shared brand kit at
`/agent/brain/<brand>/brand-kit.md` in the brand's brain folder (per the brain's
brand schema) — never from a package-private copy.

## v1 boundaries

- Output format: 4:5 statics (the production-proven ratio); other ratios are a config
  extension, not a v1 promise.
- Image generation currently calls a Gemini image model through the workspace's
  stored API key; a native, token-billed generation tool is in progress and the call
  site is isolated in one reference file so it can swap without touching the
  workflow (and the key step drops out of setup when it does).
- Video generation is out of scope; this package is statics only.
- Template harvesting reads competitor/cohort creative the workspace can already
  access (ad-platform pulls, shared folders); it does not scrape new sources.
- Runneth never publishes ads; the deliverable is an HTML brief with the finished
  assets, and a human owns everything downstream.

## Before install — what the team should have on hand

- Product reference photos: 3-5 per product, different angles plus at least one
  in-use shot (the real product, label legible, signature detail visible). Two is
  the hard minimum — below that, generation won't run for that product.
- Whatever copy exists per product: headlines, subheads, CTAs, banned phrases. At
  least one approved headline and CTA per product is required before generating.
- Claims/legal restrictions in any written form (or an explicit "none").
- A Gemini API key for the workspace (interim — drops out once native generation
  ships).
- Where proposed slates should be posted for approval (usually a Slack channel).
