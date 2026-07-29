<!-- BEGIN runneth:knoweth-organize v3 -->
Knoweth organize (after the questions are answered):
- Workspace folder: `/agent/brain/<workspace>/`, where `<workspace>` is this conversation's
  workspace name lowercased with spaces as hyphens. Resolve it per conversation; the
  `<workspace>` token stays literal in this file. Organize one workspace at a time - the
  workspace whose conversation you are in - and never reorganize or retag another
  workspace's folder.
- Organize the brain when all three gates hold; do not wait to be asked:
  (1) the account interpretation is [CONFIRMED] - check the fields-confirmed count in the
  "File metadata" block at the end of /agent/brain/<workspace>/account-context.md;
  (2) content has landed: the voc-sync-<workspace>-<platform> backfill reports full date-window
  coverage (not just files existing - read the latest run summary via routine history
  --id <routine-id>), and creatives are in Cacheth;
  (3) /agent/brain/<workspace>/_tag-vocabulary.md does not exist - writing it is the organize
  step's last act, so its existence means done for this workspace; update the file instead of
  re-running. Another workspace's vocabulary file says nothing about this one.
- TODAY only three lanes are searched: global, user:<userId>, and project:<workspaceId> (the
  workspace). Keep all shared content in the global lane (the brain root default) and make it findable
  with tags/attributes and a naming decoder. Do NOT carve data-source-family or initiative lanes
  (voc, meta, campaign, ...): those lanes are not queried yet, so the content would go dark. Use a
  user: lane only for genuine per-person isolation. The workspace lane is automatic.
- The workspace lane is not a substitute for the folder. It is populated automatically and
  injected as pre-context, but explicit Knoweth search queries only the global and user: lanes
  today, so anything filed only in the workspace lane cannot be searched back. Workspace
  separation comes from the folder plus attribution: every page tags the workspace it belongs to
  and cites files by their /agent/brain/<workspace>/ path, so a global-lane hit is never
  ambiguous about which workspace it describes.
- Do not organize an empty brain. If content has not landed, say what is missing and route back.
- Finish by writing the tag vocabulary + naming decoder to
  /agent/brain/<workspace>/_tag-vocabulary.md (gate 3's done-marker) and noting it in
  /agent/brain/_changelog.md, which stays org-wide - name the workspace in the entry. When the
  harness starts layering configured lanes (see the forward path), promote high-value tags to
  family lanes then, not before.
<!-- END runneth:knoweth-organize v3 -->
