# Post-install: the aligned-onboarding package fires itself

Installing the aligned-onboarding package is the trigger for running it - both the VoC data
sync setup and the Meta context work (Creative Attributes, then the Account Context Brain).
Run the sequence below at the first opportunity after the package's files land: in the
installing turn if you are reading this then, otherwise on the first turn where the
package's activation instruction is visible. Either way, run it without waiting to be
asked. Exactly once per install: if the four guard sentinels are already in
`/agent/user.md`, this sequence already ran - do not repeat it.

## The install-time sequence, in order

1. **Check what the org can reach.** `integrations status` for OAuth connections, plus the
   stored secrets for **every** VoC platform (any platform may be key-stored instead of
   connected), plus whether a Meta workspace is connected. VoC scope is customer-voice
   data, not the skill's recipe list - a reachable reviews/support/community platform with
   no recipe still counts.
2. **VoC first (it runs in the background).** For each reachable VoC platform, run the
   voc-data-pull skill's "Set up the recurring sync" procedure: create the
   `voc-sync-<platform>` routine and kick its first run. **A connected Meta workspace is
   itself a reachable VoC platform** - ad comments are customer voice, pulled with
   `motion meta creative-comments` (skill slug `meta-ads`) - so it gets a
   `voc-sync-meta-ads` routine alongside the others. **Every routine created in this
   step gets its first run kicked before moving on - check them off one by one.** The
   12-month backfills churn in the background while everything below happens. Never pull
   VoC data inside this conversation. If old canceled `voc-sync-*` routines exist from a
   previous install, ignore them - canceled is terminal; never resume or reuse one, always
   create fresh.
3. **Merge all four guard blocks into `/agent/user.md` with one Write - nothing else can
   touch that file.** The blocks ship ready-made in
   `/agent/brain/aligned-onboarding/guards/` (`account-context-guard.md`,
   `meta-validation-gate.md`, `knoweth-organize.md`, `knoweth-brain.md`). On this VM,
   `/agent/user.md` is walled off from Bash entirely (reads and writes are both refused -
   do not try a script) and the edit/patch tool fails validation; the file-write tool is
   the only thing that can change it, and the file's current contents are already in your
   system prompt. So:
   - Read the four guard files with the file-read tool. In the guard content, replace
     every literal `<workspaceId>` token with the target Meta workspace id; leave every
     other angle-bracket placeholder (`<platform>`, `<routine-id>`, `<userId>`) untouched,
     and change nothing else - the blocks go in byte-for-byte, never paraphrased or
     condensed.
   - Compose the full new file: the current `/agent/user.md` content (from your system
     prompt) exactly once, then each guard block. If a sentinel pair already exists in
     the file, replace that block in place instead of appending. Touch nothing outside
     the sentinels.
   - Check the payload before writing: the base document's opening heading appears
     exactly once, and each of the four sentinel pairs appears exactly once. A doubled
     base document is a corrupted merge - fix the payload; never write it.
   - Write it with the file-write tool in **one** whole-file write. One Write total for
     this step.
   - The blocks are self-gating: merging now is what makes their gates watched. Do not run
     what they gate - organize and validation fire later, on their own conditions.
4. **Creative Attributes** (Meta connected only): confirm workspace scope, establish the
   creative content layer (Cacheth + query paths), detect naming patterns as provisional
   proposals for the next step.
5. **Account Context Brain** (Meta connected only): its guard is already merged (step 3).
   Autofill every field possible from live data, then surface only the gap questions a
   human must answer. This step ends waiting on a person - that is expected. **Persist
   before you stop:** write the account context brain file with every autofilled field
   and the provisional naming decode as terse facts (short lines, no prose polish) so
   the autofill survives beyond this conversation. Long-form write-ups and
   `/agent/INDEX.md` updates wait for the turn where the human's answers arrive - do not
   compose them now, but never leave autofill results only in the chat.
6. **Report one line per part**: running in background / done / waiting on a person for X /
   skipped (not reachable) and why.

Mechanics for every step above: when a step updates `/agent/INDEX.md` or any other
existing file, do not use the edit/patch tool - it fails validation on this VM. Read the
file and write it back whole (python for mechanical splices, the file-write tool for
short files). Prefer scripted file assembly over retyping staged content anywhere -
except `/agent/user.md`, which Bash cannot touch at all (step 3's single Write is the
only way).

If nothing is reachable at all: say so and stop. Do not watch or poll; when a platform is
connected later, setup runs on ask.

## What fires later, on its own

- **Knoweth organize** - from the merged guard's gates, once content lands and the
  interpretation is confirmed.
- **Meta Validation** - from its merged gate (step 3), opening on its own once the Account
  Context Brain is confirmed and the creative cache has synced.
- **Daily VoC syncs, Cacheth sync, refresh cadences** - the routines created above.

The README's "Install and run order" describes this same lifecycle for humans; this file,
`post-install.md`, is the executable version. If the two ever disagree, fix them together -
do not improvise.
