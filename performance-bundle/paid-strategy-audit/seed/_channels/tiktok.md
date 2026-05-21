# TikTok — how to read it

**Channel slug:** `tiktok`
**First researched:** 2026-05-20
**Last updated:** 2026-05-20

## Account hierarchy

TikTok organizes ads as `Campaign → Ad Group → Ad`. Ad Group is the equivalent of Meta's Ad Set. The campaign carries the optimization objective; the ad group carries the audience, placement, and budget (TikTok supports both CBO and ABO equivalents); the ad carries the creative.

TikTok creative names often carry the creator handle and the script angle since creator-led content dominates the platform.

## Native optimization events

TikTok supports app installs, conversions, lead gen, video views, traffic, and reach optimization. Conversion events are tracked via TikTok Pixel or Events API. Common configured events: Complete Payment, Place an Order, Form, Subscribe, Add to Cart, Initiate Checkout.

Validated-metric mapping works the same way as Meta: parse campaign and ad-group names for the optimization keyword, cross-reference against the workspace's tracked events.

## Native KPI vocabulary

TikTok-standard: CPM, CPC, CTR, 6-second video views, Average Watch Time, Reach, Frequency, CPA, ROAS (rare), VTR (View-Through Rate), Engagement Rate.

Translation: 6s video view ≈ Meta's thumbstop equivalent. Average watch time / video duration ≈ hold rate. TikTok exposes more video-completion granularity than Meta does natively.

## Funnel-stage conventions

TikTok skews top-of-funnel and discovery-led. Common shapes:
- **Discovery + retargeting:** TikTok TOF feeds a retargeting layer (sometimes on TikTok, sometimes on Meta).
- **Single funnel conversion:** TikTok handles the whole funnel for high-velocity DTC categories.
- **Creator partnership flighting:** dedicated campaigns per creator partnership, each treated as its own micro-funnel.

The "validated metric" on TikTok often differs from Meta even in the same account. Meta might be on Purchase, TikTok might be on Add to Cart (because TikTok-attributed purchases under-report). Always check.

## Naming-vocabulary hints

Add these to the detective parser when reading TikTok names:

- Stage: `tof`, `mof`, `bof`, `discovery`, `disc`, `retarget`, `rt`, `re-engage`, `awareness`
- Audience: `broad`, `interest`, `int`, `lookalike`, `lal`, `1pd`, `cus`, country codes
- Placement: `feed`, `top-feed`, `tiktok-only`, `pangle`, `auto`
- Optimization event: `purchase`, `pur`, `atc` (Add to Cart), `ic` (Initiate Checkout), `lead`, `cp` (Complete Payment), `signup`, `view`
- Format: `ugc`, `spark` (Spark Ads), `branded`, `aigc`, `talking-head`, `voiceover`
- Creator: `c:`, `creator:`, often a creator handle as a free segment (`@handle` form)
- Script angle: `s:`, `script:`, `angle:`, free-form descriptors (`problem-agitate`, `before-after`, `unboxing`)
- Hook: `h:`, `hook:`, hook-text excerpts
- Iteration: `it:`, `v2`, `r1`, `r2`

Spark Ads (organic-post-as-paid) are common and significant — the same creator's organic post running as a Spark Ad behaves differently from a custom-shot ad. Flag this in naming when detected.

## How to pull data

```bash
# Same Motion CLI shape as Meta. The platform filter is implicit on the connection.
motion creative-insights --date-range last_30d --limit 1000 --sort topSpend --include-metrics --group-by creative
motion custom-conversion-metrics
```

For TikTok-specific video metrics, check the returned creative fields for: `videoViews6s`, `videoCompletionRate25`, `videoCompletionRate50`, `videoCompletionRate75`, `videoCompletionRate100`, `averageWatchTime`.

## Validation notes

- TikTok attribution is shorter than Meta's by default (often 7-day click vs Meta's 7-day click + 1-day view). Cross-channel comparisons must control for this.
- TikTok ROAS is typically lower than Meta ROAS in the same account because of attribution lag. Don't flag TikTok as underperforming purely on platform-reported ROAS without checking incrementality or MMM signals.
- Creator-led ad names can be very sparse if the team relies on the creator handle alone. The detective parser handles this by treating a recognized creator handle as a high-confidence signal.
- Spark Ads carry organic-engagement signals that can mislead paid-performance reads. Flag any creative tagged `spark` separately.
