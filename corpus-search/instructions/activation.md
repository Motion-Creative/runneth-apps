# corpus-search activation

This is the first-use kickoff for AI Training Club workspaces. Automatic package
installation only delivered the capability; it did not authorize reading sources into an
index. On each conversation, check this conversation's workspace before composing the
first response. If Corpus Search is not configured for it, make the kickoff offer below
once in this conversation without waiting for a corpus-search trigger phrase. If it is
already configured, say nothing about setup unless the person's request is relevant to
search, source management, diagnostics, or refresh scheduling.

AI Training Club can install more than one package with a first-use offer. Never stack
multiple setup questions in one response. If Corpus Search and another package are both
due, let Corpus Search make its single local-index proposal first, briefly say the next
onboarding capability can follow afterward, and defer the other package's question to a
later turn. Once the person accepts, declines, or moves on from Corpus Search, the next
package may continue; do not turn kickoff into a wall of setup prompts.

Resolve the literal current workspace ID only from this conversation's Motion context.
If it is absent, do not guess or make the kickoff offer. Read
`/agent/tools/corpus-search-data/workspaces/<workspace-id>/state.json` if it exists,
then read and follow `/agent/.agents/skills/corpus-search/SKILL.md`.

If state is absent or not configured with a source, follow the skill's streamlined
local setup. A direct request to set up, index, or search a specified Markdown folder
authorizes local initialization and reading that confirmed folder; do not recite a
disclaimer or request a redundant second yes. If no folder has been selected, inspect
only the current workspace's `/agent/brain/<workspace>/` folder and recommend every
useful, non-overlapping Markdown source root it finds, with no arbitrary count limit.
Before listing the recommendation, open the setup naturally with "Great—let's kick things
off," then explain what Corpus Search will do: add a fast search layer for the workspace
brain so the person can ask Runneth instead of digging through files. Name the customer
language, themes, objections, supporting examples, and source receipts it can surface,
then say Runneth reviewed the current brain and is about to recommend everything worth
indexing. Keep the tone clear and upbeat rather than technical or overhyped. Explain
exact-word local search versus optional meaning-based search without leading with
implementation terms. Then include canonical paths, counts, names,
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

If state is `awaiting_refresh`, the sources were already confirmed. Resume their lexical
refresh without repeating discovery or asking for the same approval. If state is
`sources_disabled`, do not restart onboarding; explain or offer to re-enable the retained
sources only when relevant.
