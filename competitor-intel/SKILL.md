---
name: competitor-intel
description: >
  Weekly competitive intelligence scan. Pulls each competitor's full active and recently-killed ad
  portfolio, runs survival analysis, diffs against last week's baseline to surface what actually
  changed, and delivers a delta report to a configured Slack channel. Triggers on the weekly
  schedule set at install, or explicitly on "competitor scan", "what are competitors doing",
  "competitive intel", "competitor watch", "run competitor watch", "what changed in the market".
triggers:
  phrases:
    - "competitor scan"
    - "competitor watch"
    - "run competitor watch"
    - "what are competitors doing"
    - "competitive intel"
    - "what changed in the market"
    - "weekly competitor report"
  intent: "User wants a competitive intelligence scan of tracked competitor brands"
  excludes:
    - "set up competitor watch"
    - "add a competitor"
    - "remove a competitor"
    - "change my competitors"
---

# Competitor Intel Alerts — Weekly Competitive Intelligence

Weekly competitive scan for brands tracked in the workspace inspo brands file. Reads the saved inspo brands file,
fetches each competitor's full ad portfolio via `motion inspo-creatives`, runs survival analysis,
diffs against last week's saved baseline, and posts a delta report to Slack.

**Core principle:** The value is in the delta, not the state. "Brand X launched 6 UGC ads targeting
the solopreneur burnout angle this week" is intelligence. "Brand X has 40 active ads" is a fact
sheet. Every finding answers: **what should the team pay attention to this week?**

**Baseline model:** First run establishes baselines. Every subsequent run diffs current state
against the previous baseline, reports what changed, and writes a new baseline.

---

## Phase 1 — Load context and inspo brands

### 1a. Resolve workspace

Run `motion workspace-goal`. Capture the workspaceId. Use it for all subsequent `motion` calls.

Derive a readable workspace slug for file paths: lowercase, hyphens for spaces, strip special chars.
Store this as `WORKSPACE_SLUG` for all brain paths below.

### 1b. Load inspo brands

Read `/agent/brain/competition/{{WORKSPACE_SLUG}}/inspoBrands.json`.

If the file is missing or `brands` is empty, halt and invoke `setup-competitor-intel`:
> "Your competitor inspo brands file isn't configured yet. Let me set that up first."
Then re-run from Phase 1b after setup completes.

If the file exists, extract the `brands` array. Each entry contains:
```json
{
  "name": "Brand Name",
  "brandId": "motion-brand-id",
  "slug": "brand-slug",
  "addedDate": "YYYY-MM-DD"
}
```

### 1c. Load own-brand context

Run: `motion brand-context --data-query "brand identity, positioning, and core value propositions"`

Used for competitive comparison framing ("they're messaging X, we message Y").

### 1d. Load baselines

For each brand in the inspo brands file, look for:
`/agent/brain/competition/{{WORKSPACE_SLUG}}/baselines/{brand-slug}.json`

Track which brands have an existing baseline (delta run) vs which are first runs (baseline-only).

### 1e. Load Slack config

Read `slackChannelId` from `/agent/brain/competition/{{WORKSPACE_SLUG}}/inspoBrands.json`.
If missing, post the report as a thread reply and note that Slack delivery isn't configured.

---

## Phase 2 — Pull ad data for each competitor

Run all competitors in parallel. For each brand:

### 2a. Two-pass active portfolio pull

**Pass 1 — newest first:**
```
motion inspo-creatives --brand-id {brandId} --status active --sort newestLaunchDate --limit 150
```
Read the returned file. Extract the creatives array.

**Pass 2 — oldest first:**
```
motion inspo-creatives --brand-id {brandId} --status active --sort oldestLaunchDate --limit 150
```
Read the returned file. Extract the creatives array.

Merge both arrays and deduplicate by creative `id`. The merged set is the full active portfolio.
Log the total count before continuing.

**Why two passes:** The API caps results per sort. Running both sorts and merging captures creatives
that appear at different points in the ordered list, reducing the chance of missing ads at the
boundary. For brands with large portfolios (100+ active ads), both passes are non-negotiable.

### 2b. Recently killed ads (last 7 days)

```
motion inspo-creatives --brand-id {brandId} --status inactive --sort newestLaunchDate --limit 150
```
Read returned file. Filter client-side to creatives where `pauseDate` is within the last 7 days
(compare to today's date). These are the recent kills.

### 2c. Brand context

```
motion inspo-context --brand-id {brandId}
```
Read returned context: positioning, audience, product framing.

---

## Phase 3 — Analysis

For each competitor's merged portfolio:

### 3a. Survival cohort classification

Classify every active creative by age (days since `launchDate` to today):

| Cohort | Age | Signal strength |
|--------|-----|-----------------|
| Long-runners | 60+ days | Very high — proven, durable, evergreen |
| Survivors | 15–59 days | High — past the typical kill window, likely performing |
| Testing zone | 7–14 days | Medium — past first cut, evaluation still possible |
| Fresh tests | < 7 days | Strategic intent — reveals what they're thinking RIGHT NOW |

**Important:** Inactive doesn't always mean failed. Before labeling a killed ad as underperformance,
look for clues: does it mention a date, promo, or event? Was it running for 2+ weeks before pause
(adequate test window)? Is there a newer ad with similar messaging (replacement iteration)?
Quick kills under 5 days with no promo content = most likely genuine underperformance.

### 3b. Format and production analysis

From the merged active portfolio:
- Video / static / carousel split (count + percentage)
- Production styles present: UGC, screen recording, talking head, motion graphics, studio
- Do certain production styles cluster in specific cohorts?

### 3c. Messaging theme extraction

Scan hooks, headlines, and body copy across the active portfolio:
- Group hooks by type: problem-agitation, testimonial/social-proof, bold claim, question, demo walkthrough
- Rank value propositions by frequency across ads (frequency = conviction level)
- Identify dominant emotional registers: fear, aspiration, frustration, curiosity, urgency
- Quote actual hooks verbatim for the top 3-5 recurring angles — don't paraphrase

### 3d. Feature and product emphasis

- Which product features appear most across active ads? Rank by mention frequency.
- Any features they're promoting that we don't have? (competitive gap signal)
- Any features we have that they're NOT promoting? (possible differentiation angle)

### 3e. Test cluster identification

Group ads that appear to be variants of the same test:
- Same script / messaging angle, different hook → hook A/B test
- Same hook, different format (UGC vs studio) → format test
- Same ad across multiple creators → creator/audience test
- 3+ fresh tests launched on the same day → coordinated launch

Name each cluster: "They're testing whether [X] outperforms [Y] for [messaging angle]."

### 3f. Competitive positioning check

For the full active portfolio: if a prospect evaluating your brand saw these ads today, how would
it affect their thinking?
- What claims are they making that we can't match?
- What claims are they making that we do better but aren't advertising?
- What social proof could sway a prospect in a competitive deal?

---

## Phase 4 — Delta computation

**Only run for brands with an existing baseline. Skip for first-run brands.**

Load `baselines/{brand-slug}.json`. Compare:

**Volume and velocity:**
- Total active ads now vs baseline count (net change)
- Ads that launched since the baseline date
- Ads that went inactive since the baseline date
- Weekly cadence trend (accelerating / steady / slowing / paused)

**Strategic shifts:**
- New messaging themes present this week that weren't in the baseline
- Format mix changes (e.g., UGC ratio increased from 20% to 45%)
- Features promoted this week that weren't in the baseline
- Brand context / positioning shifts

**What survived:**
- Ads that were in the baseline's active inventory AND still active this week = confirmed performers
- Ads that were in the "Testing Zone" (7–14 days) in the baseline and graduated to "Survivors" (15+ days) this week

**What they stopped doing:**
- Messaging angles from the baseline that have no live counterpart this week
- Format types abandoned since the baseline
- Claims or product features that dropped out

**Signal strength guide:**

| Signal | Strength |
|--------|----------|
| Survivor with new messaging angle not in baseline | Very high |
| 3+ fresh tests all exploring the same new theme | High |
| Feature promotion for something we don't have | High |
| Format mix shift (e.g., UGC ratio doubled) | Medium |
| Volume spike or drop vs last week | Medium |
| Single ad with unusual approach | Low–medium |
| Minor copy variations on existing themes | Low — skip unless pattern emerges |

---

## Phase 5 — Own-brand self-benchmark

Read `ownBrandId` from `/agent/brain/competition/{{WORKSPACE_SLUG}}/inspoBrands.json`.

If `ownBrandId` is null or missing, skip this phase and note in the report that own-brand
comparison is unavailable. To enable it, re-run `setup-competitor-intel` — it will search
Motion's ad library for the workspace brand and store the ID.

If `ownBrandId` is set, pull own-brand active ads:
```
motion inspo-creatives --brand-id {ownBrandId} --status active --sort newestLaunchDate --limit 150
motion inspo-creatives --brand-id {ownBrandId} --status active --sort oldestLaunchDate --limit 150
```
Merge and deduplicate. Apply the same cohort classification and messaging analysis.

---

## Phase 6 — Report

Generate the competitor watch report as a formatted Slack message + full report text.

### Report structure

```
# Competitor Intel Alerts — {{DATE}}
Workspace: {{WORKSPACE_NAME}} | Competitors: {{N}} scanned | Baseline: {{first run / delta from YYYY-MM-DD}}

---

## What Changed This Week
[3–5 bullets MAX. Only findings that materially shift the competitive picture.
Each bullet: what shifted + why it matters + what to consider.
If nothing significant: "Stable week — no major competitive shifts detected."]

---

## [Competitor Name] — [one-line read: quiet / active / shifting / launching]

**Active Portfolio:** N total | Video X% / Static Y%
**30-Day Launches:** N launched | N survived | N killed | X% survival rate
**Weekly Cadence:** accelerating / steady / slowing / paused

**Live Strategy:**
- [Top messaging themes ranked by frequency]
- [Dominant hooks — quote actual hooks verbatim]
- [Format and production strategy]
- [Features being promoted]

**Survivors (15+ days, still running):**
- [Pattern: what long-runners have in common — this is the clearest signal of what's working]

**Fresh Tests (this week):**
- [New launches — what they're testing, what it signals about strategic intent]

**Test Clusters:**
- [Cluster: name the bet, N ads, what they're varying]

**Competitive Eval:**
- [If a prospect saw these ads, how would it affect competitive positioning against us?]

**Delta from Last Week:**
- [What's new, gone, or shifted. Skip this section entirely if first run.]

[Repeat per competitor.]

---

## Your Brand vs Competitors

| Dimension | You | [Comp 1] | [Comp 2] | Read |
|-----------|-----|----------|----------|------|
| Active ads | N | N | N | [who's investing more] |
| Oldest active ad | Xd | Xd | Xd | [portfolio maturity] |
| Video/static split | X% | X% | X% | [format strategy] |
| Biggest messaging bet | [what] | [what] | [what] | [overlap or gap] |
| Key feature promoted | [what] | [what] | [what] | [positioning overlap] |

**Gaps worth testing:**
- [Things competitors do that we don't — worth a test?]
- [Things we do that nobody else does — double down?]

---

## Recommended Actions
[2–3 specific, grounded-in-findings actions.
Each connects to a specific finding above.
NOT "diversify your creative mix" — instead: "Test a UGC creator ad using
the [exact messaging angle] that has been running [N] days for [competitor]."]
```

### Report writing rules

- Lead with "What Changed." The opening section is the full value for a skimming reader.
- On delta runs: report change, not state. "No changes" = one line or skip.
- Quote actual hooks. Don't summarize when the verbatim copy is more useful.
- Include specific numbers everywhere: days active, ad counts, survival rates, format splits.
- Signal honestly: you're reading bets, not results. "They're testing this" not "this is working."
- Recommendations must be specific. "Test a UGC confessional ad where a creator admits [frustration]
  before showing the product" not "consider UGC."
- 5-minute read max. If the market is quiet, make it 2 minutes.

---

## Phase 7 — Slack delivery

### 7a. Craft the Slack teaser message

A 4–5 line teaser that makes the team want to read the full report. NOT a summary.

Structure:
```
🔍 *Competitor Intel Alerts — {{DATE}}*

[One punchy headline: the single most surprising finding. Specific and provocative.]

*Top signals this week:*
• [Sharpest competitive move — quote a hook, name the competitor, give specific days/counts]
• [Something that directly affects the team's next creative decisions]

Full report in thread 👇
```

Rules:
- Lead with the deepest, most specific insight — the kind you'd only know after pulling 100+ ads.
- Quote actual hooks and include specific numbers (days active, ad counts, survival rates).
- Never use generic category-level observations. Bad: "Everyone is using video." Good: "Brand X's
  only long-runners (62 days each) are all static — their video tests keep dying at the 10-day mark."
- No emojis beyond the 🔍 opener.

### 7b. Post to Slack

Read `slackChannelId` from the inspo brands config. If present, post the teaser to the channel.
Follow with the full report in a thread reply under the teaser.

Before posting, apply the pre-post check: read what's already in the thread (if any), verify this
isn't a duplicate of a report already posted today, and confirm the teaser is meaningfully different
from last week's.

```
slack send --channel {slackChannelId} --text "{teaser message}"
```
Post the full report text as a thread reply to the teaser.

If `slackChannelId` is not configured, post the full report as a visible reply in the current
conversation.

---

## Phase 8 — Update baselines

After the report is delivered, write the new baseline for each scanned competitor.

**Baseline file path:** `/agent/brain/competition/{{WORKSPACE_SLUG}}/baselines/{brand-slug}.json`

**Baseline schema:**
```json
{
  "competitor": "Brand Name",
  "brandId": "motion-brand-id",
  "lastScanned": "YYYY-MM-DD",
  "activeAdCount": 42,
  "formatMix": { "video": 0.67, "static": 0.33 },
  "activeAdInventory": [
    {
      "id": "creative-id",
      "format": "video",
      "hook": "verbatim hook text here",
      "launchDate": "YYYY-MM-DD",
      "daysActive": 14,
      "cohort": "testing-zone"
    }
  ],
  "messagingThemes": [
    { "theme": "theme description", "frequency": 8, "exampleHook": "verbatim" }
  ],
  "testClusters": [
    { "name": "cluster name", "adIds": ["id1", "id2"], "variable": "what they're varying" }
  ],
  "survivalCohorts": {
    "longRunners": ["id1", "id2"],
    "survivors": ["id3", "id4"],
    "testingZone": ["id5"],
    "freshTests": ["id6", "id7"]
  },
  "featuresPromoted": ["feature 1", "feature 2"],
  "brandContext": "brief positioning summary from inspo-context"
}
```

Overwrite the previous baseline on each scan. This is a weekly snapshot, not an append log.
Preserve full active ad inventory (IDs + hooks) so the next week's delta can diff exactly.

---

## Error handling

| Condition | Response |
|-----------|----------|
| `inspoBrands.json` missing or empty | Invoke `setup-competitor-intel`, then retry |
| Brand not found in Motion | Notify in the report, skip that brand |
| `motion inspo-creatives` returns 0 creatives | Note thin/no data, don't over-interpret, suggest checking brandId |
| Brand context unavailable | Note it, proceed with ad data only |
| No previous baseline | First-run mode — produce full landscape report, label "Baseline established" |
| Own-brand data unavailable | Skip comparison table, note it |
| Slack channel not configured | Deliver full report in current thread |
