---
name: integration-health-check
description: |
  On-demand health check for every connected integration. Runs one cheap read
  call per integration to confirm auth actually works, writes the results to
  one durable status file at /agent/brain/integration-health/health-status.md,
  and reports in chat. Invoke when the user says "check my integrations",
  "is everything connected", "health check", "is Slack working", "is Meta
  still connected", "why is <tool> failing", or any variation of asking
  whether their connected tools are healthy. On-demand only — never runs on a
  schedule and never posts anywhere unprompted.
user-invocable: true
---

# Integration health check

One job: when asked, confirm every connected integration still works, write one durable status file, and report back in chat.

This skill is on-demand only. It does not create routines or reminders, does not post to Slack or any other channel, and does not keep JSON state. The markdown status file is the only record. Each run reads the previous file, compares inline, and notes what changed.

## What it produces

1. `/agent/brain/integration-health/health-status.md` — per-integration status, last-checked date, and what action (if any) is needed. Overwritten on every run.
2. A short chat summary of the same.
3. On the first **successful** run only: a sentinel-guarded block appended to `/agent/user.md` so Runneth surfaces integration errors it hits mid-task instead of working around them silently (Step 6).

## Procedure

### Step 1 — Read the previous status, if any

```bash
cat /agent/brain/integration-health/health-status.md 2>/dev/null
```

Keep it in memory. It is the baseline for the "what changed" notes. There is no other state file.

### Step 2 — Discover connected integrations

Use the integration listings the sandbox provides:

```bash
integrations list        # OAuth-connected apps
slack doctor 2>/dev/null # native connections report their own state
notion doctor 2>/dev/null
google doctor 2>/dev/null
```

An integration counts as connected if it appears in `integrations list` or its doctor command reports a connected state. Do **not** infer connections from environment variables or runtime secrets, and do not read or scan secret values for any reason.

### Step 3 — Verify each integration with one cheap read

For each connected integration, make the single lightest read call that exercises real auth. Known checks:

| Integration | Cheap check |
|---|---|
| Slack | `slack doctor` reports a connected, healthy state |
| Notion | `notion doctor` |
| Google | `google doctor` |
| Motion | `motion workspaces` returns the workspace list |
| Linear | the smallest viewer/profile query the connection supports |
| GitHub | read the connected repo's metadata |
| Anything else | the lightest read it offers (list one resource, fetch the account profile) |

Classify each result in plain language:

- **Working** — the read call succeeded.
- **Not working** — auth failed, the token is expired or revoked, or the call errored. Capture the cause in one plain-language line and what the user should do (usually: reconnect the integration).
- **Can't tell** — no cheap read is available, or the call timed out. Say so honestly. Never guess a status.

Keep it cheap: one call per integration, smallest possible scope, at most one retry.

### Step 4 — Write the status file

Create the folder if needed, then overwrite `/agent/brain/integration-health/health-status.md`:

```markdown
# Integration health status

**Last checked:** <YYYY-MM-DD HH:MM UTC>
**Checked by:** integration-health-check (on demand)
**Summary:** <X> of <Y> integrations working

## Status by integration

| Integration | Status | Detail | Action needed |
|---|---|---|---|
| Slack | Working | Connected and healthy | None |
| Meta | Not working | Access token expired <date if known> | Reconnect Meta from the integrations page |
| Linear | Can't tell | No cheap read available | Ask again after using Linear in a task |

## Changes since last check

<One bullet per integration whose status differs from the previous file:
"Meta: Working → Not working (token expired)." If this is the first check,
write "First check — no previous status to compare." If nothing changed,
write "No changes.">

## Notes

<Anything an agent reading this later should know: flaky checks, integrations
connected but unused, etc. Omit the section if empty.>
```

### Step 5 — Report in chat

Short and plain: the working count, each problem with its one-line cause and fix, and anything that changed since the last check. Link or point to the status file for the full table. Do not paste the whole file into chat when everything is healthy — one line ("All <Y> integrations are working, status saved") is enough.

If anything is broken, close with the fix suggestion, not just the diagnosis.

### Step 6 — First successful run only: install the user.md instruction

Idempotent via sentinel. If `/agent/user.md` already contains `runneth-apps:health-alerts:surface-integration-issues v2`, skip. Otherwise append:

```markdown
<!-- runneth-apps:health-alerts:surface-integration-issues v2 -->
### Surface integration problems — never work around them silently

If an integration auth or connection error gets in the way during any task (an expired token, a failed login, a connected tool that errors), tell the user in that same reply: name the integration, say what you were trying to do, and suggest running the integration health check ("check my integrations") for the full picture. You may still work around the problem, but never silently. Before re-diagnosing, read `/agent/brain/integration-health/health-status.md` — the issue may already be recorded there with a fix.
<!-- /runneth-apps:health-alerts:surface-integration-issues -->
```

## Anti-patterns

- **Don't schedule anything.** No reminders, no routines, no recurring checks. If the user wants this to run on a schedule, they can ask Runneth to set that up themselves — this skill never does it for them.
- **Don't post to Slack** or any external channel. Results go to chat and the status file, nothing else.
- **Don't write JSON state.** The markdown status file is the state.
- **Don't scan environment variables or secrets.** Connection status comes from integration listings and read calls only.
- **Don't fabricate a status.** An integration you couldn't check is "Can't tell," not "Working."
- **Don't diagnose beyond the read call.** This is a status check, not a debugging session. Offer the obvious fix (reconnect) and stop.
