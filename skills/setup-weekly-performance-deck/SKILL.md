---
name: setup-weekly-performance-deck
description: Conversational onboarding for the weekly creative performance deck. Designed for cold-start customers — does not require a paid-strategy brief, brand audit, or brand kit to exist beforehand. Captures who reads the report and how technical they are, what defines success for the account, any standing questions the team always wants answered, and where the Monday TL;DR plus link should land. Saves config to /agent/brain/runneth-onboarding/weekly-deck/_config/<workspace-slug>.json and schedules the recurring run. Triggers on first invocation of "build me a weekly performance deck", "create me a weekly performance deck", "set up the weekly deck", "configure the weekly deck", "reconfigure the weekly deck", "weekly creative report setup", "make me a weekly creative report". Hands off to the weekly-performance-deck skill (the run skill) for every weekly delivery.
---

# Setup — Weekly Performance Deck

You are running first-time setup for the workspace's weekly creative performance deck. This skill is designed for the realistic cold start: the workspace has ad data, but no strategy brief, no brand audit, no brand kit, and no prior weekly deck. Your job is to gather everything the run skill needs from the conversation itself.

Three-turn maximum in the common path. Configure once, run weekly.

---

## Core principle

**Read what's connected, ask for the rest.** The only hard prerequisite is a connected ad platform (Meta or TikTok). Everything else — funnel definitions, success metrics, audience, standing questions, delivery — is gathered in the setup conversation itself. Do not block on missing brand-audit, paid-strategy-audit, or brand-kit. They are upgrades, not gates.

**One bundled ask, not a form.** Read the workspace context first. Ask the remaining questions in a single message. Parse generously, follow up once at most.

**Save, schedule, hand off.** This skill saves config and schedules a recurring reminder. The deck itself is produced by the separate `weekly-performance-deck` run skill.

---

## What this produces

1. Config file at `/agent/brain/runneth-onboarding/weekly-deck/_config/<workspace-slug>.json`.
2. Recurring reminder for the weekly run (default Monday 9am in the workspace timezone).
3. Confirmation message with config summary plus an offer to run a pilot deck now.
4. INDEX entry pointing at the saved config.

---

## Silent Turn 0 reads

Before any user-facing message, read these in order. Do not narrate the reads.

1. **Workspace context.** Workspace id, slug, name, timezone from Motion context.
2. **Existing config.** `/agent/brain/runneth-onboarding/weekly-deck/_config/<workspace-slug>.json`. If present, jump to Branch B (reconfigure).
3. **Connected ad platforms.** Check what's connected to this workspace. Capture: Meta connected? TikTok connected? If neither is connected, jump to Branch A.
4. **Workspace goal.** Run `motion workspace-goal`. If a KPI is set, use it as the success metric default and skip the success-metric question in Turn 1.
5. **Optional enhancements present.** Note for the confirmation message:
   - Brand kit at `/agent/brain/brand-kit/<workspace-slug>--brand-kit.md` or `/agent/brain/brand-kits/<workspace-slug>/`
   - Brand audit at `/agent/brain/brand-audit/<workspace-slug>/`
   - Paid strategy briefs under `/agent/brain/paid-strategy/<channel>/<workspace-slug>/`
   These are informational only — never blockers.
6. **Slack connection.** Check whether Slack is connected for this org. If not, the delivery question changes shape.

After all six reads, choose the branch.

---

## Branch A — No ad platform connected (hard stop)

The deck has no data spine without Meta or TikTok.

Send one message:

> Before I build the deck, I need at least one ad platform connected so I have something to pull each week. Want to connect Meta or TikTok now? Once it's connected I'll pick setup back up right where we left off.

Hand off to the integration connect flow. After connection, re-run Turn 0 and proceed to Branch C.

Do not offer alternatives. Do not list three options. This is the only correct response when no ad platform is connected.

---

## Branch B — Existing config found (reconfigure)

Send one message that reads the current config back and asks what to change:

> You already have a weekly deck configured for {workspace-name}:
>
> - **Delivery:** {channel} every {day} at {time}, pings {owner}
> - **Audience:** {audience summary}
> - **Success metric:** {metric}
> - **Standing questions:** {list or "none"}
>
> What do you want to change?

Update only the fields the user changes. Save. Confirm. Done.

If they say "rebuild from scratch" or "start over", delete the existing config and jump to Branch C.

---

## Branch C — Fresh setup (the common path)

Three turns.

### Turn 1 — Scope confirmation plus bundled questions

State what was found, adapt the question count to what's already known, send one message. Template:

> I can build this. Here's the setup for **{workspace-name}**:
>
> - **Ad platforms:** {Meta and/or TikTok}
> - **Slack:** {connected | not connected — see question 4}
> - **Success metric default:** {pulled from workspace-goal if set, otherwise "I'll ask below"}
>
> {Four or three} things before I scaffold:
>
> 1. **Audience.** Who reads this every week? Just you, or a wider team? How technical are they — comfortable with CPA / ROAS / thumbstop, or do you want metrics defined in plain English?
> 2. **Success metric.** What does "working" mean for this account? ROAS, CPA, purchase volume, MER, something else? *(Drop this question entirely if workspace-goal was set in Turn 0 — say "Using your saved goal of {metric}, say if you want a different one for the deck.")*
> 3. **Standing questions.** The deck always covers what's working, what got killed, and what to test next. Beyond that, anything the team always wants answered? Examples: creator-by-creator performance, landing page split, geo cuts, hook tactic mix, fatigue watch.
> 4. **Delivery.** Which Slack channel should get the Monday 9am TL;DR plus link, and who gets pinged as the owner? Default is Monday 9am in the workspace timezone — say if you want a different cadence.

If Slack is not connected, replace question 4 with:

> 4. **Delivery.** Slack isn't connected yet. Want to connect it now (recommended for the Monday ping)? Or land the deck link somewhere else for now (email, Notion page) and we'll add Slack later?

Wait for reply. Do not stack additional questions in the same turn.

### Turn 2 — Parse, confirm, save, surface upgrades, offer pilot

Parse the reply into the config schema. If something is genuinely ambiguous, ask **one** short follow-up — do not stack three more.

Once the config is unambiguous, read it back tight and surface the optional upgrades at the same time:

> Got it. Saving:
>
> - **Audience:** {summary}
> - **Success metric:** {metric}
> - **Standing questions:** {list, or "just the defaults"}
> - **Delivery:** {day} {time} {tz}, #{channel}, ping @{owner}
>
> Two optional upgrades you don't have yet that would make the deck sharper over time:
>
> - **Brand audit** — gives the deck a real read on your brand voice, persona, and competitive landscape so the "what's working" framing gets specific.
> - **Paid strategy brief** — gives the deck a funnel frame so "working" gets graded against your account's actual structure (TOF/MOF/BOF, scaling vs testing budgets).
>
> Not blocking either. Want me to queue them for after the first deck ships? Either way — want a pilot run now, dated this Friday, so you can pressure-test the format before Monday's first real post?

Save the config file. Schedule the recurring reminder. Update `/agent/INDEX.md`.

### Turn 3 (optional) — Pilot run and upgrade queue

If they say yes to a pilot: invoke `weekly-performance-deck` immediately with a pilot flag and the Friday date.

If they say yes to upgrades: do not run them inside this skill. Save their intent in the config under `queuedUpgrades`, and acknowledge that you'll surface them after the first real deck ships.

If they say no to both: end cleanly.

> All set. First deck lands {day} at {time}.

---

## Config file schema

Save to `/agent/brain/runneth-onboarding/weekly-deck/_config/<workspace-slug>.json`:

```json
{
  "workspaceId": "<id>",
  "workspaceSlug": "<slug>",
  "workspaceName": "<name>",
  "createdAt": "<ISO-8601>",
  "updatedAt": "<ISO-8601>",
  "audience": {
    "stakeholders": ["<name or role>"],
    "technicalLevel": "expert | mixed | plain-english"
  },
  "successMetric": {
    "primary": "roas | cpa | purchase_volume | mer | <other>",
    "source": "workspace-goal | user-specified",
    "secondary": ["<optional list>"]
  },
  "standingQuestions": ["<freeform sentence>"],
  "delivery": {
    "channel": "slack | email | notion",
    "slackChannelId": "<C0XXXXXX or null>",
    "slackChannelName": "#<name or null>",
    "ownerSlackUserId": "<U0XXXXXX or null>",
    "ownerName": "<name>",
    "dayOfWeek": "monday",
    "timeOfDay": "09:00",
    "timezone": "<IANA tz>"
  },
  "channels": ["meta", "tiktok"],
  "presentEnhancements": {
    "brandKit": false,
    "brandAudit": false,
    "paidStrategyAudit": false
  },
  "queuedUpgrades": ["brand-audit", "paid-strategy-audit"],
  "reminderId": "<reminder id from reminder add>"
}
```

The run skill reads this file every week. Keep the schema stable.

---

## Parsing rules

People answer in any order with any level of detail. Be generous.

- **Audience.** Solo → `technicalLevel = expert`, `stakeholders = [their name]`. "Team" without specifics → `mixed` and ask one short clarification about who. "Execs" or "leadership" → `plain-english`. "Whole company" → `mixed`.
- **Success metric.** Common phrasings: "ROAS" → `roas`. "CPA" or "cost per purchase" or "cost per acquisition" → `cpa`. "Volume" / "purchases" / "conversions" → `purchase_volume`. "Blended" or "MER" → `mer`. If vague ("the usual", "performance"), default to `roas` and flag in the confirmation. If they name a metric you don't recognize, save the string and ask once.
- **Standing questions.** Capture verbatim. "None, just the defaults" → empty array, valid answer.
- **Delivery.** If they name a channel by name, resolve the channel id via Slack search before saving. If not found, ask once with the closest match suggestion. If they say "ping me", resolve their own Slack user id. If no time specified, default to Monday 9am in the workspace timezone.

If two of four answers are clear and one is ambiguous, save what you have and ask only about the ambiguous one. Never re-ask about something they already answered.

---

## Scheduling the reminder

After saving the config, schedule the recurring run:

```
reminder add \
  --instructions "Run weekly-performance-deck for workspace <slug>. Read config from /agent/brain/runneth-onboarding/weekly-deck/_config/<slug>.json. Post TL;DR and link to #<channel>, ping @<owner>." \
  --cron "0 9 * * MON" \
  --tz "<workspace-timezone>"
```

Capture the returned reminder id and write it back into the config under `reminderId`. If the user reconfigures later, update or recreate the reminder.

---

## INDEX update

After saving the config, append or update an entry in `/agent/INDEX.md`:

```
| /agent/brain/runneth-onboarding/weekly-deck/_config/<slug>.json | weekly deck config <name>, weekly performance deck setup, monday deck routine | Saved config for the weekly performance deck for <workspace-name>. Audience, success metric, standing questions, delivery, queued upgrades, reminder id. Read by weekly-performance-deck on every run. | config | <created-date> | <updated-date> |
```

---

## Re-invocation behavior

If the user re-triggers any of the setup phrases after setup is complete, **do not re-run setup**. Detect the existing config in Turn 0 and invoke `weekly-performance-deck` directly with an on-demand flag. Only re-run setup if the user explicitly says "reconfigure", "change settings", "redo the setup", or similar.

---

## Failure handling

- **Slack channel not found.** Ask once with the closest match suggestion. If still unresolved, save the channel name as a string and flag in the confirmation: "I couldn't resolve the channel id. The first run will ask again."
- **Owner user not found.** Same pattern — ask once, fall back to the user's own id.
- **Reminder add fails.** Save the config anyway, tell the user the schedule did not register, and offer to retry on the next turn.
- **Config write fails.** Stop. Tell the user what failed in one sentence and ask whether to retry.

Never claim a save or schedule that did not actually happen.
