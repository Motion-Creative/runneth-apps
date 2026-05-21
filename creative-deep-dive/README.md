# creative-deep-dive

Orchestrator + 9 standalone diagnostic skills. The orchestrator runs the full diagnostic on one creative or every creative in a test set; each underlying skill is also independently callable for narrower tasks.

Foundation + Strategy layers live in the separate `brand-audit` use case — this skill reads `brand-audit`'s output as upstream context instead of re-deriving brand intake, product catalog, VOC, keywords, competitor analysis, or the persona × angle matrix on every creative review.

Pairs with `brand-audit` (upstream — provides Strategic Layer context) and `weekly-performance-deck` (downstream — composes deep dives into the Friday deliverable).

Install time: ~60 seconds.

## What gets installed

The orchestrator and the 9 underlying skills all install as **independent top-level skills**. Runneth auto-discovers each one. Any of the 9 can be invoked standalone without going through the orchestrator.

| File | Destination | Behavior |
| --- | --- | --- |
| `SKILL.md` | `/agent/.agents/skills/creative-deep-dive/SKILL.md` | Overwrite |
| `skills/_stack-guide.md` | `/agent/.agents/skills/creative-deep-dive/_stack-guide.md` | Overwrite (orchestrator reference) |
| `skills/creative-analysis.md` | `/agent/.agents/skills/creative-analysis/SKILL.md` | Overwrite |
| `skills/hook-analysis.md` | `/agent/.agents/skills/hook-analysis/SKILL.md` | Overwrite |
| `skills/hook-evaluator.md` | `/agent/.agents/skills/hook-evaluator/SKILL.md` | Overwrite |
| `skills/creative-mechanics.md` | `/agent/.agents/skills/creative-mechanics/SKILL.md` | Overwrite |
| `skills/hook-writing.md` | `/agent/.agents/skills/hook-writing/SKILL.md` | Overwrite |
| `skills/hook-tactics.md` | `/agent/.agents/skills/hook-tactics/SKILL.md` | Overwrite |
| `skills/hook-voice-patterns.md` | `/agent/.agents/skills/hook-voice-patterns/SKILL.md` | Overwrite |
| `skills/visual-formats.md` | `/agent/.agents/skills/visual-formats/SKILL.md` | Overwrite |
| `skills/voice-copy-standards.md` | `/agent/.agents/skills/voice-copy-standards/SKILL.md` | Overwrite |
| `seed/_index.md` | `/agent/brain/creative-deep-dive/_index.md` | Skip if exists |
| INDEX entry | `/agent/INDEX.md` | Append if not present |

## Install in a fresh sandbox

```bash
# 1. Install orchestrator
mkdir -p /agent/.agents/skills/creative-deep-dive
cp SKILL.md /agent/.agents/skills/creative-deep-dive/SKILL.md
cp skills/_stack-guide.md /agent/.agents/skills/creative-deep-dive/_stack-guide.md

# 2. Install each of the 9 framework skills as independent top-level skills
for skill in creative-analysis hook-analysis hook-evaluator creative-mechanics hook-writing hook-tactics hook-voice-patterns visual-formats voice-copy-standards; do
  mkdir -p /agent/.agents/skills/${skill}
  cp skills/${skill}.md /agent/.agents/skills/${skill}/SKILL.md
done

# 3. Seed local index
mkdir -p /agent/brain/creative-deep-dive
[ -f /agent/brain/creative-deep-dive/_index.md ] || cp seed/_index.md /agent/brain/creative-deep-dive/_index.md

# 4. Add INDEX entry
grep -q "^- path: /agent/brain/creative-deep-dive/ " /agent/INDEX.md 2>/dev/null || echo "- path: /agent/brain/creative-deep-dive/ | aliases: creative deep dives, ad teardowns, creative diagnostics, deep dive library, mechanism analysis | note: Per-creative deep-dive outputs from the creative-deep-dive skill. <workspace-slug>/<creative-id>/<date>--deep-dive.md for single-creative dives. <workspace-slug>/<test-id>/<date>--comparison.md for test-set runs. Reads brand-audit bundle for Strategic Layer. | created: $(date -u +%Y-%m-%d) | updated: $(date -u +%Y-%m-%d)" >> /agent/INDEX.md
```

## How it works

The orchestrator and each underlying skill are auto-discovered. Two paths in:

**Full orchestrator path:** user asks for a deep dive on a creative or test → `creative-deep-dive` orchestrator runs → reads brand-audit's `strategy.md`, `brand-context.md`, etc. as needed → invokes `creative-analysis` which calls `hook-analysis` which reads `hook-tactics` and `hook-writing` → all 9 skills participate in producing one coherent output.

**Standalone path:** user asks "evaluate this hook" or "what tactic is this?" or "write 5 hooks for X" → the relevant single skill runs in isolation, no orchestrator. The standalone skill may still read brand-audit context narrowly (e.g. `hook-writing` reads `strategy.md` for persona context).

Both paths use the exact same skill files — they just enter the workflow at different altitudes.

## What this produces (orchestrator mode)

- `/agent/brain/creative-deep-dive/<workspace-slug>/<creative-id>/<YYYY-MM-DD>--deep-dive.md` per creative (single-creative mode)
- `/agent/brain/creative-deep-dive/<workspace-slug>/<test-id>/<YYYY-MM-DD>--comparison.md` per test (test-set mode)

Standalone skill invocations write to skill-specific locations (typically still under the same workspace path).

## Origin

The 9 skills come from the same Alysha + Jose creative-strategy framework that brand-audit's 6 skills come from. This bundle is the Execution + Diagnostic + Standards layers; brand-audit is the Foundation + Strategy layers.

## Changelog

- **1.1.0** (2026-05-20) — Foundation + Strategy layers extracted to `brand-audit`. 9 underlying skills now install as independent top-level skills. Orchestrator reads brand-audit's `strategy.md` for Strategic Layer instead of re-deriving.
- **1.0.0** (2026-05-20) — Initial release as a 15-skill bundle.
