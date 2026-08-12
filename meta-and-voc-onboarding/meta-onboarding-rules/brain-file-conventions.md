<!-- BEGIN runneth:knoweth-brain v5 -->
Knoweth brain discipline (all writes, going forward):
- Save workspace-specific knowledge under `/agent/brain/<workspace>/`, resolved from the
  current Motion context. Meta interpretation belongs in `data-sources/meta/**`; raw and
  compiled customer voice belongs in `data-sources/voc/**`.
- Preserve the V2 ownership map: general workspace files use `project:<workspaceId>`, Meta
  uses `meta:<workspaceId>`, non-review VoC uses `voc:<workspaceId>`, and files named
  `review-*.md` use `reviews:<workspaceId>`. Put source and workspace words in the file so
  retrieval can narrow further inside the selected lane.
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
  move across a workspace, data-source, or person boundary, preserve the file, repair durable
  path references, update the assignment, reindex, and verify one indexed owner.
- Keep one brain-maintenance routine for stray files, duplicates, stale compiled pages, and
  retention candidates. It may classify or flag human-added files, but it never silently
  moves, deletes, or changes the retrieval owner of customer files.
<!-- END runneth:knoweth-brain v5 -->
