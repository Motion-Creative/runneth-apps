# TikTok Hook & Script Mining — Mini Package

## What it does

Send Runneth one asset (video or image), a competitor ad, a creator's post, an
adjacent brand's ad, plus a note on why you like it. It figures out the single thing
you're actually reacting to (hook tactic, headline tactic, visual format, or creative
mechanic), checks that against this account's own real tagged history, classifies it,
and files it into a growing swipe-file library kept separate from this account's own
tested-ad library.

## Trigger it with

"Add this as a hook," "file this as a mechanic," "add to my swipe file," "classify
this ad," "log this pattern," or just sharing a link with "I like this because..."
"What haven't we tested yet" works too, that reads a running list kept specifically
for things you've sent in but never actually run as a real ad.

## How it works

0. **Build your library first.** Before anything gets submitted, check what this
   account already has per axis. Where a saved library already exists, seed from it
   directly. Where it doesn't, run this account's real ad library through this
   package's own bank-building procedure (`04-bank-building-process.md`), the same
   depth of process the ideation package uses for its own banks, just self-contained
   here rather than borrowed from it. Creative mechanics has no Motion tag to pull
   directly, so it's built by checking a universal-mechanics checklist against real
   evidence and reading creative breakdowns for anything account-specific, not left
   empty just because there's no glossary shortcut. Present exactly what got
   seeded, using the table-per-axis format in `05-library-confirmation.md`, and hold
   for a yes before any of it is live.
1. **Identify the one thing.** Once the library's confirmed, read each new submission's
   note and decide which single axis it's actually about (hook, headline, format, or
   mechanic, or none of the three), not all of them by default.
2. **Check it against real account history first.** Same seeded index from step 0,
   kept current, before treating anything new as a brand-new bucket.
3. **Classify and file it.** Fit it into an existing bucket, or propose a new one and
   hold for a yes before it's added.
4. **Roll it up over time.** Once a pattern has two independent examples and gets
   confirmed, it's ready to use, a direct input for writing a new hook, format, or
   script in that same pattern.

## Where it fits

This is a research feed into the existing creative flywheel: the step that turns
scrolling competitors, creators, and adjacent brands into something usable, not a
new brand strategy system.

## Scope for this version

One asset at a time, submitted on demand, ideally in Slack, with a note on why it
caught your eye. That's it for now, the library grows one confirmed entry at a time
from real submissions.

## What you need connected

Connecting Apify is step one of this package's setup, offered at install before the
library build. Apify is what allows Runneth to actually watch the organic posts you
send in (TikTok and Instagram videos, competitor ads, creators' posts) - without it,
all it can see of a link is the caption, and it won't classify a video it hasn't
watched. Nothing in Motion can fetch or watch an arbitrary external video. Declining at install doesn't block anything:
Motion access alone covers the library build from this account's own ad history, and
the first outside link someone submits will raise the connection again. See
`01-source-and-classification.md`, Step 1a, for exactly how the token gets set up per
account (each account connects its own token, never shared across customers).

## Read order

1. `README.md` (this file)
2. `01-source-and-classification.md`
3. `02-pattern-library-and-concept-use.md`
4. `03-worked-example.md`
5. `04-bank-building-process.md`
6. `05-library-confirmation.md`
7. `06-swipe-file-app.md` (optional: the browsable viewer app over the confirmed
   library, and the daily sync routine that keeps it current)

## Save location

The library always saves to `/agent/brain/<workspace>/hook-script-mining/`, kept
separate from this account's own shared hook/headline taxonomy folder and never
merged into it. Two earlier real installs had disagreed on this (one used the
shared taxonomy folder, the other used a separate `creative-scouting/`-style
folder); `01-source-and-classification.md` now specs this one path only, so any
install that saves somewhere else is a bug against this spec, not a live
open question.

Uninstalling this package removes the staged process docs and the skill but never
touches the built library; a reinstall finds it at this path and seeds from it
instead of rebuilding (per `04-bank-building-process.md`, Step 1).
