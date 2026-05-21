# Paid Strategy Briefs — Local Index

This is the local routing index for paid-strategy briefs saved under `/agent/brain/paid-strategy/`. The `user.md` `runneth-apps:paid-strategy:read-before-performance v1` instruction reads this file (and the briefs themselves) on every performance-question turn.

Sort: most-recently updated first.

Row format per channel brief:

```
- <Workspace> · <Channel> — last updated <ISO date>
  - Brief: /agent/brain/paid-strategy/<channel>/<workspace-slug>/<channel>-strategy.md
  - Funnel map: /agent/brain/paid-strategy/<channel>/<workspace-slug>/funnel-map.html
  - Funnel shape: <single | two-step | three-step | N parallel>
  - Validated metric(s): <list>
  - One-line read: <e.g. "Two-step funnel, prospecting + retargeting both on Purchase, $X/day">
```

Row format for the overall synthesis (when 2+ channels):

```
- <Workspace> · Overall paid strategy — last updated <ISO date>
  - File: /agent/brain/paid-strategy/overall-strategy.md
  - Channels: <list>
  - One-line read: <e.g. "TikTok TOF feeds Meta retargeting; combined motion optimizes for Purchase">
```

Channel knowledge files at `/agent/brain/paid-strategy/_channels/` carry per-platform reading rules and vocabulary.

Workspace configs at `/agent/brain/paid-strategy/_config/` carry per-workspace ping settings, drift schedule, and excluded campaigns.

---

(No briefs saved yet.)
