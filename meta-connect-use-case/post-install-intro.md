# Meta connect

## What just opened up
You can now stage and publish ads to Meta directly from chat. The connection auto-refreshes every 60 days. Say "push these assets to Meta as a new ad set" or "stage these creatives in [campaign name]" and Runneth handles the upload, creative creation, and ad structure as drafts. You activate in Ads Manager when you're ready.

## Try this now
1. **Stage a single creative into an existing campaign**: `Stage [creative file path or upload] into [campaign name] as a new ad set called [ad set name].`
   _You'll get back:_ the asset uploaded to Meta, the creative object created, the ad set drafted in your specified campaign, and a confirmation with the Ads Manager link.
2. **Confirm the connection is healthy**: `Is the Meta connection still active and when does it refresh?`
   _You'll get back:_ the connection state, the ad account it's pointed at, days until refresh, and what to do if it needs renewing manually.
3. **Stage a batch**: `Stage all assets in [folder path] into [campaign name] as a new ad set.`
   _You'll get back:_ each asset uploaded, creative objects created, the ad set drafted, and a single confirmation listing every ad ready for review in Ads Manager.

## Compounds with
- **static-ad-gen:** Generated ads can stage straight into Meta with one follow-up prompt.
- **runneth-health-alerts:** If the Meta token expires or scopes change, you'll see it in the alert channel before launch day.
