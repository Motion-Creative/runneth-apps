# Integration Health Alerts

Know when an integration breaks — before it silently stops your routines.

Runneth monitors every connected integration on a 30-minute cycle. When something becomes degraded or broken, it sends a single alert to your admin Slack channel. If the issue isn't resolved, it follows up once after your configured silence window (default: 24 hours). When the integration recovers, it confirms that too. No noise, no spam — just the three messages that matter.

**Install time:** ~2 minutes
**Requires:** Slack connected, at least one other integration connected, `connected-integrations.json` registry present (installed automatically with Runneth or by the integration-onboarding skill)

---

## What this enables

- Admins get a Slack alert the first time an integration breaks, a follow-up if it's still broken after 24 hours, and a confirmation when it recovers.
- When a new integration is connected, the admin is told immediately which channel will receive health alerts (or guided through setting one up if none exists yet).
- The health check routine self-heals: if it gets accidentally deleted, it recreates itself on the next run and notifies the admin channel.
- Any integration type with a defined check (Motion, GitHub, Slack, Notion, Linear, Dropbox, OpenAI, LaunchDarkly) is monitored automatically. Unknown types get a graceful "can't verify" status.

---

## Setup steps

1. Install files per `install-config.json`
2. Replace token values in the installed files if you want non-default settings (see What to customize below). Defaults work without any changes.
3. Runneth will automatically invoke the `setup-integration-health-alerts` skill, which:
   - Confirms or configures your admin Slack channel
   - Sets your preferred silence window
   - Optionally configures a GitHub repo for deep health checks
   - Starts the health check routine

To re-run setup at any time: say "set up integration health alerts" or "reconfigure integration health."

---

## What this creates

```
/agent/
├── .agents/skills/
│   ├── integration-health-check/SKILL.md       ← Core check skill (runs on cron)
│   ├── setup-integration-health-alerts/SKILL.md ← Setup and reconfiguration skill
│   └── integration-health-alerts-onboarding-patch/SKILL.md ← Patch spec for integration-onboarding
└── brain/
    └── integration-health/
        ├── health-config.json                   ← Org settings (silence window, interval, override channel)
        └── health-state.json                    ← Written after every check run
```

**Routine created during setup:**
- Name: `Integration health check`
- Cron: `*/30 * * * *` (every 30 minutes, configurable)
- Timezone: `{{TIMEZONE}}`

**Manual patch required:**
Apply the contents of `integration-health-alerts-onboarding-patch/SKILL.md` (Step 8b) to your existing `integration-onboarding` skill. This adds admin channel notification to the integration connection moment. The setup skill can guide you through this.

---

## What to customize

| Token | Default | What it controls |
|---|---|---|
| `{{SILENCE_HOURS}}` | `24` | Hours between repeat alerts for the same unresolved issue |
| `{{CHECK_INTERVAL_MINUTES}}` | `30` | How often the health check routine runs (in minutes) |
| `{{TIMEZONE}}` | `America/New_York` | Routine schedule timezone (IANA format) |
| `{{GITHUB_REPO}}` | `null` | GitHub repo for L4/L5 checks (`owner/repo`). Null skips repo-level checks. |

All tokens are optional. Defaults work for 90% of sandboxes without changes.

---

## How Runneth uses this

**Health check routine (every 30 min):**
1. Reads `connected-integrations.json` — builds list of integrations where `health_monitored: true`
2. Runs per-integration checks (L1–L5 layers)
3. Compares results to prior state in `health-state.json`
4. Reads `health-config.json` for silence window; reads `permissions/config.json` for admin channel
5. Sends Slack alerts based on alert logic (see below)
6. Writes updated state and alert timestamps back to `health-state.json`

**Alert logic:**
- Integration breaks → first alert sent immediately to admin channel
- Still broken after `{{SILENCE_HOURS}}` hours → one follow-up alert
- Integration recovers → restored alert (only if a prior alert was sent)
- Routine blocked by broken integration → one alert per routine, cleared on recovery

**Self-healing:**
On every run, the skill checks that the health check routine is still active. If deleted, it recreates it and notifies the admin channel.

**Integration connection moment (requires onboarding patch):**
When a new integration is connected and an admin channel is already set → one-line notification in chat.
When no admin channel is set → guided setup flow in chat, then confirmation message posted to the new channel.

---

## Fallbacks

| Situation | What happens |
|---|---|
| Admin channel not configured | Setup skill prompts for it. Health alerts are skipped until configured. |
| Integration type not recognized | Status set to `unknown`. Alert sent if configured. No run failure. |
| Health check routine deleted | Recreated automatically on next Runneth conversation that invokes the skill. Admin channel notified. |
| health-state.json write fails | Fallback write to `/tmp/`. Alert logic continues using in-memory state. Error logged. |
| Run fails mid-execution | Error written to `lastRunError`. Alert posted to admin channel. Subsequent run detects and reports. |
| No Slack connected | Alerts skipped silently. Health state still written normally. |
| `{{GITHUB_REPO}}` not set | GitHub L4 and L5 skipped. L1 and L2 (token validity + expiry) still run. |

---

## Version history

| Version | Date | Notes |
|---|---|---|
| 1.0.0 | 2026-05-20 | Initial release. Dynamic integration registry, configurable silence window, self-healing routine, three alert types, admin channel setup flow. |
