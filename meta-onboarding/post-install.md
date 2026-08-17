# Post-install: the meta-onboarding package fires itself

Installing the meta-onboarding package delivers this procedure; it does not
authorize it. Run the Meta context work below only after the
package activation has disclosed the connected-account reads and persistent changes and
received an explicit human yes for this workspace. If that consent is absent, stop
without checking connections, reading account data, or changing
files. After consent, step 0 states the target workspace from this conversation's own
Motion context before anything else executes.

## Resolve the workspace folder first

Everything this package persists lives in one folder per Motion workspace:
`/agent/brain/<workspace>/`, where `<workspace>` is the name of the workspace this
conversation operates in, slugged - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen, trim leading and trailing hyphens ("Bramblewick NYC" -> `bramblewick-nyc`, "St. Fig & Co." -> `st-fig-co`).
**Step 0 - read the workspace off the conversation's own context.** This is the
sequence's first action, before any other work: no Motion commands, no routine listing,
no brain-file reads, no `/agent/user.md` reads or writes until it is done. This system
prompt's `Motion context:` section contains a `Default workspace:` line stating the
workspace name and workspaceId the runtime bound to this conversation - the same
workspace every bare `motion` command resolves to when `--workspace-id` is omitted, so
it cannot disagree with where the data actually lives. Quote that line verbatim, exactly
as it appears in this prompt, then state the slug derived from its name. Those three
values - name, workspaceId, slug - are the workspace for every later step, and nothing
downstream may re-resolve them from anything else. If that line is null or absent, ask
which workspace to onboard and stop until answered - never guess.

Nothing else identifies the workspace: not the `runneth:meta-onboarded` roster, not
existing `/agent/brain/<workspace>/` folders, not routine names,
not a prior install or another conversation, not remembered context or anything memory
or a brain search returns - those record whichever workspaces onboarded *earlier*, and
on a multi-workspace VM another workspace's state is always present. If the workspace
you are about to write down came from any of those, it is wrong: read the
`Default workspace:` line again and use exactly what it says. Another
workspace's folders are also not a resume signal: whether this run is a fresh
install or a resume is decided only after step 0 resolves the workspace, and only by the
resolved workspace's own roster entry and files. One
org VM holds several workspace folders side by side and they never merge: a second workspace
onboarding is normal, not a conflict.

Inside that workspace folder, data-source families are siblings under `data-sources/`:
Meta interpretation files live in `data-sources/meta/`. In particular, the Account
Context Brain is always
`/agent/brain/<workspace>/data-sources/meta/account-context.md`. Other families (such
as `data-sources/voc/`, created by the separate voc-onboarding package) may or may not
exist beside it; this package neither creates nor requires them.

Idempotency has two parts, because the guards are VM-wide while everything else is
per-workspace:

- **Guards (step 2):** the four blocks are generic and identical for every workspace. The
  guard merge is done for this VM only when each of the four merged blocks in
  `/agent/user.md` is identical to its staged guard file, sentinel lines included - then
  leave the blocks untouched, no matter which workspace merged them, and continue with the
  rest. A sentinel being present proves nothing by itself: an older install leaves stale
  blocks behind, and version labels can lie (a block's paths can change without a version
  bump), so byte-comparison against the staged file is the check that counts. If any block
  is missing or differs from its staged file in any way, step 2 runs and replaces it.
  Blocks merged by the older combined meta-and-voc-onboarding package count the same way:
  byte-identical means done, anything else means refresh.
- **This workspace's setup (steps 1, 3, 4):** done when this workspace is listed in the
  `runneth:meta-onboarded` roster in `/agent/user.md` (step 5), **or** in the legacy
  `runneth:meta-voc-onboarded` roster left by the combined meta-and-voc-onboarding
  package - that package already ran this workspace's Meta context work, so honor its
  entry as completion. If either roster lists this workspace, this sequence
  already ran for this workspace - do not repeat it. The one exception is the explicit
  reinstall or upgrade the activation instruction names: then re-run the sequence for this
  workspace as a resume, never a restart - the guard merge keeps its normal rule (skip only
  when every merged block matches its staged file; refresh any that differ),
  existing brain files are kept and filled rather than
  rewritten, and the roster entry stays exactly as it is - a workspace is never listed
  twice. If neither roster lists it, run those steps now even
  when other workspace folders are already populated and other workspaces are listed in the
  rosters. Never read, copy, rename, or overwrite another workspace's folder to serve this one.
  If the rosters do not list this workspace but
  `/agent/brain/<workspace>/data-sources/meta/account-context.md` already exists, a previous run died before
  step 5: resume rather than restart - keep the existing file, fill what is missing, and
  finish through step 5.
- **Renames:** if this workspace's folder is missing but another
  `/agent/brain/*/data-sources/meta/account-context.md` records this workspace's id in its
  metadata, the workspace was renamed - move that folder to the current name instead of
  onboarding from scratch.

## `/agent/user.md` whole-file write chain

Every `/agent/user.md` write in this approved post-install sequence must build on the latest
known exact file payload:

- Before the first successful `/agent/user.md` write in this conversation, the saved copy in the
  system prompt is the source payload.
- After any successful whole-file Write, the exact payload sent by that Write becomes the only
  source payload for every later `/agent/user.md` write in this conversation. Keep it available
  unchanged and apply only the next sentinel-scoped guard or roster edit to that payload.
- Never fall back to the conversation-start system-prompt copy after a successful Write. If the
  exact latest successful payload is unavailable, stop and report that the safe current payload
  cannot be established; do not write `/agent/user.md`.

This rule applies to guard refreshes, first-time roster creation, second-workspace roster appends,
and explicit reinstalls or upgrades.

## The install-time sequence, in order

Step 0 - the workspace readout defined above - has already happened before step 1
starts: the workspace name, workspaceId, and slug every step below uses came from the
`Default workspace:` line of this conversation's `Motion context:` section, nowhere else.

1. **Check the Meta connection.** Confirm a Meta workspace is connected for this
   conversation's workspace. If the connection status itself cannot be read because those
   calls are erroring, note the blocker and continue - this package is installed for Meta
   orgs, steps 3 and 4 record blockers next to the fields they block, and a resumable
   scaffold on disk beats silently stopping. Only a definitive "no Meta workspace
   connected" makes steps 3 and 4 report "skipped - no Meta connection".
2. **Merge all four guard blocks into `/agent/user.md` with one Write - nothing else can
   touch that file.** Skip this step entirely only if each of the four merged blocks in
   `/agent/user.md` is identical to its staged guard file, sentinel lines included (step 5
   is what records this workspace). Compare content, never mere presence: a sentinel
   version that differs from the staged one is a fast first signal, but a matching version
   proves nothing - blocks have gone stale without a version bump - so the check that
   counts is byte-comparison of each merged block against its staged file. If any block is
   missing, its sentinel version differs from the staged one, or its content differs from
   the staged block in any way, run this step and replace that block. Never leave a stale
   block in place because its sentinel is present. The
   blocks ship ready-made in
   `/agent/brain/meta-onboarding/meta-onboarding-rules/` (`meta-analysis-account-context.md`,
   `meta-analysis-validation.md`, `brain-organization.md`, `brain-file-conventions.md`). On this VM,
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
     prompt) exactly once, then each guard block. If a sentinel pair for a guard's name
     already exists in the file - match on the `runneth:<name>` token, whatever version
     the old sentinel lines carry - replace that whole block in place, sentinel lines
     included, with the staged block instead of appending. Touch nothing outside
     the sentinels.
   - Check the payload before writing: the base document's opening heading appears
     exactly once, and each of the four sentinel pairs appears exactly once. A doubled
     base document is a corrupted merge - fix the payload; never write it.
   - Write it with the file-write tool in **one** whole-file write. One Write total for
     this step.
   - After the Write succeeds, retain the exact payload that was sent. It is now the only valid
     source for any later `/agent/user.md` write in this conversation.
   - The blocks are self-gating: merging now is what makes their gates watched. Do not run
     what they gate - organize and validation fire later, on their own conditions.
3. **Creative Attributes** (Meta connected only): confirm workspace scope, establish the
   creative content layer (Cacheth + query paths), detect naming patterns as provisional
   proposals for the next step. Every cache call carries this workspace's id, and the
   provisional decode is written to `/agent/brain/<workspace>/data-sources/meta/naming-decoder.json`. The
   procedure is
   `/agent/brain/meta-onboarding/meta-creative-attributes-playbook.md`
   (its Step 2 is the install-time part). It ships as a brain document - there is no
   creative-attributes skill directory to look for. Skipping the playbook is not an
   option: if that file is missing, say so in the readiness report - never improvise
   this step from live Motion pulls without reading it.
4. **Account Context Brain** (Meta connected only): its guard is already merged (step 2).
   Autofill every field possible from live data - silently. Do not present the findings,
   do not ask the gap questions, do not run the walkthrough; the onboarding-walkthrough
   skill owns all of that and fires later, on a human's yes. **Persist
   before you stop:** write `/agent/brain/<workspace>/data-sources/meta/account-context.md` in the saved-file
   format the account-context playbook defines (staged at
   `/agent/brain/meta-onboarding/meta-account-context-brain-onboarding-package.md`;
   Section 3: a prose reference document,
   not the worksheet) with every autofilled field and the provisional naming decode. Record
   the workspace name and workspace id in the file's metadata block - that is what makes a
   later rename recoverable. Index it in `/agent/INDEX.md` with the playbook's aliases,
   each alias qualified by the workspace ("Bramblewick NYC account context") because the index is
   VM-wide and two workspaces' entries must never read as the same document. This file gets
   written even when the
   live pulls are entirely blocked by API errors: all field headers with whatever is
   known, each blocker recorded next to the field it blocks - a resumable scaffold must
   exist on disk before this step ends, never nothing. What waits for the human's
   answers is the walkthrough itself - never leave autofill results only in the chat.
5. **Record this workspace in the onboarded roster** - one Write to `/agent/user.md`, the
   same mechanics as step 2 (file-write tool only; Bash cannot touch that file). This is what
   the package's activation gate checks on every later turn, and it is per workspace, so it is
   the last thing done before the report and only after steps 3 and 4 actually persisted. If
   the roster block is absent, add it; if it exists, append this workspace to its list and
   leave the existing names alone - never rewrite the list to hold only this workspace.
   Leave any legacy `runneth:meta-voc-onboarded` block exactly as it is - this package
   neither writes nor removes it.
   Compose the whole file from its current contents plus this change - current as of this
   moment in the turn, not as of the turn's start. If step 2 wrote the file this turn, build
   on the exact payload that Write sent: it already carries the four guard blocks, and the
   copy in your system prompt predates it. Only when nothing has written the file this turn
   is the system-prompt copy still current. Touch nothing
   outside the sentinels, and check the payload before writing: the base document appears
   exactly once, and every guard sentinel merged this turn is present - a payload missing
   blocks that step 2 just wrote was composed from the stale copy; rebuild it, never write
   it. If the exact payload from the most recent successful Write is unavailable, stop instead
   of falling back to the system-prompt copy. After the roster Write succeeds, retain that exact
   payload as the current one. The roster block:

   > `<!-- BEGIN runneth:meta-onboarded -->`
   > `meta-onboarding has completed for these workspaces: <workspace>[, <workspace>...]`
   > `<!-- END runneth:meta-onboarded -->`

   Write the resolved folder name, not the display name or the id - the same string used for
   `/agent/brain/<workspace>/`, so the gate and the folder always agree.
6. **Close with the readiness report - status only, never content.** One line per part
   stating its state (done / waiting on a person / skipped and
   why). The report carries no findings and no numbers of any kind: no account
   numbers or metrics, no tallies or counts (field counts, question counts, sample
   sizes, file totals - "autofilled 7 of 10 fields" is a finding, not a status), no
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

   > meta-onboarding - install complete for <workspace>
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
   Wrong: "Account Context Brain: autofilled 7 of 10 fields; 4 questions need a human."
   Right: "Account Context Brain: done - remaining gaps wait for the walkthrough." The
   only permitted extensions of a bullet are its allowed states ("skipped - <why>",
   "waiting on a person - <two-or-three-word topic>", "blocked - <reason>"), never extra
   detail after "done". "Done" is terminal: a part that completed through a fallback or
   degraded path is still exactly "done" - the how (which data source, which fallback,
   what was disabled) is detail, and it belongs in the brain file, not the report.
   "Guards: merged" covers the already-present case too - a VM whose guards another
   workspace (or the older combined package) merged is still "merged", not "skipped".
   The closing line is verbatim and nothing follows it. A yes (from anyone, in any
   conversation, whenever it comes) invokes the onboarding-walkthrough skill; that skill -
   and only that skill - presents the findings and asks the questions. Do not start the
   walkthrough inside the install turn unless the yes arrives here.

Mechanics for every step above: when a step updates `/agent/INDEX.md` or any other
existing file, do not use the edit/patch tool - it fails validation on this VM. Read the
file and write it back whole (python for mechanical splices, the file-write tool for
short files). Prefer scripted file assembly over retyping staged content anywhere -
except `/agent/user.md`, which Bash cannot touch at all (the file-write tool is the only
mechanism - the single Writes in steps 2 and 5).

If no Meta workspace is connected at all: say so and stop. Do not watch or poll; when
Meta is connected later, setup runs on ask.

## What fires later, on its own

- **The onboarding walkthrough** - the onboarding-walkthrough skill, when a human says yes
  to "Are you ready to begin your onboarding?" (or asks to start it in any phrasing, in any
  conversation). It presents the autofilled findings per its output schema and collects the
  answers only a human can give, for the workspace that conversation is in.
- **Knoweth organize** - from the merged guard's gates, once content lands and the
  interpretation is confirmed. It runs per workspace, gated on that workspace's
  `_tag-vocabulary.md`, and judges "content landed" only against the data-source families
  the workspace actually has.
- **Meta Validation** - from its merged gate (step 2), opening on its own once the Account
  Context Brain is confirmed and the creative content layer resolves. Each workspace
  validates independently.
- **Cacheth sync and refresh cadences** - self-maintaining.

Voice of Customer setup is not part of this package: the separate voc-onboarding package
owns VoC sync routines and the Voice of Customer Audit, and installs independently.

The README's "Install and run order" describes this same lifecycle for humans; this file,
`post-install.md`, is the executable version. If the two ever disagree, fix them together -
do not improvise.
