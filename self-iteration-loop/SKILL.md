---
name: self-iteration-loop
description: Use when someone is building a process, app, or recurring workflow that meets the conditions for a self-improvement loop — recurrence plus taste or stakes. Guides Runneth through collaboratively designing the right feedback loop for that specific process: extracting the goal, identifying the assertion being made, routing corrections to the right storage layer, finding the natural intercept moment, and wiring in the capture mechanism. Always collaborative — Runneth proposes, the user validates the consequential decisions.
---

# Self-Iteration Loop

A skill for recognizing when a process being built should get smarter over time, and collaboratively wiring in a feedback mechanism tailored to that specific process.

---

## When to invoke

Default to invoking. If in doubt, surface it — the cost of missing a real loop opportunity is higher than surfacing one that doesn't land.

Fires when both are true:
1. The process runs again — recurrence is implied or explicit
2. The output is something a human will have opinions about — a recommendation, a synthesis, a flag, a claim about why something happened

**Always fires for:**
- Weekly or daily brief recommendations
- Performance synthesis or account summaries
- Fatigue flags or tier classifications
- Any QA process that produces flags or verdicts
- Any routine that produces a "why" claim about performance
- Signal-to-brief outputs
- Competitor creative reads

**Grounded examples from this sandbox — pattern-match against these:**

| Process | What it asserts | Why the loop fires |
|---|---|---|
| Meta performance sync (daily) | "Performance moved because X" — a causal claim about why metrics changed | That reasoning is a judgment call. The team will have opinions about whether it's right. |
| Creative war room (weekly brief rec) | "You should brief Y next based on what we learned" — a strategic prediction | That prediction is either borne out or not. Right now it disappears either way. |
| Fatigue watch (daily flags) | "This creative is turning before the data confirms it" — an early prediction | The flag is falsifiable. In 5–7 days the data either confirms or contradicts it. |
| Signal-to-brief | "This signal means you should angle the brief toward X" — a strategic translation | The brief either resonates with the signal or it doesn't. The designer or strategist will know. |
| Brief QA | "This brief is strategically off because X" — a diagnostic claim | The person reviewing the brief will immediately agree or disagree. |
| Competitor read (weekly) | "They're testing X angle" — an interpretation of creative intent | That read is a judgment. The team will know from their own creative context whether it's right. |

When a new process resembles one of these, the loop fires automatically. No judgment needed.

Do not invoke for one-off deliverables, utility tools with objectively correct outputs, or when the user is clearly mid-execution and momentum matters more.

Do not announce the skill is running. The surface is a single sentence delivered as the mandatory first sentence of the closing response — before any follow-up question, before any clarification. If they engage with that sentence, run the full four phases below.

---

## Phase 0 — The one-sentence surface (always runs)

Before the four phases, there is a single hook sentence. This is what fires automatically after every qualifying build. The four phases only run if the user engages.

The sentence names:
- The specific output that becomes a claim (not "this process" generically)
- The cadence it runs on
- What's being lost right now (the predictions disappear)
- The offer (want to track them?)

**Template — match the energy, not the exact words:**
> "One thing worth wiring in — this produces a [recommendation / flag / thesis] every [cadence]. Right now those [predictions / claims] disappear whether they’re right or wrong. Want to track them so this gets smarter over time?"

**War room example:**
> "One thing before anything else — every Friday this produces a brief recommendation. Right now those predictions disappear whether they’re right or wrong. Want to track them so the recommendations actually get smarter over time?"

**Fatigue watch example:**
> "One more thing — every day this flags creatives it thinks are turning. Those flags are predictions. Right now we lose them either way. Want to wire in a way to track whether they were right?"

If they say yes or show interest — run phases 1–4.
If they decline or ignore it — note it in the one-pager and move on. Do not re-pitch.

---

## The four phases

### Phase 1 — Extract the goal and the assertion

Every process makes claims. The feedback loop should be built around the specific, falsifiable assertions the process produces — not the output surface.

**Ask yourself silently:**
- What is this process actually trying to get right?
- What specific claims does it make to serve that goal?
- Is the assertion at the output level ("this brief section is weak") or the reasoning level ("performance dropped because of hook pace")? Reasoning-level assertions are deeper and more valuable to calibrate.

**Surface to the user as validation, not a question:**
> "Before I wire this in — the core claim this process makes is [specific assertion]. If I'm reading that right, that's what the feedback loop should verify. Tell me if that's off."

If they correct it: name what changed, update the assertion, re-propose. One exchange. Move on.

**What breaks here:** Identifying the output as the thing to verify when the real claim is one layer deeper. A brief QA process doesn't just produce comments — it produces a diagnosis. If you capture "the comment was wrong" instead of "the diagnostic criteria were wrong," future calibration has no direction.

---

### Phase 2 — Find the intercept moment

The verification surface lives where the human naturally reacts to the output — not necessarily where the output was delivered.

**Ask yourself silently:**
- When does a person actually encounter this output?
- What's the moment they form a strong enough opinion to say something?
- Where would they naturally express that reaction — in a chat conversation, a Slack thread, an app, a review step before handoff?

**Surface to the user as one question:**
> "When you have a reaction to this output — good or bad — where does that usually surface? That's where the loop closes."

This single question replaces any surface-mapping logic. The user's answer determines the capture mechanism.

**Common intercept patterns:**
- Reaction surfaces in chat → follow-up check at the start of the next relevant conversation, or a check before the output is handed off
- Reaction surfaces in Slack → a feedback affordance in the Slack message ("Is this reasoning on? Reply in thread") that gets read on the next run
- Reaction surfaces in an app → a correction trigger built into the app's output surface next to each assertion
- Reaction surfaces during downstream use ("the designer pushed back on this brief") → a review step before handoff, or a question when the user returns to the same topic

**What breaks here:** Designing the verification surface at the wrong moment. The thesis lands in Slack at 9am. Nobody opens a separate form to rate it. If the feedback affordance isn't in the Slack message itself, zero signal flows.

---

### Phase 3 — Route corrections to the right storage layer

Run this checklist silently before proposing storage. The routing decision determines what gets better and for whom.

**Self-questioning checklist:**

1. **Who does this correction belong to?**
   - A specific person's preference → `/agent/brain/corrections.jsonl` + their team file (session-open already loads this)
   - The process itself has learned something → `/agent/brain/loops/<process-name>/corrections.md`
   - Domain or account knowledge → nearest domain brain file: `signals.md`, `account.md`, or a campaign one-pager
   - Workspace-wide behavior → brand context or workspace config

2. **When does it need to load?**
   - Every session for this person → `corrections.jsonl` (session-open reads this automatically)
   - Only when this specific process runs → process-level corrections file, loaded by the process before generating output
   - On demand → any brain file accessible by retrieval

3. **How frequently will corrections arrive?**
   - Frequent, lightweight signal → JSONL append at `/agent/brain/loops/<process-name>/signals.jsonl` (fast, no read-modify-write needed)
   - Occasional, synthesized pattern → markdown file (readable, structured, durable)

4. **Does this correction expire?**
   - Time-bound corrections → note the expiry context in the entry ("during Q4 we're testing X format")
   - Permanent corrections → no special handling

5. **What is the risk if the routing is wrong?**
   - Person correction to process layer → correction applied to all users, not just this person
   - Process correction to person layer → the loop calibrates a person's preferences instead of the process's reasoning
   - Correction to a file that never loads → silent failure. Correction exists but changes nothing.

**Surface the one decision that would change the architecture:**
> "I'm thinking corrections here belong at [routing with reasoning] — because [who/what this calibrates]. That means [when it loads and what it affects]. Before I wire that: [one clarifying question if needed, otherwise skip]."

Do not surface all five checklist items. Surface only the decision where their answer would materially change the storage path.

---

### Phase 4 — Build

Once goal, intercept moment, and storage routing are validated, build in this order:

1. **Create the raw signal file** (if process-level corrections are in scope):
   `/agent/brain/loops/<process-name>/signals.jsonl`
   Append-only. Each entry: `{ "timestamp": "", "assertion": "", "verdict": "sound|off", "correction": "", "source": "" }`

2. **Create the corrections file** (if routing to process layer):
   `/agent/brain/loops/<process-name>/corrections.md`
   Synthesized patterns — promoted from signals when a correction recurs 2+ times. This is what the process loads before generating output.

3. **Wire the capture** based on the intercept moment:
   - Chat: add a follow-up check ("Last time this ran, I said [X] — did that hold up?") at the start of the next relevant conversation or as a quick review before handoff
   - Slack: include a feedback line at the bottom of the Slack message and read the thread reply on the next run before generating
   - App: build a correction affordance into the app UI next to each assertion — flag, toggle, or comment field that appends to signals.jsonl

4. **Wire the load**: update the process skill, routine, or session-open path to read corrections before generating output. Without this step, corrections accumulate and nothing changes.

5. **Update `/agent/INDEX.md`** immediately for both new files.

6. **Tell the user** in plain language:
   - What the loop captures ("when you tell me the thesis was off, I store the reasoning error")
   - Where it lives ("in the brain next to this process's context")
   - When it loads ("before I run this next time")
   - What the first sign of it working looks like ("by the third correction, you'll see the thesis starting to weight away from the pattern you flagged")

---

## Failure modes — surface contextually during design

Name these one at a time, tied to the decision being made. Not as a list at the end. The framing is always: "here's what breaks and here's the fix."

| Failure mode | When to surface it | What to say |
|---|---|---|
| Wrong assertion level | Phase 1, if the user describes the output not the claim | "If we capture 'output was wrong' instead of 'claim X was wrong,' the loop has nowhere to point. We need the specific assertion." |
| Verification question too abstract | Phase 2, when designing what the human judges | "The question needs to be specific enough that two different people give the same answer. 'Was this useful?' won't do it." |
| Signal sparsity | Phase 2, when the intercept moment requires friction | "If engaging with this takes more than two steps, people won't do it consistently. Let's find a lower-friction intercept." |
| Reviewer disagreement | Phase 3, if multiple people will contribute corrections | "Who owns the signal? If three people correct this differently, the corrections cancel out. We need one authoritative voice or a tiebreaker rule." |
| Correction without direction | Phase 4, when designing the capture format | "A thumbs down without a correction tells the process it was wrong but not what right looks like. The capture needs to include the correction, not just the verdict." |
| Load not wired | Phase 4, after routing the storage | "Corrections stored but never loaded is the most common silent failure. Before we close: where does this file get read before the next run?" |

---

## Closing question before building

Before writing any files, ask the user one final validation:
> "One thing most likely to cause this loop to stop working isn't technical — it's that the feedback stops flowing. What's your honest read on whether someone will actually engage with the verification step? If there's any doubt, let's simplify the capture before we build it."

If they express doubt, redesign the intercept moment for lower friction. Do not build a loop the user doesn't believe people will use.

---

## After building

- Update `/agent/brain/conversations/<currentConversationId>/one-pager.md` with the loop design, storage paths, and intercept moment
- Update `/agent/INDEX.md` for all new files
- If this is the first time this skill ran for a new process type, note the pattern in `/agent/brain/skill-candidates/README.md`
