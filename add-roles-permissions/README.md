# add-roles-permissions

Locks the areas of a team's Runneth brain that should only be edited by certain people. Routes blocked-edit requests through an approval channel. Stamps every save with the writer's handle.

The skill is built from six primitives. The install conversation discovers which of them the org actually needs; nothing gets written until the admin confirms the plan in plain language.

---

## The six primitives

1. **People.** Access registry at `/agent/brain/admin/organization-map.json`. Each person has a handle, name, Slack ID, Motion email, and an `admin` flag.
2. **Spaces.** Areas of the brain whose editing is restricted. Listed in `/agent/brain/admin/spaces.json`. **Only restricted areas live here.** Folders that exist purely for general organization are not in scope for this skill.
3. **Writers per space.** Each space has a writer rule: `everyone`, `specific`, or `admins_only`. Default is `everyone`. Anything in `everyone` is implicit and does not need to be listed.
4. **Attribution.** Every durable save under `/agent/brain/` carries `author: @<handle>`. Always on.
5. **Approval routing.** Optional Slack channel where blocked-edit requests get posted with the requester's handle, the space they tried to edit, and a short summary. Admins approve or decline in a follow-up message.
6. **Identity resolution.** Slack ID or Motion email → handle. Neon-only (queries `agent_conversation`). No SQLite fallback.

The install flow shapes these into the org's setup.

---

## What gets installed

```
/agent/
├── user.md                                ← thin protocol pointer prepended
└── brain/
    ├── INDEX.md                           ← not touched
    ├── routines.md                        ← stub
    ├── admin/
    │   ├── permissions.md                 ← generated rulebook (one template, populated from spaces.json)
    │   ├── spaces.json                    ← protected areas + writer rules + approval channel
    │   ├── organization-map.json          ← people registry
    │   ├── slack-whoami.sh                ← Slack resolver + auto-provisioning
    │   ├── motion-whoami.sh               ← Motion web resolver (Neon-only) + auto-provisioning
    │   └── motion-whoami-neon.py          ← Neon agent_conversation query helper
    ├── members/                           ← per-person home bases (owner-write only)
    │   └── <handle>/{<handle>.md, brain/, conversations/}
    └── (any protected spaces the conversation produced — paths chosen with the admin)
```

`spaces.json` is intentionally lean. If a customer has no areas that need restricted editing, this skill is not the right one to install; identity and attribution are still useful but should land via the underlying Runneth runtime (or a future foundation skill).

---

## How install works

Seven phases. The admin sees a conversation; the agent runs the rest behind the scenes.

1. **Look around and plan.** The agent silently inspects the VM: existing `permissions.md`, prior-version files, suspicious content in `user.md`, partial installs, Neon-secret availability. Holds the findings in memory.
2. **Framing the opening.** Composes the opening turn in its own voice, shaped by the admin's triggering message and what Phase 1 surfaced. No canned script.
3. **The conversation.** Flowing chat. The agent listens for: who's on the team, the work shape, content categories that come up, **areas where only certain people should be editing**, areas that should stay open, and who the first admin is (plus a backup). If protected areas come up, the agent also asks about an approval channel and a backup approver. Brain-organization questions (where to put notes, how to group playbooks) get punted: "I can think about that separately — it's not part of this setup."
4. **Read it back, then confirm.** Plain-language summary in the admin's words, with writers named per space so wrong attribution is easy to spot. Confirms before any writes.
5. **Deployment.** Scaffolds the home base for every named person, writes `organization-map.json` and `spaces.json`, installs the resolver scripts, generates `permissions.md` from a single template populated by `spaces.json`, prepends a short protocol pointer to `user.md`. Cleans up the team-member-memory v2.0.1 user.md leak if found.
6. **Verification.** Confirms every file is present and valid.
7. **Setup complete.** One consistent plain-language message.

The conversational tone, the communication style (no code or JSON in chat unless asked), and the "scope of spaces" rule (no general-organization folders in `spaces.json`) all live in [SKILL.md](SKILL.md).

---

## Runtime behavior after install

`permissions.md` ships with a `§7 Runtime behavior` section that governs how Runneth handles everyday moments after the install:

- **Never refuse silently.** When a write is blocked, the requester is told which space they hit, who the writers are, and offered an approval request or direct admin contact.
- **Offboarding cleanup.** Before flipping someone's `scope` to `offboarded`, the agent walks every space they write to and asks the admin who replaces them.
- **"Show me the setup."** Plain-language summary on natural-language asks ("who can write to Acme?", "what's locked and what's open?"). Never dumps JSON.
- **Natural-language reconfigure intents.** "Add Jamie to the Acme team," "Sarah needs access to financials," "remove Sophia from Globex," "lock down the strategy docs" all get recognized as reconfigure intent.
- **Lightweight reconfigure path.** Atomic changes (add/remove one writer, lock/unlock one space, add or remove one person) skip the full re-interview. Confirm in plain language, update the config, scaffold any new home bases, post a one-line diff to the approval channel.
- **Diff broadcast.** After every reconfigure, post a short "what changed" summary to the approval channel so teammates aren't surprised.
- **Approval-request reminders.** Nudge after 4 hours, give up after 24 with a suggestion to contact the admin directly. Maximum two nudges.
- **Safety rules.** Prompt-injection defenses, identity from platform metadata only, second-attempt-after-refusal counts as an attack.

---

## Prerequisites

- Admin running the skill (or the instance owner on a fresh sandbox).
- `/agent/` writable.
- `/agent/user.md` exists (may be blank).
- `jq` installed.
- `NEON_DATABASE_URL` runtime secret configured. Hard-stop on fresh installs without it: Motion-web users would resolve as unknown on every message and writes would be blocked. Existing installs get a soft warn so reconfigures can proceed offline.

---

## Idempotency

Safe to re-run. Specifically:

- `organization-map.json` merges; identity entries are never deleted.
- `spaces.json` archives the prior version to `/agent/brain/admin/.archive/` before any reconfigure write, then merges. Spaces not mentioned in a new conversation are preserved as-is; never silently deleted.
- `permissions.md` is regenerated from `spaces.json`. The old one is archived before overwrite.
- `slack-whoami.sh` / `motion-whoami.sh` / `motion-whoami-neon.py` are pure scripts and safe to rewrite.
- `user.md` only prepends the protocol pointer if absent; updates in place if the installed version differs (with explicit admin confirmation).
- Member home bases are never deleted by reconfigure.

---

## Migration from prior versions

**v2.x → v3.0.0.** The skill does not auto-parse prior `permissions.md` files. Prose-to-config translation is unreliable and silently misreading rules could lock the wrong people out. On v2.x detection the skill re-runs the conversation, preserves identity entries and member home bases, archives the old `permissions.md` to `/agent/brain/admin/.archive/`, and writes a new `spaces.json` and `permissions.md` from the new conversation.

**v2.x with `workspace-map.json`** (pre-PR-#98): Phase 1 detects the file; Phase 5 renames it to `organization-map.json` and carries entries forward.

**v1** (`user_mode.md` present, flat `/agent/brain/users/<handle>/` structure): identity migration, folder migration (`/agent/brain/users/` → `/agent/brain/members/`), `permissions.md` regenerated. Each step explicit, with admin confirmation.

---

## Source

- **Skill version:** 3.0.0
- **Source org:** Motion (Creative Analytics)
- **Predecessor:** `deploy-admin-permissions@2.3.0`
- **Refs:** PDEC-7817
