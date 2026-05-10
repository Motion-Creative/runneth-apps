# Skill: corpus-search

**Purpose:** A hybrid retrieval CLI in the workspace sandbox. The agent can index any folder of markdown files into a local SQLite store and run sub-second semantic + keyword queries against it. Use it whenever the task is "find me the parts of [some markdown corpus] that match [some intent]."

---

## INSTALL PROTOCOL — read this first if you are installing this tool

When you are asked to install corpus-search in a workspace (the user pointed you at `Motion-Creative/runneth-apps/corpus-search` or said "install corpus-search"), follow this protocol exactly. Do not declare the install done until every step is resolved.

### Step 1 — Drop files and run install.sh

The runneth-apps installer copies the package into `/agent/tools/corpus-search/`. After files are in place, run:

```bash
bash /agent/tools/corpus-search/install.sh
```

This vendors `sqlite-vec`, applies the SQLite schema, probes whether `OPENAI_API_KEY` is already provisioned in this workspace, and prints an **INSTALL PROTOCOL checklist** at the end with `[done]` and `[TODO]` lines. Read every TODO. Each one tells you exactly what to ask the user.

### Step 2 — If `OPENAI_API_KEY` is not reachable, request it

If install.sh's checklist says:

```
[TODO] OPENAI_API_KEY is NOT reachable from this workspace.
```

…request it via the secret-input widget. Tell the user not to paste it into chat. Allowed host: `api.openai.com`. After they fill the widget, re-run `bash /agent/tools/corpus-search/corpus-search.sh check-endpoint` to confirm.

In Motion's primary workspaces the platform team typically pre-provisions this key, so the checklist will show `[done]` and you skip this step entirely.

### Step 3 — Ask the user about folders + kinds (mandatory)

If the checklist says `[TODO] sources.json has no enabled real sources yet.`, **ask the user in chat**:

> "Which folders should I keep indexed? Tell me the path of each folder, and what kind of content is in each (e.g. `video-summary`, `brief`, `gong-call`, `note`, `report`, `transcript`). I'll index them all into the same store and you can search by kind later."

Once they answer:

1. Edit `/agent/tools/corpus-search/sources.json`. Replace the disabled example entries with the real ones the user gave you. Each entry needs `name`, `source` (full path), `kind`, and `enabled: true`.
2. Run `bash /agent/tools/corpus-search/corpus-search.sh refresh` once to do the initial backfill. It will index every source, then embed.
3. Report the result — number of files indexed per source, any errors.

### Step 4 — Ask the user about refresh schedule (mandatory)

The checklist's last `[TODO]` is the daily refresh reminder. **Ask the user in chat**:

> "How often should I refresh the index? Default is daily at 8:00 in your timezone, but I can do hourly, weekdays-only, weekly, or anything else."

Once they answer, check existing reminders first to avoid duplicates:

```bash
reminder list
```

Then create one reminder with text like:

> Every day at 8:00 America/Toronto, run `bash /agent/tools/corpus-search/corpus-search.sh refresh`. If `chunks_inserted_total > 0` in the JSON output, post a one-line summary in this conversation. Otherwise post nothing.

(Adjust time and timezone per the user's answer.)

### Step 5 — Confirm the install is done

Re-run install.sh. The checklist should now show `[done]` for sources and reminder rows. Tell the user the install is complete and what they can now do (search any of the indexed kinds; new files in those folders are picked up automatically every refresh).

---

## When to reach for it (everyday operation)

Reach for `corpus-search` when:

- The user asks a conceptual question over a body of markdown that's bigger than fits comfortably in context.
- The user wants to find specific scenes, moments, exchanges, or sections by meaning rather than literal keyword.
- The user wants to filter retrieved content by role, kind, brand, time range, or any structured field captured at ingest.

Don't reach for it for:

- A single file the user has already pointed at — just read the file directly.
- Web search or anything outside the local filesystem.
- Source code search — use `Bash` with `rg`/`grep` instead.

---

## Common operations

### Check what's indexed right now

Always run this first when you're not sure whether the workspace has any of the relevant content yet:

```bash
bash /agent/tools/corpus-search/corpus-search.sh status
```

Returns asset counts per kind, embedding state, and DB size. An empty result for a kind means no indexing of that kind has happened yet, NOT that no such content exists in the world.

### Index a folder of markdown

```bash
bash /agent/tools/corpus-search/corpus-search.sh index markdown \
  --source /path/to/folder --kind <free-form-tag>
```

`--kind` is a metadata tag the agent picks based on what's in the folder. Suggested values: `video-summary`, `gong-call`, `brief`, `report`, `note`, `transcript`. The tag is used for filtering at query time. It has no functional meaning beyond that.

The ingestor:
- Honors YAML frontmatter at the top of each file (recognized keys: `title`, `brand`, `event_at`, `duration_s`, `user_email`, `org`, `workspace`, `source_id`).
- Chunks by markdown headers (`##`, `###`), merging tiny sections and splitting huge ones with overlap.
- Extracts timestamp markers like `[00:00]`, `[00:00:00]`, `[00:00-00:05]` from section leads into `t_start_s` / `t_end_s` so query results can carry deeplink-ready time ranges.
- Re-runs are idempotent (content-hash dedupe).

### Embed any unembedded chunks

```bash
bash /agent/tools/corpus-search/corpus-search.sh embed
```

Picks up any chunks that haven't been embedded yet. Resumable. Safe to re-run after every ingest.

### Query

```bash
bash /agent/tools/corpus-search/corpus-search.sh query "<text>" \
  [--kind <kind>] \
  [--role user|assistant|speaker:<name>] \
  [--workspace "<name>"] [--user "<email>"] \
  [--since YYYY-MM-DD] [--until YYYY-MM-DD] \
  [--top 15] [--no-vector] [--no-rerank] [--format human|json]
```

For agent-side parsing, use `--format json` so the response includes structured `hits` with `chunk_id`, `asset_id`, `score`, `text`, `t_start_s` / `t_end_s` (when present), and asset metadata. For showing the user, use `--format human` (default).

#### Rerank is on by default

Every query runs through an LLM rerank pass after hybrid retrieval. The reranker reads each of the top 50 candidates against the query and keeps only the ones that actually match the user's intent, with a one-line `why:` reason for each. This catches false positives that hybrid retrieval surfaces because of topic or keyword similarity but that don't actually answer the query. Adds ~1-3s of latency and ~1 cent per query — worth it almost every time.

Reranker output: each surviving hit has `extra.rerank_reason` (the one-line judgment) and `extra.rerank_rank` (1-based position in the reranked output). When you report hits to the user, pass `extra.rerank_reason` along. It's a small win in transparency — the user sees not just the result but why the model thinks it matches.

#### When to add `--no-rerank`

Pass `--no-rerank` to skip the rerank pass for one query. Faster (~1s instead of ~3-5s end-to-end), free, and gives you raw hybrid recall over the full top-N. Useful when:

- You're going to consume the top 50 candidates programmatically anyway and don't need precision in the top 10.
- You're debugging recall and want to see what hybrid alone surfaces before the reranker filters.
- The user asked for a fast lookup and quality is good enough without the rerank.

If the workspace genuinely doesn't want rerank running on any query, set `rerank.default_on: false` in `/agent/tools/corpus-search/config.json`. CLI flags still work to override per-query.

### Refresh (the routine path)

```bash
bash /agent/tools/corpus-search/corpus-search.sh refresh
```

Walks every enabled source in `sources.json`, re-runs the markdown ingestor (idempotent), embeds the union of new chunks. Returns a per-source JSON report. Exit codes: `0` = success, `2` = sources.json missing, `3` = at least one source had a non-fatal error (other sources still indexed).

### Demo

```bash
bash /agent/tools/corpus-search/corpus-search.sh demo
```

Runs the canned demo queries from `config.json` against whatever's indexed. End-to-end smoke test. Useful right after install once sources are populated.

---

## Patterns the agent should follow during everyday queries

### Constructing queries

Write the query as a natural-language description of intent, not a keyword list. The retriever does both BM25 and vector search and fuses them, so semantic phrasing works as well as exact keywords. Example:

- Bad: `"goldenhour bottle close-up"` (looks like terms; works but loses semantic strength)
- Good: `"opening shot, woman holding the bottle, golden hour light"` (full intent)

### Showing results to the user

When reporting results in chat, surface the asset title, the workspace/user/date metadata, and a short excerpt — not the raw chunk text dump. If the asset kind is something with timestamps (video summaries, Gong calls), include the time range so the user can deeplink in.

### Picking `--kind` at ingest time

Pick a short, descriptive tag based on what the user told you about the folder. If they say "this is my video summaries folder," use `video-summary`. If they say "this is our Q1 reports," use `q1-report` or `report`. If unclear, ask once.

### Adding new corpora over time

Whenever the user adds a new folder to keep indexed, edit `sources.json` to add another entry rather than running `index markdown` ad-hoc. The daily refresh reminder will pick it up.

If the user adds new files to an already-indexed folder, do nothing — `refresh` runs daily and will pick them up. If they want immediate indexing, run `corpus-search refresh` once on demand.

---

## Limits and known issues

- Single embedding model at a time. Mixing dimensions raises an error. To migrate to a larger model, drop `chunk_vec`, reset `embed_config`, change `config.json`, and re-embed.
- The default 256-dim setting is a workaround for a sandbox-side `secure-fetch` stdout cap. If the platform team raises that cap, the workspace can edit `config.json` to a higher dim and re-embed.
- The OpenAI embedding endpoint is the only configured backend out of the box. Swappable via `config.json` if a Motion AI proxy is later available.
- Single-tenant per sandbox by design. The `tenant_id` column is captured at ingest but not filtered at query time in v1.

---

## Where to look in the source

| Concern | File |
|---|---|
| CLI argparse + dispatch | `bin/corpus_search_cli.py` |
| Schema (asset, chunk, FTS5, embed_config, query_log) | `lib/schema.sql` |
| Open DB + load sqlite-vec + endpoint probe | `lib/store.py` |
| Markdown chunking + frontmatter parsing | `lib/markdown_ingest.py` |
| OpenAI embeddings via secure-fetch | `lib/embed.py` |
| Backfill embeddings for unembedded chunks | `lib/embed_chunks.py` |
| Hybrid BM25 + vector + RRF fusion | `lib/search.py` |
| Optional LLM rerank pass over top hybrid candidates | `lib/rerank.py` |
| Refresh all configured sources | `lib/refresh.py` |
| Config loading with defaults | `lib/config.py` |
| Defaults the user can override | `config.example.json` |
