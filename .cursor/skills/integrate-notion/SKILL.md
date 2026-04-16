---
name: integrate-notion
description: |
  Set up and connect a Notion integration for the workspace, including token registration, access sharing, and API-ready setup.
  Use when users ask to integrate with Notion, connect Notion, set up Notion, or use the Notion API.
user-invocable: true
last_verified: 2026-04-16
---

## Goal

Walk the user through creating a Notion integration, securely registering the
token, granting the integration access to Notion pages or databases, and
optionally scaffolding an app or workflow that uses the Notion API.

---

## Step 1 - Clarify intent (skip if already clear)

Before building anything, confirm what the user wants to do:

- Read from a Notion database (pull briefs, docs, pages)?
- Write to Notion (push reports, insights, summaries)?
- Two-way sync with another tool?
- Build a standalone app backed by Notion?

If the user's intent is already clear from context, skip this and proceed.

---

## Step 2 - Create the Notion integration token

If the user does not yet have a token, give these setup steps exactly:

1. Go to https://www.notion.so/my-integrations
2. Click **New integration**
3. Name it (e.g. "Runneth"), select the target workspace, click **Submit**
4. Copy the **Internal Integration Secret** (starts with `secret_`)

Tell the user not to paste the secret into chat. Emit the `secret-input` widget
immediately in the same response:

```text
secretKey: NOTION_API_KEY
allowedHosts: ["api.notion.com"]
label: "Notion Integration Secret"
reason: "Authenticates API calls to Notion on your behalf"
```

---

## Step 2.5 - Verify the token

Once the secret is registered, confirm it works before proceeding. Make a test
call to the Notion API:

```text
GET https://api.notion.com/v1/users/me
Authorization: Bearer {{runneth-secret:NOTION_API_KEY}}
Notion-Version: 2022-06-28
```

A 200 response confirms the token is valid. If you get a 401, the secret was
entered incorrectly or the integration was not saved in Notion. Re-emit
`secret-input` and ask the user to re-enter it.

---

## Step 3 - Share Notion content with the integration

After the token is registered, instruct the user to grant the integration access
to any pages or databases it needs to read or write:

1. Open the target page or database in Notion
2. Click **...** (top right) -> **Connections** -> find the integration by name -> **Confirm**

Remind them: the Notion API only returns content the integration has been
explicitly shared with. If they see empty results later, this is the first thing
to check.

---

## Step 4 - Collect the database or page ID (if needed)

If the workflow requires a specific Notion database or page:

- The ID is the 32-character string in the Notion URL, formatted as
  `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Ask the user to paste the URL or ID into chat (this is not a secret)
- Strip hyphens only if the API call requires it - most endpoints accept both forms

---

## Step 5 - Build the app or workflow (if requested)

If the user wants an app or automated workflow, route through `/runneth/skills/app-builder/SKILL.md`.

Key Notion API facts for implementation:

- Base URL: `https://api.notion.com/v1`
- Auth header: `Authorization: Bearer {{runneth-secret:NOTION_API_KEY}}`
- Version header: `Notion-Version: 2022-06-28` (required on every request)
- Query a database: `POST /databases/{database_id}/query`
- Retrieve a page: `GET /pages/{page_id}`
- Create a page: `POST /pages`
- Append blocks: `PATCH /blocks/{block_id}/children`
- Use standard `fetch(...)` in app code - do not use `secure-fetch`

---

## Constraints

- Never ask the user to paste the integration secret into normal chat text
- Always emit the `secret-input` widget when the token is needed
- Do not assume the integration has access to any Notion content until the user
  confirms they have shared the relevant pages or databases
- Do not fabricate database IDs or page IDs
- Do not make budget, targeting, or campaign-structure recommendations
- If the Notion API call fails with 401, the token is wrong or unregistered - re-emit `secret-input`
- If the Notion API call fails with 404 on a database query, the integration has
  not been shared with that database - remind the user to add the connection in Notion
