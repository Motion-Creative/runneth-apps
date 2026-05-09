# Skill: corpus-search

**Purpose:** A hybrid retrieval CLI in the workspace sandbox. The agent can index any folder of markdown files into a local SQLite store and run sub-second semantic + keyword queries against it. Use it whenever the task is "find me the parts of [some markdown corpus] that match [some intent]."

---

## When to reach for it

Reach for `corpus-search` when:

- The user asks a conceptual question over a body of markdown that's bigger than fits comfortably in context.
- The user wants to find specific scenes, moments, exchanges, or sections by meaning rather than literal keyword.
- The user wants to filter retrieved content by role, workspace, brand, time range, or any structured field captured at ingest.

Don't reach for it for:

- A single file the user has already pointed at — just read the file directly.
- Web search or anything outside the local filesystem.
- Source code search — use `Bash` with `rg`/`grep` instead.

---

## Prerequisites

Tool is installed at `/agent/tools/corpus-search/`. If it isn't, install via the runneth-apps `corpus-search` package and run:

```bash
bash /agent/tools/corpus-search/install.sh
```

The install script vendors sqlite-vec, applies the schema, and probes whether `OPENAI_API_KEY` is already present in the workspace secret store. If the probe fails, the first embedding call will surface a clear error; the agent should then emit the `secret-input` widget for `OPENAI_API_KEY` (allowed host: `api.openai.com`).

---

## Common operations

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
  [--top 15] [--no-vector] [--format human|json]
```

For agent-side parsing, use `--format json` so the response includes structured `hits` with `chunk_id`, `asset_id`, `score`, `text`, `t_start_s` / `t_end_s` (when present), and asset metadata. For showing the user, use `--format human` (default).

### Status / smoke test

```bash
bash /agent/tools/corpus-search/corpus-search.sh status
bash /agent/tools/corpus-search/corpus-search.sh demo
```

`status` prints asset counts, embedding state, and DB size. `demo` runs the canned demo queries against whatever's indexed and prints results — useful for verifying an install end-to-end.

---

## Patterns the agent should follow

### Picking `--kind` at ingest time

Pick a short, descriptive tag based on what the user told you about the folder. If they say "this is my video summaries folder," use `video-summary`. If they say "this is our Q1 reports," use `q1-report` or `report`. If unclear, ask once.

### Constructing queries

Write the query as a natural-language description of intent, not a keyword list. The retriever does both BM25 and vector search and fuses them, so semantic phrasing works as well as exact keywords. Example:

- Bad: `"goldenhour bottle close-up"` (looks like terms; works but loses semantic strength)
- Good: `"opening shot, woman holding the bottle, golden hour light"` (full intent)

### Showing results to the user

When reporting results in chat, surface the asset title, the workspace/user/date metadata, and a short excerpt — not the raw chunk text dump. If the asset kind is something with timestamps (video summaries, Gong calls), include the time range so the user can deeplink in.

### Adding new corpora over time

Whenever the user adds new markdown files to a previously-indexed folder, rerun:

```bash
bash /agent/tools/corpus-search/corpus-search.sh index markdown --source <same path> --kind <same tag>
bash /agent/tools/corpus-search/corpus-search.sh embed
```

Files whose content hash hasn't changed are skipped automatically.

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
| Open DB + load sqlite-vec + secret probe | `lib/store.py` |
| Markdown chunking + frontmatter parsing | `lib/markdown_ingest.py` |
| OpenAI embeddings via secure-fetch | `lib/embed.py` |
| Backfill embeddings for unembedded chunks | `lib/embed_chunks.py` |
| Hybrid BM25 + vector + RRF fusion | `lib/search.py` |
| Config loading with defaults | `lib/config.py` |
| Defaults the user can override | `config.example.json` |
