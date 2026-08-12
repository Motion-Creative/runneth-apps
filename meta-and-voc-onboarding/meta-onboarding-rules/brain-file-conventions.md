<!-- BEGIN runneth:knoweth-brain v5 -->
Knoweth brain discipline (all writes, going forward):
- Save workspace-specific knowledge under `/agent/brain/<workspace>/`, resolved from the
  current Motion context. Meta interpretation belongs in `data-sources/meta/**`; raw and
  compiled customer voice belongs in `data-sources/voc/**`. This whole folder's target V2
  owner is `project:<workspaceId>`.
- Save durable personal defaults and supporting personal context under
  `/agent/brain/team/<handle>/**`. The whole verified person home's target V2 owner is
  `user:<vmUserId>`. Never combine two people's defaults in one file or copy one person's
  private context into shared workspace knowledge.
- When Teameth first verifies a person on the VM, create their small `user.md`, register
  their canonical home in `runneth.md`, and verify their assignment and grant. Record no
  personal defaults until that person states or confirms them.
- Keep the verified identity-to-home map in global `/agent/brain/runneth.md`; store no
  personal preferences there. `/agent/user.md` is the VM-wide instruction file, not a
  person's profile or user lane.
- Keep package instructions and genuinely cross-workspace guidance global. Use folders and
  searchable terms for Meta, VoC, platform, product, campaign, brand, process, and
  initiative; do not create lanes for them. `project` always means the Motion workspace.
- Raw VoC files keep the format owned by the voc-data-pull skill. The later compiled audit
  lives at `data-sources/voc/voice-of-customer-audit.md`; raw syncs do not create it.
  Cacheth remains the source of truth for current creative records, and performance remains
  a live Motion CLI read.
- Curate instead of appending duplicates. New evidence updates its dependent compiled page;
  a correction changes the compiled understanding, never raw evidence. The Voice of
  Customer Audit remains human-triggered and discloses its coverage when stale.
- A folder path expresses intended ownership but does not prove effective retrieval access.
  After a move across a workspace or person boundary, preserve the file, update references,
  update the V2 assignment through the trusted config path, reindex, and verify one indexed
  owner. Never create an overlapping nested root.
- Keep one brain-maintenance routine for stray files, duplicates, stale compiled pages, and
  retention candidates. It may classify or flag human-added files, but it never silently
  move, delete, or change the retrieval owner of customer files.
<!-- END runneth:knoweth-brain v5 -->
