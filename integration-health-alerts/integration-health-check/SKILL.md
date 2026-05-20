---
name: integration-health-check
description: |
  Runs real health checks against every integration in the connected-integrations
  registry, writes results to /agent/brain/integration-health/health-state.json,
  and sends Slack alerts to the admin channel based on a configurable silence window.

  Designed to run on a 30-minute cron routine via reminder.

  Checks every integration registered in /agent/brain/org/integrations/connected-integrations.json
  where health_monitored = true. Each check produces a 5-layer health record:
  L1 credential presence, L2 token validity, L3 scope adequacy,
  L4 capability discovery, L5 functional read.

  Alert types: first alert on status change, silence for SILENCE_HOURS (default 24h),
  repeat alert after silence window if still degraded/broken, restored alert when health returns.
  All settings configurable in /agent/brain/integration-health/health-config.json.
user-invocable: true
---

## Key Paths

| File | Purpose |
|---|---|
| `/agent/brain/integration-health/health-state.json` | State file — written after every run |
| `/agent/brain/integration-health/health-config.json` | Org settings: silence_hours, check_interval_minutes, alert_channel_override |
| `/agent/brain/org/integrations/connected-integrations.json` | Registry of connected integrations — source of truth |
| `/agent/brain/admin/config.json` OR `/agent/brain/permissions/config.json` | Admin channel — `admin_slack_channel` field. Check v2.1 path first, fall back to v2.0. |

---

## State File Schema

```json
{
  "_meta": {
    "schemaVersion": "2.0",
    "lastRunAt": "ISO timestamp | null",
    "lastRunStatus": "never | ok | failed",
    "lastRunError": "string | null",
    "nextRunAt": "ISO timestamp | null",
    "routineShortId": "string | null"
  },
  "integrations": {
    "<id>": {
      "id": "string",
      "name": "string",
      "icon": "string",
      "status": "healthy | degraded | broken | unknown",
      "degradationSummary": "string | null",
      "lastChecked": "ISO timestamp | null",
      "connectedAt": "ISO timestamp | Never",
      "layers": [
        {
          "id": 1,
          "name": "string",
          "description": "string",
          "status": "pass | fail | warn | unknown | skipped",
          "detail": "string",
          "remediationHint": "string | null"
        }
      ],
      "availableCapabilities": ["string"],
      "affectedRoutines": [
        {
          "shortId": "string",
          "name": "string",
          "cron": "string",
          "status": "operational | degraded | blocked",
          "impactNote": "string",
          "nextDue": "ISO timestamp | null",
          "content": "string"
        }
      ],
      "alertState": {
        "alertedForStatus": "degraded | broken | null",
        "firstAlertSentAt": "ISO timestamp | null",
        "lastAlertSentAt": "ISO timestamp | null",
        "restoredAlertSentAt": "ISO timestamp | null",
        "routinesAlerted": ["shortId"]
      }
    }
  }
}
```

---

## Procedure

### Step 0 — Self-healing: verify this routine is still active

```bash
reminder list
```

Search for a reminder named "Integration health check". If not found:
1. Recreate the routine:
   ```
   reminder add --name "Integration health check" --cron "*/{{CHECK_INTERVAL_MINUTES}} * * * *" --timezone "{{TIMEZONE}}" --content "<full routine content from Routine Content Template below>"
   ```
2. Note new shortId. Update `_meta.routineShortId` in health-state.json.
3. Post to admin channel: "Integration health check routine was missing and has been recreated. Monitoring is active."

If multiple instances found, delete all but the most recent.

### Step 1 — Record run start

```bash
RUN_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

### Step 2 — Load config and registry

```bash
cat /agent/brain/integration-health/health-config.json
cat /agent/brain/org/integrations/connected-integrations.json
cat /agent/brain/admin/config.json 2>/dev/null || cat /agent/brain/permissions/config.json 2>/dev/null
cat /agent/brain/integration-health/health-state.json
```

- `silence_hours` from health-config.json (default {{SILENCE_HOURS}} if missing)
- `alert_channel_override` from health-config.json
- `admin_slack_channel` from whichever admin config path exists (v2.1: `/agent/brain/admin/config.json`, v2.0 fallback: `/agent/brain/permissions/config.json`)
- Resolve alert channel: use override if non-null, else admin_slack_channel. If both null, skip Slack alerts.
- Build check list: all integrations in connected-integrations.json where `health_monitored: true`
- Load prior `alertState` per integration to carry into this run

### Step 3 — Run health checks

Run checks only for integrations where `health_monitored: true`. Skip others silently.

Wrap every check in error handling. If a check errors (tool failure, not a health failure):
- Set status to `unknown`, L1 detail: "Health check failed to run: <error>". Continue.

#### Motion

**L1:** `motion workspace-goal` — 200 with valid JSON → pass.
**L2:** Same call. Parse workspace ID and preferred metric.
**L3:** `motion spend-threshold` and `motion brand-context --data-query "brand name"` — both succeed → pass.
**L4:** Confirm workspace ID resolves correctly from L2.
**L5:** `motion creative-insights --date-range last_30d --limit 1 --sort topSpend` — read file, ≥1 creative with non-null id/format/url → pass.
Status: all pass → healthy. Any fail → broken. Any warn → degraded.
Available capabilities: `workspace-goal`, `creative-insights`, `spend-threshold`, `brand-context`.

#### GitHub

**L1:** GITHUB_TOKEN runtime secret present → pass.
**L2:** `secure-fetch run --url "https://api.github.com/user" --secret-key GITHUB_TOKEN --header "User-Agent: runneth-health-check/1.0" --header "Accept: application/vnd.github.v3+json"` — 200 → pass. Parse `github-authentication-token-expiration`. If within 7 days → warn.
**L3:** Check `x-oauth-scopes` header. Fine-grained PAT → warn (scope confirmed by operation).
**L4:** If `{{GITHUB_REPO}}` is set: `secure-fetch run --url "https://api.github.com/repos/{{GITHUB_REPO}}" --secret-key GITHUB_TOKEN --header "User-Agent: runneth-health-check/1.0" --header "Accept: application/vnd.github.v3+json"` — 200 → pass. If `{{GITHUB_REPO}}` is null, skip L4 and L5, set both to `skipped`.
**L5:** If `{{GITHUB_REPO}}` is set: fetch commits from `https://api.github.com/repos/{{GITHUB_REPO}}/commits?per_page=3&sha=main` — ≥1 commit → pass.
Available capabilities: `repo-read`, `commit-read`, `issue-read`.

#### Slack

```bash
slack doctor
```
`lifecycle.state === "connected"` → L1 pass. Disconnected → L1 fail, status broken.
If connected: doctor.ok → L2. missingBotScopes empty → L3. `slack memberships list` → L4. Lightweight read → L5.
Available capabilities: `send`, `read`, `search`, `memberships`.

#### Notion

```bash
notion doctor
```
`status.connected === false` → L1 fail, broken. Connected → L1-L2 pass.
`notion search --query "test" --object page` → L4/L5.
Available capabilities: `search`, `read`, `create-page`, `update-page`.

#### Linear

**L2:** POST `https://api.linear.app/graphql` with `{"query": "{ viewer { id email } }"}` via LINEAR_TOKEN.
**L3:** `{"query": "{ teams { nodes { id name } } }"}` — teams array → pass.
**L4:** `{"query": "{ viewer { organization { id name } } }"}` — org resolves → pass.
**L5:** `{"query": "{ issues(first: 1) { nodes { id title } } }"}` — ≥1 issue → pass.
Available capabilities: `viewer`, `teams`, `issues`.

#### Dropbox

POST `https://api.dropboxapi.com/2/users/get_current_account` with empty body via DROPBOX_TOKEN.
200 → healthy. 401 expired → broken, remediationHint: "Reconnect Dropbox — access token expired." Network error → unknown.
Available capabilities: `file-list`, `file-download`, `file-upload`.

#### OpenAI

GET `https://api.openai.com/v1/models` via OPENAI_API_KEY. 200 with data array → healthy. 401 → broken. 429 → degraded.
Available capabilities: `chat-completions`, `embeddings`, `models`.

#### LaunchDarkly

GET `https://app.launchdarkly.com/api/v2/projects` via LAUNCHDARKLY_TOKEN (Authorization header, no Bearer prefix).
200 → healthy. 401 → broken. 403 → degraded.
Available capabilities: `projects`, `flags`, `environments`.

#### Unknown integration types

Set status `unknown`, L1 detail: "No health check logic defined for this integration type. Manual verification required." Log to output. Do not fail the run.

### Step 4 — Compute affected routines

```bash
reminder list
```
Map reminders that mention this integration by name to `affectedRoutines`. Monitoring routines → always `operational`. Others: healthy → operational, degraded → degraded, broken → blocked.

### Step 5 — Write state file

Merge new results into health-state.json:
- `_meta.lastRunAt = RUN_AT`, `_meta.lastRunStatus = "ok"`, `_meta.lastRunError = null`
- `_meta.nextRunAt = RUN_AT + check_interval_minutes`
- Preserve `connectedAt` from prior run
- Carry forward `alertState` from prior run (alert logic in Step 6 is the only thing that modifies it)

**If write fails:** Try `/tmp/health-state-fallback.json`. Set lastRunStatus = "failed", lastRunError = "<error>". Continue to Step 6 using in-memory state.

**If run errored mid-execution:** Write `lastRunStatus = "failed"`, `lastRunError = "<error>"`. Post to admin channel: "Integration health check failed to complete. Error: <error>. Reply 'run health check' to trigger manually." Stop.

### Step 6 — Alert logic

For each integration:

**If degraded or broken:**
1. If `alertState.alertedForStatus` differs from current → reset firstAlertSentAt, lastAlertSentAt, routinesAlerted. Set alertedForStatus = current.
2. If `firstAlertSentAt` null → send first alert. Set firstAlertSentAt = now, lastAlertSentAt = now.
3. Else if `now - lastAlertSentAt >= silence_hours * 3600s` → send reminder. Set lastAlertSentAt = now.
4. Else → silent.

**If healthy and alertedForStatus was degraded/broken:** Send restored alert. Clear all alertState fields.

**Routine alerts:** For each blocked/degraded routine not in `routinesAlerted` → send routine alert, add to routinesAlerted. Clear on restored.

**Resolve recipients:** Admin Slack ID from workspace-map.json or user-map.json. Routine creator from conversationId → mondrianUserId → users index.

### Step 7 — Send Slack alerts

Via `slack send --channel <alert_channel> --text "<message>"`.

**First alert:**
```
⚠️ *<Integration>* is <status>.
<degradationSummary or first failing layer detail>
<@ADMIN_SLACK_ID> your attention may be needed.
I'll remind you again in {{SILENCE_HOURS}} hours if this isn't resolved.
Reply "fix <integration>" and I'll walk you through it.
```

**Reminder (after silence window):**
```
🔴 *<Integration>* is still <status> — <hours> hours and counting.
<@ADMIN_SLACK_ID> this hasn't been resolved yet.
First flagged: <firstAlertSentAt relative>. Reply "fix <integration>" for help.
```

**Restored (only if prior alert was sent):**
```
✅ *<Integration>* is back to healthy.
All routines depending on it are operational again.
```

**Routine blocked:**
```
⚡ *<Routine>* is <status> because *<Integration>* is <status>.
<@CreatorSlackID or name>: your routine won't fire until the integration is fixed.
Reply "fix <integration>" for help.
```

**Execution failure:**
```
🛑 Integration health check failed to complete at <RUN_AT>.
Error: <error>
Integration status is unknown until the next successful run.
Reply "run health check" to trigger manually.
```

### Step 8 — Write final alertState

Write updated alertState for every integration back to health-state.json.

### Step 9 — Surface unmonitored integrations

For any registry entry where `health_monitored: false` with no capabilities file, note in output: "Integration <name> is connected but not yet health-monitored. Run integration-onboarding for <name> to add health monitoring."

### Step 10 — Output summary

```
Integration health check — <RUN_AT>
  Motion:       healthy  (5/5 layers pass)
  GitHub:       degraded (token expires in N days)
  ...
Overall: degraded
Alerts sent: 1 (GitHub — first alert)
Next run: <nextRunAt>
```

---

## Routine Content Template

```
Run the integration-health-check skill at /agent/.agents/skills/integration-health-check/SKILL.md.

Read every integration in /agent/brain/org/integrations/connected-integrations.json where health_monitored=true. Run all health checks. Write results to /agent/brain/integration-health/health-state.json. Send Slack alerts per the alert logic in the skill. Silent run — no user-visible output unless alerting.
```

Cron: `*/{{CHECK_INTERVAL_MINUTES}} * * * *`, Timezone: `{{TIMEZONE}}`, Name: `Integration health check`.

---

## Skill Changelog

| Date | Change |
|---|---|
| 2026-05-20 | v2.0 — Dynamic registry, configurable silence window, execution status tracking, self-healing routine, error surfacing on next cycle, restored alert only after prior alert sent. |
