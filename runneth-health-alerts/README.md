# Runneth Health Alerts

Know when an integration breaks or a routine stops working — before either silently derails your team's work.

Runneth monitors every connected integration and every active routine on a configurable cycle. When something goes wrong — an integration breaks, a routine goes overdue, a dependency chain snaps, or a skill fails to complete — it sends a single alert to your admin Slack channel. One follow-up after your silence window if unresolved. A confirmation when things recover.

**Install time:** ~2 minutes
**Requires:** Slack connected, at least one integration or routine active, connected-integrations.json registry present (installed by integration-onboarding skill or created at setup)

---

## What this monitors

**Integrations** — 5-layer check per integration:
- L1 Credential present, L2 Token valid, L3 Scopes adequate, L4 Capability confirmed, L5 Functional read passes
- Supports: Motion, GitHub, Slack, Notion, Linear, Dropbox, OpenAI, LaunchDarkly. Unknown types flagged as unverifiable, not skipped.

**Routines** — three health signals per routine:
- **Overdue** — hasn't fired within 2× its expected interval
- **Execution record** — did the skill that runs this routine actually complete? Checked via execution record written by the skill on completion.
- **Dependency chain** — does this routine depend on another that is missing or inactive? Downstream impact flagged.

**Routine statuses:**
- `healthy` — fired on schedule, execution confirmed
- `degraded` — overdue or execution failed/stale
- `broken` — dependency missing or chain broken
- `unverifiable` — skill doesn't report completion status yet (fixable inline from the alert)

---

## Alert types

Three per issue, for both integrations and routines:
1. First alert when status changes to degraded/broken/unverifiable
2. One reminder after `{{SILENCE_HOURS}}` hours if unresolved
3. Restored notification when health returns (only if a prior alert was sent)

---

## Setup steps

1. Install files per `install-config.json`
2. Replace token values if you want non-default settings (see What to customize)
3. Runneth invokes `setup-integration-health-alerts` automatically, which:
   - Confirms or configures your admin Slack channel
   - Sets your timezone and silence window
   - Audits all installed skills for execution record support, offers to update any missing
   - Starts the health check routine

Re-run setup any time: say "set up runneth health alerts" or "reconfigure runneth health."

---

## What this creates

```
/agent/
├── .agents/skills/
│   ├── integration-health-check/SKILL.md              ← Core check skill (cron routine)
│   ├── setup-integration-health-alerts/SKILL.md       ← Setup + reconfiguration
│   └── integration-health-alerts-onboarding-patch/    ← Patch spec for integration-onboarding
└── brain/
    ├── integration-health/
    │   ├── health-config.json                          ← Org settings
    │   ├── health-state.json                           ← Integration results (written every run)
    │   └── routine-health-state.json                  ← Routine results (written every run)
    └── org/
        └── routine-executions/<skill-name>/
            └── last-run.json                           ← Written by skills on completion
```

**Routine created during setup:**
- Name: `Integration health check`, Cron: `*/{{CHECK_INTERVAL_MINUTES}} * * * *`, Timezone: collected at setup

---

## What to customize

| Token | Default | What it controls |
|---|---|---|
| `{{SILENCE_HOURS}}` | `24` | Hours between repeat alerts for the same unresolved issue |
| `{{CHECK_INTERVAL_MINUTES}}` | `30` | How often the health check runs |
| `{{TIMEZONE}}` | `UTC` | Routine schedule timezone — collected from admin during setup |
| `{{GITHUB_REPO}}` | `null` | GitHub repo for L4/L5 checks (`owner/repo`). Null skips repo-level checks. |

---

## How Runneth uses this

**Health check routine (every {{CHECK_INTERVAL_MINUTES}} min):**
1. Reads `connected-integrations.json` — checks all integrations where `health_monitored: true`
2. Reads `reminder list` — checks all active routines
3. For routines: detects overdue, checks execution records, maps dependency chains
4. Compares to prior state, fires Slack alerts per silence window logic
5. Writes updated state files and alert timestamps

**Execution record protocol:**
Skills write `/agent/brain/org/routine-executions/<skill-name>/last-run.json` on successful completion. The health checker compares this timestamp to when the routine last fired. Lag beyond 1.5× the routine interval → execution flagged as failed or stale.

Skills without execution records → status `unverifiable`. Admin sees the alert and can reply "fix <skill name>" — Runneth adds execution tracking to that skill on the spot.

**Self-healing:**
On every run, the skill checks that the health check routine is still active. If deleted, recreates it and notifies the admin channel.

**Admin channel as home base:**
The admin channel receives all alerts — integration failures, routine issues, dependency breaks, and org-change requests from your team. One channel, everything that needs admin attention.

---

## Fallbacks

| Situation | What happens |
|---|---|
| No admin channel configured | Setup skill prompts at first integration or routine connection. Alerts skip until configured. |
| Integration type not recognized | Status `unknown`. Not a run failure. |
| Health check routine deleted | Self-heals on next Runneth conversation that invokes the skill. Admin notified. |
| Skill has no execution record | Status `unverifiable`. Alert includes inline fix offer. |
| State file write fails | Fallback to `/tmp/`. Alert logic continues using in-memory state. |
| No connected-integrations.json | Setup skill creates it. Routine health still runs independently. |
| Permissions config v2.0 or v2.1 | Both paths checked — v2.1 (`/brain/admin/config.json`) first, v2.0 fallback. |

---

## Version history

| Version | Date | Notes |
|---|---|---|
| 2.0.0 | 2026-05-20 | Renamed to runneth-health-alerts. Added routine health monitoring: overdue detection, execution records, dependency chains, unverifiable status with inline fix. Retroactive skill audit at setup. |
| 1.0.0 | 2026-05-20 | Initial release as integration-health-alerts. Integration health monitoring only. |
