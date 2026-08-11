# Performance Dashboard Rules

Apply these defaults to every performance dashboard before authoring charts, galleries, or
thumbnail-driven components.

## Contents

1. [Chart group count](#chart-group-count)
2. [Metric combinations](#metric-combinations)
3. [Representative creatives](#representative-creatives)
4. [Thumbnail safety](#thumbnail-safety)
5. [Image keys by chart type](#image-keys-by-chart-type)
6. [Performer galleries](#performer-galleries)
7. [Chart settings](#chart-settings)
8. [Common mistakes](#common-mistakes)
9. [Pre-handoff checklist](#pre-handoff-checklist)

## Chart group count

Count distinct bars before selecting a component.

| Group count | Component |
| --- | --- |
| Fewer than 2 | KPI card; there is nothing to compare |
| 2–8 | Bar chart |
| More than 8 | Cap at 8, sorted by spend descending, or use a table |

Cap silently; do not label the chart "top 8." Prefer a chart when magnitude comparison matters
and a table when the user needs detailed lookup.

## Metric combinations

Use one metric by default. Add a second metric only when it answers a genuinely different
strategic question for the same dimension.

Apply this test: **Would the second metric change the decision about any individual bar?**

- If yes, and the metrics are compatible or use independent scales, combine them.
- If no, keep them separate.
- Show the legend only when more than one series is present:
  `show-legend={series.length > 1 ? "true" : "false"}`.

Do not add a second metric for visual symmetry.

## Representative creatives

Choose one representative creative per chart group and reuse it for the bar thumbnail and any
associated preview. Use this selection order:

1. Best-CPA video creative above the spend floor with purchases greater than zero.
2. Best-CPA creative of any format above the spend floor with purchases greater than zero.
3. Best-CPA creative of any format below the floor with purchases greater than zero.
4. Highest-spend creative when the group has no purchases.

Do not maintain separate data files or selection logic for chart thumbnails and previews.

## Thumbnail safety

- Use only still images for chart thumbnails.
- Accept thumbnails from `motionaccountassets.blob.core.windows.net`.
- Reject `scontent`, `fbcdn`, and other Facebook CDN URLs because their signed parameters expire.
- Set the thumbnail field to `null` when no stable image exists.
- Filter unstable URLs during extraction, for example:

```jq
map(select(.thumbnailUrl | test("motionaccountassets")))
```

## Image keys by chart type

Set `image-key="thumbnail"` only when the chart rows follow one of these two contracts:

- **Creative-row chart:** each row represents one creative, and `thumbnail` is that same
  creative's stable still image. Do not substitute a different representative creative.
- **Category chart:** each row represents a product, concept, hook, campaign, or other group,
  and `thumbnail` comes from the single representative creative selected for that group using
  the priority above. Reuse that same creative for any associated preview.

Set a row's `thumbnail` to `null` when no stable still image satisfies the relevant contract.
The chart must fall back to its text label. Never point `image-key` at a video URL, and never
select a separate thumbnail source just for display. A chart's thumbnail switch must add or
remove the `image-key` attribute without changing row data.

## Performer galleries

- Render the same field list on every performer card.
- Render `"—"` when a value is null, empty, or missing; never remove the field.
- Show at most eight cards initially.
- If more than eight cards exist, add a button below the grid that toggles between "Show more"
  and "Show less."
- Do not show the toggle when the gallery contains eight or fewer cards.

Use one controller constant:

```ts
const MAX_VISIBLE = 8;
```

## Chart settings

- Give each chart its own settings gear and thumbnail switch.
- Keep all gear logic in `chart-interactions.ts`.
- Position the panel absolutely relative to the chart header, not fixed to the viewport.
- Use an explicit white background, 260px width, 12px radius, and `z-index: 9999`.
- Set the chart card to `overflow: visible !important` so the panel can escape its boundary.
- Close other chart panels before opening the selected panel.
- Maintain `aria-expanded` and close panels on outside click.

## Common mistakes

| Mistake | Correct approach |
| --- | --- |
| 2x2 chart grid | Stack all charts full-width in `layout-stack gap="xl"` |
| Fixed-height chart container | Let `wa-card` size automatically; set height on `creative-chart` |
| Playable preview in chart tooltip | Keep the tooltip metric-only; use `image-key` for thumbnails |
| Tooltip centered over its bar | Reposition beside the bar in `requestAnimationFrame` |
| One global thumbnail toggle | Use one settings gear and switch per chart |
| Gear listeners in multiple files | Keep all gear logic in the chart controller |
| Different creatives for thumbnail and preview | Use one representative creative |
| Facebook CDN thumbnails | Filter to stable Motion account assets |
| More than eight bars | Cap at eight by spend or use a table |
| Decorative second metric | Add it only when it changes the strategic read |
| Missing fields removed from cards | Render every field with `"—"` as the fallback |
| Unlimited gallery | Show eight initially and toggle the remainder |
| Hard-coded frontmatter data | Load `data/*.json` files |
| Raw table or form controls | Use `creative-table` and Web Awesome controls |
| `wa-card` for creative evidence | Use `creative-card` |
| `wa-card` for KPI metrics | Use `kpi-strip` |
| Listening for `change` on `wa-switch` | Listen for `wa-change` |
| Video URL used as `image-key` | Use a still thumbnail or poster |
| Font Awesome icon name | Use a Phosphor icon name |
| Color literal in page CSS | Put colors in theme tokens, except the documented white settings panel |

## Pre-handoff checklist

- [ ] `src/themes/runneth.css` owns visual tokens.
- [ ] Page CSS has no unintended color literals.
- [ ] Charts are full-width, vertically stacked, and free of internal scrolling.
- [ ] Every chart card has a label-left/settings-right header.
- [ ] Every chart has its own settings dropdown.
- [ ] Chart count follows the KPI/chart/table thresholds.
- [ ] Additional metrics pass the decision-change test.
- [ ] `image-key` points only to a stable still image.
- [ ] Chart thumbnails and previews use the same representative creative.
- [ ] Every performer card renders the same fields.
- [ ] Galleries show at most eight cards initially.
- [ ] Section headings remain outside cards.
- [ ] `kpi-strip` is the first element in `<main>`.
- [ ] Controllers listen for `wa-change` on Web Awesome controls.
- [ ] `app build` passes.
- [ ] `app verify` confirms `dist/index.html` exists.
- [ ] The app remains private unless public sharing was explicitly requested.
