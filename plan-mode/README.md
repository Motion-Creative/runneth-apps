# plan-mode

**Before Runneth builds anything, it writes a plan.**

A hard rule that fires before any skill, routine, app, or standing instruction is created or modified. Runneth stops, asks 2–4 clarifying questions in chat, then writes a Markdown plan file, delivers it as an openable link, and waits for explicit approval before touching anything.

The clarifying questions are the ones where the answer would materially change the architecture — not generic process questions, but specific ones about ownership, trigger conditions, delivery targets, and storage decisions. Questions go in chat, not in the plan file. The plan file is the confirmed spec, written after the answers come back.

**Install time:** ~1 minute  
**Requires:** Nothing. Works in any sandbox.

---

## What gets installed

| File | Destination | Behavior |
|---|---|---|
| `behavior-snippet.md` | org standing instructions | Hard rule: questions in chat → plan file → approval before any skill/routine/app/instruction build |

---

## How it works

Trigger is the output type, not complexity:

- Creating or modifying a **skill** → plan first
- Creating or modifying a **routine** → plan first  
- Creating or modifying an **app** → plan first
- Creating or modifying a **standing instruction** → plan first

Runneth asks the clarifying questions in chat first, waits for answers, then writes `./artifacts/plan-<slug>.md`, delivers it as a file widget, and waits for explicit approval before building anything. Reading existing files for context (INDEX.md, related skills, brain notes) is allowed and expected — that's how Runneth writes a non-garbage plan. The bright line is writes and edits, not reads.

---

## Version history

See `install-config.json` changelog.
