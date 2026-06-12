# Changelog

All notable changes to `deploy-security-protocol` are documented here.

---

## Unreleased

(nothing yet)

---

## v3.3.0 — 2026-06-12

Remove the Neon dependency from Motion-web identity resolution. Installs no longer require — or ask for — any production database credential.

### Why

The June 2026 runtime change added a local daemon conversation store (`/daemon/conversation-store/conversations.db` plus a `$CONVERSATION_ID` env var), which makes Motion-web identity resolvable locally. The fleet's resolvers were updated to use it in the June 10–11 rollout, but this repo's install path was never updated to match — it still asked for a runtime database secret at install time. A fresh install should never prompt for a database credential. This release brings the repo in line with the fleet.

Version is 3.3.0 (not 3.2.x) because PR #115 has v3.2.0 claimed for the attribution-layer removal.

### Changed

- **`motion-whoami.sh` resolves locally.** Reads `userEmail` from `/daemon/conversation-store/conversations.db` (via `sqlite3 -readonly -json`) using the runtime-injected `$CONVERSATION_ID`, then resolves against `organization-map.json`. No network, no secrets. The script body matches the resolver proven on ~10 customer VMs in the June 2026 fleet rollout (compatibility variant, SHA `946bfa2a043944075ba0ad415faa35a28d668cca07131fbeea551244e5f85d01`), adapted only to this package's naming: `organization-map.json` / `RUNNETH_ORG_MAP` and `/agent/brain/team/` home bases (the fleet uses `workspace-map.json` / `/agent/brain/members/`).
- **Fail-loud semantics kept** (decided 6/2): on resolver failure — `$CONVERSATION_ID` unset, daemon DB missing, no email for the conversation — the script exits non-zero with error JSON on stderr, and the permissions layer treats unknown identity as no-writes.
- **Legacy-map compatibility:** the resolver reads `.motionUserEmails` and falls back to legacy `.motionEmails`, and keeps both in sync on provision, so older installs keep resolving existing users after upgrade.
- **Phase 1 Look-around 6** no longer checks for a runtime secret and no longer hard-stops fresh installs. It now checks the two things the resolver needs — daemon DB present, `sqlite3` available — both on every current VM by default. If either is missing (outdated image), warn and proceed; Motion-web users resolve as unknown until the runtime is updated.
- **Prerequisites** (SKILL.md + README): `NEON_DATABASE_URL` dropped; `sqlite3` added.

### Removed

- **`motion-whoami-neon.py`** and its install step. Phase 5 Step 4 now tells the agent to delete a leftover copy if one exists from a prior install.

Refs: PDEC-7817.

---

## v3.1.5 — 2026-06-03

Slim pass. 73 lines trimmed from SKILL.md (1,137 → 1,064) without dropping a single rule, look-around, phase, or piece of educational content. Pure deduplication and prose tightening.

### Changed

- **Phase 4 internal-state JSON example** collapsed from a 20-line JSON sample to a one-line description.
- **Phase 2 Tone subsection** removed — duplicated the top-of-file communication-style rule.
- **Phase 5 Step 4 intro** collapsed from 4 paragraphs that said the same thing to one.
- **`motion-whoami-neon.py` docstring** trimmed from 18 lines of comment to 4 lines that still cover usage and exit codes.
- **`motion-whoami.sh` and `slack-whoami.sh` file headers** trimmed. Both now have tight comment blocks that name purpose, return shape, status values, and usage; verbose explanation prose removed.
- **Phase 1 intro and Look-arounds 6, 7, 8** prose tightened.
- **Phase 2 subsections "What the opening turn has to do," "Outcomes," and "Adapting"** tightened.
- **Phase 3 "Scope of spaces," "Choose space paths," and "What not to do"** tightened.

No content loss. Refs: PDEC-7817.

---

## v3.1.4 — 2026-06-03

Kyra: "Session open could also be part of the user.md."

### Changed

- **Look-around 8 now scans three places**, not two. Session-open behavior can live as an inline section inside the team's saved instructions themselves (in `user.md`), in the routines registry (`/agent/brain/routines.md`), or as a reminder triggered on session open. The look-around now greps `user.md` for the common phrasings ("session open," "every conversation," "before responding," "at the start of every," "on every new conversation," etc.) in addition to the other two checks.
- **Look-around 8 prose updated** to treat inline session-open content the same way as a separate routine: both behave identically, so both get flagged when you raise the behavior-shaping question in Phase 3.

Refs: PDEC-7817.

---

## v3.1.3 — 2026-06-03

Three changes from Kyra.

### Changed

- **Renamed `/agent/brain/members/` → `/agent/brain/team/`** everywhere. Every reference in `SKILL.md` (including the permissions.md template and the inline resolver scripts), `README.md`, and `marketing.md` updated. Personal spaces now live at `/agent/brain/team/<handle>/`. Same writer rule applies (only the owner can edit their own folder).
- **Phase 5 Step 7 description clarified.** Now explicitly states that this step adds the permission pointer to `user.md` (the saved-instructions file the agent loads on every conversation), and notes that without this step the rest of what you wrote in Phase 5 is unenforced. The actual write behavior is unchanged.

### Added

- **Phase 1 Look-around 8 — What other files get automatically loaded at the start of every conversation?** Runs `cat /agent/brain/routines.md` and `reminder list | grep session-open` to find any session-open routines that pull additional files into every conversation. Holds the list of file paths + a one-sentence description of each routine, then carries it into Phase 2 and Phase 3.
- **Phase 2 adapting note** for the session-open signal: the opener doesn't have to mention it, but the list gets used in Phase 3.
- **Phase 3 behavior-shaping prompt made adaptive.** If Look-around 8 found other auto-loaded files, the prompt names them specifically. The admin almost certainly didn't know all of those were getting loaded on every conversation, and seeing the list is the moment they realize the stakes. Plain-language description always — never use "session-open routine" or "startup routine" with the admin.

Refs: PDEC-7817.

---

## v3.1.2 — 2026-06-03

Voice and framing pass. Kyra: "Let's not say startup-routines, use more simple language a marketer would understand. The skill is also written in 3rd person it feels like instead of being the instructions to follow when it runs."

### Changed

- **SKILL.md now reads as direct instructions to Runneth (the agent), with the goal stated up front.** The top of the file leads with "Your goal in this skill" instead of "This skill helps an admin." A new "What the admin needs to understand first" section calls out the education Runneth has to deliver before the rest of the conversation makes sense. "How this skill runs" reframed as "How you'll run this skill," with the seven phases as your instructions. Each Phase intro (Phase 2-5) rewritten to lead with "In Phase X you..." instead of describing what the phase is.
- **Replaced "startup-routine" and "session-open routine" jargon everywhere** with plain language ("the team's saved instructions and any other files Runneth automatically reads at the start of every conversation"). Added an explicit instruction to Phase 3: never use those internal terms with the admin.

Refs: PDEC-7817.

---

## v3.1.1 — 2026-06-02

Voice and framing pass on the v3.1.0 reframe. Kyra: "We shouldn't be using words like identity and resolve. Everything in this skill should reflect language that a marketing person can understand as much as possible because Runneth will carry through that language as it's talking to the admin... We need to educate people that out of the box, by default, anybody that gives Runneth feedback can impact the rest of the org."

### Changed

- **Hero headline:** "Customize who can change what." → "Decide who can change what Runneth knows and how it behaves." More specific, names the two flavors.
- **Hero subhead, install-config description, use-case pitch, README lead, SKILL.md `What this skill is for`** all rewritten to lead with the educational framing: most teams don't realize this until something gets accidentally changed, but out of the box, anyone the team trusts to chat with Runneth can also edit anything Runneth knows. That includes the context Runneth references AND the rules for how it behaves for everyone. Saved feedback like "let's not use the word cheap anymore" can quietly become the rule for everyone, not just the person who said it. This skill is the way to control that.
- **"The six primitives the skill works with"** section renamed to **"The pieces the skill works with"**. Each primitive renamed in prose: identity resolution → "knowing who is talking"; writers per space → "who can edit each area"; attribution → "who wrote what"; approval routing → "approval requests"; spaces → "protected areas"; people → "people."
- **Phase 2 outcomes** section now opens with a "Lead with the surprising default state" instruction. The five value-prop bullets follow it, with the behavior-protection one explicitly flagged as the usually-highest-stakes lock decision.
- **`permissions.md` §1 renamed** from "Identity" to "Who's talking." Internal jargon ("resolver," "resolves to a person," "identity claims") rewritten in plain language.
- **Display title** in `use-case.json`: "Customize Write Access" → "Decide who can change Runneth." Plainer, names the action.

### Why

Runneth carries through the language it reads in SKILL.md. Marketing-friendly prose throughout the skill means marketing-friendly prose when the agent talks to the admin. The educational framing matters because most admins don't know about the default behavior until they install — and they need to know it to make good decisions about what to protect.

Refs: PDEC-7817.

---

## v3.1.0 — 2026-06-02

User-facing reframe of the skill purpose, plus the behavior-protection layer.

### Renamed

- **Display title:** "Lock What Shouldn't Be Edited" → "Customize Write Access." The previous title described the result of installing the skill; the new title describes what the admin is choosing to do.
- **SKILL.md heading and frontmatter `name`:** "Deploy Admin Permissions v3.0" → "Customize Write Access" (`name: customize-write-access`). The package id `add-roles-permissions` is unchanged.

### Added

- **A stage-setting intro before Phase 1** in `SKILL.md`. Explains what the skill is for in user-language, names the seven phases in order with an explicit "do not skip any, do not collapse phases" instruction, summarizes how to talk to the admin, and lists the six primitives Runneth works with. Replaces a long "What this deploys" tree (most of which was untouched by the skill) with a focused list of files the skill actually creates or modifies.
- **Behavior-protection outcome in Phase 2.** New bullet in the "Outcomes you can draw from" list: the admin gets to decide who can change how Runneth behaves for everyone. Distinguishes this from individual feedback (which stays in that person's home base and only changes how Runneth talks to them).
- **Two flavors of restricted content in Phase 3 item 4.** Listening for `Areas where only certain people should make changes` now explicitly covers both content areas (brand strategy, pricing, financial models) and **behavior-shaping content** (saved instructions in `user.md`, files referenced by session-open routines). The latter have a wide blast radius and are usually the highest-stakes lock decision.
- **Explicit behavior-shaping prompt in Phase 3.** The agent always raises this question, even if the admin didn't bring it up: "There are a few files I always load up before I respond to anyone on your team. Mainly your saved instructions, plus anything a startup routine reads. They shape how I sound and what I do. If someone edits them, it changes how I show up for everyone. Do you want only admins to be able to edit those, or is there a specific person you'd name?"
- **`permissions.md` §7 rule: Reference does not grant write permission.** When Runneth pulls a protected file into a conversation to cite, quote, or summarize it, the writer rules still apply. If the requester then asks to edit that file, refuse and offer the approval flow. Citing the file doesn't make them a writer. True even for behavior-shaping files.

### Marketing surfaces

- `marketing.md`: new hero headline and subhead matching the rename.
- `use-case.json`: `display_title` and `pitch` rewritten.
- `install-config.json`: `description` rewritten and version bumped to 3.1.0.
- `README.md`: heading and lead paragraph updated.

Refs: PDEC-7817.

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
- **Implicit spaces** that are never configurable: `/agent/brain/admin/` (admins only), `/agent/brain/team/<handle>/` (owner only), and the shared infrastructure paths (`INDEX.md`, `routines.md`, `.agents/skills/`, `apps/`, admins only).
- **Step 8 auto-cleans the team-member-memory v2.0.1 user.md leak** if found, with admin confirmation.

### Migration

- From **v2.3.0 (post-PR-#98)**: re-run the skill; existing `permissions.md` rules are read and proposed as a `spaces.json` for the admin to review. Identity entries preserved.
- From any interim v3 preview with a `mode.json` file: Phase 1 Check 3 detects it; Phase 5 offers to translate the contents into `spaces.json` and remove the old file.
- From **v2.x with `workspace-map.json`** (pre-PR-#98): Phase 1 Check 3 detects, Phase 5 Step 2 renames and carries entries.
- From **v1**: identity migration, folder migration (`/agent/brain/users/` → `/agent/brain/team/`), `permissions.md` regenerated.

Refs: PDEC-7817.

### Hardening (pre-merge review)

Fresh-eyes review surfaced ten failure modes. All addressed in-PR:

1. **Approval-channel mechanic implemented.** `permissions.md` §5 now spells out the exact flow: draft request, show it to the requester, post via `slack send` on confirmation, wait for explicit admin approval before executing. No more vapor feature.
2. **Slug-pinning on reconfigure.** Slugs are immutable once a space is created. Reconfigure fuzzy-matches new names against existing slugs and asks the admin to confirm rename vs. new space. Stops "Acme" → `acme` from orphaning the original `brands/acme-corp`.
3. **v2.x migration is re-interview, not parser.** The skill no longer tries to parse prose `permissions.md` into structured config. On v2.x detection, it tells the admin honestly that prose-to-config is too easy to get wrong and walks through the conversation again, preserving identity entries and home bases.
4. **Home-base scaffolding at promotion time.** When anyone is added to the people registry, promoted to admin, or added to a writer list, their `/agent/brain/team/<handle>/` home base is created immediately. Phase 5 Step 1 scaffolds for every named person, not just admins. The behavior is also encoded in `permissions.md` §6 for runtime use.
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

### Workspace-shape signal (Kyra)

25. **Phase 1 Look-around 7 added.** Runs `motion workspaces` (always available out-of-the-box on any Motion-authenticated VM) and notes a quiet org-shape hint from the workspace naming pattern: one workspace named after the company, multiple brand-named workspaces (agency), department-named workspaces (dept structure), per-person workspaces (rare for customers), or unclear. The signal is a starting hypothesis, not a decision.
26. **Phase 2 adapts based on the hint.** New bullet in "Adapting to what Phase 1 found" tells the agent how to lean the opener in a direction (agency-flavor, single-brand-flavor, dept-flavor) without committing to a fully-formed proposal. The hint is a tilt, not a script. If the pattern is unclear, the agent does not invoke the workspace observation at all. No canned message — the agent still composes the opener in its own voice. The conversation in Phase 3 always gets the final word.

### Scope of spaces clarified (Kyra)

27. **`spaces.json` is for areas that need restricted editing, not for general brain organization.** Phase 3 now spells this out: a space is an area that has a specific team of people who should be able to edit it. If the admin starts describing folders they want for general organization, the agent tells them brain organization is a separate concern and keeps `spaces.json` lean. Added as guidance in the "Translating answers" section plus a matching "do not do" bullet.

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
