# Chain: research

Theme triggered: competitor strategy, audience research, market context. "What are competitors doing," "break down this ad," "who is our audience," "what are they running."

## Three sub-paths

### Sub-path A: Competitor strategy (broad, no specific ad named)

User asks about a competitor or competitive space in general.

```
1. Step 0 re-anchor
   ├── /agent/brain/brand-audit/<workspace>/competitor-analysis.md  (existing competitive read)
   ├── /agent/brain/runneth-classic/workspaces/<slug>/watched-brands/competitors.md
   └── /agent/brain/runneth-classic/workspaces/<slug>/watched-brands/inspo.md

2. Brand resolution
   If brand name not yet in watched-brands, call motion search-brands to resolve the ID.

3. Browse the competitor's ad library
   motion inspo-creatives --brand-id <id> --include-glossary --limit 50

4. Deep-dive on top 3-5 creatives
   For each of the top 3-5 by recency or activity:
   motion meta competitor-ad-insights --ad-library-creative-id <id> --include-glossary --with-summary

5. Internal benchmark (when comparison is part of the ask)
   motion meta insights for the user's own top performers in the relevant date range.

6. Pattern extraction
   What is the competitor leaning on (format, hook, messaging, claim)?
   Where is the whitespace vs the user's own approach?

7. Synthesis
   Structure by insight (not by ad). Then implication.
```

### Sub-path B: Specific competitor ad teardown

User references a specific ad (by URL, ID, or shared link).

```
1. Step 0 re-anchor (lighter — strategy.md for context only)

2. Deep-dive directly
   motion meta competitor-ad-insights --ad-library-creative-id <id> --include-glossary --with-summary

3. Pattern explanation
   Hook, mechanic, format, messaging, audience. Behavioral interpretation per /runneth/references/creative-analysis.md.

4. Synthesis
   Lead with what the ad is doing (one sentence). Then the mechanism. Then what's transferable for the user's brand.
```

### Sub-path C: Audience research

User asks about a persona, audience segment, or market without a competitor anchor.

```
1. Step 0 re-anchor
   ├── /agent/brain/brand-audit/<workspace>/review-audit.md  (customer voice)
   ├── /agent/brain/brand-audit/<workspace>/keywords.md  (audience language)
   └── /agent/brain/brand-audit/<workspace>/strategy.md  (persona definitions)

2. External research (only if internal context is thin)
   ├── motion brand-context --data-query "audience research for [persona]"
   ├── corpus-search of bootcamp for relevant frameworks
   └── Optional: WebSearch / WebFetch for cultural trends, with directional framing

3. Synthesis
   Who they are → what they care about → how to reach them.
```

## Plan mode contract

### Sub-path A example:
```
Here's the plan:
- Browse <brand name>'s ad library (last 90 days, with glossary tags)
- Deep-dive 3-5 of their longest-running or most-distinct ads
- Cross-reference your top performers in the same date range
- Output: what they're leaning on, where the whitespace is, what's worth testing

Sound right?
```

### Sub-path B example:
```
Here's the plan:
- Deep-dive on the specific ad you shared
- Output: hook + mechanic + format + messaging + persuasion tactics + what's transferable

Sound right?
```

## Synthesis behavior

### Competitor research
- **Key insight first.** What's the most important finding?
- **Structure by insight, not by competitor.** Group competitors doing similar things together.
- **Implication.** What this means for the user: gaps to exploit, patterns to adopt, risks to avoid.

### Specific ad teardown
- Lead with what the ad is doing (one sentence).
- Then the mechanism: hook → mechanic → format → messaging → audience.
- Then what's transferable. NOT what to copy. Translate the mechanism, change the execution.

### Audience research
- **Who they are** (demographics + psychographics + behavior, prioritized by relevance)
- **What they care about** (pain points, desires, objections, prioritized)
- **How to reach them** (messaging angles, formats, hooks that would land — concrete examples)

## Gallery rendering

Always show the competitor creatives being analyzed via `creative-gallery`. The user wants to see what's being discussed. No metrics for competitor creatives (Brand Insights doesn't return performance data — only metadata + Visual Format tags + copy).

For Sub-path B (specific ad), render the single ad in the gallery.

For Sub-path A (broad), render the 3–5 ads that drove the insights.

## Constraint

- Don't claim competitor performance metrics. Brand Insights and Mondrian Ad Insights return creative metadata and content analysis, not performance data.
- Don't fabricate competitor spend, ROAS, or any commercial metric not returned by the tools.
- Translate the mechanism, change the execution. Never recommend copying.

## Always end with

Single yes/no Next steps question: "Want me to build 3 concepts inspired by what's working for them?" or "Want me to compare their format mix to yours?"
