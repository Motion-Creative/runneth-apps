---
name: setup-paid-strategy-audit
description: One-time setup for paid-strategy-audit. Asks the user where Runneth should post the Friday drift-check pings, which users (if any) to tag inside those posts, and which campaigns to exclude from efficiency math. Runs automatically after install and can be re-invoked any time with "set up paid-strategy-audit", "reconfigure paid-strategy-audit", or "personalize paid-strategy-audit".
---

# Setup — paid-strategy-audit

Three personalization points. One question at a time. Write each answer immediately after it's given. Confirm at the end.

---

## Trigger

```yaml
triggers:
  phrases:
    - "set up paid-strategy-audit"
    - "personalize paid-strategy-audit"
    - "reconfigure paid-strategy-audit"
  intent: "User wants to configure or re-configure paid-strategy-audit for their workspace"
```

Also runs automatically as the final post-install step from `install-config.json`.

---

## Execution

### Step 1 — Resolve workspace

Default to the Motion context's workspace. If the user named a different one in the same turn, use that. Confirm the workspace name in the first message: "Setting up paid-strategy-audit for `<workspace name>`. Three quick questions."

### Step 2 — Ping channels (required)

> Which Slack channel(s) should I ping when the strategy drifts? Drop one or more channel IDs (e.g. `C0XXX`) or names (`#channel-name`) — I'll resolve names to IDs.

**Rules:**
- DMs are not a delivery target. If the user names a DM or a person, explain channels-only and re-ask.
- Multiple channels are supported. Accept a comma-separated list or multiple values.
- Validate each channel ID against Slack membership. If Runneth isn't in the channel, surface that and ask the user to invite it before proceeding (or accept the answer with a note that the first drift run will fail silently until membership is fixed).

**Write to:** `/agent/brain/paid-strategy/_config/<workspace-slug>.json` → `ping_channels: ["C0XXX", "C0YYY"]`

### Step 3 — User tags (optional)

> Anyone I should tag inside the drift posts? Optional. If yes, drop one or more Slack user IDs (e.g. `U0ZZZ`) or @-handles.

**Rules:**
- Accept zero, one, or many.
- Tags are inserted inline at the start of each drift post.

**Write to:** `ping_user_tags: ["U0ZZZ"]` in the same config file.

### Step 4 — Excluded campaigns (optional)

> Any campaigns I should always exclude from efficiency math? These are campaigns that would distort averages — single-creative test pots, brand-awareness pushes that shouldn't be graded on conversion KPIs, anything else you treat as non-commercial. Default is none — the audit infers exclusions from naming and behavior. Override if you have specific ones to call out.

**Rules:**
- Accept campaign IDs, exact campaign names, or name patterns (e.g. `*NoOpt*`).
- Default to empty if the user says "none" or skips.

**Write to:** `excluded_campaigns: [...]` in the same config file. The main audit reads this on every run and filters efficiency math accordingly.

### Step 5 — Confirm and schedule

Summarize back:

> Locked in for `<workspace name>`:
> - Drift posts go to: `<channels>`
> - Tagging: `<users or "none">`
> - Excluded campaigns: `<list or "none">`
> - Friday drift check scheduled for 09:00 `<timezone>` (from `/agent/.runtime/timezone`)
>
> You can re-run "set up paid-strategy-audit" any time to change these.

Confirm the Friday reminder is in the reminder system. If it's not (first install), create it now per Step 9 of the main skill.

---

## Re-invocation behavior

When the trigger fires on a workspace that already has a config:

1. Read the current config.
2. Show what's currently set.
3. Ask which fields they want to change.
4. Only re-ask for the fields they name.
5. Write changes and confirm.

Do not blow away existing config silently. Always show the current state first.

---

## Anti-patterns

- **Don't ask all three questions at once.** One at a time. Each answer gets written before the next question.
- **Don't accept a DM target.** Channels only — explain why and re-ask.
- **Don't skip channel-membership validation.** A configured ping channel that Runneth can't post to is silent failure waiting to happen.
- **Don't write excluded-campaign patterns as strings without normalizing.** Trim whitespace, lowercase the comparison key, support wildcard `*`.
