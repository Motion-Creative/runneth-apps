---
name: suggest-creators
description: Answer standalone casting, creator-fit, and creator-performance questions from one activated workspace by ranking confirmed roster creators first and then credible ecosystem candidates.
triggers:
  phrases:
    - who should we cast
    - suggest creators for this concept
    - creator leaderboard
    - who are our best creators
  intent: Handle standalone casting and creator-performance asks without owning the brief itself.
---

# Suggest creators

This skill handles standalone creator questions. It does not silently intercept every brief.

## Output structure

Visible output must use these sections in this order:

1. **My recommendation**
2. **Your roster**
3. **New creators to source**
4. **Next move**

If the concept is stronger without a creator, include **No creator needed** inside **My recommendation** and explain why.

## Hard rules

- Roster creators come first.
- Never pad to quotas.
- Never surface disqualified creators.
- Respect hard eligibility filters such as lived experience, required props, credentials, comedy, authority, vulnerability, or documentation.
- Distinguish roster reuse, new sourcing, and creatorless AI or B-roll production.
- Creator performance claims require exclusive verified mapping and sufficient evidence.
- Shared and unresolved mapping remains visible but cannot support a strong creator-performance claim.
- In customer-facing output, explain plainly how much spend is tied confidently to creators and where the evidence is shared or uncertain.

## What each creator entry must include

For every suggested creator, include:

- concept, persona, and delivery fit
- creative proof
- performance signal with spend and measurement window
- rights status
- main watchout
- whether this is roster reuse or new sourcing

If paid rights are unknown, say exactly:

> Paid usage rights are unknown. Confirm them before shortlisting.

## Ecosystem matching limits

Use only supported Motion creator fields:

- category
- follower band
- displayTopics
- displayTagline
- followed-by-workspace as a separate pull
- Motion link
- total follower count

Do not claim unavailable fields such as creator type, audience demographics, brands worked with, spend range, geography, engagement, or rising status.

## Motion routing

- use `motion inspo creators` for exact creator resolution and supported discovery
- use `motion inspo tiktok-organic-posts` only for known handles
- page through creator discovery when needed and dedupe by Motion creator id
- if a broad search fails with the known response-schema issue, say the search failed and fall back to supported category, follower, or exact name and handle pulls

## Performance answer rules

- Use the stored workspace performance policy.
- Keep Meta and Northbeam comparisons separate.
- Lead with spend as the reliability and priority lens.
- Recompute rates from totals.
- State mapped coverage before making broad claims.
- If coverage is low, narrow the claim to mapped creator evidence rather than account-wide language.

## Recommendation persistence

- For a casting or creator-recommendation request, create one stable `recommendationId` for the complete recommendation block.
- Append the contract-complete record to `recommendations.json.recommendations[]` before the final response, preserving existing records.
- Append one canonical `recommendation_created` event to `audit.jsonl` with the new `recommendationId` in `entityIds`.
- Include the same `recommendationId` in the visible recommendation so a later brief or launched ad can link to it exactly.
- For a pure creator-performance lookup that makes no recommendation, do not create a recommendation record or imply outcome attribution.
