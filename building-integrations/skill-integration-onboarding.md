---
name: integration-onboarding
description: |
  Runs when a new integration is connected in chat. Triggered by the platform's
  oauth_connection automation turn. Goes beyond official API documentation to build
  a full intelligence picture: official docs, community-discovered behavior, and
  live verification against the connected account.

  Three outputs per run:
  1. A durable capabilities-and-scopes.md written to /agent/brain/integrations/<name>/
     — enriched with Verified vs. Theoretical section and community intelligence
  2. A pre-populated quirks.md seeded with known issues from community research
  3. A visible customer-facing summary returned in the conversation

user-invocable: true
---

## Purpose

Every time a customer connects an integration, they should immediately understand what it does, what they can do with it, and what risks or permissions they've accepted — all sourced from the official API documentation, not from memory or inference.

This skill owns that moment. It runs once per connection event and produces both a durable knowledge artifact and a human-readable response in the same turn.

---

## Trigger

**Primary:** `automationKind: "oauth_connection"` automation turn fired by the Motion platform when an OAuth flow completes in chat.

**Manual:** Can also be invoked directly — "run integration-onboarding for [integration name]" — for testing or to re-generate a capabilities file for an existing integration.

---

## Inputs

| Input | Source | Required |
|---|---|---|
| Integration name | Extracted from automation turn text (e.g. "Notion is now connected" → `Notion`) | Yes |
| Docs URL | Resolved in Step 2 | No — skill finds it |

When invoked manually, the integration name comes from the user's message.

---

## Step 1 — Extract the Integration Name

From the automation turn text, extract the integration name. The platform text follows the pattern:

> "[Integration Name] is now connected for this sandbox..."

Take the first word or phrase before "is now connected" as the integration name. Normalize to title case (e.g. `notion` → `Notion`, `google-drive` → `Google Drive`).

If invoked manually, use the name provided by the user.

---

## Step 2 — Resolve the API Documentation URLs

Use the URL resolution logic from `/agent/.agents/skills/integration-capabilities-sync/SKILL.md` — specifically Step 2a (known integrations table) and Step 2b (WebSearch for unknowns).

Two URLs are needed:
- **Capabilities URL:** Overview of endpoints, methods, and what the API can do
- **Scopes URL:** OAuth scopes or permission model — what was granted when the customer connected

If the integration is not in the known-URL table, run two WebSearch queries:
1. `<integration name> official API documentation reference`
2. `<integration name> OAuth scopes permissions reference`

Evaluate results for official developer docs only. No third-party summaries, blog posts, or aggregators.

**If no credible source is found for either URL:** Proceed with what you have. If neither URL resolves, write a stub capabilities-and-scopes.md and note that docs could not be located. Return the customer summary based on the integration name alone, making clear that documentation was not available.

---

## Step 2b — Community Intelligence Sweep

Official API documentation describes intended behavior. Community tools,
GitHub issues, and forum threads describe actual behavior. Run this sweep
in parallel with or immediately after Step 2.

**Cardinal rule:** Label everything by source. Never mix community-discovered
behavior with official docs without flagging which is which.

### 2b-i: Search for community tools

Run these searches. Use WebSearch for each:

1. `"<integration name>" API CLI github` — find community CLIs and wrappers
2. `"<integration name>" MCP server github` — find MCP implementations
3. `"<integration name>" SDK github stars:>50` — find popular SDKs
4. `site:github.com "<integration name>" API "gotcha" OR "quirk" OR "undocumented"` — find known pain points
5. `"<integration name>" API "rate limit" actual OR real OR undocumented` — find real rate limit behavior

For each tool or repo found, read the README and skim open issues. Extract:
- Features it implements that the official docs don't mention
- Issues reporting unexpected API behavior
- Workarounds people have documented
- Auth patterns that differ from official docs

Build an **absorb manifest**: a running list of every feature or behavior
found across all community tools. This is what "absorb and transcend" means
in practice — know everything the community knows before building anything.

### 2b-ii: Search for practical guides and known issues

Run these additional searches:

1. `"<integration name>" API "doesn't work" OR "broken" OR "bug" site:stackoverflow.com OR site:reddit.com`
2. `"<integration name>" API undocumented endpoints OR hidden API`
3. `"<integration name>" API "pagination" issues OR limits` — pagination edge cases are almost always underdocumented
4. `"<integration name>" webhook OR "null" OR "empty" unexpected` — find silent failure modes

### 2b-iii: Classify community findings

For each finding, classify it:

| Class | What it means | Where it goes |
|---|---|---|
| `undocumented-endpoint` | Real endpoint not in official docs | capabilities-and-scopes.md Community section |
| `behavior-discrepancy` | API behaves differently than docs say | Verified vs. Theoretical section + pre-emptive quirk |
| `business-logic-required` | Raw API usable only with additional logic on top | practical-guide.md in activation |
| `rate-limit-reality` | Real rate limits differ from documented | quirks.md pre-emptive entry |
| `auth-quirk` | Auth format or flow differs from docs | quirks.md pre-emptive entry, high priority |
| `null-field-condition` | Field returns null under undocumented conditions | quirks.md pre-emptive entry |
| `community-pattern` | Approach commonly used by community tools | practical-guide.md in activation |

---

## Step 3 — Fetch the Documentation

Fetch both URLs using WebFetch. These are two separate calls.

From the capabilities fetch, extract:
- What the integration is and its core job
- Major capability areas (endpoint groups, method categories)
- Authentication model
- Key limitations

From the scopes fetch, extract:
- All scopes or permission tiers granted at connection time
- What each scope allows the integration to access
- Any sensitive permissions (e.g. read message history, access private repos, read email addresses)
- Data access implications for the customer's workspace

Do not infer or assume capabilities not stated in the fetched source. If a page is truncated or returns limited content, note it in the capabilities file.

---

## Step 3b — Live Spot-Check

Make 3-5 real API calls against the connected account and compare the actual
responses to what the official docs promised. This is not a full test suite —
it's a targeted probe of the highest-risk discrepancies.

**What to probe:**

1. **Auth format** — Does the auth mechanism work exactly as documented?
   The most common source of day-one failures. Test it first.

2. **A core list endpoint** — Fetch the most commonly used collection
   (issues, pages, ads, items). Check: are all documented fields present?
   Are any null that the docs don't flag as optional? What's the real
   pagination behavior?

3. **A single-resource endpoint** — Fetch one item by ID. Compare field
   names and types to the schema exactly. Note any discrepancies.

4. **An edge case field** — Pick one field the community sweep flagged as
   commonly null or behaving unexpectedly. Test it.

5. **Rate limit signal** — Check response headers for rate limit information.
   Compare to documented limits. Note if real limits appear lower.

**For each call, record:**
- What the docs promised
- What actually came back
- Verdict: `confirmed` | `discrepancy` | `undocumented-field-present` | `documented-field-missing`

**Discrepancies become pre-emptive quirks** — write them to
`/agent/brain/integrations/<name>/quirks.md` immediately with status
`handled-by-warning` or `unhandled` depending on severity.

**If live calls are not possible** (no auth, rate limit concern, read-only
scope limitation): skip this step, note it in the capabilities file, and
flag that live verification has not been run.

---

## Step 4 — Write the Capabilities-and-Scopes File

Create `/agent/brain/integrations/<name>/capabilities-and-scopes.md` using the template from Step 4a of `/agent/.agents/skills/integration-capabilities-sync/SKILL.md`.

Required fields:
- `**Last reviewed:**` — today's date
- `**Sources:**` — official docs URL + community tools found (names and URLs)
- `**Live verified:**` — yes / partial / no, with date
- All capability sections sourced from the fetched docs
- A `## Scopes` section sourced from the scopes fetch
- A `## Community Intelligence` section (new — see below)
- A `## Verified vs. Theoretical` section (new — see below)
- A `## Known Constraints` section updated with any pre-emptive quirks

**## Community Intelligence section** — required when community sweep found anything:
```
## Community Intelligence

Sources reviewed: [list community tools and repos consulted]

Undocumented endpoints found:
- [endpoint, source, confidence level]

Behavior patterns from community tools:
- [pattern, what tools use it, why]

Known issues from community:
- [issue, source, how common]
```

**## Verified vs. Theoretical section** — required when live spot-check ran:
```
## Verified vs. Theoretical

Live verified: [date]

| Claim | Source | Verified? | Notes |
|---|---|---|---|
| [what docs say] | Official docs | ✓ confirmed / ✗ discrepancy / ⚠ partial | [what actually happened] |
```

If no live verification was run, this section must still appear:
```
## Verified vs. Theoretical

Live verified: not yet run

Official docs have not been independently verified against this account.
Treat all capabilities as theoretical until verified. Run integration-onboarding
manually with a live account to complete verification.
```

If a file already exists at that path, overwrite it — this is a fresh connection and the file should reflect current docs and latest community intelligence.

---

## Step 4b — Pre-Populate Quirks File

Create or update `/agent/brain/integrations/<name>/quirks.md`.

Write entries for every finding from Steps 2b and 3b that represents a
real platform behavior that could surprise or block a user:

- All `auth-quirk` findings → status `handled-by-warning` or `unhandled`
- All `behavior-discrepancy` findings → status `unhandled` until CLI is updated
- All `rate-limit-reality` findings → status `handled-by-warning`
- All `null-field-condition` findings → status `handled-by-warning`

For each entry, fill in every field from the quirks protocol:
- Symptom (what a user would see)
- Platform behavior (what's actually happening)
- Detection signal (how to catch it programmatically)
- Fix/workaround (what to do about it)
- Wired into: checked off as fixes are implemented

**This pre-empts the most common integration failures before anyone hits them.**
A quirk found through community research and written before first use
is infinitely better than a quirk discovered by a frustrated user.

If no quirks were found through community research or live verification:
create the file with the standard empty header, noted as verified-clean.

---

## Step 5 — Update the Index Files

**Update `/agent/brain/integrations/README.md`:**
- Add a new row to the Connected Integrations table if this integration is not already listed
- If already listed, update the Last Reviewed date

**Update `/agent/INDEX.md`:**
- Add an index entry for the new capabilities-and-scopes.md if it does not already exist
- If an entry exists, update the `updated` date

---

## Step 6 — Generate the Customer-Facing Summary

Using only the content fetched in Step 3 — not memory, not inference — write the three-part customer summary.

### What it does
2-3 sentences in plain language. No jargon. Answer: what is this tool and what is its core job? Write for someone who may not be technical.

### What you can do with it now
4-6 bullet points. Each starts with a verb. Focus on the highest-value actions the customer can take immediately — the things most likely to be useful to them. Derive these from the capability areas in the docs, translated into plain language.

Good: "Search and read your Notion pages and databases directly from chat."
Bad: "Access the GET /pages endpoint to retrieve page objects."

### What to be aware of
3-5 bullet points covering rate limits, notable limitations, and anything explicitly flagged as a constraint in the docs.

### Data risks (required — never skip)
This section must always be present. It exists specifically so that collaborators and above have a full picture of what they are granting access to before they proceed.

Answer all of the following that apply, sourced from the scopes fetch:
- **What data can this integration read?** Be specific — e.g. "can read all messages in channels it belongs to," "can read private repository code and commit history."
- **What data can it write or modify?** E.g. "can post messages, create issues, delete files."
- **What external systems can now see your data?** If the integration connects to a third-party platform, name it explicitly.
- **Who in the org is affected?** If the scopes grant access to workspace-wide data (not just the connecting user's data), say so.
- **Any sensitive permission worth flagging?** Email addresses, private content, financial data, org membership lists — name them directly.

Do not fabricate risks. Do not omit real ones. If the scopes are limited and the data risk is genuinely low, say that explicitly — "this integration has read-only access to public data only" is a valid and useful answer.

---

## Step 7 — Return the Visible Response

Return the customer-facing summary using this exact format:

```
**[Integration Name] is connected.**

**What it does**
[2-3 plain language sentences from Step 6]

**What you can do with it now**
[4-6 verb-led bullets from Step 6]

**What to be aware of**
[3-5 bullets covering rate limits, limitations, and constraints from Step 6]

**Data risks**
[Required. Specific bullets sourced from the scopes fetch covering: what data this integration can read, what it can write, what external systems can see your data, whether workspace-wide data is affected, and any sensitive permissions granted. If risk is genuinely low, state that explicitly.]
```

Do not mention:
- The capabilities-and-scopes.md file or any internal file creation
- The brain, skills, automation turns, or OAuth mechanics
- That any documentation was fetched
- Any internal system language

This is a customer-facing moment. Keep it clear, useful, and human.

---

## Step 8 — Hand off to integration-activation

After returning the customer-facing summary, immediately run the
`integration-activation` skill in the same turn.

The two outputs should feel like one coherent response:
- The onboarding summary establishes the foundation (what it is, what you can
  do, what to be aware of)
- The activation section makes it personal and actionable (what we're going
  to do with it for you, specifically)

Separate them visually with a horizontal rule or clear heading break.
Do not repeat information from the onboarding summary in the activation section.

If the activation skill cannot run (integration has no live API to query,
no person context available), return the onboarding summary alone and note
that a deeper activation pass can be run manually later.

---

## Error Handling

| Situation | Action |
|---|---|
| Integration name cannot be extracted from automation text | Ask the user: "Which integration did you just connect?" Then proceed. |
| Docs URL not found after WebSearch | Write a stub capabilities-and-scopes.md noting docs were not located. Return a summary based on the integration name with a note that the full documentation couldn't be retrieved. |
| WebFetch returns empty or irrelevant content | Retry once with the secondary URL from the known-URL table. If still empty, treat as docs-not-found. |
| Capabilities file path already exists | Overwrite. A new connection should always produce a fresh file from current docs. |
| INDEX.md or README.md update fails | Log the failure in the one-pager. Return the customer summary regardless — the visible response is not contingent on the index update succeeding. |

---

## Skill Changelog

| Date | Change |
|---|---|
| 2026-05-08 | v1.1 — Added required Data risks section to Step 6 and Step 7 format. Data risks must always be present and sourced from scopes fetch. Covers read/write access, external data exposure, workspace-wide scope, and sensitive permissions. |
| 2026-05-11 | v1.3 — Added Step 2b (community intelligence sweep), Step 3b (live spot-check), Step 4b (pre-populate quirks). capabilities-and-scopes.md now includes Community Intelligence and Verified vs. Theoretical sections. Quirks file seeded from community research before first use. |
| 2026-05-09 | v1.2 — Added Step 8: hand off to integration-activation after returning customer summary. |
| 2026-05-08 | v1.1 — Added required Data risks section. |
| 2026-05-08 | Initial version. |
