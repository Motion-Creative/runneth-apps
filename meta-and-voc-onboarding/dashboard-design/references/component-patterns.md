# Dashboard Component Patterns

Use these implementation patterns after selecting the dashboard page model. Adapt labels and data,
but preserve component roles and interaction ownership.

## Contents

1. [App shell](#app-shell)
2. [Section layout](#section-layout)
3. [KPI strip](#kpi-strip)
4. [Creative gallery](#creative-gallery)
5. [Chart card](#chart-card)
6. [Chart settings controller](#chart-settings-controller)
7. [Settings panel CSS](#settings-panel-css)
8. [Data tables](#data-tables)
9. [Tooltip positioning](#tooltip-positioning)

## App shell

Use `src/layouts/Base.astro` and the `wa-page` header slot for an app-like dashboard.

```astro
<Base title="Dashboard Name">
  <wa-page class="wa-cloak">
    <div slot="header" class="page-header">
      <layout-split>
        <span class="page-title">Dashboard Name</span>
        <layout-cluster>
          <wa-badge variant="neutral" pill>Date range · Any context</wa-badge>
          <buildeth-theme-toggle></buildeth-theme-toggle>
        </layout-cluster>
      </layout-split>
    </div>
    <main>
      <layout-stack gap="2xl">
        <!-- KPI strip and sections -->
      </layout-stack>
    </main>
  </wa-page>
</Base>
```

Use these theme-driven rules:

```css
.page-header {
  padding: var(--wa-space-s) var(--wa-space-l);
}

.page-title {
  font-size: var(--wa-font-size-xl);
  font-weight: var(--wa-font-weight-bold);
}
```

## Section layout

Keep the section header above and outside the content card.

```astro
<section>
  <layout-stack gap="m">
    <div class="section-header">
      <h2 class="section-title">Section name</h2>
      <p class="section-desc">One-line description of what this section shows and why.</p>
    </div>
    <!-- content -->
  </layout-stack>
</section>
```

```css
.section-header {
  display: flex;
  flex-direction: column;
  gap: var(--wa-space-2xs);
}

.section-title {
  font-size: var(--wa-font-size-lg);
  font-weight: var(--wa-font-weight-semibold);
}

.section-desc {
  color: var(--wa-color-text-quiet);
  font-size: var(--wa-font-size-s);
}
```

## KPI strip

Put one KPI strip first in `<main>`. Pass a JSON items array.

```astro
<kpi-strip items={JSON.stringify([
  { value: "€42.3K", label: "Total spend", delta: "Last 7 days" },
  { value: "1,284", label: "Purchases", delta: "€33 avg CPA", tone: "positive" },
  { value: "€33.12", label: "Avg CPA", delta: "Target €35 · Ceiling €50", tone: "positive" },
  { value: "38", label: "Creatives in window" },
])}></kpi-strip>
```

Set `tone` to `"positive"`, `"negative"`, or omit it.

## Creative gallery

Use a responsive grid and `creative-card`. Render every configured field even when its value is
missing.

```astro
<layout-grid gap="m" style="--min-column-size: 16rem">
  {performers.map((creative) => (
    <creative-card
      media={creative.format === "video" ? "video" : "image"}
      src={creative.format === "video" ? creative.videoUrl : creative.imageUrl}
      poster={creative.thumbnailUrl}
      aspect-ratio="1x1"
      heading={creative.adName}
      fields={JSON.stringify([
        { label: "Product", value: creative.product || "—" },
        { label: "Concept", value: creative.concept || "—" },
      ])}
      stats={JSON.stringify([
        { label: "CPA", value: `€${creative.cpa.toFixed(2)}`, tone: creative.cpaStatus },
        { label: "Spend", value: `€${creative.spend.toLocaleString()}` },
        { label: "Conv", value: String(creative.purchases) },
      ])}
    ></creative-card>
  ))}
</layout-grid>
```

For a video, keep `media="video"` even when the video URL is absent. Use the thumbnail only as
`poster`, never as video `src`.

## Chart card

Stack chart cards full-width. Put the metric label and settings control in the card header.

```astro
<layout-stack gap="m">
  <div class="section-header">
    <h2 class="section-title">CPA by product</h2>
    <p class="section-desc">Products with meaningful spend in the selected period.</p>
  </div>

  <wa-card with-header class="chart-card">
    <layout-split slot="header" align-items="center">
      <span class="card-label">Avg CPA (€)</span>
      <div class="chart-settings-wrap">
        <button
          class="chart-gear-btn"
          data-chart-id="chart-product-cpa"
          aria-expanded="false"
          aria-label="Chart settings"
        >
          <wa-icon name="gear" library="default"></wa-icon>
        </button>
        <div class="chart-settings-panel" hidden>
          <div class="settings-row">
            <span class="settings-row-label">Show creative thumbnails</span>
            <wa-switch class="chart-preview-switch" checked></wa-switch>
          </div>
        </div>
      </div>
    </layout-split>

    <creative-chart
      id="chart-product-cpa"
      data={JSON.stringify(chartData)}
      x-key="name"
      label-key="name"
      image-key="thumbnail"
      label-max-length="12"
      series={JSON.stringify([
        { key: "cpa", label: "Avg CPA (€)", format: "currency", currency: "EUR", decimals: 0 },
      ])}
      show-legend="false"
      show-metric-header="false"
      height="340"
    ></creative-chart>
  </wa-card>
</layout-stack>
```

Use `height="340"` as a starting point. Avoid a fixed `min-width` when the chart already spans the
page. Set `show-legend="true"` only for multiple series.

## Chart settings controller

Import one controller from the Astro page:

```astro
<script>
  import "../scripts/chart-interactions";
</script>
```

Own gear panels and thumbnail toggles in that controller only:

```ts
const panels = document.querySelectorAll<HTMLElement>(".chart-settings-panel");
const buttons = document.querySelectorAll<HTMLButtonElement>(".chart-gear-btn");

function closeChartSettings(): void {
  panels.forEach((panel) => {
    panel.hidden = true;
  });
  buttons.forEach((button) => {
    button.setAttribute("aria-expanded", "false");
  });
}

buttons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const panel = button.nextElementSibling as HTMLElement | null;
    if (!panel) return;

    const shouldOpen = panel.hidden;
    closeChartSettings();
    if (shouldOpen) {
      panel.hidden = false;
      button.setAttribute("aria-expanded", "true");
    }
  });
});

document.addEventListener("click", closeChartSettings);

document.querySelectorAll<HTMLElement>(".chart-settings-wrap").forEach((wrap) => {
  const button = wrap.querySelector<HTMLButtonElement>(".chart-gear-btn");
  const toggle = wrap.querySelector<HTMLElement & { checked?: boolean }>(
    ".chart-preview-switch",
  );
  if (!button || !toggle) return;

  const chartId = button.dataset.chartId;
  if (!chartId) return;

  toggle.addEventListener("wa-change", () => {
    const chart = document.getElementById(chartId);
    if (!chart) return;

    const isChecked = toggle.checked ?? toggle.hasAttribute("checked");
    if (isChecked) {
      chart.setAttribute("image-key", "thumbnail");
    } else {
      chart.removeAttribute("image-key");
    }
  });
});
```

## Settings panel CSS

Keep the panel positioned relative to its chart header. Allow it to escape the card boundary.

```css
.chart-card {
  overflow: visible !important;
}

.chart-settings-wrap {
  position: relative;
}

.chart-gear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--wa-color-surface-border);
  border-radius: var(--wa-border-radius-m);
  background: transparent;
  color: var(--wa-color-text-quiet);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.chart-gear-btn:hover,
.chart-gear-btn[aria-expanded="true"] {
  border-color: var(--wa-color-neutral-70);
  background: var(--wa-color-surface-lowered);
  color: var(--wa-color-text-normal);
}

.chart-settings-panel {
  position: absolute;
  top: calc(100% + var(--wa-space-xs));
  right: 0;
  z-index: 9999;
  width: 260px;
  padding: var(--wa-space-s);
  border: 1px solid var(--wa-color-surface-border);
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: var(--wa-shadow-m);
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--wa-space-m);
  padding: var(--wa-space-xs) 0;
}

.settings-row-label {
  color: var(--wa-color-text-normal);
  font-size: var(--wa-font-size-s);
}
```

## Data tables

Use `creative-table` for every tabular view.

- Add pagination above 20 rows.
- Use `expandable` when a row needs detail.
- Set `sticky-first-column` when the first column is an identifier.
- Define complex columns as a typed `Column[]` and assign them through the browser property after
  `customElements.whenDefined("creative-table")` resolves.

## Tooltip positioning

Keep the component's tooltip metric-only. If the default centered position obscures the bar, move
it beside the hovered bar in `requestAnimationFrame` after the component positions it:

```ts
requestAnimationFrame(() => {
  const hoveredBar = chartEl.querySelector<SVGElement>(".ccx-bar-group[data-hovered]");
  if (!hoveredBar) return;

  const chartRect = chartEl.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const barRect = hoveredBar.getBoundingClientRect();
  const gap = 12;

  const barRight = barRect.right - chartRect.left;
  const barLeft = barRect.left - chartRect.left;
  let left = barRight + gap;
  if (left + tooltipRect.width > chartRect.width) {
    left = barLeft - tooltipRect.width - gap;
  }
  tooltip.style.left = `${Math.max(0, left)}px`;

  const currentTop = Number.parseFloat(tooltip.style.top || "0");
  if (currentTop + tooltipRect.height > chartRect.height) {
    tooltip.style.top = `${Math.max(0, chartRect.height - tooltipRect.height - 4)}px`;
  }
});
```
