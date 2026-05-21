--- name: integration-health-check description: | Monitors all connected integrations AND all active routines. Writes results to two state files and sends Slack alerts to the admin channel when anything is degraded or broken. Integration health: 5-layer checks per integration (credential, token, scope, capability, functional read). Alert on broken or degraded. Routine health: checks active status, firing schedule (overdue detection), dependency chains, and execution record freshness. Alert on broken chains, overdue routines, and execution failures. Alert types for both: first alert on status change, silence for 24h, one reminder after silence window, restored when healthy. All settings in /agent/brain/integration-health/health-config.json. user-invocable: true ---

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

Resolve: `silence_hours` (default 24), `alert_channel` (override → admin channel → skip if both null), `check_interval_minutes` (default 30).

---

## Part A — Integration Health

Run checks for all integrations where `health_monitored: true` in `connected-integrations.json`. Each produces L1–L5 layers. Status: healthy / degraded / broken / unknown. Carry forward alertState from prior run.

**Status mapping (applies to all types):**
- L1 fails → `broken` (no credential)
- L1 passes, L2 fails → `degraded` (credential exists, auth broken)
- L1+L2 pass, L3+ fails → `degraded` (auth works, scope or capability issue)
- L1–L5 all pass → `healthy`
- Unknown type → `unknown`

---

### Check procedures — Original types (v1.0.0)

**Motion**
L1: `motion workspace-goal` returns without error. L2: Goal payload has `preferredConversionMetric`. L3: `motion meta insights --limit 1` returns (or empty OK). L4/L5: Creative row returned or empty result with valid schema. Status: healthy if L1+L2 pass.

**GitHub**
L1: `/agent/tools/github/token` exists and is non-empty. L2: `/agent/tools/github/gh.sh api user` → JSON with `login`. L3: Check token expiry from `/agent/brain/tools/github/README.md` — if expiry within 14 days → degraded. L4: `/agent/tools/github/gh.sh repo list Motion-Creative --limit 1` → returns repo. L5: Repo accessible. Degraded if expiry < 14 days. Broken if L2 fails.

**Slack**
L1: `slack memberships list` runs without error. L2: Returns at least one channel. L3: Admin channel from config is in the memberships list. L4/L5: Admin channel is reachable. Status: healthy if L1+L2+L3 pass.

**Notion**
L1: `notion search test` runs. L2: Returns without "not connected" error. L3: Search returns results or empty (not error). L4/L5: `notion read` on a known page works. Status: broken if L2 returns 409 not-connected.

**Linear**
L1: `LINEAR_API_KEY_RUNNETH` secret is set. L2: `secure-fetch run --url https://api.linear.app/graphql --method POST --secret-key LINEAR_API_KEY_RUNNETH --auth-header Authorization --auth-scheme "" --header "Content-Type: application/json" --body '{"query":"{viewer{id name}}"}' ` → 200 with `data.viewer.id`. L3: Viewer has `id`. L4: Team query returns teams. L5: Tickets accessible.

**Dropbox**
L1: `DROPBOX_TOKEN` secret is set. L2: `secure-fetch run --url https://api.dropboxapi.com/2/users/get_current_account --method POST --secret-key DROPBOX_TOKEN --auth-header Authorization --auth-scheme Bearer --header "Content-Type: application/json"` → 200 with `account_id`. L3: `account_id` present. L4/L5: Files accessible.

**OpenAI**
L1: `OPENAI_API_KEY` secret is set. L2: `secure-fetch run --url https://api.openai.com/v1/models --secret-key OPENAI_API_KEY` → 200. L3: Response has `data` array. L4: Models list non-empty. L5: Known model (`gpt-4` family) present.

**LaunchDarkly**
L1: `LAUNCHDARKLY_API_KEY` secret is set. L2: `secure-fetch run --url https://app.launchdarkly.com/api/v2/projects --header "Authorization: {{runneth-secret:LAUNCHDARKLY_API_KEY}}"` → 200. L3: Response has `items` array. L4: At least one project returned. L5: Project key accessible.

---

### Check procedures — Extended types (v2.1)

**Google (type: `google`)**
L1: `google doctor` runs without fatal error. L2: Response `accessPolicy` key is present (not disconnected). L3: `google access show` returns editable or readable sources. L4: `google drive list` returns without error (empty OK). L5: At least one file or managed output accessible.
Commands: `google doctor`, `google access show`.
Status: broken if L1 returns "not connected"; degraded if L2/L3 fail; healthy if L1+L2 pass.

**HubSpot (type: `hubspot`)**
L1: `HUBSPOT_TOKEN` secret is set. L2: `secure-fetch run --url "https://api.hubspot.com/crm/v3/owners?limit=1" --secret-key HUBSPOT_TOKEN` → status 200. L3: Response body has `results` array. L4: `secure-fetch run --url "https://api.hubspot.com/crm/v3/contacts?limit=1" --secret-key HUBSPOT_TOKEN` → status 200. L5: Contacts accessible (empty OK).
Status: broken if L1 fails; degraded if L2 returns 401/403; healthy if L1–L3 pass.

**Intercom (type: `intercom`)**
L1: `INTERCOM_ACCESS_TOKEN` secret is set. L2: `secure-fetch run --url "https://api.intercom.io/me" --header "Authorization: Bearer {{runneth-secret:INTERCOM_ACCESS_TOKEN}}" --header "Accept: application/json"` → status 200. L3: Response has `id` and `app.id_code`. L4: `secure-fetch run --url "https://api.intercom.io/contacts?per_page=1" --header "Authorization: Bearer {{runneth-secret:INTERCOM_ACCESS_TOKEN}}" --header "Accept: application/json"` → status 200. L5: Contacts accessible (empty OK).
Status: broken if L1 fails; degraded if L2 returns 401; healthy if L1–L3 pass.

**Gong (type: `gong`)**
L1: `GONG_BASIC_AUTH` secret is set. L2: `secure-fetch run --url "https://api.gong.io/v2/users" --header "Authorization: Basic {{runneth-secret:GONG_BASIC_AUTH}}"` → status 200. L3: Response has `records.totalRecords` and `users` array. L4: `totalRecords > 0` (Gong has users). L5: At least one user with `emailAddress` accessible.
Status: broken if L1 fails; degraded if L2 returns 401/403; healthy if L1–L3 pass.

**Meta / Facebook (type: `meta`)**
L1: `META_ACCESS_TOKEN` secret is set. L2: `secure-fetch run --url "https://graph.facebook.com/v21.0/me" --header "Authorization: Bearer {{runneth-secret:META_ACCESS_TOKEN}}"` → response has no `error.code: 190` (token expired). L3: Response has `id` (no OAuthException). L4: `secure-fetch run --url "https://graph.facebook.com/v21.0/me/adaccounts" --header "Authorization: Bearer {{runneth-secret:META_ACCESS_TOKEN}}"` → status 200. L5: Ad accounts accessible.
Status: broken if L1 fails; degraded if L2 returns `error.code: 190` (expired token) — alert: "Meta access token has expired and needs to be refreshed."; healthy if L1–L3 pass.

**X / Twitter (type: `x`)**
L1: `X_BEARER_TOKEN` secret is set. L2: `secure-fetch run --url "https://api.twitter.com/2/tweets/search/recent?query=test&max_results=10" --secret-key X_BEARER_TOKEN --auth-header Authorization --auth-scheme Bearer` → status 200. L3: Response has `meta` object. L4: No error key in response. L5: Search completes (0 results OK).
Note: `/2/users/me` requires OAuth 1.0a — use search endpoint for Bearer-token health check instead.
Status: broken if L1 fails; degraded if L2 returns 401/403; healthy if L1–L3 pass.

**ChartMogul (type: `chartmogul`)**
L1: `CHARTMOGUL_API_KEY` secret is set. L2: `secret run --env CHARTMOGUL_API_KEY=CHARTMOGUL_API_KEY -- python3 /agent/brain/tools/chartmogul/chartmogul.py ping` → output contains `"ok": true`. L3: ping returns `ok: true`. L4: `secret run --env CHARTMOGUL_API_KEY=CHARTMOGUL_API_KEY -- python3 /agent/brain/tools/chartmogul/chartmogul.py arr --start <YYYY>-01-01 --end <YYYY>-01-31 --interval month` (use current year) → returns without error. L5: ARR data accessible.
Status: broken if L1 fails or client script missing; degraded if L2/L3 fail; healthy if L1–L3 pass.

**Anthropic (type: `anthropic`)**
L1: `ANTHROPIC_API_KEY` secret is set. L2: `secure-fetch run --url "https://api.anthropic.com/v1/models" --header "x-api-key: {{runneth-secret:ANTHROPIC_API_KEY}}" --header "anthropic-version: 2023-06-01"` → status 200. L3: Response has `data` array. L4: At least one model with `id` starting with `claude-`. L5: Model list non-empty.
Status: broken if L1 fails; degraded if L2 returns 401; healthy if L1–L4 pass.

**Neon / Postgres (type: `neon`)**
L1: `NEON_DATABASE_URL` secret is set and non-empty (len > 20). L2: `secret run --env NEON_DATABASE_URL=NEON_DATABASE_URL -- python3 -c "import os; url=os.environ['NEON_DATABASE_URL']; import subprocess; r=subprocess.run(['python3','-c','import psycopg2,os; conn=psycopg2.connect(os.environ[\"NEON_DATABASE_URL\"]); cur=conn.cursor(); cur.execute(\"SELECT 1\"); print(cur.fetchone()); conn.close()'],env={**os.environ},capture_output=True,text=True); print(r.stdout or r.stderr)"` → output contains `(1,)`. If psycopg2 missing: `pip install psycopg2-binary -q` first then retry. L3: `SELECT 1` returns `(1,)`. L4: `SELECT count(*) FROM information_schema.tables WHERE table_schema='public'` → accessible. L5: Count returns (0 OK).
Simpler fallback if psycopg2 unavailable: parse `NEON_DATABASE_URL` host and attempt TCP socket connect on port 5432 — success = degraded-but-reachable rather than broken.
Status: broken if L1 fails; degraded if L2 fails (connection error); healthy if L1–L3 pass.

---

## Part B — Routine Health

### Step B1 — Read all active reminders

```bash
reminder list
```

Build a map of all reminders: `{ shortId, name, content, trigger.expression, trigger.timezone, nextDueDate, processedDate, active }`.

### Step B2 — Load prior routine health state

```bash
cat /agent/brain/integration-health/routine-health-state.json
```

Carry forward `alertState` per routine from prior run.

### Step B3 — Detect dependency chains

For each reminder, parse the `content` field for references to other reminder names or shortIds. A routine that calls, feeds, or triggers another is a dependency. Build a directed graph:

- `dependencies`: routines this one depends on (upstream)
- `downstreamImpact`: routines that depend on this one (downstream)

Simple heuristic: if routine A's content mentions routine B's name or shortId, A depends on B.

### Step B4 — Check each routine

For each active reminder:

**Overdue check:** Parse `trigger.expression` (cron) to compute expected interval in seconds. Compare `processedDate` (last fired) to `RUN_AT`. If `RUN_AT - processedDate > 2 × interval` → overdue. Set `overdueBy = RUN_AT - processedDate - interval`.

**Execution record check:** Derive skill name from routine content — look for a path ending in `SKILL.md` or a skill name pattern. Extract the skill's folder name.

```bash
cat /agent/brain/org/routine-executions/<skill-name>/last-run.json 2>/dev/null
```

If file not found → `executionRecord.found: false`, status contribution: `unverifiable`.
If found:
- `lastRunStatus: "ok"` AND `lastSuccessfulRunAt` is within 1.5 × interval of `processedDate` → execution healthy.
- `lastRunStatus: "failed"` OR `"partial"` → execution failed. Status: `degraded`.
- `lastSuccessfulRunAt` is stale (older than 1.5 × interval past `processedDate`) → likely failed silently. Status: `degraded`.

**Output freshness check (when skill produces a known output):** If the execution record includes an `output_path`, check that file's modification time:

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

**Resolve recipients:** Admin Slack ID from workspace-map.json or user-map.json. Routine creator from conversationId → mondrianUserId → users index.

### Step B7 — Send routine Slack alerts

**Routine degraded/overdue:**
```
⚠️ *<Routine Name>* is overdue — expected every <interval>, last ran <X> ago.
<@ADMIN_SLACK_ID> this routine may not be firing correctly. I'll remind you again in 24 hours if this isn't resolved. Reply "check <routine name>" for a live status.
```

**Execution failed:**
```
⚠️ *<Routine Name>* fired but execution may not have completed successfully.
Last successful completion: <lastSuccessfulRunAt relative | "never recorded">.
<@ADMIN_SLACK_ID> the output from this routine may be stale. Reply "fix <skill name>" and I'll walk you through it.
```

**Execution unverifiable (with inline fix offer):**
```
⚠️ *<Routine Name>* is running but I can't confirm execution completes successfully.
The skill it runs (*<skill name>*) doesn't report completion status yet.
<@ADMIN_SLACK_ID> reply "fix <skill name>" and I'll add execution tracking to it now.
```

**Dependency broken:**
```
🔴 *<Routine Name>* is broken — it depends on *<Dependency Name>* which is missing or inactive.
<@CreatorSlackID or name>: this routine won't work until the dependency is restored. Reply "fix <routine name>" for help.
```

**Reminder (after silence window):**
```
🔴 *<Routine Name>* is still <status> — <hours> hours since first alert.
<@ADMIN_SLACK_ID> this hasn't been resolved yet. Reply "fix <routine name>" for help.
```

**Restored:**
```
✅ *<Routine Name>* is back to healthy.
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

## Part C — Combined output summary

```
Health check — <RUN_AT>

Integrations (X/Y healthy):
  Motion: healthy
  GitHub: degraded (token expires in 22 days)
  Slack: healthy
  ...

Routines (X/Y healthy):
  Daily synthesis: healthy
  Integration health: healthy (monitoring routine)
  Creative war room: degraded (overdue by 45min)
  Meta performance: unverifiable (skill doesn't report execution)

Alerts sent: 2
Next run: <nextRunAt>
```

---

## Routine Content Template

```
Run the integration-health-check skill at /agent/.agents/skills/integration-health-check/SKILL.md.
Check all connected integrations and all active routines. Write results to /agent/brain/integration-health/health-state.json and /agent/brain/integration-health/routine-health-state.json.
Send Slack alerts per the alert logic in the skill. Silent run — no user-visible output unless alerting.
```

Cron: `*/30 * * * *`, Timezone: `America/Toronto`, Name: `Integration health check`.

---

## Skill Changelog

| Date | Change |
|---|---|
| 2026-05-21 | v2.1 — Added explicit check procedures for 9 new integration types: Google, HubSpot, Intercom, Gong, Meta, X, ChartMogul, Anthropic, Neon. Replaced v1.0.0 implicit procedure references with full explicit procedures for all 14 types. |
| 2026-05-20 | v2.0 — Added Part B: routine health monitoring. Overdue detection, execution record checks, output freshness, dependency chain tracking, unverifiable status with inline fix from Slack. Combined output summary. |
| 2026-05-20 | v1.0 — Initial integration health monitoring. Dynamic registry, configurable silence window, self-healing routine, 3 alert types. |
