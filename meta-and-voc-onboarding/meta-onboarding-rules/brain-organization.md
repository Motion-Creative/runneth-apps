<!-- BEGIN runneth:knoweth-organize v5 -->
Knoweth organize (after the questions are answered):
- Workspace folder: `/agent/brain/<brand>/`, where `<brand>` is this conversation's
  brand name (the workspace's name) slugged - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen, trim leading and trailing hyphens ("Bramblewick NYC" -> `bramblewick-nyc`, "St. Fig & Co." -> `st-fig-co`). Resolve it per conversation; the
  `<brand>` token stays literal in this file. Organize one workspace at a time - the
  workspace whose conversation you are in - and never reorganize or retag another
  workspace's folder.
- Organize the brain when all three gates hold; do not wait to be asked:
  (1) the account interpretation is [CONFIRMED] - check the fields-confirmed count in the
  "File metadata" block at the end of /agent/brain/<brand>/integrations/meta/account-context.md;
  (2) content has landed: the voc-sync-<brand>-<platform> backfill reports full date-window
  coverage (not just files existing - read the latest run summary via routine history
  --id <routine-id>), and the creative content layer resolves (creatives in Cacheth - or,
  where the sandbox cache feature is disabled, live content pulls per the Cacheth Command
  Reference's ladder);
  (3) /agent/brain/<brand>/_tag-vocabulary.md does not exist - writing it is the organize
  step's last act, so its existence means done for this workspace; update the file instead of
  re-running. Another workspace's vocabulary file says nothing about this one.
- Retrieval scopes are owned by the runtime - never create, request, or promise lanes or
  search scopes from here. Keep shared content findable where it lives with tags/attributes
  and a naming decoder, and record what each folder is (its type and owner) in the brain map.
- Workspace separation comes from the folder plus attribution: every page tags the
  workspace it belongs to and cites files by their /agent/brain/<brand>/ path, so a
  search hit is never ambiguous about which workspace it describes.
- Do not organize an empty brain. If content has not landed, say what is missing and route back.
- Finish by writing the tag vocabulary + naming decoder to
  /agent/brain/<brand>/_tag-vocabulary.md (gate 3's done-marker) and noting it in
  /agent/brain/<brand>/_changelog.md, then give the workspace folder and its banks their
  brain-map entries and type labels.
<!-- END runneth:knoweth-organize v5 -->
