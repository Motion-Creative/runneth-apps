---
name: corpus-search
description: |
  Configure, refresh, inspect, or search a workspace-isolated corpus of Markdown files.
  Use when someone asks to index folders, add or remove corpus sources, search a local
  document library with filters, find passages across briefs, notes, summaries, or
  transcripts, diagnose corpus search, rebuild embeddings, or schedule corpus refreshes.
  Also use for explicit references to corpus-search, BM25, hybrid corpus retrieval, or
  semantic search over Markdown folders.
---

# Corpus Search

Use `/agent/tools/corpus-search/v2/corpus-search.sh` for every operation. It returns one
JSON object. Never omit `--workspace-id`, and never derive the ID from a folder, roster,
memory, or a previous conversation. Resolve the literal current workspace ID from this
conversation's Motion context. If the context has no workspace ID, stop and ask the
person to select a workspace.

Generated state is isolated at
`/agent/tools/corpus-search-data/workspaces/<workspace-id>/`. Do not read another
workspace's state and do not register a source folder without the person's confirmation.

The current workspace's brain folder is `/agent/brain/<workspace>/`, where `<workspace>`
is the current Motion workspace name slugged to lowercase, with every run of non-`a-z0-9`
characters replaced by one hyphen and leading or trailing hyphens removed. Use the name
only to locate this brain folder; continue to use the literal Motion workspace ID for every
CLI command. Never inspect another workspace's brain folder.

## Explain what was installed and why it is useful

On the first setup response, briefly explain what Corpus Search adds before listing the
source recommendation. Make it feel like a useful new capability for a marketer or
creative strategist, not infrastructure documentation or a hype reel. Use clear,
confident language with some energy. Start by naming what was installed, then explain that
the person can ask Runneth instead of manually digging through files. Keep it to two to
four sentences and cover:

- Corpus Search adds a fast search layer across the useful documents in this workspace;
- Runneth can find real customer language, recurring pain points, objections, desires,
  supporting examples, and relevant briefs, research, summaries, or transcripts, then
  point back to the source behind an insight;
- local search finds exact words and phrases, while optional meaning-based search can
  later find related ideas expressed in different language.

For example, adapt this to what the workspace actually contains:

> Corpus Search is installed—think of it as a fast search layer for your Runneth brain.
> Once we index this workspace, you can ask questions across reviews, transcripts,
> briefs, and research instead of digging through files; I can pull out customer quotes,
> recurring themes, pain points, objections, and proof points, with the source receipts.
> It starts with quick local keyword search, and optional meaning-based search can catch
> the same idea even when customers use different words.

Do not lead with terms such as BM25, FTS5, embeddings, vectors, chunks, databases, or
dependencies unless the person asks for technical details. Avoid stiff phrases such as
"document retrieval system" or "corpus infrastructure," and avoid unsupported superlatives
or speed promises. Do not promise a capability that the proposed sources cannot support.
If the person asks what Corpus Search can do after setup, use the same clear, upbeat
framing and tailor examples to the indexed sources.

## First relevant use

Read the workspace `state.json`. If it is absent or its phase is `awaiting_sources`,
make the local-search path feel like normal task execution:

- A direct request to set up, index, or search a specified Markdown folder is approval
  to initialize its local workspace index. Do not repeat a setup disclaimer or ask for
  a redundant second yes.
- If the request is exploratory and no folder has been selected, inspect the current
  workspace's brain and propose what to index. Do not make the person choose folders or
  invent labels from scratch when the brain already provides enough evidence.
- Always confirm the resolved absolute source paths before registering them. Indexing
  reads Markdown and writes only generated workspace state; it never edits source files.

Then:

1. When no source was specified, scan only `/agent/brain/<workspace>/` for Markdown:
   - inventory the folder tree and Markdown counts, then inspect a small representative
     sample so the recommendation reflects the actual content rather than folder names
     alone;
   - prefer substantive, durable corpus families such as VoC reviews, support
     conversations, research, briefs, transcripts, or summaries;
   - propose every useful non-overlapping source root the brain supports. Do not impose
     an arbitrary source-count limit, and do not propose both a parent and its child,
     which would duplicate results;
   - exclude empty folders, hidden/runtime state, changelogs, tag vocabularies, package
     instructions, and other administrative files unless the person explicitly asks for
     them;
   - resolve every proposed path canonically and reject any symlink or resolved path that
     escapes the current workspace's brain folder;
   - if the brain folder is absent or contains no useful Markdown, say so and ask for a
     different folder instead of manufacturing a recommendation.
2. Give the short explanation above, then present the complete
   recommendation containing each source's plain-English label,
   canonical absolute path, `name`, `kind`, recursive Markdown file count, and one-line
   reason. Briefly name any Markdown families deliberately excluded and why, so the
   person can see that the whole workspace brain was considered. End with one
   confirmation such as, "Want me to index all of that now?" A plain yes confirms those
   exact sources; do not ask for the paths or confirm them again. If the person changes
   the proposal, show the revised source list once and wait for their yes.
3. Once the sources are approved—either by a direct request naming a folder or by a yes
   to the recommendation—run `workspace init` with the exact workspace ID, run
   `source add` for the approved sources, and then
   `refresh --no-embeddings` so useful BM25 search exists immediately.
4. After local search works, optionally ask one concise question: semantic search
   installs `sqlite-vec==0.1.9` and sends source chunks plus reranking candidates to
   OpenAI using the customer's key; should it be enabled? Do not install the dependency,
   collect a credential, or send content externally without that yes.
5. If approved and `OPENAI_API_KEY` is not listed as an available stored secret, use
   the core `secret-collection` flow. Never ask for the value in chat. Use the reserved
   key name `OPENAI_API_KEY`, allowed host `api.openai.com`, and CLI permission for
   `secure-fetch`. Run `doctor --repair`, then `refresh` to backfill embeddings. A
   401/403 means the credential must be replaced through the secure flow; do not delete
   or rebuild the corpus.
6. Report whether the workspace is `ready_lexical`, `ready_hybrid`,
   `credential_needed`, or still partially refreshing.
7. Separately offer an agent-mode refresh routine. Create it only when cadence,
   timezone, exact delivery destination, and an explicit yes are all present.

If setup is declined, do nothing and do not offer again in this conversation. A later
relevant conversation may offer again while setup remains incomplete.

## Query

Run `query --workspace-id <id> "<query>"`. Default `auto` mode uses hybrid retrieval
plus reranking when available and succeeds with BM25 otherwise. Tell the person when
`degraded` is true, using the returned reason without implying their local search
failed. Use filters only when the request establishes them:

- fixed: `--kind`, `--source`, `--role`, `--user`, `--since`, `--until`;
- generic frontmatter: repeat `--meta key=value` for top-level scalar fields.

Ground the answer in returned passages, name the source file, and preserve timestamp
offsets when present. Do not claim search was semantic when `effectiveMode` is `bm25`.

## Source management and refresh

- Use `source list` before changes.
- `source add` and path-changing `source update` require the person's confirmed
  canonical path, name, kind, and pattern.
- `source disable` is reversible and excludes the retained source index from queries.
- Before `source remove --yes`, explain that generated rows for that source will be
  deleted while original Markdown is untouched, then wait for confirmation.
- `refresh` is safe to retry. Exit `3` means partial source failure; report the failing
  source and preserve successes. `partial: true` without source errors means a runtime
  deadline left resumable work for a later refresh.

Before `embeddings rebuild --yes`, explain that it deletes generated vectors and must
re-send chunks to OpenAI during the next refresh. Wait for confirmation. It never
deletes Markdown, assets, chunks, sources, or the BM25 index.

## Optional agent-mode routine

Never use `--script`. First run:

```bash
routine list --search "corpus-search-refresh-<workspace-id>"
```

If none exists and the person approves, create one normal agent-mode routine with the
chosen cron/timezone and exact delivery. Its cold-start prompt must contain the literal
workspace ID and this exact command:

```bash
bash /agent/tools/corpus-search/v2/corpus-search.sh refresh \
  --workspace-id <workspace-id> --max-runtime-seconds 480
```

The prompt must parse the JSON, send nothing when there are no changed/deleted assets
and no errors, send a concise change summary to the exact destination when content
changed, and send the source/error details on failure. Its Delivery must name that
same exact destination. Routine inventory and lifecycle always come from `routine`,
not `state.json`.

## Diagnostics and lifecycle

Use `status` for counts and `doctor` for runtime health. Run `doctor --repair` only
after dependency-install approval. A reported legacy database at
`/agent/tools/corpus-search/corpus.db` is informational: never modify or import it
automatically.

Package updates replace only v2 code. Uninstall removes the package code, skill, and
instruction but intentionally preserves `/agent/tools/corpus-search-data/`. Explain
that retained data requires a separate, explicit cleanup request.
