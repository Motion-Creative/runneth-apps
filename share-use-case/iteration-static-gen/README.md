# share-use-case

**Anyone can package a use case from their sandbox and submit it to the shared library for others to discover and install.** Once installed, a sandbox can contribute back to the marketplace. Build a use case, run this skill, and get a zip with step-by-step upload instructions and a pre-filled PR description — ready to submit for review.

**Install time:** ~1 minute
**Requires:** Nothing. Works in any sandbox.

---

## What gets installed

| File | Destination | Behavior |
|---|---|---|
| `SKILL.md` | `/agent/.agents/skills/share-use-case/SKILL.md` | The full export workflow |

---

## How it works

Tell the agent: *"Export my `<use_case_id>` use case"* or *"I want to build and export a use case."*

The skill will:
1. Check for existing staged use cases — improve one or start fresh
2. Walk through building the use case (use case definition, install inventory, tokens, file generation)
3. Validate — structural checks, org-agnostic checks, and a full design review across five lenses
4. Show the README for confirmation before packaging
5. Produce a zip of just the use case folder
6. Print step-by-step upload instructions and a pre-filled PR description

---

## Fallbacks

- **Use case not found in staging area:** Skill starts the build flow from scratch.
- **Validation fails:** Skill stops and lists every failure before producing any zip.
- **README needs changes:** Skill updates and re-shows before packaging.

---

## Version history

See `install-config.json` changelog.
