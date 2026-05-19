# team-member-memory

**Runneth gets to know each person it works with — their goals, preferences, and working style — and adapts to them over time.**

Every session starts with the agent reading who it's talking to and what they've worked on before. Every session ends with it updating what it learned. Over time, the agent becomes genuinely useful to each specific person rather than generic to everyone.

**Install time:** ~2 minutes  
**Requires:** [add-permissions](../add-permissions) (must be installed and configured first)

---

## Prerequisites

`add-permissions` must be installed and have at least one admin mapped before you install this. Team Member Memory delegates all identity resolution to the permissions resolvers — it does not maintain its own user registry.

---

## What gets installed

| File | Destination | Behavior |
|---|---|---|
| `team-member-template.md` | `{{TEAM_MEMBER_TEMPLATE_PATH}}` | Blank template for new team member files (skipped if exists) |
| `onepager-template.md` | `{{ONEPAGER_TEMPLATE_PATH}}` | Template for per-conversation one-pagers (skipped if exists) |
| `behavior-snippet.md` | `user.md` | Adds session-open and one-pager routines to agent behavior |

---

## What to customize

| Token | Default | When to change |
|---|---|---|
| `{{TEAM_MEMBER_TEMPLATE_PATH}}` | `/agent/brain/members/TEMPLATE.md` | Custom template location |
| `{{ONEPAGER_TEMPLATE_PATH}}` | `/agent/brain/conversations/TEMPLATE.md` | Custom conversations directory |

---

## How it works

On every new conversation the agent:
1. Checks that `add-permissions` is installed. If not, it stops and prompts the user to install it first.
2. Resolves identity from the active surface — Slack ID via `slack-whoami.sh`, or Motion web email via `motion-whoami.sh`.
3. Reads the person's team file from their permissions home base (`/agent/brain/members/<handle>/<handle>.md`).
4. Finds and reads the most recent conversation one-pager for that person.

After every response the agent updates the current conversation's one-pager. If anything durable emerged — a new preference, a decision, a pattern — it updates the team file too.

New users are handled by the permissions auto-provisioner on first encounter. Once provisioned, the agent creates their team file from the template.

Works on both Slack and Motion web.

---

## Fallbacks

- **add-permissions not installed:** Agent stops session-open and tells the user to install it first.
- **Permissions collision:** Agent blocks writes and routes to the admin channel per the permissions flow.
- **New user (provisioned this session):** Agent creates their team file from `{{TEAM_MEMBER_TEMPLATE_PATH}}`.
- **No prior one-pager found:** Agent starts fresh with no error.
- **`## System routines` missing from `user.md`:** Snippet is appended to the end.
- **Any seed file already exists:** Install step is skipped. Existing data is never overwritten.

---

## Version history

See `install-config.json` changelog.
