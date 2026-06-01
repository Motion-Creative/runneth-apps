# Benchmark Priors Supplement

Companion to `/runneth/references/creative-benchmarks.md`. That file is the canonical benchmark policy for `motion benchmark-compare` interpretation, scope, truthfulness, and answering rules. It covers 8 of the 14 benchmark priors from Motion's 2026 dataset. This file adds the seven framings not present there.

## Read order

When answering a benchmark question:

1. Read `/runneth/references/creative-benchmarks.md` first. That's the spine.
2. Read this file second for the additional framings and exploratory priors.

## Net-new framings (Tier 1 priors not in the spine reference)

### 1. More testing volume is associated with more winners (anti-causal phrasing)

Use this to explain why stronger accounts often ship more creative volume.

**Phrase it as:** "More testing volume is associated with more winners."

**Do not say:** "Volume causes success."

The data shows the correlation, not the mechanism. Higher-output teams produce more winners because they get more chances at it, and possibly because they have other strengths that compound with output. Causal language overclaims the dataset.

### 2. Most creatives die early, but most spend does not

Use this when explaining how portfolios actually work. Portfolios contain lots of short-lived tests — many creatives are killed within their first weeks or never get past initial scrutiny. But spend doesn't follow that distribution. Spend concentrates into a smaller set of strong assets that survive and scale.

This framing is the bridge between "high loser-creative share" (which can look alarming) and "healthy spend concentration" (which is the actual signal). A portfolio with a lot of dead creative is normal. A portfolio where dead creative is also pulling spend is not.

### 3. A small winner set absorbs disproportionate spend

Use this to explain spend concentration in plain English. The winners aren't a small slice of attempts that happen to also be a small slice of spend. They're a small slice of attempts that absorb a disproportionately large slice of spend. The implication: when winner share is healthy, spend allocation usually follows; when winner share is small but spend isn't concentrating into the survivors, the portfolio has a delivery or selection problem worth examining.

### 4. There is no single universal testing-volume target

Use this to stop the agent from giving one benchmark volume number to every brand. Vertical, spend tier, and brand-specific context all matter. Testing volume is the one benchmark metric that's potentially category-specific (per `creative-benchmarks.md` metric scope rules), but even within a category the "right" volume varies. Frame target ranges, not single numbers.

## Tier 2 exploratory priors (notebook-only, not part of the published benchmark report)

Treat these as directional research observations, not benchmark rules. Soften causal language.

### 5. More active brands also tend to be more diverse

In the source dataset, brands that produce more creative also produce more *kinds* of creative — variety across visual format, asset type, and hook/headline tactic. High-output teams are not just shipping more of the same thing.

**Note:** "Diversity" here means taxonomy diversity (visual format, asset type, hook/headline tactic), not message diversity or audience diversity. The exploratory analysis didn't measure those.

### 6. Diversity appears more connected to portfolio depth than breakout wins

In the source exploration, diversity correlated more strongly with the size of the productive mid-range portfolio than with the production of breakout winners. The takeaway: diversity may support a stronger evergreen bench (the working middle of the portfolio that keeps spend efficient while new tests run) more than it acts as a direct winner machine. Don't sell diversity as the path to more winners. Sell it as the path to a more resilient mid-range.

## Net-new guardrail

### 7. Absence from a leaderboard is not proof of irrelevance

Report leaderboards only include segments with sufficient account coverage. If a format, hook, or asset type doesn't appear on a leaderboard, that may be a coverage limit, not a signal that the segment doesn't perform. Don't tell a brand "your format isn't on the leaderboard, so it's irrelevant." Tell them "the source didn't have enough accounts in that segment to publish a finding either way."

## Source-language safety rule

Never use the labels "Tier 1," "Tier 2," "report-backed," or "notebook-only" in user-facing text unless the user explicitly asks about methodology or sources.

Translate to plain English:

- For Tier 1 findings, say things like "Across Motion's 2026 benchmark report..." or "In Motion's 2026 benchmark data..."
- For Tier 2 (notebook) findings, say things like "In additional directional research behind the benchmark work..." or "This is a directional research signal, not a hard benchmark rule."

The user should hear the confidence level. They should not need to know what a notebook is.
