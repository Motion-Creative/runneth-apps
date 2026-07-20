# Creative Corpus Playbook

This file is the maintenance reference for the creative corpus. Keep it updated after every build and significant change.

## What this corpus is

A durable per-creative Markdown library. Every creative file contains durable content
(hook, Motion summary sections, value props, glossary tags, decoded naming) that is
fetched once and kept fresh. Live performance metrics stay in Motion and are NOT
stored here, except a coarse `spendState` refreshed daily.

## File naming convention

`{sanitized-adname}__{sanitized-full-creative-id}.md`

- `sanitized-adname`: ad name with non-alphanumeric chars replaced by `-`, max 60 chars
- `sanitized-full-creative-id`: the complete Motion creative asset ID normalized to
  safe filename characters

Example: `p-ugc_fs-30_as-fear__507f1f77bcf86cd799439011.md`

**The full ID is the stable key.** Resolve existing files by full-ID suffix or exact
`id:` frontmatter. If an ad name changes, update frontmatter in place and do not rename
the file.

## File schema

```yaml
---
id: <full motion creative asset id>
adName: <full ad name as returned by Motion>
filenameConvention: 2
format: <image|video|carousel|unknown>
launchDate: <YYYY-MM-DD>
campaignName: <campaign name at time of indexing>
status: <active|paused|unknown>
spendState: <scaling|active|paused|unknown>  # refreshed daily by script
indexedAt: <YYYY-MM-DD>  # when this file was first created
---

# {ad name}

## Hook
{Motion's hookOrHeadline section, preserved as closely as returned.}

## Creative Breakdown
{Motion's creativeBreakdown summary section, if returned.}

## Messaging & Positioning
{Motion's messagingAndPositioning summary section, if returned.}

## Emotional & Audience Insight
{Motion's emotionalAndAudienceInsight summary section, if returned.}

## Ad Description
{Motion's adDescription summary section, if returned.}

## Value Props
{2-5 claims or benefits drawn from the returned summary sections.}

## Glossary Tags
{One line per tag: "category: value"}

## Decoded Ad Name
{Decoded dimensions using the naming decoder, or a note that Ad Naming is not installed.}
```

## Content vs. metrics rule

| Store in corpus | Keep as live Motion pull |
|---|---|
| Hook and summary sections | Spend (last N days) |
| Glossary tags | ROAS, CPA, CTR |
| Decoded ad name | Thumbstop, hold rate |
| Value props | Conversion counts |
| Format, launch date | Exact impressions |
| Campaign name at launch | Current budget |
| spendState (coarse, daily refresh) | |

## Build procedure

Runs directly in the creative-corpus agent turn. Motion calls must never run from
`task.bash` or a script-mode routine.

1. Pull roster over 3 x 30-day windows (separate calls — 90-day + summaries times out).
2. Deduplicate by creative asset ID.
3. Skip already-indexed full IDs (create-if-absent).
4. Enrich in batches of ≤15 IDs using repeated `--creative-asset-id`,
   `--glossary-category`, and `--summary-sections` flags from the installed skill.
5. Write one MD file per creative.
6. Update `corpus-state.json` with final counts.

## Refresh procedure

Runs as an agent-mode routine on a daily `0 5 * * *` cron.

1. Pull `motion meta insights --date-range last_7d`.
2. New full IDs → enrich and write (same batch procedure as build).
3. Existing IDs → update `spendState` and `status` in-place only. Do NOT re-pull
   summary sections.
4. Update `corpus-state.json`.

## Troubleshooting

**Timeout on enrichment batch:** Reduce batch size. If ≤15 still times out, try `--date-range last_30d` instead of `last_365d` for the enrichment call (creative must have run recently to appear).

**Summary sections missing:** Some creative types return sparse creative text. Keep the
section empty and do not invent a transcript.

**Stale spendState:** Check that the daily routine is active with `routine list`. If paused, resume it.

**File count mismatch vs Motion account:** The corpus covers the 90-day build window
plus daily incremental updates. Creatives older than 90 days at build time are not in
the corpus unless manually added. Use the ID-scoped glossary-category and
summary-sections command from the installed skill.

**Legacy `id8` files:** Pre-release test installs may contain filenames ending in only
the first eight ID characters. Rebuild on a fresh VM, or match each file's full `id:`
frontmatter before renaming. Never overwrite multiple legacy files that share an
eight-character prefix.

## Build log
