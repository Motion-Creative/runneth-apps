# brain-onboard

## What just opened up

Your Runneth now knows how to turn a brain package from your Motion CSM into a fully populated org brain. The package contains everything Motion has learned about your brand: your team, your customers, your account, your competitors. When you run brain-onboard, Runneth lays the package into your sandbox, pulls live data from your Motion workspace and any tools you have connected, and synthesizes the result across ten brain domains with sources cited on every line.

## What you need from your CSM

Your CSM sends you a single file. It looks like `<your-brand>-runneth-package-<date>.tar.gz` and is usually under two megabytes. They will hand it off through Slack, email, or wherever you usually exchange files. You drop it into this Runneth, then trigger brain-onboard.

If you have not received a package yet, ping your CSM and ask them to run prep-customer-brain for your account.

## Try this now

1. **Upload the package and trigger the skill:**
   _Drag your CSM's tar.gz file into the chat, then say:_ `Run brain-onboard.`
   _You'll get back:_ Runneth extracts the package, runs live workspace pulls and Apify scrapers, synthesizes ten brain domains, and renders the welcome card showing what each person on your team can now do.

2. **Ask the brain something specific:**
   _After install, try:_ `Draft a brief for our next campaign in our brand voice.`
   _You'll get back:_ a brief that already knows your brand, your customers' pain language, and your competitor frame. No setup conversation needed.

3. **See the install state:**
   _Ask:_ `What's in the brain right now?`
   _You'll get back:_ a per-domain readout of what got populated, what's still pending, and what your CSM might want to refresh.

## Compounds with

- **brand-audit:** brain-onboard handles the day-one install; brand-audit refreshes the foundational layer over time.
- **competitor-intel:** runs against the competitor set the team confirms during brain-onboard.
- **weekly-performance-deck:** reads the Performance domain brain-onboard populates and turns it into a Monday morning deck.
