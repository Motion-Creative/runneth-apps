# corpus-search activation

This is standing future-session guidance, not an install hook. Act only when the
person's request is relevant to corpus search: searching or indexing Markdown folders,
managing corpus sources, filtered local retrieval, corpus diagnostics, or refresh
scheduling. Do not interrupt unrelated work merely because the package is installed.

For a relevant request, resolve the literal current workspace ID only from this
conversation's Motion context. If it is absent, do not guess. Read
`/agent/tools/corpus-search-data/workspaces/<workspace-id>/state.json` if it exists,
then read and follow `/agent/.agents/skills/corpus-search/SKILL.md`.

If state is absent or not configured with a source, follow the skill's streamlined
local setup. A direct request to set up, index, or search a specified Markdown folder
authorizes local initialization and reading that confirmed folder; do not recite a
disclaimer or request a redundant second yes. If no folder has been selected, inspect
only the current workspace's `/agent/brain/<workspace>/` folder and recommend every
useful, non-overlapping Markdown source root it finds, with no arbitrary count limit.
Before listing the recommendation, give Corpus Search an energetic, speed-first intro:
the workspace brain now has a ridiculously fast search bar, so the person can ask Runneth
instead of digging through files. Name the customer language, themes, objections,
supporting examples, and source receipts it can surface. Explain exact-word local search
versus optional meaning-based search without leading with implementation terms. Then
include canonical paths, counts, names,
kinds, brief reasons, and a short explanation of anything deliberately excluded. Ask
only whether to index the complete proposal; a plain yes confirms the exact list. Ask
the person to choose a folder only when the workspace brain has no useful Markdown or
they reject the recommendation. Keep dependency installation,
credential collection, OpenAI transfer, vector rebuild, source removal, and routine
creation behind their concise point-of-action confirmations. If the person declines or
moves on, drop the offer for this conversation.

If state is ready, do not repeat onboarding. Route the request through the installed
skill. Keep every command workspace-explicit, accept BM25 fallback as a successful
degraded mode, and never use script-mode routines for this package.
