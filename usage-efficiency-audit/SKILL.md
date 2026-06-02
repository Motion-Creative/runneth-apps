---
name: usage-efficiency-audit
description: |
  Watcher + audit. Daily check on whether a workspace has crossed 80% of its included Runneth usage for the current billing cycle. When it has, runs a personalized efficiency audit on the org's actual conversation history, generates an openable HTML page with concrete recommendations, and posts a friendly heads-up to Slack with the link. Frames as a friend helping the team get more out of every conversation. Only fires once per cycle. Triggers on the daily watcher reminder, on "run usage-efficiency-audit", "check usage", "audit my usage", "am I close to my limit", or as a follow-up from setup.

triggers:
  phrases:
    - "run usage-efficiency-audit"
    - "check usage"
    - "audit my usage"
    - "usage efficiency audit"
    - "am I close to my limit"
    - "how am I tracking on usage"
  intent: "User wants to evaluate current cycle usage and/or produce the efficiency audit"
  excludes:
    - "set up usage-efficiency-audit"
    - "reconfigure usage-efficiency-audit"
---

# Usage Efficiency Audit

A friend-voice efficiency audit that fires once per billing cycle when a customer crosses 80% of their included Runneth usage. The audit is personalized to the team's actual conversation history and the customer never sees dollar amounts or internal pricing.

## Core principles

- **Friend voice, not scarcity.** Frame every recommendation as "here's how to get more out of each conversation," never "you're running out."
- **No dollars, ever.** The customer sees percentage of plan used, days until reset, and "3x your usage" if the upgrade nudge fires. They never see $100, $300, $500, or any cost figure. The audit body must not include cost numbers anywhere.
- **Real evidence.** Every recommendation cites the specific conversations it came from. Generic best-practice tips are weaker than "I noticed you re-explained your brand voice in three separate conversations."
- **One ping per cycle.** Once notified for a cycle, stay quiet until the next cycle starts.

---

## Phase 1 — Load config and compute current cycle

### 1a. Read config

Read `/agent/brain/usage-efficiency/<WORKSPACE_SLUG>.json`. If the file is missing, halt and invoke `setup-usage-efficiency-audit`:

> The usage audit isn't configured yet for this workspace. Let me set it up first.

Extract: `organizationId`, `billingAnniversaryDay`, `slackChannelId`, `slackUserTags`, `includedLimitUsd`, `thresholdPercent`, `upgradeMultiplier`, `lastNotifiedCycleStart`.

### 1b. Compute the current cycle window

Today's date is the reference. The cycle starts on the most recent `billingAnniversaryDay` that is on or before today.

```python
from datetime import date, timedelta
import calendar

today = date.today()
anchor_day = config["billingAnniversaryDay"]  # 1-28

if today.day >= anchor_day:
    cycle_start = today.replace(day=anchor_day)
else:
    # previous month
    prev_month = today.replace(day=1) - timedelta(days=1)
    cycle_start = prev_month.replace(day=anchor_day)

# Cycle end is the day before the next anniversary
if cycle_start.month == 12:
    cycle_end = cycle_start.replace(year=cycle_start.year + 1, month=1) - timedelta(days=1)
else:
    cycle_end = cycle_start.replace(month=cycle_start.month + 1) - timedelta(days=1)

reset_date = cycle_end + timedelta(days=1)
days_until_reset = (reset_date - today).days
```

Store as `CYCLE_START`, `CYCLE_END`, `RESET_DATE`, `DAYS_UNTIL_RESET`.

---

## Phase 2 — Pull cycle-to-date usage from local Postgres

The customer sandbox's local Postgres has every message with cost. We query that, not Motion's internal BQ.

```sql
SELECT 
  COALESCE(SUM(m.total_cost_usd), 0) AS cost_to_date,
  COUNT(DISTINCT c.id) AS conversation_count,
  COUNT(m.id) AS message_count,
  COUNT(DISTINCT c.user_email) AS active_users
FROM agent_message m
JOIN agent_conversation c ON c.id = m.conversation_id
WHERE c.organization_id = $1
  AND m.created_date >= $2  -- CYCLE_START
  AND m.created_date < $3;  -- RESET_DATE
```

Use `secret run --env NEON_DATABASE_URL=NEON_DATABASE_URL -- psql "$NEON_DATABASE_URL" ...` to execute.

Compute:
```
percent_used = (cost_to_date / includedLimitUsd) * 100
```

Round to nearest whole percent for customer display.

---

## Phase 3 — Decide whether to fire

Two gates:

**Gate 1 — Threshold.** If `percent_used < thresholdPercent`, exit silently. Log to a daily run log only.

**Gate 2 — Already notified this cycle.** If `lastNotifiedCycleStart == CYCLE_START.isoformat()`, exit silently — we already told them this cycle.

If both gates pass, continue to Phase 4.

**Manual invocation override.** When the user invokes the skill directly with phrases like "audit my usage" or "check usage," skip both gates and run the full audit regardless. They asked for it explicitly. Don't update `lastNotifiedCycleStart` in this case — manual runs don't count as the cycle notification.

---

## Phase 4 — Pull conversation content for pattern detection

Pull every conversation from the cycle window, with messages.

```sql
SELECT 
  c.id, c.title, c.user_email, c.created_date,
  m.sequence_number, m.role, m.parts->0->>'text' AS text, m.created_date AS message_date
FROM agent_conversation c
JOIN agent_message m ON m.conversation_id = c.id
WHERE c.organization_id = $1
  AND c.created_date >= $2
  AND c.created_date < $3
ORDER BY c.created_date, m.sequence_number;
```

Group by conversation. Each conversation becomes a record with id, title, user_email, created_date, and an ordered list of `{role, text}` turns.

Cap total content sent into pattern detection at roughly 200K tokens — sample the most recent conversations first, then by user diversity (ensure each active user is represented).

---

## Phase 5 — Pattern detection

Use Claude (via `ANTHROPIC_API_KEY`) to scan the conversations and surface efficiency patterns. The output is structured JSON.

### 5a. The detection prompt

Send Claude:
- The full conversation corpus from Phase 4
- A list of skills available in this workspace (from `ls /agent/.agents/skills/`)
- A list of routines configured (from `reminder list`)
- A list of durable knowledge files (from `/agent/INDEX.md` if present)

Ask it to return JSON with detected patterns in these categories:

```json
{
  "patterns": [
    {
      "category": "repeated_context",
      "title": "You re-introduced your brand voice across multiple conversations",
      "evidence": [
        {"conversation_id": "...", "title": "...", "snippet": "..."},
        {"conversation_id": "...", "title": "...", "snippet": "..."}
      ],
      "estimated_impact": "high|medium|low",
      "estimated_messages_saved": 6,
      "recommendation": "One-paragraph concrete suggestion in friend voice. No cost figures."
    }
  ],
  "wins": [
    "Specific thing the team is doing well, in one sentence"
  ]
}
```

Categories to look for:
- `repeated_context` — same context block re-pasted across 3+ conversations
- `repeating_workflow` — same kind of task asked repeatedly (could be a routine)
- `skill_mismatch` — task matched an available skill but the skill wasn't invoked
- `over_scoped_thread` — a conversation ran very long because the ask was vague
- `re_derived_knowledge` — the team re-solved a problem already documented in their brain
- `wins` — things the team is already doing well (always include 2-3 here)

### 5b. Parsing and ranking

Rank patterns by `estimated_impact` (high > medium > low), break ties by `estimated_messages_saved`. Take the top 5 patterns for the artifact. Always include 2-3 wins regardless of count.

If Claude returns fewer than 3 patterns or the corpus is thin (< 20 conversations in cycle), fall back to a lighter audit: skip the personalized patterns section, lead with the reset notice and one or two generic best-practice nudges chosen from a small built-in list (saving brand context, creating routines for repeated work, using skills for matching tasks).

---

## Phase 6 — Build the HTML artifact as an app

The artifact is an openable page. Same pattern as competitor-intel.

**App name:** `usage-audit-{WORKSPACE_SLUG}`

### 6a. Page structure

Read `/runneth/references/html-generation--design-system.md` for the design system.

Sections (top to bottom):
1. **Header.** "Getting more out of Runneth" — workspace name and reset date.
2. **At-a-glance.** Percent used (no dollar figure), days until reset, number of conversations this cycle, number of active teammates.
3. **TL;DR.** Top 3 highest-leverage changes as one-liners with anchor links to the detail below.
4. **The patterns.** One section per detected pattern: title, what I noticed, evidence (links to actual conversations in the customer's app), what to try instead. Friend voice throughout.
5. **What you're already doing well.** The wins from Phase 5b.
6. **If your volume just runs bigger than this plan.** One sentence: "If these changes don't cover the gap, the next tier 3x's your usage." No dollar figures. Show this section only if usage trajectory suggests they'd still run over after applying the recommendations (rough heuristic: if percent_used at current pace would exceed 110% by cycle end, include the section; otherwise omit).

### 6b. Conversation link format

Each evidence link goes to the customer's own app conversation URL:

```
https://projects.motionapp.com/organization/{organizationId}/{workspaceId}/chat/{conversationId}
```

Pull `workspaceId` from config or from `motion workspaces`.

### 6c. Build and verify

```bash
app list  # check if already exists
# if exists: overwrite source, rebuild
# if not: app create usage-audit-{WORKSPACE_SLUG}
app build usage-audit-{WORKSPACE_SLUG}
app verify usage-audit-{WORKSPACE_SLUG}
```

Capture the verified public URL as `APP_URL`. Build the URL from `$SPAWNETH_HOST` plus the verified route, never `build.runneth.com`.

---

## Phase 7 — Post to Slack

Parent message in `slackChannelId`. Friend voice. No dollars. Include the tag string if `slackUserTags` is non-empty.

```
{tag string} Hey team, quick note. You've used about {percent_used}% of your Runneth limit this cycle, and you've got {days_until_reset} days until it resets on {reset_date_human}.

I went through how I've been showing up for your team this month and put together a short read on a few places where you could be getting more out of each conversation. Most of these are small habit shifts, not big workflow changes.

Have a look here: {APP_URL}
```

Where:
- `percent_used` is the rounded whole percent
- `days_until_reset` is the integer day count
- `reset_date_human` is natural language: "June 14th"
- `APP_URL` is the verified app open URL from Phase 6c

**Rules:**
- No threaded follow-up. The app link is the full audit.
- Apply the pre-post check: read the channel for any audit posted today, skip if duplicate.
- Send via `slack send --channel {slackChannelId} --text "..."`.

If `slackChannelId` is missing or Runneth was kicked from the channel, post the parent message as a visible reply in the current conversation and flag the Slack delivery failure in the agent log.

---

## Phase 8 — Mark the cycle notified

Update the config file:

```json
{
  ...
  "lastNotifiedCycleStart": "<CYCLE_START.isoformat()>",
  "lastNotificationDeliveredAt": "<ISO now>",
  "lastNotificationAppUrl": "<APP_URL>"
}
```

This is what keeps Phase 3 Gate 2 firing for the rest of the cycle. Don't update this for manual user-invoked runs.

---

## Error handling

| Condition | Response |
|-----------|----------|
| Config file missing | Invoke `setup-usage-efficiency-audit` and retry |
| Postgres unreachable | Log and exit silently. Watcher will retry tomorrow. |
| Cost data is all zeros for the cycle | Log "no usage this cycle" and exit. Don't post. |
| Conversation corpus is thin (< 20 conversations) | Use the lighter audit fallback in Phase 5b |
| Claude API errors | Retry once with smaller corpus; if still failing, post the reset notice only with a generic nudge, log the failure |
| App build fails | Post the parent Slack message with the percentage and reset date only, note that the detailed audit couldn't be built today, log the failure |
| Slack channel not joined | Post in current conversation, log the failure, do NOT mark cycle as notified (so the next day's run retries) |
| `lastNotifiedCycleStart` matches current `CYCLE_START` and the run is automated | Exit silently |

---

## Customer-facing copy guardrails

Every piece of copy that could reach the customer must pass these checks before sending:
1. Contains no dollar figure, cost number, or pricing language.
2. Contains no "you're running out" or scarcity framing.
3. Contains no internal terminology (no "tokens," "model calls," "agent_cost_usd").
4. Reads like a teammate, not an alert.

If any line fails, rewrite before sending.

---

## Self-test (for manual invocation)

When invoked manually for testing, the skill should:
1. Print the computed cycle window
2. Print the cost-to-date and percent used
3. Print whether the gates would normally fire it
4. If passed `--dry-run`, build the artifact but skip Slack delivery
5. Return the app URL even on dry-run so the tester can inspect the page

These outputs are agent-facing, not customer-facing — fine to include numbers.
