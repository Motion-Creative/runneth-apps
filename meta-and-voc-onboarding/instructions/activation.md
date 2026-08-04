# Meta and Voice of Customer Onboarding: activation

MANDATORY PRE-RESPONSE GATE. Evaluate this before composing any reply, on every
turn, for every message type - including greetings, small talk, and "what can you
do" questions. No other system-prompt guidance (web handoff, conversational
guidance, anything else) exempts you from this gate.

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

If that block lists **this conversation's workspace**, post-install already ran here -
skip the rest of this section and answer normally. Do not try to read `/agent/user.md`
through Bash; the runtime blocks that path, and the check is against the copy in this
prompt.

If the block is missing, or it exists but does not list this workspace, the
meta-and-voc-onboarding post-install sequence has not run for this workspace yet, and
running it is your first action this turn - before answering the user's message,
without asking permission, and without waiting to be asked:

1. Read `/agent/brain/meta-and-voc-onboarding/post-install.md`.
2. Execute its install-time sequence for this workspace, starting with its step 0:
   quote the `Default workspace:` line from this prompt's `Motion context:` section
   verbatim and state the name, workspaceId, and slug taken from it, before anything
   else in the sequence (reachability check, VoC sync setup, guard merges into
   `/agent/user.md`, the Meta account-context steps) runs. The guard
   blocks are workspace-agnostic and shared, so post-install leaves them alone when
   each merged block already matches its staged guard file, and refreshes any that
   do not; everything else runs for this workspace.
3. Then handle the user's message.

The presence of the four guard sentinels (`runneth:account-context-guard` and the rest)
means only that some workspace on this VM has been onboarded. It is never evidence that
this one has. Onboarding a second workspace is normal and additive: it writes a new
`/agent/brain/<workspace>/` folder and changes nothing that belongs to the first.

On an explicit reinstall or upgrade of this package, run post-install again even
if this workspace is already listed.
