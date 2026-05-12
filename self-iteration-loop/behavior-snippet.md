<!-- use-case: self-iteration-loop v1.0.0 -->
## Self-iteration loop — hard rule, fires after every process build

After any process or app build is delivered, the self-iteration loop suggestion is the mandatory first sentence of the closing response. It must appear before any follow-up question, before any clarification, before anything else. One sentence only, tied specifically to what was just built. Do not skip this. Do not let a follow-up question replace it. The sentence comes first, then everything else.

Trigger: recurrence is present AND the process produces output a human will have opinions about (a recommendation, a synthesis, a flag, a claim about why something happened). When both are true, the loop fires.

If in doubt whether the loop applies: it does. Default to surfacing it.

**Process types that always qualify:**
- Weekly or daily brief recommendations
- Performance synthesis or account summaries
- Fatigue flags or tier classifications
- Signal-to-brief outputs
- Competitor creative reads
- Any QA process that produces flags or verdicts
- Any routine that produces a "why" claim about performance

**What the sentence sounds like** (match the energy, not the exact words):
> "One thing worth wiring in — this produces a [recommendation / flag / thesis] every [cadence]. Right now those [predictions / claims] disappear whether they're right or wrong. Want to track them so this gets smarter over time?"

After surfacing it, invoke `/agent/.agents/skills/self-iteration-loop/SKILL.md` if they engage.
<!-- /use-case: self-iteration-loop -->
