# Integration health check

## What just opened up
You can now ask Runneth whether your connected tools actually work, any time. It tests each connection with one real call, saves a status file it can compare against next time, and gives you a plain answer in chat. After your first check, Runneth also speaks up whenever a broken integration gets in the way of a task, instead of working around it quietly.

## Try this now
1. **Run your first check** — `Check my integrations.`
   _You'll get back:_ a status for every connected tool, saved to `/agent/brain/integration-health/health-status.md`, with a fix suggested for anything broken.
2. **Ask about one tool** — `Is Slack still connected?`
   _You'll get back:_ a yes or no backed by a real call, not a guess.
3. **See what changed** — `Run a health check. What's different from last time?`
   _You'll get back:_ the current status plus a short list of what broke or recovered since the previous check.

Tip: if you want this to run on a schedule, just ask. For example: `Run the integration health check every Monday morning and tell me the result.` Runneth sets that up only when you ask for it.

## Compounds with
- **building-integrations:** new integrations you build show up in the next health check automatically.
