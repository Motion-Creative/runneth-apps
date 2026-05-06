# Integration capabilities library

The agent always has an accurate, sourced reference for what every connected integration can do and what permissions it needs — updated automatically every night.

---

## What this enables

When someone asks what Slack can do, what GitHub scopes are needed, or whether Notion supports file uploads — the agent answers from a live, sourced document rather than from memory or inference. When a new integration is connected, a capabilities-and-scopes file is created automatically by fetching the official API docs. Every night, all files are re-reviewed and patched if anything changed.

---

## Install time

~5 minutes, plus a one-time reminder command to activate the nightly routine.

---

## Requires

Nothing. Works in any fresh sandbox.

---

## What gets installed

| File | Destination | Behavior |
|---|---|---|
| `integrations-index.md` | `{{INTEGRATIONS_DIR}}README.md` | Seeds the integration library index. Skipped if already exists. |
| `skill.md` | `/agent/.agents/skills/integration-capabilities-sync/SKILL.md` | Installs the sync skill. Skipped if already exists. |
| `behavior-snippet.md` | `user.md` → after `## System routines` | Adds behavior: check the library before answering integration questions; trigger skill when a new integration is detected. |

---

## What to customize

| Token | Default | When to change |
|---|---|---|
| `{{INTEGRATIONS_DIR}}` | `/agent/brain/integrations/` | Change if your brain uses a different directory structure |
| `{{SYNC_TIMEZONE}}` | `America/New_York` | Change to match the org's timezone — update in the post-install reminder command |

---

## How it works

**On install:** The library index and skill are seeded. The behavior snippet tells the agent to check the library before answering integration questions and to trigger the skill when a new integration is detected.

**On new integration:** The agent detects that no `capabilities-and-scopes.md` exists for the integration, runs the sync skill scoped to that integration only, fetches the official API docs and scopes reference, and creates the file. Source URLs are always recorded in the file.

**Nightly:** The routine re-fetches docs for all integrations, diffs against the existing files, patches only what changed, updates the Last reviewed date, and logs material changes to the brain changelog.

**When answering questions:** The agent reads from the library file first. If no file exists, it runs the skill to create one before answering. It never answers integration capability or scope questions from memory alone.

---

## Post-install step (manual)

The nightly routine must be activated with one command after install:

```bash
reminder add \
  --name "Nightly integration capabilities sync" \
  --cron "0 3 * * *" \
  --timezone "America/New_York" \
  --content "Run the integration-capabilities-sync skill. Full procedure: /agent/.agents/skills/integration-capabilities-sync/SKILL.md. Nightly maintenance pass — fetch docs, diff, patch changes, update Last reviewed dates, log material changes to changelog."
```

Adjust `--cron` and `--timezone` to match the org's preferred schedule.

---

## Fallbacks

- `integrations-index.md` and `skill.md` are both skipped if the destination already exists — safe to re-install
- Behavior snippet falls back to appending to `user.md` if `## System routines` section is not found
- If a docs URL cannot be fetched for an integration, the skill writes a stub file stating documentation could not be located — it never fills in capabilities from memory
- For unknown integrations not in the skill's known-URL table, the skill uses WebSearch to find the official docs before creating the file

---

## Version history

See `install-config.json` changelog.
