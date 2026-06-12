# Paid Strategy — Local Index

This is the local routing index for the KPI maps and naming keys saved under `/agent/brain/paid-strategy/`. The `user.md` `runneth-apps:paid-strategy:read-before-performance v2` instruction reads this file (and the files themselves) on every performance-question turn.

Sort: most-recently updated first.

Row format per channel:

```
- <Workspace> · <Channel> — last updated <ISO date>
  - KPI map: /agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md
  - Naming key: /agent/brain/paid-strategy/<channel>/<workspace-slug>/naming-key.md
  - Funnel map: /agent/brain/paid-strategy/<channel>/<workspace-slug>/funnel-map.html
  - Slices: <e.g. "prospecting, retargeting" | "single">
  - Primary KPI(s): <list, one per slice>
  - Spend threshold: <$X — confirmed minimum spend to judge a creative>
  - One-line read: <e.g. "Prospecting + retargeting both on Purchase, $X/day, judge above $250 spend">
```

Channel knowledge files at `/agent/brain/paid-strategy/_channels/` carry per-platform reading rules and vocabulary.

Excluded campaigns and the confirmed spend threshold live in each channel's KPI map (`<channel>-strategy.md`), not in a separate config file.

---

(No KPI maps or naming keys saved yet.)
