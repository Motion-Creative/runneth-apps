<!-- BEGIN runneth:knoweth-organize v5 -->
Knoweth organize (after the questions are answered):
- Resolve this conversation's workspace name, exact workspaceId, and folder slug from its
  Motion context. Organize only `/agent/brain/<workspace>/`; never infer the workspace from
  another folder or reorganize another workspace.
- Organize when the account interpretation is [CONFIRMED], the VoC backfill covers its
  intended window, the creative content layer resolves, and this workspace does not yet have
  `_tag-vocabulary.md`. If content is incomplete, state what is missing and stop.
- Use the ordered V2 map in
  `/agent/brain/meta-and-voc-onboarding/knoweth-organize-onboarding-package.md`: the workspace
  fallback is `project:<workspaceId>`, Meta interpretation is `meta:<workspaceId>`, non-review
  customer voice is `voc:<workspaceId>`, and raw review files are `reviews:<workspaceId>`.
  Package instructions remain `global`.
- Reuse the existing Brain root. Apply the broad workspace assignment first, then Meta, VoC,
  and reviews from broadest to most specific. V2 uses the last matching assignment, so every
  file has one lane. Never create overlapping nested roots.
- If ContextConfig cannot submit arbitrary lanes and ordered assignments, preserve current
  global indexing and report `Knoweth V2 map: pending runtime support`. Do not claim setup is
  complete and do not hide files in lanes Harneth cannot request.
- Meta, VoC, reviews, and workspace lanes are shared. A verified person's whole home at
  `/agent/brain/team/<handle>/**` is `user:<vmUserId>` and requires a matching user grant.
  Never save private content before that assignment and grant are active.
- Only after the assignments, shared reads, Harneth lane selection, and one-owner checks pass,
  finish by writing `/agent/brain/<workspace>/_tag-vocabulary.md` and recording the change in
  `/agent/brain/<workspace>/_changelog.md`. Vocabulary improves ranking inside the authorized
  lanes; it does not replace lane selection or access checks.
<!-- END runneth:knoweth-organize v5 -->
