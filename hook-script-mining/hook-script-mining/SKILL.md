---
name: hook-script-mining
description: |
  Turn one competitor ad, creator post, adjacent-brand ad, or organic video/image, plus a
  note on why it caught someone's eye, into a classified swipe-file entry (hook tactic,
  headline tactic, visual format, or creative mechanic) built against this account's own
  real evidence, then roll confirmed patterns into an input bank for the ideation engine.
  Use when someone says "add this as a hook," "file this as a mechanic," "add to my swipe
  file," "classify this ad," "log this pattern," or shares a link with "I like this
  because..." Also use to build or rebuild this account's swipe-file library from its own
  real ad history before any of that, or when someone asks what's still untested from
  what they've sent, or wants to quick-test something from a link directly, or to
  visualize/browse an existing library as an app ("show me my swipe file," "visualize
  my hook library," "can we see this somewhere").
---

# Hook & Script Mining

This skill turns outside inspiration (or this account's own already-tested ads) into a
classified, evidence-backed library on three axes: hook tactic, headline tactic, and
visual format (Motion-tagged), plus creative mechanic (not Motion-tagged, read from
creative breakdowns). It never writes finished scripts itself; it produces the reusable
library that the ideation engine or a person draws from when writing one.

Full detail for every step below lives in the staged docs. Read the exact one named at
each step before improvising the mechanics, they are the source of truth, this file is
the trigger map and the summary.

## Before the first classification: build the library

If `/agent/brain/<workspace>/hook-script-mining/index.md` does not exist yet for this
axis's structure (per `/agent/brain/hook-script-mining/01-source-and-classification.md`,
"The library's structure"), this account has not been seeded yet. Before classifying
the asset that triggered this skill, ask first, don't run the pull silently just
because a trigger phrase came in:

> Before I file this, I don't see a library built for this account yet. Want me to
> pull the last 365 days of your own ads and build that first? It grounds this
> classification (and everything after it) in your account's real tagged history
> instead of starting cold.

On a yes, run the build procedure now, in this conversation:

1. Read `/agent/brain/hook-script-mining/04-bank-building-process.md` and follow it
   exactly: check for an existing saved library first, for hook tactic, headline
   tactic, and visual format, pull this account's real ad library via Motion's
   glossary tags where nothing is saved yet (Steps 2-4); for creative mechanics,
   there is no glossary tag, so check the universal-mechanics checklist against real
   evidence first, then pull creative breakdowns for a stratified sample and read the
   storyline for anything new (Step 5). Build one seed entry per tag or mechanic with
   its verbatim, visual (or cognitive-move explanation, for mechanics), and evidence.
2. Present the seeded result using the exact confirmation shape in
   `/agent/brain/hook-script-mining/05-library-confirmation.md`, exactly one table per
   axis, real counts and spend, naming where the library will live. Hold for a yes.
3. Only after that yes, write the confirmed entries to
   `/agent/brain/<workspace>/hook-script-mining/`, kept separate from this account's own
   tested-ad library folder, never merged into it. Then classify the asset that
   originally triggered this skill against the now-seeded library.

If they say not yet, classify the current asset anyway against whatever exists (an
empty library, if nothing does), and say plainly that this entry is starting cold
without account history behind it yet.

## On every classification request (after the library exists)

1. Capture the asset (a link, video, or image) and the note, whatever the person said
   about it, required, per
   `/agent/brain/hook-script-mining/01-source-and-classification.md` Step 1.
2. If the asset is a link rather than an uploaded file, follow Step 1a of that same
   file before doing anything else: check for a stored Apify API token first, use it
   if one exists, or walk the person through getting one and request it securely if
   not. Never fetch an outside link without it, and never ask a workspace that already
   has a token for another one. Once a token exists, every Instagram or TikTok link
   goes through Apify to actually watch it, every time, never classified from the
   caption or note alone.
3. Identify the one axis. If the note names it directly ("add as a hook"), use that,
   skip inference. Otherwise read the note against the table in
   `01-source-and-classification.md` Step 2 to infer hook tactic, headline tactic,
   visual format, creative mechanic, or none of the three. When it's ambiguous, use the
   differentiation tests in Step 3 of that same file.
4. Classify the identified element against this account's own seeded taxonomy for that
   one axis (Step 4), fit an existing bucket or propose a new candidate.
5. Write the entry (verbatim, visual, evidence trail including the exact source URL,
   the taste note) per Step 5. The URL is required, never dropped even when the
   other fields are already captured.
6. If the note doesn't map to hook, format, or mechanic, log it as a standalone
   observation instead of forcing a bucket, per `01-source-and-classification.md`,
   "When the note doesn't map."
7. Hold every new entry, seeded or submitted, for a human yes per
   `05-library-confirmation.md` before it's live.

## Visualizing the library as an app

To browse, filter, or share the confirmed library as a playable, filterable app instead
of reading it as markdown, read
`/agent/brain/hook-script-mining/06-swipe-file-app.md` and follow it exactly. This is a
read-only visualization layer over already-confirmed entries; it never adds or
reclassifies an entry on its own. That doc also covers the human-confirmed first build
offer once 3-4 confirmed entries exist, and the optional daily sync routine that keeps
the app current as new entries get confirmed.

## Rolling entries into usable patterns

Once more than one independent example lands under the same tag, check
`/agent/brain/hook-script-mining/02-pattern-library-and-concept-use.md` for how to roll
individual entries into a confirmed, reusable pattern, and how to hand a confirmed
pattern to the ideation engine as a new input bank ("give me a new hook using this
pattern for [product]"). This skill does not assemble concepts itself.

## Answering "what haven't we tested yet"

When someone asks what's still untried from what they've sent, or wants to quick-test
something from a link they gave directly, read
`/agent/brain/<workspace>/hook-script-mining/new-angles-to-test.md` directly and
answer from it. Don't re-derive the answer by scanning the whole library, this file
exists specifically so that question has a direct source. If a person confirms one of
these rows actually ran as a real ad, mark it tested or remove it per
`02-pattern-library-and-concept-use.md` Step 6, being suggested in a concept is not
the same as being run.

## Worked reference

`/agent/brain/hook-script-mining/03-worked-example.md` has full walkthroughs, including
the explicit-axis-naming path, the no-library-yet fallback, and a note that doesn't map
to any tracked axis. Use it to check the shape of an entry before writing one, not as a
source of real examples, it's illustrative only.

## Constraints

- One asset at a time. No bulk pull of a creator's catalog, a hashtag, or a competitor
  brand's ads in this version.
- Never touch this account's own paid Meta/TikTok performance data as part of this
  skill's classification work.
- Never let another account's names, quotes, or figures appear in this account's
  library. Everything seeded or classified here comes from this account's own real
  evidence, live or saved, or from the specific asset a person submitted.
- Do not run on a schedule. Growth is submission-driven.
