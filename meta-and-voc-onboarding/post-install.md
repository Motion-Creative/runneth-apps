# Post-install: the meta-and-voc-onboarding package fires itself

Installing the meta-and-voc-onboarding package delivers this procedure; it does not
authorize it. Run the VoC data sync setup and Meta context work below only after the
package activation has disclosed the connected-account reads and persistent changes and
received an explicit human yes for this workspace. If that consent is absent, stop
without checking connections, reading account data, creating routines, or changing
files. After consent, step 0 states the target workspace from this conversation's own
Motion context before anything else executes.

## Resolve the workspace folder first

Everything this package persists lives in one folder per Motion workspace:
`/agent/brain/<brand>/`, where `<brand>` is the brand name - the name of the workspace this
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

Nothing else identifies the workspace: not the `runneth:meta-voc-onboarded` roster, not
existing `/agent/brain/<brand>/` folders, not `voc-sync-<brand>-*` routine names,
not a prior install or another conversation, not remembered context or anything memory
or a brain search returns - those record whichever workspaces onboarded *earlier*, and
on a multi-workspace VM another workspace's state is always present. If the workspace
you are about to write down came from any of those, it is wrong: read the
`Default workspace:` line again and use exactly what it says. Another
workspace's folders and routines are also not a resume signal: whether this run is a fresh
install or a resume is decided only after step 0 resolves the workspace, and only by the
resolved workspace's own roster entry and files. One
org VM holds several workspace folders side by side and they never merge: a second workspace
onboarding is normal, not a conflict.

Inside that workspace folder, per-source families are siblings under `integrations/`:
Meta interpretation files live in `integrations/meta/` and VoC files live in
`integrations/voice-of-customer/`. In particular, the Account Context Brain is always
`/agent/brain/<brand>/integrations/meta/account-context.md`.
The later Voice of Customer audit skill writes
`/agent/brain/<brand>/integrations/voice-of-customer/voice-of-customer-audit.md` after raw VoC data has
landed. Post-install and the raw sync routines do not create it; its initial absence is expected.

Idempotency has two parts, because the guards are VM-wide while everything else is
per-workspace:

- **Guards (step 3):** the five blocks are generic and identical for every workspace. The
  guard merge is done for this VM only when each of the five merged blocks in
  `/agent/user.md` is identical to its staged guard file, sentinel lines included - then
  leave the blocks untouched, no matter which workspace merged them, and continue with the
  rest. A sentinel being present proves nothing by itself: an older install leaves stale
  blocks behind, and version labels can lie (a block's paths can change without a version
  bump), so byte-comparison against the staged file is the check that counts. If any block
  is missing or differs from its staged file in any way, step 3 runs and replaces it.
- **This workspace's setup (steps 1, 2, 4, 5):** done when this workspace is listed in the
  `runneth:meta-voc-onboarded` roster in `/agent/user.md` (step 6). If it is, this sequence
  already ran for this workspace - do not repeat it. The one exception is the explicit
  reinstall or upgrade the activation instruction names: then re-run the sequence for this
  workspace as a resume, never a restart - the guard merge keeps its normal rule (skip only
  when every merged block matches its staged file; refresh any that differ), VoC
  setup skips any platform whose workspace-named routine already exists (same pinned
  account, no re-confirmation), existing brain files are kept and filled rather than
  rewritten, and the roster entry stays exactly as it is - a workspace is never listed
  twice. If it is not, run those steps now even
  when other workspace folders are already populated and other workspaces are listed in the
  roster. Never read, copy, rename, or overwrite another workspace's folder to serve this one.
  If the roster does not list this workspace but
  `/agent/brain/<brand>/integrations/meta/account-context.md` already exists, a previous run died before
  step 6: resume rather than restart - keep the existing file, fill what is missing, and
  finish through step 6.
- **Renames:** if this workspace's folder is missing but another
  `/agent/brain/*/integrations/meta/account-context.md` records this workspace's id in its
  metadata, the workspace was renamed - move that folder to the current name instead of
  onboarding from scratch.

## Read the brain before writing to it (step 0.5)

After consent and step 0, before anything below runs, take one read-only look at the
top level of `/agent/brain/` and act on what kind of brain this is:

- **Fresh or near-empty:** nothing to adopt. The standard layout below applies as-is;
  this step costs one listing and ends here.
- **Earlier package layout** (`<brand>/data-sources/...` from a previous version):
  those are this VM's adopted homes. Already-onboarded workspaces keep writing to
  their existing paths exactly as they are; only a brand onboarded for the first time
  uses the current layout. Do not migrate old paths - a path move is a separate,
  explicitly approved change, never part of an install or upgrade.
- **A brain people have organized themselves:** inventory before writing. Give every
  top-level home one line in the brain map with a type label, in this brain's own
  terms. Recognize existing equivalents instead of duplicating them: a brand-named
  tree is that brand's home; an existing reviews or customer-voice cache is that
  brand's voice-of-customer bank; person and team areas are what they are. Record
  each adopted location in the map entry for that brand. If a corpus-search install
  is present, carry its registered source list into the map as entries - those
  folders were already confirmed as searchable banks by a person.

Then one rule for everything below: **a brand's package output goes to its adopted
home when one exists, and to the standard layout otherwise.** One convention per
brand home - never both. Never move, rename, merge, or rewrite anything a person
built. On a brain that had existing structure, the readiness report's first bullet is
`- Existing setup: found and kept - nothing was moved`.

## The install-time sequence, in order

Step 0 - the workspace readout defined above - has already happened before step 1
starts: the workspace name, workspaceId, and slug every step below uses came from the
`Default workspace:` line of this conversation's `Motion context:` section, nowhere else.

1. **Check what the org can reach.** Read the full inventory of what this VM can talk
   to, both halves: the OAuth connections (`integrations status --app <slug>` per
   platform; `integrations list` for the catalog) **and the runtime secret store's key
   names with each key's allowed hosts** - the runtime injects that metadata into this
   conversation's context as the runtime-secrets block (values stay sealed; only
   `secure-fetch` can use them). Read that block from context - no command fetches it.
   Also check whether a Meta
   workspace is connected. Recognize VoC platforms in that inventory by reading it with
   judgment, not by matching key names to a scheme: a stored key named `OKENDO_TEN`, or
   any key whose allowed host is `api.okendo.io`, is an Okendo credential no matter
   what the key is called - the key name and the allowed host each independently
   identify the platform. Judge every connection and key against the voc-data-pull
   skill's Step 1 table and against plain sense: anything that is a reviews, support,
   survey, or community platform is customer voice. Never mark a platform unreachable
   without having read the full inventory first. A bounded `secure-fetch run` (or
   `secret run --env KEY=<SECRET_KEY> -- true`) confirms a specific key works before
   building on it - confirmation, not discovery. VoC scope is customer-voice
   data, not the skill's recipe list - a reachable reviews/support/community platform with
   no recipe still counts. Integrations and stored secrets are VM-wide, so a platform
   reachable for one workspace is reachable here too; what changes per workspace is where
   its data lands.
2. **VoC first (it runs in the background).** For each reachable VoC platform, run the
   voc-data-pull skill's "Set up the recurring sync" procedure: pin the platform account
   to this workspace, create the `voc-sync-<brand>-<platform>` routine, and kick its
   first run. The pin is the skill's step 1 and it can need a human answer - accounts are
   org-level with no workspace tag, so which account belongs to this workspace is never
   inferred. Handle that inside this install turn: platforms the skill lets you auto-pin
   (the org has exactly one Motion workspace) get their routine created and kicked now;
   for the rest, ask the skill's confirmation question for every pending platform in one
   compact block just before the readiness report, mark those platforms
   "waiting on a person - account confirmation" in the report's reviews-and-comments line, and create and
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
   `/agent/brain/<brand>/integrations/voice-of-customer/<platform>/`, written out in full.
   **A connected Meta workspace is
   itself a reachable VoC platform** - ad comments are customer voice, pulled with
   `motion meta creative-comments` (platform slug `meta-ad-comments`; one file per creative
   under `voice-of-customer/meta-ad-comments/`, at the same level as the other platform folders) - so it
   always gets a `voc-sync-<brand>-meta-ad-comments` routine alongside the others: the
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
   create fresh. Leave other workspaces' `voc-sync-*` routines alone. If a platform's
   folder is already filling without a `voc-sync-*` routine - something outside Runneth
   is syncing it - never create a second sync on top of it: mark that platform
   "synced outside Runneth" in the report's reviews-and-comments line and offer the managed daily sync,
   creating it only on a yes.
3. **Merge all five guard blocks into `/agent/user.md` with one Write - nothing else can
   touch that file.** Skip this step entirely only if each of the five merged blocks in
   `/agent/user.md` is identical to its staged guard file, sentinel lines included (step 6
   is what records this workspace). Compare content, never mere presence: a sentinel
   version that differs from the staged one is a fast first signal, but a matching version
   proves nothing - blocks have gone stale without a version bump - so the check that
   counts is byte-comparison of each merged block against its staged file. If any block is
   missing, its sentinel version differs from the staged one, or its content differs from
   the staged block in any way, run this step and replace that block. Never leave a stale
   block in place because its sentinel is present. The
   blocks ship ready-made in
   `/agent/brain/packages/meta-and-voc-onboarding/meta-onboarding-rules/` (`meta-analysis-account-context.md`,
   `meta-analysis-validation.md`, `brain-organization.md`, `brain-file-conventions.md`,
   `brain-map.md`). On this VM,
   `/agent/user.md` is walled off from Bash entirely (reads and writes are both refused -
   do not try a script) and the edit/patch tool fails validation; the file-write tool is
   the only thing that can change it, and the file's current contents are already in your
   system prompt. So:
   - Read the five guard files with the file-read tool. **Substitute nothing.** The blocks
     are workspace-agnostic by design: they resolve `/agent/brain/<brand>/` per
     conversation, so `<brand>` and every other angle-bracket placeholder
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
     exactly once, and each of the five sentinel pairs appears exactly once. A doubled
     base document is a corrupted merge - fix the payload; never write it.
   - Write it with the file-write tool in **one** whole-file write. One Write total for
     this step.
   - The blocks are self-gating: merging now is what makes their gates watched. Do not run
     what they gate - organize and validation fire later, on their own conditions.

   **Then make the brain map real (same step, after the Write).** If
   `/agent/brain/brain-map.md` does not exist, create it from the staged template at
   `/agent/brain/packages/meta-and-voc-onboarding/brain-map-template.md`. If
   `/agent/INDEX.md` already holds entries, carry every one of them into the map's
   Entries section exactly as written - never reword, merge, collapse, or drop an
   existing entry; the map adapts to this brain, not the other way around - then
   replace `/agent/INDEX.md`'s contents with one line pointing to
   `/agent/brain/brain-map.md`. On a fresh VM `/agent/INDEX.md` is empty and this is
   just the template copy. The map's ongoing upkeep belongs to the `runneth:brain-map`
   guard merged above; nothing here needs re-running later.
4. **Creative Attributes** (Meta connected only): confirm workspace scope, establish the
   creative content layer (Cacheth + query paths), detect naming patterns as provisional
   proposals for the next step. Every cache call carries this workspace's id, and the
   provisional decode is written to `/agent/brain/<brand>/integrations/meta/naming-decoder.json`. The
   procedure is
   `/agent/brain/packages/meta-and-voc-onboarding/meta-creative-attributes-playbook.md`
   (its Step 2 is the install-time part). It ships as a brain document - there is no
   creative-attributes skill directory to look for. Skipping the playbook is not an
   option: if that file is missing, say so in the readiness report - never improvise
   this step from live Motion pulls without reading it.
5. **Account Context Brain** (Meta connected only): its guard is already merged (step 3).
   Autofill every field possible from live data - silently. Do not present the findings,
   do not ask the gap questions, do not run the walkthrough; the onboarding-walkthrough
   skill owns all of that and fires later, on a human's yes. **Persist
   before you stop:** write `/agent/brain/<brand>/integrations/meta/account-context.md` in the saved-file
   format the account-context playbook defines (staged at
   `/agent/brain/packages/meta-and-voc-onboarding/meta-account-context-brain-onboarding-package.md`;
   Section 3: a prose reference document,
   not the worksheet) with every autofilled field and the provisional naming decode. Record
   the workspace name and workspace id in the file's metadata block - that is what makes a
   later rename recoverable. Index it in `/agent/brain/brain-map.md` with the playbook's aliases,
   each alias qualified by the workspace ("Bramblewick NYC account context") because the index is
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
   Compose the whole file from its current contents plus this change - current as of this
   moment in the turn, not as of the turn's start. If step 3 wrote the file this turn, build
   on the exact payload that Write sent: it already carries the five guard blocks, and the
   copy in your system prompt predates it. Only when nothing has written the file this turn
   is the system-prompt copy still current. Touch nothing
   outside the sentinels, and check the payload before writing: the base document appears
   exactly once, and every guard sentinel merged this turn is present - a payload missing
   blocks that step 3 just wrote was composed from the stale copy; rebuild it, never write
   it. The roster block:

   > `<!-- BEGIN runneth:meta-voc-onboarded -->`
   > `meta-and-voc-onboarding has completed for these workspaces: <brand>[, <brand>...]`
   > `<!-- END runneth:meta-voc-onboarded -->`

   Write the resolved folder name, not the display name or the id - the same string used for
   `/agent/brain/<brand>/`, so the gate and the folder always agree.
7. **Close with the readiness report - status only, never content.** One line per part
   stating its state (running in background / done / waiting on a person / skipped and
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

   > Meta and Voice of Customer setup - complete for <brand>
   > - Existing setup: found and kept - nothing was moved   <- only on a brain that had existing structure (step 0.5)
   > - Reviews and comments sync: <per-platform status, one line total>
   > - Voice of Customer Audit: waits for the sync to finish and a person's yes
   > - Setup notes: saved
   > - Creative Attributes: done
   > - Account Context: done - remaining gaps wait for the walkthrough
   >
   > Are you ready to begin your onboarding?

   Fill only the angle-bracket slots; append nothing else to any bullet. The workspace
   name in the header is identity, not a finding - it is the one detail that belongs there,
   because a VM can hold several onboarded workspaces. "Creative
   Attributes: done" is the entire line - naming what was detected, the convention's name
   or shape, a file path, or guard version numbers turns a status into a finding.
   Wrong: "Account Context: autofilled 7 of 10 fields; 4 questions need a human."
   Right: "Account Context: done - remaining gaps wait for the walkthrough." The
   only permitted extensions of a bullet are its allowed states ("skipped - <why>",
   "waiting on a person - <two-or-three-word topic>", "blocked - <reason>",
   "synced outside Runneth - sync offer open"), never extra
   detail after "done". "Done" is terminal: a part that completed through a fallback or
   degraded path is still exactly "done" - the how (which data source, which fallback,
   what was disabled) is detail, and it belongs in the brain file, not the report.
   "Setup notes: saved" covers the already-present case too - a VM whose guard blocks
   another workspace merged is still "saved", not "skipped". The report never names
   guards, sentinels, the roster, lanes, or any internal file mechanics - those words
   do not appear in anything a customer reads.
   The closing line is verbatim and nothing follows it. A yes (from anyone, in any
   conversation, whenever it comes) invokes the onboarding-walkthrough skill; that skill -
   and only that skill - presents the findings and asks the questions. Do not start the
   walkthrough inside the install turn unless the yes arrives here.

Mechanics for every step above: when a step updates `/agent/brain/brain-map.md` or any other
existing file, do not use the edit/patch tool - it fails validation on this VM. Read the
file and write it back whole (python for mechanical splices, the file-write tool for
short files). Prefer scripted file assembly over retyping staged content anywhere -
except `/agent/user.md`, which Bash cannot touch at all (the file-write tool is the only
mechanism - the single Writes in steps 3 and 6).

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
