# team-member-memory

**Runneth gets to know each person it works with — their goals, preferences, and working style — and adapts to them over time.**

Every session starts with the agent reading who it's talking to and what they've worked on before. Every session ends with it updating what it learned. Over time, the agent becomes genuinely useful to each specific person rather than generic to everyone.

**Install time:** ~2 minutes  
**Requires:** Nothing. Works in any fresh sandbox.

---

## What gets installed

| File | Destination | Behavior |
|---|---|---|
| `user-map.json` | `{{TEAM_MAP_PATH}}` | Seeds empty email-to-team-file index (skipped if exists) |
| `team-member-template.md` | `{{TEAM_MEMBER_TEMPLATE_PATH}}` | Blank template for new team member files (skipped if exists) |
| `onepager-template.md` | `{{ONEPAGER_TEMPLATE_PATH}}` | Template for per-conversation one-pagers (skipped if exists) |
| `behavior-snippet.md` | `user.md` | Adds session-open and one-pager routines to agent behavior |

---

## What to customize

All tokens have sensible fallbacks. Override only if your brain uses different paths.

| Token | Default | When to change |
|---|---|---|
| `{{TEAM_MAP_PATH}}` | `/agent/brain/team/user-map.json` | Custom team directory |
| `{{TEAM_DIR}}` | `/agent/brain/team/` | Custom team directory |
| `{{TEAM_MEMBER_TEMPLATE_PATH}}` | `/agent/brain/team/TEMPLATE.md` | Custom team directory |
| `{{CONVERSATIONS_PATH}}` | `/agent/brain/conversations/` | Custom conversations directory |
| `{{ONEPAGER_TEMPLATE_PATH}}` | `/agent/brain/conversations/TEMPLATE.md` | Custom conversations directory |

---

## How it works

On every new conversation the agent:
1. Reads `conversations.db` to extract the user's email
2. Looks up that email in the team map to find their file
3. Reads their team file — who they are, how they communicate, what they care about
4. Finds and reads the most recent conversation one-pager for that user

After every response the agent updates the current conversation's one-pager with what happened that turn. If anything durable emerged — a new preference, a decision, a pattern — it updates the team file too.

New users are handled automatically: on first encounter the agent creates their team file from the template and adds them to the map.

---

## Fallbacks

- **User not in team map:** Agent creates a new team file from `{{TEAM_MEMBER_TEMPLATE_PATH}}` and adds the mapping automatically.
- **No prior one-pager found:** Agent starts fresh with no error.
- **`## System routines` section missing from `user.md`:** Snippet is appended to the end.
- **Any seed file already exists:** Install step is skipped. Existing data is never overwritten.

---

## Version history

See `install-config.json` changelog.
