# Observatory report template

This is the presentation layer for the AI Work Systems Observatory. The app is private by default and reads `data/observatory.json` at runtime with caching disabled, so approved refreshes update the report without rebuilding it.

The durable model uses three files:

- `system-ledger.json`: observed-state evidence only.
- `operating-model.json`: proposed systems and operating-model recommendations only.
- `observatory.json`: report-ready synthesis that keeps observed claims and recommendations visibly separate.

The page is an editorial executive report, not a dashboard shell. It uses `report-page`, `report-masthead`, `report-section`, `report-entry`, `report-figure`, one KPI strip, Web Awesome components, and the standard Buildeth layout elements. The browser controller creates data-heavy components only after the report loads, preventing empty custom-element errors.

Before publishing an organization-specific report, validate all three files and confirm the regression questions in `brain/executive-report-contract.md` are answered. Keep Motion authentication enabled unless an authorized requester explicitly chooses public access.
