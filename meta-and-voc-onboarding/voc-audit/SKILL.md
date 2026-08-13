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
- The package's offers preview this skill's method (split by product, score 1–5, the five
  buckets, personas) and invite additions and reference docs. Honor both: a requested
  addition becomes part of this run's output, and supplied reference docs (existing
  personas, positioning docs, brand guidelines) are read before analyzing — map evidence
  onto existing persona names where they genuinely fit, note where the evidence diverges,
  and never force findings into a reference frame the data does not support.

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

The audit is scoped to one Motion workspace. Resolve its brand folder first:
`/agent/brain/brands/<brand>/`, where `<brand>` is this conversation's workspace name
slugged - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen,
trim leading and trailing hyphens ("Bramblewick NYC" -> `bramblewick-nyc`, "St. Fig & Co." -> `st-fig-co`).

The package's canonical source is:

`/agent/brain/brands/<brand>/customer-feedback/<platform>/`

Start at `/agent/brain/brands/<brand>/customer-feedback/` and inspect all platform folders. Do
not ask the person to paste data or choose an integration before checking what is already
synced.

- Use all available VoC sources unless the person requests a particular platform, product,
  or source type.
- Ignore compiled files such as
  `/agent/brain/brands/<brand>/customer-feedback/voice-of-customer-audit.md`; the audit's
  evidence set is the id-keyed raw items inside platform folders.
- Never read another workspace's folder to fill a gap in this one. If this workspace's
  `customer-feedback/` root is absent, its sync has not landed yet - say what paths were
  checked instead of borrowing another workspace's data. If the person explicitly wants a
  different workspace audited, that audit runs from a conversation in that workspace.
- Only ask for an upload when no matching VoC data exists for this workspace. Say what
  paths were checked and why they came up short.

Record the platform folders, source types, coverage dates, and file counts used. The saved
audit must cite the raw paths it analyzed.

## Step 1 — Count the entries (hard gate)

Count discrete VoC entries across the selected evidence set before analyzing. For
`meta-ad-comments`, each comment inside a creative file is one entry (sum the files'
`comment_count`), not one entry per file.

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

Run all five buckets separately for each product or service. In Buckets 1–4, present each
bucket as a **numbered list of distinct findings** — Product → bucket → 1, 2, 3 — never one
flowing paragraph. Each numbered point is a standalone finding stated in one or two clear
sentences, not a blended narrative; a reader must be able to scan the list and take any
point on its own. When a finding is supported by a quote, the quote is unambiguously
verbatim and attributed inline — exact customer wording with the reviewer's name, star
rating where the source has one, and the raw source file — never paraphrased or folded into
prose where it is unclear who said what. A quote is not required on every point; the list
must be scannable and the quotes that do appear must be clean and attributable. A bucket
with no real finding gets one explicit line saying so ("No strong signal in this bucket for
this product") — never a manufactured entry to fill the template.

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

`/agent/brain/brands/<brand>/customer-feedback/voice-of-customer-audit.md`

This file is compiled understanding, not raw evidence. Never edit the source item files.
The saved page uses the same structure as the chat output — numbered standalone findings
per bucket with verbatim attributed quotes inline and explicit no-signal lines — not a
paragraph-summary rewrite; the readable structure applies everywhere the audit lands, not
just the conversation view. Use the Knoweth compiled-page contract:

```yaml
---
page_type: compiled
substance: interpretation
sources:
  - /agent/brain/brands/<brand>/customer-feedback/<platform>/<raw-item-file>
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
audit or create dated duplicates. Update `/agent/INDEX.md` with one entry that names the
workspace (the index is org-wide) and aliases: `Voice of Customer Audit`, `VoC audit`,
`review audit`, `customer insights`, `pain points`, `objections`, `trigger moments`,
`transformations`, `personas`, and `customer language`, each prefixed or suffixed with the
workspace name. Append a dated `voc-audit-completed` entry to
`/agent/brain/brands/<brand>/_changelog.md` with the evidence coverage and canonical audit path.

## Step 8 — Deliver the full audit in the chat

The full compiled audit is the deliverable, not a summary of it. When the audit completes,
present the saved `voice-of-customer-audit.md` file itself in the chat — attach or render
the markdown file so the person can open and read the entire audit — with at most a few
lead-in lines above it (evidence scope, one or two headline findings). Closing with only a
prose summary of highlights is a contract violation: the person must be able to read the
full results in the chat without asking a follow-up or hunting for a file path. This
delivery never depends on the person asking for it, and on a rerun the regenerated page is
delivered the same way.

## Output format

The audit is a markdown document — headings, numbered findings, blockquoted quotes, and a
personas table — in the chat and in the saved page alike. Produce a separate section for
each product or service. The template is literal; every `<...>` is account-specific:

```markdown
## Voice of Customer Audit — <Workspace or brand>

**Evidence:** <total> entries — <platform> (<count>) + <platform> (<count>)
**Coverage:** <date range per source>
**Analyzed:** <analyzed count> read in depth | Discarded (score 1): <count>
<When sampling was used, say so here plainly with the sample size.>

*<Grouping note, italic — e.g. "Treated as one offering because the sources carry no
per-product tagging" — only when grouping was skipped or the split needs explaining.>*

### <Product / service name — omit the heading when there is one offering>

#### Pain points
1. **<Two-to-five-word bold lead>** — <the standalone finding, one or two sentences>.
   > "<Exact quote>" — <Name>, <X>★ · <source file>
2. **<Bold lead>** — <finding; a quote is optional, not required per point>.

#### Trigger moments
1. **<Bold lead>** — <finding>.

#### Objections before purchasing
1. **<Bold lead>** — <finding>.

#### Transformations
No strong signal in this bucket for this product.
<Use this explicit line when a bucket has no real finding — never a manufactured entry.>

#### Standout language
- *"<Exact quote>"* — <attribution> · <why it stands out> · <source>

#### Personas
| Persona | Share | Pain | Trigger | Objection | Transformation | Voice |
|---|---|---|---|---|---|---|
| <Name> | ~<X>% | <...> | <...> | <...> | <...> | <...> |
<Share is an estimate of this product's entries and is labeled with "~". The "Who they
are" context folds into the Persona/Voice cells or one line under the table.>

#### Operational flags (not creative-strategy findings)
- <Only when loud non-creative friction exists — shipping, service, site issues.>

<One closing line: the saved brain page is attached above and is the canonical version
validation and future WHY questions read.>
```

Quotes may support individual findings inline, always verbatim and attributed; the
standout-language swipe file still collects the strongest lines in one place regardless of
where they also appear. Never compress the buckets into prose paragraphs — the numbered
bold-led findings are the format.

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
- Never invent a persona, finding, or theme to fill a template — an empty bucket says so
  explicitly instead.
- Every numbered point stands alone; no blended multi-finding narratives.
- Every quoted phrase remains verbatim and attributable.
- Every durable claim in the saved audit traces to raw VoC evidence.
- The run closes with the full audit markdown file presented in the chat — never a
  summary alone.
