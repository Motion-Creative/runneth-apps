# plan-mode

**Before Runneth builds anything, it writes a plan.**

A hard rule that fires before any skill, routine, app, or standing instruction is created or modified. Runneth stops, writes a Markdown plan file, delivers it as an openable link, and waits for explicit approval before touching anything.

The plan includes 2–4 questions where the answer would materially change the architecture — not generic process questions, but specific ones about ownership, trigger conditions, delivery targets, and storage decisions.

**Install time:** ~1 minute  
**Requires:** Nothing. Works in any sandbox.

---

## What gets installed

| File | Destination | Behavior |
|---|---|---|
| `behavior-snippet.md` | `/agent/user.md` | Hard rule: plan file before any skill/routine/app/instruction build |

---

## How it works

Trigger is the output type, not complexity:

- Creating or modifying a **skill** → plan first
- Creating or modifying a **routine** → plan first  
- Creating or modifying an **app** → plan first
- Creating or modifying a **standing instruction** → plan first

Runneth writes `./artifacts/plan-<slug>.md`, delivers it as a file widget, asks the plan's clarifying questions conversationally in the same response, and waits for both approval and answers before building anything.

---

## Version history

See `install-config.json` changelog.
