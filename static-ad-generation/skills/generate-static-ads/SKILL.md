---
name: generate-static-ads
description: >
  Run on "generate a static", "make a static ad", "spin up statics for a product",
  "regenerate this", or an approved slate from the scheduled batch. Turns a request into
  finished 4:5 static ads: load per-product context, select template and hook (or use
  the named one), build a reference-images-only prompt with Copy Bank text, guard for
  placeholder leaks and banned claims, generate, enforce ratio, diff against reference
  photos, assign ID and name, deliver one HTML brief, and update the ledgers.
---

# Generate Static Ads

## Step 0 — Scope

Confirm: product(s), count, and whether the template is user-specified or
auto-selected. If `/agent/brain/static-ad-generation/<scope>/config.json` or the
product's context folder is missing, hand off to `setup-static-ad-generation`.

**Readiness check (blocking):** the product must meet the setup skill's readiness
bar — at least 2 real reference photos (angles + in-use coverage, label legible),
a Copy Bank with at least one approved headline and CTA, and a recorded claims
posture. Below the bar, do not generate a weaker ad: name exactly what's missing,
collect it, and update readiness in config. In batch mode a not-ready product is
skipped with a note in the delivery message, never silently generated anyway.

## Step 1 — Load context, in full

Read: the product spec (reference lock, accuracy traps, do-not-claim list, Copy Bank,
product-specific overrides), product data, the **shared brand kit** at
`/agent/brain/<brand>/brand-kit.md` (fonts, colors, logo rules, default casting —
plus `motion brand-context` for voice; locate via `/agent/brain/brain-map.md` on
organized brains), the product's learning log,
`templates/routing-index.json` + `templates/prompt-pack.md`, the central
`claims-safety.md` (entire file), the reference-image directory, and
`dedup-ledger.json`. The archived legacy registry set, where present, is explicitly
not read.

## Step 2 — Select template + hook (skip when user-specified)

Score each eligible pattern on (a) own-account performance signal, (b) cohort signal,
(c) an untested bonus; learning-log entries promote or hard-suppress patterns; break
ties by fit tier. Apply the rules:

- **Hard dedup gate:** remove every format+hook cell already in the ledger before
  scores are final. A covered cell is only recyclable after all untested cells are
  exhausted, as a deliberate refresh with a new hook tactic.
- **Guaranteed slots:** entries in `templates/guaranteed-queue.json` get a slot
  regardless of score, then move to the queue's generated list and revert to normal
  scoring next run.
- **Hook variation:** vary the hook tactic across a product's slate; never repeat one.
- **Cross-product rendering:** when the target product is not the pattern's origin
  product, pass the origin prompt as structural reference only — the target's
  reference photos carry all product fidelity.

## Step 3 — Build the prompt (reference-images-only)

Populate the chosen pattern's skeleton. The prompt covers **only** structure/layout,
scene/background, on-image copy, staging, and ratio. On-image copy comes verbatim from
the product's Copy Bank. Never describe product geometry; never include a negative
"do not render" list.

```
Create a finished, publication-ready 4:5 static ad image (<dimensions>) for <product>.

STRUCTURE / LAYOUT: <layout from the chosen template pattern>
SCENE / BACKGROUND: <scene; strong figure/ground contrast required>
ON-IMAGE COPY (render verbatim): "<headline>" / "<subhead>" / "<CTA>"
STAGING: product is the large grounded hero (~55-60% of frame), soft contact shadow,
never floating, signature detail toward camera
CASTING: <casting rule: shared brand kit default, or the product spec's override>
ASPECT RATIO: 4:5
```

## Step 4 — Guard gate (blocking)

Scan the populated prompt for unresolved placeholder tokens and banned claims
(claims-safety doc plus the product's do-not-claim list). A failed prompt never
reaches the model — fix and re-guard.

## Step 5 — Generate

Call the image model per `references/generation-api.md`: reference photos passed
first (signature-detail image leading), prompt text after. Decode and save the raw
image to the product's generation-run directory.

## Step 6 — Ratio enforcement (blocking)

Outside tolerance: discard and retry, up to a few attempts. In tolerance: clean
upscale to exact target dimensions — never distort-resize.

## Step 7 — Fidelity + quality review (blocking)

Diff the rendered image against the actual reference photos — never against spec
text: signature-detail accuracy, exact label microcopy, contrast, product scale,
correct casting, no banned claims or placeholder text on the image. Drift means
re-pass the correct references and regenerate; never add a product description to
force fidelity. Nothing that fails is presented as approval-ready.

## Step 8 — ID + naming

Assign the next sequential asset ID (the reference-image directory is the source of
truth for the running ID) and build the ad name from the workspace naming convention
and registries.

## Step 9 — HTML brief

Produce one self-contained HTML file with the finished images embedded — the canonical
deliverable. Batches get one combined brief. Save to the run directory and `artifacts`
with a dated, ID-tagged filename.

## Step 10 — Record-keeping

Before the turn ends: learning-log entry, dedup-ledger record for each format+hook
cell, metadata counters and tested-template list, and copy the finished image into the
reference-image directory under its asset ID (it becomes a future reference).

## Step 11 — Deliver

In chat: an openable link to the brief. In the configured channel: a structured
message with the link, per config's delivery destinations. In batch mode, one failed
item is logged and skipped — it never blocks the rest of the batch.

## Scheduled batch notes

The selection routine posts a proposed slate to the approval channel and stores the
message reference; the check routine reads the thread and generates only what carries
an explicit approve signal — a decline stops that item cleanly. A prior week's
completed batch never suppresses the next selection; only a batch already built for
the current target week is skipped. A failed scheduled read alerts the configured
owner; it is never a quiet run.
