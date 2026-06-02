# Changelog

All notable changes to `deploy-security-protocol` are documented here.

---

## Unreleased

### Changed

- **Map file renamed: `workspace-map.json` → `organization-map.json`.**
  The file is the organization-wide identity registry, not a workspace-scoped
  artifact, and the new name is clearer. Pure rename: structure, schema,
  resolution behavior, and merge semantics are unchanged. Default path stays
  at `/agent/brain/admin/`. Env override variable renamed
  `RUNNETH_WORKSPACE_MAP` → `RUNNETH_ORG_MAP`.

- **`motion-whoami.sh` is now Neon-first.** The local SQLite
  `conversations.db` is unreliable for brand-new conversations (live DB is a
  0-byte placeholder for the agent; backups run every 30 min), which made
  motion-whoami fail for the first message in a fresh chat. The authoritative
  source is Neon's `agent_conversation` table — same pattern proven out in
  `/agent/tools/admin/whoami.sh` + `_neon_resolve_conv.py`. The skill now
  installs a small `motion-whoami-neon.py` helper alongside
  `motion-whoami.sh`. The shell script tries Neon first via
  `secret run --env DATABASE_URL=NEON_DATABASE_URL -- python3 motion-whoami-neon.py`
  and falls back to the SQLite snapshot only when Neon is unreachable. Also
  accepts `CONVERSATION_ID` from env (which the Runneth runtime sets) in
  addition to the cwd-basename fallback.

### Added

- **`motion-whoami-neon.py` helper.** Small psycopg query against
  `agent_conversation`. Read-only. Returns
  `{ user_email, workspace_id, organization_id, mondrian_user_id }` for the
  given conversation id. Exit code 7 for recoverable misses, 8 for connection
  failures.

  Refs: PDEC-7817.

  Migration of existing orgs from `workspace-map.json` → `organization-map.json`
  is deferred to a follow-up once both `team-member-memory` and
  `add-roles-permissions` are stable.

---


## v2.0.0 — 2026-05-13

Merged release combining v1's identity-verified mode integrity with
swim-lane scopes, dual-platform identity, and system-scaffold protections.

### Added

- **Swim-lane scopes.** `scope: "admin"` and `scope: "team"` replace v1's
  flat user scope. Each scope has its own operating-rules file —
  `admin_mode.md` and `team_mode.md` supersede v1's single `user_mode.md`.
- **`motion-whoami.sh` resolver.** New `@motionapp.com` email resolver
  alongside the existing `slack-whoami.sh`. Both return the same
  `{scope, handle, home_base}` for the same person.
- **`motionEmails` keyed map.** `workspace-map.json` gains a top-level
  `motionEmails` map so Motion-side resolution is symmetric with the
  existing `slackUserIds` map.
- **Auto-provisioning.** Both resolvers create a team-scope entry and home
  base for unknown verified IDs on first message. No pending state, no
  admin gate — risk is bounded because team writes are confined to home
  base.
- **`locked-list.md`.** New file enumerating system-scaffold paths
  (`/agent/brain/permissions/`, `/agent/brain/org/integrations/`,
  `/agent/.agents/skills/`, `/agent/INDEX.md`, `/agent/user.md`) that
  admins can edit only with explicit per-action confirmation. Team scope
  cannot edit them at all.
- **Collision detection.** Resolvers return `status: "collision"` when an
  unknown identifier looks like an existing entry; the agent must ask
  before associating. Identities are never auto-merged.
- **`admin_slack_channel` config.** `/agent/brain/permissions/config.json`
  formalises the Slack channel where team-scope org-change requests get
  routed for admin review.
- **Schema-level attribution.** Routine executor automatically appends
  `(routine by @<handle>)` footers to channel posts and DMs; authors no
  longer write them manually.
- **Both platforms first-class.** Slack ID and `@motionapp.com` email each
  resolve independently to the same scope and home base — neither is
  primary.

### Changed

- **Folder layout split.** v1's `/agent/brain/users/<handle>/` is now
  `/agent/brain/admins/<handle>/` for admins and
  `/agent/brain/team/<handle>/` for team scope. Cross-user writes remain
  blocked at every scope, including admin.
- **`workspace-map.json` schema.** Per-entry `scope` field added.
  Top-level keys reorganised: `slackUserIds`, `motionEmails`, `workspaces`,
  `team`.
- **`admins.md` semantics.** A line is now matched as either a Slack ID or
  an `@motionapp.com` email — whichever the sender's verified message
  presents.
- **MANDATORY PERMISSION PROTOCOL block.** Updated to reference dual
  resolvers, auto-provisioning, locked-list paths, and per-skill admin
  verification for org-level writes.
- **Pre-flight scan.** Expanded from three checks in v1 to eight in v2,
  adding security-compromising-content detection, partial-install
  detection, and locked-list comparison.

### Migration from v1

The skill includes a dedicated "Migration from v1" section covering
identity migration (`index.json` → `workspace-map.json`), folder
migration (`users/` → `admins/` + `team/`), mode-file archival
(`user_mode.md` → `user_mode.md.v1-archive`), and protocol-block
replacement. Every step requires explicit user confirmation.

---

## v1.0.0 — initial release

- Identity-verified mode integrity with kernel-level prompt-injection
  defenses (the MANDATORY PERMISSION PROTOCOL block prepended to
  `/agent/user.md`).
- Single `user_mode.md` operating-rules file.
- Flat `/agent/brain/users/<handle>/` home-base structure.
- Slack-only resolver (`slack-whoami.sh`).
- `workspace-map.json` with `slackUserIds` and `workspaces` maps;
  flat `index.json`-style entries.
- Admin registry in `admins.md` (Slack IDs only).
