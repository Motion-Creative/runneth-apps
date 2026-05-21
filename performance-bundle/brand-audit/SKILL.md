---
name: brand-audit
description: Runs the foundation + strategy layer of the creative-strategy framework to produce a durable brand-context bundle. Brand-intake, product-catalog, review-audit, brand-relevant-keywords, competitor-analysis, and creative-strategy-engine, run in order and saved as per-skill markdown files under /agent/brain/brand-audit/<workspace-slug>/. Every creative-deep-dive, every weekly deck, every concept brief reads this bundle as upstream context — it does not get re-run on every creative review. Refreshes once a week to catch new reviews, competitor moves, and persona shifts. Triggers on first install via missing brand-context, explicit invocation ("audit the brand", "build the brand context", "run brand-audit", "refresh the brand"), or the Monday refresh routine.
---

# Brand Audit

You are building the durable strategic context for a brand. Not the paid acquisition strategy — that lives in `paid-strategy-audit`. The brand-level layer underneath it: who this brand is, what it sells, what its customers actually say in reviews, what its competitors are doing, and the pain × persona × messaging-angle matrix every concept brief and creative diagnosis draws from.

The output isn't a report. It's six durable markdown files that every downstream skill reads as context. It runs once on setup and refreshes weekly. It is **not** re-run every time someone wants to review a creative — that would be a waste.

---

## Core principle

**This is the brand layer, not the paid layer.** It sits next to `/agent/brain/paid-strategy/` because it provides the strategic foundation those briefs draw from, but it is not channel-specific. One brand, one bundle. If the brand operates on Meta and TikTok and Pinterest, the brand-audit still runs once. Channel-specific paid strategy lives in `paid-strategy-audit`.

**Durable artifacts, not narrative outputs.** Every file in the bundle is something a downstream skill reads programmatically. Structure matters. Section headers must match what the skills expect.

**Refresh weekly, not on every read.** The Monday morning refresh routine catches new reviews, new competitors, persona shifts. The deep-dive doesn't trigger a re-audit — it just reads the latest bundle.

---

## What this skill produces

Per workspace, in `/agent/brain/brand-audit/<workspace-slug>/`:

1. **`brand-context.md`** — identity, value prop, audience, positioning. Output of `brand-intake`.
2. **`product-catalog.md`** — product list, benefits, claims, price points. Output of `product-catalog`.
3. **`review-audit.md`** — VOC across pain, desire, objection, comparison, and use-case buckets. Output of `review-audit`.
4. **`keywords.md`** — search and language landscape. Output of `brand-relevant-keywords`.
5. **`competitor-analysis.md`** — who they actually compete with, what those competitors are doing in ads, content gaps. Output of `competitor-analysis`.
6. **`strategy.md`** — the pain × persona × messaging-angle matrix mapped across the 5 awareness stages. Output of `creative-strategy-engine`. This is the file the deep-dive's Strategic Layer section reads on every single creative.

Plus:

7. **`_history/<archived-iso>/`** — full prior bundle preserved on every weekly refresh.
8. **`_config/<workspace-slug>.json`** — refresh schedule, ping channels, input sources (brand site URL, competitor list, review sources).
9. The `runneth-apps:brand-audit:read-before-creative v1` block appended to `/agent/user.md` (idempotent, sentinel-guarded).

---

## Execution

### Step 0 — Resolve scope

1. Workspace = Motion context default unless the user named another.
2. Check `/agent/brain/brand-audit/<workspace-slug>/brand-context.md`. If present, this is a refresh, not a first build — keep the existing files in memory for the diff at Step 7.
3. Read the workspace's input sources from `_config/<workspace-slug>.json` if present, otherwise route to the setup skill first.

### Step 1 — Run brand-intake

Invoke the `brand-intake` skill against the configured brand site URL. The skill produces a structured brand-context output covering: brand identity, value proposition, primary audience definitions, positioning vs the category, and the brand's own voice and tone signals.

Save the output to `/agent/brain/brand-audit/<workspace-slug>/brand-context.md`.

### Step 2 — Run product-catalog

Invoke the `product-catalog` skill against the brand site and any uploaded product docs. Produces the full product list with benefits, claims, price points, and any constraint a downstream creative skill needs to know about.

Save to `/agent/brain/brand-audit/<workspace-slug>/product-catalog.md`.

### Step 3 — Run review-audit

Invoke the `review-audit` skill against the configured review sources (Trustpilot, Amazon reviews, internal NPS exports, App Store, G2, anything the team has). The skill mines reviews and categorizes voice-of-customer signal across five buckets: pain points, desires, objections, comparisons, and use cases. Each bucket gets representative verbatim quotes.

Save to `/agent/brain/brand-audit/<workspace-slug>/review-audit.md`.

If no review sources are configured, skip this step and flag it as a gap in the brand-context summary. The Monday refresh will pick it up if sources get added later.

### Step 4 — Run brand-relevant-keywords

Invoke the `brand-relevant-keywords` skill against the brand + product catalog + competitor list. Produces the search-landscape and language map: high-intent keywords, audience-language phrases, category terms, branded terms, and the gap between how the brand talks and how the customer searches.

Save to `/agent/brain/brand-audit/<workspace-slug>/keywords.md`.

### Step 5 — Run competitor-analysis

Invoke the `competitor-analysis` skill against the configured competitor list (or auto-detected competitors if none configured). Produces: who the actual competitors are by category position, what each is currently doing in ads (using `motion inspo-creatives` for active competitor ads), where the content/messaging gaps are, and the brand's strategic moat-vs-vulnerability read.

Save to `/agent/brain/brand-audit/<workspace-slug>/competitor-analysis.md`.

### Step 6 — Run creative-strategy-engine

Invoke the `creative-strategy-engine` skill with brand-context, product-catalog, review-audit, keywords, and competitor-analysis as inputs. Produces the pain × persona × messaging-angle matrix mapped across the 5 awareness stages (Unaware → Problem-Aware → Solution-Aware → Product-Aware → Most-Aware).

This is the single most-referenced file in the downstream creative work — `creative-deep-dive`'s Strategic Layer section reads it on every per-creative run, and `weekly-performance-deck`'s recommendations slide reads it to make sure proposed iterations fit a real persona × pain anchor.

Save to `/agent/brain/brand-audit/<workspace-slug>/strategy.md`.

### Step 7 — Refresh diff (on re-runs only)

If this is a refresh, compare each new file against its prior version. Surface a short summary of what changed:

- New customer pain points appearing in review-audit
- New competitors entering the analysis or existing competitors making material moves
- New persona or messaging angle introduced in the strategy matrix
- Material shifts in product-catalog (new products, price changes, retired claims)

If anything material changed, post to the configured ping channels (same channels as the paid-strategy-audit drift):

> Weekly brand-audit refresh for `<workspace>`. <One-line summary of what changed>. <link to refreshed bundle>. React ✅ to adopt, ❌ to roll back to prior version, ❓ to say you'll review.

Archive the prior bundle to `_history/<archived-iso>/` regardless of whether the new one gets adopted. On approval (or 48h silence + only-additive changes), the new bundle replaces the prior. On rejection, restore from history.

### Step 8 — Install user.md snippet (first run only)

Idempotent via sentinel. If `/agent/user.md` does not contain `runneth-apps:brand-audit:read-before-creative v1`, append:

```markdown
<!-- runneth-apps:brand-audit:read-before-creative v1 -->
### Creative work — read the brand audit first

Before any creative-strategy work (deep dives, hook writing, concept briefs, ad teardowns, brand-relevant copy, weekly deck recommendations) for a workspace with a brand-audit, read the relevant files under `/agent/brain/brand-audit/<workspace-slug>/` first:

- `strategy.md` for the pain × persona × messaging-angle matrix and awareness-stage map (almost always needed)
- `brand-context.md` for identity, value prop, voice and tone
- `product-catalog.md` for benefits, claims, price points, constraints
- `review-audit.md` for voice-of-customer signal across pain, desire, objection, comparison, use-case buckets
- `keywords.md` for audience-language vs how the brand talks
- `competitor-analysis.md` for what competitors are running and where the gaps are

Read narrowly — pull only the file(s) the current task needs. The bundle is durable; the brand-audit refresh on Monday morning keeps it current. Do not re-run brand-audit on every creative review — read the existing bundle.
<!-- /runneth-apps:brand-audit:read-before-creative -->
```

### Step 9 — Schedule the Monday refresh (first run only)

```bash
reminder add --title "Weekly brand-audit refresh" \
  --description "Re-run brand-audit for workspace <workspace-id>. Refresh review-audit and competitor-analysis (most volatile), re-derive strategy matrix on any material shift, ping configured channels for confirmation on material changes." \
  --schedule "every monday at 08:00 <timezone>"
```

Monday morning is intentional — the refresh lands before the Friday deck, so the deck can reference the latest brand context.

### Step 10 — Update INDEX

Append entry to `/agent/INDEX.md`:

```
- path: /agent/brain/brand-audit/<workspace-slug>/ | aliases: brand audit, brand context, brand-strategy bundle, customer-voice, persona matrix, competitor read | note: Durable brand-strategy bundle for <workspace> produced by brand-audit. brand-context.md (identity + voice), product-catalog.md, review-audit.md (VOC), keywords.md, competitor-analysis.md, strategy.md (pain × persona × angle × awareness matrix — most-referenced). Refreshes Monday mornings. Read by creative-deep-dive and weekly-performance-deck. | created: <date> | updated: <date>
```

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

- **Don't re-run brand-audit on every creative deep dive.** Read the existing bundle. Refresh weekly.
- **Don't store the brand-audit output inside `/agent/brain/paid-strategy/`.** Brand is brand-level, not channel-level. It sits next to the paid-strategy library, not inside it.
- **Don't skip review-audit silently when no sources are configured.** Flag the gap; the bundle is incomplete without VOC.
- **Don't merge the strategy matrix into the brand-context file.** Downstream skills expect six separate files at known paths. Don't break the contract.
- **Don't ping a DM with the weekly refresh diff.** Channels only, same as paid-strategy-audit.

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
