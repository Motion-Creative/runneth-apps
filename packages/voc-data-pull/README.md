# voc-data-pull

Installer package that pulls raw voice-of-customer (VoC) data - product reviews, support
conversations, and ad comments - from a connected platform into standardized files in the
org brain: **one file per review/ticket/comment**, metadata header + body.

This is an installer package under `packages/`, not a use-case-library card; it does not
appear in the public site catalog.

## How it's built

- `package.json` - the installer manifest. A directory resource installs `skill/` to
  `agent_skills/voc-data-pull`, and a `package_instruction` resource
  (`instructions/activation.md`) lands in the agent's standing instructions: when a
  covered platform is connected and its `voc-sync-<platform>` routine doesn't exist,
  Runneth creates the daily sync routine and kicks its first run (the backfill) in the
  background - pulls never run inside the user's conversation. Routine absence is the
  setup trigger, so cancel-and-reconnect re-sets-up cleanly.
- `skill/SKILL.md` - the pull workflow: resolve the connection path (Pipedream OAuth vs
  stored secret vs Motion native), follow the platform recipe, write files under
  `/agent/brain/data-sources/voc/<platform>/`, report.
- `skill/references/platform-recipes.md` - per-platform endpoints, pagination, discovery
  steps, and unified-template field mappings, with evidence levels (live-verified vs
  doc-grounded).
- `skill/templates/` - copyable file skeletons for the four output shapes (review,
  support conversation, ad comment, community post).

## How it installs

The root `package-index.json` lists this package with one `integration:<slug>` category per
VoC platform. When a sandbox's package intent gains one of those connected-integration slugs
(automatically on connect, or manually via `package intent add-integration <slug>`), the
reconciler selects this package and the installer installs it. Installing is desired-state:
re-installs and double-fires are no-ops.

The covered platforms are the `integration:<slug>` categories in the index entry; the
authoritative per-platform table is SKILL.md Step 1. The secrets-path platforms (Okendo,
Stamped) have no Pipedream connect; add the intent manually or via the CSM-prompted path.

## The output contract

Every file: an H1 headline plus a bold-label human header (org custom fields surface as
their own header labels), the review text or full conversation as
readable content, and a collapsed metadata block carrying the unified VoC record - one
flat yaml shape for every item, all fields always present, `null` when the source lacks
the concept. Raw platform payloads are not persisted (a flagged deviation from the
proposed template, pending sign-off). See `skill/SKILL.md` for the layout and field table.
Data files are deliberately separate from integration guides: nothing is ever written into
`/agent/brain/integrations/<source>/`.

## Known v1 gaps

The authoritative list lives in `skill/SKILL.md` ("Known v1 gaps" + the PII hard boundary).
In short: Junip blocked on a key; Okendo/Stamped need stored customer keys;
Trustpilot/Yotpo doc-grounded pending first connects; the PII policy call is open
(`author_contact` stays null); and dropping the template's `raw` column from files is a
flagged deviation pending template sign-off.
