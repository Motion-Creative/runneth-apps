# 06: Swipe File Viewer App (Optional Visualization)

This step is optional and separate from library growth. Nothing here adds, edits, or
reclassifies a single entry, that still only happens through the classification flow in
`01-source-and-classification.md` and the confirmation gate in
`05-library-confirmation.md`. This doc covers giving the account a browsable, visual
front end over a library that already exists.

## When to build it

This is step 5 of the account's onboarding sequence with this package:

1. Connect Apify (the activation's setup step one: the credential that lets outside
   links actually be watched; deferring it blocks nothing).
2. Begin (the activation offer: pull and seed the library from the account's own ad
   history).
3. Fill the data back (seed entries land per axis, held for the confirmation gate).
4. Give it ads (the account submits real outside assets one at a time, each held for
   its own confirmation per `05-library-confirmation.md`).
5. **Once at least 3-4 confirmed entries exist in total** (seeded, submitted, or a mix),
   offer the app as the next onboarding milestone. Disclose that building it creates or
   updates an app source tree, writes the confirmed library into `data/entries.json`,
   downloads available source media through Apify, and runs `app build` and `app verify`.
   Wait for an explicit human yes before any app write, media download, or build. A
   direct request to build the app counts as approval after this scope is stated; an
   ambiguous request to "see this somewhere" requires the yes.
6. **Immediately after that first human-approved build succeeds**, in the same turn, offer
   the daily sync routine from "Keeping it current" below: state the recommended daily
   cadence, ask for the delivery destination (this conversation, a new web conversation,
   or a Slack channel/thread if Slack is connected there), and create the routine on a
   yes. Do not leave the app to go stale by treating the build as the finish line, the
   routine offer is part of this same onboarding milestone, not a separate ask for
   later.

Also offer or build this when:

- the person asks to see, browse, visualize, or view their swipe file / hook library /
  ad stash, or asks "can we see this somewhere", or
- the person explicitly asks for an app, dashboard, or page over the library.

Do not rebuild the app from scratch on every single new entry after the first
human-approved build; update it per "Keeping it current" below instead.

## What it is

A sandbox app (via the `app-builder` skill) that reads the account's confirmed
`/agent/brain/<workspace>/hook-script-mining/` entries (or the legacy
`/agent/brain/<workspace>/creative-scouting/` path on accounts seeded before this step
existed) and renders them as browsable, playable evidence, grouped by axis.

Baseline shape, adjust to what the account's library actually contains:

- One tab per axis that has at least one entry: Hooks, Headlines, Mechanics, Visual
  Formats. Do not pre-build an axis-specific KPI, filter, or workflow control the
  account did not ask for.
- An "All" tab across every axis.
- Brand and Creator filters (multi-select) that apply across every tab together, plus a
  KPI strip of simple counts (entries in view, brands represented, creators
  represented). Do not add a testing-status filter, tab, or bulk-status control unless
  the account explicitly asks for one, several accounts have asked for exactly that and
  then asked for it removed again, it is not a default expectation.
- Each entry renders as a card: the tag name as the heading, source (platform +
  creator/handle), a plain-language definition of that hook tactic / mechanic / format
  (pull from the matching reference skill, e.g. `hook-tactics`, `creative-mechanics`,
  `visual-formats`, when the tag maps to a known one; otherwise use the account's own
  written description from the entry file), the full verbatim transcript (or
  description, for a static), and a link back to the original source post.
- When an entry has a real source URL (a public Instagram/TikTok post link, for
  example), pull the actual video and a poster frame so it plays inline on the card
  instead of only linking out. Use the `APIFY_API_TOKEN` runtime secret (Instagram and
  TikTok scraper actors both return a direct, downloadable media URL) to fetch each
  video and poster into the app's `data/` directory as static assets; never hardcode the
  provider's signed CDN URL directly into the page, those expire. If an entry has no
  resolvable source link, render a text tile with the platform/handle instead of
  fabricating a video.
- Use `/agent/brain/templates/report-design-stylesheet.md` (indexed in `/agent/INDEX.md`
  as the default `template-source` for reports and dashboards) as the app's default
  visual theme: warm off-white / near-black surfaces, one accent-lime highlight color
  with the sky-lime-gold gradient reserved for anything that genuinely needs to stand
  out, GT Standard for headlines/body and Sinvoll Sans Mono for labels/tags (substitute
  the closest free equivalents, e.g. Space Grotesk and IBM Plex Mono, when those exact
  fonts are not loadable in-sandbox, and say so plainly), and full rounding everywhere.
  Only deviate from it when the account has a different established template or
  explicitly asks for another visual direction.

Build it through the normal `app-builder` workflow: create or update the app source
tree, write the library as `data/entries.json` (one record per confirmed entry, with
axis, tag, source, verbatim, definition, video/poster asset paths, and source URL), then
`app build` and `app verify` before handoff.

## Keeping it current

Once this app exists for an account, set up one routine, `swipe-file-app-sync-<workspace>`,
so the app does not silently go stale as new entries get confirmed:

- **Default cadence: daily.** This is the account-facing default this package
  recommends; confirm it with the person rather than assuming a different cadence.
- **What the run does:** compare confirmed entries under
  `/agent/brain/<workspace>/hook-script-mining/` (or the legacy
  `creative-scouting/` path) against what is already in the app's `data/entries.json`.
  For any confirmed entry not yet in the app, pull its video/poster the same way as the
  initial build, add it to `data/entries.json`, then `app build` and `app verify` again.
  If nothing new landed since the last run, skip the rebuild and say so briefly rather
  than rebuilding for no reason.
- **What the run delivers.** This is a client-facing update, not a silent background
  job: the routine's delivery is a short message to the account naming what's new since
  the last sync (count of new entries, which axis/axes, one or two names) and inviting
  them to review it in the app, framed as something for them to look at and react to,
  not just an FYI. Confirm the delivery destination (this conversation, a new web
  conversation, or a Slack channel/thread if Slack is connected there) with the person
  before creating the routine; do not guess a destination.
- This routine only maintains the app's sync with entries that already cleared the
  human confirmation gate. It never adds, infers, or auto-confirms a new library entry
  on its own, that would violate the one-human-yes-per-entry rule in
  `05-library-confirmation.md`.

## Handoff

Hand back the app the same way any other app-builder deliverable is handed back: the
verified app's URL, private by default (Motion-auth), with the reversible public option
named if the person wants to share it outside Motion sign-in.
