# How to use the brain package your CSM sends

When you install brain-onboard, this guide lands in your brain at
`/agent/brain/runneth-onboarding/HOW-TO-USE.md` so anyone on your team can
find it later.

## The flow

1. Your CSM runs a prep on their side using everything Motion knows about your
   brand. They send you a single tar.gz file named something like
   `<your-brand>-runneth-package-<date>.tar.gz`.
2. You drop the file into your Runneth as an upload.
3. You trigger the brain-onboard skill by saying something like:
   - "Run brain-onboard"
   - "Build my brain"
   - "Set up my Runneth from the uploaded package"
4. Runneth extracts the package, runs live data pulls against your Motion
   workspace and any wired tools (Yotpo, Shopify, etc.), runs Apify scrapers
   for organic posture and review context, and synthesizes everything into
   ten brain domains.
5. You see a welcome card showing what each person on your team can now do.

## What the package contains

Only things your brand has put into the world. Your own website, your team's
public brand handles, your customers' public reviews, facts your team
self-identified at Motion signup, and competitors your team has named in
conversation with Motion.

The package never contains third-party scraped data about individuals on your
team, third-party scraped data about your company, or Motion's internal
observations about you.

## When to refresh

Ask your CSM to refresh the package when:

- New people join or leave the marketing team
- You change brand positioning or launch a new product line
- Your competitor set shifts meaningfully
- It's been a month and you want fresh data baked in

The CSM re-runs prep on their side and sends you a new tar.gz. You re-run
brain-onboard. The brain merges the updates, preserves anything your team has
edited manually, and surfaces a changelog of what shifted.

## Questions

If brain-onboard tells you it cannot find a package, ping your CSM. They may
not have sent it yet, or it may have landed in a place Runneth did not check.

If the welcome card flags any domain as "still empty" or "pending OAuth," the
card tells you what to connect to fill that gap (Notion, Google Drive, Slack,
whichever apply to your team's stack).
