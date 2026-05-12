---
name: integration-onboarding
description: |
  Runs when a new integration is connected. Four-phase flow: quick capability
  capture, context reading to choose depth and type, then either a lightweight
  path (validate specific use case, offer to go deeper) or a full deep dive
  (community intelligence, live verification, type-specific protocol).

  Quirks are the system's problem, not the user's. Find them proactively, solve
  them with creative workarounds, and surface to the user only as a true last
  resort after every other option is exhausted.

  Outputs per run:
  1. capabilities-and-scopes.md — official docs + community intel + verified vs. theoretical
  2. quirks.md — pre-populated and solved before first use
  3. Visible summary + path decision with offer to go deeper (lightweight)
     or full activation handoff (deep dive)

user-invocable: true
---

## Trigger

**Primary:** `automationKind: "oauth_connection"` — fires when OAuth completes.
**Manual:** "run integration-onboarding for [name]", or to re-run on any connected integration.

---

## The quirk philosophy

This is the most important rule in this skill.

**Quirks are the system's problem, not the user's.** Every platform has them.
Your job is to find them before the user does, solve them with whatever tools
are available, and build integrations that work despite them.

**The workaround hierarchy — exhaust in order:**
1. Handle it in the sync script client code (best — user never knows it existed)
2. Calculate or reconstruct from other available fields
3. Use a different endpoint or approach that avoids the limitation
4. Cache or pre-compute to avoid hitting the limitation in the first place
5. Implement retry logic, chunking, or batching to work around rate/size limits
6. Warn the user proactively and specifically before they hit it (acceptable)
7. Ask the user only if they are demonstrably data-savvy and may have account-level info you genuinely need
8. Say it can't be done — **only after exhausting 1-7, and you should be genuinely disappointed you got here**

"Can't do this" is a last resort, not a first response. Most things can be done
with creative enough application of available tools. The instinct should always
be to find a path, not to surface a blocker.

---

## Phase 0 — Quick capability capture (always, runs first, fast)

Goal: give the system enough to answer questions about this integration immediately.
This phase completes in one fetch. Do not wait for deeper research.

1. Extract the integration name from the automation turn or user message
2. Fetch official API docs (use known-URL table from integration-capabilities-sync skill, or WebSearch)
3. Write `/agent/brain/integrations/<name>/capabilities-and-scopes.md` with:
   - What the integration is (2 sentences)
   - Core capability areas from the docs
   - Auth model and scopes granted
   - Data risks (what can be read, what can be written, what's sensitive)
   - `## Verified vs. Theoretical` section — mark everything as `theoretical` for now
4. Update `/agent/INDEX.md` and `/agent/brain/integrations/README.md`

This file will be enriched in later phases. Its job right now is to exist.

Return to the user:
```
**[Integration] is connected.**

**What it does**
[2-3 sentences from docs]

**What you can do with it now**
[4-6 verb-led bullets from docs, in plain language]

**What to be aware of**
[3-5 bullets on limits, constraints, notable quirks from docs]

**Data access**
[Specific: what this integration can read, write, and what's sensitive]
```

---

## Phase 1 — Context reading (always, runs after Phase 0)

Read the conversation, team file, and any stated reason for connecting
to answer three questions. Be explicit about your conclusion.

### 1a — Who is setting this up?

**Full deep dive signals:**
- They manage the integration for others ("setting this up for the team")
- Data, engineering, or technical role
- No specific immediate use case — establishing the integration generically
- First time this integration has been connected in this sandbox

**Lightweight signals:**
- Specific immediate question ("I need to pull X data")
- End user, not a setup person
- Quick extension of an already-established integration
- Casual mention alongside another task

**Default when ambiguous:** Lightweight + offer to go deeper.

### 1b — What's the immediate job?

Look for signal words:
- "set up", "onboard", "connect", "establish" → full deep dive
- "pull", "check", "get", "show me", "I need" → lightweight
- No stated job → lightweight + offer

### 1c — What type of integration?

Classify using `/agent/brain/integrations/INTEGRATION-TYPE-PROTOCOLS.md`.
The five types and their signals:

| Type | What to look for |
|---|---|
| 1 — Performance data platform | Ad metrics, spend, impressions, creative performance, ROAS, CPA |
| 2 — Attribution / cross-platform | Multi-touch, attribution, unified ROAS, joining ad data |
| 3 — Capability tool | Research, enrichment, AI, point-in-time answers |
| 4 — Workspace / organizational | Docs, projects, tasks, team communication, knowledge base |
| 5 — Customer / business intelligence | CRM, orders, pipeline, revenue, customer data |

If it doesn't fit cleanly, name the primary job and propose a hybrid.

**Ambiguity rule — always applies before building anything:**

Some platforms serve meaningfully different audiences from the same API surface.
This is not a minor variation — it produces completely different schemas, queries,
and data layers. Getting it wrong means a full rebuild.

Before classifying, ask: **could this platform be used as two different types
by two different customers?**

Platforms that commonly hit this:
- AppLovin — advertiser UA platform (Type 1: spend, installs, ROAS) OR publisher
  monetization (Type 1: revenue, eCPM, fill rates). Same API key, different
  `report_type`, completely different data.
- Google — Ads (Type 1 advertiser) vs. AdSense (Type 1 publisher) vs. Analytics
  (Type 4 org context) vs. Sheets (Type 4 workspace).
- Amazon — Advertising (Type 1) vs. Marketplace (Type 5 revenue).
- Twitter/X — Ads (Type 1) vs. organic analytics (Type 3 capability).

**If two types are both plausible given only the platform name and key:**
Do not guess. Do not build. Ask one specific question before Phase 2:

> "AppLovin can be used as an advertiser UA platform (spend, installs, ROAS)
> or as a publisher monetization tool (ad revenue, eCPM, fill rates). Which
> is this?"

This single question prevents a full data layer rebuild. It is never too early
to ask it and never acceptable to skip it when the ambiguity is real.

**Rule: if the type classification would produce different schemas or query
templates depending on which interpretation is correct, treat it as ambiguous
and ask before Phase 2B.**

### 1d — State your decision explicitly

Before moving to Phase 2, say in plain language:
- Who you think is setting this up and why
- What the immediate job appears to be
- What type the integration is
- Which path you're taking and why

Example: *"This looks like a team setup of a performance data platform — you're
connecting TikTok Ads and haven't named a specific immediate question, so I'm
running the full flow. I'll come back with a complete picture of how this platform
actually behaves and what to build around it."*

Example: *"You need to pull a specific piece of attribution data to answer
a question you're working on right now, so I'll validate those specific endpoints
and get you what you need. I can do a full setup whenever you're ready."*

---

## Phase 2A — Lightweight path

**When:** Specific immediate use case, or ambiguous context.

### Step A1 — Identify the specific need

From the conversation: what exactly does the user need from this integration?
Be precise: which endpoint, which data object, which fields.

### Step A2 — Validate those specific endpoints

Make real API calls for the specific use case only:
1. Test the auth — confirm it works exactly as documented (most common failure point)
2. Call the specific endpoint(s) needed
3. Verify the fields the user needs are actually present and in the expected format
4. Check for any immediate quirks that would affect this specific use case

**Apply the quirk hierarchy** — if something is wrong, fix it silently or note
the fix before surfacing anything to the user.

### Step A3 — Deliver what was needed

Return the answer to the user's immediate question if possible, or clear
confirmation that the endpoint is working with the right data.

Update capabilities-and-scopes.md with what was verified.
Write any quirks found to quirks.md with fixes applied.

### Step A4 — Offer to go deeper

End with a single offer, not a pitch:

> "That specific endpoint is working. If you want, I can do a full setup —
> community research, live testing across all endpoints, a practical guide
> to how this platform actually behaves, and a data layer — sync script, schema, and query library. Worth doing
> when you have a moment."

---

## Phase 2B — Full deep dive path

**When:** Team setup, technical person, no specific immediate use case.

### Step B1 — Community intelligence sweep

Run in parallel with or immediately after Phase 0.

Search for:
1. `"<integration>" API python client github OR "<integration>" API SDK github` — community CLIs and wrappers
2. `"<integration>" MCP server github` — MCP implementations
3. `"<integration>" API issues quirks undocumented site:github.com`
4. `"<integration>" API "rate limit" actual real undocumented`
5. `"<integration>" API gotcha OR workaround OR "doesn't work"`

For each finding, extract:
- Undocumented endpoints community tools use
- Known behavioral quirks
- Workarounds people have documented
- Auth patterns that differ from official docs

Classify each finding:
- `undocumented-endpoint` → add to capabilities file
- `behavior-discrepancy` → add to practical guide + pre-emptive quirk
- `business-logic-required` → add to practical guide
- `auth-quirk` → solve in client code immediately
- `rate-limit-reality` → implement backoff + caching strategy
- `null-field-condition` → build field-reconstruction fallback

**The instinct is to solve, not to document.** For every quirk found:
- Can you handle it in code? → do it
- Can you reconstruct from other fields? → do it
- Does the user ever need to know? → only if you genuinely can't solve it

### Step B2 — Live verification

Make targeted API calls against the connected account:

1. **Auth format** — test before anything else, most common failure
2. **Core list endpoint** — check all documented fields are present, none null unexpectedly
3. **Single resource endpoint** — compare field names and types to schema exactly
4. **Any field community research flagged** — validate specifically
5. **Rate limit headers** — compare to documented limits, note actual values

For each discrepancy found, apply the quirk hierarchy immediately.
Solved quirks go to quirks.md as `handled-in-code`.
Unsolved quirks go as `unhandled` and appear in doctor output.

Update capabilities-and-scopes.md Verified vs. Theoretical section.

### Step B3 — Integration type protocol

Read the type identified in Phase 1c.
Apply the corresponding protocol from `/agent/brain/integrations/INTEGRATION-TYPE-PROTOCOLS.md`:

- **Type 1:** Design SQL schema first. All query templates derive from schema.
- **Type 2:** Find the join key. Build joining protocol. Design unified view schema.
- **Type 3:** Document call pattern. Identify invocation moment. Cache strategy.
- **Type 4:** Context sweep is primary value. Identify write-back targets.
- **Type 5:** Design entity schema. Note privacy requirements.

The type protocol shapes everything downstream: what the data layer looks like,
what the practical guide covers, what the activation proposes.

### Step B4 — Initialize integration files and pre-populate quirks

**Always create these stub files first, even if empty, so downstream routines
never fail on a missing file:**

```
/agent/brain/integrations/<name>/quirks.md      ← stub if no quirks yet
/agent/brain/integrations/<name>/usage-patterns.md  ← always stub
/agent/brain/integrations/<name>/practical-guide.md ← written in activation
```

Stub format for usage-patterns.md:
```markdown
# <Integration> Usage Patterns

> Updated after sessions involving this integration's data layer.
> Layer 2 — loaded when this integration is in use.
> Protocol: /agent/brain/integrations/USAGE-FEEDBACK-PROTOCOL.md

*No patterns documented yet. Patterns accumulate from usage.*
```

Write `/agent/brain/integrations/<name>/quirks.md`.

For every quirk found — community research or live verification:
- If solved in code: `handled-in-code`, document the fix
- If handled by warning: `handled-by-warning`, document when warning fires
- If genuinely unsolvable: `unhandled`, document why every workaround failed
  (this should be rare and you should feel bad about it)

The goal is to arrive at integration-activation with zero unhandled quirks,
or at most one or two with clear notes on why they couldn't be solved.

### Step B5 — Update capabilities file

Update capabilities-and-scopes.md with:
- `## Community Intelligence` — undocumented endpoints + community patterns found
- `## Verified vs. Theoretical` — what was confirmed live vs. theoretical
- `## Known Constraints` — all quirks, with status

Then hand off to integration-activation.

---

## Returning the summary

**Lightweight path:** Return the Phase 0 summary + answer to immediate question
+ offer to go deeper. Keep it short. Don't describe the setup process.

**Full deep dive path:** Return the Phase 0 summary briefly, then note the
path decision, then hand off to integration-activation which produces the
full proposal. The user sees one coherent response.

---

## Error handling

| Situation | Resolution path |
|---|---|
| Auth fails immediately | Debug before surfacing. Check: Bearer vs. raw token, header name casing, token expiry, account permissions. Try all variations. Surface only if all fail with a specific diagnosis. |
| Docs URL not found | Search harder. Try: `<name> API reference`, `<name> developer docs`, `<name> REST API`, `<name> GraphQL API`. If still not found, proceed with community intelligence only. |
| Rate limit hit during verification | Back off and retry with exponential delay. Reduce scope of verification. Never tell the user the API is rate-limited — just make fewer calls. |
| Live verification returns unexpected data | This is valuable information. Document it, build a workaround, update the capabilities file. Don't surface as an error. |
| Integration type unclear | Name the primary job, propose the closest type, note the hybrid nature in the practical guide. |
| Platform serves two meaningfully different audiences | Do not classify. Ask one specific question: "This platform can be used as X or Y — which is this?" Never build a data layer on an ambiguous type. |
| API key requires URL query parameter injection | `secure-fetch` only supports header injection. Try header auth first — most APIs support both. If truly query-param only, the agent uses `secure-fetch` to fetch and save the response, then passes the saved file to python3 for processing. The secret never enters a Python process. Document as Q-001 in quirks.md. Never tell the user to change `allowedCliCommands` — users cannot configure this. |
| Skill file fetch returns truncated content | Retry at higher `max_chars`. Large skill files (activation, context-sweep) commonly exceed 20KB. Always verify the file ends correctly before writing — a truncated SKILL.md is worse than no file. |

---

## Skill changelog

| Date | Version | Change |
|---|---|---|
| 2026-05-12 | v2.1.0 | Ambiguous-type rule: if platform serves two meaningfully different audiences, ask before building. usage-patterns.md stub created during onboarding. URL query-param auth documented as error case. Truncated fetch retry guidance added. |
| 2026-05-11 | v2.0.0 | Complete rewrite. Four-phase model (quick capture, context reading, lightweight/deep dive paths). Lightweight default with offer to go deeper. Quirk-solving philosophy: solve first, surface as last resort. Integration type classification in Phase 1. Type-specific protocols from brain-integration-type-protocols.md. Community intelligence sweep and live verification moved to deep dive path only. |
| 2026-05-11 | v1.3 | Community intelligence sweep, live spot-check, pre-populate quirks. |
| 2026-05-09 | v1.2 | Added activation handoff. |
| 2026-05-08 | v1.1 | Added data risks section. |
| 2026-05-08 | v1.0 | Initial version. |
