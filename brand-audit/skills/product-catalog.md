---
name: product-catalog
description: Scrapes a brand's website to build a facts-only product catalog document — no benefits, no value props, no reviews, just raw product data. Use this whenever you need accurate product specs before any strategy or messaging work begins. Trigger when the user says "scrape their products", "build a product catalog", "pull product info", "document their products", or any time a creative strategy workflow needs factual product grounding before interpretation. Also trigger automatically when a brand context document exists but no product catalog has been built yet. This must run BEFORE Creative Strategy Engine, Hook Writing, or any benefit-framing work — it is the factual source of truth all downstream modules pull from.
---

# Product Catalog Builder

Crawls a brand's website and extracts factual product data from every available product page. Compiles findings into a structured reference document.

**What this outputs:** Facts only. What the product is, what's in it, how it's sold, how it's used — as stated by the brand. No interpretation of what those facts mean for the customer.

**What this does not output:** Benefits, value props, emotional framing, review language, or any claim the brand hasn't made themselves. If a piece of information could be rephrased as "so what?" — it doesn't belong here.

---

## PHASE 1: MAP THE PRODUCT CATALOG

### Step 1 — Find all product pages

Start by mapping the site. Try these in order:

1. `[domain]/sitemap.xml` — scan for product page URLs
2. `[domain]/shop`, `/products`, `/collections`, `/store`, `/catalog`
3. Homepage navigation — follow any shop or products links

Use `web_fetch` to retrieve the page and extract all product URLs. Look for URL patterns like `/products/`, `/product/`, `/p/`, `/item/`, or `/collections/[name]/products/`.

### Step 2 — Compile the full URL list

From the sitemap or shop index, extract every URL that is an individual product page (not category pages, blog posts, or account pages).

Log the full list before scraping. **If there are more than 30 products**, pause and ask the user:

> "I found [N] products. Do you want full coverage, or should I scope this to a specific product line? If full coverage, this may take a few minutes."

---

## PHASE 2: SCRAPE EACH PRODUCT PAGE

For each product URL, use `web_fetch` and extract only what is explicitly stated on the page. Do not infer, editorialize, or add context.

### Fields to Extract Per Product

**Identity**
- Product name (as listed)
- Product line or collection (if part of one)
- Page URL

**Format & Physical Description**
- Product type (e.g., serum, supplement, spray, device, brush)
- Physical format (e.g., liquid, powder, capsule, wipe, stick, spray)
- Size(s) or weight(s) available
- All variants (scents, colors, strengths, sizes — list every option)
- What's physically included in the package (e.g., bottle + pump, device + 3 attachments, 30-count bag)

**Ingredients / Materials / Components**
- Full ingredient list — copy verbatim if provided
- Key ingredients the brand calls out (e.g., "contains 2% salicylic acid") — verbatim
- Materials for non-consumable products (e.g., "medical-grade silicone, BPA-free")
- Any named proprietary blends or formulations

**Usage**
- How to use — copy or close paraphrase of the brand's instructions
- Frequency (e.g., "use twice daily", "apply every 4–6 hours")
- Application method
- Any stated compatibility or incompatibility (e.g., "safe for color-treated hair", "not for use with X")

**Intended Use / Who It's For**
- Any explicit audience or use-case language from the page only (e.g., "for sensitive skin", "for dogs 10lbs+", "for professional use")
- Do not infer audience — only record what the brand explicitly states

**Certifications & Third-Party Validations**
- Certifications listed on the page (e.g., cruelty-free, USDA organic, dermatologist-tested, FDA-registered, NSF-certified)
- Any third-party testing or clinical validation badges

**Claims**
- Clinical or study-backed claims — copy verbatim (e.g., "clinically proven to reduce X in 4 weeks in a study of Y participants")
- Any performance claims stated on the page — verbatim
- Regulatory disclaimers (e.g., "These statements have not been evaluated by the FDA. This product is not intended to diagnose, treat, cure, or prevent any disease.")

**Pricing & Purchase Structure**
- Retail price per variant
- Subscription option and discount (if offered)
- Bundle availability and bundle name/price (if applicable)
- Any noted quantity discounts

---

## PHASE 3: BUILD THE CATALOG DOCUMENT

Compile all scraped data into the output document below.

### Output Format

```markdown
# Product Catalog: [Brand Name]
*Generated: [Date] | Source: [domain] | Products documented: [N]*

---

## How to Use This Document

Facts only. Every field reflects what the brand states on their product pages — nothing has been interpreted, reframed, or editorialized. Use as the raw input layer for benefit mapping, messaging angle development, and hook writing. Do not treat any field here as a benefit or value prop — that work happens downstream.

---

## Product Index

| # | Product Name | Type | Variants | Price Range |
|---|---|---|---|---|
| 1 | [Name] | [Type] | [e.g., 3 sizes] | [$X–$Y] |

---

## Full Product Entries

---

### [Product Name]

**URL:** [product page URL]
**Product Line:** [if applicable, otherwise omit]
**Type:** [e.g., facial serum, dog shampoo, protein powder, silicone brush]
**Format:** [e.g., liquid, capsule, spray, solid bar]

**Sizes / Variants:**
| Variant | Price | Subscription Price |
|---|---|---|
| [e.g., 1 oz] | $[X] | $[Y] (save Z%) |

**What's Included:**
- [Exactly what comes in the package]

**Ingredients / Materials:**
> [Full ingredient list — verbatim from page, or "Not listed on page" if absent]

**Key Ingredients Called Out by Brand:**
- [Ingredient name]: [concentration or descriptor as stated — e.g., "2% Salicylic Acid"]

**How to Use (as stated by brand):**
> [Verbatim or close paraphrase]

**Frequency:** [e.g., twice daily, as needed]

**Who It's For (brand-stated only):**
- [Any explicit use-case or audience language from the page]

**Certifications:**
- [List all — or "None listed" if absent]

**Claims:**
- "[Verbatim claim from page]"
- "[Any additional verbatim claims]"

**Regulatory Notes:**
- [Any disclaimer language — verbatim]

**Purchase Options:**
- One-time: $[X]
- Subscribe & Save: $[Y] ([Z]% discount)
- Available in bundle: [Bundle name] — $[price] *(includes: [what's in the bundle])*

---

[Repeat for each product]

---

## Catalog Notes

| Field | Value |
|---|---|
| Total products documented | [N] |
| Pages successfully scraped | [N] |
| Pages that failed / were inaccessible | [list URLs] |
| Products with incomplete ingredient data | [list] |
| Products with no pricing listed | [list] |
| Low-confidence entries | [anything inferred rather than directly stated] |
```

---

## PHASE 4: DELIVER & CONFIRM

1. **Save** as `product-catalog-[brandname].md`
2. **Present** using `present_files`
3. **State coverage:** "I documented [N] products across [N] pages."
4. **Flag gaps clearly:** any pages that failed, products missing ingredients, or fields left blank
5. **Ask one closing question:**

> "Does this look complete? If there are products missing, paste the URLs and I'll add them. Once confirmed, this becomes the factual reference layer for all creative work on this brand."

---

## Downstream Handoff Note

When passing to Creative Strategy Engine, Hook Writing, or Creative Mechanics, reference this document explicitly:

> "Using `product-catalog-[brandname].md` as the factual source layer. All benefit framing and messaging angles should derive from what's documented there — not from assumptions."

This ensures every benefit claim in hooks and copy traces back to a verifiable product fact.
