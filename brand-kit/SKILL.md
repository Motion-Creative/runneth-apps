---
name: brand-kit
description: >
  Build a complete brand kit (identity, visual system, voice and messaging, application
  patterns, anti-patterns) comprehensive enough that another agent can produce on-brand
  work (ads, landing pages, decks, social, emails) without ever seeing the original
  brand. Enriches a landing-page-summary with brand-system inference, or builds from
  existing files, or conversationally from scratch. Always uses computed DOM styles
  (not raw stylesheet extraction) for visual system values. Produces both a markdown
  source-of-truth and an HTML deliverable styled in the brand's own system. Use when
  the user asks to "build a brand kit", "extract brand guidelines", "create a brand
  guide", "what's their brand DNA", "set up brand", or "give me a brand-system spec
  for X".
argument-hint: "<URL or 'from-files: <paths>' or 'from-scratch'> [--save <output-path>]"
---

# Brand Kit

Output a brand kit dense enough that a downstream agent (designer, ad-builder, landing-page
generator, copywriter, deck-builder) can produce on-brand work without seeing the original
brand. The kit captures what the brand **is**, how it **looks**, how it **sounds**, and what
it **never does**.

For depth, format, and specificity expectations, see `reference-example.md` in this skill's
repo folder. The structure there is the standard. Adapt the content to the brand you're
working with.

---

## Critical Rule: Computed DOM Styles, Not Raw Stylesheet Extraction

**Raw CSS stylesheet variables are unreliable for visual system work.** Frameworks like
Webflow, Framer, and WordPress include every declared variable in their stylesheets
(including template defaults, unused variants, and library tokens) regardless of whether
they ever render on screen. Extracting color or font values from a raw stylesheet will give
you wrong values.

**The only reliable sources for visual system data:**

1. **Computed DOM styles.** What the browser actually applies to rendered elements. These
   reflect the real painted values, not declared possibilities.
2. **Screenshots.** Visual verification of what computed styles describe.

Use computed styles as the source. Use screenshots to verify. Never trust raw stylesheet
extraction for color, font, or spacing values.

This is the single most common silent failure mode for brand-kit work. The landing-page
summary's § 12 carries this same warning. Do not import § 12 colors directly into a brand
kit without re-extracting via computed DOM.

---

## Inputs (Three Modes)

1. **From a landing page.** `$ARGUMENTS` is a URL or hostname (e.g. `acme.com`).
2. **From existing files.** `$ARGUMENTS` is `from-files: <paths>` pointing to brand docs,
   style guides, asset folders, or prior brand-kit outputs.
3. **From scratch.** `$ARGUMENTS` is `from-scratch`. Ask the user for seed inputs in one
   conversational batch.

If `$ARGUMENTS` is empty, ask once which mode. If it's a URL or hostname, mode 1.
Auto-detect file paths.

---

## Method

### Step 1a — Text And Copy Layer (Landing Page Summaries)

**Mode 1 (URL or hostname):**

Brand-kit needs fresh landing page context to avoid stale brand inference. The
`landing-page-summary` skill is the upstream source.

1. **Always invoke `landing-page-summary` for the target URL in this conversation.** Do not
   read a pre-existing saved summary directly. If the saved summary is older than this
   conversation, it is presumed stale.
2. The summary skill handles archive-before-overwrite. The current file at
   `/agent/brain/landing-pages/<slug>--<domain>.md` is always the freshest after
   invocation.
3. For multi-page brands (e.g. homepage, main product page, pricing), invoke
   `landing-page-summary` for each page you need. The richest signal usually lives on
   homepage and the main product LP.

If `landing-page-summary` is not installed in this sandbox:

- Fall back to running `WebFetch` against the URL with an exhaustive extraction prompt.
- Quality is degraded. No screenshots, no nav hover, no exit-intent. Note this as a Gap.
- Tell the user the brand kit will be stronger if they install `landing-page-summary`.

**What summaries are good for:**

- Verbatim copy: headlines, CTAs, subheads, testimonials, microcopy
- Page structure and section rhythm
- Voice and messaging patterns
- Proof elements (logos, stats, testimonials)
- CTA text and placement

**What summaries are NOT reliable for:**

- Color values. CSS extraction in summaries pulls raw stylesheet variables, which include
  template defaults that never render. Do not use summary color values.
- Font families. Same problem. Webflow stylesheets declare every font in the project
  including unused ones. Do not use summary font values.
- Spacing, radius, or layout values from CSS extraction.

---

### Step 1b — Visual System Layer (Computed DOM Styles + Screenshots)

This step is **required** for any URL-based brand kit. It is the only way to get accurate
colors, fonts, and sizing. Run it even when summaries already exist.

**Playwright bootstrap.** Same routine as `landing-page-summary` Phase 0:

```bash
node -e "require.resolve('playwright')" 2>/dev/null || npm install -g playwright
ls ~/.cache/ms-playwright/ 2>/dev/null | grep -q chromium || npx playwright install chromium
PW_NODE_PATH="$(node -e "console.log(require('path').dirname(require('path').dirname(require.resolve('playwright'))))")"
echo "NODE_PATH=$PW_NODE_PATH"
export NODE_PATH="$PW_NODE_PATH"
```

Run the following script against the 2-3 most brand-signal-rich pages (homepage, main
product LP, and one dark/bottom-funnel page if it exists). Save the extraction script and
its outputs to `./workdir/`. **Never write scripts or any other files to `/tmp/`.**

```javascript
// Save as ./workdir/bk_extract.js and run per URL:
// NODE_PATH="$PW_NODE_PATH" node ./workdir/bk_extract.js "<URL>" \
//   "./workdir/brand-kit-<slug>-<page>.json" "./workdir/brand-kit-<slug>-<page>.png"

const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [url, jsonOut, imgOut] = process.argv.slice(2);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
               '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: imgOut, fullPage: false });

  const computed = await page.evaluate(() => {
    const result = {};

    result.bodyBg = window.getComputedStyle(document.body).backgroundColor;

    const btns = Array.from(document.querySelectorAll('a, button')).filter(el => {
      const text = el.innerText?.trim();
      return text && text.length > 2 && text.length < 80;
    }).slice(0, 30);
    result.ctaElements = btns.map(el => {
      const s = window.getComputedStyle(el);
      return {
        text: el.innerText?.trim(),
        bg: s.backgroundColor,
        color: s.color,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        fontFamily: s.fontFamily,
        borderRadius: s.borderRadius,
      };
    }).filter(el =>
      el.bg !== 'rgba(0, 0, 0, 0)' && el.bg !== 'transparent'
    );

    const h1 = document.querySelector('h1');
    if (h1) {
      const s = window.getComputedStyle(h1);
      result.h1 = {
        text: h1.innerText?.trim().substring(0, 120),
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        fontFamily: s.fontFamily,
        color: s.color,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
      };
    }

    const h2 = document.querySelector('h2');
    if (h2) {
      const s = window.getComputedStyle(h2);
      result.h2 = {
        text: h2.innerText?.trim().substring(0, 80),
        fontSize: s.fontSize,
        fontFamily: s.fontFamily,
        fontWeight: s.fontWeight,
        color: s.color,
      };
    }

    const p = document.querySelector('p');
    if (p) {
      const s = window.getComputedStyle(p);
      result.body = {
        fontSize: s.fontSize,
        fontFamily: s.fontFamily,
        fontWeight: s.fontWeight,
        color: s.color,
        lineHeight: s.lineHeight,
      };
    }

    const nav = document.querySelector('nav, header');
    if (nav) {
      const s = window.getComputedStyle(nav);
      result.nav = { bg: s.backgroundColor, color: s.color };
    }

    const allBgs = new Set();
    const allColors = new Set();
    document.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el);
      const bg = s.backgroundColor;
      const col = s.color;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') allBgs.add(bg);
      if (col) allColors.add(col);
    });
    result.uniqueBgs = Array.from(allBgs).slice(0, 25);
    result.uniqueColors = Array.from(allColors).slice(0, 25);

    const logoSelectors = [
      'img[class*="logo"]:not([class*="customer"]):not([class*="client"]):not([class*="partner"])',
      'img[alt*="logo" i]',
      'img[alt*="wordmark" i]',
      '[class*="navbar"] img:first-of-type',
      '[class*="nav"] img:first-of-type',
      'header img:first-of-type',
    ];
    let logoEl = null;
    for (const sel of logoSelectors) {
      logoEl = document.querySelector(sel);
      if (logoEl) break;
    }
    if (logoEl) {
      result.logo = {
        src: logoEl.src,
        alt: logoEl.alt,
        className: logoEl.className,
        naturalWidth: logoEl.naturalWidth,
        naturalHeight: logoEl.naturalHeight,
      };
    }

    result.favicons = Array.from(
      document.querySelectorAll('link[rel*="icon"]')
    ).map(el => ({ rel: el.rel, href: el.href, sizes: el.sizes?.value }));

    return result;
  });

  fs.writeFileSync(jsonOut, JSON.stringify({ url, ...computed }, null, 2));
  console.log(`DONE: ${jsonOut}`);
  await browser.close();
})();
```

**After running, read each JSON file and each screenshot.** The JSON gives exact computed
values. The screenshot visually confirms what those values look like rendered together.

**What to extract from computed styles:**

- `bodyBg`: actual page background color
- `ctaElements` with non-transparent bg: primary and secondary button colors, font family,
  font size, font weight, border radius
- `h1.fontFamily`, `h1.fontSize`, `h1.fontWeight`, `h1.lineHeight`: confirmed headline type
  scale
- `h2`: secondary heading scale
- `body.fontFamily`, `body.fontSize`: confirmed body type
- `uniqueBgs`: full palette audit. Look for the 3-5 values that appear across multiple CTAs
  and surfaces
- `uniqueColors`: text color palette
- `logo.src`: direct CDN URL of the brand logo image. This is the actual logo file. Always
  record it. Check `logo.alt` to confirm it is the brand mark and not a customer or partner
  logo.
- `favicons`: favicon URLs at all sizes. Useful for the mark/icon version of the logo.

**Cross-verify with screenshots.** Open each screenshot. Visually confirm the computed
color values match what you see. If the screenshot shows a purple button and the computed
style says `rgb(80,71,235)`, that is confirmed. If they don't match, computed styles win.

---

### Step 2 — Infer The System From Both Layers

With text+copy from summaries and visual system from computed styles:

- **Colors:** Use computed values only. State exact hex + rgb for every role. Note the
  source as "computed DOM" in the markdown kit.
- **Fonts:** Use computed `fontFamily` values from h1/body. These are the actual rendered
  fonts, not stylesheet declarations.
- **Type scale:** Use computed `fontSize`, `fontWeight`, `lineHeight`. Pixel-exact.
- **Copy and voice:** Extract verbatim from summaries. Quote exact headlines, CTAs,
  testimonials, microcopy.
- **Structure and patterns:** Infer from summaries. Section rhythm, CTA placement, proof
  pattern, hero structure.
- **Anti-patterns:** Derive from what the evidence conspicuously avoids. What words never
  appear? What visual choices are consistent enough to be rules?

For every visual system field, record whether it is "confirmed — computed DOM",
"confirmed — screenshot", or "inferred". Never state a visual value without noting its
source.

---

### Step 3a — Save The Markdown Kit

Path: `/agent/brain/brand-kit/<slug>--brand-kit.md` unless `--save` overrides. `<slug>` is
the brand name lowercased and hyphenated (e.g. `acme--brand-kit.md`).

Header format:

```
# {{Brand}} — Brand Kit
_Last updated: {{ISO date}} · Source: {{pages}} + computed DOM styles + screenshots · Confidence: {{high|medium|low}} for visual system; {{high|medium|low}} for voice_
```

Sections in order:

Identity -> Personality -> Audience -> Competitive context -> Logo -> Color -> Typography
-> Iconography -> Imagery -> Layout & spacing -> Animation -> Voice -> Tone by context ->
Vocabulary -> Headline patterns -> Boilerplate -> Web patterns -> Paid social -> Email ->
Anti-patterns -> Quick-reference JSON -> Gaps.

See `reference-example.md` in this skill's repo folder for the section-by-section template
and expected depth. Match it.

**On re-build of an existing brand kit:** archive the prior version to
`/agent/brain/brand-kit/_history/<slug>/<YYYY-MM-DDTHH-MM-SS>.md` before overwriting the
top-level file. Use `date --iso-8601=seconds` for the archive filename (replace `:` with
`-`). This preserves the changelog of brand-kit revisions as the brand evolves.

---

### Step 3b — Produce The HTML Deliverable

The HTML brand kit is the primary shareable artifact. It is styled using the brand's own
visual system so anyone who opens it can immediately feel whether the inferences are
correct. It embeds the screenshots directly so the source of truth is visible alongside
every inferred value.

**Required sections in the HTML:**

1. **Page hero.** Styled in the brand's own visual system (bg, font, CTA color). Includes
   confidence badges and a correction-note block if any prior values were wrong.
2. **Identity.** Category, tagline, hero headline verbatim, positioning frame.
3. **Audience.** Persona cards, recognized customer brands.
4. **Live screenshots.** All Playwright screenshots embedded as base64. Label each with
   the URL. These are the ground truth.
5. **Color.** Swatches rendered at actual hex values. Each swatch shows: role, hex, rgb,
   usage, source (confirmed/inferred). Include a callout if raw stylesheet extraction
   would have given wrong values.
6. **Typography.** Live specimens rendered at exact computed sizes using the real fonts
   (loaded from Google Fonts or equivalent). Show H1 on light page, H1 on dark page if
   different, body copy. Include a scale table with all computed values.
7. **Components.** Buttons at actual colors and radius, distinctive UI patterns (stat
   blocks, testimonials, input fields, announcement bars), microcopy examples.
8. **Imagery.** Do/don't lists for photography, illustration, product screenshots.
9. **Voice traits.** Do/don't pairs with verbatim examples for each trait.
10. **Headline patterns.** Rendered as actual headlines at appropriate size.
11. **Vocabulary.** Signature words (green chips), banned words (red chips), punctuation
    rules.
12. **Anti-patterns.** Red-accented list, written as actionable prohibitions.
13. **Gaps.** Table of what's still missing and why it matters.

**HTML styling rules:**

- Style the page shell using the brand's actual colors, fonts, and radius values from the
  computed styles. The page should look and feel like the brand.
- Embed screenshots as base64 so the HTML is fully self-contained.
- Use a sticky sidebar nav for section jumping.
- For each computed value, label it `Confirmed - computed DOM` or `Inferred`.
- Dark page specimens (if the brand has a dark variant) shown in dark-bg wrapper blocks.

**Base64-embed the screenshots** (write to `./workdir/`, never `/tmp/`):

```bash
base64 -w 0 ./workdir/brand-kit-<slug>-<page>.png > ./workdir/<page>_b64.txt
```

Then read the file and interpolate into the `<img src="data:image/png;base64,...">` tag.

Save the HTML to `./artifacts/<slug>--brand-kit.html`. Hand it back using a `file` link
widget.

---

### Step 4 — Save, Index, Hand Off

1. **Archive** any existing markdown kit at the target path to
   `/agent/brain/brand-kit/_history/<slug>/<archived-iso>.md` before overwriting.

2. **Write** the new markdown kit to `/agent/brain/brand-kit/<slug>--brand-kit.md`.

3. **Update `/agent/brain/brand-kit/_index.md`** with one row per brand. Latest-updated
   first.

   Row format:

   ```
   - {{Brand}} — `<slug>` — last updated {{ISO date}}
     - Source: {{landing pages used}} + computed DOM + screenshots
     - Confidence: {{level}}
     - Markdown: /agent/brain/brand-kit/<slug>--brand-kit.md
     - HTML: ./artifacts/<slug>--brand-kit.html
     - History: /agent/brain/brand-kit/_history/<slug>/
   ```

4. **Update `/agent/INDEX.md`** with one entry per brand. Preserve `created` on update.

   Entry format:

   ```
   - path: /agent/brain/brand-kit/<slug>--brand-kit.md
     aliases: brand kit, brand guide, brand system, <brand name> brand, <brand name> visual system, <brand name> voice, <brand name> guidelines
     note: Complete brand kit for <Brand>. Primary reference for visual system (<primary color> CTA, <accent>, <bg> bg, <font> font), voice (<one-liner>), positioning, ICP, headline patterns, anti-patterns, downstream-agent quick-ref JSON. Source: <pages> + computed DOM + screenshots. Confidence: <level>. History: /agent/brain/brand-kit/_history/<slug>/.
     created: <first-build date>
     updated: <latest-build date>
   ```

5. **Return a 5-line readout:**
   1. **Brand:** name + category + positioning one-liner
   2. **Look:** palette intent + type register in one sentence
   3. **Sound:** voice in one sentence
   4. **Strongest asset:** the single most distinctive thing (color, phrase, motif)
   5. **Top gap:** the one missing input that would most improve the kit

6. **Hand off the HTML** using the file link widget.

---

### Step 4.5 — Ensure Brand-Kit Usage Instruction In `/agent/user.md`

A brand kit only earns its value when future branded outputs actually apply it. After a
successful build, ensure `/agent/user.md` carries the standing instruction to consult the
brand-kit library whenever Runneth generates branded work.

This runs on **every** brand-kit build (first or otherwise), but the append is idempotent.
The snippet is guarded by sentinel HTML comments so it cannot be added twice.

**Check first:**

```bash
grep -q 'runneth-apps:brand-kit:usage v1' /agent/user.md 2>/dev/null && echo "already-installed" || echo "needs-install"
```

**If `needs-install`**, append the following block verbatim to `/agent/user.md`. Create the
file if it does not exist. Do not modify or replace any existing user.md content. Append
only.

```markdown

<!-- runneth-apps:brand-kit:usage v1 -->
## Brand kit usage

When generating any branded output (HTML pages, landing pages, decks, social posts, emails, ad concepts, briefs, one-pagers, dashboards, internal docs styled for a client), first check `/agent/brain/brand-kit/_index.md` for an applicable brand kit. If one exists for the target brand, read the markdown source and apply:

- Visual system: colors (computed-DOM values only), typography, components, border radius, spacing rhythm
- Voice: register, sentence length, signature words, headline patterns
- Anti-patterns: words and visual choices to avoid

Brand kit selection:
1. Use the brand explicitly named in the request.
2. If none named, use the default workspace's brand.
3. If still ambiguous, ask once before generating.

If no brand kit exists for the target brand and the output is brand-sensitive, mention the gap once and offer to build one via the `brand-kit` skill. Do not invent brand guidelines.

The brand kit overrides generic design-system defaults for that brand's outputs. Motion's HTML design system is the fallback when no brand kit applies.
<!-- /runneth-apps:brand-kit:usage v1 -->
```

**After installing the snippet** (only on the install turn, not on subsequent re-builds),
mention to the user in one sentence that future branded outputs will auto-consult the
brand-kit library.

If a future version of this skill ships a `v2` snippet, treat the v1 sentinel as obsolete:
remove the v1 block (start sentinel to end sentinel) and append the v2 block. Do not edit
in place.

---

## Rules

- **Computed DOM styles, not raw stylesheet variables.** Single most important rule.
  Webflow, Framer, and similar frameworks pollute their stylesheets with template defaults.
  Always extract computed styles from the live DOM.
- **Screenshots verify, computed styles source.** Screenshots confirm the visual system is
  correct. Computed styles provide the exact values. You need both.
- **Always invoke `landing-page-summary` fresh.** Do not read a saved summary directly. If
  the summary is older than this conversation, it is presumed stale and must be re-fetched.
- **Archive on re-build.** Move the previous markdown kit to the per-brand history folder
  before overwriting. The history folder is the brand-kit changelog.
- **Evidence over invention.** If you don't have the evidence, mark it as a gap. Don't
  invent personality.
- **Quote real copy.** Use verbatim headlines, CTAs, and testimonials. Paraphrasing is the
  failure mode.
- **Be specific.** "Modern, premium, technical" is useless. "Premium like Linear, technical
  like Stripe, never corporate like IBM" is useful.
- **Anti-patterns are load-bearing.** Most off-brand work comes from missing don'ts. Spend
  disproportionate attention on Never-do.
- **One source of truth.** The current markdown kit at the canonical path is authoritative.
- **Brand kit must be active, not inert.** Every successful build ensures the user.md usage
  snippet is present so future branded outputs auto-consult the kit. Idempotent. Guarded by
  the `runneth-apps:brand-kit:usage v1` sentinel.
- **Honor confidence.** If the source was a single landing page, confidence is at most
  `medium`. Mark it in the header.
- **Don't critique the brand.** This is a kit, not a CRO audit.
- **Scripts go in `./workdir/`.** Never `/tmp/`. The sandbox does not allow writes there.
- **The HTML is the deliverable.** The markdown kit is the durable source of truth. The
  HTML is what gets shared. Always produce both.
