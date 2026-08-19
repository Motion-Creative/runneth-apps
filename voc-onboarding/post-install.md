# Post-install: the voc-onboarding package fires itself

Every approved run executes the copy of this file on disk, read fresh in the turn that
runs it - never a sequence remembered from an earlier run or conversation. A reinstall
or upgrade replaces this file, so a remembered sequence may be the retired procedure;
if what memory expects and what this file says ever differ, this file wins.

Installing the voc-onboarding package delivers this procedure; it does not authorize it.
Run the VoC data sync setup below only after the package activation has disclosed the
connected-account reads and persistent changes and received an explicit human yes for
this workspace. If that consent is absent, stop without checking connections, reading
account data, creating routines, or changing files. After consent, step 0 states the
target workspace from this conversation's own Motion context before anything else
executes.

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

Nothing else identifies the workspace: not the `runneth:voc-onboarded` roster, not
existing `/agent/brain/<workspace>/` folders, not `voc-sync-<workspace>-*` routine names,
not a prior install or another conversation, not remembered context or anything memory
or a brain search returns - those record whichever workspaces onboarded *earlier*, and
on a multi-workspace VM another workspace's state is always present. If the workspace
you are about to write down came from any of those, it is wrong: read the
`Default workspace:` line again and use exactly what it says. Another
workspace's folders and routines are also not a resume signal: whether this run is a fresh
install or a resume is decided only after step 0 resolves the workspace, and only by the
resolved workspace's own roster entry and routines. One
org VM holds several workspace folders side by side and they never merge: a second workspace
onboarding is normal, not a conflict.

Inside that workspace folder, VoC files live under `data-sources/voc/`, one flat folder
per platform. The later Voice of Customer audit skill writes
`/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md` after raw VoC data has
landed. Post-install and the raw sync routines do not create it; its initial absence is expected.

Idempotency, per workspace:

- **This workspace's setup (steps 1 through 4):** already ran when this workspace is
  listed in the `runneth:voc-connected` block or the `runneth:voc-onboarded` roster in
  `/agent/user.md` (step 5), **or** in the legacy `runneth:meta-voc-onboarded` roster
  left by the combined meta-and-voc-onboarding package - that package already created
  this workspace's VoC sync routines, so honor its entry as full completion and never
  re-run setup or duplicate its routines. If any of those list this workspace, do not
  repeat the sequence. A `voc-connected` workspace is not fully onboarded - the audit
  pipeline owns the rest - but its technical setup is done; re-running for it only
  happens as a resume to add a newly connected platform. The one
  exception is the explicit reinstall or upgrade the activation instruction names: then
  re-run the sequence for this workspace as a resume, never a restart - setup skips any
  platform whose workspace-named routine already exists (same pinned account, no
  re-confirmation), and the roster entries stay exactly as they are - a workspace is
  never listed twice. If nothing lists it, run the steps now even when other workspace
  folders are already populated and other workspaces are listed in the rosters. Never
  read, copy, rename, or overwrite another workspace's folder to serve this one.
- **Partial setup (`runneth:voc-partial`):** a workspace listed in the
  `runneth:voc-partial` block (written by step 5 when Meta ad comments was the only
  reachable customer-voice source) already ran this sequence - its ad-comments sync
  exists and keeps running - but onboarding is stalled by design: it moves only
  when a dedicated customer-voice platform is connected. Re-running the sequence for a
  partial workspace is always a resume: keep the existing routines, set up any newly
  connected platform, and let step 5 decide whether the workspace graduates to the
  connected block.
- **Interrupted runs:** if no roster and no partial or connected block lists this
  workspace but its `voc-sync-<workspace>-*` routines already exist, a previous run
  died before step 5: resume rather than restart - keep the existing routines, set up
  any platform still missing one, and finish through step 5.
- **Renames:** if this workspace has no routines under its current slug but active
  `voc-sync-*` routines carry this workspace's id in their prompt under an older name,
  the workspace was renamed - cancel those routines, move
  `/agent/brain/<old-slug>/data-sources/voc/` to the current slug's folder, and create
  fresh routines under the current name instead of backfilling from scratch.

## `/agent/user.md` whole-file write chain

Every `/agent/user.md` write in this approved post-install sequence must build on the latest
known exact file payload:

- Before the first successful `/agent/user.md` write in this conversation, the saved copy in the
  system prompt is the source payload.
- After any successful whole-file Write, the exact payload sent by that Write becomes the only
  source payload for every later `/agent/user.md` write in this conversation. Keep it available
  unchanged and apply only the next sentinel-scoped roster edit to that payload.
- Never fall back to the conversation-start system-prompt copy after a successful Write. If the
  exact latest successful payload is unavailable, stop and report that the safe current payload
  cannot be established; do not write `/agent/user.md`.

This rule applies to first-time roster creation, second-workspace roster appends, and explicit
reinstalls or upgrades.

## The install-time sequence, in order

Step 0 - the workspace readout defined above - has already happened before step 1
starts: the workspace name, workspaceId, and slug every step below uses came from the
`Default workspace:` line of this conversation's `Motion context:` section, nowhere else.

1. **Check what the org can reach - a fixed, cheap probe, not an investigation.** The
   inventory has exactly three parts, read in this order, with nothing speculative:
   - **OAuth connections: one batched sweep, one command.** `integrations list`
     reports catalog metadata only (names, slugs, configuration), not connection
     state - never call it for reachability. The entire OAuth inventory is a single
     shell command: one loop over exactly the canonical VoC slugs, each checked with
     `integrations status --app <slug>`:

     ```
     for s in judge_me trustpilot yotpo junip okendo stamped reviews_io \
              gorgias_oauth intercom zendesk klaviyo attentive gong hotjar \
              reddit discord typeform; do
       echo "== $s"; integrations status --app "$s"
     done
     ```

     One command, one output to read the connected apps off. Never run the statuses
     as eighteen separate commands, and never probe slugs beyond this list - a VoC
     platform outside it can only arrive as a stored key or a later connect.
   - **Stored keys: zero commands.** The runtime secret store's key names and each
     key's allowed hosts are already injected into this conversation's context as the
     runtime-secrets block (values stay sealed; only `secure-fetch` can use them).
     Read the block from context - no command fetches it, and running probes to
     "discover" keys is wasted motion. A bounded `secure-fetch run` (or
     `secret run --env KEY=<SECRET_KEY> -- true`) confirms a specific key works before
     building on it - confirmation, not discovery. **A stored Apify key is itself a
     reachability fact**: Reddit, X, and Amazon Reviews have no dependable native OAuth
     path, so an Apify key makes them reachable through Apify actors - count them
     reachable when the key exists.
   - **Meta: the workspace listing is the answer.** A Meta workspace showing as
     connected (`motion workspaces`) is the entire reachability test for ad comments -
     a connected Meta workspace is itself a reachable VoC platform, because ad
     comments are customer voice. Never verify Meta with a data pull - no insights
     query, no creative probe: step 4 creates the routine on connected alone and its
     scheduled runs absorb API errors, so a probe cannot change the outcome, only
     spend time.

   Recognize VoC platforms in that inventory by reading it with
   judgment, not by matching key names to a scheme: a stored key named `OKENDO_TEN`, or
   any key whose allowed host is `api.okendo.io`, is an Okendo credential no matter
   what the key is called - the key name and the allowed host each independently
   identify the platform. Judge every connection and key against the voc-data-pull
   skill's Step 1 table and against plain sense: anything that is a reviews, support,
   survey, or community platform is customer voice. Never mark a platform unreachable
   without having read the full inventory first. VoC scope is customer-voice
   data, not the skill's recipe list - a reachable reviews/support/community platform with
   no recipe still counts. Integrations and stored secrets are VM-wide, so a platform
   reachable for one workspace is reachable here too; what changes per workspace is where
   its data lands.
2. **Open with the source inventory and the channel question - never a blind ask,
   never a silent setup.** Step 1's probe runs silently; its findings do not stay that
   way. Before any routine exists, send one message with three parts, in plain
   customer language ("what I can already see", "where you hear from customers" -
   never slugs, commands, or internals):
   - **What is already visible.** Lead with the honest inventory: "Here's what I can
     already see for <workspace>: ..." naming each connected or reachable source in
     plain words - a Meta ad account, a Gorgias support inbox, an Apify account that
     opens up Reddit and Amazon reviews. If ad comments are the only thing visible,
     say so plainly; that frames why the next question matters.
   - **What can be connected**, as categories with concrete examples, so the person
     never has to know platform names cold:
     - Customer reviews - Yotpo, Trustpilot, Judge.me
     - Customer support - Zendesk, Gorgias, Intercom
     - Post-purchase surveys - Narvar, AfterShip, Malomo, Loop Returns, Rebuy
     - Social listening - specific Reddit threads, or X/Twitter
   - **The direct question, as the closer:** "Which of these do you actually hear
     from customers on?"

   Stop there for the turn. The answer decides what gets connected next - a category
   list is never a license to set up everything on it.
3. **Answer with the plan, numbered, before any work happens.** When the person names
   their channels, respond with the plan as explicit numbered steps - never move
   silently into connection work:

   1. Connect the named platforms that aren't connected yet. Any social-listening
      channel - Reddit, X, or "social listening" generally - routes through Apify:
      immediately suggest connecting an Apify account and locating the right actor
      for it, since those platforms have no native connect path.
   2. Set up the daily sync that lands each source in the brain.
   3. Confirm where updates should land: this conversation, Slack (a named channel or
      thread, offered only when the Slack integration is connected), or somewhere
      else they name.

   The plan message itself carries the open questions - the delivery-destination
   choice (plan point 3) plus the account-confirmation question for every platform
   that needs a pin - as one compact block, then stops for the turn. One destination
   answer covers every routine this install creates; on a resume, reuse the
   destination the workspace's existing `voc-sync-*` routines already carry instead
   of re-asking. When the answers arrive, walk the person through any connections
   plan point 1 named, then execute steps 4 through 6 in that same turn.
4. **Set up the recurring syncs (they run in the background).** For each reachable or
   newly connected VoC platform, run the
   voc-data-pull skill's "Set up the recurring sync" procedure: pin the platform account
   to this workspace (accounts are org-level with no workspace tag, so which account
   belongs to this workspace is never inferred - that is what step 3's confirmations
   settled), create the `voc-sync-<workspace>-<platform>` routine, and kick its
   first run. A platform still waiting on its account answer appears in the
   closing message as "waiting on a person - account confirmation" and its routine is
   created the moment that answer arrives. A routine is never created on an unconfirmed
   account or an unconfirmed delivery destination just to keep the backfill
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
   `motion meta creative-comments` (platform slug `meta-ad-comments`; one file per creative
   under `voc/meta-ad-comments/`, at the same level as the other platform folders) - so it
   always gets a `voc-sync-<workspace>-meta-ad-comments` routine alongside the others: the
   standard pull of every onboarding, not a discovery outcome. For Meta, connected is the
   only reachability test: if a Meta workspace shows as connected, create and kick that
   routine even when a Meta API probe errors in this conversation - the
   routine's own scheduled runs absorb transient API failures. An API error is never
   grounds to skip the routine; only the absence of a connected workspace is. If the
   connection status itself cannot be read because those calls are erroring too, still
   create and kick the routine - the
   routine self-heals or keeps erroring visibly, either of which beats silently
   skipping setup. **Every routine created in this
   step gets its first run kicked before moving on - check them off one by one.** The
   12-month backfills churn in the background. Never pull
   VoC data inside this conversation. If old canceled `voc-sync-*` routines exist from a
   previous install, ignore them - canceled is terminal; never resume or reuse one, always
   create fresh. Leave other workspaces' `voc-sync-*` routines alone.
5. **Record the outcome in `/agent/user.md`** - one Write (file-write tool only; Bash
   cannot touch that file - reads and writes are both refused, and the edit/patch tool
   fails validation; the file's current contents are already in your system prompt).
   This is what the package's activation gate checks on every later turn, and it is per
   workspace, so it is the last thing done after step 4's routines are created and
   kicked. Connection is the technical half of onboarding, so this step never writes
   the onboarded roster - `runneth:voc-onboarded` is written only by the voc-audit
   skill, when the initial audit and gap analysis have been delivered and the standing
   refresh routine exists. **Which block this step writes depends on what step 4
   reached:**
   - **At least one dedicated customer-voice platform** (any platform other than
     `meta-ad-comments`) got a routine created, or is waiting only on an account
     confirmation (its routine arrives in the follow-up turn and does not block this
     write) -> the technical half is done: append this workspace to the
     `runneth:voc-connected` block, and if a `runneth:voc-partial` block lists this
     workspace, remove it from that list in the same Write (drop the whole partial
     block when its list empties). The connected block:

     > `<!-- BEGIN runneth:voc-connected -->`
     > `voc-onboarding has connected sources and started syncs for these workspaces (audit and gap analysis pending): <workspace>[, <workspace>...]`
     > `<!-- END runneth:voc-connected -->`

   - **Meta ad comments was the only reachable customer-voice source** -> onboarding is
     **not started in earnest** and this workspace is never written to the connected
     block now. Record it in the partial block instead, so the activation keeps
     reminding until a dedicated platform is connected:

     > `<!-- BEGIN runneth:voc-partial -->`
     > `voc-onboarding is waiting on a customer-voice integration for these workspaces: <workspace>[, <workspace>...]`
     > `<!-- END runneth:voc-partial -->`

   All the package's blocks share the same mechanics: if the block is absent, add it;
   if it exists, append this workspace to its list and leave the existing names alone -
   never rewrite a list to hold only this workspace, and a workspace is never listed
   twice in one block. Leave any legacy `runneth:meta-voc-onboarded` block exactly as
   it is - this package neither writes nor removes it. Compose the whole file from its
   current contents plus this change - current as of this moment in the turn, not as of
   the turn's start - and follow the whole-file write chain above. Touch nothing outside
   the sentinels, and check the payload before writing: the base document appears
   exactly once and each affected block's sentinel pair appears exactly once. After the
   Write succeeds, retain that exact payload as the current one.

   Write the resolved folder name, not the display name or the id - the same string used for
   `/agent/brain/<workspace>/`, so the gate and the folder always agree.
6. **Close the turn. Which closing message goes out depends on what step 4 reached** -
   the same fork as step 5:

   **When at least one dedicated customer-voice platform got a routine (or waits only
   on account confirmation), send the readiness report - status only, never content.**
   One line per part stating its state (running in background / done / waiting on a
   person / skipped and why). The report carries no findings and no numbers of any
   kind: no account numbers or metrics, no tallies or counts, no version labels. If a
   part is waiting on a person, name the topic in two or three words ("account
   confirmation"), not the question. The header says sources are connected - never
   "install complete" or "onboarding complete", because onboarding finishes only when
   the audit and gap analysis are delivered. The report's shape is literal:

   > voc-onboarding - sources connected for <workspace>
   > - VoC sync: <per-platform status, one line total>
   > - Voice of Customer Audit & gap analysis: waits for backfill completion and a
   >   person's yes - your onboarding wraps up when it's delivered

   Fill only the angle-bracket slots; append nothing else to any bullet. The workspace
   name in the header is identity, not a finding - it is the one detail that belongs there,
   because a VM can hold several onboarded workspaces. The
   only permitted extensions of a bullet are its allowed states ("skipped - <why>",
   "waiting on a person - <two-or-three-word topic>", "blocked - <reason>"), never extra
   detail after "done". Nothing follows the report.

   **When Meta ad comments is the only reachable customer-voice source, do not send
   that report** - step 5 just recorded the workspace as partial. Send the
   connect-an-integration message instead. Its one job
   is to get a customer-voice platform connected: the ask is the headline and the
   closing line, and ad comments appear exactly once, in a parenthetical at the end,
   never as the lead. The shape:

   > **Your Voice of Customer setup needs one more thing: a customer-voice
   > integration.**
   >
   > To find out what your customers actually think, I need to hear them somewhere -
   > reviews, support tickets, surveys, that kind of thing. Pick whichever ones your
   > team actually hears from customers on:
   >
   > - Customer reviews - Yotpo, Trustpilot, Judge.me
   > - Customer support - Zendesk, Gorgias, Intercom
   > - Post-purchase surveys - Narvar, AfterShip, Malomo, Loop Returns, Rebuy
   > - Social listening - specific Reddit threads, or X/Twitter
   >
   > Tell me which one you use and I'll walk you through connecting it - and if yours
   > isn't on this list, name it anyway and I'll check. The moment it's linked, I'll
   > finish your setup.
   >
   > (One thing is already flowing: I found your Meta ad comments and started pulling
   > those in, so they'll be waiting when the rest connects.)

   The wording may flex a little to fit the conversation, but it keeps this structure:
   the integration ask opens and closes the message, the platform list stays curated to
   exactly these categories and names (the catch-all sentence covers everything else -
   never dump the full registry), the ad-comments line stays a single parenthetical at
   the bottom, and nothing anywhere calls the setup complete, done, or finished. No
   commands, no counts, no internals. When the person names a platform, walk them
   through connecting it at a high level (the OAuth connect or, for key-based platforms
   and social listening via Apify, the secret-collection flow) and, once connected,
   resume this sequence for that platform - step 5 then moves the workspace from the
   partial block to the connected block, and onboarding completes when the audit and
   gap analysis are delivered.

Mechanics for every step above: when a step updates any existing file, do not use the
edit/patch tool - it fails validation on this VM. Read the file and write it back whole
(python for mechanical splices, the file-write tool for short files) - except
`/agent/user.md`, which Bash cannot touch at all (the file-write tool is the only
mechanism - the single Write in step 5).

If nothing is reachable at all: say so and stop. Do not watch or poll; when a platform is
connected later, setup runs on ask.

## What fires later, on its own

- **The finish-setup reminder** - while a workspace sits in the `runneth:voc-partial`
  block, the activation gives a short once-per-conversation reminder that the setup is
  waiting on a customer-voice integration (see the activation instruction for its
  shape). When a person connects a platform and says yes - or names a platform to
  connect - this sequence re-runs as a resume for that workspace: the new platform gets
  its sync, and step 5 moves the workspace from the partial block to the connected
  block.
- **The Voice of Customer Audit offer** - once the workspace's VoC backfill is fully
  covered, the sync routine's daily runs offer the `voc-audit` skill once (deferring
  while a Meta onboarding is mid-flight, per the skill's delivery rules). The initial
  audit runs only on a yes or an explicit audit request and always includes the gap
  analysis. Delivering it is what completes onboarding: the skill creates the standing
  `voc-audit-refresh-<workspace>` routine and moves the workspace from the connected
  block to the `runneth:voc-onboarded` roster.
- **The audit refresh** - after onboarding completes, the refresh routine keeps the
  audit and gap analysis current as new customer voice lands, notifies the chosen
  destination in plain language only when the audit moved, and once a month asks
  whether anything is missing from the picture.
- **Daily VoC syncs** - the routines created above. Each run notifies the chosen
  delivery destination (web conversation or Slack) only when something new landed;
  a run that found nothing new is silent.

The README's "Install and run order" describes this same lifecycle for humans; this file,
`post-install.md`, is the executable version. If the two ever disagree, fix them together -
do not improvise.
