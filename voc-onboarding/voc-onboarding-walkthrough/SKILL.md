---
name: voc-onboarding-walkthrough
description: The entry point for Voice of Customer onboarding — finds the org's reachable VoC integrations, sets up the recurring syncs into the workspace's brain folder, and, once data lands, presents the per-integration Voice of Customer summary and offers the Voice of Customer Audit. Invoke when someone says "run voice of customer onboarding", "start VoC onboarding", "set up voice of customer", asks to begin or resume their Voice of Customer onboarding, or asks whether their customer-voice data is ready. Never self-runs at install or on a schedule.
---

# Voice of Customer Onboarding Walkthrough

This skill owns the Voice of Customer onboarding sequence for one Motion workspace: a
**setup phase** (find what the org can reach, pin accounts, create the recurring syncs) and
a **presentation phase** (say what customer voice the brain holds, then offer the Voice of
Customer Audit). Nothing in the voc-onboarding package runs before a person invokes this
skill or asks for one of its parts by name — installing the package stages files and does
nothing else. The sync mechanics live in the voc-data-pull skill and the audit lives in
the voc-audit skill; this skill orchestrates and presents.

## Step 0 — resolve the workspace first

Everything this sequence persists lives in one folder per Motion workspace:
`/agent/brain/<workspace>/`, where `<workspace>` is the name of the workspace this
conversation operates in, slugged - lowercase, every run of characters that is not a-z or
0-9 becomes one hyphen, trim leading and trailing hyphens ("Bramblewick NYC" ->
`bramblewick-nyc`, "St. Fig & Co." -> `st-fig-co`).

This is the sequence's first action, before any other work: no Motion commands, no routine
listing, no brain-file reads until it is done. This system prompt's `Motion context:`
section contains a `Default workspace:` line stating the workspace name and workspaceId
the runtime bound to this conversation - the same workspace every bare `motion` command
resolves to when `--workspace-id` is omitted, so it cannot disagree with where the data
actually lives. Quote that line verbatim, exactly as it appears in this prompt, then state
the slug derived from its name. Those three values - name, workspaceId, slug - are the
workspace for every later step, and nothing downstream may re-resolve them from anything
else. If that line is null or absent, ask which workspace to onboard and stop until
answered - never guess.

Nothing else identifies the workspace: not existing `/agent/brain/<workspace>/` folders,
not `voc-sync-<workspace>-*` routine names, not a prior run or another conversation, not
remembered context or anything memory or a brain search returns - those record whichever
workspaces onboarded *earlier*, and on a multi-workspace VM another workspace's state is
always present. Another workspace's folders and routines are also not a resume signal:
whether this run is a fresh setup or a resume is decided only after step 0 resolves the
workspace, and only by the resolved workspace's own routines and files. One org VM holds
several workspace folders side by side and they never merge: a second workspace onboarding
is normal, not a conflict.

VoC files live under `/agent/brain/<workspace>/data-sources/voc/<platform>/`. The later
Voice of Customer audit skill writes
`/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md` after raw VoC data
has landed. This skill and the raw sync routines do not create it; its initial absence is
expected.

## Phase 1 — setup (runs when this workspace has no `voc-sync-<workspace>-*` routines yet)

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
   this step is done. VoC scope is customer-voice data, not the skill's recipe list - a
   reachable reviews/support/community platform with no recipe still counts. Integrations
   and stored secrets are VM-wide, so a platform reachable for one workspace is reachable
   here too; what changes per workspace is where its data lands.
2. **Set up the recurring syncs (they run in the background).** For each reachable VoC
   platform, run the voc-data-pull skill's "Set up the recurring sync" procedure: pin the
   platform account to this workspace, create the `voc-sync-<workspace>-<platform>`
   routine, and kick its first run. The pin is the skill's step 1 and it can need a human
   answer - accounts are org-level with no workspace tag, so which account belongs to
   this workspace is never inferred. Handle that inside this invocation: platforms the
   skill lets you auto-pin (the org has exactly one Motion workspace) get their routine
   created and kicked now; for the rest, ask the skill's confirmation question for every
   pending platform in one compact block just before the status report, mark those
   platforms "waiting on a person - account confirmation" in the report's VoC line, and
   create and kick their routines the moment the answer arrives - in that follow-up turn,
   never before. A routine is never created on an unconfirmed account just to keep the
   backfill moving. The workspace belongs in the routine name because routines are
   VM-wide - `voc-sync-gorgias` would collide with another workspace's routine, and a
   collision is what mixes two brands' customer data into one corpus. For the same reason
   the routine's script carries this workspace's folder path, workspace id, and pinned
   account id **literally**, never "resolve the current workspace" or "the connected
   account": routine conversations run with no workspace attached, so a routine that
   tries to resolve one at run time has nothing to resolve. Its output path is
   `/agent/brain/<workspace>/data-sources/voc/<platform>/`, written out in full.
   **A connected Meta workspace is itself a reachable VoC platform** - ad comments are
   customer voice, pulled with `motion meta creative-comments` (skill slug
   `meta-ad-comments`; one file per creative under `voc/meta-ad-comments/`, at the same
   level as the other platform folders) - so it always gets a
   `voc-sync-<workspace>-meta-ad-comments` routine alongside the others: the standard
   pull of every onboarding, not a discovery outcome. For Meta, connected is the only
   reachability test: if a Meta workspace shows as connected, create and kick that
   routine even when a Meta API probe errors in this conversation - the routine's own
   scheduled runs absorb transient API failures. An API error is never grounds to skip
   the routine; only the absence of a connected workspace is. **Every routine created in
   this step gets its first run kicked before moving on - check them off one by one.**
   The 12-month backfills churn in the background. Never pull VoC data inside this
   conversation. If old canceled `voc-sync-*` routines exist from a previous run, ignore
   them - canceled is terminal; never resume or reuse one, always create fresh. Leave
   other workspaces' `voc-sync-*` routines alone.
3. **Close with a status report - status only, never content.** One line per platform
   stating its state (syncing in background / waiting on a person - account confirmation /
   skipped and why), plus one line for the audit. No counts, no findings, no file paths.
   The shape is literal:

   > voc-onboarding - setup complete for <workspace>
   > - VoC sync: <per-platform status, one line total>
   > - Voice of Customer Audit: waits for backfill completion and a person's yes
   >
   > I'll have your Voice of Customer summary once the backfills complete - ask me to
   > run your Voice of Customer onboarding again anytime to check in.

   If nothing is reachable at all: say so and stop. Do not watch or poll; when a platform
   is connected later, this skill runs setup for it on ask.

## Phase 2 — presentation (runs when this workspace's syncs already exist)

- **Present the Voice of Customer summary — proactively, not on request.** Inspect this
  workspace's platform folders under `/agent/brain/<workspace>/data-sources/voc/` and its
  `voc-sync-<workspace>-*` routines, then tell the person what customer voice the brain
  actually holds: one line per integration — the platform, what kind of voice it carries,
  how many items are synced, how many products they span, and the date coverage. For
  example: "Judge.me: 1,240 reviews across 6 products, May 2025 – July 2026." If a
  backfill is still running, present the counts so far and say the sync is still filling
  in. If a reachable platform has no routine yet (connected after setup ran), run Phase 1
  for that platform first.
- **Then offer the Voice of Customer Audit by previewing the plan, in Runneth's own words —
  never a script.** The offer walks through what the audit will actually do with this
  workspace's data: now that the reviews and comments are in, Runneth would like to run an
  audit — it will separate every entry by product, score each 1–5 for usefulness, and break
  the strong ones into five buckets, named plainly (pain points — what was wrong before
  they bought; trigger moments — what actually made them pull the trigger; objections —
  what nearly stopped them; transformations — what changed after; standout language — the
  best verbatim lines kept in one swipe file), plus evidence-backed personas for each
  product with 200 or more entries, saved as one compiled page the brain reads for
  customer-side WHY questions. Close the preview by handing the plan to the person: would
  they like anything added, and do they have existing docs to use as reference (existing
  personas especially)? Then the trigger is theirs:
  - **Data ready, no audit yet:** check whether
    `/agent/brain/<workspace>/data-sources/voc/voice-of-customer-audit.md` exists; if not,
    make the offer above. If `/agent/brain/<workspace>/_changelog.md` has no
    `voc-audit-offer` entry, append a dated one. A yes invokes the `voc-audit` skill,
    carrying any additions and reference docs the person named.
  - **An audit already exists:** say when it last ran and roughly how much new customer
    voice has synced since, and offer a rerun instead.
  - **Backfill incomplete or under 200 entries:** still present the summary and the
    preview, then say the audit will be ready when coverage completes — never start it
    against a partial backfill.

  The audit runs only on a person's yes here or an explicit later request — never because
  the walkthrough completed.

## Resume and idempotency

- Setup is done for a platform when its `voc-sync-<workspace>-<platform>` routine exists:
  skip it (same pinned account, no re-confirmation) and set up only what is missing.
  Re-invoking this skill is always safe — an invocation where every reachable platform
  already has its routine goes straight to Phase 2.
- The sync routine's own first-backfill note (defined in the voc-data-pull skill) offers
  the audit asynchronously when coverage completes; this skill's Phase 2 is the on-demand
  surface for the same offer. Both check `/agent/brain/<workspace>/_changelog.md` for an
  existing `voc-audit-offer` entry, so the person is never offered twice by default.
- Never read, copy, rename, or overwrite another workspace's folder or routines to serve
  this one.
