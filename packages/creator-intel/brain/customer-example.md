# Worked example

This shows the intended experience end to end, matching how the flow runs on a real account.

## Stage 0: Install and workspace

Setup runs at install. Runneth gives a one-line overview and offers to start. With one workspace it uses it; with several it asks once which one.

## Stage 1: Understand how you work

One question at a time:

- **Performance:** if a Meta onboarding Account Context (or an equivalent account context doc) exists, confirm that measurement and adopt it (for example a KPI hierarchy and a conversion-bucket split like Events vs Sales); otherwise default to spend and confirm. Never ask about Northbeam.
- **Sources:** learn where the roster, fees, and rights live, and connect that source so it can be read live (Notion via the API-key path, a sheet via Google, Asana or similar via its connection). The ad account is always the catch-all for creators scattered off the lists.
- **Ad-account creator convention:** never ask cold. Check for a documented breakdown, otherwise infer the creator tag from the ad names, surface the oddballs (editor or owner tokens, employee or EGC ads, non-creator statics, name variants), and confirm the pattern.
- **How you hire:** capture the lens (campaign, theme, product, referral, "find more like our best"), then ground each dimension in ad names, account context, brand context, or a review audit, and only ask for what cannot be found.

## Stage 2: Build and confirm the roster

Pull the full last-365-day library with no limit, extract creators off the confirmed tag, and reconcile the connected database, the fee source, and the ad account into one table of every creator with one overview of open questions. Confirm merges (name variants), reclassify mislabels, add creators found only in the ads, and drive to zero. Then proactively sweep the untagged rows for creator ads hiding under older naming, announce it rather than ask, fold in confident matches, and leave true statics out.

## Stage 3: The dashboard

An openable app with a global window selector (30/60/90/365) and three tabs:

- **ROI report:** KPI strip plus total-network ROI, honest when per-creator fees are not populated.
- **Creators:** a rich card per active creator (avatar, name, talent type and category, a conversions badge, a plain-English line, the verbatim top hook from the ad transcript, a work-samples thumbnail row, campaign tags, and a footer stat row).
- **Leaderboard:** every active creator with spend, the conversion buckets, and cost per outcome.

Private to the workspace by default.

## Stage 4: Recommend creators

Open with the gap (angles and personas the roster covers vs. does not), then propose the three-method ladder and get a yes: Motion-context topic search (approve topics first), top creator similarity seeded from the best creators and named north-stars, and reviews-gap micro-personas when a review audit exists. Roster first, honest about rights and coverage, and the recommendation is persisted with a stable id.

## Stage 5: Refresh

Manual Meta refresh that never changes trusted decisions, with a four-part summary. A scheduled refresh runs only on separate consent (owner, cadence, delivery).
