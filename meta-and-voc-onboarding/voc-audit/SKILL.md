---
name: voc-audit
description: Run a manual Voice of Customer Audit on customer-language data already synced into the brain. Use when someone accepts the post-sync audit offer or asks for a VoC audit, review audit, customer audit, analysis of reviews, comments, support messages, pain points, objections, trigger moments, transformations, personas, standout language, or what customers are saying. Never auto-run merely because a source connects. Requires at least 200 total VoC entries and organizes findings by product or service.
---

# Voice of Customer Audit

Mine customer reviews, ad comments, support messages, surveys, community posts, and other
customer language for the real pain, buying moments, objections, transformations, personas,
and phrases that should inform creative strategy and ad copy.

**The goal is not to summarize customer feedback. The goal is to find the raw material for
ads and make it durable enough to inform validation and future questions.**

## Run conditions

This skill is always manual:

- Run when a person explicitly asks for a Voice of Customer Audit (including the older name,
  "review audit"), or answers yes to the package's post-sync or onboarding audit offer.
- Do not run merely because a VoC source connects, a sync routine starts, or new files arrive.
- If an affirmative answer arrives before the initial backfill is complete, say the audit
  will be ready when coverage completes. Do not poll or run against a partial backfill.
- A rerun is also manual. New daily VoC files do not silently regenerate the audit.

## What counts as VoC

- **Customer reviews** are generally post-purchase and may contain pains, objections,
  buying triggers, and transformations.
- **Ad comments** may be pre- or post-purchase. Pre-purchase comments are strongest for
  pains and objections; do not manufacture triggers or transformations from them.
- **Customer support messages** are post-purchase but negatively selected. They carry rich
  friction signal and thin transformation signal; never treat their negative skew as a
  verdict on the product.
- **Other customer voice** includes survey responses, DMs, community posts, and sales-call
  notes when they are present in the synced VoC data.

The same method applies across sources, but the audit must name the source mix and account
for each source's bias.

## Step 0 — Locate the synced data before asking anything

The package's canonical source is:

`/agent/brain/data-sources/voc/<platform>/`

Start at `/agent/brain/data-sources/voc/` and inspect all platform folders. Do not ask the
person to paste data or choose an integration before checking what is already synced.

- Use all available VoC sources unless the person requests a particular platform, product,
  or source type.
- Ignore compiled files such as
  `/agent/brain/data-sources/voc/voice-of-customer-audit.md`; the audit's evidence set is
  the id-keyed raw items inside platform folders.
- If the canonical root is absent, use the file-discovery tool to look under
  `/agent/brain/` for another `data-sources/voc/` root. Never use shell `find`.
- If multiple workspace roots exist and the request does not identify one, list the
  workspaces found and ask which one to use.
- Only ask for an upload when no matching VoC data exists in the brain. Say what paths were
  checked and why they came up short.

Record the platform folders, source types, coverage dates, and file counts used. The saved
audit must cite the raw paths it analyzed.

## Step 1 — Count the entries (hard gate)

Count discrete VoC entries across the selected evidence set before analyzing.

**If fewer than 200 total entries are available, do not run the audit.** Report the count,
explain that 200 entries are required for reliable cross-entry patterns, and stop without a
partial audit.

At 200 or more, record the total and proceed.

## Step 2 — Group by product or service

Identify the products or services represented before extracting patterns. Every subsequent
step runs separately per product or service.

- Use the raw record's product reference and the content itself.
- Record the entry count per product.
- If attribution is ambiguous and materially changes the result, ask one focused
  clarification before proceeding.
- If all entries concern one offering, skip grouping.

The 200-entry audit gate is across the selected evidence set. The persona gate in Step 6 is
per product.

## Step 3 — Score entry quality (1–5)

Score every entry for usefulness:

| Score | Meaning |
|---|---|
| **1** | Garbage or no signal: gibberish, emoji-only, or generic fragments such as "great product." |
| **2** | Low signal: short and vague, with little specific detail or emotion. |
| **3** | Moderate: some product or experience detail, but limited emotional depth. |
| **4** | High quality: specific experience, before/after detail, or a meaningful feeling. |
| **5** | Gold: vivid, emotional, detailed customer language with strong creative value. |

Score-5 entries are the priority. For roughly 2,000 or more entries, score
programmatically or in batches rather than one at a time. If sampling is necessary, state
that plainly and record the sample size; never present a sample as an exhaustive read.

## Step 4 — Filter

- Discard score-1 entries.
- Analyze scores 2–5, emphasizing scores 4–5.
- Scores 2–3 may confirm patterns but should not supply featured quotes.
- Never manufacture a theme when too little quality evidence supports it.

## Step 5 — Extract the five insight buckets

Run all five buckets separately for each product or service. In Buckets 1–4, group similar
insights, name the theme, and summarize the cross-entry pattern in two or three sentences.
Do not print quotes inside Buckets 1–4; route every selected quote to Bucket 5.

### Bucket 1 — Pain points

Ask: **What problem were customers experiencing before they found the product?**

Look for duration, prior failed solutions, daily-life effects, and the emotional weight of
the problem. Each theme needs enough repeated evidence to be a pattern.

### Bucket 2 — Trigger moments

Ask: **What finally made them buy?**

Look for the event or realization that turned interest into action: a life event,
recommendation, diagnosis, deadline, breaking point, or exhaustion with alternatives.
Do not infer trigger moments from source types that cannot support them.

### Bucket 3 — Objections before purchasing

Ask: **What nearly stopped them from buying?**

Look for product-level objections an ad can answer: price, skepticism, fear after failed
alternatives, fit, size, ingredients, or uncertainty about results.

Do not turn operational friction outside the product story—shipping delays, courier
problems, service wait times, website issues—into an ad objection. When those patterns are
loud, include one operational flag outside the creative-strategy buckets.

### Bucket 4 — Transformations

Ask: **What changed after they used the product?**

Look for concrete outcomes, emotional shifts, and the customer's own before/after language.
Do not claim transformations from pre-purchase sources.

### Bucket 5 — Standout language and ad-ready phrases

Collect the strongest exact quotes from all buckets in one swipe file. The inclusion test is
whether the language is funny, visceral, candid, surprising, memorable, or unusually
specific—not whether it merely praises the product.

Never rewrite a quote.

- For reviews: `"[Quote]" — [Name or identifier], [X]★`
- For comments or support messages: `"[Quote]" — [Name or handle]`
- Include the product and raw source path or item identifier.
- Briefly state why the phrase stands out.

Flat praise such as "great product" or "highly recommend" does not qualify.

## Step 6 — Build customer personas

Only build personas for a product or service represented by at least 200 entries. Products
below that threshold still receive all five buckets but skip personas.

Identify three to five evidence-backed personas per qualifying product. Never pad the count.
For each persona include:

- **Persona name** — a short, evocative label.
- **Who they are** — life context and identity signals visible in the evidence.
- **Pain** — primary pain from Bucket 1.
- **Trigger** — buying moment from Bucket 2.
- **Objection** — what nearly stopped them from Bucket 3.
- **Transformation** — what changed from Bucket 4.
- **How they talk** — characteristic vocabulary and tone.
- **Estimated share** — a rough proportion of that product's entries, clearly labeled as an
  estimate.

## Step 7 — Save the compiled audit

The chat output is useful for the current conversation; the compiled brain page is what
makes the insights available to validation and future questions.

Write or replace this single canonical file:

`/agent/brain/data-sources/voc/voice-of-customer-audit.md`

This file is compiled understanding, not raw evidence. Never edit the source item files.
Use the Knoweth compiled-page contract:

```yaml
---
page_type: compiled
substance: interpretation
sources:
  - /agent/brain/data-sources/voc/<platform>/<raw-item-file>
last_compiled: <ISO-8601 timestamp>
confidence: <high | medium | low, with a short reason>
tags:
  - voice-of-customer
  - customer-language
  - creative-strategy
  - pain-points
  - objections
  - trigger-moments
  - transformations
  - personas
---
```

List the evidence scope near the top: source platforms and types, coverage dates, total
entries, analyzed entries, discarded score-1 entries, whether sampling was used, and counts
per product. Cite representative raw files for each claim and every quote. A directory alone
is not enough provenance.

On rerun, regenerate this canonical page from the current evidence set. Do not append another
audit or create dated duplicates. Update `/agent/INDEX.md` with one entry and aliases:
`Voice of Customer Audit`, `VoC audit`, `review audit`, `customer insights`, `pain points`,
`objections`, `trigger moments`, `transformations`, `personas`, and `customer language`.
Append a dated `voc-audit-completed` entry to `/agent/brain/_changelog.md` with the evidence
coverage and canonical audit path.

## Output format

Produce a separate section for each product or service:

```text
VOICE OF CUSTOMER AUDIT

Evidence: [platforms and source types]
Coverage: [date range]
Entries received: [X] | Analyzed: [X] | Discarded (score 1): [X]

PRODUCT / SERVICE: [Name]

PAIN POINTS
[Theme]
[Two- or three-sentence evidence-backed summary]

TRIGGER MOMENTS
[Theme]
[Summary]

OBJECTIONS BEFORE PURCHASING
[Theme]
[Summary]

TRANSFORMATIONS
[Theme]
[Summary]

STANDOUT LANGUAGE AND AD-READY PHRASES
"[Exact quote]" — [attribution] · [why it stands out] · [source]

PERSONAS
[Persona name] — approximately [X]% of this product's entries
Who: [...]
Pain: [...]
Trigger: [...]
Objection: [...]
Transformation: [...]
Voice: [...]

OPERATIONAL FLAGS
[Only when loud non-creative friction exists]
```

Keep all verbatim language in the standout-language section rather than scattering quotes
through the theme summaries.

## How downstream work uses the audit

- Pain points inform the pain/desire anchor in creative strategy.
- Trigger moments supply hook material.
- Addressable objections inform objection-handling ads.
- Transformations supply aspirational and social-proof language.
- Standout phrases provide customer-native hook and copy language.
- Personas inform audience, angle, and message decisions.

When validation or a future answer asks why customers respond, what to make next, which
message to test, or what customers love, object to, or misunderstand, read
`voice-of-customer-audit.md` first, then inspect the cited raw evidence when the claim needs
verification or greater detail. The audit informs customer-side WHY; it never substitutes
for live performance metrics or the creative content layer.

## Quality rules

- Clearly separate repeated evidence from inference.
- Treat source bias explicitly.
- Never present sampled analysis as exhaustive.
- Never invent a persona or theme to fill a template.
- Every quoted phrase remains verbatim and attributable.
- Every durable claim in the saved audit traces to raw VoC evidence.
