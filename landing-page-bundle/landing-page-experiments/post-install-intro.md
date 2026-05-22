# Landing page experiments

## What just opened up
Runneth can now generate a prioritized A/B test backlog for any landing page: 10-20 tests grouped by element and hypothesis type, each with verbatim current state, specific variant copy, primary metric, guardrail, expected lift band, win-rate prior, minimum sample size estimate, effort, score, and a "why this might lose" failure mode.

## Try this now
1. **Generate a backlog for your main LP**: `Generate an experiment backlog for [landing-page-url].`
   _You'll get back:_ Runneth pulls the page fresh, runs the prioritization, and writes the backlog to `/agent/brain/experiments/<slug>/<date>.md` plus an artifact copy.
2. **Get the top 3 tests to run this week**: `What are the highest-leverage A/B tests on [landing-page-url] right now?`
   _You'll get back:_ the top 3 from a fresh backlog with rationale, expected lift band, and the variant copy ready to ship.
3. **Stay on-brand with variants**: backlog inherits brand voice automatically if `brand-kit` is installed.
   _You'll get back:_ variant copy that matches your brand voice instead of generic CRO defaults.

## Compounds with
- **landing-page-summary:** Upstream evidence layer; experiments calls it fresh every run.
- **brand-kit:** Variant copy stays on-brand.
- **optimize-landing-page:** Past audits prevent suggesting fixes already shipped.
