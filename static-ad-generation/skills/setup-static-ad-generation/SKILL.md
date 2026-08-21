---
name: setup-static-ad-generation
description: >
  Run on "set up static ads", "set up static ad generation", "configure static ads", or
  first use after install. Interview-driven setup: builds per-product context (reference
  photos, copy bank, claims and do-not-say rules, brand kit) reading the workspace brain
  and connected integrations before asking, connects and verifies image generation,
  seeds the template pack, and optionally stands up the weekly approval-gated batch
  routine.
---

# Setup: Static Ad Generation

Direct questions, friendly tone. Plain language, no technical terms — prefer words from
a creative strategist's vocabulary (say "templates" and "guidelines", not "routing
index" or "prompt pack") in anything user-facing. Never show file paths, JSON, or API
language unless they ask.

## Scope

All durable state lives at `/agent/brain/static-ad-generation/<scope>/` where `<scope>`
is the Motion workspaceId (from the system context or `motion workspaces`; use the
organizationId for a single-brand org). Never invent a slug.

```
config.json                    — products, delivery, approval channel, routine cadence, owner, status
claims-safety.md               — central claims rules, one section per product; read in full before any copy
templates/routing-index.json   — pattern list, priority order, performance-tag and hook maps
templates/prompt-pack.md       — the reusable pattern prompts (layout/scene/on-image copy only)
templates/guaranteed-queue.json — approved templates that get a slot regardless of score
dedup-ledger.json              — format+hook cells already produced
products/<product>/
  product-spec.md              — reference lock, accuracy traps, do-not-claim list, Copy Bank,
                                 product-specific casting/style overrides
  product-data.md              — claims, ingredients, usage
  learning-log.md              — active insights that promote or suppress templates
  reference-images/            — real product photos; also the source of truth for the running asset ID
  metadata.json                — templates already tested, ID counter
```

## Brand source of truth (shared across packages)

Brand facts are never package-private. Read, in order, and write learned brand facts
back to layer 2 — never into this package's folders:

1. `motion brand-context` — canonical strategy: voice, tone, positioning, products.
2. `/agent/brain/<brand>/brand-kit.md` (+ `assets/`) — the shared visual kit: fonts,
   colors, palette, logo rules, default casting, living in the brand's brain folder
   per the brain's brand schema (the folder carries the brand's name; the workspace ID
   stays the recorded authority). On organized brains, locate it via
   `/agent/brain/brain-map.md`. Every creative package reads and maintains this one
   file; if it does not exist yet, create it in the brand's folder and declare it in
   the brain map — never a package-private copy.
3. `/agent/brain/brand-audit/<scope>/` — the strategy matrix, when a brand audit ran.

Product folders hold only product-specific overrides (a casting rule that differs for
one product), and those live in `product-spec.md` with a note of what they override.

## Per-product readiness bar (hard requirement)

A product is **generation-ready** only when all three are on file. Record readiness
per product in `config.json`; nothing generates for a product below the bar.

1. **Reference images — the non-negotiable.** Minimum 2 real product photos, target
   3-5, covering different angles and at least one in-use/context shot. Label legible,
   signature detail visible, no renders or mockups in place of the real product. One
   photo, or photos where the label can't be read, is below the bar: say specifically
   what's missing ("I have the front — I need one angled shot and one of it in use")
   rather than re-asking generically.
2. **Copy Bank minimum.** At least one approved headline and one CTA per product —
   on-image copy is rendered verbatim, never improvised, so an empty Copy Bank means
   nothing can be written on the ad. Drafting copy for the team to approve into the
   Bank is fine; generating with unapproved copy is not.
3. **Claims posture.** Either claims/legal rules on file, or the team's explicit
   confirmation that no restrictions exist — recorded, not assumed.

## Phase 1 — Artifacts first, then the gaps

Gather before asking:

1. Read the brand source of truth (above): `motion brand-context`, the shared brand
   kit in the brand's brain folder, and the brand-audit bundle when present.
   Fonts, colors, voice, and casting found there are never re-asked.
2. Scan this conversation and the workspace brain for existing product photos, copy
   docs, claims rules, and naming context — the Meta onboarding account context and
   naming decoder live at `/agent/brain/<brand>/integrations/meta/` on brains with
   the brand schema, or at the legacy `/agent/brain/<workspace>/data-sources/meta/`
   path.
3. Check connected integrations for where creative assets and performance data already
   live (ad platform, Drive, Slack channels).
4. Open with one question: "Do you have product photos, ad copy, brand guidelines, or
   claims/legal rules written down anywhere? Share whatever you have and I'll build
   from it — the photos become the reference the ads are generated from, and the rules
   become the guardrails every ad is checked against." Brand guidelines shared here
   (fonts, colors, logo rules) are written into the shared brand kit, not this
   package's folders.

Then send **only the questions the artifacts left open**, batched into one message with
bolded section headers and bullets — never as prose paragraphs or one at a time. Tell
the user they can answer everything in one reply: typed, pasted files, or a voice note.

```
**Products**
- Which products should I generate statics for first?
- For each: drop 3-5 real product photos — different angles plus at least one of it
  in use, label legible, the signature detail visible. (These carry all product
  accuracy in generation, so more coverage means better ads. Two is my minimum to
  start.)

**Copy and claims**
- What headlines, subheads, and CTAs do you already use per product?
- Anything you can never say — claims, comparisons, words legal has banned?

**Where results go**
- Where should I post finished ads and proposed weekly slates for approval?
  (Usually a Slack channel — I'll post, you approve or decline in the thread.)

Answer however is easiest — type it out, paste files, or send one voice note.
I'll follow up only on whatever's missing.
```

Never proactively offer to build an app, dashboard, or new surface — results are
delivered as HTML briefs and Slack messages in the tools the team already uses. If the
user explicitly asks for an app, build it; just never steer them there.

## Phase 2 — Naming

Read the Meta onboarding naming decoder and account-context naming section first; when
found, confirm in one line that generated ads should follow the same scheme. Only when
neither exists, reverse-engineer from three recent ad names or propose a simple scheme.
Write the result into the workspace naming files this package's generation step reads.

## Phase 3 — Generation key

Image generation currently calls a Gemini image model with a workspace API key (see the
generation skill's `references/generation-api.md`; a native token-billed tool is coming
and will remove this step entirely). Collect the key through the standard secret-input
flow — never paste keys in chat, never hand-roll credentials — and verify it with one
bounded test call before recording generation as ready in config. If the native
image-generation tool is already available in this environment, use it and skip key
collection.

## Phase 4 — Template seed

Seed `templates/` in priority order: (a) patterns minted from the team's own winning
statics when they can share them, (b) a harvest pass over competitor/cohort creative
already accessible to the workspace (run `static-template-library`), (c) a small
sensible default pattern set. Every template is a layout/scene/on-image-copy prompt
skeleton — product geometry never appears in template text.

## Phase 5 — First run, then the routine

1. Generate one static for one product as a supervised first pass — only a product
   that meets the readiness bar; if none does, the specific gaps are the blocker to
   name, not a reason to lower the bar. Walk the reviewer through the result and fold
   corrections into the product spec and templates.
2. Only after the first pass is accepted, offer the weekly batch: with the user's
   explicit confirmation of cadence, channel, and products, create the selection
   routine (posts a proposed slate, waits) and the companion check routine (reads
   approvals, runs generation). Default cadence weekly; recurring routines can run at
   most once per hour, and failure alerting must be written into each routine's
   `--prompt` and `--delivery` — there is no platform alert flag.
3. Write `config.json` with products, delivery and approval destinations, routine
   cadence, owner to alert on failures, and status.

## Reconfiguration

Re-running this skill updates config in place: adding a product builds its context
folder, new photos re-anchor the reference lock. Confirm what is changing; never
silently reset the dedup ledger, learning logs, or template pack.
