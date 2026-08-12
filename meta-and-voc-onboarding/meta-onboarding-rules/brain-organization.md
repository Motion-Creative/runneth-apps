<!-- BEGIN runneth:knoweth-organize v5 -->
Knoweth organize (after the questions are answered):
- Resolve this conversation's workspace name, exact workspaceId, and folder slug from its
  Motion context. Organize only `/agent/brain/<workspace>/`; never infer the workspace from
  another folder or reorganize another workspace.
- Organize when the account interpretation is [CONFIRMED], the VoC backfill covers its
  intended window, the creative content layer resolves, and this workspace does not yet
  have `_tag-vocabulary.md`. If content is incomplete, state what is missing and stop.
- Use the V2 taxonomy in
  `/agent/brain/meta-and-voc-onboarding/knoweth-organize-onboarding-package.md`:
  installed package guidance is `global`; the entire workspace folder is
  `project:<workspaceId>`; a verified person's whole home is `user:<vmUserId>`.
- Meta, VoC, platform, product, campaign, brand, process, and initiative are not lanes.
  Keep those distinctions in folders and searchable content. `project` means the exact
  Motion workspace ID only.
- Verify effective configuration rather than inferring a lane from a folder. The clean V2
  shape is one existing Brain root plus a root-relative assignment and grant. If only the
  create-only ContextConfig endpoint is available, do not add a nested root: it would
  duplicate the workspace files in global and project lanes. Report the assignment as
  pending for the trusted config owner.
- Finish by writing `/agent/brain/<workspace>/_tag-vocabulary.md` and recording the change
  in `/agent/brain/<workspace>/_changelog.md`. These improve findability inside the
  authorized project lane; they do not replace its assignment or grant.
<!-- END runneth:knoweth-organize v5 -->
