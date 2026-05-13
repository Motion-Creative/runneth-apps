---
name: landing-page-experiments
description: >
  Generate A/B test backlogs and experiment ideas for a landing page. Outputs a scored,
  prioritized backlog of 10-20 tests grouped by element (hero, proof, form, CTA, pricing)
  and hypothesis type (clarity, trust, friction, urgency, specificity), each with a verbatim
  current state, specific variant copy, primary metric, guardrail, expected lift band,
  win-rate prior, min sample size estimate, effort estimate, and "why this might lose"
  failure mode. Always works against a fresh landing-page-summary. Reads prior CRO audit
  history so it never suggests fixes already shipped. Reads the brand kit if present so
  variant copy stays on-brand. Use when the user asks to "give me A/B tests", "what should
  we test", "test ideas for this page", "experiment backlog", "next sprint tests", or
  "after shipping the audit, what's next".
argument-hint: "<URL> [--focus hero|proof|form|cta|pricing|all] [--win-bias higher-clarity|higher-trust|lower-friction] [--traffic meta|google|tiktok|organic|email|retargeting] [--icp <description>] [--history-from YYYY-MM-DD]"
---

# Landing Page Experiments

A/B test ideation. Output is a scored, prioritized backlog of tests for a specific landing page. Not an audit (that's `optimize-landing-page`). Not a recap. The user opens it and has a real sprint plan.

**When to use this vs. `optimize-landing-page`:**

- `optimize-landing-page` answers "what's wrong with my page?" Once per page per quarter-ish. Returns top 3 fixes plus a short test queue appendix.
- `landing-page-experiments` answers "what should we test next?" Once per sprint, after a win, after a loss. Returns a deep backlog with element-by-element coverage, hypothesis-type grouping, and explicit "why this might lose" framing.

The two skills share the upstream `landing-page-summary` evidence layer but diverge in output shape and decision support.

---

## Inputs

- **URL** (required).
- **`--focus`**. Scope the backlog to one element or `all` (default). Options: `hero`, `proof`, `form`, `cta`, `pricing`, `all`.
- **`--win-bias`**. Adjusts scoring priors. `higher-clarity` weights clarity-of-message tests up. `higher-trust` weights social proof, guarantees, badges up. `lower-friction` weights form/CTA simplification up. Default: balanced.
- **`--traffic`**. Traffic source for variant suggestions (cold Meta vs retargeting vs search needs different tests).
- **`--icp`**. Target customer description.
- **`--history-from`**. ISO date. Look at prior CRO audits and prior experiment backlogs from this date forward to avoid repeating tests already suggested or fixes already shipped. Default: 90 days back.

If URL is missing, ask. If both `--traffic` and `--focus` are missing, proceed with defaults (`all` focus, no traffic-temperature adjustment) and note assumptions in the output.

---

## Freshness Gate

Always invoke `landing-page-summary` fresh for the URL in this conversation. Never read a saved summary directly. Stale summaries silently corrupt test ideation just like they corrupt audits and brand kits.

If `landing-page-summary` is not installed, fall back to WebFetch with the exhaustive extraction prompt. Quality is degraded. Flag it in the backlog header.

---

## Runtime Notes

- Use `TodoWrite` to track phases when the full backlog is being built.
- Ask questions in chat. Do not wait for a tool prompt.
- Save the finished backlog to `./artifacts/experiments.<host>.<date>.md` (the copy the user opens) AND to `/agent/brain/experiments/<slug>--<domain>/<YYYY-MM-DD>.md` (durable backlog history). Multiple backlogs per day get a `-HHMM` suffix.
- Hand the artifact back using a `file` link widget.

---

## Method

### Phase 1 — Get the Page Spec (Fresh)

Invoke `landing-page-summary` at `--depth standard`. Read the result. The summary's H2 anchors are the data contract.

### Phase 2 — Read Prior Context

For each of these, read what exists. Skip silently if absent.

1. **Prior CRO audits.** `/agent/brain/cro-audits/<slug>--<domain>/*.md` — read every audit since `--history-from`. Extract the "Top 3 Fixes" sections and note their status. Tests suggesting the same fix are pre-filtered out of the backlog (or marked "already shipped, skip").
2. **Prior experiment backlogs.** `/agent/brain/experiments/<slug>--<domain>/*.md` — read every backlog since `--history-from`. Extract test IDs and hypothesis summaries. New backlog should not repeat the same tests verbatim; if the same hypothesis applies, mark it as "carried forward from <prior backlog date>" and refresh the variant.
3. **Brand kit.** `/agent/brain/brand-kit/_index.md` — if a brand kit exists for the target brand, read the markdown source. All variant copy in the backlog must match the brand's voice rules, vocabulary, and anti-patterns. If no brand kit, note the gap and use Motion's HTML design system fallback for any visual variant specs.

### Phase 3 — Generate the Backlog

Produce 10-20 tests. Each test is a complete decision record.

**Test record schema:**

```
test-NNN
  Element: hero | above-fold-trust | body-section | form | pricing | final-cta
  Hypothesis type: clarity | trust | friction | urgency | specificity | mechanism | outcome
  Hypothesis: "{{Replacing X with Y will {{increase|decrease}} {{metric}} because {{causal claim}}.}}"
  Current state: "{{verbatim quote from summary}}"
  Variant: "{{specific replacement copy or structural change}}"
  Primary metric: {{CVR / form completion / CTA click-through / scroll depth}}
  Guardrail: {{don't-regress metric, e.g. bounce rate, time on page, downstream revenue}}
  Expected lift: {{band: 1-3% | 3-7% | 7-15% | 15%+}}
  Win-rate prior: {{percentage from win-rate priors table}}
  Min sample size: {{N visitors per variant for MDE = lower bound of expected lift at 95% confidence, given baseline CVR if known or "assume 3% baseline"}}
  Effort: {{<1h copy change | 1-4h dev | 1d | 1wk}}
  Score: {{(median expected lift) x (win-rate prior) / (effort hours)}}
  Why this might lose: {{the specific failure mode. Be honest.}}
  Dependencies: {{tests this depends on or conflicts with, or "none"}}
```

**Win-rate priors** (industry-rough; adjust per `--win-bias`):

| Hypothesis type | Default win rate | Best-fit element |
| --- | --- | --- |
| Clarity (WHO/WHAT/WHY in hero) | 30% | hero |
| Friction reduction (form fields, fewer steps) | 50% | form |
| Risk reversal (guarantees, free trial, no-CC) | 40% | hero, pricing, final-cta |
| Specificity (real numbers, named customers) | 35% | proof, hero |
| Trust signal placement | 25% | above-fold-trust, proof |
| Mechanism reveal (how it works) | 30% | body-section |
| Outcome focus (results over features) | 30% | hero, body-section |
| CTA copy (outcome-oriented over generic) | 20% | hero, final-cta |
| Pricing display (anchor, comparison, popular) | 30% | pricing |
| Urgency (only if truthful and material) | 15% | hero, final-cta |

Use `--win-bias` to multiply priors: `higher-clarity` x 1.3 on clarity, `higher-trust` x 1.3 on trust/risk-reversal/specificity, `lower-friction` x 1.3 on friction/CTA. Cap at 80%.

**Coverage requirement:**

- At least 2 tests per element when `--focus all` (unless an element doesn't exist on the page).
- At least 1 test per hypothesis type when win-rate prior > 25%.
- At most 4 tests per element to avoid backlog bloat.
- Total 10-20 tests.

**Filtering:**

- Tests that duplicate prior audit Top 3 fixes are excluded unless the audit fix was rejected or the page changed since. Note the exclusion in the report's "Filtered" section.
- Tests that duplicate prior backlog tests are marked "carried forward" with the original test ID for traceability.

### Phase 4 — Compose the Output

Get the current timestamp:

```bash
date --iso-8601=seconds
```

Write the backlog to both paths (durable + artifact). Use this exact shape:

```markdown
# Landing Page Experiment Backlog - {{Brand}} {{Page}} ({{URL}})
_Generated: {{ISO ts}} - Source summary fetched: {{summary-ts}} - Focus: {{focus}} - Test count: {{N}} - Win bias: {{bias or "balanced"}}_
_Brand kit applied: {{yes (path) | no - using design-system fallback}}_
_Prior context: {{N audits, M prior backlogs read since {{--history-from}}}}_

## Top 3 to ship first

| Rank | Test | Element | Expected lift | Effort | Score |
| --- | --- | --- | --- | --- | --- |
| 1 | test-NNN | | | | |
| 2 | | | | | |
| 3 | | | | | |

## Backlog by element

### Hero
- test-NNN: {{one-line hypothesis}}
- ...

### Above-fold trust
- ...

### Body sections
- ...

### Forms
- ...

### Pricing
- ...

### Final CTA
- ...

## Backlog by hypothesis type

### Clarity
- test-NNN, test-NNN

### Friction reduction
- ...

### Risk reversal
- ...

### Specificity
- ...

### Trust signal placement
- ...

### Mechanism reveal
- ...

### Outcome focus
- ...

### CTA copy
- ...

### Pricing display
- ...

### Urgency
- ...

## Test details

### test-001 - [Element] [Hypothesis type] [Score]
- **Hypothesis:** ...
- **Current:** "{{verbatim from summary}}"
- **Variant:** "{{specific replacement}}"
- **Primary metric:** ...
- **Guardrail:** ...
- **Expected lift:** ...
- **Win-rate prior:** ...
- **Min sample size:** ... per variant (assumes baseline CVR {{X%}}, MDE {{Y%}}, 95% confidence)
- **Effort:** ...
- **Why this might lose:** ...
- **Dependencies:** ...

### test-002 - ...

[repeat for every test]

## Filtered out

Tests excluded because they duplicate a prior audit fix already shipped or a prior backlog test still queued. Listed for visibility.

- {{prior audit fix excluded: ...}}
- {{prior backlog test carried forward as test-NNN: ...}}

## Dependencies and sequencing

Tests that block or conflict with each other. If you ship test-A first, test-B's variant may need refresh.

- test-NNN -> test-NNN (sequencing reason)
- test-NNN vs test-NNN (conflict, only run one)
```

### Phase 5 — Index Hygiene And Drift Tracking

1. **Update `/agent/brain/experiments/_index.md`** with one row per page, most recent backlog first.

   Row format:

   ```
   - {{Brand}} {{page name}} - `<slug>--<domain>` - latest backlog {{date}}
     - URL: {{URL}}
     - Latest backlog: /agent/brain/experiments/<slug>--<domain>/<YYYY-MM-DD>.md
     - Test count: N
     - Top 3: {{test-001 summary}}, {{test-002 summary}}, {{test-003 summary}}
     - Source summary fetched: {{summary-ts}}
     - Brand kit applied: {{yes | no}}
   ```

2. **Update `/agent/INDEX.md`** with one entry per page (not one per backlog). Preserve `created` on update.

   Use single-line `|`-separated format:

   ```
   - path: /agent/brain/experiments/<slug>--<domain>/ | aliases: experiments, ab tests, test backlog, <brand> tests, <hostname> tests, landing page experiments | note: Experiment backlogs for <Brand> <page name>. One file per backlog at <YYYY-MM-DD>.md. Latest top test: <top-1 summary>. Source summary at /agent/brain/landing-pages/<slug>--<domain>.md. | created: <first-backlog date> | updated: <latest-backlog date>
   ```

### Phase 6 — Surface Readout

After saving, return exactly 5 lines:

1. **Backlog:** {{N tests}} for {{page name}} - top hypothesis: {{test-001 one-liner}}
2. **Quickest win:** {{test with highest lift/effort ratio}}
3. **Biggest swing:** {{test with highest expected lift}}
4. **Risk to watch:** {{any test whose "why this might lose" surfaces a real downside}}
5. **Saved:** {{artifact path}} - {{durable path}}

Hand off the artifact file via `file` link widget.

---

## Rules

- **Always re-fetch the page summary.** Invoke `landing-page-summary` fresh. Stale page state corrupts the backlog.
- **Read prior audit history before generating.** Never suggest a test for a fix that was already shipped. If unsure of status, mark the test "verify status: was this fix shipped?".
- **Read the brand kit if it exists.** All variant copy must obey the kit's voice, vocabulary, anti-patterns. No off-brand variant suggestions.
- **Quote current state verbatim.** Every test's `Current:` field is exact copy from the page summary. No paraphrasing.
- **Variant copy must be specific and brand-consistent.** Not "improve the headline." Write the replacement headline.
- **Win-rate priors are directional, not promises.** State them. Do not claim "this will lift X%." Use the band.
- **Min sample size estimate must show the baseline assumption.** "Assumes 3% baseline CVR, MDE 0.5%, 95% confidence, two-tailed."
- **Effort estimates honest.** Distinguish copy-only changes (<1h) from dev work (1d+) from design-required (1wk+).
- **Score formula consistent.** `(median expected lift band as decimal) x (win-rate prior as decimal) / (effort hours as float)`. Higher is better.
- **"Why this might lose" is required on every test.** Surfaces the failure mode honestly. If you can't write one, you don't understand the test well enough yet.
- **No dark patterns.** No fake scarcity, no manipulative loss-aversion that isn't truthful, no fabricated testimonials, no deceptive CTAs.
- **No "test everything" backlogs.** 10-20 tests max. A 50-item backlog is a 0-item backlog.
- **Filter, don't duplicate.** Tests already shipped via prior audit fixes get excluded with a note. Tests still queued from prior backlogs get carried forward by ID.
- **Cite the summary section** (e.g. "from summary § 3 Hero") so the user can trace evidence.
- **Save durable + hand off.** Artifact copy is what the user opens this turn. Durable copy under `/agent/brain/experiments/` is what future Runneth can recall.
- **Update both indexes.** Local `_index.md` and global `/agent/INDEX.md` on every backlog.

---

## No Routine

This skill does not install a routine. Experiment ideation runs when the user wants it. The LP weekly refresh routine (from `landing-page-summary`) flags experiment backlogs whose pages changed materially, prompting the user to regenerate when relevant.
