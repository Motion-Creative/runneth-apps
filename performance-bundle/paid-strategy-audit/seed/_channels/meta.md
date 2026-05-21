# Meta — how to read it

**Channel slug:** `meta`
**First researched:** 2026-05-20
**Last updated:** 2026-05-20

## Account hierarchy

Meta organizes ads as `Campaign → Ad Set → Ad`. The campaign carries the optimization objective and (for CBO) the budget; the ad set carries the audience, placement, and (for ABO) the budget; the ad carries the creative.

Naming usually lives at all three layers. The richest signal is typically at the campaign layer (funnel role + optimization event) and the ad layer (creator, hook variant, format).

## Native optimization events

Meta supports standard events (Purchase, Lead, Add to Cart, Initiate Checkout, Complete Registration, Subscribe, Add Payment Info) plus custom conversions defined per workspace. Workspaces with low conversion volume often optimize for a proxy event (Form Fill, Pixel Lead, Calendly Form Submit) and grade against the true business outcome separately.

Map "validated metric" by looking at:
1. Campaign-name optimization keywords (e.g. "Form Fallback", "Calendly Event", "SurveyCompleted")
2. Ad-set-level optimization-event tokens (e.g. `optim:Calendly`) when ad sets override the campaign-level event
3. Cross-reference against `motion custom-conversion-metrics` for matching custom conversion IDs

## Native KPI vocabulary

Meta-standard: CTR (all), CTR (outbound), CPM, CPC, Frequency, ROAS, CPA, Thumbstop %, Hold rate, See more rate.

Translation: thumbstop ≈ 3-second video view rate. Hold rate ≈ % of viewers reaching 75% completion.

## Funnel-stage conventions

Common shapes:
- **Single funnel:** all campaigns optimize for the same business outcome.
- **Two-step funnel:** Prospecting → Retargeting.
- **Three-step funnel:** Awareness → Consideration → Conversion.
- **N parallel funnels:** content-pillar campaigns each running TOF-through-BOF independently.

DTC: usually two-step (prospecting + retargeting), both Purchase-optimized. SaaS lead-gen: usually parallel funnels keyed to different lead types (demo, signup, content download) with different validated events per funnel.

## Naming-vocabulary hints

Add these to the detective parser when reading Meta names:

- Stage: `prospecting`, `pr`, `prosp`, `tof`, `cold`, `acq`, `retargeting`, `rt`, `bof`, `warm`, `hot`, `mof`
- Audience: `lookalike`, `lal`, `lal1pct`, `lal1-3`, `broad`, `interest`, `int`, `1pd`, `cm`, `cus` (custom), country codes (`US`, `CA`, `UK`, `AU`, `EU`, `INTL`)
- Placement: `feed`, `reels`, `story`, `stories`, `all-placements`, `auto`
- Optimization event: `purchase`, `pur`, `wc` (Web Conversion), `lead`, `ld`, `form`, `formfill`, `ff`, `calendly`, `cal`, `book`, `signup`, `su`, `trial`, `survey`, `sc`
- Format: `static`, `video`, `vid`, `carousel`, `car`, `image`, `img`, `vsl`, `ugc`, `creator`, `testimonial`
- Hook variant: `h1:`, `h2:`, `h3:`, `hk:`
- Messaging format: `mf:`, `vf:` (visual format)
- ICP / persona: `icp:`, `p:`, `pers:`
- Angle: `a:`, `angle:`
- Iteration: `it:`, `r1`, `r2`, `v2`
- Length: `len:`, `30s`, `60s`, `15s`
- Creator: `i:`, often a creator handle as a free segment

Structured `key:value` tokens (e.g. `optim:Calendly`) get high confidence. Free-form words from the vocabulary get medium. Single-letter abbreviations get low and become gut-check questions.

## How to pull data

```bash
motion creative-insights --date-range last_30d --limit 1000 --sort topSpend --include-metrics --group-by creative
motion custom-conversion-metrics
motion brand-context --data-query "strategy positioning customer audience product"
```

For validated-metric retrieval add `--chart-kpi "<id>_count" --chart-kpi "<id>_cost"` per detected event. Read values under `chartKpiMetrics[<field>].value`, **not** under `metrics`.

For demographic breakdown when relevant: `motion age-gender-breakdown`.

## Validation notes

- `motion workspace-goal` and `motion spend-threshold` are platform settings. Do not use them as the validated-metric source. Validated metric comes from campaign/ad-set names and custom-conversion-metrics, not from workspace config.
- Ad set names can override campaign-level optimization events. Always check for `optim:` tokens (or vocabulary words) at the ad-set layer.
- Creator-led ads often have rich ad names; in-house production often has sparse ad names. Detective parser must work for both.
- ROAS is meaningless for lead-gen accounts. Validate the actual KPI per funnel step.
