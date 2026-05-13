---
name: csm-alerts
description: |
  Installs two weekly Monday morning routines for a CSM:
  1. Usage Drop Alert — scans the CSM's book for significant week-over-week usage drops
     (BigQuery: Runneth + Analytics + Inspo events). Flags gone-dark, cliff, and fading trends.
  2. Champion Job-Change Monitor — watches primary contacts via Apollo and alerts on
     title or company changes so the CSM can act before an account goes cold.
  Both post to #customer-success and tag the CSM.

  Use when a CSM says "install csm-alerts", "set up usage drop monitoring",
  "set up champion watch", "I want to know when a champion leaves", or
  "alert me when usage drops".

triggers:
  - "install csm-alerts"
  - "usage drop alert"
  - "champion watch"
  - "champion monitor"
  - "set up usage monitoring"
  - "alert me when usage drops"
  - "notify me when a champion leaves"
---

## Install flow

1. Resolve the installing CSM's handle, email, Slack ID, and routines folder from workspace context.
2. Confirm the CSM email to monitor (their own book, or a book they're inheriting).
3. Copy `usage-drop.mjs` and `champion-watch.mjs` into `<routines_folder>/`.
4. Write `run-usage-drop.sh` and `run-champion-watch.sh` with the confirmed CSM email.
5. Write `usage-drop.md` and `champion-watch.md` documentation files.
6. Initialize `champion-watch-state.json` as `{"lastRun":null,"contacts":[]}` in the CSM's home base.
7. Create two reminders:
   - `reminder add --name "usage-drop-<handle>" --cron "0 9 * * 1" --timezone "America/Toronto" --script-path "<routines_folder>/run-usage-drop.sh"`
   - `reminder add --name "champion-watch-<handle>" --cron "0 9 * * 1" --timezone "America/Toronto" --script-path "<routines_folder>/run-champion-watch.sh"`
8. Confirm install is complete with next-run date (first Monday at 9am ET).
9. Remind the CSM: first champion-watch run builds the baseline — no alerts until week 2.

## Parameterization

- `CSM_EMAIL`: the email whose book to monitor (e.g. `ale@motionapp.com`)
- `MY_SLACK`: the CSM's Slack mention string (e.g. `<@U06M00R3868>`)
- `CHANNEL`: always `C05G2BZ5G5V` (#customer-success)
- `STATE_FILE`: `<csm_home_base>/champion-watch-state.json`

## Slack ID reference

| Handle | Email | Slack ID |
|---|---|---|
| ale | ale@motionapp.com | U06M00R3868 |
| josh | josh@motionapp.com | U06NGLVPAQ0 |
| carissa | carissa@motionapp.com | U04H5TK9ZRA |
| rabia | rabia@motionapp.com | U0985FVSMK9 |
| sophia | sophia@motionapp.com | U0A97E4L2PR |
| evan | evan.lee@motionapp.com | U03B2F0FA03 |
