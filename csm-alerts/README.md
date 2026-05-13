# CSM Alerts — Usage Drop + Champion Watch

**Install time:** ~2 minutes

Two weekly Monday morning routines for CSMs, posted to #customer-success:

1. **Usage Drop Alert** — Scans your book of business for accounts with significant usage drops week-over-week. Flags gone-dark, cliff drops, and 3-week fading trends.

2. **Champion Job-Change Monitor** — Watches your top 50 accounts' primary contacts via Apollo. Alerts you the week a champion changes title or company, so you can reach out before the account goes cold.

---

## Install

Tell Runneth:

> Install the CSM alerts skill for me — usage drop and champion watch, Monday mornings.

Runneth will:
- Copy the scripts into your routines folder
- Set up two Monday 9am ET reminders
- Initialize the champion watch state (first run builds the baseline, no alerts)

---

## Switching books

Both scripts default to the CSM email you configure at install time. To change which book they monitor (e.g. after accounts are re-assigned in HubSpot), edit the `--csm-email` flag in your `run-usage-drop.sh` and `run-champion-watch.sh`.

---

## Alert types (usage drop)

| Signal | Condition |
|---|---|
| 👻 Gone dark | 0 events this week, had ≥3 last week |
| 🚨 Cliff drop | Current week < 50% of prior week (prior had ≥5) |
| 📉 Fading (3wk) | 3 consecutive weeks each ≤75% of the prior |

Cliff drops in week 1 are flagged as possible vacation. Sustained drops (2+ weeks) and fades are the ones to act on.

---

## Requirements

- BigQuery access (system-level — already connected)
- HubSpot access (system-level — already connected)
- Apollo API key (system-level — already connected)
- Slack connected

---

*Built by Runneth · Motion Creative Analytics*
