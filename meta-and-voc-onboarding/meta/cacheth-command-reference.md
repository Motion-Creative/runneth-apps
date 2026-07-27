# Cacheth Command Reference

All five `motion cache` commands, with every flag, option, and usage note.

---

## Overview

Cacheth is the local Motion cache for creative data. All five commands write their output to a
file under `./workdir/` and return a pointer plus compact metadata. Inspect the returned file
with a separate `jq` call — do not expect full data inline in the shell output.

Every command accepts `--workspace-id <value>` to target a workspace other than the current
default. Omit it to use the default workspace.

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

Exports the entire creative corpus as a file. Use this for bulk extraction — getting all ad
names, all transcripts, all glossary tags across every creative in the cache.

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

**Example `jq` extractions on a JSONL export:**

```bash
# All ad names across every creative
jq -r '.adNames[]?' ./workdir/<export-file>.jsonl

# All creative IDs
jq -r '.creativeId' ./workdir/<export-file>.jsonl

# All unique glossary tag names
jq -r '.glossary | .. | objects | .name? // empty' ./workdir/<export-file>.jsonl | sort -u
```

---

### `motion cache search-summaries`

Text search across ad names, ad copy, and summary content. Returns matched records with a
summary excerpt and relevance score. Use this when you know part of an ad name, a hook phrase,
a messaging theme, or a transcript fragment.

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
| Everything about one specific creative (by ID) | `motion cache get-creative` |
| All ad names, all transcripts, full corpus in bulk | `motion cache export-summaries` |
| Find a creative by name fragment, theme, hook, or copy | `motion cache search-summaries` |

---

## Priority order for creative data retrieval

When answering questions about creative summaries, transcripts, hooks, or tags:

1. **Knoweth pre-injected context** — arrives automatically before the turn, no tool call needed.
   If the matching creative context is already there, answer from it.
2. **`motion cache search-summaries`** — active local search, no Meta API call required.
3. **`motion cache get-creative`** — full record for a specific ID, still local, no API call.
4. **`motion meta insights --summary-sections`** — live pull from Motion/Meta. Use only when
   the cache does not have the creative yet, when you need performance metrics alongside the
   summary in the same call, or when a fresh re-analysis is explicitly needed.
