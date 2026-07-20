# Creative Corpus Playbook

This file is the maintenance reference for the creative corpus. Keep it updated after every build and significant change.

## What this corpus is

A durable per-creative Markdown library. Every creative file contains durable content (hook, transcript, value props, glossary tags, decoded naming) that is fetched once and kept fresh. Live performance metrics stay in Motion and are NOT stored here — except a coarse `spendState` refreshed daily.

## File naming convention

`{sanitized-adname}__{id8}.md`

- `sanitized-adname`: ad name with non-alphanumeric chars replaced by `-`, max 80 chars
- `id8`: first 8 characters of the Motion creative asset ID

Example: `p-ugc_fs-30_as-fear__a3b4c5d6.md`

**The `id8` is the stable key.** Even if an ad name changes, the file can be found by ID. Never rename a file after creation.

## File schema

```yaml
---
id: <full motion creative asset id>
adName: <full ad name as returned by Motion>
id8: <first 8 chars of id>
format: <image|video|carousel|unknown>
launchDate: <YYYY-MM-DD>
campaignName: <campaign name at time of indexing>
status: <active|paused|unknown>
spendState: <scaling|active|paused|unknown>  # refreshed daily by script
indexedAt: <YYYY-MM-DD>  # when this file was first created
---

# {ad name}

## Hook
{Opening line or first sentence of transcript. Lifted verbatim from transcript or Motion summary.}

## Transcript
{Full transcript verbatim. "No transcript available." if Motion did not return one.}

## Summary
{Motion's creative summary. "No summary available." if absent.}

## Value Props
{2-5 bullet points: claims or benefits this ad makes. Lifted from summary or transcript.}

## Glossary Tags
{One line per tag: "category: value"}

## Decoded Ad Name
{Decoded dimensions using the naming decoder, or a note that Ad Naming is not installed.}
```

## Content vs. metrics rule

| Store in corpus | Keep as live Motion pull |
|---|---|
| Hook, transcript, summary | Spend (last N days) |
| Glossary tags | ROAS, CPA, CTR |
| Decoded ad name | Thumbstop, hold rate |
| Value props | Conversion counts |
| Format, launch date | Exact impressions |
| Campaign name at launch | Current budget |
| spendState (coarse, daily refresh) | |

## Build procedure

Runs as a workflow (`corpus-build.ts`) registered by the creative-corpus skill.

1. Pull roster over 3 x 30-day windows (separate calls — 90-day + summaries times out).
2. Deduplicate by creative asset ID.
3. Skip already-indexed files (create-if-absent, unless `forceRebuild: true`).
4. Enrich in batches of ≤15 IDs: `motion meta insights --scope creative-asset-id --include-transcript --include-glossary --date-range last_365d`.
5. Write one MD file per creative.
6. Update `corpus-state.json` with final counts.

## Refresh procedure

Runs as a script-mode routine (`corpus-refresh.mjs`) on a daily `0 5 * * *` cron.

1. Pull `motion meta insights --date-range last_7d`.
2. New IDs → enrich and write (same batch procedure as build).
3. Existing IDs → update `spendState` and `status` in-place only. Do NOT re-pull transcripts.
4. Update `corpus-state.json`.

## Troubleshooting

**Timeout on enrichment batch:** Reduce batch size. If ≤15 still times out, try `--date-range last_30d` instead of `last_365d` for the enrichment call (creative must have run recently to appear).

**Transcript missing:** Some creative types (DPA, catalog ads) do not have transcripts. `"No transcript available."` is correct.

**Stale spendState:** Check that the daily routine is active with `routine list`. If paused, resume it.

**File count mismatch vs Motion account:** The corpus covers the 90-day build window + daily incremental. Creatives older than 90 days at build time are not in the corpus unless manually added. To add an older creative: `motion meta insights --scope creative-asset-id --creative-asset-id <id> --include-transcript --include-glossary --date-range last_365d` and write the file manually.

## Build log
