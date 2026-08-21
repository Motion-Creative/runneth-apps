---
name: dashboard-design
description: Build and refine polished Runneth dashboards and app-style pages with the Web Awesome design system, Astro app shell, dashboard data files, KPI strips, creative galleries, charts, tables, responsive layouts, theme tokens, and browser controllers. Use when creating, redesigning, reviewing, or fixing a dashboard, analytics page, performance report, or other data-heavy app UI, including requests involving chart composition, creative thumbnails, performer galleries, dashboard interaction patterns, or dashboard visual consistency. Also use automatically whenever Meta validation builds, rebuilds, or refreshes the weekly report dashboard during onboarding; the customer never has to name this skill.
---

# Dashboard Design

Build polished, usable dashboards with the Runneth Web Awesome design system. Keep the data
model, visual hierarchy, component selection, and interaction behavior consistent across the
page.

## Build workflow

**Step 0 is a hard gate. Do not write any Astro source, data files, or controller code until
all three reads in this step are complete in the current turn.**

### Step 0 — Read the references (required before any markup)

Read all three of the following files now, in this turn, before proceeding:

1. `/runneth/references/design-system.md` — page models, component catalog, layout strategy,
   theme rules, and handoff contract.
2. `references/component-patterns.md` — exact implementation patterns for the app shell, KPI
   strip, creative gallery, chart card, gear settings controller, settings panel CSS, data
   tables, and tooltip positioning. The gear button markup, controller wiring, and settings
   panel CSS that every chart card requires are defined here and nowhere else.
3. `references/performance-dashboard-rules.md` — chart group count thresholds, metric
   combination rules, representative creative selection, thumbnail safety rules, performer
   gallery caps, chart settings requirements, common mistakes table, and the pre-handoff
   checklist. The `image-key` rules for creative-row charts versus category charts are defined
   here and nowhere else.

Also read the file under `/runneth/references/components/` for every specific component the
page will use (`kpi-strip.md`, `creative-card.md`, `creative-chart.md`, etc.) before writing
markup that uses that component.

Do not proceed past Step 0 until every file listed above has been read in this turn. Prior
knowledge of these files from earlier turns is not a substitute for reading them now.

If any required file is missing, unreadable, or truncated, stop and name the exact path that
could not be read. Ask for that reference to be restored or made available. Do not produce an
implementation plan, component recommendation, data model, markup, pseudocode, or controller
code from the remaining references.

### Step 1 — Choose the page shape

Determine whether the page is an app-like dashboard or a top-to-bottom narrative report,
then commit to one model. Never mix the two.

- Dashboard or app-like: use `wa-page` with its header slot.
- Narrative report: use `report-*` elements with no header slot.

### Step 2 — Settle the data model

Write the required `data/*.json` files before composing any page markup. Keep one source of
truth per chart group and its representative creative. Use `null` for missing media and `"—"`
for missing displayed field values. Keep raw data transformation separate from component markup.

### Step 3 — Build the shell and hierarchy

Compose from the scaffold elements and design system components identified in Step 0.
Never hand-roll cards, tables, charts, modals, or form controls. Wrap the page in
`src/layouts/Base.astro`; never duplicate the Web Awesome loader or scaffold bundle.

### Step 4 — Add controllers

Put chart population, gear panel toggles, gallery expansion, and hover behavior in narrow
TypeScript controllers imported from the Astro page. Keep all per-chart gear logic in one
controller file. Listen for `wa-change`, not `change`, on Web Awesome form controls.

### Step 5 — Verify against the pre-handoff checklist

Run through the checklist in `references/performance-dashboard-rules.md` before calling the
dashboard complete. Then run `app build` and `app verify` and confirm `dist/index.html` exists.

Keep the app private through Motion authentication unless the user explicitly requests public
sharing.

---

## Choose one page shape

- Use `wa-page` with its header slot for dashboards and app-like pages.
- Use `report-*` elements for a narrative report that reads from top to bottom.
- Never mix the two page models.
- Always wrap the page in `src/layouts/Base.astro`; never duplicate the Web Awesome loader or
  scaffold bundle.

## Keep data outside the template

- Render dashboard content from `data/*.json` files.
- Do not hard-code dataset constants in Astro frontmatter.
- Keep one source of truth for each chart group and its representative creative.
- Use `null` for missing media and `"—"` for missing displayed field values.
- Keep raw data transformation separate from component markup.

## Own visual identity in the theme

- Put colors, spacing, shadows, typography, and radius overrides in
  `src/themes/runneth.css`.
- Use the lime brand token (`--wa-color-brand-60: #c1f14b`) with dark-on-brand text
  (`--wa-color-brand-20`).
- Use the system UI font stack and a 1.5 radius scale for softer corners.
- Limit page CSS to layout, responsive composition, and small component rules built from
  `--wa-*` tokens.
- Do not add color literals to page CSS. The only established exception is the explicit white
  chart-settings panel background described in the component reference.

## Compose the page

- Put `layout-stack gap="2xl"` at the root of `<main>`.
- Put at most one `kpi-strip` first inside `<main>`.
- Wrap each logical section in `<section>` with `layout-stack gap="m"`.
- Place the section title and one-line description outside the chart or content card.
- Keep page headers compact: title on the left and context badges plus
  `buildeth-theme-toggle` on the right.

Use this type hierarchy:

| Element | Size | Weight |
| --- | --- | --- |
| Page title | `--wa-font-size-xl` | `--wa-font-weight-bold` |
| Section title | `--wa-font-size-lg` | `--wa-font-weight-semibold` |
| Section description | `--wa-font-size-s` | Normal, quiet text |
| Card header label | `--wa-font-size-s` | Semibold, quiet text |
| Table or chart body | `--wa-font-size-s` | Normal |
| Badge or pill | `--wa-font-size-xs` | Normal |

## Select dashboard components

- Use `kpi-strip` for the metric bar; never synthesize it from `wa-card` panels.
- Use `creative-card` for creative or ad evidence.
- Use `layout-grid gap="m" style="--min-column-size: 16rem"` for responsive creative
  galleries.
- Use `creative-chart` for magnitude comparisons that meet the group-count rules.
- Use `creative-table` for every tabular view; never use a raw `<table>`.
- Use Web Awesome controls such as `wa-button`, `wa-input`, and `wa-switch`; avoid raw controls
  when a system component exists.
- Use Phosphor icon names such as `gear`, `arrow-right`, and `chart-bar`.

## Build charts for scanning

- Stack charts vertically at full width in `layout-stack gap="xl"`; never use a 2x2 chart grid.
- Give each chart its own section header and `wa-card`.
- Put the metric label left and per-chart gear control right in the card header.
- Set height on `creative-chart`, not on a fixed-height card or grid container.
- Default to one metric. Add a second only when it changes the strategic decision for at least
  one bar.
- Show a legend only when the chart has multiple series.
- Keep chart tooltips metric-only; never inject playable media.
- Position the tooltip beside the hovered bar when an override is needed.

## Handle creative media safely

- Set `media="video"` for video creatives even when only a poster is available.
- Set `src` to the video URL and `poster` to the thumbnail; never set video `src` to a thumbnail.
- Point chart `image-key` only at still-image thumbnails or posters.
- Use `null` rather than a placeholder URL when a thumbnail is missing.
- Use only stable `motionaccountassets.blob.core.windows.net` thumbnails. Reject expiring
  `scontent` and `fbcdn` URLs during extraction.
- Use the same representative creative for the chart thumbnail and any associated preview.

## Keep interactions in controllers

- Put runtime data fetches, chart population, settings toggles, gallery expansion, and hover
  behavior in imported TypeScript controllers.
- Keep controllers narrow and feature-named, such as `chart-interactions.ts` or
  `live-ranking.ts`.
- Call `customElements.whenDefined(tagName)` before setting complex properties.
- Use `setAttribute` and `removeAttribute` for attribute-driven component behavior.
- Listen for `wa-change`, not `change`, on Web Awesome form controls.
- Do not build stable scaffold markup with `innerHTML`.
- Keep per-chart gear logic in the chart controller only. Splitting it across files creates
  duplicate listeners and immediately closing panels.

## Verify before handoff

- Confirm the theme owns visual tokens and page CSS contains no unintended color literals.
- Confirm charts are stacked full-width and have no internal scrolling.
- Confirm every chart has the correct group count, metric count, legend state, and stable
  thumbnail source.
- Confirm every gallery card renders the same fields and uses `"—"` for missing values.
- Confirm galleries show at most eight cards initially and expose a show-more control only when
  needed.
- Confirm section headers remain outside cards.
- Confirm all interactive controls work by keyboard and expose correct ARIA state.
- Confirm responsive layouts work at narrow and wide widths.
- Run the build and verification commands before declaring the dashboard complete.
