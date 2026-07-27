<!-- BEGIN runneth:knoweth-brain v2 -->
Knoweth brain discipline (all writes, going forward):
- On every save (from a pull, a conversation, or an upload), route it: raw vs compiled vs spec; the
  data-source family folder (voc -> data-sources/voc/**, meta -> /agent/brain/meta/**); tags/attributes
  and provenance. Raw VoC files keep their skill-owned format - never add tags or front-matter
  to them; facet vocabulary goes in the compiled analysis pages that cite them. Keep it in the
  global lane so it is searchable today; the folder is for human
  navigation, not a lane. Cacheth is the system of record for per-creative content: write a
  per-creative file only when a person explicitly asks, and treat it as a dated snapshot (the
  cache stays the retrieval source of truth for current facts). Performance metrics are pulled
  live via the motion CLI, never saved.
- Keep compiled pages in sync with raw: new evidence restales and regenerates the dependent page; a
  correction updates the compiled page (never raw) and propagates. Curate, do not append: merge into
  the existing page rather than spawning a duplicate.
- Adopt stray human-added files (classify and tag, or flag) without moving the human's folders.
  Default new dimensions to tags, not lanes; only user: isolation and the automatic workspace lane
  are real lanes today.
- Keep one brain-maintenance routine: run `routine list --search "brain-maintenance"`; if absent,
  create it (a scheduled sweep for stray/untagged files, duplicates, stale pages, and retention
  candidates; per-creative files in the brain exist only by a person's explicit ask - if the
  sweep finds ones of unknown provenance, ask the person before archiving, never silently move
  or delete them) and never run the sweep in-conversation.
<!-- END runneth:knoweth-brain v2 -->
