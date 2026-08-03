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

## Relationship vocabulary

Keep these jobs separate:

- creator identity
- workspace relationship
- rights state
- evidence mapping
- recommendation state

Relationship values may include:

- UGC production
- paid media usage
- organic usage
- partnership
- whitelisting

## Rights status vocabulary

- `approved`
- `expired`
- `unknown`
- `denied`

Unknown never means approved.

## Recommendation modes

- `roster-reuse`
- `new-sourcing`
- `creatorless-production`

## Recommendation order

1. confirmed roster creators who pass hard eligibility
2. credible ecosystem candidates from supported Motion discovery
3. honest no-fit result when neither tier supports the ask

Never pad to quotas. Never surface disqualified creators. Respect hard eligibility before soft fit.

## Supported Motion routing

- `motion inspo creators`: exact creator resolution and supported ecosystem discovery
- `motion inspo tiktok-organic-posts --username <handle>`: stored organic feed for a known handle
- `motion meta ads --grain ads --include-associated-objects`: ad-row evidence
- `motion meta insights`: creative summaries, transcripts, and tags only after exact asset ids are known

Always use the stored workspace id. Do not invent CLI fields.

## Supported Motion creator fields

You may use only:

- category
- follower band
- displayTopics
- displayTagline
- followed-by-workspace in a separate pull
- Motion link
- total follower count
- Motion creator id for deduplication

Do not claim unavailable fields such as creator type, audience demographics, brands worked with, spend range, geography, engagement, rising status, or platform-specific audience quality.

## Search fallback rule

If a broad creator search hits the known response-schema issue, say the search failed and fall back to supported category, follower, or exact name and handle pulls. A tool error is not an empty result.
