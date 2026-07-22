# voc-data-pull

Installer package that pulls raw voice-of-customer (VoC) data - product reviews, support
conversations, and ad comments - from a connected platform into standardized files in the
org brain: **one file per review/ticket/comment**, metadata header + body.

This is an installer package under `packages/`, not a use-case-library card; it does not
appear in the public site catalog.

## How it's built

- `package.json` - the installer manifest. A directory resource installs `skill/` to
  `agent_skills/voc-data-pull`, and a `package_instruction` resource
  (`instructions/activation.md`) lands in the agent's standing instructions so Runneth
  knows to offer the first pull after a VoC platform connects (offer only - pulls start on
  user confirmation).
- `skill/SKILL.md` - the pull workflow: resolve the connection path (Pipedream OAuth vs
  stored secret vs Motion native), follow the platform recipe, write files under
  `/agent/brain/data-sources/<platform>/`, report.
- `skill/references/platform-recipes.md` - per-platform endpoints, pagination, discovery
  steps, and unified-template field mappings, with evidence levels (live-verified vs
  doc-grounded).
- `skill/templates/` - copyable file skeletons for the three output shapes (review,
  support conversation, ad comment).

## How it installs

The root `package-index.json` lists this package with one `integration:<slug>` category per
VoC platform. When a sandbox's package intent gains one of those connected-integration slugs
(automatically on connect, or manually via `package intent add-integration <slug>`), the
reconciler selects this package and the installer installs it. Installing is desired-state:
re-installs and double-fires are no-ops.

Covered platform slugs: `judge_me`, `trustpilot`, `yotpo`, `junip`, `gorgias_oauth`,
`intercom`, plus the secrets-path platforms `okendo` and `stamped` (no Pipedream connect
exists for those two; add the intent manually or via the CSM-prompted path).

## The output contract

Every file: an H1 headline plus a bold-label human header (the Ramy Brook shape - org
custom fields surface as their own labels), the review text or full conversation as
readable content, and a collapsed metadata block carrying the unified VoC record - one
flat yaml shape for every item, all fields always present, `null` when the source lacks
the concept. Raw platform payloads are not persisted (a flagged deviation from the
proposed template, pending sign-off). See `skill/SKILL.md` for the layout and field table.
Data files are deliberately separate from integration guides: nothing is ever written into
`/agent/brain/integrations/<source>/`.

## Known v1 gaps

The authoritative list lives in `skill/SKILL.md` ("Known v1 gaps" + the PII hard boundary).
In short: Junip blocked on a key; Okendo/Stamped need stored customer keys;
Trustpilot/Yotpo doc-grounded pending first connects; no automatic post-install trigger
(CSM/user prompt starts pulls); the PII policy call is open (`author_contact` stays null);
and dropping the template's `raw` column from files is a flagged deviation pending
template sign-off.
