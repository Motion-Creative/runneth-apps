---
name: optimize-landing-page
description: >
  CRO audit of a landing page. Diagnoses message-match, awareness-stage alignment,
  friction, proof, and CTA architecture, then returns the top 3 fixes ranked by
  expected lift x ease plus an A/B test queue. Enriches a landing-page-summary with
  conversion-rate intelligence. Designed for the workflow: creatives point to a
  landing page, audit the landing page to make sure it's optimized for the ads.
  Always runs against a fresh landing-page-summary, never a stale saved one. Use
  when the user asks to "optimize this landing page", "CRO review", "why isn't this
  converting", "what should I A/B test", "audit my landing page", "improve this
  page", or "what's wrong with my hero".
argument-hint: "<URL> [--traffic meta|google|tiktok|organic|email|retargeting] [--icp <description>] [--goal signup|demo|purchase|install] [--ad-copy <verbatim ad text>]"
---

# Optimize Landing Page

CRO diagnosis and prescription. Output is a prioritized fix list. Not a critique, not a
recap. Every recommendation quotes the current page state and proposes a specific
replacement.

This skill enriches a `landing-page-summary` with the diagnostic frameworks below, then
synthesizes the top 3 fixes that matter.

**Workflow framing.** This skill is built for the "creatives -> destination URL -> audit"
loop: you have ads running to a landing page, and you want to know whether the page is
actually optimized for the audience those ads bring. That's why `--ad-copy` is the single
most decisive input. Without it, message-match diagnosis is a guess.

---

## Inputs

- **URL** (required).
- **`--traffic`**. Traffic source. Decisive. Cold Meta needs different fixes than
  retargeting needs different fixes than search.
- **`--icp`**. Target customer description.
- **`--goal`**. Primary conversion event (signup / demo / purchase / install).
- **`--ad-copy`**. The ad or email driving traffic. **The single most common killer of
  paid conversion is message-match failure between ad and hero.** Without this, message-
  match diagnosis is a guess.

If URL is missing, ask. If both `--traffic` and `--goal` are missing, ask once in one
batch. They are decisive and prescriptions diverge sharply. If only one is missing, state
your assumption and proceed.

---

## Freshness Gate

Stale summaries silently corrupt CRO audits. If the user already shipped your prior fix,
re-auditing against the pre-fix summary would invalidate the entire output.

**Always invoke `landing-page-summary` fresh** for the target URL in this conversation. Do
not read a pre-existing saved summary directly. The summary skill handles archive-before-
overwrite, so prior versions are preserved as a changelog without polluting the current
audit.

If `landing-page-summary` is not installed in this sandbox, fall back to WebFetch with the
exhaustive extraction prompt (copy it from the `landing-page-summary` SKILL.md if
available, otherwise from this skill's repo folder). Quality is degraded. Flag it.

---

## Runtime Notes

- Use `TodoWrite` to track phases when the full audit is running: summary fetch, 8-layer
  diagnostic, output generation.
- Ask questions in chat. Do not wait for a tool to prompt the user. Just ask directly and
  stop.
- Save the finished audit to `./artifacts/cro-audit.<host>.<date>.md`. Hand it back using a
  `file` link widget so the user can open it directly.
- Save a durable copy to `/agent/brain/cro-audits/<slug>--<domain>/<YYYY-MM-DD>.md` so the
  audit history per page is preserved and discoverable. Multiple audits per day get a
  `-HHMM` suffix.

---

## Method

### Phase 1 — Get The Page Spec (Fresh)

Invoke `landing-page-summary` against the URL at `--depth standard`. The summary file is
your evidence layer. You will quote from it.

Do not skip this step even if a summary exists at the canonical path. The freshness gate
above is non-negotiable.

If `landing-page-summary` is missing, fall back to WebFetch + the exhaustive extraction
prompt. Note in the audit's "Out of scope" section that no headless browser was used and
visual/form claims are weaker than usual.

### Phase 2 — Run The 8-Layer Diagnostic

For each layer assign **PASS / CONCERN / FAIL**. Quote evidence from the summary verbatim.
Move fast on PASS. Spend time on FAIL.

#### Layer 1 — Message match

- Quote the ad headline (`--ad-copy`).
- Quote the page hero headline (from summary § 3).
- Can a stranger tell these are the same offer?
- **The #1 killer of paid traffic.** If FAIL here, this is your top fix before anything
  else.
- Without `--ad-copy`, mark as `INSUFFICIENT_INPUT` and note it clearly.

#### Layer 2 — 5-second test (above the fold)

A first-time visitor must answer these from the hero alone:

1. **WHAT** is this? (category)
2. **WHO** is this for? (audience signal)
3. **WHY** should I care? (outcome / pain solved)
4. **WHAT** do I do next? (primary CTA visible)

Name which of the four fails. If WHO fails on cold traffic, that's usually the biggest
leak.

#### Layer 3 — Awareness-stage alignment

- What stage is the page written for? (look at hero abstraction level. Pain language =
  unaware. Feature/comparison language = product-aware.)
- What stage is the actual traffic at? (cold Meta = problem-aware. Retargeting = solution/
  product-aware. High-intent search = product-aware to most-aware.)
- **Mismatch is a top-3 killer.** Prescribe stage-appropriate hero copy.

#### Layer 4 — Positioning clarity (Dunford frame)

Try to reconstruct from the page alone:

> For **{{customer}}** who **{{need}}**, **{{brand}}** is a **{{category}}** that
> **{{benefit}}**. Unlike **{{alternative}}**, we **{{differentiator}}**.

If you cannot reconstruct it, the positioning is mush. Name which slot is missing.

#### Layer 5 — Scroll-job audit

Walk every section (summary § 4). Assign each a job:

- Hook -> Agitate -> Introduce -> Prove -> Explain -> Handle-objection -> Reverse-risk -> Close

Note missing jobs, weak jobs, jobs in the wrong order, redundant jobs.

#### Layer 6 — Friction audit

Pull these from the summary:

- Competing CTA count (summary § 3, § 4). More than one primary CTA in the hero is a
  problem.
- Form field count (summary § 8). Each field past 3 typically costs 5-10% completion.
- Paragraph length anywhere >3 lines = scan-killer.
- Jargon / mystery acronyms in body copy.
- Mobile reachability of primary CTA on a 390 px viewport (state assumption if not
  visible).
- Speed signals (summary § 15): heavy hero video, large images above fold, third-party-
  script bloat.

#### Layer 7 — Proof and risk reversal

- Logo strip (summary § 5). Logos recognizable to **this** audience? F500 logos mean
  nothing to SMB. YC logos mean nothing to enterprise.
- Testimonials. Specific with numbers vs. generic ("great product!"). Count specific vs.
  generic.
- Case study with real metrics? Even one?
- Guarantees / free trial / no-credit-card / money-back visible at every decision point
  (hero + pricing + final CTA)?

#### Layer 8 — CTA architecture

- Primary CTA copy. Outcome-oriented ("Get my free audit") or generic ("Submit", "Get
  started", "Learn more")?
- Repetition. Primary CTA available at every scroll depth without backtracking?
- Secondary CTAs. Guiding the undecided, or creating choice paralysis?
- Final CTA at end of page. Present and strong?

### Phase 3 — Synthesize The Output

Get the current timestamp first:

```bash
date --iso-8601=seconds
```

Save the audit to `./artifacts/cro-audit.<host>.<date>.md` **and** to
`/agent/brain/cro-audits/<slug>--<domain>/<YYYY-MM-DD>.md` so future Runneth invocations
can see the audit history per page. Multiple audits on the same day get a `-HHMM` suffix.

Hand the audit back with a `file` link widget pointing to the `./artifacts/` copy.

Use this exact shape. No preamble, no apology, no recap of the page.

```markdown
# CRO Audit — {{Brand}} ({{URL}})
_Generated: {{ISO timestamp}} · Traffic: {{source}} · Goal: {{goal}} · ICP: {{icp}}_
_Source summary: /agent/brain/landing-pages/<slug>--<domain>.md (fetched {{summary-fetched-ts}})_

## Verdict
One sentence. The biggest leak.

## Layer scoreboard
| Layer | Verdict |
| --- | --- |
| 1. Message match | PASS / CONCERN / FAIL / INSUFFICIENT_INPUT |
| 2. 5-second test | |
| 3. Awareness alignment | |
| 4. Positioning clarity | |
| 5. Scroll jobs | |
| 6. Friction | |
| 7. Proof & risk reversal | |
| 8. CTA architecture | |

## Evidence
3-5 bullets, each quoting the actual page or ad. Verbatim.
- "{{quoted page state}}"
- "{{quoted ad copy or page state}}"
- ...

## Top 3 Fixes (ranked by expected lift x ease)

### 1. {{Specific fix name}} — Layer {{N}}
**Current:** "{{verbatim from page}}"
**Replace with:** "{{specific replacement copy or layout change}}"
**Why:** {{1-2 sentences tying to evidence and conversion mechanism}}
**Impact:** high / med / low · **Effort:** <1h / 1d / 1wk
**How to measure:** {{primary metric + guardrail}}

### 2. {{Specific fix name}} — Layer {{N}}
...

### 3. {{Specific fix name}} — Layer {{N}}
...

## A/B Test Queue (after fixes ship)
1. **Hypothesis:** {{specific testable claim}}
   **Variant:** {{what to test against control}}
   **Primary metric:** {{KPI}} · **Guardrail:** {{don't-regress metric}}
   **Min sample size estimate:** {{N. Based on baseline CVR if known}}

2. ...

3. ...

## Don't Touch
1-2 things that are working. Protect them from well-intentioned redesigns.
- "{{element + why it works}}"
- ...

## Out of scope (flag, don't fix)
- {{e.g. "Hero video weight ~2.5MB drops mobile LCP. That's a dev ticket, not copy"}}
- ...
```

### Phase 4 — Index The Audit

Update `/agent/brain/cro-audits/_index.md` with one row per audit, most recent first.

Row format:

```
- {{Brand}} {{page name}} — `<slug>--<domain>` — {{audit date}}
  - URL: {{URL}}
  - Traffic: {{source}} · Goal: {{goal}}
  - Verdict: {{one line from the audit}}
  - Top fix: {{fix #1 name}}
  - Audit file: /agent/brain/cro-audits/<slug>--<domain>/<YYYY-MM-DD>.md
  - Source summary fetched: {{summary fetched ts}}
```

Update `/agent/INDEX.md` once per page (not once per audit). Preserve `created` on update.
The `updated` field reflects the most recent audit.

```
- path: /agent/brain/cro-audits/<slug>--<domain>/
  aliases: cro audit, landing page audit, <brand> audit, <hostname> audit, optimize <brand>
  note: CRO audit history for <Brand> <page name>. One file per audit at <YYYY-MM-DD>.md (or with -HHMM suffix). Latest top fix: <fix name>. Latest verdict: <one line>. Source summary lives at /agent/brain/landing-pages/<slug>--<domain>.md.
  created: <first-audit date>
  updated: <latest-audit date>
```

### Phase 5 — Offer Follow-Ups

After the audit, surface 3 follow-up actions as short one-liners the user can pick from:

- "Rewrite the hero for `--traffic` and three audience-temperature variants"
- "Draft 3 testimonial-led variants of the social-proof section"
- "Write the next 3 A/B tests after the top fix lands"
- "Build a creative brief for ad variants that match the new hero"
- "Spec the redesigned form (3-field max) ready for dev handoff"

---

## Rules

- **Always re-fetch the page summary.** No exceptions. Invoke `landing-page-summary` fresh
  in this conversation before running the diagnostic.
- **Quote before you prescribe.** Always "The hero says X. Change to Y." Never abstract.
- **Top 3 only** unless explicitly asked for more. A 30-item list is a 0-item list.
- **Match traffic temperature:**
  - Cold Meta -> hero clarity + proof + outcome-first messaging.
  - Retargeting -> objection handling + risk reversal + urgency.
  - High-intent search -> specificity + comparison + decisive CTA.
  - Email -> continuity with email copy + reduce duplicate explanation.
- **Stage-appropriate prescriptions.** Do not recommend pricing-page tweaks for cold
  traffic.
- **No vague verbs.** "Improve the headline" is useless. Write the replacement headline.
- **Conversion math when relevant.** "Form field 7 typically drops ~30% of completions
  vs. a 3-field version."
- **Separate copy fixes from dev fixes.** A 6s LCP is a ticket, not a paragraph rewrite.
  Flag it under "Out of scope".
- **No dark patterns.** No fake scarcity, no deceptive CTAs, no fabricated testimonials,
  no manipulative loss-aversion that isn't honest.
- **No "rewrite the whole page" recommendations.** Three changes that matter. The user can
  ask for more.
- **Honor missing inputs.** Without `--ad-copy`, Layer 1 is a guess. Mark it
  `INSUFFICIENT_INPUT` rather than fabricate.
- **Cite the summary section** (e.g. "from summary § 4.3") so the user can trace evidence.
- **Never fabricate page copy.** Only quote what was actually extracted. If extraction was
  partial, say so.
- **Save durable + hand off.** The `./artifacts/` copy is what the user opens this turn.
  The `/agent/brain/cro-audits/` copy is what the future Runneth can recall.
- **Update both indexes.** Local `_index.md` and global `/agent/INDEX.md` on every audit.
