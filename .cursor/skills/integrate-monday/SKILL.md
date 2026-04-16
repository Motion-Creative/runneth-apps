---
name: monday-motion-integration
description: |
  Reusable playbook for building a Monday.com + Motion integration app for any account.
  Use when the user asks to connect Monday.com to Motion, push performance data to Monday boards,
  or build any workflow bridging Motion creative analytics with Monday.com project management.
user-invocable: true
last_verified: 2026-04-15
---

# Monday.com + Motion Integration Playbook

## Trigger And Scope

Building sandbox apps that connect Motion creative performance data with Monday.com boards.

Common use cases:
- Push top-performing creatives from Motion into a Monday.com board
- Sync creative production status from Monday into a performance dashboard
- Combined view: Motion ROAS/spend data alongside Monday.com task/item status

For backend scaffolding, follow the `sandbox-app-runtime` skill. This skill covers Monday-specific API details only.
If `sandbox-app-runtime` is not found under `/agent/skills/`, the backend contract is missing. Do not proceed with build steps until it is available.

---

## Version Metadata

- `api_version`: `v2` (GraphQL), pinned API header version `2026-04`
- `last_verified`: `2026-04-15`

## Core Workflow Checklist

1. Collect `MONDAY_API_KEY` via `secret-input` widget (`allowedHosts: ["api.monday.com"]`).
2. Verify auth with a low-cost GraphQL query before any large pull/write.
3. Resolve board and item scope explicitly.
4. Execute scoped read/write operations with complexity-aware pacing.
5. Return created/updated records or extracted artifact details.

## Board Resolution

When the user does not provide a board id:
1. Run `GetBoards` to list available boards (`id`, `name`).
2. Select target scope by either:
   - confirming with the user, or
   - inferring from explicit board-name context in the request.
3. Use the resolved board id in all subsequent queries/mutations.

## Output Contract And Artifact Paths

- For sync/write flows: report board scope, item ids changed, and failure count.
- For extract flows: write normalized JSON to `./workdir/monday_items.json` and report item count.
- If a final deliverable is required for user handoff, copy to `./artifacts/monday_items.json`.

## Template Vs Live State Rules

- This file is reusable repo guidance and can be updated.
- Do not overwrite user workspace mappings/business logic unless requested.
- Merge improved Monday API patterns without replacing account-specific workflow rules.

## Verification Gate (Pass/Fail)

Pass only if all are true:
- auth call succeeds with raw token authorization (no Bearer prefix)
- scoped board query succeeds and returns expected shape
- response has no GraphQL `errors` payload
- complexity/read budget is sufficient for planned operation

If verification fails, stop and resolve auth/scope/query issues before full execution.

## Critical Facts - Do Not Deviate

- Endpoint: `https://api.monday.com/v2`
- Method: `POST` (GraphQL only)
- Auth header uses raw token in `Authorization` (no `Bearer` scheme)
- Use `items_page` cursor pagination; do not use removed `items` field
- Check response `errors` even on HTTP `200`
- Pin API version header (`API-Version: 2026-04`) and re-verify quarterly

---

## Detailed Implementation Reference

Use the sections below as the deeper operational reference after passing the verification gate above.

## Required Secret

Collect via `secret-input` widget before building. Never ask for the value in plain text.

| Secret Key | Allowed Host | Purpose |
|---|---|---|
| `MONDAY_API_KEY` | `api.monday.com` | Monday.com GraphQL API authentication |

Use `{{runneth-secret:MONDAY_API_KEY}}` as a placeholder in app code.

---

## Monday.com API

**Endpoint:** `https://api.monday.com/v2`
**Method:** POST (GraphQL only)

### Auth Headers

```ts
headers: {
  'Content-Type': 'application/json',
  'Authorization': '{{runneth-secret:MONDAY_API_KEY}}',   // no Bearer scheme - raw token only
  'API-Version': '2026-04',
}
```

Monday does NOT use the `Bearer` scheme. Sending `Bearer <token>` will fail auth. The raw token goes directly in the `Authorization` header.

**API-Version:** Pin to `2026-04` (current as of last_verified date). The version lifecycle is quarterly. Check [https://developer.monday.com/api-reference/docs/api-versioning](https://developer.monday.com/api-reference/docs/api-versioning) when refreshing this skill.

---

## GraphQL Patterns

Always use variables for dynamic values. String interpolation works but is fragile and harder to debug.

### List Boards

```graphql
query GetBoards {
  boards {
    id
    name
  }
}
```

### List Items on a Board

```graphql
query GetBoardItems($boardId: ID!) {
  boards(ids: [$boardId]) {
    items_page(limit: 50) {
      cursor
      items {
        id
        name
        column_values {
          id
          text
        }
      }
    }
  }
}
```

Note: use `items_page`, not `items`. The `items` field was removed in a breaking change. `items_page` supports cursor-based pagination via `cursor`.

### Create an Item

```graphql
mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON) {
  create_item(
    board_id: $boardId
    item_name: $itemName
    column_values: $columnValues
  ) {
    id
  }
}
```

`column_values` must be a JSON-stringified map, and value shapes vary by column type. Text/status are simple, but date/person/dropdown/link require type-specific JSON structures. See [Monday column types reference](https://developer.monday.com/api-reference/reference/column-types-reference) before mapping Motion fields to non-text columns.

### Update a Column Value

```graphql
mutation UpdateColumn($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) {
  change_simple_column_value(
    board_id: $boardId
    item_id: $itemId
    column_id: $columnId
    value: $value
  ) {
    id
  }
}
```

### Read Complexity in Any Query

Add this to any query to track your remaining budget. Useful for debugging rate issues.

```graphql
query GetBoardItems($boardId: ID!) {
  complexity {
    query
    before
    after
    reset_in_x_seconds
  }
  boards(ids: [$boardId]) {
    items_page(limit: 50) {
      items { id name }
    }
  }
}
```

---

## Rate Limits

Monday uses a complexity-based budget, not a simple requests-per-minute cap.

| Token type | Complexity budget per minute |
|---|---|
| Personal API token | 10M points (combined reads + writes) |
| App token | 5M points per minute, reads and writes separately |
| Trial / free accounts | 1M points per minute |

Budget follows a sliding window that resets 60 seconds after the first call in the window.

Additional per-minute request limits (separate from complexity):

| Plan | Queries per minute |
|---|---|
| Enterprise | 5,000 |
| Pro | 2,500 |
| Other | 1,000 |

**Error handling:**
- `ComplexityException` means you hit the complexity budget. Read `extensions.complexity.reset_in_x_seconds` from the response and wait before retrying.
- `429` HTTP status means you hit the minute request limit. Read the `Retry-After` response header for the wait time.
- Both error types return a `retry_in_seconds` field. Use it. Do not retry immediately.
- Check `data.errors` in the response body even on HTTP 200 - GraphQL errors return 200 with an `errors` array.

---

## Motion Data Side

Before running the Motion sequence, confirm the active workspace matches the intended account. Workspace config lives under `/agent/workspaces/<workspaceId>/config/`. If multiple workspaces exist and the user has not specified, ask which account before proceeding.

Standard own-account sequence before building:

1. `motion workspace-goal` - get preferred conversion metric and attribution windows
2. `motion spend-threshold` - get minimum spend threshold
3. `motion creative-insights --limit 150 --sort topSpend` - pull candidate set
4. Rerank by preferred metric for best/worst performers

Motion creative fields useful for Monday.com sync:
- `id` - creative identifier
- `name` - ad name
- `url` - media URL
- Metric fields from `metricsMetadata` (ROAS, CPA, CTR, spend, etc.)

---

## Future: Webhook Pattern

For real-time sync, polling the GraphQL API is the wrong primitive. Monday supports webhooks for item and column change events. When the use case is "update Motion when a Monday status changes" or "trigger an action when an item moves columns," implement a webhook subscription instead of a polling loop.

Webhook stub (to be fully documented when the use case arises):
- Register via `create_webhook` mutation with a `url` pointing to your app's `/api/webhook` endpoint and an `event` type (e.g. `change_column_value`, `create_item`)
- Monday sends a POST to your endpoint with the event payload
- Verify the webhook signature from the `Authorization` header Monday sends
- Respond with HTTP 200 within 5 seconds or Monday will retry

---

## Common Gotchas

- **No Bearer scheme.** `Authorization: Bearer <token>` fails. Use `Authorization: <token>` directly.
- **`items` field is removed.** Always use `items_page` with cursor pagination.
- **GraphQL errors return HTTP 200.** Always check `data.errors`, not just response status.
- **Column value shapes differ by type.** `column_values` payloads for date/person/dropdown/link need column-type-specific JSON formats.
- **Complexity is not req/min.** A single expensive query can exhaust your budget. Use `complexity { after }` to monitor.
- **API version rotates quarterly.** If queries start failing unexpectedly, check whether the pinned version entered maintenance or deprecated status.
- **Backend must export `handleRequest`.** See `sandbox-app-runtime` skill for the full contract.
