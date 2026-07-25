# Motion CLI Data-Query Guide

The canonical contract for how Runneth pulls Meta, TikTok, Inspo, benchmark, and workspace-setup
data through the `motion` CLI. Goal: correct query shape on the first try, every time. Grounded in
live `motion <command> --help` output, not memory. Re-verify against live `--help` when a
command's flags change.

---

## Golden rules (apply to every Motion call)

1. **Bash only, one bare invocation.** `motion <command> <flags>`. No pipes, `&&`, `||`, `;`, no
   trailing `jq`/`cat`/`head`/`grep`, no line continuations.
2. **Kebab-case flags only.** Never `--input` / `--input-file`.
3. **Read the returned file separately.** Every command writes a JSON file under `./workdir/` and
   returns a compact envelope with `successful` + `file`. Inspect it with a separate `jq` call on
   that path. Never parse `/tmp/pi-bash-*` logs.
4. **Workspace scope.** Defaults to the current default workspace. Pass `--workspace-id <id>` for a
   named workspace, and use `motion workspaces` to resolve the exact workspace ID.
5. **Don't broaden after a clean zero-result.** If a pull returns empty for the requested window,
   answer it as empty. Do not silently widen dates, swap the metric, or change attribution.
6. **Never guess a metric key.** Resolve uncertain keys with `motion meta metric-reference` (standard)
   or `motion meta custom-conversion-metrics` (custom) before querying.
7. **Check completeness before "all" / totals claims.** If `providerTotalCount > totalCount`, or
   `totalCount` hit your `--limit`, say the pull may be partial.
8. **Omit `--limit`** unless the user asked for a bounded top-N, exact count, or sample size.
9. **Use `motion reports` for saved report metadata.** Do not WebFetch auth-walled Motion report
   URLs. If the customer names or links a saved report, parse the visible report ID when present or
   list saved reports and match the returned metadata.

---

## `motion meta insights` — Meta creative performance

One row per Motion creative asset. Use for top ads, ROAS/CTR/spend, hooks, tags, transcripts,
galleries, pattern analysis. `campaignName`, `adsetName`, `adName` are already on every row.

| Flag | What it does |
|---|---|
| `--workspace-id <id>` | Target a workspace (else current default) |
| `--scope all \| creative-asset-id \| report` | Whole account / specific creatives / saved report |
| `--creative-asset-id <id>` | Repeatable; the creatives to pull under `creative-asset-id` scope |
| `--date-range <preset>` | `last_7d`, `last_30d`, `last_365d`, or `YYYY-MM-DD..YYYY-MM-DD` |
| `--start-date` / `--end-date` | Exact custom window |
| `--limit <n>` | Bounded top-N (omit for full set) |
| `--include-metrics` | Turn on performance numbers |
| `--include-transcript` | Spoken words / voiceover / script (video only) |
| `--summary-sections <s>` | `adDescription`, `hookOrHeadline`, `creativeBreakdown`, `messagingAndPositioning`, `emotionalAndAudienceInsight` |
| `--group-by creative` | The ONLY valid group-by |
| `--filter '<json-array>'` | One flag = OR group, repeat for AND |
| `--sort <strategy>` | `topSpend`, `topRoas`, `topCtr`, `topPurchases`, `topCpa`, `topHookScore`, `bottomRoas`, `newestLaunchDate`, etc. |
| `--sort-metric <key>` + `--sort-direction asc\|desc` | Rank by an exact metric key |
| `--table-kpi <key>` / `--chart-kpi <key>` | Request specific KPIs (incl. custom conversions) |
| `--glossary-category <key>` | One tag dimension (e.g. `visual-format`, `messaging-angle`) |
| `--include-glossary` | All tag categories |
| `--click-attribution-window` / `--view-attribution-window` | Attribution overrides |

**Filter fields:** `campaignName`, `campaignId`, `adsetName`, `adsetId`, `adName`, `adId`, `adType`,
`adSetup`, `adLength`, `status`, `landingPageUrl`, `launchDate`, `glossaryCategory`, plus metric
filters with `"metric":true`. Text filters use `value` (singular); format filters use `values`.

**Never** `--group-by` anything but `creative` (no campaign/adset/name/adId/copy/headline/landingPage/
videoThumbnail/product/funnel/tag/audience/geo/placement). Those views get calculated from returned
rows or a saved report.

Examples:
```
motion meta insights --date-range last_30d --sort topSpend --include-metrics
motion meta insights --date-range last_30d --include-metrics --table-kpi thumbstop_ratio --sort-metric thumbstop_ratio --sort-direction desc
motion meta insights --scope creative-asset-id --creative-asset-id <id> --include-transcript --date-range last_365d
motion meta insights --date-range last_30d --include-metrics --filter '[{"field":"adType","type":"includes","values":["video"]}]'
```

---

## `motion meta ads` — Meta ad rows & ad-name rollups

Requires `--grain`. Use for explicit ad IDs, adset/campaign membership, naming rollups, NorthBeam.

- `--grain ads` — one row per Meta ad (`/meta/ads`); membership + ad-row metadata
- `--grain adnames` — one row per ad name (`/meta/adNames`); naming variants, performance by name, Meta NorthBeam
- `--date-range` (defaults `last_30d`) / `--start-date` / `--end-date`
- `--limit`, `--offset` (pagination)
- `--ad-id <id>` (repeatable), `--creative-asset-id <id>` (repeatable, matched via creativeId)
- `--filter '<json-array>'` (repeat for AND; metric filters need `"metric":true`)
- `--sort-by <key>` + `--sort-direction asc|desc`
- `--metric`, `--table-kpi`, `--chart-kpi`, `--include-metrics`
- `--include-associated-objects` — compact linked object counts/details
- `--northbeam` — NorthBeam attribution (camelCase keys: `northbeamRoas`, `northbeamRoasNew`, `northbeamEcrNew`...)
- `--google-analytics` — merge GA metrics

Do NOT use for generic top ads / galleries / hooks / transcripts / tags — those stay on `meta insights`.

```
motion meta ads --grain adnames --date-range last_30d --sort-by spend --sort-direction desc --include-metrics --limit 25
motion meta ads --grain ads --date-range last_7d --filter '[{"field":"adsetName","type":"includes","value":"Prospecting"}]' --include-associated-objects --include-metrics
motion meta ads --grain adnames --date-range last_30d --northbeam --include-metrics --sort-by northbeamRoasNew --sort-direction desc --limit 25
```

---

## `motion tiktok insights` — TikTok performance

TikTok uses `--sort-by` / `--sort-direction`, NOT Meta's `--sort topSpend` style.

- `--grain ads` (default) or `--grain adnames`
- `--date-range` (defaults `last_30d`); note TikTok presets: `this_month` (not month_to_date), `last_week_mon_sun` (not last_week)
- `--sort-by <metric>` + `--sort-direction asc|desc`
- `--filter '<json-array>'` — fields: campaignName, campaignId, adsetName, adsetId, adName, adId, status, adType, adSetup, adsPerformanceState, adLength, tag, landingPageUrl, launchDate, creativeId, glossaryCategory; metric filters need `"metric":true`
- `--metric`, `--include-metrics` (always include), `--limit`
- `--include-associated-object-details` — for galleries / parent context
- `--northbeam`
- Gallery limit rule: `--grain ads --include-associated-object-details --limit max(10, 3 * displayCount)`

```
motion tiktok insights --date-range last_30d --limit 25 --sort-by spend --sort-direction desc --include-metrics
motion tiktok insights --grain adnames --date-range last_30d --filter '[{"field":"adName","type":"includes","value":"summer"}]' --include-metrics
```

---

## Resolving names & metric keys (do this BEFORE filtering/ranking)

**`motion meta filter-reference`** — turn a fuzzy phrase into exact filter values.
- `--query "<phrase>"` (required)
- `--field campaignName|adsetName|adName|landingPageUrl` (repeatable)
- `--date-range` / `--start-date` / `--end-date`, `--limit`
```
motion meta filter-reference --query "chronic pain" --date-range last_30d
motion meta filter-reference --query "whitelisted" --field campaignName --field adsetName
```

**`motion meta metric-reference`** — confirm the exact metric key + direction + paired count/cost keys.
- `--query "<metric phrase>"`
- Returns `key`, `displayName`, `direction`, `source` (standard/northbeam), `requiresExplicitKpi`, related count/cost keys.

**`motion meta custom-conversion-metrics`** — list workspace custom conversions (id + name). Build keys
from the id with a valid suffix: `_count`, `_cost`, `_value`, `_rate`, `_roas`, `_purchase`.
`_total` is NOT a valid suffix.

---

## Metric gotchas that cause mistakes

- **Thumbstop:** `thumbstop_ratio` (Thumbstop Ratio, %, higher better) and `thumbstop_click_rate`
  (Thumbstop Click Rate) are two different standard keys. Pick the one meant.
- **Appointments:** volume is `appointments_scheduled_total`, cost is `cost_per_appointment_scheduled`.
  `appointment_scheduled` is NOT a valid key.
- **Pair count + cost, never derive one from the other.** Look up `metricDefinitions.<costMetric>.relatedCountMetric`
  and request both with `--table-kpi`. A count of 0 while cost-per is non-zero = wrong key, not a data gap.
- **Direction:** use `metricDefinitions.<key>.direction` / `isInversePerformance` for ranking direction.
  CPA/CPC/CPM/cost-per = lower is better; ROAS/CTR/thumbstop/purchase value = higher is better.
- **Zero/blank cost-per-conversion rows are not winners** — they mean no usable conversion signal.

---

## Reading the result file (roots differ by command)

- `motion meta insights`: dataset at root — `.creatives[]`, `.totalCount`, `.providerTotalCount`,
  `.adsWithoutCreativeAsset[]`, `.emptyResult`, `.metricDefinitions`. Metrics at
  `.creatives[].metrics.<key>`; requested KPIs at `.creatives[].tableKpiMetrics.<key>.value` /
  `.chartKpiMetrics.<key>.value`. Transcript at `.creatives[].transcript`.
- `motion meta ads`: `{successful, data}` — `.data.grain`, `.data.summaryRows`, `.data.result`, `.data.metricTotals`.
- `motion tiktok insights`: `.data.metricTotals` (additive only), `.data.creativeGalleryHints`, `.data.summaryRows`, `.data.result`.
- `motion meta filter-reference`: `.candidates` at root.
- Most others: `{successful, data}` with `.data.workspaces` / `.data.summaryRows` / `.data.result` / etc.

Use `data.metricTotals` only for additive totals (spend, impressions, purchases, clicks), never for
rates/costs (CTR, CPC, CPM, ROAS, CPA, thumbstop).

---

## Other data commands (quick reference)

- `motion workspaces` — list orgs/workspaces (source of truth for workspace IDs)
- `motion workspace-goal` — preferred KPI + attribution windows (not the default ranker; spend is)
- `motion spend-threshold` — significance threshold (only when winner/proven/enough-data qualification matters)
- `motion reports` / `motion reports --report-id <id>` — saved report configs
- `motion brand-context --data-query "<q>"` — saved own-brand context (`--data-query` always required)
- `motion ai-glossary` — valid tag categories/values
- `motion benchmark-compare` — testing volume, hit rate, winner mix vs peers (NOT for rate benchmarks like CTR/ROAS/CPA)
- `motion creative-trends` — trend comparison for workspace creatives
- `motion meta custom-conversion-metrics` — custom conversions
- `motion meta creative-comments --creative-asset-id <id>` — cached FB/IG comments
- `motion meta ads age-gender --ad-id <id>` / `motion meta creatives age-gender --creative-asset-id <id>` — demographics (need exact IDs; Meta returns fixed buckets like 25-34)
- `motion meta fatigued-ads` / `motion meta fatigued-adsets` — Meta's explicit fatigue flags
- `motion meta adset-fatigue-trends` — fatigue score movement / watchlists
- `motion meta adset-diversity-scores` / `motion meta adset-diversity-by-ads --adset-id <id>` — creative variety
- `motion meta competitor-ad-insights --ad-library-creative-id <id>` — one Meta ad-library competitor creative
- `motion analyze-media --filename <f>` / `--folder <dir>` — analyze uploaded video (last resort vs `--include-transcript`)

### Saved reports in Report Dashboard Setup

Use `motion reports` and `motion reports --report-id <id>` to inspect saved report configuration
for customer-named dashboards. Record the report title, purpose, platform, date behavior, metric
basis, grouping, and visible report ID or URL in `/agent/brain/meta/report-dashboard-context.md`
only when the customer says that report is a trusted starting point. Saved report metadata can guide
view shape; it does not override current-turn instructions or the customer's report-dashboard setup.

## Inspo (competitor / inspiration)

- `motion inspo brands --search-term "<name>"` or `--domain <domain>` — resolve brands; use returned `brands[].id`
- `motion inspo unique-creatives --brand-id <id> --brand-names-by-id '{"<id>":"<name>"}'` — competitor creatives
  - `--filter '{...}'` JSON object: `statuses` (active/inactive), `formats` (image/video/carousel), `activeTime`, `landingPageUrls`, `videoDuration`, `glossaryValues`, `visualFormats`
  - `--sort-by _id|startDate|daysActive|impressionRank` (impressionRank = single brand only)
  - `--cursor <data.page.endCursor>` for pagination
- `motion inspo unique-creatives visual-format-options --brand-id <id>` — valid `visualFormats` values first
- `motion inspo boards` / `motion inspo board-items --board-id <id>` — saved swipe files
- `motion inspo creators` — creator discovery (`--category` enum, `--search-term`, `--followers-min/max`, `--sort`, `--cursor`)
- `motion inspo tiktok-organic-posts [--username <handle>]` — organic feed / creator feed
- `motion inspo tiktok-organic-keywords` (+ `update`) — feed seed keywords (not live search)

For exact/edge flags: `motion <command> --help`, and `/runneth/references/motion-cli--command-contracts.md`.

---

## How this actually governs Runneth (be honest about it)

This file is findable reference knowledge. On its own it does not hard-enforce anything: the live
query contracts already live in Runneth's system prompt (the Motion hot path), and
`/runneth/references/motion-cli--command-contracts.md` is the package-owned deep reference.

To make a guardrail always-on org-wide, an admin wires a pointer into a loaded layer (org
`/agent/user.md` or a team file). That is admin-gated. This doc is the human-readable contract the
team and Runneth can both point at.
