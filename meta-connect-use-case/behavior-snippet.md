<!-- use-case: meta-connect v1.0.0 -->
## Meta connection rules

When any turn involves Meta ads or ad performance:

- **Meta API = publishing only.** Use it to create campaigns, ad sets, creatives, and ads. Never use it for performance data, reporting, or analysis.
- **Motion CLI = all performance work.** For ad performance, creative insights, spend data, or benchmarks — use Motion CLI. Do not call the Meta API for things Motion CLI handles.
- **All Meta objects must be created as `PAUSED`.** Never set status to `ACTIVE`. The user activates ads manually in Meta Ads Manager.
- **Read the active token before any Meta API call.** The token lives at `/agent/brain/integrations/meta-token.json`. Check `expires_at` — if within 7 days of expiry, remind the user to refresh via the meta-connect app.
- **The user launches. Runneth stages.** Never activate an ad without explicit user confirmation.
<!-- /use-case: meta-connect -->
