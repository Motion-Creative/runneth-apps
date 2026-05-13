# landing-page-summary — Data Contract

This document defines the stable shape of the markdown file produced by `landing-page-summary`. Downstream skills (`brand-kit`, `optimize-landing-page`) depend on these anchors. Breaking changes here will silently break those skills.

## File path contract

```
/agent/brain/landing-pages/<slug>--<domain>.md
```

- Path is stable. One file per page. Overwritten on re-fetch. Never timestamped in the filename.
- Per-page history: `/agent/brain/landing-pages/_history/<slug>--<domain>/<fetched-iso>.md`. The fetched ISO timestamp (`:` replaced by `-`) is the filename.
- Local index: `/agent/brain/landing-pages/_index.md`.
- Global index: every saved summary is also indexed in `/agent/INDEX.md`.

## Header contract

Line 1: `# Landing Page Summary — {{Brand}} ({{URL}})`

Line 2: `_Fetched: {{ISO 8601 with tz offset}} · Depth: {{depth}} · Browser: Playwright (auto-installed) / Chromium_`

Downstream skills parse the `_Fetched:` value from line 2 to display provenance and (where applicable) verify freshness expectations.

## H2 section contract (stable anchors)

These H2 headings are the load-bearing contract. Renaming, reordering, or removing them breaks downstream consumers. Add new sections at the end. Never remove or rename existing ones in a non-major version.

| Anchor | Section | Required | Read by |
| --- | --- | --- | --- |
| `## TL;DR` | Strategic one-paragraph summary | Always | optimize-landing-page |
| `## 1. Meta` | Title, description, OG, canonical, structured data | Always | brand-kit |
| `## 2. Nav` | Nav items, announcement bar | Always | brand-kit, optimize-landing-page |
| `## 3. Hero` | Hero copy, CTAs, microcopy, trust elements | Always | brand-kit, optimize-landing-page |
| `## 4. Sections (in scroll order)` | Section-by-section content | Standard + Exhaustive | optimize-landing-page (scroll-job audit) |
| `## 5. Proof` | Logos, testimonials, case studies, stats | Standard + Exhaustive | brand-kit, optimize-landing-page (proof audit) |
| `## 6. Pricing` | Tier table | If present | optimize-landing-page |
| `## 7. FAQ` | Q&A | If present | optimize-landing-page |
| `## 8. Forms` | Form fields, submit copy, thank-you state | **Always when any form exists** | optimize-landing-page (friction audit) |
| `## 9. Footer` | Footer copy and links | Always | brand-kit |
| `## 10. Full link catalog` | Every link | Exhaustive only | (advanced) |
| `## 11. Full media catalog` | Every image/video | Exhaustive only | (advanced) |
| `## 12. Visual system (observed)` | Color, typography, spacing, components | Standard + Exhaustive | brand-kit (verifies via computed DOM) |
| `## 13. Voice` | Register, sentence length, signature words | Always | brand-kit, optimize-landing-page |
| `## 14. Interactive behaviors` | Sticky, animations, popups | Standard + Exhaustive | optimize-landing-page (friction audit) |
| `## 15. Tech fingerprint` | Stack, analytics, pixels, form providers | Always | brand-kit (favicon discovery), optimize-landing-page |
| `## 16. Accessibility signals` | Alt text, labels, ARIA | Standard + Exhaustive | (advanced) |
| `## 17. Gaps` | What's undetermined and why | Always | All consumers |

## Reliability annotations

### § 12 — Visual system

Values in § 12 come from raw stylesheet extraction. Frameworks like Webflow, Framer, and WordPress declare every token in their stylesheets including unused template defaults. **Color, font, and radius values in § 12 may include values that never render on the page.**

Downstream consumers that care about the visual system (notably `brand-kit`) must re-extract via computed DOM styles and verify against screenshots. § 12 is acceptable as a directional hint, not as ground truth.

### § 8 — Forms

Form data is authoritative when extracted from HubSpot's embed JSON endpoint (network interception). Inline DOM forms are next most reliable. Exit-intent popup forms only exist if exit-intent simulation triggered them.

### `[gap: <reason>]` convention

Any field the skill could not extract is marked `[gap: <reason>]`. Consumers must not invent values to fill gaps. Treat `[gap: ...]` as an explicit unknown.

## Field-level extraction rules

- **Verbatim copy:** every quoted string in §§ 2-5, 6, 7, 9 is the literal text from the page. Paraphrasing is a contract violation.
- **Hero headline (`## 3. Hero` → Headline):** preserves intentional line breaks from the rendered page.
- **CTA hrefs:** absolute URLs after redirect resolution where possible.
- **Form fields:** include all hidden fields and labels even if not visible to the user (HubSpot UTM and lead-source tags often hide here).

## Versioning

This contract uses semver:

- **Patch** (1.0.x): editorial wording inside cells, additional optional metadata, new entries inside existing tables.
- **Minor** (1.x.0): new H2 sections appended at the end, new fields in tables that downstream consumers can ignore.
- **Major** (x.0.0): renaming or removing any existing H2 anchor, restructuring an existing section.

Current contract version: **1.0.0**.

## When to break the contract

Don't. If a downstream skill needs a new field, add it as an additional bullet inside an existing section or append a new H2 at the end. Renaming an existing H2 silently breaks every consumer.
