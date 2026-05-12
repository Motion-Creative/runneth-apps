# self-iteration-loop

**Every recurring process makes claims. A fatigue flag is a prediction. A brief recommendation is a strategic bet. A performance synthesis is a causal theory. Right now those claims disappear whether they were right or wrong. This use case changes that.**

When Runneth builds a routine, app, or recurring workflow, this skill automatically surfaces a feedback loop tailored to that specific process — identifying the assertion being made, finding the natural intercept moment, routing corrections to the right storage layer, and wiring in the capture mechanism.

**Install time:** ~1 minute  
**Requires:** Nothing. Works in any sandbox.

---

## What gets installed

| File | Destination | Behavior |
|---|---|---|
| `SKILL.md` | `/agent/.agents/skills/self-iteration-loop/SKILL.md` | Full four-phase loop design workflow |
| `behavior-snippet.md` | `/agent/user.md` | Two hard rules: self-iteration loop fires after every process build; plan mode fires before every skill/routine/app build |

---

## How it works

After any process or app build is delivered, Runneth surfaces a single sentence — the mandatory first output before any follow-up question:

> *"One thing worth wiring in — this produces a [recommendation / flag / thesis] every [cadence]. Right now those predictions disappear whether they're right or wrong. Want to track them so this gets smarter over time?"*

If the user engages, the full skill runs: goal extraction, intercept moment design, storage routing, and build.

If they decline, it's noted and not re-pitched.

---

## When it fires

Automatically after any build with recurrence + human judgment in play. Always fires for:

- Brief recommendations
- Performance synthesis and account summaries
- Fatigue flags and tier classifications
- QA processes that produce flags or verdicts
- Any routine that makes a "why" claim about performance
- Signal-to-brief outputs
- Competitor creative reads

---

## Storage model

Corrections route to the right layer automatically:

| Correction type | Storage location |
|---|---|
| Person preference | `/agent/brain/corrections.jsonl` |
| Process learning | `/agent/brain/loops/<process-name>/corrections.md` |
| Domain/account knowledge | nearest domain brain file (`signals.md`, `account.md`) |
| Workspace behavior | workspace config or brand context |

Raw signals land in `/agent/brain/loops/<process-name>/signals.jsonl` before synthesis.

---

## Also included: Plan mode

The behavior snippet also installs a plan mode hard rule — before any skill, routine, app, or standing instruction is built, Runneth writes a plan file and waits for approval. The plan includes 2–4 questions that would materially change the architecture.

---

## Built at Motion Creative

Designed and iterated in the Motion Creative Runneth sandbox. Originated from the Video QA app feedback loop pattern — generalized to work across any recurring process that produces human-evaluable output.

---

## Version history

See `install-config.json` changelog.
