---
name: brand-relevant-keywords
description: Generates a comprehensive set of short-tail and long-tail keywords for a brand based on the problems, desires, and behaviors of its ideal customer — not the brand or product name. Use this whenever you need to research organic social conversations, scrape insights from Reddit, TikTok, forums, or any community platform, or build a keyword foundation for content and audience research. Trigger for any request involving "find keywords for this brand," "what would my customer search," "research keywords," "give me keywords for Reddit/TikTok," "what are people searching when they have this problem," or any variation of wanting to understand what the target audience is searching before they discover the brand or product.
---

# Brand-Relevant Keywords

This skill generates a research-ready keyword set for a brand — built entirely around what the ideal customer searches, says, and asks when they're experiencing the problem the product solves or chasing the desire it fulfills.

**What this outputs:** Short-tail and long-tail keywords organized by customer intent stage. Every keyword represents a real search or phrase a potential customer would use — before they know the brand exists.

**What this does not output:** Brand names, product names, or competitor names. These keywords represent the organic language of the audience, not the brand's language.

**Primary use:** Organic social research (Reddit threads, TikTok comments and searches, YouTube searches, Pinterest queries), forum scraping, content gap analysis, audience insight mining.

---

## Before You Start: Required Inputs

To generate the right keywords, you need:

1. **Brand context** — Check if a `brand-context-[brandname].md` file exists in the project. If it does, use it as your primary input.
2. **Product focus** — Which product(s) are these keywords for? If multiple, confirm whether to do one set per product or one combined set.
3. **Primary audience** — Who is the ideal customer? Their age range, lifestyle, life stage, and core pain or desire.
4. **Core problem or desire** — What is the fundamental problem the product solves, or the transformation the customer wants?

If any of these are missing and no brand context doc exists, ask for them before generating. Keyword quality is only as good as the audience clarity.

---

## PHASE 1: MAP THE CUSTOMER'S SEARCH LANDSCAPE

Before writing keywords, build an internal map of the customer's mental and behavioral journey. Do not output this section — use it to inform keyword generation.

Work through these questions mentally:

**The Problem Layer**
- What does the customer feel or experience before they find this product?
- What physical, emotional, or situational symptoms do they notice?
- What do they Google at 11pm when the problem is at its worst?
- What words do they use to describe their own problem? (Not clinical terms — their words)

**The Desire Layer**
- What does the ideal outcome look like for them?
- What are they imagining when they picture "fixed"?
- What transformation are they seeking — functional, emotional, social?

**The Research Layer**
- What do they search when they start looking for solutions?
- What questions are they asking?
- What are they comparing and evaluating?
- What do they type into Reddit or TikTok when they want to find people who've been through the same thing?

**The Doubt Layer**
- What are they skeptical about?
- What have they tried before that failed?
- What questions are they asking to verify something actually works?

---

## PHASE 2: GENERATE THE KEYWORD SET

Generate keywords across 7 intent categories. For each category, produce a mix of short-tail (1–3 words, broader) and long-tail (4+ words, specific) keywords.

**Labeling convention:**
- `[ST]` = Short-tail
- `[LT]` = Long-tail

Aim for a minimum of **8–12 keywords per category**, skewing toward long-tail (they perform better for research and scraping because they surface more specific, high-signal conversations).

---

### Category 1: Problem / Pain Keywords

What the customer searches when they're experiencing the problem and trying to understand or name it.

These are often the first searches in the journey — the customer knows something is wrong but may not know why or what to do yet.

Examples:
- `[ST]` why am I always tired
- `[LT]` why do I feel exhausted even after sleeping 8 hours
- `[ST]` cystic acne chin
- `[LT]` deep painful pimples on jaw that won't go away

---

### Category 2: Solution / Method Keywords

What the customer searches when they're actively looking for ways to fix the problem.

These searchers know the problem and want to solve it. They're not looking for a brand — they're looking for a method, approach, or answer.

Examples:
- `[ST]` how to fix hormonal acne
- `[LT]` how to clear hormonal acne without birth control naturally
- `[ST]` improve energy levels
- `[LT]` how to stop feeling tired in the afternoon without caffeine

---

### Category 3: Comparison / Research Keywords

What the customer searches when they're evaluating options and trying to make an informed decision.

These are mid-funnel searches — they're comparing approaches, ingredients, methods, or product types. Still no brand awareness required.

Examples:
- `[ST]` retinol vs niacinamide
- `[LT]` is retinol or niacinamide better for acne scars
- `[ST]` magnesium for sleep
- `[LT]` magnesium glycinate vs citrate for sleep which is better

---

### Category 4: Community / Experience Keywords

What the customer searches on Reddit, TikTok, and forums when they want to find other people who've experienced the same thing.

These keywords surface the highest-quality organic conversations for insight scraping. They reflect what real people are saying, not what brands want them to say.

Format these in a way that mirrors how people actually phrase Reddit/TikTok searches — conversational, first-person, experience-led.

Examples:
- `[ST]` acne cleared reddit
- `[LT]` has anyone cleared cystic acne without accutane reddit
- `[ST]` energy crash after lunch
- `[LT]` what finally fixed my 3pm energy crash reddit

---

### Category 5: Desire / Aspiration Keywords

What the customer searches when they're imagining the outcome — the better version of their life on the other side.

These searches reveal what transformation they're actually chasing, which directly informs messaging angles and hook writing.

Examples:
- `[ST]` clear skin routine
- `[LT]` skincare routine for clear skin in 30 days
- `[ST]` morning energy routine
- `[LT]` how to wake up with energy and not feel groggy every morning

---

### Category 6: Trigger / Situation Keywords

What the customer searches when a specific life event or situation makes the problem more urgent.

These surface high-intent, time-pressured audience segments — people whose problem has become acute because of a circumstance. These are often the most underutilized keywords in research.

Examples:
- `[ST]` acne before wedding
- `[LT]` how to clear skin fast before wedding in 3 months
- `[ST]` tired after having baby
- `[LT]` how to have more energy as a new mom with a newborn

---

### Category 7: "Why" / Root Cause Keywords

What the customer searches when they want to understand *why* the problem is happening to them.

These searches reflect deep frustration — the customer has often tried surface-level solutions and wants to understand the root cause. Content and creators that answer these questions build enormous trust.

Examples:
- `[ST]` why do I keep breaking out
- `[LT]` why do I get pimples in the same spot every month
- `[ST]` why am I so tired all the time
- `[LT]` why do I have no energy even when I eat healthy and sleep enough

---

## PHASE 3: PLATFORM APPLICATION NOTES

After generating the keyword set, add a brief section on how to deploy these keywords by platform. Tailor this based on the brand's audience — a younger DTC audience will skew TikTok/Reddit; older or B2B audiences may skew toward YouTube/Google.

### Reddit
- Use the long-tail community/experience keywords as search queries on Reddit directly
- Search the keyword + "reddit" on Google for high-signal threads
- Best categories for Reddit: Community/Experience, Why/Root Cause, Comparison/Research
- Look for: recurring language patterns, objections, what people say "finally worked," frustrations with failed solutions

### TikTok
- Use shorter, punchier versions of Problem and Desire keywords as hashtag research
- Search both the keyword AND "POV: [keyword]" to find creator content
- Best categories for TikTok: Desire/Aspiration, Trigger/Situation, Problem/Pain
- Look for: hook formats that get high engagement on this topic, comment section language, creator vocabulary

### YouTube
- Long-tail Solution and Why/Root Cause keywords work best
- Prefix with "how to" and "why" — these are dominant YouTube search intents
- Look for: video titles that get traction, thumbnail/hook patterns, comment section language

### Pinterest
- Desire/Aspiration and Solution keywords perform best
- Add "ideas," "tips," "routine," or "guide" to long-tail terms
- Look for: visual framing of the outcome, aspirational language, lifestyle context

### Google / Forums
- All 7 categories apply
- Use long-tail variants for the highest-signal results
- Look for: question-based forums (Quora, Reddit, niche forums), blog comments, review sections

---

## Output Format

```markdown
# Brand-Relevant Keywords: [Brand Name] — [Product/Focus]
*Generated: [Date] | Audience: [Primary persona description]*

---

## How to Use This Document

These keywords represent what the ideal customer searches **before** they know this brand exists. Use them to:
- Search Reddit, TikTok, YouTube, and forums for organic conversations
- Scrape community language and insights to inform ad copy and hooks
- Identify what content gaps exist and what questions the audience is asking
- Build a research foundation for the Creative Strategy Engine

None of these keywords include the brand name, product name, or competitor names.

---

## Keyword Set

### Category 1: Problem / Pain Keywords
| Keyword | Type | Notes |
|---|---|---|
| [keyword] | ST / LT | [optional: why this is useful] |

### Category 2: Solution / Method Keywords
| Keyword | Type | Notes |
|---|---|---|

### Category 3: Comparison / Research Keywords
| Keyword | Type | Notes |
|---|---|---|

### Category 4: Community / Experience Keywords
| Keyword | Type | Notes |
|---|---|---|

### Category 5: Desire / Aspiration Keywords
| Keyword | Type | Notes |
|---|---|---|

### Category 6: Trigger / Situation Keywords
| Keyword | Type | Notes |
|---|---|---|

### Category 7: "Why" / Root Cause Keywords
| Keyword | Type | Notes |
|---|---|---|

---

## Platform Application Notes

**Reddit:** [3–4 recommended search approaches using keywords from this set]
**TikTok:** [3–4 recommended search approaches + hashtag angles]
**YouTube:** [2–3 recommended search approaches]
**Pinterest:** [2–3 recommended search approaches]
**Google/Forums:** [2–3 recommended approaches]

---

## Keyword Summary Stats
| Metric | Count |
|---|---|
| Total keywords | [N] |
| Short-tail | [N] |
| Long-tail | [N] |
| Categories covered | 7 |

---

## Research Notes
*Brand context source: [brand-context file used or "user-provided inputs"]*
*Gaps / areas to expand: [any categories that are thin, or audience segments that need their own keyword set]*
```

---

## PHASE 4: DELIVER & CONFIRM

1. **Save** the keyword document as `keywords-[brandname]-[product or "brand"].md`
2. **Present** it using `present_files`
3. **Flag gaps** — call out any category where coverage feels thin, or any obvious audience segment (e.g., a secondary persona) that would benefit from its own keyword set
4. **Ask one closing question:**

> "Does this match how your customer actually talks about this problem? If there are phrases or topics I missed, let me know and I'll add them. This becomes the research foundation for any organic or community insights work on this brand."

---

## Integration Notes

**Upstream dependencies:**
- `brand-context-[brandname].md` — provides audience, pain points, and brand language context. If it exists, always read it before generating keywords.
- `product-catalog-[brandname].md` — provides product specifics that help sharpen Category 3 (Comparison) and Category 2 (Solution) keywords.

**Downstream handoffs:**
- **Creative Strategy Engine** — these keywords inform the pain/desire mapping and help validate that messaging angles are grounded in real audience language
- **Hook Writing** — long-tail community/experience keywords often contain verbatim hook-ready language; flag any standout phrases
- **Review Audit** — if review scraping reveals new vocabulary, run a keyword refresh to capture it
- **Brand Intake** — if running brand intake on a new client, this skill can run after Phase 2 research is complete to capture organic search context

When handing off to any downstream module:

> "Using `keywords-[brandname]-[product].md` as the audience language foundation — the vocabulary, pain language, and search intent patterns are documented there."
