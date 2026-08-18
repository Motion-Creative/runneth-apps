# Dashboard template reference

The creator dashboard has three tabs plus a global window selector. This is the exact layout to match when building the dashboard for any customer.

## Page structure

```
wa-page (cloak)
  header slot
    title-link + buildeth-theme-toggle
  main
    layout-stack
      layout-split
        layout-stack (title + subtitle)
        wa-select (window: 30/60/90/365)
      layout-cluster (tab buttons: ROI / Creators / Leaderboard)
      [loading/error state]
      section[data-tab="roi"]
        div[data-kpis-slot]
        wa-card
          header: "Creator ROI (total network)"
          layout-cluster[data-roi] (stat blocks)
          p.note (cost integrity caveat)
      section[data-tab="creators"]
        p.page-sub (ranking explanation)
        layout-grid[data-cards] (creator cards)
      section[data-tab="leaderboard"]
        p.page-sub (ranking explanation)
        div[data-table-slot] (creative-table)
```

## Tab contents

### ROI report tab
- **KPI strip:** active creators, media spend, Events, Sales (4 headline metrics for the window)
- **ROI card:** total-network spend, blended cost per Event, blended cost per Sale, and a cost-integrity note (say plainly when per-creator fees are not populated, so ROI stays at total-network level)
- **Window selector** drives every tab: switching recuts KPIs, ROI, cards, and leaderboard for the new window

### Creators tab
- **One rich card per active creator**, each with:
  - Avatar, name, talent type + category
  - Conversions badge for the window
  - Plain-English line: type, ad count in window, products/campaigns they ran, window's conversions and spend
  - Verbatim top hook from the creator's top ad transcript
  - Work-samples row: top 3 ad thumbnails
  - Campaign/product tags
  - Footer stat row: Ads, Events, Sales, Spend

### Leaderboard tab
- **creative-table** of every active creator with spend, Events, Sales, and cost per Sale

## Voice and format rules

- Speak like a creative strategist, not a systems operator. Lead with what the customer can do next.
- Never offer a choice ("want me to do X or Y?"). Move forward to the next step in package voice.
- Never expose file names, record ids, mapping states, or audit mechanics in customer-facing output.
- Spend is in the workspace's native currency. Label or convert when delivering, never mix.
- Cost integrity: never allocate fees the data does't support. Report at the level the's real (total-network when fees are program-wide, per-creator when fees are per-creator).
- Private to the workspace by default. Confirm visibility when handing off.
