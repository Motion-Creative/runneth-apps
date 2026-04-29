# Conversation Mission Control

A real-time conversation manager for Runneth. See all your active conversations in a kanban-style board, know instantly which ones need your reply, detect when conversations are done, and read the last message without leaving the app.

Reads directly from the Runneth runtime database so the board is always live — no manual tracking required.

---

## Features

- **Three-column board** — Active (agent is streaming), Waiting on me (agent replied, your turn), Done
- **Auto-done detection** — detects closing language in the last agent message ("let me know if you need anything", "hope that helps", etc.) and moves the conversation to Done automatically
- **Last message preview** — shows the first two lines of the last agent message directly on the card so you can see what you need to respond to without opening anything
- **Message panel** — click any card to read the last 6 messages in a chat view
- **POC reply** — send a reply directly from the board (stored locally; requires a Runneth turn submission API to send for real)
- **Unseen tracking** — subtle card highlight when a conversation has had activity since you last opened it
- **App detection** — surfaces a tag on cards for conversations that produced a sandbox app, with a direct link to open it
- **Slack source badge** — Slack-origin conversations are tagged with the Slack logo and default to Done (already handled in Slack)
- **48-hour auto-archive** — conversations quiet for 48 hours drop out of the board automatically; accessible via the Archive tab
- **10-second polling** — thinking state and new messages stay current without a manual refresh

---

## Setup

### 1. Create the app

```bash
app create conversation-manager
```

### 2. Copy source files

```bash
cp -r server/* /agent/apps/conversation-manager/server/
cp -r frontend/* /agent/apps/conversation-manager/frontend/
```

### 3. Configure org and workspace

Create `/agent/apps/conversation-manager/data/config.json`:

```json
{
  "orgId": "your-org-id",
  "workspaceId": "your-workspace-id"
}
```

Find these values in your Runneth conversation URL:

```
https://projects.motionapp.com/organization/{orgId}/{workspaceId}/chat/{conversationId}
```

### 4. Build and verify

```bash
app build conversation-manager
app verify conversation-manager
```

### 5. Get the app URL

```bash
app list
```

Return a link widget with `kind=app` using the route shown.

---

## How it works

The app reads directly from the Runneth runtime database at `/agent/.runtime/conversations.db` (read-only). This gives it access to:

- All conversation titles, statuses, and timestamps
- Last message per conversation (for preview and status detection)
- Whether an agent execution is currently active (the "thinking" state)
- Slack origin metadata via `externalProvider`

Local state (done overrides, archived flags, sent replies, unseen timestamps) is stored in JSON files under the app's `data/` directory.

### Status detection logic

| Condition | Status |
|---|---|
| `active_execution_json` is set | Active |
| `manualStatus = 'done'` | Done |
| `manualStatus = 'active'` (explicit unmark) | Waiting or Active (auto-detected) |
| `externalProvider = 'slack'` | Done |
| Last assistant message matches closing patterns | Done (auto) |
| Last message role is `assistant` with text | Waiting on me |
| Everything else | Active |

### Auto-done patterns

The app checks the tail of the last assistant message for these signals:

- "let me know if you need anything"
- "hope that helps / hope this helps"
- "feel free to reach out"
- "you're all set / all done / all set"
- "is there anything else"
- "here's your X" (delivery language)
- "happy to help"

When triggered, the card shows `✓ Done` to indicate the status was inferred. You can unmark it via the card menu — that pins it as not-done and won't re-trigger.

### Slack message rendering

Runneth Slack conversations store inbound messages as a JSON payload inside the text part. The app parses `currentMessage.text` from those payloads to show readable message content. Outgoing Slack replies are read from `data-slack-reply` parts (`shouldRespond: true`). Cases where the agent chose not to reply show as "(no reply sent to Slack)".

---

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/conversations` | All active conversations (not archived) |
| `GET` | `/api/archived` | Archived conversations |
| `GET` | `/api/conversations/:id/messages` | Last 6 messages, merged with local replies |
| `POST` | `/api/conversations/:id/reply` | Store a reply locally (POC) |
| `POST` | `/api/conversations/:id/seen` | Mark conversation as seen now |
| `PUT` | `/api/conversations/:id` | Update `archived` flag or `manualStatus` |

### PUT body shape

```json
{
  "archived": true,
  "manualStatus": "done" | "active" | null
}
```

`manualStatus: "active"` explicitly overrides auto-done and keeps the conversation out of Done on future loads.

---

## Local data files

All stored under `{appRoot}/data/`:

| File | Purpose |
|---|---|
| `config.json` | Org ID and workspace ID for Runneth URLs |
| `notes.json` | Per-conversation `archived` flag and `manualStatus` |
| `replies.json` | Locally stored replies (POC mode) |
| `seen.json` | Last-opened timestamp per conversation |

---

## Notes

- The runtime database is read-only for the app process. Turn submission requires a Runneth turn submission API (not currently exposed).
- App detection reads `buildeth.app.json` from `/agent/apps/*/` — any app with a matching `conversationId` shows as a tag on that card.
- Conversations auto-archive after 48 hours of inactivity. The threshold is set by `FORTY_EIGHT_HOURS_MS` in `server/src/index.ts`.
