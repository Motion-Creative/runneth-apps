---
name: brand-audit
description: Runs the foundation + strategy layer of the creative-strategy framework to produce a durable brand-context bundle. Brand-intake, product-catalog, review-audit, brand-relevant-keywords, competitor-analysis, and creative-strategy-engine, run in order and saved as per-skill markdown files under /agent/brain/brand-audit/<workspace-slug>/. Every creative-deep-dive, every weekly deck, every concept brief reads this bundle as upstream context — it does not get re-run on every creative review. On-demand only — run it once to build the bundle, re-run it whenever the brand shifts. Triggers on explicit invocation ("audit the brand", "build the brand context", "run brand-audit", "refresh the brand", "refresh brand strategy") or on first creative-strategy request when no bundle exists for the workspace.
---

# Brand Audit

You are building the durable strategic context for a brand. Not the paid acquisition strategy — that lives in `paid-strategy-audit`. The brand-level layer underneath it: who this brand is, what it sells, what its customers actually say in reviews, what its competitors are doing, and the pain × persona × messaging-angle matrix every concept brief and creative diagnosis draws from.

The output isn't a report. It's six durable markdown files that every downstream skill reads as context. Run it once to build the bundle. Re-run it whenever the brand shifts — new reviews, a competitor move, a product launch. It is **not** re-run every time someone wants to review a creative — that would be a waste.

---

## Core principles

**This is the brand layer, not the paid layer.** It sits next to `/agent/brain/paid-strategy/` because it provides the strategic foundation those briefs draw from, but it is not channel-specific. One brand, one bundle. If the brand operates on Meta and TikTok and Pinterest, the brand-audit still runs once. Channel-specific paid strategy lives in `paid-strategy-audit`.

**Durable artifacts, not narrative outputs.** Every file in the bundle is something a downstream skill reads programmatically. Structure matters. Section headers must match what the skills expect.

**Refresh on demand, not on every read.** There is no scheduled routine. When the user asks to refresh, the skill archives the prior bundle, re-derives the files, and shows a short diff in chat. The deep-dive doesn't trigger a re-audit — it just reads the latest bundle.

**Ask once, record in the bundle.** The first run asks the intake questions inline in chat. The answers get recorded inside the bundle files themselves (brand site in `brand-context.md`, review sources in `review-audit.md`, competitor list in `competitor-analysis.md`), so a refresh re-reads them from the bundle instead of re-asking. There is no separate config file.

---

## What this skill produces

Per workspace, in `/agent/brain/brand-audit/<workspace-slug>/`:

1. **`brand-context.md`** — identity, value prop, audience, positioning. Output of `brand-intake`. Records the brand site URL it was built from.
2. **`product-catalog.md`** — product list, benefits, claims, price points. Output of `product-catalog`.
3. **`review-audit.md`** — VOC across pain, desire, objection, comparison, and use-case buckets. Output of `review-audit`. Records the review sources it was mined from.
4. **`keywords.md`** — search and language landscape. Output of `brand-relevant-keywords`.
5. **`competitor-analysis.md`** — who they actually compete with, what those competitors are doing in ads, content gaps. Output of `competitor-analysis`. Records the competitor list (user-provided or auto-detected).
6. **`strategy.md`** — the pain × persona × messaging-angle matrix mapped across the 5 awareness stages. Output of `creative-strategy-engine`. This is the file the deep-dive's Strategic Layer section reads on every single creative.

Plus:

7. **`_history/<archived-iso>/`** — full prior bundle preserved on every refresh.
8. The `runneth-apps:brand-audit:read-before-creative v2` block appended to `/agent/user.md` (idempotent, sentinel-guarded; replaces any v1 block).

---

## Execution

### Step 0 — Resolve scope

1. Workspace = Motion context default unless the user named another.
2. Check `/agent/brain/brand-audit/<workspace-slug>/brand-context.md`. If present, this is a **refresh** — keep the existing files in memory for the diff at Step 7, and pull the brand site, review sources, and competitor list from the existing bundle files instead of re-asking. Skip to Step 0b.
3. If absent, this is a **first run** — ask the intake questions (Step 0a).

### Step 0a — First-run intake (inline, in chat)

Ask these questions in chat before running anything. Keep it to one short message; the user can answer all three at once.

1. **Brand site URL (required).** "What's the brand's primary website? I'll read it to extract identity, value prop, and voice." Don't proceed without a working URL — `brand-intake` needs it.
2. **Review sources (optional, recommended).** "Where can I read this brand's customer reviews? Trustpilot, Amazon product pages, App Store / Play Store, G2, or an export you upload here. If you skip this, the voice-of-customer layer will be a flagged gap until sources are added."
3. **Competitor shortlist (optional).** "Who are the brand's 3-7 closest competitors? If you skip this, I'll auto-detect from the brand site and category."

Record each answer in the corresponding bundle file as it gets written (Steps 1, 3, 5). Do not create a config file.

### Step 0b — Refresh prep (re-runs only)

Archive the entire existing bundle to `/agent/brain/brand-audit/<workspace-slug>/_history/<archived-iso>/` before writing anything new. If the user's refresh request mentions new inputs (a new review source, a new competitor, a changed site), fold them in; otherwise reuse the inputs recorded in the existing bundle.

### Step 1 — Run brand-intake

Invoke the `brand-intake` skill against the brand site URL. The skill produces a structured brand-context output covering: brand identity, value proposition, primary audience definitions, positioning vs the category, and the brand's own voice and tone signals.

Save the output to `/agent/brain/brand-audit/<workspace-slug>/brand-context.md`. Record the brand site URL in the file's header block.

### Step 2 — Run product-catalog

Invoke the `product-catalog` skill against the brand site and any uploaded product docs. Produces the full product list with benefits, claims, price points, and any constraint a downstream creative skill needs to know about.

Save to `/agent/brain/brand-audit/<workspace-slug>/product-catalog.md`.

### Step 3 — Run review-audit

Invoke the `review-audit` skill against the review sources from intake (Trustpilot, Amazon reviews, internal NPS exports, App Store, G2, anything the team has). The skill mines reviews and categorizes voice-of-customer signal across five buckets: pain points, desires, objections, comparisons, and use cases. Each bucket gets representative verbatim quotes.

Save to `/agent/brain/brand-audit/<workspace-slug>/review-audit.md`. Record the sources used in the file's header block.

If no review sources were given, skip this step and flag it as a gap in the brand-context summary. The next refresh picks it up if the user supplies sources then.

### Step 4 — Run brand-relevant-keywords

Invoke the `brand-relevant-keywords` skill against the brand + product catalog + competitor list. Produces the search-landscape and language map: high-intent keywords, audience-language phrases, category terms, branded terms, and the gap between how the brand talks and how the customer searches.

Save to `/agent/brain/brand-audit/<workspace-slug>/keywords.md`.

### Step 5 — Run competitor-analysis

Invoke the `competitor-analysis` skill against the competitor list from intake (or auto-detected competitors if none were given). Produces: who the actual competitors are by category position, what each is currently doing in ads (using `motion inspo-creatives` for active competitor ads), where the content/messaging gaps are, and the brand's strategic moat-vs-vulnerability read.

Save to `/agent/brain/brand-audit/<workspace-slug>/competitor-analysis.md`. Record the competitor list (and whether it was user-provided or auto-detected) in the file's header block.

### Step 6 — Run creative-strategy-engine

Invoke the `creative-strategy-engine` skill with brand-context, product-catalog, review-audit, keywords, and competitor-analysis as inputs. Produces the pain × persona × messaging-angle matrix mapped across the 5 awareness stages (Unaware → Problem-Aware → Solution-Aware → Product-Aware → Most-Aware).

This is the single most-referenced file in the downstream creative work — `creative-deep-dive`'s Strategic Layer section reads it on every per-creative run, and `weekly-performance-deck`'s recommendations slide reads it to make sure proposed iterations fit a real persona × pain anchor.

Save to `/agent/brain/brand-audit/<workspace-slug>/strategy.md`.

### Step 7 — Refresh diff (re-runs only)

If this is a refresh, compare each new file against its archived prior version and surface a short summary in chat:

- New customer pain points appearing in review-audit
- New competitors entering the analysis or existing competitors making material moves
- New persona or messaging angle introduced in the strategy matrix
- Material shifts in product-catalog (new products, price changes, retired claims)

The new bundle replaces the prior one immediately; the prior bundle stays in `_history/<archived-iso>/`. If the user wants to roll back after reading the diff, restore from history. Do not post anywhere else — the diff lands in this chat, nowhere else.

### Step 8 — Install user.md snippet

Idempotent via sentinel. If `/agent/user.md` contains the older `runneth-apps:brand-audit:read-before-creative v1` block, remove it. If it does not already contain the `v2` block, append:

```markdown
<!-- runneth-apps:brand-audit:read-before-creative v2 -->
### Creative work — read the brand audit first

Before any creative-strategy work (deep dives, hook writing, concept briefs, ad teardowns, brand-relevant copy, weekly deck recommendations) for a workspace with a brand-audit, read the relevant files under `/agent/brain/brand-audit/<workspace-slug>/` first:

- `strategy.md` for the pain × persona × messaging-angle matrix and awareness-stage map (almost always needed)
- `brand-context.md` for identity, value prop, voice and tone
- `product-catalog.md` for benefits, claims, price points, constraints
- `review-audit.md` for voice-of-customer signal across pain, desire, objection, comparison, use-case buckets
- `keywords.md` for audience-language vs how the brand talks
- `competitor-analysis.md` for what competitors are running and where the gaps are

Read narrowly — pull only the file(s) the current task needs. The bundle is durable; it refreshes only when the user asks to re-run brand-audit. Do not re-run brand-audit on every creative review — read the existing bundle. If no bundle exists for the workspace yet, run `brand-audit` once before the creative work.
<!-- /runneth-apps:brand-audit:read-before-creative -->
```

### Step 9 — Update INDEX

Append entry to `/agent/INDEX.md`:

```
- path: /agent/brain/brand-audit/<workspace-slug>/ | aliases: brand audit, brand context, brand-strategy bundle, customer-voice, persona matrix, competitor read | note: Durable brand-strategy bundle for <workspace> produced by brand-audit. brand-context.md (identity + voice), product-catalog.md, review-audit.md (VOC), keywords.md, competitor-analysis.md, strategy.md (pain × persona × angle × awareness matrix — most-referenced). Refreshes on demand — re-run brand-audit. Read by creative-deep-dive and weekly-performance-deck. | created: <date> | updated: <date>
```

---

## Re-running the audit

There is no scheduled routine — re-run the skill any time the brand shifts (new reviews to mine, a competitor launch, new products, a repositioning). On a re-run:

1. The prior bundle is archived to `_history/<archived-iso>/` before anything is overwritten (Step 0b).
2. All six files are re-derived from the inputs recorded in the bundle, plus anything new the user mentioned.
3. A short diff lands in chat — new pain points, competitor moves, new persona × angle cells, product shifts.

---

## Standalone skill invocation

Every one of the six skills inside brand-audit is also independently callable. Users can run any of them in isolation:

- `brand-intake` — quick brand-context rebuild from a new URL
- `product-catalog` — refresh product list after a launch
- `review-audit` — VOC pass on a new review corpus
- `brand-relevant-keywords` — keyword landscape for a campaign
- `competitor-analysis` — refresh competitor read
- `creative-strategy-engine` — regenerate the persona × angle matrix

When invoked standalone, each skill writes its output to the same per-workspace path under `/agent/brain/brand-audit/<workspace-slug>/`. The full orchestrator just runs them in order.

---

## Anti-patterns

- **Don't re-run brand-audit on every creative deep dive.** Read the existing bundle. Refresh when the user asks.
- **Don't schedule anything.** No reminders, no recurring refresh routines, no posts to Slack or any channel. The refresh happens when the user asks for it, and the diff lands in chat.
- **Don't create a config file.** Intake answers live inside the bundle files themselves. On refresh, read them from there.
- **Don't store the brand-audit output inside `/agent/brain/paid-strategy/`.** Brand is brand-level, not channel-level. It sits next to the paid-strategy library, not inside it.
- **Don't skip review-audit silently when no sources are given.** Flag the gap; the bundle is incomplete without VOC.
- **Don't merge the strategy matrix into the brand-context file.** Downstream skills expect six separate files at known paths. Don't break the contract.
- **Don't ask the intake questions again on refresh.** They're recorded in the bundle. Only re-ask when the user's request implies an input changed.

---

## What this bundle enables

Any future agent reading the brand-audit bundle can answer:

- What does this brand actually sell, to whom, against whom?
- What do customers actually say about it (verbatim)?
- Which pain × persona combinations have validated messaging angles for them?
- What's the right awareness stage for a given concept?
- Where are competitors gapping the brand right now?
- Which audience-language words and phrases are reusable in copy?

`creative-deep-dive`'s Strategic Layer section is grounded in `strategy.md`. `weekly-performance-deck`'s recommendation slides cross-check proposed iterations against `strategy.md`'s persona × pain matrix to make sure the team isn't shipping creative for a persona that isn't validated. Any future hook-writing, concept brief, or landing-page skill reads the same bundle.
