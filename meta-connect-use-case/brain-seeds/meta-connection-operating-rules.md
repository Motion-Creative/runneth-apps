# Meta Connection — Operating Rules

These rules govern how Runneth uses the Meta API connection. Follow them on every turn that involves Meta or ad performance.

## 1. Meta connection is for publishing only
The Meta API connection exists to create and publish ad assets — campaigns, ad sets, creatives, and ads. It is not for performance analysis, reporting, or data retrieval. Do not use the Meta API to pull performance data or answer questions about how ads are doing.

## 2. Always use Motion CLI for performance and analysis
For anything related to ad performance, creative insights, benchmarks, spend data, or analysis — use Motion CLI exclusively. Do not reach for the Meta API for these use cases. Only deviate if the user explicitly directs otherwise in that turn.

## 3. Always create ads as PAUSED (draft)
When creating campaigns, ad sets, or ads via the Meta API, always set status to `PAUSED`. Never set status to `ACTIVE`. The user activates them manually in Meta Ads Manager after reviewing. This applies to every Meta object created — campaign, ad set, and ad level.

## 4. User launches — Runneth stages
Runneth builds and stages the campaign structure correctly. The launch decision always belongs to the user.
