---
name: competitor-analysis
description: Runs deep competitive research for a brand — identifying real competitors based on audience and positioning, then profiling each one in depth. Use this whenever you need to understand the competitive landscape before building creative strategy, or when a client wants to know how they stack up. Trigger for any request involving "who are their competitors," "competitive landscape," "what are competitors doing," "analyze competitors," "find competitors for [brand]," or any variation of wanting to understand how the market is positioned around a brand. Will automatically check for brand context and run brand intake first if none exists.
---

# Competitor Analysis

This skill maps the real competitive landscape for a brand — not just the obvious names, but the full field of alternatives a potential customer might choose instead. It profiles each competitor in depth so you can identify whitespace, exploit messaging gaps, and build creative that wins at the point of comparison.

**What this outputs:** A structured competitor analysis document with deep profiles on each competitor, a positioning map, and a strategic opportunities section.

**What makes this different from the brand intake competitor section:** Brand intake captures a light list of known competitors for context. This skill digs into *how* each competitor positions, *what messaging they're running*, *what creative angles they use*, and *where gaps exist that this brand can exploit*.

---

## PHASE 0: BRAND CONTEXT CHECK

Before doing anything else, check whether a brand context document already exists.

**How to check:**
- Look for a file named `brand-context-[brandname].md` in the project
- If the user has referenced a brand by name, use that name to search

**If a brand context document exists:**
> "Found brand context for [Brand Name] — using that as the foundation for competitive research. Give me a moment."

Proceed directly to Phase 1.

**If no brand context document exists:**
> "I don't have a brand context doc for this brand yet. I'll need to build that first so the competitor research is actually grounded in the right audience and positioning — otherwise I'm just guessing at who the real competitors are. Let me run a quick brand intake first."

Load and run the `brand-intake` skill in full. Once the brand context document is saved and confirmed, return to this skill and proceed to Phase 1.

---

## PHASE 1: COMPETITOR IDENTIFICATION

Using the brand context as your foundation, identify the **real** competitors — not just the ones the user named or the most obvious category players.

### What Makes a True Competitor

A true competitor is any brand that a potential customer would consider when making a purchase decision. This includes:

- **Direct competitors** — same product category, same audience, same use case
- **Alternative solution competitors** — different product, same problem solved (e.g., a supplement vs. a prescription medication vs. a lifestyle app for the same condition)
- **Aspiration competitors** — brands in adjacent categories that compete for the same wallet, mindset, or identity

The brand context doc is your guide. Use the audience, pain points, purchase triggers, and positioning to reason about who the customer is actually comparing this brand to.

### Research to Identify Competitors

Run the following searches:

1. `"[brand name] vs"` — surfaces direct comparison content from review sites, Reddit, YouTube
2. `"[product category] best [year]"` — roundup articles that list top players
3. `"[primary pain point] solution"` — surfaces alternatives that solve the same problem differently
4. `"[brand name] alternative"` — surfaces what people search when they want something else
5. `"[audience descriptor] [product category]"` — e.g., "women over 40 collagen supplement"
6. Check Reddit threads where the audience discusses the problem — see which brands come up organically

### Output of Phase 1

Before proceeding to deep profiling, produce a short list:

```
Identified competitors:
1. [Brand Name] — [one sentence: what they are and why they're a real competitor]
2. ...
3. ...
(aim for 4–6; more is okay if the category is crowded)
```

Then confirm with yourself: does this list reflect the full range of what the customer might choose instead? If not, add to it.

---

## PHASE 2: DEEP COMPETITOR PROFILING

For each competitor identified, research and profile them across the following dimensions. Use web search and page fetching heavily. Where possible, pull the Meta Ad Library for each brand.

### Profile Structure (repeat for each competitor)

---

#### [Competitor Name]

**Website:** [URL]

**What they sell:**
[Product(s), price points, SKU structure. Be specific.]

**Their core positioning:**
[The one thing they want to be known for. What is their primary claim or promise?]

**Their primary audience:**
[Who they're clearly targeting — demographics, lifestyle, pain point they're speaking to]

**Their messaging angles:**
[What 2–4 themes or hooks show up repeatedly in their copy, ads, and website? What problems/desires do they address?]
- Angle 1: [description]
- Angle 2: [description]
- Angle 3: [description]

**Ad creative approach:**
[If you can access their Meta Ad Library or find ad examples: what formats are they running? What hooks? What visuals? What tone? If no ad data is available, note that.]

**What they're doing well:**
[What would make a customer choose them? What are they executing clearly or effectively?]

**What they're NOT doing / where they're weak:**
[Gaps in their messaging, underserved audience segments, claims they can't make, positioning they've vacated, problems they don't address]

**How they compare to [Brand]:**
[Directly: how does this brand's positioning, product, and messaging differ from this competitor? What does [Brand] have that this competitor lacks — and vice versa?]

---

Repeat the above block for each competitor.

---

## PHASE 3: POSITIONING MAP

After profiling all competitors, synthesize a positioning map. This is a written analysis (not a literal 2x2 grid), though you can describe it as one if helpful.

### Axes to Consider

Choose the two axes that are most strategically meaningful for this brand's category. Common options:

- **Premium ↔ Accessible** (price/quality positioning)
- **Clinical/Science-led ↔ Lifestyle/Community-led** (brand personality)
- **Problem-focused ↔ Aspiration-focused** (messaging orientation)
- **Niche/specialist ↔ Mass market** (audience breadth)
- **Ingredient/mechanism-led ↔ Outcome-led** (product communication)

Explain where each competitor sits, where the brand sits, and what that reveals.

### Crowded Zones vs. Open Space

Identify:
- Where the market is **most crowded** (multiple brands saying similar things to similar audiences)
- Where there is **open space** that [Brand] could occupy or already occupies unchallenged

---

## PHASE 4: STRATEGIC OPPORTUNITIES

Based on the research and positioning map, produce a section of **actionable creative strategy implications**. These are the observations a creative strategist would use to brief hooks, angles, and formats.

Structure this as a series of named opportunities:

```
Opportunity 1: [Short name for the opportunity]
What's happening: [What gap or weakness exists in the competitive landscape?]
What [Brand] can do: [Concrete direction for messaging, hooks, or creative angles]
Why this works: [Why this positioning would resonate with the audience given the competitive context]

Opportunity 2: ...
```

Aim for 3–5 opportunities. Quality over quantity — these should be genuinely actionable, not generic.

---

## PHASE 5: BUILD THE OUTPUT DOCUMENT

Compile all research into a structured markdown document.

### Output Format

```markdown
# Competitor Analysis: [Brand Name]
*Generated: [Date] | Competitors analyzed: [N] | Brand context source: brand-context-[brandname].md*

---

## Competitive Landscape Overview
[2–3 sentence summary of the competitive environment: how crowded is it, what's the dominant positioning mode, and where does [Brand] sit in it?]

---

## Competitor Profiles

### [Competitor 1 Name]
[Full profile as structured in Phase 2]

### [Competitor 2 Name]
[...]

---

## Positioning Map

**Axes:** [The two dimensions you chose and why]

[Written analysis of where each brand sits, with a plain-language description of the map]

**Crowded zones:** [Where competition is dense]
**Open space:** [Where [Brand] can win unchallenged or is already winning]

---

## Strategic Opportunities

### Opportunity 1: [Name]
...

### Opportunity 2: [Name]
...

---

## Research Notes
*Sources consulted: [list URLs]*
*Competitors where ad data was unavailable: [list]*
*Low-confidence areas: [flag anything inferred vs. verified]*
```

---

## PHASE 6: DELIVER & CONFIRM

1. **Save** the document as `competitor-analysis-[brandname].md`
2. **Present** the finished document to the user
3. **Flag gaps** — call out any competitor where research was thin, ad data was unavailable, or positioning was hard to verify
4. **Ask one closing question:**

> "Does this match what you're seeing in the market? If there are competitors I missed or angles you know they're running that I didn't capture, let me know and I'll update the profiles. This feeds directly into your creative strategy and hook writing."

---

## Integration Notes

**Upstream dependencies:**
- `brand-context-[brandname].md` — required before this skill runs. If it doesn't exist, run brand intake first.

**Downstream handoffs:**
- **Creative Strategy Engine** — competitive positioning and whitespace directly inform which messaging angles to pursue and which to avoid
- **Hook Writing** — competitor messaging angles reveal what's saturated in the market; avoid echoing them
- **Brand Intake** — if this runs after brand intake, the competitor section of the brand context doc can be updated with a note: *"See competitor-analysis-[brandname].md for full profiles"*

When handing off to any downstream module:

> "Using `competitor-analysis-[brandname].md` for competitive context — positioning map and strategic opportunities are documented there."
