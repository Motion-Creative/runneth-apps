---
hero_headline: "Know when something breaks before your team does."
hero_subhead: "Runneth watches your connected tools and automated routines — and alerts you in Slack the moment something goes off track."
install_time: "~2 minutes"
requires: "Slack connected, at least one integration or routine active"
status: "experimental"
---

## What this enables

- Get a Slack alert the first time a connected tool stops working or a routine goes off track
- One follow-up after 24 hours if it's still not resolved (configurable)
- A confirmation when everything is back to normal
- Catch routines that were requested but never actually set up — Runneth finds them in your conversations and either creates them or asks for the missing details

## How it works

Once installed, Runneth checks every connected tool and scheduled task every 30 minutes. When something looks off, it sends one alert to your admin channel — no noise, no spam. If Runneth spots that a routine was mentioned in a conversation but never created, it either sets it up quietly or follows up in the original thread.

## A real example

A creative team has a daily performance report routine they rely on every morning. The Slack integration silently disconnects over the weekend. Without Health Alerts, no one notices until Monday morning when the report doesn't show up. With it, an alert fires within 30 minutes — and the team has it fixed before anyone starts their day.

## What gets set up

- 30-minute health checks on all connected tools and active routines
- A dedicated alert channel in Slack
- Admin tagging so the right people see every alert
- Daily scan for routines that were asked for but never created
