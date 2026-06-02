---
name: setup-usage-efficiency-audit
description: |
  One-time setup for usage-efficiency-audit. Captures the Slack channel for delivery, optional user tags, and the org's billing anniversary day so the watcher knows when each monthly cycle starts. Runs automatically after install and can be re-invoked any time with "set up usage-efficiency-audit", "reconfigure usage-efficiency-audit", or "personalize usage-efficiency-audit".

triggers:
  phrases:
    - "set up usage-efficiency-audit"
    - "configure usage-efficiency-audit"
    - "reconfigure usage-efficiency-audit"
    - "personalize usage-efficiency-audit"
    - "set up the usage audit"
  intent: "User wants to configure or re-configure usage-efficiency-audit for their workspace"
  excludes:
    - "run usage-efficiency-audit"
    - "what's my usage"
---

# Setup — usage-efficiency-audit

Three personalization points. One question at a time. Write each answer immediately after it's given. Confirm at the end.

---

## Step 1 — Resolve workspace and org

Default to the workspace from Motion context. If the user named a different workspace in the same turn, use that instead.

Derive a readable slug: lowercase, hyphens for spaces, strip special chars. Store as `WORKSPACE_SLUG`.

Capture the `organizationId` from `motion workspaces` if not already in context. Store as `ORG_ID`.

Open with one sentence:

> Setting up the usage efficiency audit for `<workspace name>`. Three quick questions and we're done.

---

## Step 2 — Slack channel (required)

> Which Slack channel should I post the audit to when usage hits 80%? Drop a channel ID (`C0XXX`) or name (`#channel-name`), I'll resolve the name.

**Rules:**
- DMs are not a delivery target. If the user names a DM or person, explain channels-only and re-ask.
- Validate the channel ID against Slack membership. If Runneth is not in the channel, surface that and ask the user to invite it before proceeding.
- Single channel only for v1. If they name multiple, take the first and note the others as future config.

**Write to** `slackChannelId` in the config file.

---

## Step 3 — User tags (optional)

> Anyone I should tag in the post? Optional — drop one or more Slack user IDs or @-handles, or say "skip".

Accept zero, one, or many. Tags get inserted at the start of the parent message.

**Write to** `slackUserTags` (array, can be empty).

---

## Step 4 — Billing anniversary day (required)

> What day of the month does this customer's Runneth billing cycle reset? Just the day number, 1 through 31.

**Rules:**
- Accept 1 through 31.
- For 29, 30, and 31, the audit automatically falls back to the last day of any month that doesn't have that day (e.g. February falls back to the 28th or 29th in leap years). This is how Stripe handles it, so the cycle stays aligned with their real billing.
- If they don't know, suggest checking Stripe or HubSpot for the subscription start date — the day-of-month from that is the answer.

**Write to** `billingAnniversaryDay` (integer 1-31).

---

## Step 5 — Write config

Write to `/agent/brain/usage-efficiency/<WORKSPACE_SLUG>.json`:

```json
{
  "workspaceSlug": "<WORKSPACE_SLUG>",
  "organizationId": "<ORG_ID>",
  "billingAnniversaryDay": 14,
  "slackChannelId": "C0XXXXXX",
  "slackUserTags": ["U0YYYYYY"],
  "includedLimitUsd": 100.00,
  "thresholdPercent": 80,
  "upgradeMultiplier": 3,
  "lastNotifiedCycleStart": null,
  "configuredAt": "<ISO timestamp>"
}
```

**Notes for the agent writing this config:**
- `includedLimitUsd`, `thresholdPercent`, and `upgradeMultiplier` are internal-only constants. They live here so they're easy to change later, but they are never surfaced in customer-facing copy. The customer only ever sees percentage of plan used and "3x your usage."
- `lastNotifiedCycleStart` stays null until the first notification fires.

---

## Step 6 — Schedule the watcher

Create a daily reminder that runs the main audit skill. The skill itself decides whether to act on any given day.

```bash
reminder add \
  --title "Run usage-efficiency-audit watcher" \
  --schedule "every day at 09:00" \
  --instruction "Run the usage-efficiency-audit skill for workspace <WORKSPACE_SLUG>. The skill will check whether the org has crossed the threshold and only deliver an audit if it has."
```

Capture the reminder short ID. Save it to the config file as `watcherReminderId` so reconfigure can find and update it.

---

## Step 7 — Confirm

> Locked in for `<workspace name>`:
> - Audit posts to: `<channel>`
> - Tagging: `<users or "none">`
> - Billing cycle resets on day `<N>` of each month
> - Watcher scheduled daily at 09:00 `<timezone>`
>
> You can re-run "set up usage-efficiency-audit" any time to change these. Want me to do a dry-run now so you can see what the post would look like?

---

## Re-invocation behavior

When invoked on an already-configured workspace:
1. Read existing config and show the current values.
2. Ask which fields the user wants to change. Update only those.
3. If the channel or schedule changed, update the reminder.
4. Preserve `lastNotifiedCycleStart` across reconfigures so a mid-cycle change doesn't cause a re-notify.

---

## Error handling

| Condition | Response |
|-----------|----------|
| Slack channel not joined by Runneth | Ask user to invite Runneth, retry |
| Workspace can't be resolved | Ask user to name the workspace |
| Reminder system unavailable | Save config anyway, note that scheduling failed and the watcher needs to be added manually |
| Existing config corrupt | Show the user, ask whether to start fresh |
