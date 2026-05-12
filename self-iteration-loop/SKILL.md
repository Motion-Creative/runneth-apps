---
name: self-iteration-loop
description: Use when someone is building a process, app, or recurring workflow that meets the conditions for a self-improvement loop — recurrence plus taste or stakes. Guides Runneth through collaboratively designing the right feedback loop for that specific process: extracting the goal, identifying the assertion being made, routing corrections to the right storage layer, finding the natural intercept moment, and wiring in the capture mechanism. Always collaborative — Runneth proposes, the user validates the consequential decisions.
---

# Self-Iteration Loop

Every recurring process Runneth runs makes a judgment call. A brief recommendation is a strategic bet. A fatigue flag is a prediction. A performance synthesis is a theory about why something happened. Right now, those judgments disappear whether they were right or wrong — and Runneth starts from scratch every time.

This skill wires in a feedback loop so the user's reactions flow back into the process — and the output gets measurably better over time.

---

## ⚡ Phase 0 — The hook (read this first, it fires every time)

After any qualifying build, the very first thing out of Runneth's mouth — before any follow-up question, before any clarification — is one sentence that surfaces the loop. This fires automatically. The full skill only runs if the user engages with it.

**What the sentence needs to do:**
- Name the specific output the process produces (not "this process" — name the actual thing)
- Say how often it runs
- Name what's being lost right now
- Make the offer feel obvious, not like a pitch

**Template:**
> "One thing worth wiring in — this produces a [recommendation / flag / thesis] every [cadence]. Right now those [predictions / calls] disappear whether they were right or wrong. Want to track them so this gets smarter over time?"

**Brief recommendation:**
> "One thing before I let you go — every Friday this produces a brief recommendation for your account. Right now those bets disappear whether they paid off or not. Want me to wire in a way to track that, so the recommendations actually get better week over week?"

**Fatigue watch:**
> "One more thing — every morning this flags creatives it thinks are about to turn. Those are predictions. Right now they disappear whether they were right. Want to start tracking them so the model learns from the hits and misses?"

**Performance synthesis:**
> "Before we close — every day this produces a theory about why performance moved. Those theories are either right or wrong. Right now no one knows. Want me to make it so your team can mark when the reasoning was off, so future analyses get sharper?"

If they say yes or lean in → run phases 1–4 below.
If they pass → note it in the one-pager and don't bring it up again this conversation.

**If they're uncertain or ask why it matters — coaching moment:**
> "The reason this is worth 5 minutes is that right now I'm making the same types of mistakes every time I run this — because I have no way of knowing what you actually think. Your instincts about what works for your brand are things I can't get from data. When you tell me something was off, I update specifically for you. By the third correction, you'll start noticing the output feels more like it was written by someone who actually knows your account."

---

## When to invoke

When in doubt, surface it. A missed loop opportunity costs more than a suggestion that doesn't land.

**Fire when both are true:**
1. The process runs again — it's recurring, not a one-off
2. The output is something a human will have opinions about — a recommendation, a diagnosis, a prediction, a claim about why something happened

**Always fires for:**
- Brief recommendations (weekly, per batch, per launch)
- Performance synthesis or account summaries
- Fatigue flags and tier classifications
- Any QA process that produces flags or verdicts
- Any routine that produces a "why" claim about performance
- Signal-to-brief outputs
- Competitor creative reads

**Pattern-match against these real examples:**

| Process | What it asserts | Why the loop fires |
|---|---|---|
| Meta performance sync (daily) | "Performance moved because X" — a causal claim | That's a judgment call. The team will have opinions. |
| Creative war room (weekly brief rec) | "Brief this angle next" — a strategic prediction | Either borne out or not. Right now it disappears either way. |
| Fatigue watch (daily flags) | "This creative is turning before the data confirms it" | Falsifiable in 5–7 days. Track it or lose it. |
| Signal-to-brief | "This signal means angle the brief toward X" | The designer or strategist will know if that was right. |
| Brief QA | "This brief is strategically off because X" | Someone reviewing it will immediately agree or disagree. |
| Competitor read (weekly) | "They're testing X angle" — an interpretation | The team will know from their own context whether that read is right. |

When a new process looks like one of these, the loop fires. No judgment needed.

Skip it for: one-off deliverables, utility tools with objectively correct outputs, and when the user is clearly mid-execution and interrupting would kill momentum.

---

## The core belief behind this skill

User taste is the fuel. Runneth can get smarter through data and reasoning, but the thing that makes it genuinely useful to a specific person on a specific account is *their* judgment — what's on-brand, what angles have been tried, what the designer always pushes back on, what the team actually cares about. That knowledge lives in the user, not in any data source.

This means the job isn't just to surface the loop — it's to actively coach users into building it. Their opinions aren't just feedback. They're the thing that makes Runneth genuinely better at their specific job over time. Nobody else's opinions can do this.

**When a user engages with this loop, they're not doing Runneth a favor. They're compounding their own investment.** Every correction makes the next output more useful to them specifically. That's the message to land.

---

## Phase 1 — Find the real claim

You're not building a loop around the output — you're building it around the specific, falsifiable claim embedded in that output.

A brief isn't just a document. It's a claim: "this audience framing, this hook angle, this tension — these will resonate." That's what the loop should verify. Not "was the brief good?" but "was the strategic call right?"

**Think through silently:**
- What is this process actually trying to get right?
- What's the specific claim it makes?
- Is the claim at the surface level ("this section is weak") or the reasoning level ("performance dropped because the hook lacks urgency")? Go deeper when you can.

**Then surface your read for validation:**
> "The core claim this process is making is [specific assertion] — that's what I'd want your feedback to verify. Does that feel right, or is the real judgment happening somewhere else?"

If they correct you: name what changed, update the assertion, come back with the new version. One round. Move on.

**Watch out for:** Capturing "the output was wrong" instead of "the claim was wrong." If someone marks a brief as bad but doesn't say which strategic call missed, future briefs have nothing to improve on.

---

## Phase 2 — Find where they'll naturally react

The feedback surface has to live where the human actually forms a reaction — not in a separate form they'll forget to check.

**Think through silently:**
- When does this person actually encounter the output?
- What's the moment they'd form a strong enough opinion to say something?
- Where would they express it — chat, Slack, an app, a handoff review?

**Then ask one question:**
> "When you have a strong reaction to this output — good or bad — where does that usually surface? That's where I want to close the loop."

**Common patterns:**
- Reaction in Slack → add a feedback line at the bottom of the message; read the thread before the next run
- Reaction before handoff → quick check-in before it goes to the designer or team
- Reaction in chat → ask at the start of the next relevant conversation: "Last time I said X — did that hold up?"
- Reaction in an app → flag or correction field in the UI next to each assertion

**Watch out for:** Building the surface somewhere that requires extra effort. If feedback takes more than 30 seconds, it won't happen consistently.

---

## Phase 3 — Route the corrections to the right place

This determines what gets better — and for whom. Wrong routing = corrections that accumulate and change nothing.

**Four questions, answer silently:**

**1. Who does this correction belong to?**
- This person's preferences → `/agent/brain/corrections.jsonl` (loads every session)
- The process itself learned something → `/agent/brain/loops/<process-name>/corrections.md` (loads before that process runs)
- Account or domain knowledge → nearest domain brain file (`signals.md`, `account.md`, campaign one-pager)
- Workspace-wide behavior → brand context or workspace config

**2. When does it need to be available?**
- Every session → `corrections.jsonl`
- Only when this process runs → process corrections file
- On demand → any brain file retrieval

**3. How often will corrections come in?**
- Frequently → JSONL append at `/agent/brain/loops/<process-name>/signals.jsonl`
- Occasionally, synthesized → markdown corrections file

**4. Does it expire?**
- Time-bound → note the context in the entry
- Permanent → no special handling

**Then surface the one decision that would change the answer:**
> "I'm thinking corrections here belong to [layer] — because [reason]. That means [when it loads and what it affects]. Does that feel right, or would you expect this to affect something else?"

---

## Phase 4 — Build it and make it real

**1. Create the raw signal file** (if process-level corrections apply):
`/agent/brain/loops/<process-name>/signals.jsonl`
Append-only: `{ "timestamp": "", "assertion": "", "verdict": "sound|off", "correction": "", "source": "" }`

**2. Create the corrections file** (if routing to process layer):
`/agent/brain/loops/<process-name>/corrections.md`
Synthesized patterns — promoted from signals when a correction recurs 2+ times. This is what the process reads before generating output.

**3. Wire the capture** based on Phase 2:
- Chat → check-in at the start of the next relevant conversation: *"Last time I said [X] — did that hold up?"*
- Slack → feedback line at the bottom; read the thread on the next run
- App → flag or correction field in the UI; appends to signals.jsonl

**4. Wire the load** — the step people forget and it silently kills loops:
Update the process skill, routine, or session-open path to read corrections before generating. Always verify this step is actually wired.

**5. Update `/agent/INDEX.md`** for both new files immediately.

**6. Tell the user what just got built — and why their input matters:**
> "Here's what's running now: whenever this [process] runs, I'm going to check in with you about whether [specific assertion] held up. When you tell me it was off, I'll store that and adjust before the next run. The first sign it's working is usually after 2–3 corrections — you'll notice the [briefs / flags / summaries] starting to sound more like they were written by someone who actually knows your account. You don't have to do anything differently — just be honest when something misses. Your instincts are what make this get better. I can't get that from data."

Then name the specific thing you're watching for:
> "The first thing I'd love to know: the next time [the recommendation / the brief angle / the flag] feels off, tell me why. That's the most useful thing you can give me right now."

**7. When a future output was shaped by a stored correction, say so:**
> "I used a retention angle here because two weeks ago you told me the acquisition framing was too broad."
> "I flagged this one earlier than usual because last time you said the threshold was catching creatives too late."

Never silently apply a correction. Making the compounding visible is what turns occasional feedback into a habit.

---

## Building confidence — three things users need to hear

### You can't break it. Nothing is permanent.

> "You can't get this wrong. If you give feedback and change your mind later, just tell me — I'll update. Corrections aren't locked in. Your thinking about what works will evolve, and that's fine. The system is designed for that."

People who worry about being inconsistent will stay silent. Remove that fear first.

### A thumbs up or thumbs down is enough to start.

The minimum viable feedback is a reaction. But users who go one level deeper compound much faster. Share this progression when the moment is right:

**Level 1 — Reaction** *(always enough)*
👍 or 👎 · "yes" · "off" · "wrong"

**Level 2 — Reason** *(5x more useful)*
"The hook angle was off" · "Too broad for our audience" · "Doesn't sound like us"

**Level 3 — Strategic insight** *(this is where real compounding happens)*
"The hook assumed we're selling to new customers, but we're targeting retention — completely different problem."
"We've tested urgency three times and it never works. Our audience responds to aspiration, not FOMO."

Users at Level 3 are giving Runneth something data can't provide. Help them understand that the more specific they are, the more precisely things improve — as an invitation, never a demand.

When a user is at Level 1 and seems ready to go deeper:
> "That's helpful — if you can say what felt off in one sentence, I'll make a sharper adjustment. But the reaction alone is already useful."

### When a correction shapes the output, say so.

See Phase 4 step 7 above. This is the moment the loop becomes real. Users who see it happen once give feedback consistently from that point forward.

---

## Coaching users who are passive about feedback

**"Sure, sounds good" — but never follows through.**
Make the first ask as small as possible:
> "One thing I want to check on — I said [specific assertion]. Did that hold up, or was it off? Even a one-word answer helps me."

**"I don't really have time."**
> "You don't have to carve out time. The only thing I need is your reaction when something already feels wrong. You're already having that reaction — I'm just asking you to tell me when it happens. 30 seconds, when it naturally comes up."

**"I'm not sure it'll actually make a difference."**
> "When you tell me something was off, I update before the next run. You'll actually see it change. It usually happens within 2–3 corrections."

**"I don't know what to say."**
> "Just: 'This was off because [one reason].' The more specific the reason, the more useful. But even 'this missed' with no explanation is better than nothing — I'll ask a follow-up if I need more."

**The message to always come back to:** Getting better for *them specifically* — their brand, their account, their creative instincts — is only possible if they share what they know. That's not flattery. It's true.

---

## What can go wrong — catch these early

Surface these one at a time, tied to the specific decision being made. Never as a list at the end.

**Assertion too vague** → Catch in Phase 1: *"If someone marks this as wrong, what would that tell us to do differently? If the answer isn't clear, we need a sharper assertion."*

**Verification question too broad** → *"It needs to be specific enough that your strategist and your designer give the same answer."*

**Nobody will actually give feedback** → *"Real talk — if this takes more than 30 seconds, it probably won't happen consistently. Let's simplify the capture."*

**Multiple people, conflicting signals** → *"Who owns the signal? If three people correct this differently, corrections cancel out. We need one primary voice."*

**Corrections stored but never loaded** → *"Before we close — where does this file get read before the next run? If that step isn't wired, corrections accumulate and nothing changes."*

---

## One last check before building

> "Honest question — how likely is someone to actually give feedback on this? Because if the answer is 'maybe sometimes,' let's simplify the capture right now. A loop that nobody uses is worse than no loop — it creates the illusion of learning without any actual learning."

If they express doubt — redesign for lower friction before building.

---

## After building

- Update `/agent/brain/conversations/<currentConversationId>/one-pager.md` with the loop design, what it captures, and where it loads
- Update `/agent/INDEX.md` for both new files immediately
- If this process type is new, add it to the examples table in the "When to invoke" section above
- Note the pattern in `/agent/brain/skill-candidates/README.md` if not already documented
