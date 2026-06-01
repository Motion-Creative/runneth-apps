# Product Foundation

Before any strategy work, the product itself has to be understood — features, variations, and the competitive feature map. This file bundles the Step 1 framing from Alysha's framework: a structured product-knowledge layer that downstream creative work depends on.

Current Runneth's `/runneth/references/creative-strategy-engine.md` assumes product context exists. The `product-catalog` skill (also bundled in this pack) collects facts-only product data. This file describes how that product data gets turned into the strategic frame that creative work reads from.

## What product foundation means

Three layers of understanding before strategy:

### 1. Your product

A factual layer (the `product-catalog` skill writes this):

- What does it do?
- What is it made of or what does it contain?
- How does it work?
- What are its functional specifications?
- What does it include?

### 2. Product variations

Different formats, sizes, flavors, tiers, or configurations. Variations matter because different versions may speak to different personas, solve different versions of the same problem, or create different offer framings.

For each variation, capture:

- What's different about this version?
- Which persona is it for?
- Which pain or desire does it map to?

### 3. Competitive feature map

Map the same features for the key competitors. Side by side. The goal is structural clarity:

- What features or attributes do competitors have that you don't?
- What do you have that competitors don't?
- Where do you win on the comparison?
- Where do you lose?

This is not a competitive analysis essay. It's a side-by-side feature table — the kind a sales engineer would build for a procurement evaluation. Visual, structured, scannable.

## Why this is the foundation

When `creative-strategy-engine` runs the pain × persona matrix, the question "which features solve for this person's pain or desire" only has a useful answer if the product-foundation layer is structured.

When `selling-vs-offering` translates features into offers, the input is the feature list from this foundation.

When `competitor-analysis` and the `competitor-intel` use case do their work, the comparative claim "we have X, they don't" requires the feature map.

Skipping this step means downstream skills are inferring product reality from brand-context language, which gets approximate fast.

## How this connects to the brand-audit run

`brand-audit` runs `product-catalog` and `competitor-analysis` as part of its Foundation layer. The output lands at:

- `/agent/brain/brand-audit/<workspace-slug>/product-catalog.md` — the product layer
- `/agent/brain/brand-audit/<workspace-slug>/competitor-analysis.md` — the competitive layer

The pack's orchestrator reads these on Step 0 re-anchor for any creative-strategy or briefing turn.

## The quality bar

A strong product foundation:

- **Distinguishes facts from interpretation.** Product specs are factual. Benefits-to-persona are interpretation. Keep them separated.
- **Names variations as distinct units.** "Our $29 starter pack" and "our $99 pro tier" are not the same product for messaging purposes, even if they share ingredients.
- **Has a side-by-side competitive table, not an essay.** If a feature comparison would take more than one row per feature to express, it isn't structured enough.
- **Identifies the winning and losing comparisons explicitly.** "We win on X" and "they win on Y" — both are required. A product foundation that hides the losing comparisons makes downstream creative work weaker because the team will collide with those gaps in market.

## Anti-pattern

Treating brand-context language as a substitute for product reality. A brand says "premium ingredients" — the product foundation says "150mg sodium, 3g sugar, sourced from X." The latter is what hooks and concepts can actually reference. The former is marketing copy that has to be translated before it can become creative input.
