# Motion CLI Data-Query Guide

The canonical contract for how Runneth pulls Meta, Inspo, benchmark, and workspace-setup
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
9. **Pick the name level deliberately.** `campaignName`, `adsetName`, and `adName` are not
   interchangeable proxies for a product or theme, even when they share a word. See "Which name
   level to filter on" before building any name filter.

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

## Which name level to filter on (campaignName vs adsetName vs adName)

Meta accounts nest three levels — campaign (objective/budget) → ad set (audience/optimization)
→ ad (the creative asset) — and the same product or theme word legitimately appears at any or
all of them. A campaign named "[Product X] — Q3 Prospecting" may contain ad sets named
"[Product X] — Broad" and ads named "ProductX_UGC_v3". The reverse also holds: a "[Product X]"
campaign can contain creative unrelated to that product (cross-sell, seasonal add-ons), and
[Product X] ads can run inside a campaign that never mentions it (an "Evergreen Prospecting"
campaign, say). So no name level is a proxy for another, even when they share a word — a
product name is a *thing the account is marketing*, and where it lives depends on how the
account was built.

Ad names in particular are structured, delimited strings built by creative teams to track
iteration, typically `[Product/Concept]_[Format]_[Hook]_[Version]` (e.g.
`ProductX_UGC_QuestionHook_v2`). A product or concept name is therefore a substring token
inside a longer name, never the full name: filter with `"type":"includes"`, and expect many
matches across formats, hooks, and versions — that is the correct result shape, not noise.
Sibling products ([Product X] vs [Product Y]) must never bleed into each other's results, even
when they sit under the same campaign umbrella.

Choosing the field:

1. **The user's language picks the level when it names one.** "ads" (the creative pieces) →
   `adName`; "campaign" → `campaignName`; "audience", "targeting", "ad set" → `adsetName`.
2. **A bare product/concept name with no level word defaults to `adName` + `includes`.**
   Product tokens are creative-team constructs, so the asset level is where they live most
   reliably. If the account has confirmed where its product names live (Account Context Brain,
   Field 4 naming conventions), that confirmed default overrides this heuristic.
3. **Never silently swap levels.** If the chosen field returns zero results, say which field
   was tried and ask before trying another level — golden rule 5 applies to fields, not just
   dates and metrics. A quiet campaign-level fallback changes what the question means.
4. **"Everything related to [product]" may genuinely span levels.** An OR across `adName` and
   `campaignName` is sometimes the right read — but confirm it first, because it changes the
   result scope significantly.

Worked example — "show me all my [Product X] ads":

1. "ads" is the operative word → asset level; the target field is `adName`.
2. Resolve the token first: `motion meta filter-reference --query "[Product X]" --field adName`
   (catches no-space / underscore / hyphen variants).
3. Filter with includes:
   `--filter '[{"field":"adName","type":"includes","value":"<resolved token>"}]'`.
4. Expect many rows across formats and versions. Do not treat the result as "the [Product X]
   campaign" — that campaign may hold unrelated ads, and [Product X] ads may live outside it.
5. Zero rows → report that the ad-level search found nothing and ask whether this account
   structures [Product X] at the campaign level instead. Do not pivot silently.

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

## Reading the result file (roots differ by command)

- `motion meta insights`: dataset at root — `.creatives[]`, `.totalCount`, `.providerTotalCount`,
  `.adsWithoutCreativeAsset[]`, `.emptyResult`, `.metricDefinitions`. Metrics at
  `.creatives[].metrics.<key>`; requested KPIs at `.creatives[].tableKpiMetrics.<key>.value` /
  `.chartKpiMetrics.<key>.value`. Transcript at `.creatives[].transcript`.
- `motion meta ads`: `{successful, data}` — `.data.grain`, `.data.summaryRows`, `.data.result`, `.data.metricTotals`.
- `motion meta filter-reference`: `.candidates` at root.
- Most others: `{successful, data}` with `.data.workspaces` / `.data.summaryRows` / `.data.result` / etc.

Use `data.metricTotals` only for additive totals (spend, impressions, purchases, clicks), never for
rates/costs (CTR, CPC, CPM, ROAS, CPA, thumbstop).

---

## Other data commands (quick reference)

- `motion workspaces` — list orgs/workspaces (source of truth for workspace IDs)
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
