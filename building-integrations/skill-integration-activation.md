# integration-activation Skill

## What this skill does

Turns a connected integration into delivered value. Where `integration-onboarding`
answers "what can this integration do?", this skill answers "what are we going to
do with it — for you, specifically, right now?"

Runs after `integration-onboarding` completes, in the same turn. Can also be
triggered manually against any already-connected integration.

Three outputs per run:
1. A durable activation plan written to `/agent/brain/integrations/<name>/activation.md`
2. A practical guide written to `/agent/brain/integrations/<name>/practical-guide.md`
   — the "how to actually use this" layer that goes beyond official docs
3. A visible response that proposes specific workflows, names a first action,
   and offers to build tooling — all grounded in who the person is and how
   their team actually uses the platform

---

## Trigger

**Primary:** Called at the end of `integration-onboarding` after the capabilities
file is written and the basic summary is returned. Runs in the same turn,
separated visually from the onboarding summary.

**Manual:** "Activate [integration]", "what can we do with [integration]",
"build something for [integration]", or any request to go deeper on a
connected integration.

**Re-run:** Can be re-run anytime. Overwrites the activation plan with a
fresh read of the current state.

---

## Core principle

The capabilities file exists. The person doesn't need another summary of it.
What they need is someone who has already figured out how to make it useful for
them and is ready to do the work.

Be the colleague who did the homework before the meeting, not the one presenting
the agenda at it.

---

## Step 1 — Read the person

Before touching the integration, understand who connected it.

Read their team file from `/agent/brain/team/`.
Pull out:
- What their actual day-to-day job is (not their title — what they're doing
  this week)
- Recent conversations and what they've been working on
- Any frustrations or manual workflows they've described in passing
- Which integrations they've used before and how
- How they tend to work: do they want to act directly or do they prefer
  having outputs handed to them?

Check conversation history for prior mentions of this platform:
```sql
SELECT m.message_json, c.conversation_json
FROM messages m
JOIN conversations c ON m.conversation_id = c.conversation_id
WHERE json_extract(m.message_json, '$.content') LIKE '%<platform>%'
ORDER BY c.updated_at_ms DESC LIMIT 20
```

If this person has mentioned the platform before — even in passing, even months
ago — that context shapes everything that follows.

---

## Step 2 — Map what's already connected

Read `/agent/brain/integrations/README.md` to see all connected integrations.

For each connected integration, note:
- What it is and what data it holds
- Whether it's been used actively (check usage.json and conversation history)

Then ask: **what compound workflows just became possible that weren't before?**

Each new integration doesn't just add its own capabilities — it multiplies
with what's already there. A few patterns worth checking explicitly:

| If newly connected + already have | Compound opportunity |
|---|---|
| Linear + GitHub | Issue → PR traceability. Catch when issues are "done" in Linear but the PR is still open. |
| Linear + Slack | Sprint status → channel alerts. Surface blockers to the right people without manual updates. |
| Notion + Slack | Docs → delivery. Push brief or report drafts to a channel when they're ready. |
| Notion + Motion | Creative strategy docs → live workspace context. |
| GitHub + Slack | PR review lag. Alert when a PR has been waiting for review for too long. |
| Linear + Notion | Roadmap → docs. Sync project status into living documentation. |
| Any new + Motion | The Motion workspace is always the anchor. How does this new integration feed into or enrich what's already in Motion? |

Document any compound opportunities found — they may surface as proposed
workflows or CLI commands.

---

## Step 3 — Platform detective work

Do NOT skip this step. The capabilities file tells you what the API can do.
This step tells you how this team actually uses the platform.

Query the live platform to understand the real structure. What you're looking for:

### What's alive vs. legacy
Pull every major organizational entity (teams, projects, boards, spaces,
channels — whatever the platform uses). For each, determine:

**Dead/legacy signals:**
- No activity in 45+ days
- Zero active work items
- Names with "(old)", "(archive)", or a year in them
- Members who don't appear in any recent activity

**Alive signals:**
- Work items updated or commented on in the last 14 days
- Members actively moving, creating, or commenting
- Names that match current known initiatives

### Per-person usage patterns
Cross-reference platform members with `/agent/brain/team/` files.
For each known team member who shows up in the platform:
- Which structures do they primarily work in?
- What kinds of work do they create vs. just get assigned?
- What's their rhythm — sprint-based, continuous, reactive?

**Important:** people on the same team often use the same platform in
completely different ways. Map each person separately. This will make
the proposals and any built tooling dramatically more useful.

### The vocabulary
What does this team call things in this platform? Their words, not the
platform's defaults. If they call sprints "cycles" and teams "pods" and
issues "tickets," the CLI commands and proposals should use those words.

### The seams
Where do different groups' work meet or depend on each other?
Where does work tend to stall between groups?
These are the highest-value places to build compound commands.

### Write the internal map
Before forming any proposal, synthesize into a short internal note
(not shown to the user):

```
ALIVE: [list]
DEAD/LEGACY: [list — ignore these in proposals]
PER-PERSON:
  [Name]: works primarily in [X], rhythm is [Y], creates [type of work]
  [Name]: works primarily in [X], rhythm is [Y], creates [type of work]
VOCABULARY: [their words]
SEAMS: [where groups hand off or depend on each other]
COMPOUND OPPORTUNITIES: [from Step 2 cross-integration mapping]
OPEN QUESTION: [the one thing the data genuinely can't answer — if any]
```

---

## Step 3b — Behavioral detective work

The structural detective work in Step 3 maps how the team uses the platform.
This step maps how the platform actually behaves — which is often different
from how the docs say it should behave.

Read the capabilities-and-scopes.md written by onboarding. Specifically:
- The `## Community Intelligence` section — what did community research surface?
- The `## Verified vs. Theoretical` section — what discrepancies were found?
- The `## Known Constraints` section — what limitations are already documented?

Then answer these four questions for this specific integration:

**1. What business logic is required on top of the raw API to get useful results?**
Not every API response is directly usable. Sometimes you need to filter,
normalize, join, or calculate before the data means anything. Examples:
- TikTok: filter ads under 1,000 impressions before calculating engagement rates
- Linear: the "started" status includes both actively-in-progress and
  accidentally-left-open issues — you need recency to distinguish them
- Notion: block content requires recursive traversal — a single page fetch
  doesn't get you the full text

Document every business logic requirement as a named pattern.

**2. What are the highest-risk undocumented behaviors for this account?**
Given what community research found, and given what was verified live:
what are the most likely ways this integration will surprise this team?
Rank by: probability of hitting it × impact when they do.

**3. What do the best community implementations do that the docs don't suggest?**
The absorb manifest from onboarding Step 2b captured every community tool's
features. Look at the highest-quality implementations. What patterns do they
use that are smarter than naively following the docs?

**4. What endpoints or capabilities are available but undocumented?**
From the community intelligence sweep: any endpoints found in community tools
that aren't in the official docs. These are often the most powerful ones —
platforms build internal tooling on them and they leak into community packages.

**Write the practical guide** based on answers to all four questions.

---

## Step 3c — Write the practical guide

Write `/agent/brain/integrations/<name>/practical-guide.md`.

This is the document that makes the integration actually useable. It goes
beyond what the official docs say to capture how things actually work.
Think of it as the guide a senior engineer who has spent a week with this
API would write for a teammate who's about to use it for the first time.

**Layer 1 for this integration** — loads automatically in every session
involving this integration. Keep it focused and dense. No padding.

Template:

```markdown
# [Integration] Practical Guide

**Last updated:** [date]
**Based on:** official docs + community research + live verification

## The one thing you need to know
[One sentence that would save someone the most time. The thing that's
 hardest to find and most commonly trips people up.]

## Business logic required
[For each required pattern: name it, explain why it's needed, show the
 correct approach vs. the naive approach]

### [Pattern name]
**Why:** [what goes wrong without it]
**Naive approach:** [what the docs suggest]
**Correct approach:** [what actually works]

## Undocumented behavior
[What the platform does that isn't in the docs. Source for each.]

| Behavior | Condition | Source |
|---|---|---|
| [what happens] | [when it happens] | [community tool / live test] |

## Verified working patterns
[Patterns confirmed to work through live testing or community validation]

## Known landmines
[The highest-risk surprises for this team specifically, ranked by impact]

1. [Most dangerous] — [what happens, how to avoid]
2. [Second most dangerous] — [what happens, how to avoid]

## Community-discovered endpoints
[Any endpoints found in community tools but not in official docs]

| Endpoint | What it does | Source | Confidence |
|---|---|---|---|
| [path] | [description] | [tool/repo] | high/medium/low |
```

If community research and live verification found nothing unexpected:
write a short guide noting that the official docs appear accurate and
the integration is lower-risk than average. A clean guide is still useful.

---

## Step 4 — Design the workflows

Based on the person's context, the platform structure, and the compound
opportunities — design 2-4 specific workflows.

Each workflow is:
- A question this person needs answered, or a task they currently do manually
- Expressed in plain language using their vocabulary
- Specific enough that it couldn't be suggested to someone in a different role

**Good workflow framing:**
"See which RX issues have been in 'In Progress' for more than 5 days without
a comment — those are the ones that need a nudge before the cycle ends."

**Bad workflow framing:**
"Query issues by state and updated date to identify stale work items."

One workflow should always be a compound workflow that uses this integration
plus at least one other that's already connected — this is the unlock moment
that couldn't have happened before today.

Separately, ask: would a CLI meaningfully improve this? A CLI is worth offering
when:
- The person will query this platform more than once a week
- The questions they need to ask are complex enough that natural language
  is slower than a command
- The local store + compound commands would unlock queries the live API can't

If yes, note it — you'll offer it in Step 6.

---

## Step 5 — The question (only if needed)

After the detective work, there is usually one thing that genuinely can't be
inferred. Only ask if:
- The answer materially changes what you propose
- It references something specific from the platform mapping
- It's answerable in one sentence
- It could not have been asked without the research

The question goes at the END of the proposal, not before it.

**Quality bar:** If someone reads the question and thinks "obviously they did
their homework," it's a good question. If it could be asked about any
integration to any person, it's not good enough — do more research instead.

If nothing is genuinely ambiguous, skip it. Go straight to the proposal.

---

## Step 6 — Write the proposal

Tone: a colleague who just spent an hour digging into this and came back
with something specific and genuinely useful. Not a second onboarding summary.
Not a capabilities recitation.

Lead with what you found. Use their words. Be direct about what you think
they should do first.

**Format:**

---

**[Integration] — here's what I'd do with it**

[1-2 sentences about what stood out from digging into their actual setup.
Reference something real and specific — a person, a project, a structural
pattern. This is the "wow you actually looked" moment.]

**What this unlocks for you:**

[2-3 specific workflows, in plain language, using their vocabulary.
At least one should be a compound workflow that requires this integration
plus another that's already connected.
Each workflow answers a specific question or replaces a specific manual task.]

**Where I'd start:**

[One concrete action. Not a list. The single thing that would deliver the
most value first, based on everything you know about this person and their
current work. Be specific — "run X" or "let me build Y" or "the first
useful query is Z."]

[ONE question here if needed — warm, specific, grounded in the mapping]

---

Do NOT include:
- A recap of what the integration does (that was in the onboarding summary)
- Generic bullets about API capabilities
- Technical jargon or endpoint language
- The words "leverage", "utilize", "seamlessly", or "robust"

---

## Step 7 — Offer the CLI (if warranted)

If Step 4 flagged that a CLI would meaningfully improve how they use this
integration, add a brief offer after the proposal:

> "I can also build a CLI for [integration] — it would give you [specific
> compound command] as a single command plus a local store you can query
> without hitting the API each time. Worth doing?"

Keep it one sentence. Don't over-explain. Let them say yes.

If a CLI was already built for this integration (check INDEX.md), skip
the offer and reference the existing one instead.

---

## Step 8 — Write the activation plan and practical guide

**Activation plan** — write to `/agent/brain/integrations/<name>/activation.md`:

```markdown
# [Integration] Activation Plan

**Person:** [name]
**Date:** [today]
**Integration connected:** [date from capabilities-and-scopes.md]

## Platform map (as of [date])

### Alive structures
[List]

### Legacy / ignore
[List]

### Per-person usage
[Per-person map from Step 3]

### Vocabulary
[Their words for things]

### Seams
[Where groups hand off]

## Behavioral findings

### Business logic required
[Named patterns from Step 3b — what must be applied on top of raw API calls]

### Highest-risk undocumented behaviors
[Ranked list from Step 3b]

### Best community patterns
[What the best community tools do that the docs don't suggest]

## Compound opportunities
[Cross-integration workflows from Step 2]

## Proposed workflows
[The 2-4 workflows from Step 4, with enough context to re-run them]

## First action taken / suggested
[What was proposed or built]

## Open questions
[What still needs clarification]

## CLI status
[Built / offered / not applicable — with path if built]

## Practical guide status
[Written / stub / not applicable — path: /agent/brain/integrations/<name>/practical-guide.md]
```

**Practical guide** — write to `/agent/brain/integrations/<name>/practical-guide.md`
using the template from Step 3c. This file is **Layer 1** — index it in
`/agent/INDEX.md` with trigger: "use this when any task involves [integration],
building a CLI for [integration], or querying [integration] data."

Update `/agent/INDEX.md` with entries for both the activation plan and
the practical guide. Update the person's team file if any durable new
context surfaced about how they use this platform.

---

## Step 9 — Hand off to integration-context-sweep

After returning the proposal and writing the activation plan, immediately
run `integration-context-sweep` in the same turn.

The full connection sequence is:
  1. `integration-onboarding` → capabilities file + basic summary
  2. `integration-activation` → value design + workflow proposals (this skill)
  3. `integration-context-sweep` → full context dispersal + retrieval wiring

All three run in the same turn. The user sees one coherent response.
Each layer builds on the previous — don't repeat what's already been said.

---

## How this fits with integration-onboarding

`integration-onboarding` runs first. It:
- Fetches official API docs
- Writes capabilities-and-scopes.md
- Returns the basic summary (what it does, what you can do, risks)

Then `integration-activation` runs in the same turn, separated by a
visual break. It does the value design work.

The user should experience them as one coherent response — the first half
establishes the foundation, the second half makes it personal and actionable.

Do not repeat information from the onboarding summary. Build on it.

---

## Error handling

| Situation | Action |
|---|---|
| Can't identify who connected it | Use whatever team-level context exists. Note the gap in the activation plan. |
| Platform won't surface live data (auth scope too narrow) | Work with what's available. Note the constraint in the proposal — "I can see X but not Y; connecting with broader scope would unlock..." |
| No other integrations connected yet | Skip the compound workflow section. Focus on standalone value. Note it: "When you connect [next logical integration], this opens up..." |
| Platform structure is sparse / genuinely hard to read | Be honest about it. "Your [platform] is pretty early-stage — not a lot to map yet. Here's what I'd build for when it fills up." |
| CLI already exists for this integration | Reference it. Don't re-offer it. |
| Community research found no undocumented behavior | Write a short practical guide noting the docs appear accurate and the integration is lower-risk than average. A clean guide is still useful. |
| Behavioral detective work surfaces a critical undocumented behavior | Surface it prominently in the proposal — "One thing I found that isn't in the docs and matters for how you'll use this: [X]." This is the most valuable single output of the activation phase. |
