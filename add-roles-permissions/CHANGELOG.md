# Changelog

All notable changes to `deploy-security-protocol` are documented here.

---

## Unreleased

(nothing yet)

---

## v3.0.0 — 2026-06-02
Major rewrite around six primitives instead of two modes. The permissive-vs-strict framing is gone. The system is built from a small set of primitives that compose into whatever the org's strategy requires.

### Changed

- **No more modes.** Permissive vs strict is gone. Each space has its own writer rule. Wide-open and locked-down spaces coexist in the same install. The skill never asks "permissive or strict?" because that decision lives at the space level.
- **`spaces.json` replaces `mode.json`.** Records the spaces, writer rules, and approval channel. Lives at `/agent/brain/admin/spaces.json`. Editable by admins only.
- **Single `permissions.md` template.** Generated from `spaces.json` instead of selected from a permissive variant or a strict variant. Lists each space and its writer rule explicitly.
- **Protocol pointer simplified.** No longer routes based on a mode field. Points to `permissions.md` and the spaces config.
- **Reconfigure is incremental.** "Tighten up the client space" / "open up the shared space" / "add a new space" instead of a mode switch.

### Added

- **The six primitives.** People (access registry), spaces (folders in the brain), writers per space (`everyone` | `specific` | `admins_only`, default `everyone`), attribution (always on), approval routing (optional Slack channel), identity resolution (Neon-only).
- **Phase 2 welcome** with a 4-bullet outcome overview, followed by the opening question in the same turn. No "sound good?" round-trip.
- **Phase 3 conversation** listens for six things across a flowing chat: team, work shape, content to keep organized, areas where only certain people should make changes, areas anyone should be able to contribute to, first admin (plus an approval-channel follow-up if protected areas come up). The agent never uses the words `permissive`, `strict`, `scope`, `writer map`, `locked path`, `home base`, `resolver`, `organization-map.json`, or `spaces.json` with the admin.
- **Phase 4 readback** in plain language first, then a setup plan in plain language. Confirms before any writes.
- **Phase 5 deployment** writes a single permissions.md generated from spaces.json. No template selection.
- **Phase 7 setup checklist** is one consistent message.
- **Implicit spaces** that are never configurable: `/agent/brain/admin/` (admins only), `/agent/brain/members/<handle>/` (owner only), and the shared infrastructure paths (`INDEX.md`, `routines.md`, `.agents/skills/`, `apps/`, admins only).
- **Step 8 auto-cleans the team-member-memory v2.0.1 user.md leak** if found, with admin confirmation.

### Migration

- From **v2.3.0 (post-PR-#98)**: re-run the skill; existing `permissions.md` rules are read and proposed as a `spaces.json` for the admin to review. Identity entries preserved.
- From any interim v3 preview with a `mode.json` file: Phase 1 Check 3 detects it; Phase 5 offers to translate the contents into `spaces.json` and remove the old file.
- From **v2.x with `workspace-map.json`** (pre-PR-#98): Phase 1 Check 3 detects, Phase 5 Step 2 renames and carries entries.
- From **v1**: identity migration, folder migration (`/agent/brain/users/` → `/agent/brain/members/`), `permissions.md` regenerated.

Refs: PDEC-7817.

### Hardening (pre-merge review)

Fresh-eyes review surfaced ten failure modes. All addressed in-PR:

1. **Approval-channel mechanic implemented.** `permissions.md` §5 now spells out the exact flow: draft request, show it to the requester, post via `slack send` on confirmation, wait for explicit admin approval before executing. No more vapor feature.
2. **Slug-pinning on reconfigure.** Slugs are immutable once a space is created. Reconfigure fuzzy-matches new names against existing slugs and asks the admin to confirm rename vs. new space. Stops "Acme" → `acme` from orphaning the original `brands/acme-corp`.
3. **v2.x migration is re-interview, not parser.** The skill no longer tries to parse prose `permissions.md` into structured config. On v2.x detection, it tells the admin honestly that prose-to-config is too easy to get wrong and walks through the conversation again, preserving identity entries and home bases.
4. **Home-base scaffolding at promotion time.** When anyone is added to the people registry, promoted to admin, or added to a writer list, their `/agent/brain/members/<handle>/` home base is created immediately. Phase 5 Step 1 scaffolds for every named person, not just admins. The behavior is also encoded in `permissions.md` §6 for runtime use.
5. **Flexible identifier capture.** Phase 3 Q3 now accepts whichever identifier the admin has handy (Slack handle, @-mention, or motionapp.com email) instead of demanding both. Missing identifiers fill in on first message.
6. **Phase 4 readback shows per-space writer attribution.** Instead of an aggregate summary, the readback lists each space and its writers by name. Wrong attribution becomes easy to spot.
7. **Fast path for pragmatic admins.** Phase 3 detects "keep it simple" signals (solo, small team, skip questions, just defaults) and offers a one-space deployment without running the full conversation.
8. **TMM leak cleanup shows exact lines.** Phase 5 Step 8 shows the matched block in a code fence before asking for confirmation. Fuzzy matches refuse auto-removal and ask the admin to clean up manually.
9. **`spaces.json` validation gate.** Phase 5 Step 3 validates every entry before writing: `writers: specific` requires non-empty `writer_handles` that all exist in `organization-map.json`; `writers: admins_only` requires at least one admin in the registry. Failures re-ask the relevant interview question.
10. **NEON_DATABASE_URL hard stop on fresh installs.** Phase 1 Check 6 escalates from warning to hard stop when no `permissions.md` exists yet. Existing installs still get a soft warn so reconfigures can proceed offline.

### CSM-lens hardening

A second fresh-eyes review through CSM eyes surfaced operational failure modes that don't show up in code review but eat CSM time and erode customer trust. Twelve more fixes:

11. **Communication style rule at the top of SKILL.md.** Assume the admin is a marketing team member, not a developer. Never show code, JSON, regex, or file paths in chat unless they ask. Default down. The same rule lives in `permissions.md` §7 so the deployed skill behaves the same way at runtime, every conversation.
12. **Backup admin question** added to Phase 3 after the first-admin question. Prevents the single-admin bus factor when the first admin leaves or moves on.
13. **Backup approver question** added to Phase 3 when an approval channel is set. Prevents stalled requests when the admin is OOO.
14. **Admins-only bottleneck warning** at Phase 4 readback. If any space is admins-only with only one admin in the registry, soft-warn before writing.
15. **Plain-language TMM leak cleanup** in Phase 5 Step 8. The default prompt is friendly and outcome-focused ("I found some leftover instruction text from an older version. Want me to clean it up?"). Technical detail only on explicit request.
16. **Never refuse silently** rule in `permissions.md` §7. When a write is blocked, always tell the requester which space they hit, who the writers are, and offer either an approval request or direct admin contact.
17. **Offboarding cleanup** rule in `permissions.md` §7. Before flipping `scope` to `offboarded`, the agent walks every space the person writes to and asks the admin who replaces them. Prevents bricked spaces.
18. **"Show me the current setup"** runtime rule in `permissions.md` §7. Plain-language summary of people + spaces + approval channel on natural-language asks ("who can write to X?", "what's locked and what's open?", "show me the setup"). Never dumps JSON unless asked.
19. **Natural-language reconfigure intents** in `permissions.md` §7. Recognize "Add Jamie to Acme," "Sarah needs access to financials," "remove Sophia from Globex," and similar phrasings as reconfigure intent. Customers will never say "tighten up the client space."
20. **Lightweight reconfigure path** in `permissions.md` §7. Atomic changes (add/remove one writer, lock/unlock one space, add or remove one person) skip the full Phase 2-4 re-interview. Confirm in plain language, update the config, scaffold home bases if needed, post a one-line diff.
21. **Diff broadcast** in `permissions.md` §7. After every reconfigure that lands a real change, post a short "what changed" summary to the approval channel so teammates are not surprised.
22. **Approval-request reminders** in `permissions.md` §7. Nudge after 4 hours, give up after 24 with a suggestion to contact the admin directly. Maximum two nudges.

CSM-lens issue #10 (multi-customer fleet view for CSMs themselves) is intentionally out of scope for this skill and tracked separately.

Also added an org-wide saved instruction: "Use case library voice — default to non-technical." Same rule, applied across every use case in the library.

### Phase 1 + Phase 2 reframing (Kyra)

Two more changes after a fresh read:

23. **Phase 1 renamed from "Pre-flight scan" to "Look around and plan."** The intro now describes the goal in plain language — look at what's already in the VM, gather context so the conversation in Phase 3 is informed — instead of using engineer vocabulary. Each `Check N` was renamed to `Look-around N` with an outcome-focused heading (e.g. "Does user.md already have a permission pointer?" instead of "Is the protocol already installed?"). The checks themselves are unchanged; only the framing.
24. **Phase 2 renamed from "Welcome" to "Framing the opening" and rewritten as rules-and-direction, not a script.** The skill no longer hands the agent a canned message to recite. Instead Phase 2 gives the agent guidance on how to compose the opening turn in its own voice, shaped by (a) what the admin sent to trigger setup and (b) what Phase 1 surfaced. The opening turn always has to land three things in one message: acknowledge the trigger, give a brief outcome-focused taste of what setup will do, and transition into the first team question. Adaptive notes cover fresh install, reconfigure, partial install, TMM leak detected, and Neon missing.

Phase 3 stays as-is (Kyra approved).

---

## v2.3.0 — 2026-06-02 (PR #98)

Map rename and Neon-only motion-whoami. Bundled with v3.0.0 in a single deploy.

### Changed

- **Map file renamed: `workspace-map.json` → `organization-map.json`.**
  The file is the organization-wide identity registry, not a workspace-scoped
  artifact, and the new name is clearer. Pure rename: structure, schema,
  resolution behavior, and merge semantics are unchanged. Default path stays
  at `/agent/brain/admin/`. Env override variable renamed
  `RUNNETH_WORKSPACE_MAP` → `RUNNETH_ORG_MAP`.

- **`motion-whoami.sh` is now Neon-only.** The local SQLite
  `conversations.db` is unreliable for brand-new conversations (live DB is a
  0-byte placeholder for the agent; backups lag 30 min), which made
  motion-whoami fail for the first message in a fresh chat. The authoritative
  source is Neon's `agent_conversation` table — same pattern proven out in
  `/agent/tools/admin/whoami.sh` + `_neon_resolve_conv.py`. The skill now
  installs a small `motion-whoami-neon.py` helper alongside
  `motion-whoami.sh`. The shell script queries Neon via
  `secret run --env DATABASE_URL=NEON_DATABASE_URL -- python3 motion-whoami-neon.py`
  and **fails loudly** on Neon failure: no SQLite fallback. Silent fallback
  to stale or missing data would weaken the permissions contract. The
  permissions layer treats a non-zero exit as 'identity unknown' per
  §2.Unknown — no writes. Also accepts `CONVERSATION_ID` from env in
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
