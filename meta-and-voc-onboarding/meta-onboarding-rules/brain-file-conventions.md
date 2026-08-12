<!-- BEGIN runneth:knoweth-brain v6 -->
Knoweth brain discipline (all writes, going forward):
- Save workspace-specific knowledge under `/agent/brain/<workspace>/`, resolved from the
  current Motion context. Meta interpretation belongs in `data-sources/meta/**`; raw and
  compiled customer voice belongs in `data-sources/voc/**`.
- Preserve the ordered V2 ownership map. General workspace files use
  `project:<workspaceId>`; `data-sources/meta/**` uses `meta:<workspaceId>`;
  `data-sources/voc/**` uses `voc:<workspaceId>`; and `review-*.md` uses
  `reviews:<workspaceId>`. One file has one final lane. The workspace grant authorizes the full
  set, while paths and file contents provide the remaining search signals.
- Save a verified person's durable preferences and supporting personal context under that
  person's single `/agent/brain/team/<handle>/` home. The whole home belongs to
  `user:<vmUserId>`. Never combine two people's preferences in one file or copy personal
  context into shared workspace knowledge.
- A person's `user.md` may contain confirmed communication style, working preferences,
  app-display preferences, recurring defaults, role, and canonical-home metadata. Record no
  preference that the person did not state or confirm. `/agent/user.md` is the VM-wide
  instruction file, not a personal profile.
- Keep the verified identity-to-home directory in global `/agent/brain/runneth.md`: stable
  `vmUserId`, display name, handle, aliases, and canonical home path only. When Teameth first
  verifies a person, update this resolver and activate their whole-home assignment and user
  grant before saving private context.
- Raw VoC files keep the format owned by the voc-data-pull skill. The compiled audit remains
  `data-sources/voc/voice-of-customer-audit.md`; raw syncs do not create it. Cacheth remains
  the source of truth for current creative records, and performance remains a live Motion CLI
  read.
- Curate instead of appending duplicates. New evidence updates its dependent compiled page;
  a correction changes compiled understanding, never raw evidence. The Voice of Customer
  Audit remains human-triggered and discloses its coverage when stale.
- A folder path expresses intended ownership but does not prove active Knoweth setup. After a
  move across a workspace, person, Meta, VoC, review, or other collection boundary, preserve the
  file, repair durable path references, apply the matching assignment, reindex, and verify one
  final lane.
- For a durable new folder, ask: which workspace is it about, who should use it, where does its
  material come from, and what kind of collection is it? Treat ownership as descriptive context;
  use a user-only grant only when the folder is actually private to that person.
- Keep one brain-maintenance routine for stray files, duplicates, stale compiled pages, and
  retention candidates. It may classify or flag human-added files, but it never silently
  moves, deletes, or changes the retrieval owner of customer files.
<!-- END runneth:knoweth-brain v6 -->
