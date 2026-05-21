---
name: creative-deep-dive
description: Orchestrates the execution + diagnostic creative-strategy skills (9 skills total) to produce a mechanism-level deep dive on a single creative or every creative in a test set. Reads the workspace's brand-audit bundle as upstream strategic context — never re-runs foundation work. Single-creative mode produces one teardown with executable iteration recommendations; test-set mode runs the diagnostic on every creative in the set plus a cross-creative comparison. Triggers on "deep dive on", "analyze this creative", "break down ad", "what's working in", "deep dive the test", "analyze every creative in test", "iteration recs for". Each of the 9 underlying skills is also independently callable for narrower tasks ("evaluate this hook", "score this hook", "diagnose this body").
---

# Creative Deep Dive (orchestrator)

You are the orchestrator. Your job is to pick the right diagnostic skills, run them in the right order on the right inputs, read upstream brand-audit context, and write one coherent deep-dive output that reads like one analyst's voice — not 9 stitched together.

You do not own foundation context (brand intake, product catalog, VOC, keywords, competitors, persona × angle matrix). That lives in the workspace's brand-audit bundle and gets read narrowly from there.

---

## Core principle

**One creative at a time. Always end with specific, mechanism-level recommendations.**

A deep dive that says "the hook is good, the body holds, recommend more like this" failed. A deep dive that says "the 'like usual, I have nothing planned' line lands because it normalizes the pain without dramatizing it; replicate that tonal register in future hooks but vary the daypart anchor away from 5pm" succeeded.

When the input is a test set, run the workflow on every creative in the set, then add a cross-creative comparison that names the actual winning variables. That's where sharp recommendations come from.

**Read brand-audit, don't re-derive.** Strategic Layer reads `strategy.md`, voice/tone reads `brand-context.md`, claims read `product-catalog.md`, audience language reads `review-audit.md`. The skills inside `brand-audit` get re-run when the bundle drifts — not on every deep dive.

---

## Upstream dependency

This skill expects `/agent/brain/brand-audit/<workspace-slug>/` to exist. If it doesn't, the deep dive can still run (it'll proceed with platform-default strategic framing), but the Strategic Layer will be shallow. In that case, surface a one-line note to the user: "No brand-audit bundle exists for this workspace yet — Strategic Layer will be thinner without it. Want me to run `brand-audit` first? Takes about 2 minutes."

---

## The skills this orchestrator coordinates

All 9 install as independent top-level skills (auto-discoverable, independently callable):

| Skill | Role here | Independently callable? |
|---|---|---|
| `creative-analysis` | The 8-section diagnostic backbone | Yes — "break down this ad" |
| `hook-analysis` | Three-channel hook diagnostic (called as sub-component of creative-analysis) | Yes — "analyze this hook" |
| `hook-evaluator` | Standalone 10-point hook scoring from text inputs | Yes — "score this hook" |
| `creative-mechanics` | Library of cognitive mechanisms (read inside creative-analysis section 4) | Reference library |
| `hook-tactics` | 35+ tactic definitions (read inside hook-analysis) | Reference library |
| `hook-writing` | 8 psychological triggers + hook writing rules | Yes — "write hooks for X" |
| `hook-voice-patterns` | Native-feeling template swipe file | Reference library |
| `visual-formats` | Format selection and fit-for-mechanic (read inside creative-analysis section 5) | Reference library |
| `voice-copy-standards` | Always-on copy rules (active whenever the deep dive writes ad copy in recommendations) | Always-on |

The map of how they relate lives in `_stack-guide.md` adjacent to this orchestrator.

---

## Two run modes

### Single-creative mode

Triggered by: "deep dive on `<creative-id>`", "analyze this ad", "break down `<creative-name>`", or a deck slide call for one creative.

Inputs:
- One creative ID (Motion creative-insights asset ID, ad ID, or creative-asset ID)
- Optional: the user's reason for the dive ("what's working" vs "why is this dropping off" vs "iteration recs")

### Test-set mode

Triggered by: "deep dive every creative in test `<test-id>`", "analyze the FUN29228 test", "compare these creatives", or a deck slide call when a test has reached readable spend.

Inputs:
- A test identifier — could be an ad-set ID, a launch batch (creatives launched same day in same ad set), a campaign name fragment, or an explicit list of creative IDs
- Resolve the input to its full creative set before running. Confirm inline if ambiguous: "This pulls 8 creatives launched between Oct 14-16 in `Hook Generator - Oct`. Run on all 8?"

---

## Execution flow

### Step 0 — Resolve inputs and read brand-audit

1. Resolve the creative ID(s) via `motion creative-insights --scope creative-asset-id` with `--summary-sections` enabled. Without `--scope creative-asset-id`, summary sections return empty and the diagnostic falls back to template language.
2. Fetch the full creative summary per creative: transcript, spoken hook, visual hook, text overlay, editing style, storyline, creator skepticism moments, music description.
3. Pull metrics: thumbstop, hold rate, CTR, $/event in the relevant validated metric from the paid-strategy brief at `/agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md`. Otherwise the workspace-default KPI.
4. **Read brand-audit narrowly.** For the Strategic Layer section coming up:
   - `/agent/brain/brand-audit/<workspace-slug>/strategy.md` — always (the pain × persona × angle matrix)
   - `/agent/brain/brand-audit/<workspace-slug>/brand-context.md` — when voice/tone matters
   - `/agent/brain/brand-audit/<workspace-slug>/review-audit.md` — when the creative is making a pain or desire claim worth grounding against VOC
   - `/agent/brain/brand-audit/<workspace-slug>/product-catalog.md` — when the creative is making a product claim
5. For test-set mode: do steps 1-3 for every creative in the set.

If summary sections come back empty after a targeted pull, surface the data gap and offer to do a manual transcript/visual description pass with the user before continuing.

### Step 1 — Run the diagnostic per creative

For each creative, invoke `creative-analysis` (the 8-section diagnostic backbone):

1. **Ad at a Glance**
2. **Strategic Layer** — uses `strategy.md` from brand-audit. Identify which persona × pain × messaging-angle cell the ad lives in. If the cell is validated in the matrix, name it explicitly. If not, flag it as a creative testing an unvalidated angle.
3. **Hook Analysis** — `creative-analysis` calls `hook-analysis` as its sub-component. `hook-analysis` reads `hook-tactics` and `hook-writing` as references. Three-channel diagnostic (spoken / visual / text overlay), 1-3 second test, alignment check, hook strength 1-5.
4. **Creative Mechanic** — read `creative-mechanics` for the library. Name the mechanism, explain *why* it works for the awareness stage from Step 2.
5. **Visual Format** — read `visual-formats`. Assess format fit for the mechanic and awareness stage.
6. **Body Analysis** (video only) — structure, retention mechanics, the middle, the CTA.
7. **Overall Diagnosis** — mechanism-level "what's working," root-cause "what's not," highest-leverage fix.
8. **Strategic Opportunity** (optional) — only when the diagnosis surfaces a strategic insight beyond the ad itself, and only when `strategy.md` shows an unexplored cell that this insight could open.

### Step 2 — Read the metrics against the diagnosis

Metrics are pointers, not conclusions. Signal-reading bridge:

- High thumbstop → the hook is stopping scroll. Lead "what's working" with hook-analysis findings.
- Low thumbstop but high hold rate → hook is weak but body is carrying. Lead with body analysis, recommend a hook iteration.
- High thumbstop, low hold rate → hook hooks but body breaks. Lead with body analysis, recommend body iteration.
- Strong $/event but middling attention metrics → the mechanic is doing more than the metrics suggest. Diagnose the mechanic in depth.
- Strong attention metrics but weak $/event → message-to-CTA disconnect. Diagnose the close.

### Step 3 — Write the per-creative output

One file per creative at `/agent/brain/creative-deep-dive/<workspace-slug>/<creative-id>/<YYYY-MM-DD>--deep-dive.md`. Structure:

```markdown
# <Creative ID> — <Short Descriptor>

**Date:** <YYYY-MM-DD>
**Workspace:** <name>
**Channel:** <meta | tiktok | …>
**Funnel step:** <from paid-strategy brief>
**Validated metric:** <metric name>
**Strategy cell:** <persona × pain × angle from brand-audit/strategy.md, or "unvalidated angle (flag)">

---

## Metrics snapshot
...

## What's working
3-5 mechanism-level bullets quoting actual hook lines verbatim.

## What's not working
2-4 root-cause bullets.

## Highest-leverage fix
One bullet, single change with biggest expected impact.

## Iteration recommendations
3-5 specific executable variants, each naming the variable changed and why, and fitting the team's test-launch pattern from the paid-strategy brief.

## Skill labels applied
- Hook tactic: ... (from hook-tactics)
- Psychological trigger: ... (from hook-writing)
- Creative mechanic: ... (from creative-mechanics)
- Visual format: ... (from visual-formats)
- Hook strength: ... (from hook-analysis)
- Hook-channel alignment: ... (from hook-analysis)
- Strategy cell match: ... (validated / new test / drift)

## 8-section detail
Full creative-analysis output below.
```

### Step 4 — Test-set comparison (test-set mode only)

After step 3 on every creative in the set, write `/agent/brain/creative-deep-dive/<workspace-slug>/<test-id>/<YYYY-MM-DD>--comparison.md`:

```markdown
# Test <ID> — Cross-creative comparison

**Creatives in set:** <count>
**Test variables held constant:** <list>
**Test variables varied:** <list>

## Performance distribution
| Creative | Spend | Thumbstop | Hold | $/event | Verdict |
| ... |

## What the test actually proved
The varied dimension that correlates with the winner. The dimensions that didn't matter (valuable negative findings). Any creative that won for the wrong reason.

## Recommended next round
3-5 next tests, each varying one new dimension while holding the now-validated dimension constant.
```

### Step 5 — Hand off

If invoked by `weekly-performance-deck`, return the output paths. If invoked directly by a user, post a one-line summary and link the file(s) via the file widget.

---

## Standalone skill invocation

The 9 underlying skills are all independently callable. Examples:

- "Evaluate this hook: 'It is 5:30 and...'" → `hook-evaluator` runs standalone with the 10-point rubric, no orchestrator involvement.
- "What hook tactic is this?" → `hook-tactics` runs standalone to classify the tactic.
- "Write 5 hooks for the evening-rush persona" → `hook-writing` runs standalone (and reads `strategy.md` from brand-audit for the persona context).
- "Just analyze the hook, not the full ad" → `hook-analysis` runs standalone with three-channel diagnostic.
- "What visual format would work best for this concept?" → `visual-formats` runs standalone.

The orchestrator only takes over when the ask is the full diagnostic on one or more creatives.

---

## Quality bar

A deep dive passes review when:

- Every observation in "what's working" quotes the ad verbatim or names a specific technique from one of the reference skills.
- Every recommendation is executable — a creator could read it and shoot the variant tomorrow.
- The signal-reading bridge is visible in the writeup.
- The strategy-cell match is explicit (validated / new test / drift), grounded in `brand-audit/strategy.md`.
- The 8 sections all ran, but depth scales to the ask.

Fails when:

- Recommendations sound like horoscopes.
- Category-level language ("hook is good, body holds").
- Metrics reported in isolation from the diagnosis.
- Hook tactic / trigger / mechanic labels missing.
- Strategic Layer ignores the brand-audit matrix.

---

## Anti-patterns

- **Don't re-derive brand context inside the deep dive.** Read `brand-audit/strategy.md` instead. If the bundle is missing or stale, surface the gap once and proceed — don't block.
- **Don't write the same recommendation twice across two creatives in a test set.** The whole point of test-set mode is finding the dimension that matters.
- **Don't skip `--scope creative-asset-id`** — without it summary sections come back empty.
- **Don't run hook-analysis on the spoken hook only.** All three channels (spoken + visual + text overlay) are the unit.
- **Don't promote Strategic Opportunity to required.** Skip when the diagnosis doesn't surface anything beyond the ad.
