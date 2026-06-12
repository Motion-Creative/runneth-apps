# Integration Health Check (`health-alerts`)

Ask Runneth "check my integrations" and get a straight answer: which connected tools work, which don't, and what to do about it.

One on-demand skill. No scheduled routine, no Slack posting, no setup flow, no JSON state. The durable markdown status file is the whole record, and a small `user.md` instruction makes Runneth speak up when a broken integration blocks real work.

**Install time:** ~1 minute
**Requires:** At least one connected integration

---

## What the skill does

When invoked ("check my integrations", "is everything connected", "health check", "is Slack working"):

1. Reads the previous status file, if one exists, as the comparison baseline.
2. Discovers connected integrations from `integrations list` and the native `doctor` commands. It never infers connections from environment variables and never reads secret values.
3. Verifies each integration with one cheap read call that exercises real auth (for example `slack doctor`, `motion workspaces`, a repo metadata read for GitHub).
4. Writes one durable file: `/agent/brain/integration-health/health-status.md` — per-integration status (Working / Not working / Can't tell), last-checked date, action needed, and what changed since the last check.
5. Reports the same in chat, leading with problems and their fixes.

After the first successful check, the skill appends a sentinel-guarded block to `/agent/user.md` (sentinel `runneth-apps:health-alerts:surface-integration-issues v2`). From then on, if Runneth hits an integration auth or connection error during any task, it tells the user in that reply and suggests running the health check — never silently working around it.

---

## What this creates

```
/agent/
├── .agents/skills/
│   └── integration-health-check/SKILL.md      ← the one skill (installed)
├── brain/
│   └── integration-health/
│       └── health-status.md                   ← written on every check (runtime)
└── user.md                                    ← one sentinel-guarded block (runtime, first successful check)
```

---

## Design notes

- **The markdown file is the state.** Each run compares the new results against the previous file inline and records the changes. There are no JSON state or config files.
- **On-demand only.** The skill never creates a routine or reminder. If a user wants a recurring check, they can ask Runneth to schedule one themselves; the skill copy points this out.
- **Chat only.** Results go to the conversation and the status file. Nothing is posted to Slack or any other channel.
- **Honest statuses.** An integration that can't be cheaply verified is reported as "Can't tell," never guessed.

---

## Version history

See the `changelog` in `install-config.json`. v3.0.0 (2026-06-12) is a full rebuild: three skills collapsed to one on-demand check; the auto-invoked setup skill, 30-minute recurring routine, automatic Slack alerts, secret scanning, and all JSON state files were removed.
