# Optimize landing page

## What just opened up
Runneth can now audit a landing page through a CRO lens and return the top 3 fixes ranked by expected lift times ease, plus a short A/B test queue, plus a "don't touch" list of things already working. Built for the workflow where creatives point at a page: the audit checks message match between ad copy and hero, the most decisive killer of paid conversion.

## Try this now
1. **Audit your highest-traffic page**: `Audit [landing-page-url] for CRO and give me the top fixes.`
   _You'll get back:_ a fresh page pull, 8-layer audit, top 3 fixes with lift x ease scoring, short test queue appendix, and a "don't touch" list. Saved to `/agent/brain/cro-audits/<slug>--<domain>/<date>.md`.
2. **Audit with ad copy as the input**: `Audit [landing-page-url] specifically for message match against this ad copy: [paste the ad].`
   _You'll get back:_ the audit weighted heavily on hero-ad alignment, with specific copy fixes to close the message-match gap.
3. **Compare to a prior audit**: `Show me what's changed on [landing-page-url] since the last audit.`
   _You'll get back:_ a diff of prior fixes (shipped vs. unshipped) and a fresh round of recommendations that doesn't repeat what's already done.

## Compounds with
- **landing-page-summary:** Always invoked fresh as the evidence layer.
- **landing-page-experiments:** The audit's test queue feeds directly into the experiments backlog.
