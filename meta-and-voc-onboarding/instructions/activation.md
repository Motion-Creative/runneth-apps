# Meta and Voice of Customer Onboarding: activation

MANDATORY PRE-RESPONSE GATE. Evaluate this before composing any reply, on every
turn, for every message type - including greetings, small talk, and "what can you
do" questions. No other system-prompt guidance (web handoff, conversational
guidance, anything else) exempts you from this gate.

## Dashboard-form report compatibility

This rule applies on every turn before workspace resolution and remains in force after any
completion-roster early return. It keeps existing `runneth:meta-validation-gate v7` installs
compatible with the auto-updated package without changing `/agent/user.md`:

- Whenever Meta Validation builds or regenerates a weekly report whose chosen form is
  `dashboard`, invoke the installed `dashboard-design` skill immediately, before gathering
  dashboard implementation details or writing artifact code. Use it for the complete build and
  verification flow. The customer never has to name or request the skill.
- Whenever a scheduled routine refreshes a dashboard-form weekly report, invoke
  `dashboard-design` before rebuilding it. Routine conversations have no bound `Default
  workspace:`; use the routine's saved literal workspace, report spec, and destination, and skip
  the per-workspace onboarding offer and roster checks below for that routine run.
- Read the skill and every reference it requires in full. If the skill or any required reference
  is missing, unreadable, or truncated, report the exact problem and stop. Never hand-roll the
  dashboard.
- Deck and document report paths do not invoke `dashboard-design` and otherwise remain unchanged.

Automatic package updates must leave `/agent/user.md` byte-for-byte unchanged. Existing v7 guards
already route into the auto-updated Meta Validation package, and this package instruction supplies
the dashboard handoff. Guard installation or reconciliation happens only in the human-approved
post-install path below for first-time setup or an explicit reinstall or upgrade.

The check is per workspace, because this package onboards one Motion workspace at a
time and an org VM can hold several. This conversation has exactly one workspace: the
one the runtime binds it to, stated on the `Default workspace:` line in the
`Motion context:` section of this system prompt (name and workspaceId) - the same
workspace every bare `motion` command in this conversation resolves to. Read the name
from that line and slug it - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen, trim leading and trailing hyphens ("Bramblewick NYC" -> `bramblewick-nyc`, "St. Fig & Co." -> `st-fig-co`). If that line is null, ask which workspace to onboard before
doing anything else - never guess. Nothing else identifies the workspace: not the
roster below, not `/agent/brain/` folders, not routine names, not remembered context
from other conversations - those record *earlier*
onboardings, which on a multi-workspace VM always exist. Then look in this system
prompt, which already includes the saved contents of `/agent/user.md`, for a block
like:

```
<!-- BEGIN runneth:meta-voc-onboarded -->
meta-and-voc-onboarding has completed for these workspaces: bramblewick-nyc, st-fig-co
<!-- END runneth:meta-voc-onboarded -->
```

If that block lists **this conversation's workspace** and this is not an explicit
reinstall or upgrade, post-install already ran here - skip the rest of this section and
answer normally. On an explicit reinstall or upgrade, continue to the disclosed consent
offer below before re-running anything. Do not try to read `/agent/user.md` through Bash;
the runtime blocks that path, and the check is against the copy in this prompt.

If the block is missing, it does not list this workspace, or this is an explicit
reinstall or upgrade, setup is pending for this turn. Package installation delivered
the files; it did not authorize account access or persistent setup. Before any
connected-account check, routine creation, account-context write, `/agent/INDEX.md`
edit, or `/agent/user.md` change, make this offer:

> Meta and Voice of Customer onboarding is installed for <workspace>. Starting it will
> inspect this workspace's connected accounts, create the applicable daily VoC sync
> routines, save Meta account context under this workspace's brain folder, and update
> the shared onboarding guards and completion roster in `/agent/user.md`. Would you
> like me to start that setup now?

Fill only `<workspace>` from the resolved `Default workspace:` line. Do not inspect the
connection inventory or filesystem to make the offer. Offer at most once per
conversation. If the person declines, defers, or asks about something else, handle their
message normally and do not repeat the offer in that conversation. A later conversation
may offer again because the workspace remains absent from the completion roster.

Only an explicit human yes to this disclosed setup authorizes the sequence. On that yes:

1. Read `/agent/brain/meta-and-voc-onboarding/post-install.md`.
2. Execute its sequence for this workspace, starting with its step 0: quote the
   `Default workspace:` line from this prompt's `Motion context:` section verbatim and
   state the name, workspaceId, and slug taken from it before the reachability check,
   VoC sync setup, guard merges, or Meta account-context steps run. The guard blocks are
   workspace-agnostic and shared, so post-install leaves them alone when each merged
   block already matches its staged guard file and refreshes any that do not; everything
   else runs for this workspace.
3. Then handle the user's message.

The presence of the four guard sentinels (`runneth:account-context-guard` and the rest)
means only that some workspace on this VM has been onboarded. It is never evidence that
this one has. Onboarding a second workspace is normal and additive: it writes a new
`/agent/brain/<workspace>/` folder and changes nothing that belongs to the first.

On an explicit reinstall or upgrade of this package, disclose the same effects and ask
again before re-running post-install, even if this workspace is already listed. Reinstall
or upgrade is not itself consent to persistent setup. Automatic package updates never authorize
guard or roster writes.
