# Corpus Search v2

Workspace-isolated Markdown retrieval for Runneth. The runtime keeps generated data
under `/agent/tools/corpus-search-data/workspaces/<workspace-id>/`, outside package
ownership, so package updates and uninstall do not remove customer indexes.

The installed skill owns normal usage. Every stateful CLI command requires the exact
workspace ID from the current conversation's Motion context.

## Commands

```bash
TOOL=/agent/tools/corpus-search/v2/corpus-search.sh

bash "$TOOL" workspace init --workspace-id <id>
bash "$TOOL" source add --workspace-id <id> --name notes --path /absolute/path --kind note
bash "$TOOL" source list --workspace-id <id>
bash "$TOOL" refresh --workspace-id <id> --no-embeddings
bash "$TOOL" query --workspace-id <id> "launch feedback" --meta brand=Acme
bash "$TOOL" status --workspace-id <id>
bash "$TOOL" doctor --workspace-id <id>
```

All commands print one JSON object to stdout. Exit `0` is success, `2` is invalid
input or missing confirmation, `3` means at least one source failed while other work
was preserved, and `4` is an optional dependency, credential, or provider failure.
Automatic query fallback still exits `0` and reports `effectiveMode: "bm25"` plus a
`degradedReasons` array.

## Search contract

- Local FTS5/BM25 is always available after initialization.
- With the customer-owned `OPENAI_API_KEY`, refresh embeds pending chunks with
  `text-embedding-3-small` at 256 dimensions and query defaults to hybrid retrieval.
- Hybrid mode is reported only after every enabled chunk has an embedding; partial
  backfills remain searchable through BM25 and report their coverage explicitly.
- The top hybrid candidates are reranked with `gpt-4.1-mini` through the Responses
  API using `store: false` and strict structured output.
- Both OpenAI calls go through `secure-fetch`; this Python process never receives the
  secret value.
- Query text is not persisted.

`--meta key=value` matches top-level scalar YAML frontmatter. Fixed filters are
`--kind`, `--source`, `--role`, `--user`, `--since`, and `--until`. Explicit headings
such as `## Role: user` and `## Speaker: Alice` populate chunk roles. Timestamp markers
such as `[00:10-00:18]` populate result offsets.

## Source lifecycle

Refresh hashes files and skips unchanged content. Bounded runs persist a per-source
cursor and continue through remaining files on the next refresh. A complete successful
scan removes generated rows for Markdown files that disappeared. A missing source, a
file parse error, or a runtime deadline preserves the last good rows. Disabling a source
excludes it from search without deleting its index. `source remove --yes` deletes
generated rows only; it never changes source files.

## Semantic dependency

The vector extension is pinned to `sqlite-vec==0.1.9`. It is deliberately not bundled
or installed by the package manager. After human approval, run:

```bash
bash "$TOOL" doctor --workspace-id <id> --repair
```

The Runneth Python wrapper installs it into the daemon-managed user cache. If that
cache is later rebuilt, lexical search continues and `doctor --repair` restores the
semantic path.

An archive-era `/agent/tools/corpus-search/corpus.db` is detected by `doctor` but is
never overwritten, imported, or deleted by this package.
