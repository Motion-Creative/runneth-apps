# Creative Analysis

## Table of Contents

- [Inputs](#inputs)
- [How to Interpret](#how-to-interpret)
- [Metric Interpretation Framework](#metric-interpretation-framework)
- [How to Execute](#how-to-execute)
- [Pattern Extraction](#pattern-extraction)

---

## INPUTS

You receive structured context from Performance Retrieval.

### Data Payload

Raw responses from Performance Retrieval. Depending on what the request required, you may receive data from:

- `motion meta insights`: performance metrics, creative summaries, glossary tags
- `motion tiktok insights`: TikTok performance rows grouped by ad id or ad name
- `motion meta ads age-gender` / `motion meta creatives age-gender`: workspace-wide demographic performance rows, optionally narrowed to exact Meta ad IDs or creative asset IDs
- `motion inspo unique-creatives`: competitor creative data
- Northbeam metrics: attribution data only when the called command returned Northbeam fields. Do not assume Meta creative insights includes Northbeam fields.

### Context Summary

A synthesized snapshot flagging:

- Tools called and query parameters (time range, number of creatives, sorting logic)
- Top and/or underperformers identified with key metrics and notable creative features
- Audience insights showing which demographic segments drive value
- Competitor signals if `motion inspo unique-creatives` was called
- Northbeam status only when a Northbeam-capable command was called

---

## HOW TO INTERPRET

### Shifting Your Lens by Data Combination

What you have determines how you analyze. Shift your focus based on which tools were called:

**`motion meta insights` only.** Focus on what the creative does to the viewer. What stops them, what holds them, what moves them to act. Compare top vs. underperformers to surface what separates them.

**`motion meta insights` with glossary tags.** Layer in pattern recognition. Which creative decisions (hook tactics, formats, messaging angles) correlate with performance? Translate tag patterns into behavioral explanations. Not "question hooks perform 20% better" but "people stop when they feel personally implicated." For strategic interpretation, use the Pattern Extraction section in this file to evaluate concentration vs. baseline and multi-attribute combinations.

**`motion meta insights` + `motion inspo unique-creatives`.** Compare internal performance to competitor creative. What are they doing that we're not? What are we doing that's differentiated? Translate into what viewers in this category seem to respond to.

**`motion meta insights` + `motion meta ads age-gender` / `motion meta creatives age-gender`.** Explain who responds and why. Connect demographic performance to what the creative communicates. Does the message, tone, or visual resonate with a specific life stage, identity, or priority?

**Age and gender breakdown only.** Focus purely on audience dynamics. Where is spend going vs. where is value coming from? Which segments are efficient, which are leaking budget?

**`motion tiktok insights` only.** Focus on TikTok delivery and response at the requested grain. For `ads`, compare individual ad rows. For `adnames`, compare naming-pattern rollups across ads sharing the same normalized name.

**Northbeam metrics present.** Shift focus to _who the creative is acquiring_, not just whether it converts. Is this creative driving new customers or re-engaging existing ones? Is high platform ROAS masking poor acquisition? Which creatives actually grow the customer base?

**Multiple tools combined.** Synthesize across data sources. The goal is one coherent story about audience behavior, not separate sections per tool.

### Northbeam Priority

When Northbeam data is present and populated, use Northbeam metrics as the primary source for conversion and efficiency analysis. People who connect Northbeam trust that attribution over platform self-reported numbers. Respect that.

- ROAS, CPA, conversion counts, revenue: use Northbeam
- Attention metrics (thumbstop, hold rate, thruplay): always Meta
- Engagement (CTR, CPC, CPM) and delivery (spend, impressions): always Meta

Don't preface every metric with "Northbeam shows..." Just use the number as the fact. Only call out the attribution source when divergence between Meta and Northbeam is itself the insight.

---

## METRIC INTERPRETATION FRAMEWORK

Translate metric patterns into behavioral explanations. Lead with the human reaction, then use numbers to confirm.

Metrics are supporting evidence, not the insight itself.
Exception: if someone explicitly asks about Meta attribution or platform-reported metrics, use those.

### Funnel Stage and Creative Format

Choose metrics for the stage being evaluated and the creative's actual format. When both are known from the request or returned data, select the relevant metrics directly instead of asking the user to define hook, hold, click, or convert.

- **Hook (video only):** Use Meta `thumbstop_ratio`, the percentage of impressions that became 3-second video plays. In normalized `motion meta insights` creative metrics, `thumbstopRatio` is the already-calculated `thumbstop_ratio` value; it is not the raw 3-second play count. The raw count is `videoPlay3s` (`video_play_3s`). Do not use `thumbstop_click_rate` as hook rate: it is inline clicks divided by 3-second video plays, so it measures clicking after the viewer stopped.
- **Hold (video only):** Use Meta `video_thruplay_ratio`, the percentage of impressions that became ThruPlays (the video completed or reached 15 seconds). In normalized `motion meta insights` creative metrics, this is `holdRate`; do not look for the unpopulated raw `hold_rate` field. Use the 25%, 50%, and 75% video-view ratios plus average watch time to see where viewers drop.
- **Click (video or static):** Use CTR and outbound/link CTR to evaluate whether the creative produces traffic.
- **Convert (video or static):** Use the relevant conversion rate, CPA, ROAS, and purchase volume to evaluate whether that traffic produces business results.

Never apply video engagement metrics to a static creative. For images and other static formats, evaluate CTR, CPM, CPA, and ROAS instead of thumbstop, hold, video-view progression, or average watch time. In a mixed-format analysis, use video metrics only for video rows and compare shared click/conversion metrics across formats.

### Attention Metrics

| Signal                                                | What it means                                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| High thumbstop + high hold rate                       | The opening promises something and the creative delivers. Viewers feel rewarded for stopping.                                  |
| High thumbstop + low hold rate                        | The opening grabs attention but the payoff doesn't match. Viewers feel baited and bounce.                                      |
| Low thumbstop + high hold rate (among those who stay) | The opening is too quiet to interrupt the scroll, but the content is strong. Weak first impression filtering out good content. |
| Low thumbstop + low hold rate                         | Nothing is working. Doesn't interrupt and doesn't reward.                                                                      |

### Retention Patterns

| Signal                          | What it means                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Strong 3s + steep drop at 15s   | The hook lands but the middle sags. Viewers either got what they needed or lost the thread.                  |
| Gradual decline throughout      | Expected pattern. Evaluate against benchmarks. Steeper than average signals friction or mismatch.            |
| Flat retention then sudden drop | Something specific caused viewers to leave. Look for a shift in tone, introduced friction, or lost momentum. |

### Engagement to Conversion

| Signal                                     | What it means                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| High CTR + low conversion                  | The creative sells the click but the destination doesn't close. Disconnect between ad promise and landing page. |
| Low CTR + high conversion (among clickers) | The creative filters hard. Only high-intent viewers click, and they convert. Efficient but limited scale.       |
| High CTR + high conversion                 | Message-to-market fit. The creative attracts the right people and the destination delivers.                     |
| Low CTR + low conversion                   | Neither the creative nor the destination is working. Start with the creative.                                   |

### Spend as Signal

Spend is the algorithm's vote of confidence. When the platform keeps spending on a creative, it has found real-world evidence that it works. Higher spend means more data, more impressions, and greater business impact.

Spend is also relative to competition and opportunity. A creative's delivery reflects both its own strength and what it had to compete against inside the account. When low delivery matters to the conclusion, explain whether the creative likely failed on its own merits or may have lost the chance to gather signal against stronger incumbents.

Respect the selected metric hierarchy: explicit user metric first, then matching saved ad-performance context from `/agent/INDEX.md` under `/agent/brain/`, then spend for unnamed top ads, top creatives, winning creatives, winners, and top performers. Use `motion workspace-goal` for preferred KPI/setup or attribution context, not as the default ranker for top/winner language. Do not remove low-spend creatives from analysis/report datasets by default; use spend as a reliability and priority signal when judging what matters most. Use spend threshold as qualification context for proven/winning reads, and apply it as a filter only when the user explicitly asked for thresholded data.

When two creatives have similar metrics, the higher-spend one has more data behind it and represents greater business impact — it's more important to understand. A $500-spend creative with 8x ROAS and a $50k-spend creative with 4x ROAS are not equal. The $50k creative is the real story. Stable performance at meaningful spend matters more than low-spend efficiency spikes.

Apply this as the default hierarchy:

- **High spend + strong metric** — The real winner. Patterns here are trustworthy. Insights here matter most.
- **High spend + weak metric** — Priority problem. Budget is being wasted. More urgent than any low-spend underperformer.
- **Low spend + strong metric** — Promising signal, not yet proven at scale. Worth noting, but don't call it a winner.
- **Low spend + weak metric** — Already deprioritized by the algorithm. Not worth deep analysis unless it's brand new.

### Auction Context

CPM is an auction signal, not a creative-quality verdict.

- Higher CPM can mean the audience is more competitive or more valuable, not that the ad is weak.
- Lower CPM can mean the audience is broader or cheaper to reach, not that the ad is strong.
- Read CPM alongside delivery, attention, engagement, and conversion signals. Use it as context, not a standalone judgment.

### Efficiency Metrics

| Signal                 | What it means                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| High ROAS + low spend  | The algorithm found a pocket that works but can't scale it. Narrow audience or fatigue setting in. |
| High ROAS + high spend | The winner. Efficient and scaled.                                                                  |
| Low ROAS + high spend  | The algorithm is spending but the creative isn't converting. Budget leak.                          |
| Low ROAS + low spend   | Already deprioritized. Not worth analyzing unless it's new.                                        |

### Northbeam Acquisition Metrics

| Signal                                                 | What it means                                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| High `northbeamRoasNew`                                | Creative resonates with people who haven't bought before. Doing the hard work of acquisition. |
| Low `northbeamRoasNew` + high `northbeamRoasReturning` | Preaching to the converted. Returning customers recognize it, new ones don't connect.         |
| High `northbeamTransactionsRateNew` (>60%)             | Genuinely prospecting. Saying something that moves people who don't already know you.         |
| Low `northbeamTransactionsRateNew` (<30%)              | Leaning on existing brand equity. Good for retention, not for growth.                         |

### Northbeam Efficiency Metrics

| Signal                                      | What it means                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Low `northbeamCacNew`                       | Efficient acquisition. Earns attention from strangers without burning budget.                          |
| High `northbeamCacNew` + low `northbeamCpa` | Blended number looks fine, but overpaying for new customers. Returning customers subsidize the metric. |
| High `northbeamEcrNew`                      | People who see this and visit the site are converting. Landing experience matches the promise.         |
| Low `northbeamEcrNew` + high `northbeamEcr` | Returning visitors convert, new ones don't. Creative may overpromise or attract the wrong audience.    |

### Meta vs. Northbeam Divergence

When Meta and Northbeam tell different stories, that's the signal worth investigating.

| Pattern                                 | Likely explanation                                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Meta ROAS high, Northbeam ROAS low      | Meta counting view-through conversions Northbeam attributes elsewhere. Creative gets eyeballs but not credit for the full journey. |
| Meta ROAS low, Northbeam ROAS high      | Creative influences conversions outside Meta's attribution window. Doing more than Meta sees.                                      |
| Meta CPA low, Northbeam CAC New high    | Cheap conversions are returning customers. Acquisition is actually expensive.                                                      |
| High spend + high Northbeam returning % | Algorithm optimizing for easy conversions. Creative isn't doing acquisition work.                                                  |

When to prioritize which: Northbeam for strategic decisions about acquisition vs. retention. Meta for in-platform optimization and delivery signals. Both together for understanding the full customer journey.

### Creative Profiles (with Northbeam)

When analyzing multiple creatives with Northbeam data, look for these profiles:

**Acquisition profile.** `northbeamTransactionsRateNew` > 50%, `northbeamRoasNew` within acceptable CAC targets. Often: question hooks, problem-aware messaging, social proof from relatable customers.

**Retention profile.** `northbeamTransactionsRateReturning` > 50%, high `northbeamRoasReturning`. Often: product-focused, brand-familiar visuals, loyalty/subscription messaging.

**Hybrid profile.** Balanced new/returning split (40-60% either way), moderate efficiency across both segments. Often: benefit-led messaging, broad emotional appeals.

**Red flags.** High spend + >80% returning transactions (algorithm coasting on existing customers). Low spend + high new transaction rate (potential winner being under-delivered). Great Meta metrics + poor Northbeam new customer metrics (false positive, not growing the business).

---

## HOW TO EXECUTE

### Analysis Interpretation

For each meaningful signal:

1. Identify what the viewer likely notices first
2. Identify how that makes them feel in the moment
3. Push one layer deeper: what belief, expectation, or fear does that trigger?
4. Explain the chain: what they see, what they feel or assume, what they do in the data

Do not explain the algorithm. Do not explain delivery mechanics. Explain why the viewer's behavior makes sense.

Lead with the human reaction, then use numbers to confirm the pattern.

### Referencing Creatives

When analyzing what an ad communicates, read the summary fields and transcript — not platform copy. Summary fields (`hookOrHeadline`, `creativeBreakdown`, `messagingAndPositioning`) describe what the creative actually shows and says, and `transcript` contains verbatim spoken words when requested. Platform fields (`adText`, `primaryCopy`, `headline` from Creative Metadata) are the text above the ad in the feed, not the creative content itself. Always base hook, messaging, and copy analysis on summary fields.

Never quote or restate creative language. You can reference:

- What kind of visual impression hits first
- Whether the message feels clear, vague, heavy, or effortless
- Whether the visual and message feel aligned or at odds

Describe the experience, not the setup. Don't name formats, structures, or tactics.

### Handling Uncertainty

Express uncertainty when:

- Sample size is small (fewer than 5 creatives, or low spend/impressions)
- Data is contradictory (metrics point in opposite directions)
- Performance is close to average (no clear signal)
- Time range is too short to establish pattern stability
- Northbeam metrics are sparse or show all zeros for most creatives

Be specific: "Early signal, but worth watching..." or "The data leans toward X, though it's not definitive yet..." or "Northbeam data is thin here, Meta metrics are more reliable for this analysis."

Don't overstate weak signals. Don't hedge everything. When the data is clear, be direct.

---

## PATTERN EXTRACTION

You receive the same data types as Creative Analysis above — creative summaries, glossary tags, performance metrics, and optionally competitor data. Creative Analysis explains _why_ viewers respond. Pattern Extraction identifies _what creative choices_ correlate with performance. Layer Creative Analysis insights to explain why extracted patterns work.

### Interpreting Each Data Type

**Creative Summaries.** Your qualitative backbone. Read _across_ summaries looking for descriptions that repeat in top performers and are absent in underperformers. Filter for attributes that _differentiate_ performance tiers, not everything present. Use summaries for texture tags can't capture — two creatives both tagged "UGC testimonial" may differ in execution (raw selfie vs. polished interview). Name patterns in your own language. "Multiple top performers open with an unpolished, mid-sentence-feeling hook" is a pattern. Listing each opening line is not. Watch for treating a single standout creative as a pattern (that's an outlier).

**Glossary Tags.** Your quantitative backbone. Use them to answer: "What share of the total portfolio carries this tag vs. what share of the top performers?" That ratio is where patterns live. Cross-reference combinations — a hook tag + format tag appearing together in winners is stronger than either alone. Use tags to identify what's _absent_ from winners as much as what's present. Watch for treating tag frequency without checking baseline, over-trusting tag precision, and treating tags as explanations.

**Performance Metrics.** Focus on metric _divergences_ within creatives and use metrics to _weight_ pattern strength. For interpretation, use the Metric Interpretation Framework above.

**Competitor Creative Data.** You don't have their performance numbers — read their _creative choices_ as signals about strategic bets. Heavy concentration in a format or angle means they've likely found signal there. Look for what they're _not_ doing. Compare against your winning/losing patterns. Read at the _strategic_ level, not the execution level. Watch for treating competitor choices as validated patterns, assuming absence means opportunity, and over-indexing on one competitor.

**Triangulating.** Tags show concentration. Summaries reveal texture. Metrics confirm correlation. Competitor data provides external validation. When data types conflict, surface the contradiction. Default to the data type closest to the question.

### Extraction Process

**First: Check the Sample Size.** Under 10 creatives — skip the formal process. Describe top vs. bottom in plain language, flag surprising findings, tag everything Directional confidence.

**Step 1: Establish the Baseline.** What does the overall portfolio look like? A creative attribute is only a pattern if it shows up _disproportionately_ in winners or losers relative to its share of the total portfolio. "UGC testimonials are ~25% of the total portfolio but ~60% of the top 10" = pattern. "Problem-call-out hooks appear in 7 of 10 top AND 6 of 10 bottom" = not a pattern.

**Step 2: Look for Combinations.** Single-layer observations are starting points. The real pattern is in the stack: hook approach + visual format + messaging territory + tone + audience signal. Always try to identify at least one multi-attribute pattern for winners and one for losers. If combinations don't hold, say so.

**Step 3: Interrogate the Losing Patterns.** Three types: predictable losses (weak creative), surprising losses (shares winner attributes but still fails — most valuable), and exhaustion signals (once-effective approach now clustering in underperformers).

**Step 4: Look for Missing Combos.** Untested intersections of strong elements. Flag when both elements have above-baseline performance, the combination hasn't appeared, and you can explain why they should work together. Label as test candidates, not patterns.

**Step 5: Assess Pattern Strength.**

| Confidence Level | Criteria                                                          | Downstream Use                  |
| ---------------- | ----------------------------------------------------------------- | ------------------------------- |
| High             | 5+ creatives, clear performance separation, no outlier distortion | Build on this. Reliable signal. |
| Moderate         | 3-4 creatives, or clear separation but one outlier inflating      | Lean in but vary execution.     |
| Directional      | <3 creatives, marginal differences, or contradictory signals      | Treat as hypothesis to test.    |

Be specific about _why_ you're assigning a level.

### Referencing Patterns

Lead with the insight, not the category. "They're leaning hard into raw, confessional-style UGC" not "Visual Format: UGC (45%)." Describe the pattern, not every instance. Approximate portfolio share and concentration in winners/losers to show _why_ it qualifies. Don't quote specific creative language from individual ads.

### Handling Uncertainty

Be direct and specific. "This appears in 4 of 5 top performers, though the total sample is 12. Moderate confidence." When patterns are clear, say so. When patterns conflict, surface the contradiction.
