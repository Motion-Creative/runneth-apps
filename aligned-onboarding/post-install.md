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
   `voc-sync-<platform>` routine and kick its first run. The 12-month backfills churn in
   the background while everything below happens. Never pull VoC data inside this
   conversation.
3. **Merge all four guard blocks into `/agent/user.md` - one write, from the staged
   guard files.** The blocks ship ready-made in
   `/agent/brain/aligned-onboarding/guards/` (`account-context-guard.md`,
   `meta-validation-gate.md`, `knoweth-organize.md`, `knoweth-brain.md`). Procedure,
   exactly:
   - Read the four guard files. In their content, replace every literal `<workspaceId>`
     token with the target Meta workspace id. Leave every other angle-bracket placeholder
     (`<platform>`, `<routine-id>`, `<userId>`) untouched - those are descriptive.
   - Read `/agent/user.md` in full. For each block: if its sentinel already exists,
     replace that block in place; otherwise append the block at the end. Never duplicate.
     Do not edit anything outside the sentinels.
   - Write the complete updated content back to `/agent/user.md` with the file-write tool
     in **one** write. Do not use the edit/patch tool on this file, and do not append via
     shell - both fail here; the full read-then-write is the reliable path.
   - The blocks are self-gating: merging now is what makes their gates watched. Do not run
     what they gate - organize and validation fire later, on their own conditions.
4. **Creative Attributes** (Meta connected only): confirm workspace scope, establish the
   creative content layer (Cacheth + query paths), detect naming patterns as provisional
   proposals for the next step.
5. **Account Context Brain** (Meta connected only): its guard is already merged (step 3).
   Autofill every field possible from live data, then surface only the gap questions a
   human must answer. This step ends waiting on a person - that is expected.
6. **Report one line per part**: running in background / done / waiting on a person for X /
   skipped (not reachable) and why.

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
