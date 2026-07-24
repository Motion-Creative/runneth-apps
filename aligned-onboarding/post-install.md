# Post-install: the aligned-onboarding package fires itself

Installing the aligned-onboarding package is the trigger for running it - both the VoC data
sync setup and the Meta context work (Creative Attributes, then the Account Context Brain).
In the same conversation that performs the install - the one that copies this package's
files to their VM destinations per `install-config.json` - the moment those files are in
place, run the sequence below, without waiting to be asked.

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
3. **Creative Attributes** (Meta connected only): confirm workspace scope, establish the
   creative content layer (Cacheth + query paths), detect naming patterns as provisional
   proposals for the next step.
4. **Account Context Brain** (Meta connected only): merge its guard block into
   `/agent/user.md` per its MERGE INSTRUCTIONS, autofill every field possible from live
   data, then surface only the gap questions a human must answer. This step ends waiting
   on a person - that is expected.
5. **Merge the self-gating guard blocks now, but do not run what they gate.** Merge all
   three, each per its own doc's MERGE INSTRUCTIONS: `runneth:knoweth-organize` and
   `runneth:knoweth-brain` from `knoweth/knoweth-organize-onboarding-package.md`, and
   `runneth:meta-validation-gate` from `meta/meta-validation-onboarding-package.md`. They
   are self-gating: organize and validation fire later, on their own gates - merging now is
   what makes those gates watched.
6. **Report one line per part**: running in background / done / waiting on a person for X /
   skipped (not reachable) and why.

If nothing is reachable at all: say so and stop. Do not watch or poll; when a platform is
connected later, setup runs on ask.

## What fires later, on its own

- **Knoweth organize** - from the merged guard's gates, once content lands and the
  interpretation is confirmed.
- **Meta Validation** - from its merged gate (step 5), opening on its own once the Account
  Context Brain is confirmed and the creative cache has synced.
- **Daily VoC syncs, Cacheth sync, refresh cadences** - the routines created above.

The README's "Install and run order" describes this same lifecycle for humans; this file,
`post-install.md`, is the executable version. If the two ever disagree, fix them together -
do not improvise.
