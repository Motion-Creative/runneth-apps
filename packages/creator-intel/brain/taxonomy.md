# Creator Intel taxonomy

This file defines shared vocabulary for creator-intel decisions.

## Motion creator categories

Valid category values for supported Motion creator discovery:

- beauty
- fashion
- fitness
- health-wellness
- food
- travel
- tech
- gaming
- comedy
- education
- business-finance
- lifestyle
- parenting-family
- pets-animals
- home-diy
- arts-crafts
- music
- sports
- entertainment
- news-politics
- automotive
- outdoors
- other

## Default follower bands

- `ugc`: 0 to 100000
- `mid`: 100001 to 1000000
- `influencer`: above 1000000

Do not use follower totals as proof of fit by themselves.

## Identity statuses

- `pending`: proposal waiting on human decision
- `confirmed`: trusted local decision
- `unresolved`: valid creator identity without enough enrichment or with unresolved ambiguity
- `disqualified`: explicitly excluded from recommendations

## Evidence mapping statuses

- `exclusive`: one creator has exclusive verified claim on the mapped evidence
- `shared`: multiple creators share the evidence
- `unresolved`: evidence exists but cannot be safely assigned
- `human-confirmed`: a person explicitly confirmed the mapping
- `naming-rule-inference`: mapping proposed from naming rules only

## Separate jobs

Keep these jobs separate:

- creator identity
- workspace relationship
- rights state
- evidence mapping
- creator representation
- recommendation state

## Creator representation

Each confirmed creator carries `representation`: the `topics` they talk about and the `anglesCovered` they can carry. This is what powers gap analysis. It is captured during roster confirmation, not inferred silently at recommendation time.

## Rights vocabulary (simple)

Rights are one object per creator on the relationship record:

- `usageScope`: `none | some | all`
- `whitelisting`: `true | false`
- `expiryNote`: optional free text

There is no separate rights ledger and no territory or advertiser matrix. Unknown usage scope never means approved for paid.

## Performance measure

- Default is spend.
- If an Account Context doc from the Meta onboarding package exists, use its goal instead.
- Never use or ask about Northbeam.

## Recommendation methods

- `a-motion-context`: topics from brand context and the ad account, approved by the person, then Motion creator search. Always available.
- `b-top-creator-similarity`: top creator profiles plus adjacent voices found through who they and their networks follow. Run once, offer a routine after. Needs an Apify key; surface that only as the key requirement, never as the method name.
- `c-reviews-gap`: missing micro-personas from a review audit, then Inspo search. Requires a review audit.

## Recommendation order

1. confirmed roster creators who pass hard eligibility
2. credible new creators from the ladder above
3. honest no-fit or no-creator-needed result when neither supports the ask

Never pad to quotas. Never surface disqualified creators. Respect hard eligibility before soft fit.

## Supported Motion routing

- `motion inspo creators`: exact creator resolution and supported ecosystem discovery
- `motion inspo tiktok-organic-posts --username <handle>`: stored organic feed for a known handle
- `motion meta ads --grain ads --include-associated-objects`: ad-row evidence
- `motion meta insights`: creative summaries, transcripts, and tags only after exact asset ids are known

Method (b), top creator similarity, reads public creator profiles and following graphs and needs an Apify key. Keep the tool name out of user-facing output; only surface the key requirement. Always use the stored workspace id on Motion pulls. Do not invent CLI fields.

## Supported Motion creator fields

You may use only: category, follower band, displayTopics, displayTagline, followed-by-workspace in a separate pull, Motion link, total follower count, Motion creator id for deduplication.

Do not claim unavailable fields such as creator type, audience demographics, brands worked with, spend range, geography, engagement, or platform-specific audience quality.

## Search fallback rule

If a broad creator search hits the known response-schema issue, say the search failed and fall back to supported category, follower, or exact name and handle pulls. A tool error is not an empty result.
