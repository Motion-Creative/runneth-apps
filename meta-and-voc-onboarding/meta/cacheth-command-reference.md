# Cacheth Command Reference

All five `motion cache` commands, with every flag, option, and usage note.

---

## Overview

Cacheth is the local Motion cache for creative data. It is a hydration layer behind the
`motion cache` CLI — the agent never touches its storage directly, only these commands. All
five commands write their output to a file under `./workdir/` and return a pointer plus compact
metadata. Inspect the returned file with a separate `jq` call — do not expect full data inline
in the shell output.

Every command accepts `--workspace-id <value>` to target a workspace other than the current
default. Omit it to use the default workspace.

Before leaning on the cache in a workspace, run `motion cache status` once. If it errors or
shows an empty/unbuilt cache, do not loop retries against the data commands: run
`motion cache refresh` when the cache merely has not synced yet, and for the answer at hand
fall through the creative content layer's ladder (see "How the creative content layer
resolves," below). If the command fails with the explicit message "Motion cache is disabled
for this sandbox," the cache is off for the whole VM (it is a sandbox-level feature, not
per-workspace) and the ladder's live rung is the standing path.

There is no section filtering within a record. `get-creative` always returns the full record.
Use `jq` on the returned file to extract only the layer you need.

---

## Commands

### `motion cache status`

Reads the current cache state for the workspace. Use this to check whether the cache has been
built, when it was last refreshed, and how many creatives are in it.

```
motion cache status
motion cache status --workspace-id <workspaceId>
```

**Options**

| Flag | Required | Description |
|---|---|---|
| `--workspace-id <value>` | No | Target workspace. Omits for the current default. |

**Returns:** Cache-level metadata only. No creative records.

---

### `motion cache refresh`

Triggers a fresh sync of the cache from Motion's platform data. Run this when you want to pull
in newly launched creatives or updated summaries.

```
motion cache refresh
motion cache refresh --workspace-id <workspaceId>
```

**Options**

| Flag | Required | Description |
|---|---|---|
| `--workspace-id <value>` | No | Target workspace. Omits for the current default. |

**Returns:** Sync status. No creative content.

---

### `motion cache get-creative`

Pulls the complete record for one specific creative by ID. Returns every data layer in one shot
— no section filtering is available.

```
motion cache get-creative --creative-id <id>
motion cache get-creative --creative-id <id> --workspace-id <workspaceId>
```

**Options**

| Flag | Required | Description |
|---|---|---|
| `--creative-id <value>` | Yes | The Motion creative asset ID to retrieve. |
| `--workspace-id <value>` | No | Target workspace. Omits for the current default. |

**What the full record contains:**

| Layer | Fields |
|---|---|
| Identity | `creativeId`, `workspaceId`, `origin`, `format`, `url`, `launchDate` |
| Freshness timestamps | `inventoryRefreshedAt`, `adUnitsHydratedAt`, `summaryHydratedAt`, `transcriptHydratedAt`, `glossaryHydratedAt`, `transcriptSource` |
| Ad units | `adId`, `adName`, `adText` (primary copy), `adsetId`, `adsetName`, `campaignId`, `campaignName`, `thumbnailUrl`, `videoThumbnailUrl`, `adType`, `isActive`, `created`, `modified` |
| Glossary tags | Tags grouped by category: `asset-type`, `visual-format`, `messaging-angle`, `hook-tactic`, `intended-audience`, `seasonality`, `offer-type`. Each tag includes `name`, `definition`, and display colors. |
| Transcript | `language`, `durationMs`, `text` (full), `segments[]` with `start`/`end`/`text` timestamps, `status` |
| Summary | Six sections: `adDescription`, `adFormat`, `hookOrHeadline`, `creativeBreakdown`, `messagingAndPositioning`, `emotionalAndAudienceInsight` |

**Useful `jq` extractions on the returned file:**

```bash
# Transcript only
jq '.transcript' ./workdir/motion-cache-creative-<id>.json

# Glossary tags only
jq '.glossary' ./workdir/motion-cache-creative-<id>.json

# Ad names from all ad units
jq '[.adUnits[].adName]' ./workdir/motion-cache-creative-<id>.json

# Primary copy
jq '[.adUnits[].adText]' ./workdir/motion-cache-creative-<id>.json

# Hook section only
jq '.summary.hookOrHeadline' ./workdir/motion-cache-creative-<id>.json

# Messaging and positioning only
jq '.summary.messagingAndPositioning' ./workdir/motion-cache-creative-<id>.json

# All top-level fields (structure overview)
jq 'keys' ./workdir/motion-cache-creative-<id>.json
```

---

### `motion cache export-summaries`

Exports the summary corpus in bulk — one record per creative carrying identity (`creativeId`,
format, origin, launch date, media `url`), ad metadata (`adIds`, `adNames`, `adsetNames`,
`campaignNames`), copy (`adTexts`, `callToActions`), `landingPageUrls`, and the concatenated
`summaryText`. Use this when a question spans the whole account: all ad names, all copy, the
full summary corpus.

Export records do **not** carry transcripts or glossary tags. Those live only on the full
creative record — find the `creativeId` here (or via search), then pull it with
`motion cache get-creative`.

Note that one creative can have multiple ad names (one per ad unit it was served in), so the
export will show that many-to-one relationship.

```
motion cache export-summaries --format jsonl
motion cache export-summaries --format duckdb
motion cache export-summaries --format jsonl --workspace-id <workspaceId>
```

**Options**

| Flag | Required | Description |
|---|---|---|
| `--format <value>` | Yes | Export format. Must be `jsonl` or `duckdb`. |
| `--workspace-id <value>` | No | Target workspace. Omits for the current default. |

**Format notes:**

- `jsonl`: One JSON record per line. Easy to pipe through `jq` for extraction and filtering.
- `duckdb`: Queryable database file. Better for large corpora where SQL-style queries are useful.

**Reading the output — two hops, not one:**

The command does not return the corpus directly. It returns a wrapper: the command output
carries per-provider paths under `exportPaths` (`meta`, `tiktok`), and the returned
`./workdir/` file holds the same paths under `.providers.<provider>.path`. The records live in
those per-provider files — running `jq` record extractions against the wrapper itself returns
nothing.

```bash
motion cache export-summaries --format jsonl
# output: { "file": "./workdir/motion-cache-export-summaries-<...>.json",
#           "exportPaths": { "meta": "<path>", "tiktok": "<path>" }, "recordCount": N }

# Resolve the Meta corpus path from the wrapper file
META_JSONL=$(jq -r '.providers.meta.path' ./workdir/motion-cache-export-summaries-<...>.json)

# All ad names across every creative
jq -r '.adNames[]?' "$META_JSONL"

# All creative IDs
jq -r '.creativeId' "$META_JSONL"
```

---

### `motion cache search-summaries`

Text search across ad names, ad copy, and summary content. Returns matched records with a
summary excerpt and relevance score. Use this when you know part of an ad name, a hook phrase,
or a messaging theme. Transcripts are not in the search surface — a spoken line matches only
where the summary sections happen to quote it; for transcript text, pull the full record with
`motion cache get-creative`.

This is a qualitative search surface — not the source of truth for exact performance counts,
fresh live filtering, or metric-grounded ranking.

```
motion cache search-summaries --query "UGC founder"
motion cache search-summaries --query "extreme comfort" --limit 10
motion cache search-summaries --query "bed rot" --workspace-id <workspaceId>
```

**Options**

| Flag | Required | Description |
|---|---|---|
| `--query <value>` | Yes | Search text. Matches against ad names, ad copy, and summary content. |
| `--limit <value>` | No | Maximum number of matches to return. |
| `--workspace-id <value>` | No | Target workspace. Omits for the current default. |

**What each match contains:**

| Field | Description |
|---|---|
| `creativeId` | The Motion creative asset ID |
| `adNames[]` | All ad names this creative was served under |
| `adsetNames[]` | Ad set names |
| `campaignNames[]` | Campaign names |
| `format` | `video`, `image`, or `carousel` |
| `launchDate` | When the creative launched |
| `origin` | Source platform (e.g. `metaCreativeAsset`) |
| `url` | Media file URL |
| `score` | Relevance score for the search query |
| `excerpt` | Short text snippet showing the match |
| `summaryText` | Concatenated summary sections for the matched creative |
| `workspaceId` | Workspace the creative belongs to |

**Returns:** `matchCount`, `total`, and a `matches[]` array. Does not return the full creative
record — use `motion cache get-creative` if you need all layers for a specific match.

---

## Choosing the right command

| What you need | Command |
|---|---|
| Is the cache built? When was it last synced? | `motion cache status` |
| Pull in new creatives or updated summaries | `motion cache refresh` |
| Everything about one specific creative (by ID) — incl. transcript and glossary tags | `motion cache get-creative` |
| All ad names, all copy, full summary corpus in bulk | `motion cache export-summaries` |
| Find a creative by name fragment, theme, hook, or copy | `motion cache search-summaries` |

---

## How the creative content layer resolves

**The creative content layer** is what every doc in this package means when an answer needs
creative attributes — summaries, hooks, transcripts, AI tags. Cacheth is its primary store
and system of record; this ladder is its access contract. Resolve top-down, falling through
a rung only when it cannot serve:

1. **Knoweth pre-injected context** — arrives automatically before the turn, no tool call needed.
   Knoweth indexes the summary artifacts Cacheth generates (identity, ad names, copy, summary
   text) — not complete records. If the matching summary-level context is already there, answer
   from it; a transcript or glossary-tag question always needs rung 3.
2. **`motion cache search-summaries`** — active local search, no Meta API call required.
3. **`motion cache get-creative`** — full record for a specific ID, still local, no API call.
4. **`motion meta insights` with the content flags** (`--summary-sections`,
   `--include-transcript`, `--include-glossary`) — the live pull from Motion/Meta.
   **Failure-only.** This rung fires when the cache cannot serve: `motion cache status`
   errors, the cache is empty or still building, the record is missing, or the layer you need
   has not hydrated. It is never a shortcut past a healthy cache.

**Rules of the ladder:**

- **Cacheth first, always.** In the healthy state — the overwhelming default — rungs 1–3
  answer everything and rung 4 never fires.
- **Falling through repairs, not just rescues.** On a transient failure, kick
  `motion cache refresh` in the background so the cache serves next time. The live rung
  answers one question; it never becomes the habit.
- **A cache failure is never a reason to skip the creative read.** A WHY question answered
  without content because the cache was down is the wrong answer, not a degraded one — fall
  through and read it live.
- **Cache not enabled is a standing state, not a failure.** When any `motion cache` command
  fails with the explicit message "Motion cache is disabled for this sandbox" (distinct from
  a transient error — the CLI names the disabled state), the cache is off for the whole VM,
  and rung 4 is the creative-attributes path as a matter of course. Note it once in the
  conversation — "creative content is coming from live pulls; enabling Cacheth would make
  these reads faster and cheaper" — not on every answer.
- **Metrics never justify skipping the cache.** When an answer needs metrics and content,
  pull the metrics lean (`motion meta insights` without content flags — adding them slows
  the pull) and read the content from the cache, joined on `creativeId`.
- **Say which rung served** (the show-the-work rule): a content claim reads differently when
  it came from a live pull instead of the cache, and the customer can only question
  freshness they can see.
