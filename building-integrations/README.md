# building-integrations

> For an interactive walkthrough of every file in this use case, open `overview.html`.

**When an integration connects, your agent reads the context, chooses the right depth, applies the right protocol for the type of integration, and solves every quirk it finds before the user ever sees one.**

---

## Platform-specific docs

The [`platforms/`](./platforms/) folder contains one file per integration. Each file is auto-maintained by the daily `integration-tips-pr` routine, which scans real Runneth conversations to surface tips, workarounds, and verified patterns. Review and merge the daily PRs each morning.

| Platform | Doc |
|----------|-----|
| Slack | [platforms/slack.md](./platforms/slack.md) |
| Notion | [platforms/notion.md](./platforms/notion.md) |
| Linear | [platforms/linear.md](./platforms/linear.md) |
| HubSpot | [platforms/hubspot.md](./platforms/hubspot.md) |
| Gong | [platforms/gong.md](./platforms/gong.md) |
| Intercom | [platforms/intercom.md](./platforms/intercom.md) |
| BigQuery | [platforms/bigquery.md](./platforms/bigquery.md) |
| GitHub | [platforms/github.md](./platforms/github.md) |
| X / Twitter | [platforms/x-twitter.md](./platforms/x-twitter.md) |
| Anthropic | [platforms/anthropic.md](./platforms/anthropic.md) |
| Google Drive | [platforms/google-drive.md](./platforms/google-drive.md) |
| Google Calendar | [platforms/google-calendar.md](./platforms/google-calendar.md) |
| Granola | [platforms/granola.md](./platforms/granola.md) |
| LaunchDarkly | [platforms/launchdarkly.md](./platforms/launchdarkly.md) |
| Apollo | [platforms/apollo.md](./platforms/apollo.md) |
| Tavus | [platforms/tavus.md](./platforms/tavus.md) |
| Datadog | [platforms/datadog.md](./platforms/datadog.md) |

---

---

## What this enables

**At connection time — one response, three layers:**

**1. Onboarding — context-aware, four phases.**

Phase 0 always runs: quick docs fetch, capability overview written immediately so questions can be answered right away. Phase 1 reads the context — who is setting this up, what's the immediate job, what type of integration is this — and chooses the path.

**Lightweight path** (default when context is ambiguous): validate the specific endpoints needed, solve any quirks found, deliver the answer, offer to go deeper. No friction for quick pulls.

**Full deep dive** (team setup, technical person, no specific immediate use case): community intelligence sweep (GitHub CLIs, MCP servers, issue discussions, forum threads), live verification against the connected account, behavioral analysis, type-specific protocol. Quirks are found and solved before the proposal is delivered, never blocked on them.

**2. Integration type taxonomy — five types, each with its own protocol.**

| Type | Examples | Primary job | What's different |
|---|---|---|---|
| Performance data | Meta, TikTok, Google Ads | Ad performance analysis | SQL schema design first; compound analysis commands |
| Attribution / cross-platform | Northbeam, Triple Whale | Unified ROAS, join ad + attribution data | Join key discovery; reconcile + orphaned commands |
| Capability tool | Research APIs, AI tools | Add a specific capability | Lightweight; no sync needed; invocation pattern focus |
| Workspace / org | Notion, Linear, GitHub | Org context in + outputs out | Context sweep heavy; write-back targets identified |
| Customer / BI | Salesforce, Shopify | Queryable business data | Entity schema design; privacy handling |

**3. Activation — type-specific proposals and practical guide.** Workflows are designed around the integration type. A performance data activation proposes top-performers and shift commands. An attribution activation proposes a unified view and reconcile workflow. Each activation produces a practical guide — the "how to actually use this" document that captures business logic, undocumented behavior, and verified working patterns.

**4. Context sweep.** Deep content pull with three-layer retrieval wiring. Every gap resolved. Nothing filed without a retrieval path.

**Quirk philosophy throughout:** Quirks are found proactively, solved silently, and surfaced to the user only if every workaround has genuinely been exhausted. The user should rarely know a quirk existed.

**Over time — the system compounds:**

**Sync script + query library.** For data-heavy integrations (Types 1, 2, and 5), builds a Python sync script that pulls data into a local SQLite store with quirk handling baked in, and a library of named SQL query templates. The agent runs queries directly — more flexible than a CLI, no compilation needed, and the named library grows over time as new patterns emerge.

**Quirks protocol.** When a platform behaves unexpectedly, the quirk is documented immediately and wired so it cannot surface as a user problem twice. Unhandled quirks always appear in the CLI doctor output.

**Usage feedback.** Command usage accumulates into patterns. Person-specific preferences write back to team files. New compound command ideas route through the learning loop. The CLI prioritizes what actually gets used.

---

## What gets installed

| File | Installs to | What it does |
|---|---|---|
| `skill-integration-onboarding.md` | `/agent/.agents/skills/integration-onboarding/SKILL.md` | Fires on OAuth connection. Fetches API docs, writes capabilities file, returns basic summary, hands off to activation. |
| `skill-integration-activation.md` | `/agent/.agents/skills/integration-activation/SKILL.md` | Person context + live platform detective work + cross-integration mapping. Produces personal proposal and first action. Hands off to context sweep. |
| `skill-integration-context-sweep.md` | `/agent/.agents/skills/integration-context-sweep/SKILL.md` | Deep content sweep. Three-layer retrieval wiring. All gaps resolved. Sweep report shows what was added and when each piece will be referenced. |
| `skill-integration-builder.md` | `/agent/.agents/skills/integration-builder/SKILL.md` | Builds a Python sync script, SQLite schema, named SQL query library, and health check for data-heavy integrations (Types 1, 2, 5). Agent runs everything directly — no compilation. |
| `brain-quirks-protocol.md` | `/agent/brain/integrations/QUIRKS-PROTOCOL.md` | Per-integration quirks.md format, never-twice wiring checklist, doctor command requirements. |
| `brain-usage-feedback-protocol.md` | `/agent/brain/integrations/USAGE-FEEDBACK-PROTOCOL.md` | What gets tracked from CLI usage, how it feeds back into CLI design and personalization. |
| `behavior-snippet.md` | Merge into `/agent/user.md` | Session routines for post-session quirks capture and usage observation. |

---

## Install time and requirements

**Install time:** ~2 minutes (file copies only, no build steps)

**Requirements:**
- A Runneth sandbox
- At least one integration connected, or one ready to connect
- `/agent/brain/integrations/` directory (created by this use case on first install)

**No tokens required.** All paths are standard agent paths that work in any sandbox.

---

## Setup steps

1. Install via `INSTALL-PROTOCOL.md`
2. **Manual step — merge behavior snippet:** Open `/agent/user.md`. Find the session routines section (the block containing session-open and post-session routines). Add the contents of `behavior-snippet.md` after the existing session-open routine. The sentinel comments (`<!-- use-case: building-integrations -->`) mark the block boundaries for future updates.
3. Connect any integration through the Motion chat interface — the three-stage sequence runs automatically in the same turn

**Content sweep scope:** Each sweep prioritizes by type (SOPs and gap-filling content first, then enrichments) and recency (last 90 days). For large platforms like Notion with hundreds of pages, the sweep works in priority order and surfaces what it covered. Re-run the sweep manually after the first pass to go deeper.

**Quirks and usage files:** These grow over time as integrations are used. Review and summarize them periodically when they exceed ~50 entries to keep context load manageable.

---

## What this creates

After install, the following structure exists or will be populated as integrations connect:

```
/agent/.agents/skills/
  integration-onboarding/SKILL.md       ← updated (community intel + live verify)
  integration-activation/SKILL.md       ← new (behavioral detective + practical guide)
  integration-context-sweep/SKILL.md    ← new
  integration-builder/SKILL.md          ← new (sync script + query library)

/agent/brain/integrations/
  QUIRKS-PROTOCOL.md                    ← new
  USAGE-FEEDBACK-PROTOCOL.md            ← new
  <name>/                               ← created per integration on connection
    capabilities-and-scopes.md          ← official docs + community intel + verified vs. theoretical
    practical-guide.md                  ← how to actually use this (Layer 1)
    activation.md                       ← structural + behavioral detective work
    quirks.md                           ← pre-populated from community research
    usage-patterns.md                   ← populated from CLI usage
```

---

## The retrieval model

Context swept from integrations is assigned to one of three layers:

| Layer | How it loads | When to use |
|---|---|---|
| **Layer 1** | Always loaded for a session type — no keyword matching | Foundational: SOPs, core process docs, key person context. Use deliberately — each Layer 1 document adds load to every relevant session. |
| **Layer 2** | Keyword-triggered via INDEX.md | Important but topic-specific. INDEX entries include explicit "use this when" guidance. |
| **Layer 3** | On-demand | Specialized content surfaced proactively or when asked. |

Every gap found during the sweep gets a layer assignment or an explicit resolution — not an open item.

---

## How Runneth uses this

**Trigger:** `automationKind: "oauth_connection"` event fires when an OAuth flow completes in chat.

**What Runneth reads:** Team files, conversation history, connected integration capabilities, live platform data via the integration's API.

**What Runneth writes:** `capabilities-and-scopes.md`, `activation.md`, brain files for swept context, INDEX.md entries, team file enrichments.

**What Runneth produces:** One coherent response across three stages — foundation, personal proposal, sweep report with retrieval assignments.

**CLI factory trigger:** Invoked manually — "build a CLI for X" or offered automatically by the activation stage when a CLI would genuinely help.

**Post-session:** Quirks and usage patterns captured after any session involving an integration CLI.

---

## Fallbacks

| Situation | Behavior |
|---|---|
| Integration has no live API to query | Activation skips detective work. Returns doc-based proposal only. Notes the constraint. |
| No other integrations connected yet | Activation skips cross-integration section. Notes what compound opportunities would open with future connections. |
| Platform structure is sparse or new | Sweep notes the current state and flags to re-run after the platform fills up. |
| CLI already exists for this integration | cli-factory references the existing CLI instead of building a new one. |

---

## Version history

| Version | Date | Notes |
|---|---|---|
| 3.0.0 | 2026-05-11 | Replaced Go CLI factory with Python sync script + named SQL query library. No compilation. Agent runs everything directly. |
| 2.0.0 | 2026-05-11 | Four-phase onboarding, lightweight/deep-dive paths, integration type taxonomy, proactive quirk-solving philosophy. |
| 1.1.0 | 2026-05-11 | Community intelligence, live verification, behavioral detective work, practical guide. |
| 1.0.0 | 2026-05-11 | Initial release. |
