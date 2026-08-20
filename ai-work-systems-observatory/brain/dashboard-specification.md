# Dashboard specification

## Product position

The Observatory is a system ledger and operating review. It is not a token meter, prompt leaderboard, transcript browser, or employee scorecard.

## Navigation

1. **Executive overview**
   - What changed?
   - What evidence of value exists?
   - What is at risk?
   - Which workflows need intervention?
   - What decisions must leadership make?

2. **How teams work**
   - Team-level workflow coverage.
   - Proactive versus interactive work as an activity distribution only.
   - Ownership coverage.
   - Consumption and use evidence.
   - Missing source or identity coverage.

3. **Operating systems**
   - System and workflow portfolio.
   - Business job, owner, trigger, input provenance, output, health, control, evidence stage, and maintenance path.
   - Maturity distribution with confidence and last-confirmed date.

4. **Risks and decisions**
   - Missing owners.
   - Stale inferences.
   - Failed or degrading execution.
   - Missing human controls.
   - Sensitive-data and source-scope gaps.
   - Decisions required with accountable owner and review date.

## Visual language

Borrow Wispr's calm hierarchy, large interpretable metrics, narrative cards, and approachable progress language. Do not borrow its people leaderboard as a performance model.

Use the Runneth brand system:

- Cream page background.
- White or warm gray cards.
- Dark warm brown text.
- Lime accent.
- Butter-yellow highlight panels.
- Inter typography.
- Ten-pixel card radius.
- Flat design with no shadows and no gradients.
- Light theme by default.

Use Motion's Astro and Web Awesome scaffold, `wa-page`, `kpi-strip`, `layout-*`, `wa-card`, `creative-chart`, `creative-table`, and `buildeth-theme-toggle`. Do not hand-roll cards, tables, charts, controls, or layout grids.

## Data behavior

- Load `data/observatory.json` at runtime with cache disabled.
- Keep source data sparse. Do not invent, interpolate, or backfill missing evidence.
- Show a visible illustrative-data banner when `meta.mode` is `illustrative`.
- Show source coverage and last refreshed timestamp on every view.
- App visibility is private by default and reversible.
