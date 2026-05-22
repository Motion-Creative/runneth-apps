# Landing page summary

## What just opened up
Runneth can now visit any landing page with a real headless browser and produce a recreation-quality spec: every section, every CTA, every form field, the visual system, the voice. The output is a durable markdown file at a stable path that the rest of the landing-page bundle (brand-kit, optimize-landing-page, landing-page-experiments) reads fresh on every run.

## Try this now
1. **Summarize your main landing page**: `Summarize [landing-page-url] and save it.`
   _You'll get back:_ Playwright opens the page, extracts the full spec, and writes it to `/agent/brain/landing-pages/<slug>--<domain>.md`.
2. **Summarize a reference page you want to study**: `Summarize [competitor-or-reference-url].`
   _You'll get back:_ the same spec format saved alongside; you can compare side by side later.
3. **Refresh after a page update**: `Re-summarize [landing-page-url] and show me what changed.`
   _You'll get back:_ a refreshed spec, the prior version archived in `_history/`, and a diff of what moved.

## Compounds with
- **brand-kit, optimize-landing-page, landing-page-experiments:** All three downstream skills call this one fresh on every invocation.
