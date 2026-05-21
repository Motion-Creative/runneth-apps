# Creative Strategy Framework — Stack Guide

*This document is the macro-level map of how all 15 creative strategy skills chain together. Read this first whenever you need to understand which skills to invoke, in what order, and why.*

---

## The Full Stack

```
FOUNDATION LAYER
Brand Intake → Product Catalog → Review Audit → Brand-Relevant Keywords → Competitor Analysis
         ↓
STRATEGY LAYER
Creative Strategy Engine (pain × persona → messaging angles × awareness stages)
         ↓
EXECUTION LAYER
Creative Mechanics → Hook Writing → Hook Tactics + Hook Voice Patterns → Visual Formats
         ↓
DIAGNOSTIC LAYER
Creative Analysis → Hook Analysis (sub-component) + Hook Evaluator (standalone)

STANDARDS LAYER (always active when writing copy)
Voice & Copy Standards
```

---

## Layer-by-Layer Breakdown

### FOUNDATION LAYER
*Run before any strategy or creative work. These build the factual and contextual base everything else draws from.*

| Skill | File | What It Produces | Run When |
|---|---|---|---|
| Brand Intake | `brand-intake.md` | `brand-context-[brand].md` | New brand, no context exists |
| Product Catalog | `product-catalog.md` | `product-catalog-[brand].md` | Before any benefit/messaging work |
| Review Audit | `review-audit.md` | VOC insights across 5 buckets | Customer reviews are available |
| Brand-Relevant Keywords | `brand-relevant-keywords.md` | `keywords-[brand]-[product].md` | Before organic/community research |
| Competitor Analysis | `competitor-analysis.md` | `competitor-analysis-[brand].md` | Before building creative strategy |

**Dependency order:** Brand Intake first (everything else references `brand-context-[brand].md`). Product Catalog and Competitor Analysis can run in parallel after Brand Intake. Review Audit and Keywords can run any time after Brand Intake.

---

### STRATEGY LAYER
*Defines what to say. Runs after Foundation. Outputs messaging angles that Execution draws from.*

| Skill | File | What It Produces | Run When |
|---|---|---|---|
| Creative Strategy Engine | `creative-strategy-engine.md` | Pain × persona matrix, messaging angles, awareness stage coverage | Before writing any hooks or briefs |

**Inputs it needs:** `brand-context-[brand].md`, `competitor-analysis-[brand].md` (optional but recommended), `product-catalog-[brand].md`

**Output it produces:** Defined messaging angles at specific pain × persona intersections, mapped across 5 awareness stages. This output is the direct input for Hook Writing.

---

### EXECUTION LAYER
*Defines how to say it. Takes messaging angles from CSE and turns them into finished creative elements.*

| Skill | File | What It Produces | Run When |
|---|---|---|---|
| Creative Mechanics | `creative-mechanics.md` | Structural pattern for how the ad creates meaning | Designing a concept beyond hook + format |
| Hook Writing | `hook-writing.md` | Full hook sets by trigger type | Any time hooks are needed |
| Hook Tactics | `hook-tactics.md` | Tactic definitions + deployment guidance | Selecting the right tactic frame |
| Hook Voice Patterns | `hook-voice-patterns.md` | Native-feeling template swipe file | When a hook is strategically correct but sounds constructed |
| Visual Formats | `visual-formats.md` | Format selection with funnel fit + mechanic pairing | Choosing production structure for a concept |

**Execution stack order:**
1. Confirm messaging angle + awareness stage (from CSE)
2. Choose creative mechanic (how the ad creates meaning)
3. Choose visual format (what it looks like)
4. Write hooks using Hook Writing, informed by Hook Tactics for tactic frame and Hook Voice Patterns for native language

**Hook Tactics and Hook Voice Patterns are reference libraries** — reach for them mid-execution, not as starting points.

---

### DIAGNOSTIC LAYER
*Evaluates existing creative. Does not produce new creative — use Execution for that.*

| Skill | File | What It Does | Run When |
|---|---|---|---|
| Creative Analysis | `creative-analysis.md` | Full ad teardown (strategy + hook + mechanic + format + body) | Breaking down an existing ad |
| Hook Analysis | `hook-analysis.md` | Hook-specific diagnostic | Called inside Creative Analysis, or standalone quick eval |
| Hook Evaluator | `hook-evaluator.md` | Structured 10-point hook scoring from text inputs | Deep standalone hook scoring with rubric |

**Hook Analysis vs Hook Evaluator:** Use Hook Analysis as a sub-component inside a full Creative Analysis. Use Hook Evaluator when the sole task is scoring and diagnosing a hook in isolation with structured inputs (visual description, on-screen text, voiceover, audio).

---

### STANDARDS LAYER
*Always active when writing copy. Not a reference to pull on demand — a standing rule set.*

| Skill | File | What It Governs |
|---|---|---|
| Voice & Copy Standards | `voice-copy-standards.md` | Scripts, hooks, briefs, captions, LinkedIn posts — any written output |

**Core rules (always apply):**
- Out-Loud Test: if it sounds like an ad or an essay, rewrite it
- Max 8th grade reading level; aim for 6th–7th in scripts
- No AI tell words (full list in the skill file)
- Contractions always; no passive voice; no sentences over ~20 words
- Scripts sound like someone talking, not someone writing

---

## Common Workflow Paths

### New Brand, Starting from Zero
`Brand Intake → Product Catalog → Competitor Analysis → Review Audit → Creative Strategy Engine → Hook Writing`

### Existing Brand, Need New Hooks
Check for `brand-context-[brand].md` → `Creative Strategy Engine` (to confirm/build messaging angles) → `Hook Writing` → pull from `Hook Tactics` + `Hook Voice Patterns` as needed

### Ad Creative Review / Teardown
`Creative Analysis` (which calls `Hook Analysis`) — or `Hook Evaluator` if only the hook is being scored

### Concept Development (Beyond a Hook)
`Creative Strategy Engine` (for messaging angle) → `Creative Mechanics` (for structural pattern) → `Visual Formats` (for production structure) → `Hook Writing` (for opening)

### Organic Research / Audience Language
`Brand Intake` (for audience definition) → `Brand-Relevant Keywords` (for search landscape) → `Review Audit` (for VOC if reviews exist)

---

## Adding New Skills

When new skills are added, run the skill-intake process (see `/agent/.agents/skills/skill-intake/SKILL.md`). That process will:
1. Evaluate overlap with existing skills
2. Assign the skill to the right layer
3. Update this stack guide with the new entry
4. Update `/agent/INDEX.md` with aliases
5. Update `/agent/user.md` if the skill is always-on

*Last updated: 2026-05-07 | Skills in stack: 15*
