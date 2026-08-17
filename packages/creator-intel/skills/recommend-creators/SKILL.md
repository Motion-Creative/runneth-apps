---
name: recommend-creators
description: Recommend creators for one activated workspace using a gap analysis plus a three-method ladder (Motion-context baseline, top-10 plus Apify network walk, and reviews-gap micro-personas). Use for casting, creator-fit, and creator-performance questions, and whenever the person asks who to work with next.
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

- The workspace must be activated.
- Read the stored hiring lens and performance measure from `workspace.json`.

## Start with the gap

Before naming anyone, produce the gap read: compare the angles and personas the team hires for (from `hiringLens`, and a brand-audit if one exists) against what the confirmed roster actually covers (from each creator's representation). Surface the angle or persona that has no creator. If no brand-audit or hiring-lens grounding exists, say the gap read is limited to roster coverage.

## The three-method ladder

Propose which methods you will run given what is available, get the yes, then run them.

### (a) Motion-context, always available

- Derive candidate topics from brand context and the ad account.
- Show the proposed topics and ask the person to approve them before searching.
- Then search Motion creators with `motion inspo creators` on the approved topics.
- This replaces the old reach-ranked category dump. Never present a raw high-follower category list as the recommendation.

### (b) Top-10 plus Apify network walk

- Ask for the top creators' main Instagram or TikTok profiles, or use handles already confirmed on the roster.
- Read what those creators talk about, then walk who they follow to surface adjacent candidates.
- Requires Apify. If it is not connected, ask the person to connect it first.
- Run this once. Afterward, offer to set up a routine for ongoing sourcing; do not create the routine automatically.
- Bound each run to the top 10 seed profiles and about 25 ranked candidates.

### (c) Reviews gap to micro-personas

- Runs only if a review audit exists for the workspace.
- Find the missing micro-personas from the review gap, then search Inspo for creators who fill them.

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
- Use only supported Motion creator fields: category, follower band, displayTopics, displayTagline, followed-by-workspace as a separate pull, Motion link, total follower count. Do not claim creator type, audience demographics, brands worked with, spend range, geography, engagement, or rising status.

## Persistence

- For a casting or recommendation request, create one stable `recommendationId` for the block, append the contract-complete record to `recommendations.json.recommendations[]`, append one canonical `recommendation_created` audit event with that id in `entityIds`, and include the same id in the visible recommendation so a later brief or launched ad can link to it.
- For a pure creator-performance lookup that makes no recommendation, do not create a recommendation record or imply outcome attribution.
