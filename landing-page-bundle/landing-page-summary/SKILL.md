---
name: landing-page-summary
description: >
  Exhaustively extract a landing page into a structured spec dense enough that another agent
  could nearly recreate the page from the summary alone. Every section, every link, every
  image, every CTA, every component, the full design system, and the full voice. Uses a
  headless Playwright browser to handle JS-rendered pages, redirects, and gated content that
  WebFetch alone cannot reach. Output is consumed by brand-kit and optimize-landing-page,
  but can be run standalone. Always re-fetches by default; archives prior versions as an
  in-system changelog. Use when the user asks to "summarize this landing page", "extract
  from this URL", "break this page down", "give me a landing page spec", "deep-dive this
  page", or pastes a URL with "what's on this".
argument-hint: "<URL> [--depth quick|standard|exhaustive] [--use-cached]"
---

# Landing Page Summary

Produce a recreation-quality spec of a landing page. The goal: a downstream agent (brand-kit,
optimize-landing-page, a regenerator, a competitor-analyst) can read this spec and have a
faithful mental model of the page without ever opening the URL.

**This skill describes. It does not critique, recommend, or score.** Critique is
`optimize-landing-page`'s job. Brand system inference is `brand-kit`'s job. This skill is the
shared upstream.

**Output contract:** the H2 anchors in Phase 3 are a stable contract. Downstream skills depend
on those exact section names. See `DATA-CONTRACT.md` in this skill's repo folder for the full
contract before changing section names.

---

## Inputs

- **URL** (required). The page to summarize.
- **`--depth`**:
  - `quick`: meta + hero + section titles + primary CTAs + footer (5-min read).
  - `standard` (default): everything below except the deepest link/media catalogs.
  - `exhaustive`: every link, every image, every component, every observable interaction.
- **`--use-cached`**: skip re-fetch even if a saved summary exists. **Off by default.**
  Only honour this when the user explicitly passes it or explicitly says they want the cached
  version. Without this flag, always re-fetch.

If URL is missing, ask in chat. Do not ask about depth. Default to `standard`.

---

## Freshness And Changelog

**Default behaviour is always re-fetch.** Saved summaries go stale the moment the page changes.
A stale summary will silently corrupt downstream brand kits and CRO audits, so this skill
treats every invocation as fresh by default.

**On every fetch:**

1. Compute the target path: `/agent/brain/landing-pages/<slug>--<domain>.md`.
2. If a file already exists at that path **and** `--use-cached` was not passed:
   1. Read its `_Fetched:` timestamp from line 2.
   2. Archive the existing file to
      `/agent/brain/landing-pages/_history/<slug>--<domain>/<fetched-timestamp>.md`
      using the existing `_Fetched:` value as the filename (ISO-8601 with `:` replaced by `-`).
      Create the directory if it does not exist.
   3. Proceed with a fresh fetch and overwrite the top-level file.
3. If `--use-cached` was passed and the file exists, skip Phases 1 and 2 and return the
   existing path with a clear note that the cached version was used.
4. If no file exists, proceed normally and skip the archive step.

The per-page `_history/<slug>--<domain>/` folder is the in-system changelog for that page.
Filenames are the `_Fetched:` ISO timestamp of the archived version, so newest sorts last.

**Downstream skill rule:** `brand-kit` and `optimize-landing-page` must never read a summary
they did not trigger this conversation. If they need a summary, they invoke this skill first.
That guarantees freshness without per-summary age checks.

---

## Runtime Notes

- Use `TodoWrite` to track phases when running a full standard or exhaustive summary.
- Write all intermediate and output files to `./workdir/`. **Never** write scripts or any
  other files to `/tmp/`. The sandbox does not allow writes there.
- Save the finished summary to `/agent/brain/landing-pages/<slug>--<domain>.md` for durable
  reuse, or leave it in `./workdir/lp_summary_<slug>.md` when this skill is running as a
  sub-step and the summary is only needed for the current turn.
- When running as a sub-step, do not update `/agent/brain/landing-pages/_index.md` or
  `/agent/INDEX.md` unless the user explicitly wants the summary saved.
- **Forms are a critical audit surface.** Section 8 is required output whenever any form is
  found. Inline, popup, or embedded. Missing field counts and hidden fields are the most
  common CRO audit gaps.

---

## Phase 0 — Playwright Bootstrap

Run this once per fresh sandbox. It is idempotent. Safe to re-run.

```bash
# 1. Install Playwright if missing (idempotent)
node -e "require.resolve('playwright')" 2>/dev/null || npm install -g playwright

# 2. Install the Chromium browser binary if missing
ls ~/.cache/ms-playwright/ 2>/dev/null | grep -q chromium || npx playwright install chromium

# 3. Resolve NODE_PATH dynamically. Print and export it.
PW_NODE_PATH="$(node -e "console.log(require('path').dirname(require('path').dirname(require.resolve('playwright'))))")"
echo "NODE_PATH=$PW_NODE_PATH"
export NODE_PATH="$PW_NODE_PATH"
```

Use the printed `NODE_PATH` value for every subsequent `node` invocation in this skill. Do
**not** hardcode any path. The `_npx/<hash>` cache directory changes per sandbox.

---

## Phase 1 — Fetch The Page

### 1a. Main browser fetch (Playwright)

Write the extraction script to `./workdir/lp_fetch_<slug>.js` and run it. The script does
everything in one pass: network interception, page load, screenshots, form extraction, DOM
extraction, JSON output.

**Critical ordering within the script:**

1. Set up network listeners before `page.goto()`. Interception must be registered first.
2. Take all screenshots before any DOM mutation. The body-text extraction step removes
   `<style>` and `<script>` tags.
3. Compute `slug` at the top so it is available for screenshot filenames.

```javascript
const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

(async () => {
  const url = process.argv[2];
  const slug = url.replace(/https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').substring(0, 60);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
               '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Network interception. Capture HubSpot form embed URLs so we can fetch field definitions
  // directly. HubSpot renders forms inside sandboxed iframes with no src attribute, making
  // them invisible to DOM extraction. The embed JSON endpoint is the only reliable path.
  const hsFormUrls = [];
  page.on('request', req => {
    const u = req.url();
    if (u.includes('forms.hsforms.com/embed/v3/form') || u.includes('hsforms.com/forms/v2')) {
      hsFormUrls.push(u);
    }
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(3000);

  const finalUrl = page.url();
  const title    = await page.title();

  const meta = await page.evaluate(() => {
    const get = (sel, attr = 'content') => {
      const el = document.querySelector(sel);
      return el ? (el.getAttribute(attr) || el.textContent) : null;
    };
    return {
      description:    get('meta[name="description"]'),
      ogTitle:        get('meta[property="og:title"]'),
      ogDesc:         get('meta[property="og:description"]'),
      ogImage:        get('meta[property="og:image"]'),
      canonical:      get('link[rel="canonical"]', 'href'),
      lang:           document.documentElement.lang || null,
      robots:         get('meta[name="robots"]'),
      structuredData: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
                         .map(s => { try { return JSON.parse(s.textContent); } catch(e) { return null; } })
                         .filter(Boolean),
    };
  });

  const nav = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('nav a, header a').forEach(a => {
      items.push({
        label: a.innerText.trim(),
        href:  a.href,
        isCta: /cta|btn|button/.test(a.className),
      });
    });
    const bar = document.querySelector('[class*="announcement"],[class*="banner"],[class*="promo"]');
    return {
      items: items.filter((v, i, a) => a.findIndex(t => t.href === v.href) === i).slice(0, 30),
      announcementBar: bar ? bar.innerText.trim() : null,
    };
  });

  // Nav dropdown hover drill. Before DOM mutation.
  const ts = Date.now();
  const navItems = await page.evaluate(() => {
    const seen = new Set();
    return Array.from(document.querySelectorAll('nav a, nav button, header a, header button'))
      .map(el => {
        const r = el.getBoundingClientRect();
        return { text: el.innerText.trim(), x: r.x + r.width / 2, y: r.y + r.height / 2,
                 visible: r.width > 0 && r.height > 0 };
      })
      .filter(el => el.visible && el.text.length > 0 && el.y < 80)
      .filter(el => { const k = el.text; if (seen.has(k)) return false; seen.add(k); return true; });
  });
  for (const item of navItems) {
    await page.mouse.move(item.x, item.y);
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `./workdir/lp_nav_${slug}_${item.text.replace(/[^a-z0-9]/gi,'_').substring(0,20)}_${ts}.png`,
      fullPage: false,
    });
    await page.mouse.move(720, 600);
    await page.waitForTimeout(300);
  }

  const headings = await page.evaluate(() =>
    Array.from(document.querySelectorAll('h1,h2,h3,h4')).slice(0, 40)
      .map(h => ({ tag: h.tagName, text: h.innerText.trim() }))
      .filter(h => h.text.length > 0)
  );

  const ctas = await page.evaluate(() =>
    Array.from(document.querySelectorAll(
      'a[class*="btn"],a[class*="cta"],a[class*="button"],button,[role="button"]'
    ))
      .map(el => ({ text: el.innerText.trim(), href: el.href || null, tag: el.tagName }))
      .filter(el => el.text.length > 1 && el.text.length < 80)
      .filter((v, i, a) => a.findIndex(t => t.text === v.text) === i)
      .slice(0, 20)
  );

  const inlineForms = await page.evaluate(() =>
    Array.from(document.querySelectorAll('form')).map(form => ({
      location: 'inline',
      action: form.action,
      method: form.method || 'get',
      submit: (form.querySelector('[type="submit"], button') || {}).innerText?.trim(),
      visibleFieldCount: form.querySelectorAll('input:not([type="hidden"]), select, textarea').length,
      fields: Array.from(form.querySelectorAll('input, select, textarea')).map(f => ({
        label:       (document.querySelector(`label[for="${f.id}"]`) || {}).innerText?.trim()
                     || f.getAttribute('aria-label') || f.placeholder || f.name || f.type,
        type:        f.type || f.tagName.toLowerCase(),
        name:        f.name,
        required:    f.required,
        placeholder: f.placeholder,
        hidden:      f.type === 'hidden',
      })),
      privacy: (() => {
        const p = form.querySelector('[class*="privacy"],[class*="consent"],[class*="terms"],[class*="gdpr"]');
        return p ? p.innerText.trim().substring(0, 300) : null;
      })(),
    }))
  );

  const hsIframeEls = await page.evaluate(() =>
    Array.from(document.querySelectorAll('iframe.hs-form-iframe,[id^="hs-form-iframe"]')).map(f => ({
      id: f.id, width: f.width, height: f.height,
    }))
  );
  const hsForms = [];
  const seenHsUrls = new Set();
  for (const hsUrl of hsFormUrls) {
    const baseUrl = hsUrl.split('?')[0];
    if (seenHsUrls.has(baseUrl)) continue;
    seenHsUrls.add(baseUrl);
    try {
      const raw = await fetchUrl(hsUrl);
      const data = JSON.parse(raw);
      const form = data.form || {};
      const visibleFields = [];
      const hiddenFields  = [];
      for (const group of (form.formFieldGroups || [])) {
        for (const field of (group.fields || [])) {
          const entry = {
            name:        field.name,
            label:       field.label?.replace(/<[^>]+>/g, '').trim() || field.name,
            type:        field.fieldType,
            required:    field.required,
            placeholder: field.placeholder || null,
            hidden:      field.hidden,
            defaultValue: field.defaultValue || null,
            options:     field.options?.map(o => o.label) || [],
          };
          (field.hidden ? hiddenFields : visibleFields).push(entry);
        }
        if (group.richText?.content) {
          visibleFields.push({
            name: '__richText', label: group.richText.content.replace(/<[^>]+>/g, '').trim(),
            type: 'richText', required: false, hidden: false,
          });
        }
      }
      hsForms.push({
        location:          `HubSpot embed (hs-form-iframe) - ${hsIframeEls.length} instance(s) on page`,
        portalId:          form.portalId,
        guid:              form.guid,
        submitText:        form.submitText,
        inlineMessage:     form.inlineMessage?.replace(/<[^>]+>/g, '').trim() || null,
        redirectUrl:       form.redirectUrl || null,
        thankYouType:      form.redirectUrl ? 'redirect' : 'inline-message',
        visibleFieldCount: visibleFields.filter(f => f.type !== 'richText').length,
        hiddenFieldCount:  hiddenFields.length,
        visibleFields,
        hiddenFields,
        captchaEnabled:    form.captchaEnabled,
      });
    } catch(e) {
      hsForms.push({ location: 'HubSpot embed', url: hsUrl, error: e.message });
    }
  }

  const tech = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]')).map(s => s.src);
    const detect  = patterns => patterns.some(p => scripts.some(s => s.includes(p)));
    const bodyHtml = document.documentElement.innerHTML;
    const hasExitIntent = detect(['exit-intent','exitintent','ouibounce','picreel','sleeknote']) ||
      bodyHtml.includes('mouseleave') || bodyHtml.includes('mouseout');
    return {
      nextjs:        detect(['_next/']),
      webflow:       detect(['webflow']),
      framer:        detect(['framer']),
      wordpress:     detect(['wp-content','wp-includes']),
      shopify:       detect(['cdn.shopify']),
      ga:            detect(['gtag','google-analytics','analytics.js']),
      metaPixel:     detect(['connect.facebook','fbevents']),
      tiktokPixel:   detect(['analytics.tiktok']),
      intercom:      detect(['intercom']),
      drift:         detect(['drift']),
      hubspot:       detect(['js.hs-scripts','hubspot','js.hsforms']),
      calendly:      detect(['calendly']),
      chilipiper:    detect(['chilipiper']),
      hasExitIntent,
      scripts:       scripts.slice(0, 20),
    };
  });

  // Visual system. Raw stylesheet extraction. Unreliable for brand work. See § 12 note.
  const styles = await page.evaluate(() => {
    const colors = new Set(), fonts = new Set(), radii = new Set();
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          Array.from(sheet.cssRules || []).forEach(rule => {
            const t = rule.cssText || '';
            (t.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsl\([^)]+\)/g) || []).forEach(c => colors.add(c));
            (t.match(/font-family:\s*([^;]+)/g) || []).forEach(f => fonts.add(f));
            (t.match(/border-radius:\s*([^;]+)/g) || []).forEach(r => radii.add(r));
          });
        } catch(e) {}
      });
    } catch(e) {}
    return {
      colors: Array.from(colors).slice(0, 30),
      fonts:  Array.from(fonts).slice(0, 10),
      radii:  Array.from(radii).slice(0, 10),
    };
  });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `./workdir/lp_hero_${slug}_${ts}.png`, fullPage: false });
  for (const pct of [25, 50, 75, 100]) {
    await page.evaluate(p => window.scrollTo(0, document.body.scrollHeight * p / 100), pct);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `./workdir/lp_scroll${pct}_${slug}_${ts}.png`, fullPage: false });
  }
  await page.evaluate(() => window.scrollTo(0, 0));

  let exitPopupForms = [];
  if (inlineForms.length === 0 && hsForms.length === 0) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.mouse.move(640, 200);
    await page.waitForTimeout(300);
    await page.mouse.move(640, 1);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `./workdir/lp_exit_popup_${slug}_${ts}.png`, fullPage: false });
    exitPopupForms = await page.evaluate(() => {
      const results = [];
      const seen = new Set();
      document.querySelectorAll(
        'form,[class*="modal"],[class*="popup"],[class*="overlay"],[class*="lightbox"],[role="dialog"]'
      ).forEach(el => {
        if (seen.has(el)) return; seen.add(el);
        const r = el.getBoundingClientRect();
        const s = window.getComputedStyle(el);
        if (r.width < 50 || r.height < 50) return;
        if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return;
        const fields = Array.from(el.querySelectorAll('input, select, textarea')).map(f => ({
          label:    f.getAttribute('aria-label') || f.placeholder || f.name || f.type,
          type:     f.type || f.tagName.toLowerCase(),
          required: f.required,
          hidden:   f.type === 'hidden',
        }));
        if (fields.length === 0) return;
        results.push({
          location: 'exit-intent popup',
          submit:   (el.querySelector('[type="submit"],button') || {}).innerText?.trim(),
          fields,
          privacy:  (el.querySelector('[class*="privacy"],[class*="consent"],[class*="terms"]') || {})
                    .innerText?.trim()?.substring(0, 200) || null,
        });
      });
      return results;
    });
  }

  // Body text. DOM mutation. Must be last extraction step.
  const bodyText = await page.evaluate(() => {
    ['script','style','noscript','svg'].forEach(t =>
      document.querySelectorAll(t).forEach(el => el.remove())
    );
    return (document.body.innerText || '').replace(/\n{3,}/g, '\n\n').trim().substring(0, 12000);
  });

  await browser.close();

  const outPath = `./workdir/lp_browser_${slug}.json`;
  fs.writeFileSync(outPath, JSON.stringify({
    originalUrl: url, finalUrl, slug, title, meta, nav, headings, ctas,
    forms: { inline: inlineForms, hubspot: hsForms, exitPopup: exitPopupForms },
    bodyText, styles, tech,
  }, null, 2));
  console.log(`DONE:${outPath}`);
})();
```

Write to `./workdir/lp_fetch_<slug>.js`, then run with the dynamic NODE_PATH from Phase 0:

```bash
NODE_PATH="$PW_NODE_PATH" node ./workdir/lp_fetch_<slug>.js "<URL>"
```

Read the output JSON. Then read every screenshot file before writing Sections 2, 3, 12, and 13.

### 1b. Form audit from JSON output

Work through `forms` in this order:

**`forms.hubspot[]`**: if non-empty, these are the authoritative form definitions. Use
`visibleFields`, `hiddenFields`, `submitText`, `thankYouType`, and `redirectUrl` (or
`inlineMessage`) to populate Section 8. Note the number of instances on page separately from
the field count. Hidden fields often reveal lead-source tagging and qualification intent.
Always list them.

**`forms.inline[]`**: standard DOM forms not managed by HubSpot. Use `fields`, `submit`,
`privacy`, and `visibleFieldCount`.

**`forms.exitPopup[]`**: forms that appeared after the exit-intent simulation. Use `fields`
and `submit`. These are not visible to visitors who convert normally.

**If all three are empty:** log Section 8 as a gap and note whether `tech.hasExitIntent` is
true (popup may require real scroll behavior), whether `tech.calendly` or `tech.chilipiper`
is true (booking widget may load post-CTA click), and whether `tech.hubspot` is true with
zero HS form URLs captured (HubSpot may use a different embed path).

### 1c. WebFetch supplemental pass

After the browser fetch, run WebFetch on the same URL with this prompt. Browser gets
JS-rendered content. WebFetch often returns cleaner structured markup for meta, OG, and
canonical. Use both together.

**WebFetch extraction prompt (verbatim):**

> Extract this landing page exhaustively. Preserve verbatim copy. Do not paraphrase.
>
> 1. **Meta:** `<title>`, meta description, OG title/description/image, canonical URL, lang, robots, structured data (JSON-LD).
> 2. **Nav:** every item. Label, link target, dropdown items, sticky behavior, announcement/promo bar copy.
> 3. **Hero:** eyebrow, headline (preserve line breaks), subhead, primary CTA text + href, secondary CTA, microcopy near CTA, trust elements, hero media.
> 4. **Sections in scroll order:** for each section. Eyebrow, headline, subhead, layout type, all body content verbatim, every card or grid item, every stat, every quote, in-section CTAs.
> 5. **Proof:** logo strip (every recognizable brand named), testimonials (full quote + author + role + company + photo flag), case studies, press mentions, awards, certifications.
> 6. **Pricing** (if shown): every tier. Name, price, period, popular flag, full feature list, CTA.
> 7. **FAQ** (if shown): every question + answer verbatim.
> 8. **Footer:** every column group (label + links), social links, legal links, copyright, badges.
> 9. **Every form:** location, every field (label, name, type, required, placeholder, hidden), submit copy, privacy microcopy, visible vs. total field count.
> 10. **Visual system:** font-family, font-size, color values, border-radius values.
> 11. **Interactive behaviors:** modals, accordions, tabs, carousels, cookie banners, live chat, exit-intent signals.
> 12. **Tech fingerprint:** stack, analytics, ad pixels, form providers.
>
> Return structured Markdown. Quote everything verbatim. Write `[gap: <reason>]` where undetermined. Never invent.

### Merge strategy

- Body text, headings, CTAs, forms: prefer browser output (JS-rendered is more complete).
- Meta, OG, canonical, structured data: prefer WebFetch (cleaner HTML parsing).
- Visual system: browser CSS extraction for color/font/radius tokens. WebFetch for additional declarations.
- Tech fingerprint: merge both sources.
- HubSpot form fields: always prefer the `forms.hubspot[]` API data over WebFetch form copy.
- Conflicts: prefer browser output. Note discrepancies in Gaps.

---

## Phase 2 — Voice Pass

Read all body text together. Derive:

- **Register:** formal / casual / technical / playful / clinical / aspirational.
- **Sentence length:** short / medium / long / mixed, with approximate average words/sentence.
- **Headline pattern:** classify hero + subheadings (promise / question / declarative / imperative / outcome-first / problem-first / customer-quote / category-creating).
- **Signature words:** any word appearing 3+ times that is not a product or feature noun.
- **Avoided patterns:** what is conspicuously absent.
- **Reading level estimate:** Flesch-Kincaid grade band, eyeballed.

---

## Phase 3 — Compose The Output

Get the current timestamp before writing:

```bash
date --iso-8601=seconds
```

Write to the resolved output path (see Runtime Notes and Freshness And Changelog above).
Use this structure exactly. The H2 anchors are the data contract.

```markdown
# Landing Page Summary — {{Brand}} ({{URL}})
_Fetched: {{ISO 8601 timestamp with tz offset}} · Depth: {{depth}} · Browser: Playwright (auto-installed) / Chromium_

## TL;DR
- **What:** {{1 line. Category + offer}}
- **Who:** {{audience signal}}
- **Awareness stage targeted:** {{Schwartz stage}}
- **Page intent:** {{homepage / product / pricing / signup / comparison / lead-magnet / event}}
- **Strongest move:** {{the single most distinctive thing about the page}}
- **Most obvious leak:** {{one observable friction. Description only, not prescription}}

## 1. Meta
| Field | Value |
| --- | --- |
| URL | |
| Final URL | |
| Title | |
| Meta description | |
| OG title | |
| OG description | |
| OG image | |
| Canonical | |
| Lang / charset | |
| Robots | |
| Structured data | |

## 2. Nav
- **Position:** · **Sticky:** · **Mobile pattern:**
- **Announcement bar:** "{{copy}}" -> {{link}} *(or: none)*

| Label | Target | Dropdown | Is CTA |
| --- | --- | --- | --- |

## 3. Hero
- **Container:** · **Alignment:**
- **Background:**
- **Eyebrow:** "{{verbatim}}"
- **Headline:** "{{verbatim. Preserve line breaks}}"
- **Subhead:** "{{verbatim}}"
- **Primary CTA:** "{{text}}" -> {{href}} · style: {{filled/outline/text}}
- **Secondary CTA:** "{{text}}" -> {{href}}
- **CTA microcopy:** "{{verbatim or none}}"
- **Above-fold trust elements:**
- **Hero media:** {{image / video / illustration. Description, alt text, dimensions if available}}
- **Below-hero logo strip:** {{every recognizable brand, or none}}

## 4. Sections (in scroll order)

### 4.N {{Section name or eyebrow}}
- **Layout:** · **Background:**
- **Eyebrow:** "{{verbatim}}"
- **Headline:** "{{verbatim}}"
- **Subhead:** "{{verbatim}}"
- **Content blocks:**
  - {{block type: paragraph / bullet / stat / card-grid / quote / video / etc}}: "{{verbatim}}"
- **In-section CTAs:** "{{text}}" -> {{href}}

## 5. Proof
- **Logo strip:** {{list every recognizable brand, or none}}
- **Testimonials:**
  | Quote | Author | Role | Company | Photo | Specific metric? |
  | --- | --- | --- | --- | --- | --- |
- **Case studies:**
  | Customer | Problem | Outcome | Metric | Link |
  | --- | --- | --- | --- | --- |
- **Stats / numbers claimed:** {{verbatim list with context}}
- **Awards / certifications:** {{list or none}}
- **Press / "as seen in":** {{list or none}}

## 6. Pricing *(if present)*
- **Model:** {{subscription / one-time / usage / freemium / custom-quote / none}}
- **Toggle:** {{annual/monthly. Yes/no}}

| Tier | Price | Period | Popular | CTA | Features |
| --- | --- | --- | --- | --- | --- |

## 7. FAQ *(if present)*
**{{Q}}** — {{verbatim answer, truncated past 150 words with [...]}}

## 8. Forms *(required whenever any form is found. Inline, HubSpot embed, or exit-intent)*

### Form @ {{location}}
- **Provider:** {{HubSpot / native / Typeform / etc}}
- **Submit copy:** "{{verbatim}}"
- **Privacy microcopy:** "{{verbatim or none}}"
- **Visible field count:** {{N}}
- **Hidden field count:** {{N}}
- **Thank-you state:** {{redirect to URL / inline message: "{{verbatim}}"}}

| Field | Label | Type | Required | Placeholder / Options | Hidden |
| --- | --- | --- | --- | --- | --- |

**Notes:** Flag multi-step flows, conditional fields, qualification gates (e.g. ad-spend
dropdowns), and instances where the same form GUID appears multiple times on the page. Note
if the thank-you redirect goes to a third-party URL (Notion, Typeform, Calendly) rather than
a branded page. This affects upsell opportunity and pixel firing.

## 9. Footer
- **Logo + tagline:** {{description}}
- **Column groups:**
  - **{{Label}}:** {{links list}}
- **Newsletter signup:** {{copy + field labels or none}}
- **Social links:** {{platform + handle list}}
- **Legal:** {{links}}
- **Copyright:** "{{verbatim}}"
- **Locale switcher:** {{yes/no}}
- **Badges:** {{SOC2 / GDPR / B-Corp / etc or none}}

## 10. Full link catalog *(exhaustive depth only)*
| Text | Href | Type | New tab | Section |
| --- | --- | --- | --- | --- |

## 11. Full media catalog *(exhaustive depth only)*
| Type | URL/path | Alt | Role | Subject | Style | Aspect |
| --- | --- | --- | --- | --- | --- | --- |

## 12. Visual system (observed)

> **Reliability note for downstream consumers:** the color, font, and radius values below are
> extracted from the page's raw stylesheets. Frameworks like Webflow, Framer, and WordPress
> declare every token in their stylesheets (including template defaults and unused variants),
> so these values may include colors and fonts that never render. **Brand work and CRO work
> must verify against computed DOM styles and screenshots before trusting any value here.**
> The `brand-kit` skill does this verification step.

### Color
| Role | Value | Where sampled |
| --- | --- | --- |
| Primary bg | | |
| Primary button | | |
| Accent | | |
| Text primary | | |
| Text muted | | |
| Surface / card | | |

- **Gradients:** {{list with stops or none}}
- **Palette intent:** {{premium / playful / technical / clinical / aspirational}}

### Typography
| Role | Family | Weight | Size | Sample |
| --- | --- | --- | --- | --- |
| H1 | | | | |
| H2 | | | | |
| Body | | | | |
| Button | | | | |
| Eyebrow / label | | | | |

- **Stack source:** {{Google / Adobe / self-hosted / system}}
- **Register:** {{editorial / utilitarian / display-first}}

### Spacing & layout
- **Base unit:** {{4 / 8 px. Inferred}}
- **Container max:** {{px or [gap]}}
- **Section rhythm:** {{estimated vertical px between sections or [gap]}}
- **Grid:** {{columns + gutter or [gap]}}

### Components observed
| Type | Style notes |
| --- | --- |
| Button (primary) | |
| Button (secondary) | |
| Card | |
| Input | |
| Accordion / Tab | |

- **Border radius scale:** {{values or [gap]}}
- **Shadow scale:** {{values or [gap]}}

### Imagery & icons
- **Photo style:** {{studio / lifestyle / UGC / abstract / none}}
- **Illustration style:** {{flat / 3d / hand-drawn / isometric / none}}
- **Icon style:** {{outline / filled / duotone / custom}}
- **Motion observed:** {{scroll-triggered / hover micro / marquee / parallax / none}}

## 13. Voice
- **Register:** {{formal / casual / technical / playful / aspirational}}
- **Sentence length:** {{short / medium / long / mixed. Avg ~X words/sentence}}
- **Headline pattern:** {{type with example}}
- **Signature words:** {{list with approximate frequency}}
- **Avoided patterns:** {{what is conspicuously absent}}
- **Reading level estimate:** {{Flesch-Kincaid grade band}}

## 14. Interactive behaviors
- **Sticky elements:** {{nav / CTA bar / sidebar / none}}
- **Scroll-triggered animations:** {{yes/no + description}}
- **Cookie banner:** "{{copy or none}}"
- **Live chat:** {{Intercom / Drift / Crisp / none}}
- **Exit-intent signal detected:** {{yes/no. Based on tech.hasExitIntent}}
- **Exit-intent popup confirmed:** {{yes / no / not triggered}}
- **Email-capture popup:** {{yes/no}}
- **AB-test tools detected:** {{list or none}}

## 15. Tech fingerprint
- **Stack guess:** {{Next.js / Webflow / Framer / WordPress / Shopify / custom}}
- **Hosting hints:** {{Vercel / Netlify / Cloudflare / etc}}
- **Analytics:** {{GA4 / Mixpanel / Amplitude / PostHog / none detected}}
- **Ad pixels:** {{Meta Pixel / Google Ads / LinkedIn / TikTok / Reddit / etc}}
- **Form providers:** {{HubSpot / Typeform / Calendly / Chili Piper / native / none}}
- **CMS hints:** {{list or none}}
- **Other signals:** {{Intercom / HubSpot / Drift / Segment / etc}}

## 16. Accessibility signals
- **Alt-text coverage:** {{% with alts or [gap]}}
- **Form labels present:** {{yes/no/partial}}
- **Skip-to-content link:** {{yes/no}}
- **ARIA labels observed:** {{description or none}}

## 17. Gaps
| Field | Reason |
| --- | --- |
| {{section.subfield}} | {{why undetermined}} |
```

---

## Phase 4 — Save, Archive, Index

1. **Resolve the output path:**
   - Durable save: `/agent/brain/landing-pages/<slug>--<domain>.md`.
   - Slug rule: lowercase brand-and-purpose with hyphens (e.g. `demo-paid`, `homepage`,
     `hooks-tool`).
   - Domain rule: the hostname of the final URL (e.g. `go.motionapp.com`, `motionapp.com`).
   - Filename never carries a timestamp. The timestamp lives inside the file on the
     `_Fetched:` line.

2. **Archive any existing summary at that path** (see Freshness And Changelog above). Move
   it to `/agent/brain/landing-pages/_history/<slug>--<domain>/<fetched-iso>.md` before
   writing the new file. Create the per-page history directory if it does not exist.

3. **Write the new summary** to the durable path.

4. **Update `/agent/brain/landing-pages/_index.md`** with one row per page. If the page is
   new, add it. If it already exists, update the timestamp and the `Recent fetches`
   inline list. Keep the local index sorted by most-recent fetch.

   Row format:

   ```
   - {{Page name}} — `<slug>--<domain>` — {{URL}}
     - Latest fetch: {{ISO timestamp}}
     - Page intent: {{intent}}
     - Schwartz stage: {{stage}}
     - Form provider: {{HubSpot / native / none}}
     - Purpose: {{one line}}
     - Recent fetches: {{latest}}, {{2nd most recent}}, {{3rd most recent}}
   ```

5. **Update `/agent/INDEX.md`** with one entry per page. Preserve `created` on update.

   Entry format:

   ```
   - path: /agent/brain/landing-pages/<slug>--<domain>.md
     aliases: landing page, lp summary, <brand name> landing page, <brand name> <page intent>, <URL>, <hostname>, <page name>
     note: Landing page summary for <Brand> <page name>. Verbatim copy, hero, sections, forms (Section 8), visual system (raw CSS, verify before brand use), voice. Schwartz stage: <stage>. Page intent: <intent>. Latest fetch: <ISO ts>. History: /agent/brain/landing-pages/_history/<slug>--<domain>/.
     created: <first-fetch date>
     updated: <latest-fetch date>
   ```

   Do not update either index when the output was written to `./workdir/` only.

---

## Phase 5 — Surface Readout

After saving, return exactly 6 lines:

1. **What:** category + one-line offer (verbatim positioning if available)
2. **Who:** primary audience signal
3. **Look:** palette intent + type register in one sentence
4. **Sound:** voice in one sentence
5. **Sell:** primary CTA copy + dominant proof move
6. **Saved:** {{path}} · **Gaps:** {{count}} · **Prior versions:** {{count or "first fetch"}}

---

## Refreshing The Library

There is no scheduled routine. Re-running this skill on a known URL is the refresh: it
re-fetches the page, archives the prior version to
`/agent/brain/landing-pages/_history/<slug>--<domain>/`, and notes material changes against
the newest archived version (hero headline, primary CTA, pricing, form fields, page intent).
Users who want a standing weekly refresh can ask Runneth to set one up themselves.

---

## Rules

- **Always re-fetch by default.** A stale summary is a corrupted downstream brand kit or CRO
  audit. Only honour `--use-cached` when the user explicitly requests it.
- **Archive before overwrite.** Every re-fetch moves the previous version to the per-page
  history folder before writing the new file. The history folder is the changelog.
- **Filenames never carry timestamps.** One stable path per page. The `_Fetched:` line inside
  the file holds the timestamp.
- **Screenshots are not optional.** Do not write Sections 2, 3, 12, or 13 from DOM extraction
  alone. Always take and read hero, scroll-position, nav hover, and exit-intent screenshots
  before authoring those sections. CSS extraction returns design tokens, not the rendered
  palette.
- **Screenshot order matters.** All screenshots must be taken before the body-text extraction
  step, which removes `<style>` tags from the DOM and breaks visual rendering.
- **Never infer nav dropdowns.** Hover each nav item, screenshot, read, then record what is
  visible.
- **Verbatim everything.** Hero copy, testimonials, CTA text, headlines, microcopy. All in
  quotes, exact.
- **Never invent.** If a field is undetermined, write `[gap: <reason>]`.
- **Do not editorialize.** This skill describes only.
- **HubSpot forms:** always use the `forms.hubspot[]` API data, not DOM extraction. The
  `hs-form-iframe` pattern makes HubSpot forms invisible to standard DOM selectors. Network
  interception is the only reliable path.
- **Forms gate:** Section 8 is required output if any of `forms.inline`, `forms.hubspot`, or
  `forms.exitPopup` is non-empty. Always report visible and hidden field counts separately.
  Always note thank-you state type and URL.
- **Timestamp:** get the current time with `date --iso-8601=seconds` in Bash before composing
  the output. The `_Fetched:` line must include a full ISO 8601 timestamp with timezone
  offset.
- **JS-rendered / gated pages:** if both Playwright and WebFetch return mostly empty or
  login-walled content, note it in Gaps and ask the user for screenshots or credentials
  before proceeding.
- **`quick` depth:** sections 1, 3, 4 (titles only), 5 (logo strip + testimonial count), 8
  (always if form exists), 9, 13 only.
- **`exhaustive` depth:** every catalog filled. Every link, every image, every form field.
- **Scripts go in `./workdir/`.** Never write node scripts to `/tmp/`. The sandbox does not
  allow writes there.
- **Section 12 colors are unreliable.** State that explicitly in § 12. Brand-kit and any
  visual-system consumer must re-extract via computed DOM. This is the single most expensive
  mistake to silently propagate.
- **No scheduled routine.** Refresh is on-demand: re-run the skill on a known URL. Do not
  offer to create reminders or recurring routines from this skill.
