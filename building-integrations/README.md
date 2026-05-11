# building-integrations

**When an integration connects, your agent builds a complete intelligence picture of how the platform actually behaves — not just what the docs say — then maps how the team uses it, creates a practical guide that makes it useable, and wires everything into the brain so it surfaces at the right moment in every future conversation.**

Official API documentation describes intended behavior. This use case goes further: community intelligence, live verification, and behavioral analysis combine to produce something more valuable than any official docs — a practical guide that reflects how the platform actually works, pre-populated with known quirks before anyone hits them.

---

## What this enables

**At connection time — one response, three layers:**

**1. Onboarding — three intelligence sources, not one.** Official API docs are the starting point, not the source of truth. Onboarding now runs a community intelligence sweep (GitHub SDKs, CLIs, MCP servers, forum threads, issue discussions) and a live spot-check against the connected account to compare actual behavior to documented behavior. The capabilities file includes a Verified vs. Theoretical section. The quirks file is pre-populated with known issues from community research before anyone hits them.

**2. Activation — behavioral detective work + practical guide.** Beyond mapping the team's platform structure, activation now maps how the platform actually behaves: what business logic is required on top of raw API calls, what the best community implementations do that the docs don't suggest, and the highest-risk undocumented behaviors for this team specifically. This produces a practical guide — the "how to actually use this" document that's more valuable than the official docs. Proposals are grounded in real behavior, not theoretical capabilities.

**3. Context sweep.** A deep pull on everything valuable in the integration. SOPs, process docs, research, team context — all classified by type, dispersed to the right locations in the brain, and assigned a retrieval layer so they surface at the right moment in future conversations. Every gap found gets a resolution. Nothing is filed without a defined path back to the surface.

**Over time — the system compounds:**

**CLI factory.** Builds a custom CLI for any connected integration, designed around how the team actually uses the platform. Every CLI includes a doctor command, quirk-aware error handling, a local SQLite store, and a command log that feeds usage patterns back in.

**Quirks protocol.** When a platform behaves unexpectedly, the quirk is documented immediately and wired so it cannot surface as a user problem twice. Unhandled quirks always appear in the CLI doctor output.

**Usage feedback.** Command usage accumulates into patterns. Person-specific preferences write back to team files. New compound command ideas route through the learning loop. The CLI prioritizes what actually gets used.

---

## What gets installed

| File | Installs to | What it does |
|---|---|---|
| `skill-integration-onboarding.md` | `/agent/.agents/skills/integration-onboarding/SKILL.md` | Fires on OAuth connection. Fetches API docs, writes capabilities file, returns basic summary, hands off to activation. |
| `skill-integration-activation.md` | `/agent/.agents/skills/integration-activation/SKILL.md` | Person context + live platform detective work + cross-integration mapping. Produces personal proposal and first action. Hands off to context sweep. |
| `skill-integration-context-sweep.md` | `/agent/.agents/skills/integration-context-sweep/SKILL.md` | Deep content sweep. Three-layer retrieval wiring. All gaps resolved. Sweep report shows what was added and when each piece will be referenced. |
| `skill-cli-factory.md` | `/agent/.agents/skills/cli-factory/SKILL.md` | Builds a custom CLI for any platform based on how the team actually uses it. Generates quirk-aware and usage-tracking code by default. |
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
  cli-factory/SKILL.md                  ← new

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
| 1.1.0 | 2026-05-11 | Added community intelligence sweep and live spot-check to onboarding. Added behavioral detective work and practical-guide.md output to activation. Quirks file now pre-populated from community research before first use. |
| 1.0.0 | 2026-05-11 | Initial release. Three-stage connection flow, CLI factory, quirks protocol, usage feedback, three-layer retrieval model. |
