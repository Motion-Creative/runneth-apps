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

## Output order

1. Confirmed roster creators first.
2. Credible ecosystem candidates second.
3. Honest no-fit result when the roster or ecosystem does not support the ask.

## Hard rules

- Never pad to quotas.
- Never surface disqualified creators.
- Respect hard eligibility filters such as lived experience, required props, credentials, comedy, authority, vulnerability, or documentation.
- Distinguish roster reuse, new sourcing, and creatorless AI or B-roll production.
- Creator performance claims require exclusive verified mapping and sufficient evidence.
- Shared and unresolved mapping remains visible but cannot support a strong creator-performance claim.

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
- Recompute rates from totals.
- State mapped coverage before making broad claims.
- If coverage is low, narrow the claim to mapped creator evidence rather than account-wide language.
