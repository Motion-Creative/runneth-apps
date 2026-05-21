---
name: integration-health-check
description: |
  Monitors all connected integrations AND all active routines. Writes results to
  two state files and sends Slack alerts to the admin channel when anything is
  degraded or broken.

  Integration health: 5-layer checks per integration (credential, token, scope,
  capability, functional read). Alert on broken or degraded.

  Routine health: checks active status, firing schedule (overdue detection),
  dependency chains, and execution record freshness. Alert on broken chains,
  overdue routines, and execution failures.

  Alert types for both: first alert on status change, silence for
  {{SILENCE_HOURS}}h, one reminder after silence window, restored when healthy.
  All settings in /agent/brain/integration-health/health-config.json.
user-invocable: true
---

## Key Paths

| File | Purpose |
|---|---|
| `/agent/brain/integration-health/health-state.json` | Integration health — written after every run |
| `/agent/brain/integration-health/routine-health-state.json` | Routine health — written after every run |
| `/agent/brain/integration-health/health-config.json` | Org settings: silence_hours, check_interval_minutes, alert_channel_override |
| `/agent/brain/org/integrations/connected-integrations.json` | Registry of connected integrations |
| `/agent/brain/org/routine-executions/<skill-name>/last-run.json` | Execution records written by skills on completion |
| `/agent/brain/admin/config.json` OR `/agent/brain/permissions/config.json` | Admin channel (check v2.1 path first, fall back to v2.0) |

---

## Routine Health State Schema

```json
{
  "_meta": {
    "schemaVersion": "1.0",
    "lastRunAt": "ISO timestamp | null",
    "lastRunStatus": "never | ok | failed",
    "lastRunError": "string | null",
    "nextRunAt": "ISO timestamp | null"
  },
  "routines": {
    "<shortId>": {
      "shortId": "string",
      "name": "string",
      "cron": "string",
      "timezone": "string",
      "status": "healthy | degraded | broken | unverifiable",
      "statusReason": "string | null",
      "lastFiredAt": "ISO timestamp | null",
      "nextDueAt": "ISO timestamp | null",
      "overdueBy": "seconds | null",
      "skillName": "string | null",
      "executionRecord": {
        "found": true,
        "lastSuccessfulRunAt": "ISO timestamp | null",
        "lastRunStatus": "ok | failed | partial | null",
        "lastRunError": "string | null",
        "lagSeconds": "number | null"
      },
      "dependencies": ["shortId"],
      "downstreamImpact": ["shortId"],
      "alertState": {
        "alertedForStatus": "string | null",
        "firstAlertSentAt": "ISO timestamp | null",
        "lastAlertSentAt": "ISO timestamp | null",
        "restoredAlertSentAt": "ISO timestamp | null"
      }
    }
  }
}
```

---

## Procedure

### Step 0 — Self-healing

```bash
reminder list
```

If "Integration health check" routine not found, recreate it (see Routine Content Template). Post to admin channel. If duplicates found, delete all but the most recent.

### Step 1 — Record run start

```bash
RUN_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

### Step 2 — Load config

```bash
cat /agent/brain/integration-health/health-config.json
cat /agent/brain/admin/config.json 2>/dev/null || cat /agent/brain/permissions/config.json 2>/dev/null
```

Resolve: `silence_hours` (default {{SILENCE_HOURS}}), `alert_channel` (override → admin channel → skip if both null), `check_interval_minutes` (default {{CHECK_INTERVAL_MINUTES}}).

---

## Part A — Integration Health

*(unchanged from v1.0.0 — run all 8 integration checks: Motion, GitHub, Slack, Notion, Linear, Dropbox, OpenAI, LaunchDarkly. Write results to `/agent/brain/integration-health/health-state.json`. See integration check procedures below.)*

### Integration checks (summary)

Run checks for all integrations where `health_monitored: true` in `connected-integrations.json`. Each produces L1–L5 layers. Status: healthy / degraded / broken / unknown. Carry forward alertState from prior run.

Full per-integration check procedures are unchanged from v1.0.0 (Motion workspace-goal + creative-insights, GitHub secure-fetch token + repo, Slack doctor, Notion doctor, Linear GraphQL, Dropbox users/get_current_account, OpenAI /v1/models, LaunchDarkly /api/v2/projects). Unknown integration types → status `unknown`.

---

## Part B — Routine Health

### Step B1 — Read all active reminders

```bash
reminder list
```

Build a map of all reminders: `{ shortId, name, content, trigger.expression, trigger.timezone, nextDueDate, processedDate, active }`.

### Step B1b — Known routines registry: detect silent drops

The reminder system can silently drop reminders. This step detects that.

```bash
cat /agent/brain/integration-health/known-routines-registry.json 2>/dev/null
```

**If the registry does not exist:** create it now from the current `reminder list` output. Write every active reminder as a registry entry. This is the baseline. No drop detection on first run — that is expected.

```json
{
  "_meta": { "created": "<today ISO>", "last_updated": "<today ISO>", "note": "Baseline of known routines. Used to detect silent drops between health check runs." },
  "routines": {
    "<shortId>": { "shortId": "<shortId>", "name": "<name>", "cron": "<cron>", "first_seen": "<today ISO>", "last_seen": "<today ISO>", "active": true }
  }
}
```

**If the registry exists:** compare current `reminder list` against registry entries:

1. For every shortId in the registry: if it is NOT in the current `reminder list` — it silently dropped.
   - Set that routine's status to `broken`
   - Set `statusReason: "Reminder dropped — no longer in active list. Was last seen <last_seen>."`
   - Add to the alert queue (treated same as any `broken` routine in Step B6)
   - Keep the entry in the registry with `active: false` and `dropped_at: <RUN_AT>`

2. For every shortId in the current `reminder list` not yet in the registry: add it as a new entry with `first_seen: <RUN_AT>`.

3. Update `last_seen` for all routines still active in the current list.

4. Write updated registry back to `/agent/brain/integration-health/known-routines-registry.json`.

**The registry is the source of truth for what should exist.** The current `reminder list` is what does exist. The diff between them is what to alert on.

### Step B2 — Load prior routine health state

```bash
cat /agent/brain/integration-health/routine-health-state.json
```

Carry forward `alertState` per routine from prior run. Include dropped routines from Step B1b — they need alertState tracking too.

### Step B3 — Detect dependency chains

For each reminder, parse the `content` field for references to other reminder names or shortIds. A routine that calls, feeds, or triggers another is a dependency. Build a directed graph:
- `dependencies`: routines this one depends on (upstream)
- `downstreamImpact`: routines that depend on this one (downstream)

Simple heuristic: if routine A's content mentions routine B's name or shortId, A depends on B.

### Step B4 — Check each routine

For each active reminder:

**Overdue check:**
Parse `trigger.expression` (cron) to compute expected interval in seconds.
Compare `processedDate` (last fired) to `RUN_AT`.
If `RUN_AT - processedDate > 2 × interval` → overdue. Set `overdueBy = RUN_AT - processedDate - interval`.

**Execution record check:**
Derive skill name from routine content — look for a path ending in `SKILL.md` or a skill name pattern. Extract the skill's folder name.

```bash
cat /agent/brain/org/routine-executions/<skill-name>/last-run.json 2>/dev/null
```

If file not found → `executionRecord.found: false`, status contribution: `unverifiable`.
If found:
- `lastRunStatus: "ok"` AND `lastSuccessfulRunAt` is within 1.5 × interval of `processedDate` → execution healthy.
- `lastRunStatus: "failed"` OR `"partial"` → execution failed. Status: `degraded`.
- `lastSuccessfulRunAt` is stale (older than 1.5 × interval past `processedDate`) → likely failed silently. Status: `degraded`.

**Output freshness check (when skill produces a known output):**
If the execution record includes an `output_path`, check that file's modification time:
```bash
stat -c %Y <output_path> 2>/dev/null
```
If output not updated since last expected fire → additional `degraded` signal.

**Determine routine status:**
- All checks pass → `healthy`
- Overdue OR execution failed/stale → `degraded`
- Dependency routine is missing (deleted or inactive) AND this routine has downstream impact → `broken`
- Execution record not found → `unverifiable`
- Active: false → only flag if this routine appears in another routine's dependency graph → `broken` for downstream

### Step B5 — Write routine health state

Merge results into `/agent/brain/integration-health/routine-health-state.json`. Preserve `alertState` from prior run. Update `_meta`.

If write fails: fallback to `/tmp/routine-health-state-fallback.json`. Continue with in-memory state.

### Step B6 — Routine alert logic

Same silence window logic as integration alerts. `silence_hours` from health-config.json.

For each routine where status is `degraded`, `broken`, or `unverifiable`:

1. If `alertedForStatus` differs from current → reset alert timestamps, set `alertedForStatus`.
2. If `firstAlertSentAt` null → send first alert. Set `firstAlertSentAt = now`, `lastAlertSentAt = now`.
3. Else if `now - lastAlertSentAt >= silence_hours × 3600s` → send reminder.
4. Else → silent.

If status `healthy` and `alertedForStatus` was not null → send restored alert. Clear alertState.

**Resolve recipients:**
Admin Slack ID from workspace-map.json or user-map.json. Routine creator from conversationId → mondrianUserId → users index.

### Step B7 — Send routine Slack alerts

All messages use plain language. No technical terms visible to the user.

**Routine overdue:**
```
⚠️ *<Routine Name>* hasn't run when it was supposed to.
It's set to run every <interval>, but the last run was <X> ago.
<@ADMIN_SLACK_ID> worth a quick look.
I'll check in again in {{SILENCE_HOURS}} hours if it's still off track.
Reply "check <routine name>" and I'll dig into it.
```

**Execution didn't complete:**
```
⚠️ *<Routine Name>* ran but may not have finished correctly.
The last confirmed completion was <lastSuccessfulRunAt relative | "not yet recorded">.
<@ADMIN_SLACK_ID> the output from this task may be out of date.
Reply "fix <routine name>" and I'll help sort it out.
```

**Can't confirm completion (unverifiable) + inline fix:**
```
⚠️ *<Routine Name>* is running, but I can't confirm it's finishing correctly.
This is an easy fix — reply "fix <routine name>" and I'll add completion tracking on the spot.
<@ADMIN_SLACK_ID> one reply and this will be sorted.
```

**Dependency missing (silent drop or inactive):**
```
🔴 *<Routine Name>* has stopped working.
It depends on *<Dependency Name>* which is no longer active.
<@CreatorSlackID or name>: this task won't run until the dependency is restored.
Reply "fix <routine name>" and I'll walk you through it.
```

**Integration alert (plain language):**
When an integration is broken or degraded, translate technical state to plain language:
- Do NOT use: degraded, broken, L1, L2, scope, token, endpoint, credential
- DO say: what the problem looks like in practice, what the likely cause is (if known), what the impact is
- Include the likely cause in plain language ONLY when confident. If unsure, describe what was observed.

Example (LaunchDarkly, scope issue):
```
⚠️ LaunchDarkly is connected but something's slightly off — I can reach it but can't see your projects.
This usually happens when the API key doesn't have full access.
Nothing has broken yet, but I can't fully confirm the connection is healthy.
<@ADMIN_SLACK_ID> worth a quick look. Reply "fix LaunchDarkly" and I'll walk you through it.
I'll check in again in {{SILENCE_HOURS}} hours if this isn't resolved.
```

Example (GitHub, token expiry warning):
```
⚠️ Your GitHub connection will stop working in <N> days — the access token is about to expire.
When it expires, any automations that use GitHub will stop working too.
<@ADMIN_SLACK_ID> reply "fix GitHub" and I'll walk you through rotating it.
```

Example (Slack, disconnected):
```
🔴 Slack is disconnected. Any automations that post to Slack or read from it have stopped working.
<@ADMIN_SLACK_ID> reply "fix Slack" and I'll walk you through reconnecting it.
```

**Reminder (after silence window):**
```
🔴 *<Name>* is still having issues — it's been <hours> hours since the first alert.
<@ADMIN_SLACK_ID> this hasn't been resolved yet. Reply "fix <name>" and I'll help.
```

**Restored:**
```
✅ *<Name>* is back to normal. Everything that depends on it is running again.
```

### Step B8 — Handle "fix <skill name>" replies

When an admin replies to a routine alert with "fix <skill name>":

1. Read `/agent/.agents/skills/<skill-name>/SKILL.md`
2. Check if an execution record write step already exists (search for `routine-executions` or `last-run.json`)
3. If missing, add as the final step before any output summary:

```markdown
### Final step — Write execution record

After all main steps complete successfully:

```bash
mkdir -p /agent/brain/org/routine-executions/<skill-name>
```

Write `/agent/brain/org/routine-executions/<skill-name>/last-run.json`:
```json
{
  "last_successful_run_at": "<RUN_AT>",
  "last_run_status": "ok",
  "last_run_error": null,
  "routine_short_id": "<shortId of the reminder that invoked this skill>"
}
```

If the skill errors before this step, write `last_run_status: "failed"` and `last_run_error: "<error>"` instead.
```

4. Write the updated SKILL.md back.
5. Confirm in thread: "Done — *<skill name>* will now report execution status on every run. I'll confirm it's healthy after the next cycle."
6. Update `executionRecord.found: true` in routine-health-state.json for this routine so it no longer shows as `unverifiable`.

---

## Part D — Routine intent scan (runs once daily)

This section runs once per day, not every 30 minutes. Track last run time in `_meta.lastIntentScanAt` in routine-health-state.json. Skip if already ran in the last 20 hours.

### Step D0 — Check if intent scan is enabled

```bash
cat /agent/brain/integration-health/health-config.json
```

If `intent_scan_enabled` is `false` or missing: skip Part D entirely. Update `_meta.lastIntentScanAt = RUN_AT` and move to Part C.

### Step D1 — Scan recent conversations for missed routine intent

Wrap the entire DB query in error handling. If the DB is unavailable or locked, write `_meta.lastIntentScanError = "DB unavailable"` and skip Part D silently for this cycle. Do not let a DB failure block the health check run.

Query conversations from the last 24 hours:

```sql
SELECT conversation_id, json_extract(conversation_json, '$.origin') as origin,
       json_extract(conversation_json, '$.mondrianUserId') as user_id,
       json_extract(conversation_json, '$.title') as title,
       updated_at_ms
FROM conversations
WHERE updated_at_ms > (strftime('%s','now') - 86400) * 1000
ORDER BY updated_at_ms DESC
```

For each conversation, read recent messages looking for routine intent signals:
- "remind me", "every day/week/month", "set up a routine", "schedule this", "I want Runneth to automatically", "can you do this daily/weekly", "going forward", "from now on"

### Step D2 — Assess confidence and match against active reminders

For each intent signal found:

1. Does a matching reminder already exist in `reminder list`? If yes, skip — already handled.

2. Assess confidence tier:

**Tier 1 — Clear intent, clear parameters** (frequency determinable, topic determinable, no ambiguity):
- Example: "remind me every Monday at 9am to review last week's ad performance"
- Action: create the routine silently. Then notify the person in their original context (see Step D3).

**Tier 2 — Clear intent, missing parameters** (intent obvious, but frequency or topic incomplete):
- Example: "I'd love a routine that keeps me updated on creative performance"
- Action: reply in the original thread/conversation asking for the specific missing detail only.

**Tier 3 — Uncertain intent** (exploratory, conditional, or hypothetical language):
- Example: "could we do something like a weekly digest?", "what if Runneth sent me updates?"
- Action: skip entirely. No alert, no creation.

### Step D3 — Act on findings

**Tier 1 (create silently):**
1. Create the routine via `reminder add` with the inferred parameters
2. Notify the person in their original context:

   **If Slack conversation:** reply in the original thread:
   ```
   slack send --channel <channelId> --thread <threadTs> --text
   "Hey, I noticed I didn't set up the reminder you mentioned here. I've created it now —
   it'll [plain description of what it does and when]. Reply 'stop' anytime to cancel it."
   ```

   **If web conversation:** cannot reply into a closed web conversation automatically.
   Post to the admin channel with a direct conversation link:
   ```
   "I noticed [person name] mentioned wanting a routine in [this conversation] but I didn't
   set it up. I've created it now. Here's the conversation if they want to review it:
   [conversation link or ID]. Reply 'stop [routine name]' to cancel it."
   ```

**Tier 2 (ask for missing detail):**

   **If Slack:** reply in the original thread:
   ```
   "Hey, I saw you mentioned wanting a routine here — just need one more detail:
   [specific missing question, e.g. 'how often should this run?']
   Once you tell me, I'll get it set up."
   ```

   **If web:** post to admin channel with conversation link:
   ```
   "[Person name] mentioned wanting a routine in [this conversation] but didn't give
   enough detail for me to create it. Link: [link]. They can follow up in that conversation
   or start a new one to finish setting it up."
   ```

**Tier 3:** no action.

### Step D4 — Update intent scan state

Write `_meta.lastIntentScanAt = RUN_AT` to routine-health-state.json.
Log summary of findings: intents detected, tier breakdown, actions taken.

---

## Part C — Combined output summary

```
Health check — <RUN_AT>

Integrations (X/Y healthy):
  Motion:       healthy
  GitHub:       degraded (token expires in 22 days)
  Slack:        healthy
  ...

Routines (X/Y healthy):
  Daily synthesis:      healthy
  Integration health:   healthy (monitoring routine)
  Creative war room:    degraded (overdue by 45min)
  Meta performance:     unverifiable (skill doesn't report execution)

Alerts sent: 2
Next run: <nextRunAt>
```

---

## Routine Content Template

```
Run the integration-health-check skill at /agent/.agents/skills/integration-health-check/SKILL.md.

Check all connected integrations and all active routines. Write results to /agent/brain/integration-health/health-state.json and /agent/brain/integration-health/routine-health-state.json. Send Slack alerts per the alert logic in the skill. Silent run — no user-visible output unless alerting.
```

Cron: `*/{{CHECK_INTERVAL_MINUTES}} * * * *`, Timezone: `{{TIMEZONE}}`, Name: `Integration health check`.

---

## Skill Changelog

| Date | Change |
|---|---|
| 2026-05-21 | v2.2 — Added Part D: routine intent scan (daily, conservative self-resolution, Slack thread reply + web conversation link). Rewrote all user-facing alert messages to plain language — no jargon, cause stated in plain language when known. |
| 2026-05-20 | v2.0 — Added Part B: routine health monitoring. Overdue detection, execution record checks, output freshness, dependency chain tracking, unverifiable status with inline fix from Slack. Combined output summary. |
| 2026-05-20 | v1.0 — Initial integration health monitoring. Dynamic registry, configurable silence window, self-healing routine, 3 alert types. |
