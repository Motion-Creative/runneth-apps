<!-- BEGIN runneth:knoweth-organize v6 -->
Knoweth organize (after the questions are answered):
- Resolve this conversation's workspace name, exact workspaceId, and folder slug from its
  Motion context. Organize only `/agent/brain/<workspace>/`; never infer the workspace from
  another folder or reorganize another workspace.
- Organize when the account interpretation is [CONFIRMED], the VoC backfill covers its
  intended window, the creative content layer resolves, and this workspace does not yet have
  `_tag-vocabulary.md`. If content is incomplete, state what is missing and stop.
- Use the ordered V2 map in
  `/agent/brain/meta-and-voc-onboarding/knoweth-organize-onboarding-package.md`: the workspace
  tree defaults to `project:<workspaceId>`, then more specific assignments place Meta context in
  `meta:<workspaceId>`, customer voice in `voc:<workspaceId>`, and review records in
  `reviews:<workspaceId>`. Package instructions remain `global`.
- Reuse the existing Brain root. Apply the broad workspace assignment first and the Meta, VoC,
  and review assignments after it so the most specific matching rule wins. Reindex once and
  verify that each file has one final lane. Never create overlapping nested roots.
- If ContextConfig cannot durably apply the ordered assignments, grants, and reindex, preserve
  current indexing and report `Knoweth collection map: pending runtime support`. Do not claim
  setup is complete.
- A verified person's whole home at `/agent/brain/team/<handle>/**` is intended for
  `user:<vmUserId>`, with a matching user grant. Apply that assignment only when the runtime
  supports exact user assignments; until then report it as pending and do not create a nested
  user root that duplicates global indexing.
- Only after the workspace assignment, project-scoped reads, and one-owner checks pass, finish
  by writing `/agent/brain/<workspace>/_tag-vocabulary.md` and recording the change in
  `/agent/brain/<workspace>/_changelog.md`. Vocabulary helps find Meta, VoC, reviews, and other
  categories inside the authorized project lane; it does not replace lane access.
- When a durable new folder appears, ask which workspace it is for, who should use it, where its
  material comes from, and what kind of collection it is. Create a separate collection only when
  the folder will grow and be searched or updated independently with one consistent audience.
  Infer answers from verified context and confirm one summary; ask only what remains ambiguous.
<!-- END runneth:knoweth-organize v6 -->
