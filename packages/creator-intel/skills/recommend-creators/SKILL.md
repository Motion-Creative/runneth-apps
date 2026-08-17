---
name: recommend-creators
description: Recommend creators for one activated workspace using a gap analysis plus a three-method ladder (Motion-context baseline, top creator similarity, and reviews-gap micro-personas). Use for casting, creator-fit, and creator-performance questions, and whenever the person asks who to work with next.
triggers:
  phrases:
    - who should we cast
    - recommend creators
    - suggest creators for this concept
    - who are our best creators
    - creator leaderboard
    - find new creators
  intent: Answer casting and creator-performance asks, grounded in the roster, the hiring lens, and the gap.
---

# Recommend creators

This skill owns creator recommendations. It always proposes the plan and gets a yes before it searches or sources. It opens with a gap read, then runs a three-method ladder that degrades gracefully so there is always an answer.

## Requirements

- The workspace must be activated with a confirmed roster.
- Read `workspace.json` for `hiringLens` and `performanceMeasure`, and `identities.json` for each confirmed creator's `representation` (topics and angles) and the products they ran.

## Start with the gap

Before naming anyone, produce the gap read: compare the angles and personas the team hires for against what the confirmed roster actually covers. If no brand-audit or hiring-lens grounding exists, say the gap read is limited to roster coverage.

### Gap analysis, concretely

1. **Demand side (what you want covered).** Use the brand-audit strategy matrix at `/agent/brain/brand-audit/<workspace-slug>/strategy.md` when it exists (its angle-by-persona grid). Otherwise use `hiringLens.dimensions` plus own-brand context from `motion brand-context`.
2. **Supply side (what the roster covers).** For each confirmed creator, read `representation.anglesCovered` and `representation.topics`, plus the products they ran from the roster/evidence.
3. **Coverage map.** For each angle or persona on the demand side, list the roster creators who cover it. The gap is any angle or persona with zero, or only weak or single-creator, coverage.
4. **Open with the gap**, for example: "Your roster is deep on performance-marketer UGC but has no one carrying the culture or POV angle for AI-in-marketing." That framing drives which methods to run and what to search for.

## The three-method ladder

Propose which methods you will run given what is available, get the yes, then run them.

### (a) Motion-context, always available

- Derive candidate topics from own-brand context and the ad account: pull the messaging of the top ads with `motion meta insights --summary-sections messagingAndPositioning --summary-sections hookOrHeadline` and combine with `motion brand-context` themes and the gap.
- Show the proposed 3 to 5 topics and ask the person to approve them before searching.
- On approval, run `motion inspo creators --search-term "<approved topic>"` per topic, dedupe by Motion creator id, and rank by fit to the gap. Page 2 to 3 times when more results exist.
- This replaces the old reach-ranked category dump. Never present a raw high-follower category list as the recommendation.

### (b) Top creator similarity

- Seed set: the top roster creators by the workspace performance measure, plus any north-star creators the customer named explicitly.
- Ask for the seed creators' main Instagram or TikTok profiles, or use handles already confirmed on the roster.
- For each seed, read the profile and the accounts it follows, then rank adjacent creators by how many seeds' networks they appear in and how well they fit the gap topics. Dedupe against the roster and against each other.
- Run once, bounded to the top 10 seed profiles and about 25 ranked candidates. Resolve any candidate that also exists in Motion with `motion inspo creators`; keep off-Motion candidates as raw handles with their profile link.
- This path needs an Apify key, used through `secure-fetch` against `api.apify.com` with an Instagram or TikTok profile-and-following actor resolved at run time. Do not name the underlying tool as the method to the customer; call it top creator similarity. If the key is not connected, tell the person you need an Apify key connected to run top creator similarity, and do not run it until it is.
- After a one-time run, offer to set up a routine for ongoing sourcing; do not create the routine automatically.

### (c) Reviews gap to micro-personas

- A review audit mines the brand's customer reviews to surface the pains, desires, and micro-personas showing up in real customer language. The gap version finds the micro-personas you have no creator for, then searches Inspo for creators who fill them with `motion inspo creators --search-term "<micro-persona phrase>"`.
- Whenever you reference this method, explain in one line what a review audit is and does; never just say it is missing. If none exists, explain it and offer to run one rather than silently skipping.

When the inputs for (b) or (c) are not present, degrade to (a) so the person always gets a grounded answer.

## Output structure

Use these sections in order:

1. **My recommendation**
2. **Your roster**
3. **New creators to source**
4. **Next move**

If the concept is stronger without a creator, include **No creator needed** inside My recommendation and say why.

## Hard rules

- Roster creators first. Never pad to quotas. Never surface disqualified creators.
- Respect hard eligibility before soft fit.
- For each creator include: concept, persona, and delivery fit; creative proof; performance signal with spend and measurement window; rights status; the main watchout; and whether this is roster reuse or new sourcing.
- If paid rights are unknown, say exactly: "Paid usage rights are unknown. Confirm them before shortlisting."
- Lead with spend as the reliability and priority lens. Recompute rates from totals. State mapped coverage before broad claims, and narrow the claim to mapped evidence when coverage is low.
- Use only supported Motion creator fields: category, follower band, displayTopics, displayTagline, followed-by-workspace as a separate pull, Motion link, total follower count. For similarity candidates, you may also carry the handle, profile link, and the seeds they overlap with. Do not claim audience demographics, spend range, geography, engagement, or rising status.

## Persistence

- For a casting or recommendation request, create one stable `recommendationId` for the block, record the method used (`a-motion-context`, `b-top-creator-similarity`, or `c-reviews-gap`), append the contract-complete record to `recommendations.json.recommendations[]`, append one canonical `recommendation_created` audit event with that id in `entityIds`, and include the same id in the visible recommendation so a later brief or launched ad can link to it.
- For a pure creator-performance lookup that makes no recommendation, do not create a recommendation record or imply outcome attribution.
