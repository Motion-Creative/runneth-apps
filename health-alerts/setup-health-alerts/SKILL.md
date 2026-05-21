---
triggers:
  phrases:
    - "set up health alerts"
    - "set up health alerts"
    - "configure health alerts"
    - "set up admin channel"
    - "reconfigure runneth health"
    - "personalize health alerts"
    - "set up routine health"
    - "set up integration health alerts"
  intent: "User wants to configure or re-configure Health alerts for their sandbox"
  context: "health-alerts use case is installed"
---

# Setup: health-alerts

Walks an admin through setting up Health alerts. One question at a time. Ends with a working setup, the health check running, and the admin knowing exactly what Runneth is watching.

Runs automatically as the final post-install step. Can be re-invoked any time.

---

## Before starting

**Check Slack is connected first:**
```bash
slack doctor 2>/dev/null
```
If Slack is not connected (`lifecycle.state !== "connected"`), stop immediately and say:
> "Health alerts need Slack to send you messages. Connect Slack first, then come back to finish setup."
Do not proceed past this point until Slack is confirmed connected.

Read current state:
```bash
cat /agent/brain/integration-health/health-config.json
cat /agent/brain/admin/config.json 2>/dev/null || cat /agent/brain/permissions/config.json 2>/dev/null
slack memberships list
```

Resolve admin config path: use `/agent/brain/admin/config.json` if it exists (v2.1), otherwise `/agent/brain/permissions/config.json` (v2.0). All writes go to whichever path was found.

Skip questions whose answers are already set unless the user is explicitly reconfiguring.

---

## Step 0 — Check for integration registry

```bash
cat /agent/brain/org/integrations/connected-integrations.json 2>/dev/null
```

If file does not exist: create it as an empty stub and continue to Step 0b.
If file exists with no `health_monitored: true` entries: continue to Step 0b.
If file exists with valid entries: skip Step 0b.

---

## Step 0b — Discover already-connected tools

Run silently before saying anything. Discover what is already connected:

**Connected apps (OAuth):**
```bash
integrations list
```

**Native connections:**
```bash
google doctor 2>/dev/null
slack doctor 2>/dev/null
notion doctor 2>/dev/null
```
Connected if doctor returns a connected/healthy state.

**API keys (presence = connected):**
Check which runtime secrets exist: LINEAR_TOKEN, OPENAI_API_KEY, LAUNCHDARKLY_TOKEN, GITHUB_TOKEN, DROPBOX_TOKEN, HUBSPOT_TOKEN, INTERCOM_TOKEN, GONG_TOKEN, META_ACCESS_TOKEN, TWITTER_TOKEN, CHARTMOGUL_TOKEN, ANTHROPIC_API_KEY, NEON_API_KEY.

**Prior onboarding:**
```bash
ls /agent/brain/org/integrations/ 2>/dev/null
ls /agent/brain/integrations/ 2>/dev/null
```
Any subdirectory with a `capabilities-and-scopes.md` = previously onboarded.

**Register everything found:**
- `health_monitored: true` for known types: motion, github, slack, notion, linear, dropbox, openai, launchdarkly
- `health_monitored: false` for unknown types (registered but not yet checkable)
- Write to `/agent/brain/org/integrations/connected-integrations.json`

**Detect immediate issues:**
After discovery, check each connected tool for obvious problems — expired tokens, failed doctor calls, 0 results on basic API checks. Flag only issues that need the admin's attention right now, with a clear action.

**What to say:**
Lead with what Runneth is now doing, not a list of what it found. Only surface a tool if something is immediately off and there is a specific action to take.

Example when everything looks healthy:
```
I'm keeping an eye on your connected tools, automated routines, and scheduled reminders —
and I'll flag anything that looks off. Let's finish setting up your alert channel.
```

Example when an issue is detected:
```
I'm keeping an eye on your connected tools, automated routines, and scheduled reminders.
One thing to sort out before we finish: your HubSpot connection looks like it needs
a broader API key to be fully monitored. I can walk you through updating it now —
want to do that before we continue, or come back to it later?
```

Do not list healthy tools. Do not list tools with `health_monitored: false` unless they have an immediate fixable issue.

---

## Question 1 — Alert channel

**Ask:**
> "Where should I send alerts? This is where I'll post if a connected tool stops working, a scheduled task goes off track, or something on your team needs admin attention."

Show channels Runneth is already in:
> "I'm currently in: [list channel names]. Which one should get these alerts? Or create a new channel, invite Runneth, and share the name."

**On answer:**
- Resolve channel ID
- Write `admin_slack_channel` to resolved admin config path
- Post to the channel:
  ```
  slack send --channel <channelId> --text "👋 I'll use this channel to flag anything that needs your attention — connected tools having issues, scheduled tasks going off track, or requests from your team waiting for approval.

  When you see an alert, just reply to it and I'll help sort it out. Two things you can say:
  • Reply \"fix\" to get step-by-step help resolving the issue
  • Reply \"stop\" to cancel a scheduled task"
  ```
- Confirm in chat: "Done — **#<channel-name>** is your alert channel."

---

## Question 1b — Who to tag

Immediately after channel is confirmed, resolve who gets tagged in alerts.

```bash
cat /agent/brain/admin/workspace-map.json 2>/dev/null || cat /agent/brain/permissions/workspace-map.json 2>/dev/null
```

**If admins found (scope: "admin" entries exist):**
Tell them, don't ask:
> "Your admins are [Name1] and [Name2] — I'll tag them in alerts. Make sure they're in #<channel-name> so they see them. Want to change who gets tagged?"

Wait for response. If they confirm or don't respond, save as-is. If they adjust, update to their answer.

**If no admins found:**
> "Who should I tag in #<channel-name> for alerts? Share their Slack ID or @handle."
Save response as `admin_slack_ids`.

**Always store as array:** `admin_slack_ids: ["U...", "U..."]` to support multiple admins. Write to resolved admin config path.

---

## Question 2 — Timezone

> "What timezone should I use for your scheduled checks? Examples: `America/New_York`, `Europe/London`, `Asia/Tokyo`."

Save as `timezone` in health-config.json. Default to `UTC` if unsure.

---

## Question 3 — Silence window

> "If something is still broken after the first alert, how long should I wait before sending a follow-up? Default is 24 hours."

Validate 1–168 hours. Save as `silence_hours` in health-config.json. Default 24.

---

## Question 4 — GitHub repo (optional)

Only ask if GitHub is in registry with `health_monitored: true`:
> "For your GitHub connection, do you want me to verify I can access a specific project? If yes, share the project name in `owner/project-name` format. If you're not sure, skip this — I'll still check that GitHub is connected and your access hasn't expired."

**If they provide a value:** save as `github_repo` in health-config.json.
**If they skip:** set `github_repo: null` and say: "No problem — I'll still check that GitHub is connected and your credentials are valid, just not whether I can access a specific project."

---

## Question 5 — Conversation scan (opt-in, default off)

> "One more option: I can scan your team's conversations once a day to catch any scheduled tasks that were requested but never set up. For example, if someone said 'remind me every Monday to review performance' and I didn't create it, I'd flag it and offer to fix it. Want to turn this on?"

**If yes:** save `intent_scan_enabled: true` in health-config.json. Continue.
**If no or skip:** save `intent_scan_enabled: false`. Note in closing summary: "Conversation scanning is off. Say 'turn on conversation scan' anytime to enable it."

---

## Step 5 — Skill audit (silent)

Run this silently without asking the admin anything.

```bash
ls /agent/.agents/skills/
```

For each skill, check if SKILL.md contains `routine-executions` or `last-run.json`.
For skills missing it: automatically add the execution record write step as the final step.
Update silently. No interruption to the setup flow.

Note count of updated skills for the closing summary only.

---

## After questions — Start the routine and confirm it works

```bash
reminder list
```

If no "Integration health check" reminder found:
```bash
reminder add \
  --name "Integration health check" \
  --cron "*/30 * * * *" \
  --timezone "{{TIMEZONE}}" \
  --content "Run the integration-health-check skill at /agent/.agents/skills/integration-health-check/SKILL.md. Check all connected tools and all active routines. Write results to /agent/brain/integration-health/health-state.json and /agent/brain/integration-health/routine-health-state.json. Send Slack alerts per the alert logic in the skill. Silent run — no user-visible output unless alerting."
```

**Verify creation succeeded:**
```bash
reminder list
```
Confirm the new shortId appears in the list. If not found, try creating again once. If still missing, tell the admin: "I had trouble starting the check routine — reply 'set up health alerts' to try again."

If successful: note shortId. Update `_meta.routineShortId` in health-state.json.

**Run an immediate health check:**
After the routine is confirmed active, run the integration-health-check skill immediately:
- Check all connected tools and active routines
- Write results to health-state.json and routine-health-state.json
- Post a status summary to the admin channel:
  ```
  slack send --channel <channelId> --text "✅ Health Alerts is live. Here's your current status:

  Connected tools: <N healthy> / <N total>
  Active routines: <N running> / <N total>

  <list any issues found, or: Everything looks good right now.>

  I'll check in every 30 minutes and post here if anything needs your attention."
  ```
This is the admin's first confirmation that everything is working.

---

## Closing summary

```
✅ You're all set.

Alerts go to #<channel-name> and tag <admin names>.
I'll check every 30 minutes and send one alert when something needs attention,
with a follow-up after <silence_hours> hours if it's still not resolved.

<If N skills were silently updated for completion tracking>:
I also updated <N> of your scheduled tasks to report back when they finish —
now I can alert you if something runs but doesn't complete correctly.

Check your alert channel for your current status.
```

---

## Skill Changelog

| Date | Change |
|---|---|
| 2026-05-21 | v2.0 — Full plain-language rewrite. Routines-first framing. Step 0b only surfaces actionable issues, not full integration list. Question 1b simplified to tell-not-ask for known admins. Skill audit uses non-technical language. |
| 2026-05-20 | v1.1 — Added Step 0b (backfill) and Question 1b (admin tagging as array). |
| 2026-05-20 | v1.0 — Initial version. |
