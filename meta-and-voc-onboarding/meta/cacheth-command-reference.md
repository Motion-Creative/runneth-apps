# Cacheth Command Reference

All five `motion cache` commands, with every flag, option, and usage note — plus the three
commands outside `motion cache` that read cacheth underneath.

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
resolves," below).

**When the sandbox cache feature is off, these five commands do not exist.** They are
capability-gated on the sandbox's `MOTION_CACHE_ENABLED` runtime flag: with the cache disabled
they are filtered out of the `motion` command catalogue entirely, so their absence from the
CLI's own command list is itself the signal that cacheth is off for this VM — not a broken
install. Invoking one by name anyway still fails with the disabled message rather than an
unknown-command error:

> Motion cache is disabled for this sandbox. Use live Motion commands or enable the sandbox
> Motion cache feature before retrying cache commands.

The cache is off for the whole VM (it is a sandbox-level feature, not per-workspace) and the
ladder's live rung is the standing path.

There is no section filtering within a record: `get-creative` returns the record as stored and
you narrow it with `jq` on the returned file. That is not a guarantee that every layer is
present — see "Hydration is not guaranteed" under `get-creative`.

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

**Returns:** Cache-level metadata only — no creative records beyond a 20-ID sample.

Inline summary, in the shell output:

| Field | Meaning |
|---|---|
| `creativeCount` | Creatives currently in the cache |
| `customConversionsCount` | Cached Meta custom-conversion definitions |
| `missingAdUnitsCount` | Creatives whose ad-unit layer has not hydrated |
| `missingSummaryCount` | Creatives with no summary, or an incomplete one |
| `missingTranscriptCount` | Transcript-eligible creatives with no usable transcript |
| `refreshStatus` | The manifest's current refresh state |

The returned file carries more than the summary: `creativeIdSample` (the first 20 creative
IDs), `missingGlossaryCount` (**not** in the inline summary — `jq` the file for it), `exports`
(the summary-artifact paths: JSONL, DuckDB, and the Knoweth markdown directory — the markdown
is what Knoweth indexes), and the full `manifest`, including
`bootstrapCompletedAt`, `lastIncrementalRefreshAt`, and `nextScheduledRefreshAt`.

**Read the `missing*Count` fields before trusting a layer.** They are the per-layer readiness
signal, and they are what makes the difference between "this creative has no transcript" and
"transcripts have not hydrated yet." A healthy `creativeCount` alongside a large
`missingTranscriptCount` means inventory landed but transcripts did not, and a transcript
question first needs the ladder's repair rung (`motion cache refresh`, which hydrates the
missing layers synchronously). A `manifest.bootstrapCompletedAt` of `null` means
this workspace has never finished a cold bootstrap.

---

### `motion cache refresh`

Triggers a fresh sync of the cache from Motion's platform data, synchronously: it re-syncs
the creative inventory **and hydrates every missing layer of every cached creative** (ad
units, summaries, transcripts, glossary) before returning. That makes it double-duty: the way
to pull in newly launched creatives, and the ladder's repair step when a cached record is
missing a layer.

```
motion cache refresh
motion cache refresh --workspace-id <workspaceId>
```

**Options**

| Flag | Required | Description |
|---|---|---|
| `--workspace-id <value>` | No | Target workspace. Omits for the current default. |

**Returns:** Sync status. No creative content. The inline summary carries
`bootstrapCompletedAt`, `lastIncrementalRefreshAt`, and `refreshStatus`; the returned file
holds the full manifest.

---

### `motion cache get-creative`

Reads one creative's stored record by ID. Returns every layer that record holds in one shot —
no section filtering is available.

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
| Ad units | `adId`, `adName`, `adText` (primary copy), `adsetId`, `adsetName`, `campaignId`, `campaignName`, `callToAction`, `landingPageUrl`, `thumbnailUrl`, `videoThumbnailUrl`, `imageUrl`, `adType`, `isActive`, `created`, `modified` |
| Glossary tags | Tags grouped by category: `asset-type`, `visual-format`, `messaging-angle`, `hook-tactic`, `headline-tactic`, `intended-audience`, `seasonality`, `offer-type` — plus any account-custom categories. Each tag includes `name`, `definition`, and display colors. |
| Transcript | Meta video creatives only — TikTok assets and non-video formats never hydrate transcripts. `language`, `durationMs`, `text` (full), `segments[]` with `start`/`end`/`text` timestamps, `status` |
| Summary | Six sections: `adDescription`, `adFormat`, `hookOrHeadline`, `creativeBreakdown`, `messagingAndPositioning`, `emotionalAndAudienceInsight` |

**Hydration is not guaranteed — this command reads, it does not fetch.** Once the workspace's
one-time cold bootstrap has completed (the steady state — the background sync bootstraps every
workspace), `get-creative` asks the cache for what is already on disk; it will not hydrate a
missing content layer on demand. (The one exception: any data-reading cache command on a
never-bootstrapped workspace first runs that cold bootstrap synchronously — inventory,
glossary, and custom conversions, not summaries or transcripts — which is why a first read on
a fresh workspace can be slow.) Every content layer is optional in the stored record, so an
un-hydrated `adUnits`, `glossary`, `summary`, or `transcript` is **absent from the JSON
entirely** — not present-and-empty. Two consequences:

- On a **transcript-eligible** creative (Meta video — TikTok assets and non-video formats
  never hydrate transcripts), a missing `transcript` key means "not hydrated yet," not "this
  creative has no transcript." Never report that absence as a finding. Check the matching
  `*HydratedAt` timestamp, and when it is `null`, take the ladder's repair rung
  (`motion cache refresh`, then re-read) for that layer.
- The inline summary is the cheap pre-check: `hasAdUnits`, `hasSummary`, and `hasTranscript`
  say which layers landed without reading the file at all.

If the creative is not in the cache at all, the command fails with
`Motion cache creative is missing: <creativeId>`. That is one clear failure — fall through the
ladder rather than re-running it.

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
`workspaceId`, `organizationId`, format, origin, launch date, media `url`), ad metadata
(`adIds`, `adNames`, `adsetNames`, `campaignNames`), copy (`adTexts`, `callToActions`),
`landingPageUrls`, the concatenated `summaryText`, a `source` of `motion-cache`, and `text` —
a single searchable blob of the identity, ad-metadata, copy, and summary fields, the surface
`search-summaries` matches against. (Knoweth indexes parallel markdown renderings of the same
records, not this field.) Use this when a question spans the whole account: all ad names, all
copy, the full summary corpus.

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
| `--limit <value>` | No | Maximum number of matches to return. **Defaults to 10** when omitted; positive integer, **max 100** — a larger value is rejected as invalid input, not clamped. Compare `matchCount` to `total` to see whether the default truncated. |
| `--workspace-id <value>` | No | Target workspace. Omits for the current default. |

**What each match contains:**

| Field | Description |
|---|---|
| `creativeId` | The Motion creative asset ID |
| `adNames[]` | All ad names this creative was served under |
| `adsetNames[]` | Ad set names |
| `campaignNames[]` | Campaign names |
| `format` | `video`, `image`, or `unknown` |
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
| One specific creative (by ID) — every layer that has hydrated, incl. transcript and glossary tags | `motion cache get-creative` |
| All ad names, all copy, full summary corpus in bulk | `motion cache export-summaries` |
| Find a creative by name fragment, theme, hook, or copy | `motion cache search-summaries` |

---

## Cacheth also backs commands outside `motion cache`

The five commands above are cacheth's front door, but they are not its only consumers. Three
`motion` commands read cacheth transparently when the sandbox cache feature is on, and switch
to a live pull when it is off. None of them is capability-gated, so all three stay in the
command catalogue either way — what changes is the source underneath, not the command.

| Command | Cache on | Cache off |
|---|---|---|
| `motion meta insights` content flags | **The content flags read cacheth, not Meta.** `--summary-sections` and `--include-transcript` serve from the same cached records the `motion cache` commands read, and they do **not** hydrate a missing layer (`--include-glossary` is the one exception — it hydrates missing glossary tags on demand). A layer `get-creative` couldn't serve will be equally absent here. | The content flags become genuine live pulls from Motion/Meta — the standing content path on a cache-off VM. |
| `motion ai-glossary` | Reads the workspace's whole AI tag glossary — every category and value, with definitions — from cacheth. `--creative-asset-id` is **ignored**. | Falls back to the v3 creative-tags endpoint, where `--creative-asset-id` becomes **required**; without it the command fails with `creativeAssetIds is required for uncached Motion AI tag glossary reads`. |
| `motion meta custom-conversion-metrics` | Reads the cached Meta custom-conversion definitions — the same set `motion cache status` counts as `customConversionsCount`. | Fetches the workspace's custom conversions live. |

The first row is the one that changes behavior: **with the cache on, there is no live
summary/transcript path.** Adding content flags to a `meta insights` call cannot rescue a
cache miss — the repair is `motion cache refresh` (see the ladder below).

Keep the tag distinction straight: `ai-glossary` returns the account's tag **vocabulary** —
which categories and values exist, and what each means. Which tags are on a *specific
creative* is a per-creative fact, and it still comes from `motion cache get-creative`'s
`glossary` layer, or from `motion meta insights --include-glossary`.

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
2. **`motion cache search-summaries`** — active local search; no API call once the workspace
   has bootstrapped.
3. **`motion cache get-creative`** — the stored record for a specific ID, still local. It
   serves only the layers that have hydrated; see the command's hydration note.
4. **`motion cache refresh`, then re-read rung 2/3** — the repair rung, when the cache is on
   but the record or the layer you need is missing. Refresh synchronously re-syncs inventory
   **and hydrates every missing layer of every cached creative** (ad units, summaries,
   transcripts, glossary) before it returns, so one refresh followed by one re-read either
   serves the answer or proves the layer genuinely cannot hydrate. One refresh, one re-read —
   never a loop. (Check transcript eligibility first: only Meta video creatives carry
   transcripts, so a transcript absent from a TikTok or image creative is a fact, not a gap
   to repair.)
5. **`motion meta insights` with the content flags** (`--summary-sections`,
   `--include-transcript`, `--include-glossary`) — the live pull from Motion/Meta.
   **Cache-off only.** When the sandbox cache feature is on, these flags read the same cache
   as rungs 2–3 and do not hydrate missing summaries or transcripts (see the consumers table
   above), so they cannot rescue a cache miss — rung 4 is the repair. They are the standing
   content path only on a VM where the cache feature is off. The one cache-on use:
   `--include-glossary` hydrates missing glossary tags on demand.

**Rules of the ladder:**

- **Cacheth first, always.** In the healthy state — the overwhelming default — rungs 1–3
  answer everything and rungs 4–5 never fire.
- **A partial record falls through to rung 4, not rung 5.** Rung 3 serving a record is not
  the same as rung 3 serving the layer the answer needs. When `get-creative` returns the
  record but the layer is absent (`transcriptHydratedAt: null` and no `transcript` key on a
  transcript-eligible creative), that layer has not hydrated: refresh and re-read rather than
  reporting it as missing from the creative — and rather than reaching for the content flags,
  which read the same cache. The `missing*Count` fields on `motion cache status` say up front
  how often this is happening across the workspace.
- **One repair attempt, never a retry-loop.** Rung 4 is one `motion cache refresh` and one
  re-read. If the layer is still absent after that, it cannot hydrate right now — say
  plainly what could not be read and why, instead of looping refreshes, re-running the same
  read against an erroring cache, or fabricating the layer from the summary. The cache gets
  its next chance on the next question.
- **A cache failure is never a reason to skip the creative read.** A WHY question answered
  without content because the cache was down is the wrong answer, not a degraded one. Repair
  and re-read when the cache is on; read it live when the cache is off.
- **Cache not enabled is a standing state, not a failure.** When the `motion cache` commands
  are absent from the catalogue, or a named invocation fails with the explicit message
  "Motion cache is disabled for this sandbox" (distinct from a transient error — the CLI
  names the disabled state), the cache is off for the whole VM, and rung 5 is the
  creative-attributes path as a matter of course. Note it once in the conversation —
  "creative content is coming from live pulls; enabling Cacheth would make these reads
  faster and cheaper" — not on every answer.
- **Metrics never justify content flags on a cache-on VM.** When an answer needs metrics and
  content, pull the metrics lean (`motion meta insights` without content flags) and read the
  content from the cache, joined on `creativeId`. With the cache on, adding content flags
  does not even go live — it reads the same cache mid-pull; keep the two reads separate.
- **Say which rung served** (the show-the-work rule): a content claim reads differently when
  it came from a live pull instead of the cache, and the customer can only question
  freshness they can see. When rung 4 repaired, that is worth a clause ("after a cache
  refresh"); when rung 5 fired, state it plainly — e.g. "this VM runs without the local
  cache, so this comes from a live Motion pull."
