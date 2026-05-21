---
triggers:
  phrases:
    - "set up runneth health alerts"
    - "set up health alerts"
    - "configure health alerts"
    - "set up admin channel"
    - "reconfigure runneth health"
    - "personalize runneth health alerts"
    - "set up routine health"
    - "set up integration health alerts"
  intent: "User wants to configure or re-configure Runneth integration and routine health alerts"
  context: "runneth-health-alerts use case is installed"
---

# Setup: runneth-health-alerts

Walks a new org through configuring integration health alerts. One question at a time. Ends with a confirmed working setup and the health check routine running.

This skill also runs automatically as the final step of installing the integration-health-alerts use case.

It can be re-invoked any time to update settings.

---

## Before starting

Read the current state:
```bash
cat /agent/brain/integration-health/health-config.json
cat /agent/brain/admin/config.json 2>/dev/null || cat /agent/brain/permissions/config.json 2>/dev/null
slack memberships list
```

Resolve admin config path: use `/agent/brain/admin/config.json` if it exists (v2.1 permission system), otherwise `/agent/brain/permissions/config.json` (v2.0). All writes go to whichever path was found.

Load what is already configured. Skip questions whose answers are already set unless the user is explicitly reconfiguring.

---

## Step 0 — Check for connected-integrations registry

Before any questions, check whether the integration registry exists:

```bash
cat /agent/brain/org/integrations/connected-integrations.json 2>/dev/null
```

If the file does not exist:
1. Create it with a minimal starter structure:
   ```json
   {
     "_meta": { "note": "Canonical registry of connected integrations. Updated by integration-onboarding skill on each new connection.", "last_updated": "<today>" },
     "integrations": {}
   }
   ```
   Write to `/agent/brain/org/integrations/connected-integrations.json`.
2. Tell the user: "I created the integration registry. To populate it, connect your integrations via the integration-onboarding flow — they'll be registered automatically. For now, health monitoring will start as soon as integrations are added."

If the file exists but has no entries with `health_monitored: true`: note this in the closing summary — health checks will run but find nothing to check until integrations are registered.

If the file exists with valid entries: continue silently.

---

## Question 1 — Admin channel

**Ask:**
> "Where should I send integration health alerts? This is your admin channel — the place Runneth routes anything that needs your attention as an admin, including integration alerts, routine failures, and org-change requests from your team."

Show which channels Runneth is already in (from `slack memberships list`). Present them as options.

> "I'm currently in: [list channels]. Which of these should be your admin channel? Or create a new one in Slack, invite Runneth, and share the name."

**On answer:**
- Resolve channel ID (from memberships list if they named an existing channel; ask for ID if it's a new one)
- Edit the resolved admin config path (v2.1: `/agent/brain/admin/config.json`, v2.0: `/agent/brain/permissions/config.json`): set `admin_slack_channel` to the confirmed channel ID
- Post a hello message to the channel:
  ```
  slack send --channel <channelId> --text "👋 This is now your Runneth admin channel. Here's what will come through here:
  • Integration alerts when something is degraded, broken, or blocking a routine
  • Routine failure notifications
  • Org-change requests from your team that need admin approval

  Reply to any alert with \"fix <integration>\" and I'll walk you through it."
  ```
- Confirm in chat: "Done — **#<channel-name>** is your admin channel."

**Skip if:** `admin_slack_channel` is already set and user is not explicitly reconfiguring.

---

## Question 2 — Timezone

**Ask:**
> "What timezone should I use for the health check schedule? This controls when the 30-minute checks run. Examples: `America/New_York`, `America/Los_Angeles`, `Europe/London`, `Asia/Tokyo`."

**On answer:**
- Validate it's a recognizable IANA timezone string. If unsure, default to `UTC` and note it.
- Store in `/agent/brain/integration-health/health-config.json` under `timezone`
- Confirm: "Got it — health checks will run on <timezone> time."

**Default if skipped:** `UTC` (safe universal default).

---

## Question 3 — Silence window

**Ask:**
> "How often should I remind you about an unresolved integration issue? The default is every 24 hours — I'll alert you once when something breaks, then again after 24 hours if it's still not fixed. You can set this between 12 and 48 hours."

**On answer:**
- Validate: must be a number between 1 and 168. Suggest 24 if they're unsure.
- Edit `/agent/brain/integration-health/health-config.json`: set `silence_hours` to their answer
- Confirm: "Got it — I'll remind you every <N> hours for unresolved issues."

**Default if skipped:** 24 (already in the seed file).

---

## Question 4 — GitHub repo (optional)

**Ask only if GitHub is in the connected-integrations registry with `health_monitored: true`:**
> "For the GitHub health check, which repo should I use to verify your connection is working? This is just a test read — I'll check that your token can access it. Format: `owner/repo-name`."

**On answer:**
- Store in `/agent/brain/integration-health/health-config.json` under `github_repo`
- Confirm: "Got it — I'll use `<owner/repo>` for GitHub health checks."

**If skipped or no GitHub:** Note in health-config.json: `"github_repo": null`. The health check will run L1 and L2 only and skip L4/L5.

---

## Step 5 — Skill audit (retroactive execution record check)

After questions are answered, before starting the routine, audit all installed skills for execution record support.

```bash
ls /agent/.agents/skills/
```

For each skill directory found:
1. Read its SKILL.md
2. Check if it contains `routine-executions` or `last-run.json` (execution record support)
3. Build two lists: **has execution records** and **missing execution records**

Present the audit result:
```
Skill audit complete.
  ✓ Execution tracking: [skill-a], [skill-b], [skill-c]
  ✗ Missing tracking: [skill-d], [skill-e]

Want me to add execution tracking to the [N] skills missing it? This makes routine health monitoring accurate for those routines. (yes / skip)
```

If admin says yes (or any affirmative):
- For each skill missing execution records, add the execution record write step as the final step of the skill (same pattern as the inline fix in the health check skill Step B8).
- Confirm: "Updated [N] skills — execution tracking is now active across all installed skills."

If admin skips:
- Note in closing summary that those routines will show as `unverifiable` until updated.
- Admin can update individual skills later by replying "fix <skill name>" to any unverifiable alert.

---

## After all questions — Start the routine

Check if the health check routine is already running:
```bash
reminder list
```

If no "Integration health check" reminder found, create it:
```bash
reminder add \
  --name "Integration health check" \
  --cron "*/30 * * * *" \
  --timezone "{{TIMEZONE}}" \
  --content "Run the integration-health-check skill at /agent/.agents/skills/integration-health-check/SKILL.md. Read every integration in /agent/brain/org/integrations/connected-integrations.json where health_monitored=true. Run all health checks. Write results to /agent/brain/integration-health/health-state.json. Send Slack alerts per the alert logic in the skill. Silent run — no user-visible output unless alerting."
```

Note the shortId. Update `_meta.routineShortId` in health-state.json.

---

## Closing summary

Return:
```
✅ Integration + routine health alerts are set up.

• Admin channel: #<channel-name>
• Alert frequency: Every <silence_hours> hours for unresolved issues
• Check interval: Every <check_interval_minutes> minutes
• Routine: Active (shortId: <id>)
• Skills with execution tracking: <N> of <total>

I'll monitor all connected integrations and all active routines. I'll post in #<channel-name> when something needs your attention — integration failures, overdue routines, broken dependency chains, or execution failures.

For routines whose skills don't report execution status yet, reply "fix <skill name>" to any unverifiable alert and I'll add tracking on the spot.
```

---

## Skill Changelog

| Date | Change |
|---|---|
| 2026-05-20 | v1.0 — Initial version. Covers admin channel, silence window, GitHub repo, routine setup. |
