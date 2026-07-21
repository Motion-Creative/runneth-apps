# voc-data-pull

Installer package that pulls raw voice-of-customer (VoC) data - product reviews, support
conversations, and ad comments - from a connected platform into standardized files in the
org brain: **one file per review/ticket/comment**, metadata header + body.

## How it's built

- `package.json` - the installer manifest. One directory resource installs `skill/` to
  `agent_skills/voc-data-pull`.
- `skill/SKILL.md` - the pull workflow: resolve the connection path (Pipedream OAuth vs
  stored secret vs Motion native), follow the platform recipe, write files under
  `/agent/brain/data-sources/<platform>/`, report.
- `skill/references/platform-recipes.md` - per-platform endpoints, pagination, discovery
  steps, and unified-template field mappings, with evidence levels (live-verified vs
  doc-grounded).
- `skill/templates/review.md` and `skill/templates/support-conversation.md` - copyable file
  skeletons for the two output shapes.

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

One flat metadata record shape for every VoC item - all fields always present, `null` when
the source lacks the concept - with the review text or full conversation as the file body
and the untouched platform payload preserved at the bottom. See `skill/SKILL.md` for the
field table. Raw data files are deliberately separate from integration guides: nothing is
ever written into `/agent/brain/integrations/<source>/`.

## Known v1 gaps

- Junip has no verified working API key; its recipe is doc-grounded.
- Okendo and Stamped need customer API keys stored as secrets before any pull.
- Trustpilot and Yotpo recipes are doc-grounded pending first connects.
- Nothing triggers the pull automatically post-install yet; a CSM or user prompt starts it
  (routine triggers land separately).
- `author_contact` stays null in output files pending the PII policy call.
