# Landing Page Experiments — Local Index

This is the local routing index for experiment backlogs saved under `/agent/brain/experiments/`. The `landing-page-summary` weekly refresh routine appends drift WARN flags here when a page changes materially since the most recent backlog was generated.

Sort: most-recently-generated backlog first.

Row format:

```
- {{Brand}} {{page name}} — `<slug>--<domain>` — latest backlog {{date}}
  - URL: {{URL}}
  - Latest backlog: /agent/brain/experiments/<slug>--<domain>/<YYYY-MM-DD>.md
  - Test count: N
  - Top 3: {{test-001 summary}}, {{test-002 summary}}, {{test-003 summary}}
  - Source summary fetched: {{summary-ts}}
  - Brand kit applied: {{yes | no}}
```

For per-page backlog history see `/agent/brain/experiments/<slug>--<domain>/`.

---

(No experiment backlogs generated yet.)
