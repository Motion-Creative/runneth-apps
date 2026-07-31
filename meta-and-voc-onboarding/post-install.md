# Post-install: the meta-and-voc-onboarding package fires itself

Installing the meta-and-voc-onboarding package is the trigger for running it - both the VoC data
sync setup and the Meta context work (Creative Attributes, then the Account Context Brain).
Run the sequence below at the first opportunity after the package's files land: in the
installing turn if you are reading this then, otherwise on the first turn where the
package's activation instruction is visible. Either way, run it without waiting to be
asked. Its step 0 resolves the target workspace mechanically before anything else
executes.

## Resolve the workspace folder first

Everything this package persists lives in one folder per Motion workspace:
`/agent/brain/<workspace>/`, where `<workspace>` is the name of the workspace this
conversation operates in, slugged - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen, trim leading and trailing hyphens ("Huel EU" -> `huel-eu`, "Mr. Beast" -> `mr-beast`).
**Step 0 - resolve the workspace mechanically.** This is the sequence's first action,
before any other work: no other Motion commands, no routine listing, no brain-file reads,
no `/agent/user.md` reads or writes until it is done. Run:

```
printenv MOTION_WORKSPACE_ID
```

The value it prints is this conversation's workspaceId. The runtime injects that variable
into every Bash call, and it is the same id every bare `motion` command resolves to when
`--workspace-id` is omitted - it cannot disagree with where the data actually lives. Then
run `motion workspaces` and take the name of the workspace whose id equals that value
exactly; slug that name for the folder. State all three - name, workspaceId, slug - and
proceed: every later step uses those three values, and nothing downstream may re-resolve
them from anything else. If `MOTION_WORKSPACE_ID` is unset, this conversation has no
workspace: ask which workspace to onboard and stop until answered - never guess.

Nothing else identifies the workspace: not the `runneth:meta-voc-onboarded` roster, not
existing `/agent/brain/<workspace>/` folders, not `voc-sync-<workspace>-*` routine names,
not a prior install or another conversation - those record whichever workspaces onboarded
*earlier*, and on a multi-workspace VM another workspace's state is always present. Another
workspace's folders and routines are also not a resume signal: whether this run is a fresh
install or a resume is decided only after step 0 resolves the workspace, and only by the
resolved workspace's own roster entry and files. One
org VM holds several workspace folders side by side and they never merge: a second workspace
onboarding is normal, not a conflict.

Inside that workspace folder, data-source families are siblings under `data-sources/`:
Meta interpretation files live in `data-sources/meta/` and VoC files live in
`data-sources/voc/`. In particular, the Account Context Brain is always
`/agent/brain/<workspace>/data-sources/meta/account-context.md`.
The later Voice of Customer audit skill writes
`/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md` after raw VoC data has
landed. Post-install and the raw sync routines do not create it; its initial absence is expected.

Idempotency has two parts, because the guards are VM-wide while everything else is
per-workspace:

- **Guards (step 3):** the four blocks are generic and identical for every workspace. If the
  four sentinels are already in `/agent/user.md`, the guard merge is done for this VM - leave
  the blocks untouched, no matter which workspace merged them, and continue with the rest.
- **This workspace's setup (steps 1, 2, 4, 5):** done when this workspace is listed in the
  `runneth:meta-voc-onboarded` roster in `/agent/user.md` (step 6). If it is, this sequence
  already ran for this workspace - do not repeat it. The one exception is the explicit
  reinstall or upgrade the activation instruction names: then re-run the sequence for this
  workspace as a resume, never a restart - the guard merge keeps its normal skip rule, VoC
  setup skips any platform whose workspace-named routine already exists (same pinned
  account, no re-confirmation), existing brain files are kept and filled rather than
  rewritten, and the roster entry stays exactly as it is - a workspace is never listed
  twice. If it is not, run those steps now even
  when other workspace folders are already populated and other workspaces are listed in the
  roster. Never read, copy, rename, or overwrite another workspace's folder to serve this one.
  If the roster does not list this workspace but
  `/agent/brain/<workspace>/data-sources/meta/account-context.md` already exists, a previous run died before
  step 6: resume rather than restart - keep the existing file, fill what is missing, and
  finish through step 6.
- **Renames:** if this workspace's folder is missing but another
  `/agent/brain/*/data-sources/meta/account-context.md` records this workspace's id in its
  metadata, the workspace was renamed - move that folder to the current name instead of
  onboarding from scratch.

## The install-time sequence, in order

Step 0 - the mechanical workspace resolution defined above - has already happened before
step 1 starts: the workspace name, workspaceId, and slug every step below uses came from
`printenv MOTION_WORKSPACE_ID` and the matching `motion workspaces` entry, nowhere else.

1. **Check what the org can reach.** `integrations status --app <slug>` for each known
   VoC platform slug (the voc-data-pull skill's Step 1 table lists them; `integrations
   list --query <term>` finds any others) for OAuth connections, plus the stored secrets
   for **every** VoC platform (any platform may be key-stored instead of connected), plus
   whether a Meta workspace is connected. The secret store cannot be listed - the runtime
   refuses Bash reads of `/agent/.runtime/secrets`, and neither `secret` nor
   `secure-fetch` has a list command. The only probe that counts is running each
   key-stored platform's documented secret key: `secret run --env KEY=<SECRET_KEY> -- true`
   (or that platform's bounded `secure-fetch run` from the skill). A "secret not
   available" error means not stored. A refused `ls`, a `--help` read, or any other
   indirect check proves nothing and is never grounds to mark a platform unreachable -
   every key-stored platform in the skill's table gets its key probed this way before
   this step is done. VoC scope is customer-voice
   data, not the skill's recipe list - a reachable reviews/support/community platform with
   no recipe still counts. Integrations and stored secrets are VM-wide, so a platform
   reachable for one workspace is reachable here too; what changes per workspace is where
   its data lands.
2. **VoC first (it runs in the background).** For each reachable VoC platform, run the
   voc-data-pull skill's "Set up the recurring sync" procedure: pin the platform account
   to this workspace, create the `voc-sync-<workspace>-<platform>` routine, and kick its
   first run. The pin is the skill's step 1 and it can need a human answer - accounts are
   org-level with no workspace tag, so which account belongs to this workspace is never
   inferred. Handle that inside this install turn: platforms the skill lets you auto-pin
   (the org has exactly one Motion workspace) get their routine created and kicked now;
   for the rest, ask the skill's confirmation question for every pending platform in one
   compact block just before the readiness report, mark those platforms
   "waiting on a person - account confirmation" in the report's VoC line, and create and
   kick their routines the moment the answer arrives - in that follow-up turn, never
   before. A routine is never created on an unconfirmed account just to keep the backfill
   moving. The workspace belongs in
   the routine name because routines are VM-wide - `voc-sync-gorgias` would collide with
   another workspace's routine, and a collision is what mixes two brands' customer data into
   one corpus. For the same reason the routine's script carries this workspace's folder path,
   workspace id, and pinned account id **literally**, never "resolve the current workspace"
   or "the connected account": routine
   conversations run with no workspace attached, so a routine that tries to resolve one at run
   time has nothing to resolve. Its output path is
   `/agent/brain/<workspace>/data-sources/voc/<platform>/`, written out in full.
   **A connected Meta workspace is
   itself a reachable VoC platform** - ad comments are customer voice, pulled with
   `motion meta creative-comments` (skill slug `meta-ad-comments`; one file per creative
   under `voc/meta-ad-comments/`, at the same level as the other platform folders) - so it
   always gets a `voc-sync-<workspace>-meta-ad-comments` routine alongside the others: the
   standard pull of every onboarding, not a discovery outcome. For Meta, connected is the
   only reachability test: if a Meta workspace shows as connected, create and kick that
   routine even when a Meta API probe errors in this conversation - the
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
   create fresh. Leave other workspaces' `voc-sync-*` routines alone.
3. **Merge all four guard blocks into `/agent/user.md` with one Write - nothing else can
   touch that file.** Skip this step entirely if the four sentinels are already there (step 6
   is what records this workspace). The
   blocks ship ready-made in
   `/agent/brain/meta-and-voc-onboarding/guards/` (`account-context-guard.md`,
   `meta-validation-gate.md`, `knoweth-organize.md`, `knoweth-brain.md`). On this VM,
   `/agent/user.md` is walled off from Bash entirely (reads and writes are both refused -
   do not try a script) and the edit/patch tool fails validation; the file-write tool is
   the only thing that can change it, and the file's current contents are already in your
   system prompt. So:
   - Read the four guard files with the file-read tool. **Substitute nothing.** The blocks
     are workspace-agnostic by design: they resolve `/agent/brain/<workspace>/` per
     conversation, so `<workspace>` and every other angle-bracket placeholder
     (`<workspaceId>`, `<userId>`, `<platform>`, `<routine-id>`) stay exactly as written.
     Stamping an id into a guard is a corruption, not a customization: it would bind
     VM-wide rules to one workspace.
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
   proposals for the next step. Every cache call carries this workspace's id, and the
   provisional decode is written to `/agent/brain/<workspace>/data-sources/meta/naming-decoder.json`. The
   procedure is
   `/agent/brain/meta-and-voc-onboarding/meta-creative-attributes-playbook.md`
   (its Step 2 is the install-time part). It ships as a brain document - there is no
   creative-attributes skill directory to look for. Skipping the playbook is not an
   option: if that file is missing, say so in the readiness report - never improvise
   this step from live Motion pulls without reading it.
5. **Account Context Brain** (Meta connected only): its guard is already merged (step 3).
   Autofill every field possible from live data - silently. Do not present the findings,
   do not ask the gap questions, do not run the walkthrough; the onboarding-walkthrough
   skill owns all of that and fires later, on a human's yes. **Persist
   before you stop:** write `/agent/brain/<workspace>/data-sources/meta/account-context.md` in the saved-file
   format the account-context playbook defines (staged at
   `/agent/brain/meta-and-voc-onboarding/meta-account-context-brain-onboarding-package.md`;
   Section 3: a prose reference document,
   not the worksheet) with every autofilled field and the provisional naming decode. Record
   the workspace name and workspace id in the file's metadata block - that is what makes a
   later rename recoverable. Index it in `/agent/INDEX.md` with the playbook's aliases,
   each alias qualified by the workspace ("Huel EU account context") because the index is
   VM-wide and two workspaces' entries must never read as the same document. This file gets
   written even when the
   live pulls are entirely blocked by API errors: all field headers with whatever is
   known, each blocker recorded next to the field it blocks - a resumable scaffold must
   exist on disk before this step ends, never nothing. What waits for the human's
   answers is the walkthrough itself - never leave autofill results only in the chat.
6. **Record this workspace in the onboarded roster** - one Write to `/agent/user.md`, the
   same mechanics as step 3 (file-write tool only; Bash cannot touch that file). This is what
   the package's activation gate checks on every later turn, and it is per workspace, so it is
   the last thing done before the report and only after steps 4 and 5 actually persisted. If
   the roster block is absent, add it; if it exists, append this workspace to its list and
   leave the existing names alone - never rewrite the list to hold only this workspace.
   Compose the whole file from the copy in your system prompt plus this change, touch nothing
   outside the sentinels, and check the payload for a doubled base document before writing:

   > `<!-- BEGIN runneth:meta-voc-onboarded -->`
   > `meta-and-voc-onboarding has completed for these workspaces: <workspace>[, <workspace>...]`
   > `<!-- END runneth:meta-voc-onboarded -->`

   Write the resolved folder name, not the display name or the id - the same string used for
   `/agent/brain/<workspace>/`, so the gate and the folder always agree.
7. **Close with the readiness report - status only, never content.** One line per part
   stating its state (running in background / done / waiting on a person / skipped and
   why). The report carries no findings and no numbers of any kind: no account
   numbers or metrics, no tallies or counts (field counts, question counts, sample
   sizes, file totals - "autofilled 7 of 9 fields" is a finding, not a status), no
   version labels (the package version is not part of the report), no naming positions
   or decoder detail (not even the shape - "a 5-position decoder" or "4 schemas
   detected" is decoder detail; say "provisional naming decode written" and stop), no
   field reads, and never the question text itself - naming even one question here
   burns the walkthrough's opening. If a part is waiting on a person, name the topic in
   two or three words ("targets and thresholds"), not the question and not a count of
   questions. The same discipline covers the whole closing stretch of the turn: the
   progress narration around the report must not surface metrics, findings, or flags
   either ("average ROAS is 0.88" belongs in the brain file, never in this turn's
   visible text). The report's shape is literal:

   > meta-and-voc-onboarding - install complete for <workspace>
   > - VoC sync: <per-platform status, one line total>
   > - Voice of Customer Audit: waits for backfill completion and a person's yes
   > - Guards: merged
   > - Creative Attributes: done
   > - Account Context Brain: done - remaining gaps wait for the walkthrough
   >
   > Are you ready to begin your onboarding?

   Fill only the angle-bracket slots; append nothing else to any bullet. The workspace
   name in the header is identity, not a finding - it is the one detail that belongs there,
   because a VM can hold several onboarded workspaces. "Creative
   Attributes: done" is the entire line - naming what was detected, the convention's name
   or shape, a file path, or guard version numbers turns a status into a finding.
   Wrong: "Account Context Brain: autofilled 7 of 9 fields; 4 questions need a human."
   Right: "Account Context Brain: done - remaining gaps wait for the walkthrough." The
   only permitted extensions of a bullet are its allowed states ("skipped - <why>",
   "waiting on a person - <two-or-three-word topic>", "blocked - <reason>"), never extra
   detail after "done". "Done" is terminal: a part that completed through a fallback or
   degraded path is still exactly "done" - the how (which data source, which fallback,
   what was disabled) is detail, and it belongs in the brain file, not the report.
   "Guards: merged" covers the already-present case too - a VM whose guards another
   workspace merged is still "merged", not "skipped".
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
  answers only a human can give, for the workspace that conversation is in.
- **The Voice of Customer Audit offer** - the workspace's first fully covered VoC backfill
  asks once whether the person wants the `voc-audit` skill to run. The skill runs only on a
  yes or an explicit audit request, saves one compiled audit page, and never
  auto-regenerates.
- **Knoweth organize** - from the merged guard's gates, once content lands and the
  interpretation is confirmed. It runs per workspace, gated on that workspace's
  `_tag-vocabulary.md`.
- **Meta Validation** - from its merged gate (step 3), opening on its own once the Account
  Context Brain is confirmed and the creative content layer resolves. Each workspace
  validates independently.
- **Daily VoC syncs, Cacheth sync, refresh cadences** - the routines created above.

The README's "Install and run order" describes this same lifecycle for humans; this file,
`post-install.md`, is the executable version. If the two ever disagree, fix them together -
do not improvise.
