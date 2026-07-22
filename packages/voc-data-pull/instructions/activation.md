# voc-data-pull is installed

The `voc-data-pull` skill (in your skills folder) pulls raw voice-of-customer data - product
reviews, support conversations, community posts, and ad comments - from connected VoC
platforms into standardized files under `/agent/brain/data-sources/voc/<platform>/`, one
file per item. Installing this package staged files only - no pull has run yet.

Covered platform slugs: `judge_me`, `trustpilot`, `yotpo`, `junip`, `gorgias_oauth`,
`intercom`, `reddit`, plus the secrets-path platforms `okendo` and `stamped`.

## Set up the recurring sync (the one procedure this instruction owns)

**Trigger: a covered platform is connected and its sync routine does not exist.** Routine
absence is the setup trigger - not folder state. Whenever you learn a covered platform is
connected (a connect just completed, `integrations status` shows it, or a working
okendo/stamped key is stored), run `routine list --search "voc-sync-<platform>"`:

- **Routine exists** -> do nothing (already set up).
- **Routine absent** -> create it, kick its first run, and tell the user. Exactly this:

1. Create (fill in the real current conversation id for `<conversation-id>`; keep the cron
   and names exactly as written):

   ```
   routine add --name "voc-sync-<platform>" \
     --delivery "No notification on success - the deliverable is the files under /agent/brain/data-sources/voc/<platform>/. If the run fails, a platform is disconnected, or coverage is incomplete, send a brief note to web conversation <conversation-id> with conversation send --to <conversation-id>." \
     --prompt "Run the voc-data-pull skill for <platform> as a recurring sync run, following the skill's Recurring sync rules exactly - they define the pull window, account iteration, disconnect handling, and coverage reporting." \
     --cron "0 6 * * *"
   ```

2. Kick the first sync run now (it happens in the background; the skill determines the
   window - a full backfill when no files exist yet, incremental otherwise):

   ```
   routine run --id <routine-id>
   ```

3. Tell the user in one or two sentences: the initial pull is running in the background and
   the data stays updated daily. Do not mention routines mechanics unless asked.

**Never run the pull inside this conversation.** All pulling happens in the routine's runs.

**Junip gate:** junip's recipe is blocked on a dead key. Before creating `voc-sync-junip`,
verify access with one bounded call (`GET /v1/stores`); if it fails, tell the user the key
needs replacing and create nothing.

## Also act when

- The user asks to pull, sync, or refresh reviews, support conversations, community posts,
  or ad comments: make sure the sync routine exists (procedure above); for a one-off
  refresh beyond the daily cadence, `routine run --id <routine-id>` - still never pull
  in-conversation.
- The user asks questions VoC data would answer (customer language, objections,
  complaints) and a covered platform is connected but has no sync routine yet: set it up
  (procedure above) and mention the data will be available shortly.
