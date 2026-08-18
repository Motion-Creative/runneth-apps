<!-- BEGIN runneth:knoweth-brain v5 -->
Knoweth brain discipline (all writes, going forward):
- Workspace folder: `/agent/brain/<brand>/`, where `<brand>` is this conversation's
  brand name (the workspace's name) slugged - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen, trim leading and trailing hyphens ("Bramblewick NYC" -> `bramblewick-nyc`, "St. Fig & Co." -> `st-fig-co`). Resolve it per conversation; the
  `<brand>` token stays literal in this file. Account-specific content belongs in this
  conversation's workspace folder - never in another workspace's folder, and never at the brain
  root where two workspaces would blur together.
- On every save (from a pull, a conversation, or an upload), route it: raw vs compiled vs spec; the
  workspace folder and data-source family within it (voc -> /agent/brain/<brand>/integrations/voice-of-customer/**,
  meta -> /agent/brain/<brand>/integrations/meta/**); tags/attributes and provenance,
  including which workspace the content describes. Raw VoC files keep their skill-owned format -
  never add tags or front-matter to them; facet vocabulary goes in the compiled analysis pages
  that cite them. The later cross-platform VoC audit lives only at
  /agent/brain/<brand>/integrations/voice-of-customer/voice-of-customer-audit.md; raw syncs do not create
  it. It is searchable where it lives; the folder is for human navigation. Cacheth is the system of record for per-creative content: write a
  per-creative file only when a person explicitly asks, and treat it as a dated snapshot (the
  cache stays the retrieval source of truth for current facts). Performance metrics are pulled
  live via the motion CLI, never saved.
- For any question about why customers respond, what to make next, messaging, pain points,
  objections, transformations, personas, or customer language, read
  `/agent/brain/<brand>/integrations/voice-of-customer/voice-of-customer-audit.md` when it exists, then verify
  important claims against the raw VoC files it cites. The audit informs customer-side WHY;
  it never replaces live performance metrics or creative content.
- Keep compiled pages in sync with raw: new evidence restales and regenerates the dependent page; a
  correction updates the compiled page (never raw) and propagates. Exception: the Voice of
  Customer Audit is manually triggered - if raw VoC is newer than its `last_compiled`, treat
  the audit as stale, disclose its coverage date when using it, and offer a rerun, but never
  regenerate it without a person's yes. Curate, do not append: merge into the existing page
  rather than spawning a duplicate. Merge only within one workspace - two workspaces
  describing the same platform stay two pages.
- Adopt stray human-added files (classify and tag, or flag) without moving the human's folders.
  Default new dimensions to tags; retrieval scopes are owned by the runtime, never hand-carved.
- Keep one brain-maintenance routine: run `routine list --search "brain-maintenance"`; if absent,
  create it (a scheduled sweep for stray/untagged files, duplicates, stale pages, retention
  candidates, and the brain map's freshness - new homes and banks get their map lines, entry
  dates and bank coverage windows get refreshed, and a map that is missing, truncated, or
  stale gets rebuilt from a scan without touching carried-over entries; per-creative files in the brain exist only by a person's explicit ask - if the
  sweep finds ones of unknown provenance, ask the person before archiving, never silently move
  or delete them) and never run the sweep in-conversation. One routine covers the whole brain;
  it never merges content across workspace folders.
<!-- END runneth:knoweth-brain v5 -->
