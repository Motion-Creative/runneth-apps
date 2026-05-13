# Brand Kit Reference Example

This file is a generic structural reference for the `brand-kit` skill. It describes the section-by-section depth and specificity expected in a complete brand kit, with placeholder brand `Acme Co.` standing in for whatever brand you're building.

Not a runnable example. Not a saved brand kit. This is the template Runneth matches when populating real brand kits for real customers.

---

# Acme Co. — Brand Kit
_Last updated: 2026-01-01T00:00:00-05:00 · Source: homepage, main product LP + computed DOM styles + screenshots · Confidence: high for visual system; medium for voice_

## Identity

- **Category:** {{e.g. "Performance creative platform for in-house brand teams"}}
- **Positioning frame:** For **{{customer}}** who **{{need}}**, **Acme** is a **{{category}}** that **{{benefit}}**. Unlike **{{alternative}}**, we **{{differentiator}}**.
- **Tagline (verbatim):** "{{from page hero}}"
- **Origin story** (1-2 sentences if discoverable from the page, otherwise gap).

## Personality

Five to seven traits, each with one verbatim line of evidence from the source page.

- **Direct.** "Stop guessing what works." Imperative, no hedging.
- **Specific.** "$2.4M saved across 14 campaigns in Q3" not "real results."
- **Confident, not arrogant.** Claims are backed by named customers and numbers.
- **(continue, brand-specific)**

## Audience

- **Primary persona:** {{title, function, company size, awareness stage}}
- **Recognized customer brands** (from logo strip and case studies): {{verbatim list}}
- **Pain hooks the page leans on:** {{verbatim phrases}}

## Competitive Context

- **Named alternatives** (if mentioned on the page): {{list}}
- **Positioning move against alternatives:** {{one line}}
- **Category-defining language** (if any): {{verbatim}}

## Logo

- **Primary mark CDN URL:** {{from computed `logo.src`}}
- **Favicon set:** {{from `favicons[]`}}
- **Clear-space rule:** {{observed minimum padding around logo in nav, hero, footer}}
- **Lockup variants observed:** {{wordmark only / mark + wordmark / mark only}}
- **Backgrounds the logo appears on:** {{light bg, dark bg, color bg}}

## Color

Computed DOM values only. Note source for every entry.

| Role | Hex | RGB | Source | Used on |
| --- | --- | --- | --- | --- |
| Background (light) | #FFFFFF | rgb(255,255,255) | Confirmed - computed DOM | Body, sections |
| Background (dark) | #0A0A0A | rgb(10,10,10) | Confirmed - computed DOM | Footer, dark sections |
| Primary CTA | #5047EB | rgb(80,71,235) | Confirmed - computed DOM | Hero CTA, in-section CTAs |
| Accent | #FFE94D | rgb(255,233,77) | Confirmed - computed DOM | Highlights, underlines |
| Text primary | #0A0A0A | rgb(10,10,10) | Confirmed - computed DOM | Body copy on light |
| Text muted | #6B6B6B | rgb(107,107,107) | Confirmed - computed DOM | Secondary copy |
| Surface / card | #F5F5F5 | rgb(245,245,245) | Confirmed - computed DOM | Card backgrounds |

**Palette intent:** {{premium / playful / technical / clinical / aspirational}}

**Anti-palette** (colors the brand never uses even though they're declared in the stylesheet): {{e.g. "lime green, despite appearing in raw CSS extraction"}}

## Typography

Computed values from h1, h2, body. Pixel-exact.

| Role | Family | Weight | Size | Line height | Letter spacing | Source |
| --- | --- | --- | --- | --- | --- | --- |
| H1 | Inter | 700 | 56px | 1.05 | -0.02em | Confirmed - computed DOM |
| H2 | Inter | 700 | 36px | 1.15 | -0.01em | Confirmed - computed DOM |
| Body | Inter | 400 | 17px | 1.6 | 0 | Confirmed - computed DOM |
| Button | Inter | 600 | 16px | 1 | 0 | Confirmed - computed DOM |
| Eyebrow / label | Inter | 600 | 13px | 1 | 0.08em (uppercase) | Confirmed - computed DOM |

**Stack source:** {{Google Fonts / Adobe / self-hosted / system}}
**Register:** {{editorial / utilitarian / display-first}}

## Iconography

- **Style:** {{outline / filled / duotone / custom}}
- **Stroke weight:** {{px}}
- **Examples observed on page:** {{list with role}}

## Imagery

- **Photography style:** {{studio / lifestyle / UGC / abstract / none}}
- **Illustration style:** {{flat / 3d / hand-drawn / isometric / none}}
- **Product screenshot treatment:** {{cropped, full chrome, on-device, floating}}
- **Color treatment of imagery:** {{full color / duotone / desaturated}}
- **Do:** {{specific examples}}
- **Don't:** {{specific examples derived from anti-patterns}}

## Layout & Spacing

- **Base unit:** {{4 / 8 px}}
- **Container max width:** {{e.g. 1200px}}
- **Section vertical rhythm:** {{e.g. 96px between major sections}}
- **Grid:** {{columns + gutter}}
- **Border radius scale:** {{values, e.g. 4px / 8px / 16px / pill}}
- **Shadow scale:** {{values or "shadows minimal"}}

## Animation

- **Scroll-triggered:** {{yes/no, what kind}}
- **Hover micro:** {{description}}
- **Marquee / parallax:** {{yes/no}}
- **Pacing:** {{snappy / measured / cinematic}}

## Voice

- **Register:** {{e.g. "Casual-confident. Direct but warm. Never corporate."}}
- **Sentence length:** {{e.g. "Short to medium. Average ~12 words/sentence. Punchy openers."}}
- **Person:** {{first / second / third, plural / singular}}
- **Sentence patterns:** {{specific verbatim examples that recur}}
- **Reading level estimate:** {{Flesch-Kincaid band, e.g. 8th-10th grade}}

## Tone By Context

| Context | Tone | Verbatim example |
| --- | --- | --- |
| Hero | Bold, declarative | "{{verbatim}}" |
| Product section | Concrete, specific | "{{verbatim}}" |
| Pricing | Direct, no hedging | "{{verbatim}}" |
| Testimonial framing | Quiet, lets the quote do the work | "{{verbatim}}" |
| Error / empty states (if observed) | {{tone}} | "{{verbatim}}" |

## Vocabulary

- **Signature words** (3+ uses on page): "{{word1}}", "{{word2}}", ...
- **Banned words** (conspicuously absent or against brand spirit): "{{word}}", "{{word}}"
- **Punctuation rules:**
  - Em dashes: yes/no
  - Oxford comma: yes/no
  - Capitalization: sentence case / title case for headlines
  - Period at end of headlines: yes/no
- **Number formatting:** {{e.g. "$2.4M not $2,400,000"}}

## Headline Patterns

Three to five recurring patterns, each with a verbatim example and a derived template.

1. **Outcome-first imperative.** "Stop guessing what works." Template: `Stop {{problem verb}}.`
2. **Number-led claim.** "$2.4M saved across 14 campaigns." Template: `{{$ or %}} {{outcome verb}} across {{N}} {{units}}.`
3. **Pain-named hook.** "Your best ads die in your worst meetings." Template: `Your best {{X}} die in your worst {{Y}}.`

## Boilerplate

Standard short, medium, and long descriptions of the company, ready to paste into press, decks, and footers.

- **Short (1 line):** "{{verbatim or composed from page}}"
- **Medium (1 paragraph):** "{{verbatim or composed}}"
- **Long (2-3 paragraphs):** "{{verbatim or composed from About-section content}}"

## Web Patterns

- **Hero structure:** {{eyebrow / headline / subhead / CTA pair / trust strip}}
- **CTA pattern:** {{repeated above fold, mid-page, final}}
- **Proof pattern:** {{logo strip immediately below hero, then named case studies}}
- **Section rhythm:** {{problem -> solution -> proof -> objection-handle -> close}}
- **Footer pattern:** {{copy approach, link density}}

## Paid Social

- **Recommended primary CTA verbs:** {{e.g. "Get the playbook", "See it live", "Watch the 90-second tour"}}
- **Hook patterns proven on landing pages that transfer to ads:** {{patterns}}
- **Visual treatment for static ads:** {{e.g. "Logo top-left, bold headline center, accent color underline, recognizable customer logo bottom-right"}}
- **Voiceover register for video:** {{conversational / authoritative / energetic}}

## Email

- **Subject line patterns:** {{lowercase? sentence case? emoji? length range}}
- **Preheader patterns:** {{role they play}}
- **Body voice:** {{matches web voice or different?}}
- **Sign-off pattern:** {{first name / team / brand}}

## Anti-Patterns

Load-bearing section. Most off-brand work comes from missing don'ts.

- **Never use** {{specific words}} in headlines.
- **Never use** {{specific colors}} even though they appear in raw CSS extraction.
- **Never use** {{specific imagery treatments}}.
- **Never** make claims without a named customer or number to back them.
- **Never** use the secondary CTA style as a primary CTA.
- **(continue with brand-specific anti-patterns derived from the evidence)**

## Quick-Reference JSON

A compact JSON block downstream agents can paste into prompts:

```json
{
  "brand": "Acme Co.",
  "category": "{{category}}",
  "colors": {
    "primaryCta": "#5047EB",
    "accent": "#FFE94D",
    "bgLight": "#FFFFFF",
    "bgDark": "#0A0A0A",
    "textPrimary": "#0A0A0A",
    "textMuted": "#6B6B6B"
  },
  "type": {
    "family": "Inter",
    "h1Size": 56,
    "h2Size": 36,
    "bodySize": 17,
    "buttonSize": 16
  },
  "radius": { "scale": [4, 8, 16, 9999] },
  "voice": {
    "register": "casual-confident",
    "person": "second",
    "avgWordsPerSentence": 12,
    "signatureWords": ["{{word1}}", "{{word2}}"],
    "bannedWords": ["{{word1}}", "{{word2}}"]
  },
  "headlinePatterns": [
    "Stop {{problem verb}}.",
    "{{$X}} {{outcome}} across {{N}} {{units}}."
  ]
}
```

## Gaps

| Field | Reason it matters | How to close it |
| --- | --- | --- |
| Dark-mode color tokens | Some marketing surfaces use dark backgrounds | Capture a dark-bg page if one exists |
| Voice samples from email | Email tone can diverge from web | User uploads 2-3 recent customer emails |
| Long-form boilerplate | Needed for press and partnership pages | Pull from About page or ask |

---

**End of reference example.**

Adapt structure as needed for the specific brand, but maintain section depth and the "Confirmed / Inferred" labeling discipline throughout.
