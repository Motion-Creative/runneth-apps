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

This skill owns creator recommendations. It anchors on how the customer actually hires, casting for a specific campaign, product, theme, or seasonal push, then proposes the plan and gets a yes before it searches or sources. It runs a three-method ladder that degrades gracefully so there is always an answer.

## Requirements

- The workspace must be activated with a confirmed roster.
- Read `workspace.json` for `hiringLens` and `performanceMeasure`, and `identities.json` for each confirmed creator's `representation` (topics and angles) and the products they ran.

## Start from how they hire (the target comes first)

Recommendations anchor on the customer's hiring unit, not a roster-wide audit. Read `hiringLens`, reflect it back in one line (for example, "you cast per campaign or product, and lean on referrals and finding more like your best creators"), then ask which campaign, product, theme, or seasonal push they want creators for right now, with concrete examples from their real products (for example, "AI Training Club, an evergreen push, a Father's Day campaign, or a specific product").

Do not open with a whole-roster gap analysis. It resembles the reviews-gap method and confuses the flow. Wait for the target, then scope everything to it.

Once they name a target, Start with the gap for that target only: which angles or personas that specific campaign needs that the roster does not already cover.

### Scoping the gap to the target

1. **Target need.** What angles and personas does this campaign or product call for? Use the brand-audit strategy matrix at `/agent/brain/brand-audit/<workspace-slug>/strategy.md` when it exists, otherwise own-brand context from `motion brand-context` and the messaging of that campaign's own top ads.
2. **Roster coverage for the target.** Which confirmed creators already fit this campaign, from `representation` and the products they ran.
3. **The gap.** The angles or personas this campaign needs where the roster is thin or empty. That gap drives which methods to run and what to search for.

## The three-method ladder

For the chosen target, propose which of the three methods you will run given what is available, get the yes, then run them. Present them as three layers the customer can pick from for that campaign.

When you offer the methods, state plainly what each one actually does, so the customer knows the capability, for example: "I can search Motion's creator library for people known in this space," "I can start from your best creators for this campaign and find adjacent voices their networks follow," and "I can analyze your customer reviews, find the micro-personas you are missing, then find creators on Motion who capture those." Do not describe a method vaguely or leave the customer to guess what it can do.

### (a) Motion-context, always available

- Works for any customer and any vertical. The search topics come from three sources together: the customer's brand context (`motion brand-context`), the chosen campaign's own ad messaging (`motion meta insights --summary-sections messagingAndPositioning --summary-sections hookOrHeadline`), and above all how the customer sources creators (the `hiringLens` from setup, plus the target they name for this run).
- Pin the specific relevant element before searching. Ask whatever clarifying questions are needed to know exactly what to look for: which product, which persona, which campaign or angle. If they hire by product, derive topics from that product's benefits and audience; if by persona, from that persona's language; if by campaign, from that campaign's message. Do not search on a vague vertical when a product, persona, or campaign is the real unit. The topics are always the customer's, never a fixed list.
- Show the proposed 3 to 5 topics and ask the person to approve them before searching.
- On approval, search with a follower band, this is the key. A bare `--search-term` is follower-weighted and returns celebrities (MrBeast, GaryVee); paging past them takes 12+ pages of general accounts. Instead run `motion inspo creators --search-term "<approved topic>" --followers-min 5000 --followers-max 150000` to bracket the working-creator range where the real specialists for that vertical live (away from mega-celebrities), and page through that band. Adjust the band by vertical if needed; the point is to bias toward the specialist size. There is no ascending sort, so the band is what biases toward the right size.
- Filter the band to real niche fit by tagline and topics, using the customer's own space, not a fixed keyword list. Build the filter vocabulary from their category and campaign language: a marketing tool keeps marketing/ads/UGC/ecommerce creators, a skincare brand keeps skincare/beauty/routine creators, a finance app keeps personal-finance creators. Drop off-vertical and general lifestyle accounts, dedupe by Motion creator id, and present the best 6 to 10 with each creator's Motion link, follower count, and a one-line reason. This recipe returned real specialists live for Motion (Joel Marlinarson, Mitch Paid Ads, Brian Blum, Mo Anwary); the same band-plus-topic recipe generalizes to any vertical.
- This is a reverse-engineered path, not Motion's internal "Curated for your brand" endpoint, which is not exposed. It works, but if results are thin, say so and lean on method (b). Never present a raw high-follower category list as the recommendation.

### (b) Top creator similarity

- Seed set: the top roster creators by the workspace performance measure, plus any north-star creators the customer named explicitly.
- Ask for the seed creators' main Instagram or TikTok profiles, or use handles already confirmed on the roster.
- For each seed, read the profile and the accounts it follows, then rank adjacent creators by how many seeds' networks they appear in and how well they fit the gap topics. Dedupe against the roster and against each other.
- Run once, bounded to the top 10 seed profiles and about 25 ranked candidates. Resolve any candidate that also exists in Motion with `motion inspo creators`; keep off-Motion candidates as raw handles with their profile link.
- This path needs an Apify key, used through `secure-fetch` against `api.apify.com`. Working recipe, verified live:
  - Actor: `datadoping/instagram-following-scraper` (no-cookie Instagram following list).
  - Call: `POST /v2/acts/datadoping~instagram-following-scraper/run-sync-get-dataset-items` with body `{"usernames":["<handle>"],"max_count":150}`. `usernames` and `max_count` are required. Bearer auth via `--secret-key APIFY_API_KEY --auth-scheme Bearer`. Keep `--timeout-ms 120000` (secure-fetch caps at 120s), so run one seed per call and keep `max_count` around 150 to finish inside the window; raise depth and add more seeds for a fuller list.
  - Seeds: the customer's best creators for the target plus their named north-stars. Run each seed, then keep the accounts followed by two or more seeds as candidates. Exclude the seeds themselves and anyone already on the roster (including the customer's own team handles).
  - The returned fields are handle, full name, private/verified flags, avatar; there is no follower count, so rank by how many seeds' networks a candidate appears in, then resolve promising ones with `motion inspo creators` by name.
  - Do not hand-wave that the mechanic might not exist. Do not name the underlying tool to the customer; call it top creator similarity. If the key is not connected, say you need an Apify key connected, and do not run until it is.
- Enrich every candidate before presenting: run the profile scraper (see `creator-intel-reference/apify-actors.md`) to get follower count and bio. Present at least 6 to 10 creators, each with: the Instagram link (`https://www.instagram.com/<handle>/`), the follower count, what they talk about, and the reason you picked them (which of the customer's seeds follow them, plus their bio fit). Apply judgment: drop off-fit accounts (lifestyle, unrelated niches, vague mega-accounts) even if they appear in the overlap, and say you filtered them.
- Snowball expansion: after showing the list, ask which candidates the customer likes, then run the following walk on those picks to surface the next ring, and keep expanding. That compounding loop is the point of the method.
- The verified actors and exact run recipes live in `creator-intel-reference/apify-actors.md`. Use them; do not re-discover the actors each run unless they stop working.
- After a one-time run, Afterward, set up a routine for ongoing sourcing; do not create the routine automatically.

### (c) Reviews gap: sharper queries for method A

- Method C is not a separate search engine. It runs exactly like method A, but the review audit's job is to find the sharper, more niche things to search for. A review audit mines the customer's reviews to surface the pains, desires, and micro-personas showing up in real customer language, especially the ones the roster is not reaching. Those micro-persona and pain-language phrases become additional, tighter search topics, and you feed them straight into method A's band-plus-topic recipe.
- So C = better queries for A. Explain in one line what a review audit is and does whenever you reference it. It needs a connected reviews source; if none exists, explain what it surfaces and say a reviews source would unlock it. Do not offer to connect one mid-flow; that is a setup step, not a recommendation step.

Methods generalize to every customer and vertical: A and B read the customer's own brand context, campaign, roster, and seeds, not Motion-specific values. When a reviews source for (c) is not present, run (a) and (b) on the topics you can derive; C only adds sharper review-derived queries on top of A.

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
