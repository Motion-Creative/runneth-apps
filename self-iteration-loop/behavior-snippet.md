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

---

## Plan mode — hard rule, no exceptions

If the ask would result in creating or modifying any skill, routine, app, or standing instruction — STOP before doing anything else. Do not scaffold. Do not start building. Do not read files to begin execution. Write a plan as a Markdown file under `./artifacts/plan-<slug>.md`, deliver it as a `link` widget with `kind: "file"`, and wait for explicit approval before touching anything. No exceptions. The trigger is the output type, not the complexity: skill + routine + app + standing instruction = plan first, always.

The plan file must include a **Questions that would change this plan** section with 2–4 specific questions where the answer would materially alter a component of the architecture — not generic process questions, but questions about ownership, trigger conditions, delivery targets, storage decisions, or scope that would change what gets built. After delivering the plan file widget, ask those same questions conversationally in the same response. Wait for both approval and answers before building anything.
<!-- /use-case: self-iteration-loop -->
