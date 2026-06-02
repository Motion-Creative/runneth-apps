# team-member-memory

Runneth gets to know each person it works with — their goals, preferences, and working style — and adapts to them over time. Standalone: no permissions setup required.

## What it does

- On every new conversation, resolves the speaker's identity from Slack ID or Motion email.
- If the person is new, scaffolds their home base at `/agent/brain/members/<handle>/` with:
  - a stub `<handle>.md` profile (from `team-member-template.md`)
  - a `brain/` subfolder for their personal sub-brain
  - a `conversations/` subfolder for per-conversation one-pagers
- Reads the speaker's `<handle>.md` plus their most recent one-pager before responding.
- After every response, updates the one-pager for the current conversation and refreshes `<handle>.md` when something durable surfaces.

## What gets installed

```
/agent/
├── user.md                                 ← behavior-snippet appended (session-open + post-response steps)
└── brain/
    ├── admin/
    │   ├── organization-map.json           ← identity registry — auto-provisioned on first message
    │   ├── slack-whoami.sh                 ← Slack resolver + auto-scaffolding
    │   ├── motion-whoami.sh                ← Motion-web resolver + auto-scaffolding (Neon-first)
    │   └── motion-whoami-neon.py           ← Neon agent_conversation query helper
    ├── members/
    │   ├── TEMPLATE.md                     ← team-member template (configurable path)
    │   └── <handle>/                       ← per-person home base, created on first message
    │       ├── <handle>.md
    │       ├── brain/
    │       └── conversations/
    │           └── <conversationId>/one-pager.md
    └── conversations/
        └── TEMPLATE.md                     ← one-pager template (configurable path)
```

## How identity resolution works

- **Slack:** `slack-whoami.sh <slack_user_id> [<display_name>]` reads `/agent/brain/admin/organization-map.json`. Known IDs resolve. Unknown IDs auto-provision a new entry and home base.
- **Motion web:** `motion-whoami.sh [<display_name>]` resolves the speaker email in this priority order: (1) Neon `agent_conversation` table via `motion-whoami-neon.py` invoked through `secret run --env DATABASE_URL=NEON_DATABASE_URL` — authoritative, zero-lag, works for brand-new conversations; (2) local `conversations.db` snapshot (live or latest backup) as a fallback when Neon is unreachable. Then resolves the email against the same `organization-map.json` and auto-provisions if unknown.

Both resolvers return `{ handle, home_base, status }`. Status is `resolved` or `provisioned`.

## Relationship to add-roles-permissions

This package is fully standalone. If an admin later installs `add-roles-permissions`, its stricter resolvers overwrite these ones and layer scope rules and collision detection on top of the same `organization-map.json`. Memory keeps working through the rename and the upgrade.

## Prerequisites

- Any Runneth sandbox
- `jq` installed
- A platform identifier (Slack ID or Motion `userEmail`) for the speaker — otherwise the resolvers fall back gracefully and the conversation proceeds without personalized context.

## Version history

See `install-config.json` → `changelog`.
