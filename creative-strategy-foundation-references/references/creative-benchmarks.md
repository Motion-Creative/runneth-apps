# Creative Benchmarks 2026

Use this reference when interpreting `motion benchmark-compare` output.

This is the canonical benchmark policy for benchmark compare interpretation, scope, truthfulness, CH-008 limits, sample-size caveats, and user-facing narration.

## Table of Contents

- [What This Benchmark Covers](#what-this-benchmark-covers)
- [Supported Scope](#supported-scope)
- [Current Parity Snapshot](#current-parity-snapshot)
- [Surface Parity Matrix](#surface-parity-matrix)
- [Main Parity Gaps](#main-parity-gaps)
- [Source Timing Context](#source-timing-context)
- [Creative Leaders](#creative-leaders)
- [Vertical Visual Format Leaders](#vertical-visual-format-leaders)
- [Interpretation And Recommendations](#interpretation-and-recommendations)
- [Golden Findings](#golden-findings)
- [Common Benchmark Patterns](#common-benchmark-patterns)
- [Creative Testing Prompts](#creative-testing-prompts)
- [Recommended Benchmark Flows](#recommended-benchmark-flows)
- [Benchmark Metrics](#benchmark-metrics)
- [Source Mapping](#source-mapping)
- [Supported Benchmark Labels](#supported-benchmark-labels)
- [Category Resolution Rules](#category-resolution-rules)
- [Suppression And Guardrails](#suppression-and-guardrails)
- [Answering Rules](#answering-rules)
- [Safe Evidence-Backed Asks Today](#safe-evidence-backed-asks-today)
- [Out-Of-Scope Or Partially Supported Asks](#out-of-scope-or-partially-supported-asks)
- [Unsupported Requests](#unsupported-requests)

---

## What This Benchmark Covers

`motion benchmark-compare` compares the current workspace to Motion's 2026 creative benchmark pack using a deterministic backend-owned slice.

The benchmark pack is a packaged backend-owned benchmark dataset. Its `sourceRef` fields are stable internal provenance IDs, not repo file paths.
This file covers both benchmark contract semantics and strategic interpretation, including golden findings and what-to-test-next guidance.

## Supported Scope

- Time window: `last_30d` only
- Slice dimensions: spend tier, plus brand category for testing volume only
- Goal type: workspace context only; not a benchmark slice dimension
- Source of truth: backend `BenchmarkCompareService`

Do not describe the benchmark as objective-specific. Do not claim `last_90d` support.

## Current Parity Snapshot

- This system is no longer just a narrow summary compare, but it is also not full notebook/report parity
- Best current description: strong summary compare parity plus partial segment-intelligence parity
- Use the parity bar from the benchmark parity plan as: published report parity plus explicitly approved notebook-only extras
- Do not describe the current system as "full notebook parity," "run the whole notebook," or "complete report parity"

## Surface Parity Matrix

- `CH-003`, `CH-005`, `CH-006`, `CH-007`: shipped summary compare surface and the closest current layer to parity, but still subject to workspace-side approximation and `testingVolumePerWeek` meaning caveats
- `CH-008`: partially shipped as contextual spend-tier baselines; not full notebook-style top-account parity logic
- `CH-009`, `CH-011`, `CH-012`: partially shipped as curated overall creative prompts through `creativeLeaders`; not a full workspace-vs-benchmark segment research surface
- `CH-010`: partially shipped through `verticalVisualFormatLeaders` for the resolved benchmark label only; not full segment-benchmark parity across all possible category questions
- `CH-004`: explanation guidance only; there is no dedicated deterministic runtime surface today
- `CH-001`: not shipped as a relationship-analysis surface today
- `CH-002`: not shipped as a distribution-analysis surface today
- Notebook-only derived outputs such as diversity score and volume bins: not shipped as benchmark product surfaces today

## Main Parity Gaps

- `testingVolumePerWeek` still has methodology risk; current output preserves the benchmark number and source family, but not always the exact statistical meaning from the source bundle
- `CH-008` is intentionally productized as context, not as full notebook parity logic
- Workspace-side math still uses explicit approximation flags for winner threshold, mid-range classification, and spend-tier derivation
- The benchmark canon is still packaged in backend-owned code, not a generated benchmark artifact pipeline
- The current system is still compare-centric, not the broader benchmark API family described in the parity plan
- Relationship analysis, distribution analysis, and notebook-only exploratory outputs are still outside the shipped benchmark surface

## Source Timing Context

- `benchmarkSlice.releasedAt` is the pack publish date
- `benchmarkSlice.dataWindow.start` and `benchmarkSlice.dataWindow.end` are the source analysis window
- The source window spans a high-pressure period that includes pre-holiday testing, BFCM, and the post-holiday reset
- Mention these dates only when the user asks about benchmark recency, seasonality, or why the benchmark may reflect a specific market period
- Do not lead normal benchmark answers with the source dates unless timing is part of the user's question

## Creative Leaders

- `creativeLeaders.visualFormats`, `creativeLeaders.hookHeadlineTactics`, and `creativeLeaders.assetTypes` are curated overall report leaders from `CH-009`, `CH-011`, and `CH-012`
- Each creative leader group includes a plain-English `title`; use that title or the leader names in normal answers instead of raw `chartId`
- Use them when the user wants direct format, hook, or asset testing ideas grounded in the benchmark source
- Treat them as curated overall report-level prompts, not full ranked leaderboards or spend-tier-specific or vertical-specific guarantees
- Do not call them "best in the dataset," "the top tactic overall," or other exhaustive superlatives unless the runtime returns a full ranking that supports that wording
- When a leader has a high `spendUseRatio`, describe it as above-weight spend capture relative to usage, not as an algorithm or platform mechanism claim
- If the resolved benchmark label was inferred or fell back to `other`, be especially careful with prescriptive creative advice

## Vertical Visual Format Leaders

- `verticalVisualFormatLeaders` is the source-backed `CH-010` block for the resolved benchmark label only
- Use `verticalVisualFormatLeaders.sourceVerticalLabel` in normal narration instead of saying `CH-010`
- Use `verticalVisualFormatLeaders.spendUseLeaders.title` or `verticalVisualFormatLeaders.hitRateLeaders.title` when you need to distinguish which CH-010 leaderboard you are citing
- `spendUseLeaders` and `hitRateLeaders` are separate source leaderboards; do not blend them into one ranking
- Treat these as vertical-specific testing prompts, not exhaustive rankings, causal proof, or guaranteed winners for the current account
- Do not explain a CH-010 format as winning because of an invented mechanism; stay descriptive about hit rate, spend capture, and sample-size caveats
- If `verticalVisualFormatLeaders.hitRateLeaders.leaders[*].spendUseRatio` is `null`, the packaged benchmark source recorded no ratio; do not invent one

## Interpretation And Recommendations

Use the live benchmark output for numbers. Use the sections below for meaning, recommendations, and what-to-test-next guidance.

- Do not invent unsupported benchmark modes, objective-specific slices, or new benchmark numbers
- Do not use this reference to replace the live benchmark tool or recompute benchmark math

## Golden Findings

- Winners are rare. Roughly 5% of creatives become winners, and the 10x winner threshold sits around the 92.3rd percentile. A normal account should expect winners to be uncommon, not routine
- Scale changes frequency, not fundamentals. Higher-spend accounts surface more winners largely because they test more creative volume, not because they can perfectly predict success
- Hit rate needs context. A higher hit rate can reflect sharper selection, but it can also reflect lower testing volume
- Mid-range creatives matter. They are not failed winners; they are the stable middle of the portfolio that can keep spend working while new tests run
- Top-quartile accounts test materially more. In the source, Medium accounts move from about 6.6 to 15.9 creatives per week and Large accounts move from about 11.2 to 31.1. Use that as directional context for volume ambition, not as a mandate to copy every number literally

## Common Benchmark Patterns

- Below benchmark on testing volume, above benchmark on hit rate: do not frame the account as weak. The likely opportunity is broader testing, not harsher judgment on current ideas
- Above benchmark on testing volume, below benchmark on hit rate: the account is generating enough attempts, but fewer of them are turning into winners than the peer baseline
- Winner share strong, loser share also high: that can be aggressive testing rather than failure. Check whether spend is still concentrating into winners and mid-range creatives before calling it a problem
- `priorityGaps` empty: do not invent a failed benchmark story. Frame the result as near benchmark, mixed, or worth watching

## Creative Testing Prompts

These findings come from the report's "Anatomy of Winning Ads" section. Treat them as source-backed testing prompts, not causal guarantees.

### Visual Formats

- `Offer-First Banner`: strong scale format in the report, with high hit rate and above-weight spend capture
- `Demo`: reliable high-volume format that appears strong in both winner production and spend capture
- `Unboxing`: stronger hit-rate signal than its share of usage would suggest; useful when the brand has product reveal potential
- `Celebrity`: not the highest hit-rate format, but it captures outsized spend when it works
- `Testimonial`: common and still useful, but do not assume the market's most-used format is automatically the highest-upside next test

### Hooks And Headlines

- `Newness`, `Sale Announcement`, and `Price Anchor` show up as strong hit-rate or spend-capture signals
- `Urgency` and `Offer Only` are not subtle, but they repeatedly show up because they make the reason to act easy to understand
- `Curiosity`, `Confession`, and `Contrarian` can work as scroll-stoppers, but should usually be tested alongside a clearer commercial message rather than replacing it

### Asset Types

- `Text Only` and `Product Image with Text` outperform what many teams expect. Simplicity and clarity can beat heavier production when the message is strong
- Text-forward assets are especially useful when the brand needs more learning velocity
- Higher-production assets can still matter for credibility or polish, but they should not crowd out cheaper, faster experiments

### Vertical Variation

- Format winners are not universal. The report explicitly shows that strong formats vary by vertical
- Health and Wellness examples in the source lean toward formats like `Stitch`, `Reaction Video`, and `Unboxing`
- Fashion and Apparel examples lean toward formats like `Post It`, `Quiz`, and `Stylized Product Shot`
- Use overall winners as starting points. If the resolved benchmark label is specific enough, mention that vertical patterns can differ before making prescriptive format calls

## Recommended Benchmark Flows

- Benchmark only for supported creative benchmark metrics: `motion benchmark-compare` plus this reference
- Benchmark-backed testing ideas: `motion benchmark-compare` plus this reference; use returned `creativeLeaders` and `verticalVisualFormatLeaders` before pulling more data
- Benchmark plus diagnosis for supported creative benchmark metrics: `motion benchmark-compare` first, then `motion workspace-goal` -> `motion meta insights` if the user wants to know why the gap may exist
- Benchmark plus own-account examples for supported creative benchmark metrics: `motion benchmark-compare` first, then `motion workspace-goal` -> `motion meta insights` if the user wants benchmark context plus current-account examples to study

The benchmark step should come first so the account is compared against the right peer baseline before diagnosis or ideation begins.

Benchmark compare alone supports benchmark-pattern interpretation and benchmark-backed testing prompts, not specific operational-cause diagnosis.

### Fresh benchmark calls

- If a follow-up benchmark answer depends on the current workspace numbers, rerun `motion benchmark-compare` instead of relying on earlier turn memory
- Do not reuse spend tier, resolved benchmark label, or raw benchmark values from a prior benchmark call unless the user explicitly wants the earlier result reused
- Keep metric narration aligned to the current call; do not mix launch-cadence metrics like `testingVolumePerWeek` with active-window outcome metrics like `winnersPerMonth` as if they were directly interchangeable

### Benchmark-only answer shape

- Open with the supported benchmark window, the resolved benchmark label, and the single most important scope or causality limit before interpretation or recommendations
- If the user's benchmark premise conflicts with the returned data, correct that premise directly before explaining anything else
- Keep brand-category wording attached only to metrics whose returned `metricScopes` support it; on the current shipped surface, that means `testingVolumePerWeek` only unless the runtime explicitly returns broader category scope

## Benchmark Metrics

`motion benchmark-compare` returns only these benchmarked metrics:

- `testingVolumePerWeek`
- `hitRatePercent`
- `winnerCreativeSharePercent`
- `midRangeCreativeSharePercent`
- `loserCreativeSharePercent`
- `winnerSpendSharePercent`
- `midRangeSpendSharePercent`
- `loserSpendSharePercent`
- `allAccountsWinnersPerMonth`
- `topQuartileCreativeVolumePerWeek`
- `topQuartileWinnersPerMonth`

It does not return CTR, CPC, CPM, ROAS, CPA, thumbstop, hook rate, conversion rate, or platform-specific rate benchmarks. Do not call `motion benchmark-compare` for those metrics.

### Metric scope rules

- `testingVolumePerWeek` can be scoped by spend tier and brand category
- All other benchmark deltas are spend-tier only
- `allAccountsWinnersPerMonth`, `topQuartileCreativeVolumePerWeek`, and `topQuartileWinnersPerMonth` are spend-tier context baselines from `CH-008`, not the primary peer delta benchmark

Only describe a metric as category-specific when the returned `metricScopes` and provenance support that statement.

### Metric scope language

- `spend_tier`: say "for brands in your spend tier"
- `spend_tier_and_brand_category`: say "for [resolved benchmark label] brands in your spend tier"
- Do not smear category-specific wording across spend-tier-only metrics

### Delta semantics

- `benchmarkSlice.key` is the composite benchmark slice identifier: `<spendTier>__<brandCategory>`
- `absDelta` uses the native unit of the metric
- `pctDelta` is a unit ratio relative to the benchmark, not percentage points
- Example: `pctDelta: -0.2679` means the workspace is 26.79% below benchmark

## Source Mapping

These chart IDs are the benchmark provenance anchors surfaced in evidence:

- `CH-003`: spend-tier testing volume and hit rate baseline
- `CH-005`: loser / mid-range / winner creative share by spend tier
- `CH-006`: loser / mid-range / winner spend allocation by spend tier
- `CH-007`: testing volume by vertical and spend tier
- `CH-008`: top-quartile vs all-accounts creative volume and winners per month

Use evidence `title` and `summary` in plain English in normal answers. Only surface raw chart IDs when audit detail is explicitly requested.

## Supported Benchmark Labels

The benchmark taxonomy supports these labels:

- `automotive`
- `beauty_personal_care`
- `education`
- `entertainment_media`
- `fashion_apparel`
- `finance`
- `fitness_sports`
- `food_nutrition`
- `health_wellness`
- `home_lifestyle`
- `other`
- `parenting_family`
- `pets`
- `professional_services`
- `technology`
- `travel_hospitality`

## Category Resolution Rules

Workspace brand category can resolve in three ways:

- `exact`: the workspace category directly matched a supported benchmark label
- `inferred`: the workspace category was mapped to the closest supported benchmark label using brand context signals
- `fallback_other`: no stronger supported match existed, so the benchmark label fell back to `other`

When resolution is inferred or falls back:

- State the original workspace category
- State the resolved benchmark label
- Do not imply the mapping is exact

Example:

- Original workspace category: `Home Goods`
- Resolved benchmark label: `home_lifestyle`

## Suppression And Guardrails

These benchmarks are descriptive peer baselines, not causal proof.

Always communicate guardrails before prescriptive advice:

- Minimum workspace creative count applies
- Brand categories with fewer than 50 accounts are remapped to `Other`
- Benchmark compare does not prove why a metric moved
- If the user asks why a gap exists, benchmark compare alone supports only pattern framing unless the benchmark-plus-diagnosis flow is run
- If the user asks why they are below benchmark and the result shows they are not below benchmark, correct the premise plainly instead of answering the mistaken gap as if it exists
- Missing slice support should be stated plainly instead of inferred
- `guardrails.sampleSize.benchmarkDatasetAccounts` and `guardrails.sampleSize.benchmarkDatasetCreatives` are pack-wide dataset counts, not exact counts for the resolved peer slice
- Do not imply the current peer slice contains a specific number of accounts or creatives unless slice-specific counts are explicitly returned
- `guardrails.approximationFlags` tells you which workspace-side metrics are proxy-based rather than benchmark-pack-native
- Do not turn `testingVolumePerWeek`, `winnersPerMonth`, `topQuartileCreativeVolumePerWeek`, or `topQuartileWinnersPerMonth` into counterfactual winner forecasts or formal top-quartile classification math
- Do not use golden findings, CH-008 context, or benchmark-wide hit-rate lore to backsolve hypothetical winner counts from a testing-volume change
- Prefer non-causal phrasing such as "suggests," "is associated with," or "worth watching" over "proves" or "causes"

If the tool fails:

- `BENCHMARK_COMPARE_INSUFFICIENT_DATA`: explain that the workspace did not have enough benchmarkable data in the supported window; do not invent a result
- `BENCHMARK_COMPARE_TIMEOUT` or `BENCHMARK_COMPARE_FETCH_FAILED`: explain that the benchmark could not be retrieved right now and avoid substituting aggregated benchmark math from other tools

## Answering Rules

When the task is benchmark-related:

- Call `motion benchmark-compare`
- Use its values as the source of truth for benchmark slice, provenance, deltas, evidence, and guardrails
- Use returned `creativeLeaders` for direct source-backed format, hook, and asset recommendations before reaching for looser benchmark lore
- Use returned `verticalVisualFormatLeaders` for category-specific format suggestions before falling back to overall visual format leaders
- Prefer evidence `title`, evidence `summary`, `creativeLeaders.*.title`, `verticalVisualFormatLeaders.sourceVerticalLabel`, and the specific CH-010 leaderboard titles over raw `chartId` in normal narration
- State the resolved benchmark label from `workspaceContext.brandCategory`
- If a follow-up answer depends on current workspace benchmark numbers or the resolved slice, rerun `motion benchmark-compare` unless the user explicitly wants the earlier result reused
- If the label was inferred or fell back to `other`, mention the original workspace category and the resolved supported label
- Describe `testingVolumePerWeek` as category-specific only when `metricScopes` and evidence support it; otherwise describe the comparison as spend-tier
- Keep hit rate, winner mix, spend allocation, and CH-008 context phrased as spend-tier benchmarks unless the runtime explicitly returns broader scope
- Keep metric narration internally consistent with the current benchmark call; do not mix fields or carry forward stale values from an earlier benchmark result
- Treat `allAccountsWinnersPerMonth`, `topQuartileCreativeVolumePerWeek`, and `topQuartileWinnersPerMonth` as context baselines within the spend tier, not the same thing as the main peer delta benchmark
- Do not convert `testingVolumePerWeek`, `winnersPerMonth`, `topQuartileCreativeVolumePerWeek`, or `topQuartileWinnersPerMonth` into forecasts, implied hit rates, or notebook-style top-quartile classifications
- If the user asks whether they are top quartile, compare against the returned context baselines without concluding they are formally top quartile
- Treat `guardrails.sampleSize.benchmarkDatasetAccounts` and `guardrails.sampleSize.benchmarkDatasetCreatives` as broad benchmark-pack context, not as exact counts for the user's resolved slice
- Do not claim the exact peer slice contains X accounts or Y creatives unless slice-specific counts are returned
- If `priorityGaps` is empty, do not present a "biggest gap" as a failed benchmark; frame any concern as a watchout, trade-off, or hypothesis instead
- Treat `creativeLeaders` and `verticalVisualFormatLeaders` as curated testing prompts, not exhaustive rankings or guaranteed winners
- When using `spendUseRatio`, describe relative spend capture versus usage; do not invent mechanism language such as platform or algorithm scaling explanations
- If the user asks why a benchmark gap exists and only benchmark compare has been run, keep the answer to safe benchmark-pattern interpretation or say that deeper diagnosis needs the benchmark-plus-diagnosis flow
- If the user asks a volume-doubling or "how many more winners" counterfactual, stop at the limitation and do not add informal hit-rate backsolves, benchmark-population averages, or winner-count extrapolations
- If the user wants interpretation, recommendations, or testing ideas, use the golden findings, common patterns, and creative testing prompt sections in this reference
- If the user asks about parity, capability boundaries, or whether the system can answer a benchmark question truthfully, use the parity snapshot and out-of-scope sections in this reference
- If the user asks for CH-001, CH-002, CH-004, notebook-only outputs, or exact methodology parity, state plainly that the current benchmark system does not expose a deterministic runtime surface for that yet
- Do not recompute benchmark math in-model
- Do not substitute `motion meta insights` aggregates for benchmark metrics

## Safe Evidence-Backed Asks Today

- "How do we compare to peers over the last 30 days on testing volume, hit rate, winner mix, and spend allocation?"
- "What spend tier and benchmark category are you using for us?"
- "What evidence backs the claim that we are above or below benchmark on this metric?"
- "What is the testing-volume benchmark for brands like us in our spend tier?" only when you keep scope discipline and follow returned provenance
- "What do top-quartile accounts in our spend tier do on creative volume and winners per month?" as contextual baseline framing, not the main peer delta benchmark
- "Which benchmark pattern are we in: below volume / above hit rate, or the reverse?" with descriptive, non-causal framing
- "What overall formats, hooks, and asset types does the benchmark suggest testing?" using `creativeLeaders`
- "What visual formats does the benchmark source highlight for our resolved category?" using `verticalVisualFormatLeaders` without blending the two CH-010 leaderboards
- "How recent is this benchmark and what market period does it reflect?"
- "What guardrails or approximation warnings should I keep in mind before acting on this benchmark?"

## Out-Of-Scope Or Partially Supported Asks

- "Can you benchmark us over `last_90d`, quarter to date, or another custom window?" out of scope; only `last_30d` is supported
- "Can you benchmark us against ROAS advertisers, CPA advertisers, or another objective-specific cohort?" out of scope; goal type is context only
- "Why are we below benchmark?" only partially supportable; benchmark compare is descriptive, not a causal or diagnostic surface by itself
- "Why might that benchmark gap exist in our workflow or process?" only partially supportable from benchmark compare alone; specific operational causes require the benchmark-plus-diagnosis flow
- "If we doubled testing volume, how many more winners should we expect?" out of scope; the CH-001 relationship surface is not shipped
- "Where do we sit in the benchmark spend distribution or percentile curve?" out of scope; the CH-002 distribution surface is not shipped
- "What is the category-specific hit-rate benchmark for our vertical?" only partially supportable; only `testingVolumePerWeek` can become category-specific today
- "How does our format mix, hook mix, or asset mix compare directly to the benchmark leaderboard?" only partially supportable; current system returns prompts, not a full workspace-vs-benchmark segment comparison surface
- "Which benchmark format will definitely work for us next?" out of scope as a truthful guarantee; creative leaders are testing prompts, not guarantees
- "Are we already a top-quartile account in the notebook sense?" only partially supportable; CH-008 is contextual, not full notebook logic
- "How many accounts or creatives are in our exact peer slice?" only partially supportable; current output exposes pack-wide dataset counts, not exact slice counts
- "What exactly does `testingVolumePerWeek` mean statistically here: mean, median, or something else?" only partially supportable; this remains a known methodology gap
- "Would this answer change if you used the notebook's exact methodology for thresholding, spend tier, and mid-range logic?" only partially supportable; current service still uses explicit proxies
- "Can you benchmark us exactly as a niche unsupported category instead of the resolved benchmark label?" only partially supportable; exact unsupported-category parity does not exist today
- "Can you give me the notebook-only diversity score, volume-bin output, or other exploratory benchmark outputs?" out of scope; those are not productized benchmark surfaces today

## Unsupported Requests

If the user asks for unsupported benchmark modes:

- `last_90d`: explain that benchmark compare only supports `last_30d` right now
- objective-specific benchmarking: explain that the current benchmark slice is not objective-specific
- CH-001 relationship-analysis asks: explain that the current benchmark system does not expose a deterministic relationship surface yet
- counterfactual winner forecasts or volume-doubling asks: explain that the current benchmark system does not expose a deterministic forecast surface and that CH-008 context should not be turned into projections
- CH-002 distribution or percentile asks: explain that the current benchmark system does not expose a deterministic distribution surface yet
- top-quartile classification asks: explain that the current system returns CH-008 context baselines, not full notebook-style top-quartile classification logic
- CH-004 runtime asks: explain that hit-rate context exists in guidance, but not as a dedicated deterministic benchmark surface today
- notebook-only exploratory asks: explain that those outputs are not part of the shipped benchmark product surface

If the request still needs benchmark context, use the supported `last_30d` benchmark compare result and clearly state the limitation before giving advice.
