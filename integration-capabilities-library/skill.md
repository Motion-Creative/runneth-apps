# Skill: integration-capabilities-sync

**Purpose:** Create or update capability one-pager files for every connected integration. Sources content directly from official API documentation. Runs on two triggers: (1) new integration detected, (2) nightly 3am ET maintenance pass.

**Output files:** `/agent/brain/integrations/<name>/capabilities-and-scopes.md` per integration  
**Index file:** `/agent/brain/integrations/README.md`  
**Changelog:** `/agent/brain/changelog/YYYY-MM-DD.md`  

---

## When To Run This Skill

1. **New integration connected** — when a user says a new integration was connected, or when the routine detects an integration in the health state with no matching capabilities.md
2. **Nightly 3am ET maintenance** — re-review all existing capability files against live API docs and update anything that has changed

---

## Step 1 — Identify Which Integrations Need Work

Read the integration health state:
```bash
cat /agent/brain/integration-health/health-state.json
```

List existing capability files:
```bash
ls /agent/brain/integrations/
```

**For the new-integration trigger:**
- Compare integrations in health-state.json against existing subdirectories under `/agent/brain/integrations/`
- Any integration present in health state with no matching capabilities directory = new integration, needs a fresh file
- If the user explicitly names an integration, create or update that one

**For the nightly trigger:**
- Process all integrations present in health state, regardless of whether a capabilities.md exists
- For integrations with an existing capabilities.md, this is an update pass — diff and patch only what changed

---

## Step 2 — Resolve the API Documentation URL

**The cardinal rule: never write a capabilities.md from memory or inference. Every capability, endpoint, and limit must come from a fetched source. If you cannot fetch a reliable source, say so and stop — do not guess.**

### 2a — Known integrations

For integrations where a reliable docs URL is already known, use it directly and fetch it to confirm it resolves before proceeding. If the fetch fails or returns unexpected content, treat it as unknown and go to 2b.

| Integration | Capabilities Docs URL | Scopes / Permissions Docs URL |
|---|---|---|
| Motion | Internal CLI only — run `motion <command> --help` via Bash | N/A — workspace token, no named scopes |
| GitHub | `https://docs.github.com/en/rest` | `https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps` |
| Slack | `https://docs.slack.dev/reference/methods` | `https://docs.slack.dev/reference/scopes` |
| Notion | `https://developers.notion.com/reference/intro` | `https://developers.notion.com/reference/capabilities` |
| Google Drive | `https://developers.google.com/drive/api/reference/rest/v3` | `https://developers.google.com/drive/api/guides/api-specific-auth` |
| Google Sheets | `https://developers.google.com/sheets/api/reference/rest` | `https://developers.google.com/sheets/api/guides/authorizing` |
| HubSpot | `https://developers.hubspot.com/docs/api/overview` | `https://developers.hubspot.com/docs/api/oauth/scopes` |
| Airtable | `https://airtable.com/developers/web/api/introduction` | `https://airtable.com/developers/web/api/scopes` |
| Linear | `https://developers.linear.app/docs/graphql/working-with-the-graphql-api` | `https://developers.linear.app/docs/oauth/authentication` |
| Webflow | `https://developers.webflow.com/data/reference` | `https://developers.webflow.com/data/docs/oauth` |

### 2b — Unknown integrations

If the integration is not in the table above, do not guess a URL. Use WebSearch:

1. Search: `<integration name> official API documentation reference`
2. Evaluate the results — look for the integration's own developer docs domain, not third-party summaries, blog posts, or aggregators
3. Take the first result that is clearly the official developer/API reference
4. Fetch that URL and confirm it contains real API documentation (endpoints, methods, auth)
5. If no credible official source is found after searching, write a stub capabilities.md that clearly states: "API documentation could not be located. No capabilities have been documented. A URL to the official API reference is needed to complete this file." Do not fill in any capability content.

### 2c — Source must always be recorded

Whatever URL you fetch from — record it. It goes into the `**Source:**` field at the top of the capabilities.md and is logged in any changelog entry. If Motion CLI is the source, write "Motion CLI" explicitly. If WebSearch was used to find the URL, note that too.

---

## Step 3 — Fetch Documentation

Use `WebFetch` to pull the relevant documentation pages. For each integration:
- Fetch the primary URL first (overview / method index)
- Fetch 1-2 secondary pages for depth (key endpoints, auth model, rate limits)
- For Motion: run `motion --help` and key command `--help` calls via Bash instead of fetching web docs

Extract:
- All major capability areas / endpoint groups
- All scopes or permission levels, what each grants, and which endpoints they unlock
- Authentication model and token types
- Rate limits
- Key limitations / what it cannot do
- Any breaking changes or deprecation notices

**Scopes require a separate fetch.** The capabilities docs and scopes docs are usually on different pages. Always fetch both — the capabilities URL and the scopes URL from the Step 2 table. For unknown integrations, search for both: `<name> API documentation` and `<name> API OAuth scopes permissions`.

---

## Step 4 — Write or Update the capabilities.md File

### 4a — New file (integration not yet documented)

Create `/agent/brain/integrations/<name>/capabilities-and-scopes.md` using this structure:

```markdown
# <Integration Name> — Capabilities & Scopes

**Last reviewed:** <YYYY-MM-DD>
**Source:** <exact URL fetched — or "Motion CLI" — or "URL found via WebSearch: <query used>">
**Auth model:** <token type, how stored, allowed hosts>
**Base URL:** <API base URL if applicable>

---

## What <Integration> Is
[1-2 sentence plain-language description of what this integration enables in this org's workflow]

---

## Agent Shell Commands (Primary Interface)
[Only include if a CLI tool exists for this integration (slack, notion, motion, etc.). List all commands and what they do.]

---

## Core Capability Areas

### 1. <Category>
[Table: Endpoint/Method | HTTP method | What it does — sourced directly from the fetched docs]

### 2. <Category>
...

---

## Authentication
[Token format, how to pass it, storage — sourced from fetched docs]

---

## Rate Limits
[Per-method or global limits — sourced from fetched docs]

---

## What <Integration> Cannot Do
[Hard limitations explicitly stated in the API docs. Do not infer limitations not mentioned in the source.]

---

## Scopes

**Source:** <exact URL for the scopes/permissions reference page>

[Table of all scopes or permission levels, what each grants, and which endpoints or methods they unlock. For integrations that use capability models instead of named scopes (e.g. Notion), document the capability tiers and what each one enables. Always sourced from the official docs — never inferred.]

### Key rules
[Any scope inheritance, superset/subset relationships, or important gotchas stated in the docs.]

---

*Auto-reviewed nightly at 3am ET.*
```

### 4b — Update pass (file already exists)

1. Read the existing capabilities-and-scopes.md
2. Fetch both the capabilities docs and the scopes docs (two separate fetches per the Step 2 table)
3. Compare against the existing file — identify what changed across both sections:
   - New or removed endpoints
   - Deprecated methods
   - Rate limit changes
   - New capability areas
   - Auth changes
   - New, removed, or changed scopes
   - Changes to what a scope grants or which endpoints it unlocks
4. Apply only the changed sections — do not rewrite the whole file if most of it is still accurate
5. Update `**Last reviewed:**` date to today
6. If changes are substantive, note them in the changelog

**Do not write health or connection status into capabilities.md.** Health state belongs in `/agent/brain/integration-health/`. Capabilities files are pure API/capability documentation.

---

## Step 5 — Update the README Index

Read `/agent/brain/integrations/README.md` and update the status table:
- Add any new integration row
- Update Status and Last Reviewed columns for all integrations processed

---

## Step 6 — Log Changes to Changelog

For any file that was materially changed (new endpoints, removed methods, auth updates, rate limit changes):

Write a changelog entry to `/agent/brain/changelog/YYYY-MM-DD.md` using this format:
```markdown
### integration-capabilities-sync — <Integration Name>
**Changed:** <brief description of what was updated>
**Source:** <docs URL that surfaced the change>
**File:** `/agent/brain/integrations/<name>/capabilities.md`
```

If nothing changed in a file, no changelog entry is needed.

---

## Step 7 — Update /agent/INDEX.md

For any new capabilities.md file created this run, add an index entry:

```
- **path:** `/agent/brain/integrations/<name>/capabilities.md`
  **aliases:** <name> capabilities, <name> API, what can <name> do, <name> integration
  **note:** Capability one-pager for the <Name> integration. Sourced from official API docs. Use to check what endpoints, methods, and limits apply before building against this integration.
  **created:** <YYYY-MM-DD>
  **updated:** <YYYY-MM-DD>
```

---

## Step 8 — Reply Summary

After completing the run, report:
- Which integrations were processed (new vs. updated)
- Any material changes found (new endpoints, deprecations, auth changes)
- Any integrations that couldn't be documented (docs URL not found, fetch failed)
- Current status of each integration (from health state)

Keep the reply concise. Lead with changes, not a full enumeration of what stayed the same.

---

## Error Handling

| Situation | Action |
|---|---|
| WebFetch fails on docs URL | Try WebSearch for the official docs URL, retry once. If still failing, note in the capabilities.md that docs were unreachable and timestamp it. Do not delete existing content. |
| Integration in health state has no known docs URL | WebSearch `<name> REST API documentation` to find the right URL |
| Health state file missing or unreadable | Fall back to listing `/agent/brain/integrations/` subdirectories as the integration list |
| Integration status is "broken" | Still document capabilities as normal. Health state is not written into capabilities.md. |
| capabilities.md already accurate / no changes | Skip changelog entry, still update `Last reviewed` date |

---

## Nightly Routine Content Template

When this skill is called by the nightly reminder, use this as the instruction content:

> Run the integration-capabilities-sync skill. Full procedure: `/agent/.agents/skills/integration-capabilities-sync/SKILL.md`. 
> 
> This is the nightly maintenance pass. For every integration in the health state:
> 1. Fetch the official API documentation (use known URLs from the skill's Step 2 table, or WebSearch if unknown)
> 2. Compare against the existing capabilities.md
> 3. Update only changed sections
> 4. Update the Last reviewed date
> 5. Log material changes to changelog
> 6. Update the Last Reviewed column in the README index
> 7. Update /agent/INDEX.md for any new files created this run
> 
> Also check: are there any integrations in health state with no capabilities.md? If yes, create new files for them. Report what changed.
