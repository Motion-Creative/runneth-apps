# corpus-search

**A hybrid retrieval CLI for any folder of markdown files. Sub-second semantic + keyword queries against your own content, no external infrastructure.**

Index a folder of markdown — video scene summaries, Gong call transcripts, briefs, research notes, anything markdown-shaped — and ask questions in natural language. Results come back ranked, with role and timestamp metadata when present.

**Install time:** ~2 minutes.
**Requires:** Python 3.10+, a Runneth sandbox, and an OpenAI API key reachable via `secure-fetch` (or any other embedding provider configured in `config.json`).

---

## What this gives you

- A single SQLite store at `/agent/tools/corpus-search/corpus.db` that holds your content forever, no server to operate.
- Hybrid search: BM25 + vector embeddings, fused by reciprocal rank fusion. You don't have to choose between keyword and semantic.
- Role-aware filters out of the box (`--role user`, `--role assistant`, `--role speaker:<name>`) for transcripts where attribution matters.
- Free-form `--kind` tags so one store can hold many corpora (video summaries, briefs, calls, etc.) and you can scope queries to one kind at a time.
- Timestamp extraction from headings like `[00:00-00:05]`, so queries against video or call summaries return ranges you can deeplink into.
- ~1-second queries against tens of thousands of chunks. Cheap to run.

---

## Quickstart

After install completes:

```bash
# 1. Index any folder of markdown files
bash /agent/tools/corpus-search/corpus-search.sh index markdown \
  --source ~/my-asset-library --kind video-summary

# 2. Embed
bash /agent/tools/corpus-search/corpus-search.sh embed

# 3. Search
bash /agent/tools/corpus-search/corpus-search.sh query \
  "opening shot, woman holding the bottle, golden hour light" \
  --kind video-summary --top 10
```

That's it. Re-run `index` and `embed` whenever new files arrive. They're idempotent — unchanged files are skipped.

---

## Install

The package ships with `install.sh`. After the runneth-apps installer drops the files in `/agent/tools/corpus-search/`, run:

```bash
bash /agent/tools/corpus-search/install.sh
```

It vendors `sqlite-vec`, copies `config.example.json` to `config.json`, applies the schema, and probes whether your `OPENAI_API_KEY` is reachable. If it isn't, the first embedding call will prompt for it via the workspace secret-input widget.

---

## How to add your own data

Three patterns covered:

### Plain markdown notes / docs
Drop them in a folder. Index with whatever `--kind` tag makes sense:

```bash
... index markdown --source ~/notes --kind note
```

### Markdown summaries of videos
Same pattern. If your summaries use timestamp markers like `## Scene 1 [00:00-00:05]` in headers, the ingestor extracts the time ranges and queries return them so you can build deeplinks.

```bash
... index markdown --source ~/video-summaries --kind video-summary
```

### Anything with structured metadata
Add YAML frontmatter to your files. Recognized keys land in indexed columns; everything else is preserved in `extra_json`.

```markdown
---
title: Q1 launch brief
brand: Acme
event_at: 2026-01-15
workspace: Acme Performance
---

## Background
...
```

Then `--workspace`, `--user`, `--since`, `--until` filters work at query time.

---

## Common queries

Conceptual:
```bash
... query "where users said the brief missed the brand voice"
```

Filtered to a brand:
```bash
... query "scenes opening with a product close-up" --kind video-summary --brand Acme --top 5
```

Time-windowed:
```bash
... query "feedback on the new hook framework" --since 2026-04-01 --until 2026-04-30
```

JSON output for downstream processing:
```bash
... query "..." --format json | jq '.hits[].asset_title'
```

BM25 only (skip the embedding leg, faster cold starts):
```bash
... query "..." --no-vector
```

With reranker for higher top-k precision (adds ~1-3s and ~$0.01 per query):
```bash
... query "..." --rerank --top 10
```

The reranker is a second pass that asks `gpt-4.1-mini` to read each of the top 50 hybrid candidates against your query and return only the ones that genuinely match the user's intent. It catches false positives that hybrid retrieval surfaces because of topic or keyword similarity, and writes a one-line `why:` reason for each surviving hit. Default is off so everyday queries stay fast and free. Turn it on whenever top-k precision matters more than the extra second of latency — typically when you want to show the user a curated list rather than scan candidates programmatically.

---

## Keep your corpus current automatically

Most workspaces have content arriving in folders on a schedule (Drive sync, video summary pipelines, daily Gong dumps). Rather than running `index` and `embed` by hand each day, declare the folders you want indexed in `sources.json` and call `refresh` on a schedule.

First-time setup:

```bash
# 1. Edit sources.json (created by install.sh from sources.example.json)
#    to point at your folders. Each entry needs source + kind, optional
#    name + pattern + tenant + enabled.
#
#    {
#      "sources": [
#        { "name": "creative-library",
#          "source": "~/drive/creative-library/scene-summaries",
#          "kind":   "video-summary",
#          "enabled": true },
#        { "name": "team-briefs",
#          "source": "~/drive/briefs",
#          "kind":   "brief",
#          "enabled": true }
#      ]
#    }

# 2. Run an initial backfill (idempotent; safe to repeat).
bash /agent/tools/corpus-search/corpus-search.sh refresh

# 3. Set up a daily reminder via the Runneth `reminder` tool.
```

Recommended reminder text (paste into Runneth):

> Every day at 8:00 America/Toronto, run `bash /agent/tools/corpus-search/corpus-search.sh refresh`. If `chunks_inserted_total > 0`, post a one-line summary in this conversation. Otherwise post nothing.

That's it. One reminder, one config file. New folder to watch? Edit `sources.json`. New cadence? Edit the reminder. No new reminders per source.

What `refresh` does in one call:

1. Walks every enabled source in `sources.json`
2. Re-runs the markdown ingestor on each (idempotent: unchanged files skipped via content hash)
3. Embeds the union of all new chunks in one pass at the end
4. Returns a JSON report with per-source counts and total elapsed time

Exit codes: 0 = success, 1 = fatal error, 2 = sources.json missing, 3 = at least one source had a non-fatal error (e.g., a source folder doesn't exist; other sources still indexed). Useful for the reminder to decide whether to ping you.

## Status, demo, troubleshooting

| Command | Use when |
|---|---|
| `... status` | Counts and embedding state. Run after every ingest. |
| `... refresh` | Re-index every source in `sources.json`, then embed. Idempotent. |
| `... demo` | Run the canned queries from `config.json`. End-to-end smoke test. |
| `... check-endpoint` | Probe whether `OPENAI_API_KEY` reaches the embeddings API right now. |
| `... init` | Re-apply schema. Idempotent. |

If a query returns nothing or fails, common causes:

- **`vec_table: false` in status** — no chunks are embedded yet. Run `embed`.
- **Secret probe fails** — `OPENAI_API_KEY` isn't in the workspace secret store. Re-run `install.sh` and watch for the note about the secret-input widget on first embed.
- **`embedding dim mismatch`** — you changed `embed.dim` in `config.json` after embedding chunks at a different dim. Either revert the config or drop `chunk_vec` and re-embed.
- **`secure-fetch truncated the response`** — the embed batch is too big for the sandbox's stdout cap. Lower `embed.batch_size` in `config.json`.

---

## Tuning

Open `/agent/tools/corpus-search/config.json` to adjust:

| Setting | Default | When to change |
|---|---|---|
| `embed.model` | `text-embedding-3-small` | Bump to `text-embedding-3-large` for technical / domain-heavy content. ~3-5pt MTEB lift, ~6x cost. |
| `embed.dim` | `256` | Raise if your platform's `secure-fetch` cap is higher than this sandbox's. Re-embed required when you change. |
| `embed.batch_size` | `24` | Lower if you hit "secure-fetch truncated the response." |
| `embed.endpoint` / `embed.auth_env` | OpenAI | Swap to a Motion AI proxy or another provider when one is available. |
| `search.candidate_pool` | `120` | Larger = better recall, slightly slower fuse step. |
| `search.top_k_default` | `15` | Default `--top` value. |
| `rerank.model` | `gpt-4.1-mini` | Bump to `gpt-4o` or `gpt-4.1` for sharper rerank judgment at higher cost. |
| `rerank.input_pool` | `50` | How many hybrid candidates to feed the reranker. Larger = more recall in the rerank pass, more tokens to the LLM. |
| `rerank.output_top_k` | `10` | Default reranked-output size when `--rerank` is on. |
| `rerank.chunk_char_budget` | `700` | Per-chunk character cap when serializing candidates into the rerank prompt. Lower if you index very long chunks. |
| `demo.queries` | three generic | Replace with queries that fit your indexed corpus to make `demo` more useful. |

---

## Architecture (one short paragraph for tinkerers)

One SQLite database. `asset` is the parent record per markdown file (kind, title, frontmatter metadata, content hash). `chunk` is the searchable unit (text, role, timestamps, embedding). `chunk_fts` is FTS5 over `chunk.text` for BM25. `chunk_vec` is sqlite-vec's `vec0` virtual table over chunk embeddings. `embed_config` pins the active embedding model and dim so we don't accidentally mix them. `query_log` captures every search for future eval. Hybrid search fetches candidates from both legs, fuses with reciprocal rank fusion (`rrf_k=60` by default), hydrates asset metadata, returns ranked hits. The full path is in `lib/`. Schema is in `lib/schema.sql`. Everything is configurable via `config.json`.

---

## When to outgrow this

This tool is right for: per-sandbox brains, single-tenant deployments, tens-of-thousands of chunks, sub-second queries, no infrastructure to manage.

Outgrow it when: you need cross-surface retrieval (Slack, web, third-party agents querying the same brain), centralized embedding upgrades across many customers, or shared eval pipelines. The schema and CLI are designed to port to Postgres + pgvector cleanly when that day comes.

---

## License

Internal Motion tool. See repository LICENSE.
