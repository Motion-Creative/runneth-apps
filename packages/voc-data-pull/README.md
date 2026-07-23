# voc-data-pull

Installer package that pulls raw voice-of-customer (VoC) data - product reviews, support
conversations, and ad comments - from a connected platform into standardized files in the
org brain: **one file per review/ticket/comment**, metadata header + body.

This is an installer package under `packages/`, not a use-case-library card; it does not
appear in the public site catalog.

## How it's built

- `package.json` - the installer manifest. A directory resource installs `skill/` to
  `agent_skills/voc-data-pull`, and a `package_instruction` resource
  (`instructions/activation.md`) lands in the agent's standing instructions pointing at
  the skill's setup procedure.
- `skill/SKILL.md` - the pull workflow and the recurring-sync setup procedure: when a
  covered platform is connected and its `voc-sync-<platform>` routine doesn't exist,
  Runneth creates the daily sync routine and kicks its first run (the backfill) in the
  background - pulls never run inside the user's conversation. Routine absence is the
  setup trigger, so cancel-and-reconnect re-sets-up cleanly. Also: resolve the connection
  path (Pipedream OAuth vs stored secret vs Motion native), follow the platform recipe,
  write files under `/agent/brain/data-sources/voc/<platform>/`, report.
- `skill/references/platform-recipes.md` - per-platform endpoints, pagination, discovery
  steps, and unified-template field mappings, with evidence levels (live-verified vs
  doc-grounded).
- `skill/templates/` - copyable file skeletons for the four output shapes (review,
  support conversation, ad comment, community post).

## How it installs

`installPolicy: manual` - the team installs this package per VM, and `updatePolicy: auto`
keeps installed copies current from `main` on every package sync. To install durably from
the index, run in the sandbox:

```
package intent add-optional voc-data-pull
package sync
```

Installing is desired-state: re-installs and double-fires are no-ops. Nothing happens
automatically after install: the team manually triggers setup (directly or via an
onboarding run, with the integration already connected as a pre-req), and Runneth then
creates the daily sync routines per the skill's setup procedure. The `integration:<slug>`
categories are retained as metadata and for a future flip back to connect-time
auto-install; the authoritative per-platform table is SKILL.md Step 1.

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
