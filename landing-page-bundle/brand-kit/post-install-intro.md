# Brand kit

## What just opened up
Runneth can now build a complete brand kit for any client: identity, visual system, voice, application patterns, and anti-patterns. The kit is dense enough that any other skill or agent can produce on-brand work without ever seeing the original brand. After the first kit is built, every future branded output Runneth produces (HTML pages, decks, ads, briefs, dashboards) auto-consults the kit.

## Try this now
1. **Build a kit for your brand**: `Build a brand kit for [your-brand-url].`
   _You'll get back:_ Playwright visits the URL, extracts the visual and voice system, and writes the kit to `/agent/brain/brand-kit/<slug>--brand-kit.md` plus an HTML preview in `./artifacts/`.
2. **Build a kit for a competitor or reference brand**: `Build a brand kit for [competitor-url] so we have it for reference.`
   _You'll get back:_ same flow; the kit gets saved with the brand slug, browseable later when you need to study or borrow.
3. **Update an existing kit after a brand refresh**: `Rebuild the brand kit for [brand].`
   _You'll get back:_ a refreshed kit, the prior version archived in `_history/`, and a diff of what changed.

## Compounds with
- **landing-page-summary:** Upstream evidence layer; brand-kit calls it fresh on every build.
- **landing-page-experiments:** Experiment variant copy stays on-brand by reading the kit.
