# Post-install: the meta-and-voc-onboarding package fires itself

Installing the meta-and-voc-onboarding package is the trigger for running it - both the VoC data
sync setup and the Meta context work (Creative Attributes, then the Account Context Brain).
Run the sequence below at the first opportunity after the package's files land: in the
installing turn if you are reading this then, otherwise on the first turn where the
package's activation instruction is visible. Either way, run it without waiting to be
asked. Exactly once per install: if the four guard sentinels are already in
`/agent/user.md`, this sequence already ran - do not repeat it.

## The install-time sequence, in order

1. **Check what the org can reach.** `integrations status --app <slug>` for each known
   VoC platform slug (the voc-data-pull skill's Step 1 table lists them; `integrations
   list --query <term>` finds any others) for OAuth connections, plus the stored secrets
   for **every** VoC platform (any platform may be key-stored instead of connected), plus
   whether a Meta workspace is connected. The secret store cannot be listed - the runtime
   refuses Bash reads of `/agent/.runtime/secrets`, and neither `secret` nor
   `secure-fetch` has a list command - so probe per platform: attempt the platform's
   documented secret key (`secret run --env KEY=<SECRET_KEY> -- true`, or a bounded
   `secure-fetch run`) and treat a "secret not available" error as not stored. Never
   conclude "no secrets" from a refused directory read. VoC scope is customer-voice
   data, not the skill's recipe list - a reachable reviews/support/community platform with
   no recipe still counts.
2. **VoC first (it runs in the background).** For each reachable VoC platform, run the
   voc-data-pull skill's "Set up the recurring sync" procedure: create the
   `voc-sync-<platform>` routine and kick its first run. **A connected Meta workspace is
   itself a reachable VoC platform** - ad comments are customer voice, pulled with
   `motion meta creative-comments` (skill slug `meta-ads`) - so it gets a
   `voc-sync-meta-ads` routine alongside the others. For Meta, connected is the only
   reachability test: if a Meta workspace shows as connected, create and kick
   `voc-sync-meta-ads` even when a Meta API probe errors in this conversation - the
   routine's own scheduled runs absorb transient API failures. An API error is never
   grounds to skip the routine; only the absence of a connected workspace is. If the
   connection status itself cannot be read because those calls are erroring too, still
   create and kick the routine - this package is installed for Meta orgs, and the
   routine self-heals or keeps erroring visibly, either of which beats silently
   skipping setup. **Every routine created in this
   step gets its first run kicked before moving on - check them off one by one.** The
   12-month backfills churn in the background while everything below happens. Never pull
   VoC data inside this conversation. If old canceled `voc-sync-*` routines exist from a
   previous install, ignore them - canceled is terminal; never resume or reuse one, always
   create fresh.
3. **Merge all four guard blocks into `/agent/user.md` with one Write - nothing else can
   touch that file.** The blocks ship ready-made in
   `/agent/brain/meta-and-voc-onboarding/guards/` (`account-context-guard.md`,
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
   proposals for the next step. The procedure is
   `/agent/brain/meta-and-voc-onboarding/meta/meta-creative-attributes-playbook.md`
   (its Step 2 is the install-time part). It ships as a brain document - there is no
   creative-attributes skill directory to look for.
5. **Account Context Brain** (Meta connected only): its guard is already merged (step 3).
   Autofill every field possible from live data - silently. Do not present the findings,
   do not ask the gap questions, do not run the walkthrough; the onboarding-walkthrough
   skill owns all of that and fires later, on a human's yes. **Persist
   before you stop:** write `/agent/brain/meta/account-context.md` in the saved-file
   format the account-context playbook defines (Section 3: a prose reference document,
   not the worksheet) with every autofilled field and the provisional naming decode, and
   index it in `/agent/INDEX.md` with the playbook's aliases, so the autofill survives
   beyond this conversation. This file gets written even when the
   live pulls are entirely blocked by API errors: all field headers with whatever is
   known, each blocker recorded next to the field it blocks - a resumable scaffold must
   exist on disk before this step ends, never nothing. What waits for the human's
   answers is the walkthrough itself - never leave autofill results only in the chat.
6. **Close with the readiness report - status only, never content.** One line per part
   stating its state (running in background / done / waiting on a person / skipped and
   why), plus how many questions need a human. The report carries no findings: no account
   numbers or metrics, no naming positions or decoder detail (not even the shape - "a
   5-position decoder" or "4 schemas detected" is decoder detail; say "provisional
   naming decode written" and stop), no field reads, and never
   the question text itself - naming even one question here burns the walkthrough's
   opening. If a part is waiting on a person, name the topic in two or three words
   ("targets and thresholds"), not the question. The same discipline covers the whole
   closing stretch of the turn: the progress narration around the report must not
   surface metrics, findings, or flags either ("average ROAS is 0.88" belongs in the
   brain file, never in this turn's visible text). The report's shape is literal:

   > meta-and-voc-onboarding <version> - install complete
   > - VoC sync: <per-platform status, one line total>
   > - Guards: merged
   > - Creative Attributes: done
   > - Account Context Brain: autofilled <N> of 9 fields; <M> questions need a human
   >
   > Are you ready to begin your onboarding?

   The closing line is verbatim and nothing follows it. A yes (from anyone, in any
   conversation, whenever it comes) invokes the onboarding-walkthrough skill; that skill -
   and only that skill - presents the findings and asks the questions. Do not start the
   walkthrough inside the install turn unless the yes arrives here.

Mechanics for every step above: when a step updates `/agent/INDEX.md` or any other
existing file, do not use the edit/patch tool - it fails validation on this VM. Read the
file and write it back whole (python for mechanical splices, the file-write tool for
short files). Prefer scripted file assembly over retyping staged content anywhere -
except `/agent/user.md`, which Bash cannot touch at all (step 3's single Write is the
only way).

If nothing is reachable at all: say so and stop. Do not watch or poll; when a platform is
connected later, setup runs on ask.

## What fires later, on its own

- **The onboarding walkthrough** - the onboarding-walkthrough skill, when a human says yes
  to "Are you ready to begin your onboarding?" (or asks to start it in any phrasing, in any
  conversation). It presents the autofilled findings per its output schema and collects the
  answers only a human can give.
- **Knoweth organize** - from the merged guard's gates, once content lands and the
  interpretation is confirmed.
- **Meta Validation** - from its merged gate (step 3), opening on its own once the Account
  Context Brain is confirmed and the creative cache has synced.
- **Daily VoC syncs, Cacheth sync, refresh cadences** - the routines created above.

The README's "Install and run order" describes this same lifecycle for humans; this file,
`post-install.md`, is the executable version. If the two ever disagree, fix them together -
do not improvise.
