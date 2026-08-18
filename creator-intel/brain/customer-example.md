# Worked example

This shows the intended experience end to end, matching how the flow runs on a real account.

## Stage 0: Install and workspace

Installation stages files only. In the first fresh session, Runneth gives a one-line overview and offers setup once. It reads no Motion or connected-account data and writes no customer state until the person agrees. After approval, one workspace is selected automatically; with several it asks once which one.

## Stage 1: Understand how you work

One question at a time:

- **Performance:** if a Meta onboarding Account Context (or an equivalent account context doc) exists, confirm that measurement and adopt it (for example a KPI hierarchy and a conversion-bucket split like Events vs Sales); otherwise default to spend and confirm. Never ask about Northbeam.
- **Sources:** learn where the roster, fees, and rights live. Use native Google or the core connected-integration flow for Notion, Asana, Airtable, Monday, and similar sources. Store stable account/resource references, never credentials. The ad account is always the catch-all for creators scattered off the lists.
- **Ad-account creator convention:** never ask cold. Check for a documented breakdown, otherwise infer the creator tag from the ad names, surface the oddballs (editor or owner tokens, employee or EGC ads, non-creator statics, name variants), and confirm the pattern.
- **How you hire:** capture the lens (campaign, theme, product, referral, "find more like our best"), then ground each dimension in ad names, account context, brand context, or a review audit, and only ask for what cannot be found.

## Stage 2: Build and confirm the roster

Pull the full last-365-day library with no limit, extract creators off the confirmed tag, and reconcile the connected database, fee source, and ad account into one complete canonical table. Review at most 25 rows per page, preserving overall and omitted counts, until every open question is resolved or explicitly left pending. Confirm merges, reclassify mislabels, add creators found only in ads, then proactively sweep untagged rows for creator ads hiding under older naming.

## Stage 3: The dashboard

After disclosing and receiving approval for missing or stale Meta snapshot reads and app/state writes, build an openable private app with a global window selector (30/60/90/365), two core tabs, and conditional ROI:

- **Creators:** a rich card per active creator (avatar, name, talent type and category, a conversions badge, a plain-English line, the verbatim top hook from the ad transcript, a work-samples thumbnail row, campaign tags, and a footer stat row).
- **Leaderboard:** every active creator with spend, the conversion buckets, and cost per outcome.
- **ROI report, only with Account Context and cost data:** KPI strip plus total-network ROI. Program-wide fees are never allocated to creators.

The 60-day snapshot uses explicit inclusive dates ending yesterday; it never sends `last_60d`.

Private to the workspace by default.

## Stage 4: Recommend creators

Open with the target-specific gap, then propose the available methods and get a yes: bounded Motion-context discovery (approve topics first), top creator similarity seeded from up to five best creators and named north-stars, and reviews-gap micro-personas when a review audit exists. Apify credentials are collected through secure secret input and only the stored key reference is retained. Roster first, honest about no-fit/tool failures, rights, and coverage, and persist one stable recommendation id with every method used.

## Stage 5: Refresh

Manual Meta refresh that never changes trusted decisions, with a four-part summary. A scheduled refresh runs only on separate consent (owner, cadence, delivery).
