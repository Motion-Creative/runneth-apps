# Landing Pages — Local Index

This is the local routing index for landing page summaries saved under `/agent/brain/landing-pages/`. Each entry tracks the current saved summary plus a short list of recent fetches for change visibility.

Sort: most-recent fetch first.

Row format:

```
- {{Page name}} — `<slug>--<domain>` — {{URL}}
  - Latest fetch: {{ISO 8601 timestamp with tz offset}}
  - Page intent: {{homepage / product / pricing / signup / comparison / lead-magnet / event}}
  - Schwartz stage: {{unaware / problem-aware / solution-aware / product-aware / most-aware}}
  - Form provider: {{HubSpot / native / Typeform / none}}
  - Purpose: {{one line}}
  - Recent fetches: {{latest ISO}}, {{2nd most recent}}, {{3rd most recent}}
```

For per-page history files see `/agent/brain/landing-pages/_history/<slug>--<domain>/`.

---

(No pages summarized yet.)
