<!-- use-case: corpus-search v1.0.0 -->

### Retrieval over indexed corpora — corpus-search

When the user asks for content from a large indexed corpus by meaning, role, time, or other metadata — conversations, video scene summaries, briefs, transcripts, notes, calls — use `corpus-search` rather than grep. It does hybrid BM25 + vector retrieval with role-aware filters and returns ranked chunks in about a second.

- Skill walkthrough: `/agent/.agents/skills/corpus-search/SKILL.md`
- Before answering "do we have anything about X," run `bash /agent/tools/corpus-search/corpus-search.sh status` to see which kinds are actually indexed in this workspace. An empty store means no indexing has happened yet, not that no such content exists.
- For agent-side parsing, use `--format json`. For showing the user, use the default human format.

Prefer `Bash` with `rg`/`grep` instead when the task is a single file the user already named, an exact-phrase lookup, or source code search.

<!-- /use-case: corpus-search -->
