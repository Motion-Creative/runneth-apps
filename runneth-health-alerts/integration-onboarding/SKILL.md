---
name: integration-onboarding-patch
description: |
  Adds Step 8b to the integration-onboarding skill. This step fires after every
  integration connection and notifies the admin of integration health monitoring.
  
  If an admin channel is already configured: tells them where alerts will go (Path 1).
  If no admin channel is configured: starts the setup flow (Path 2).
  
  This file documents the patch to apply to the existing integration-onboarding skill.
  Add Step 8b immediately before the existing "Step 8 — Hand off to integration-activation" section.
patch-target: /agent/.agents/skills/integration-onboarding/SKILL.md
patch-position: "before Step 8 — Hand off to integration-activation"
---

## Step 8b — Admin channel notification

After the customer-facing summary is delivered, check admin channel configuration and notify about integration health monitoring.

**Read admin channel config:**
```bash
cat /agent/brain/admin/config.json 2>/dev/null || cat /agent/brain/permissions/config.json 2>/dev/null
cat /agent/brain/integration-health/health-config.json
```
Resolve admin config path: use `/agent/brain/admin/config.json` if it exists (v2.1), otherwise `/agent/brain/permissions/config.json` (v2.0).

Resolve alert channel: `alert_channel_override` from health-config.json if set, else `admin_slack_channel` from whichever admin config exists (v2.1: /agent/brain/admin/config.json, v2.0 fallback: /agent/brain/permissions/config.json).

**Check that the health check routine is active:**
```bash
reminder list
```
If no "Integration health check" reminder found, create it:
```
reminder add --name "Integration health check" --cron "*/{{CHECK_INTERVAL_MINUTES}} * * * *" --timezone "{{TIMEZONE}}" --content "Run the integration-health-check skill at /agent/.agents/skills/integration-health-check/SKILL.md. Read every integration in /agent/brain/org/integrations/connected-integrations.json where health_monitored=true. Run all health checks. Write results to /agent/brain/integration-health/health-state.json. Send Slack alerts per the alert logic in the skill. Silent run — no user-visible output unless alerting."
```

**Update connected-integrations.json:**
Ensure the newly connected integration has `health_monitored: true` if a health check exists for its type (motion, github, slack, notion, linear, dropbox, openai, launchdarkly). Update the registry entry.

**Path 1 — Admin channel already configured:**

Append to the visible response:
```
**Integration health monitoring is active.**
I'll monitor this integration and alert you in *#<channel-name>* if it becomes degraded or broken — so you know before it starts blocking your routines. No setup needed.
```

**Path 2 — No admin channel configured:**

Append to the visible response:
```
**Integration health monitoring needs one more step.**
I'll monitor this integration and alert you in Slack if it becomes degraded or broken — so you know before it starts blocking your routines. To do that, I need to know where to send those alerts.

You don't have an admin channel set up yet. This is where Runneth routes integration health alerts, routine failure notifications, and any org-change requests from your team.
```

Then run `slack memberships list` and present options:
```
I'm currently in: *#<channel1>*, *#<channel2>*. Which of these should be your admin channel? Or create a new one in Slack, invite Runneth, and share the name.
```

Wait for confirmation. Once confirmed:
1. Resolve channel ID
2. Edit the resolved admin config path: set `admin_slack_channel` to confirmed channel ID
3. Post hello to channel:
   ```
   slack send --channel <channelId> --text "👋 This is now your Runneth admin channel. Here's what will come through here:
   • Integration alerts when something is degraded, broken, or blocking a routine
   • Routine failure notifications
   • Org-change requests from your team that need admin approval

   Reply to any alert with \"fix <integration>\" and I'll walk you through it."
   ```
4. Reply in chat: "Done — **#<channel-name>** is your admin channel. Integration health alerts will go there going forward."
