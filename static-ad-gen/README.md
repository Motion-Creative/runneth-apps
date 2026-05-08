# Static Ad Generator

Generate production-ready static ads from chat — brief, Gemini-refined image prompt, NB2 image, and ad name — for any product in your catalog. One conversation, start to finish, with a mandatory review gate before anything generates.

**Install time:** ~15 minutes (app build + per-product setup)
**Requirements:** Gemini API key, Nano Banana API key, Motion workspace

---

## What this enables

Say "generate an ad for [product]" in chat. Runneth pulls performance data and learnings for that product, applies the creative strategy framework to derive a persona, messaging angle, and hook, builds a structured brief, and surfaces it for review. On approval, it calls Gemini to refine the brief into a production-grade NB2 prompt (using your uploaded product reference images as ground truth), submits to NB2 for generation, polls until complete, downloads the image, builds the production ad name, and appends a learning entry — all without leaving chat.

New products can be added at any time by re-invoking the setup skill.

---

## Setup steps

Run these in order after the install protocol completes file copies.

### 1. Create and build the image server

The install protocol runs these automatically via `post-install`. If running manually:

```bash
app create nb-image-gen
app build nb-image-gen
app verify nb-image-gen
```

Note: `app create` must run before `app build`. The source files are already in place from the install step — `app create` registers the container without overwriting them.

### 2. Get the app URL

```bash
app list
```

Find the `nb-image-gen` route and note the full public URL (e.g. `https://abc123.app.runneth.com`). The setup skill will ask for this.

### 3. Run the setup skill

Say: **"set up static ad generator"**

The setup skill will walk through:
1. API keys (GEMINI_API_KEY and NANO_BANANA_API_KEY)
2. Workspace ID auto-detection
3. Brand name, code, and slug
4. App host confirmation
5. Per-product setup: product details, reference image upload, Gemini spec extraction, confirmation

---

## What this creates

After install and setup, the following will exist in the sandbox:

```
/agent/.agents/skills/
  generate-ad/SKILL.md
  setup-static-ad-generator/SKILL.md

/agent/brain/skills/
  creative-strategy-engine.md
  hook-tactics.md
  hook-writing.md
  visual-formats.md
  creative-mechanics.md

/agent/brain/{{BRAND_SLUG}}/
  _config.json                              — brand config (workspace, app host, codes)
  naming/
    concept-registry.json                   — maps concept names to identifiers
    creator-registry.json                   — maps creator names to identifiers
  products/
    {product_slug}.json                     — one per product
    _template.json                          — template for new products
  learnings/
    {product_slug}.json                     — one per product, appended by generation
    _template.json
  adgen/
    {product_slug}/
      _meta.json                            — GADV counter (next_gadv_num)
      product-spec.md                       — Gemini-extracted source of truth spec
      reference-images/
        01-hero.jpg ... (your uploads)
        public-urls.json                    — NB2-ready public URLs
      gen-briefs/
        YYYYMMDD-{slug}.json                — one per generation session
      gen-runs/
        YYYYMMDD-{slug}/
          nb2-prompt.md
          output-1.jpg

/agent/apps/nb-image-gen/
  (image server — reference image CDN)
```

---

## What to customize

| Token | Required | Default | What it controls |
|---|---|---|---|
| `{{BRAND_NAME}}` | Yes | — | Display name shown in briefs and chat |
| `{{BRAND_CODE}}` | Yes | — | One or two letters in ad names, e.g. `b-A` |
| `{{BRAND_SLUG}}` | Yes | — | File path root, e.g. `/agent/brain/acme-co/` |
| `{{WORKSPACE_ID}}` | Yes | — | Motion workspace for performance data pulls |
| `{{APP_HOST}}` | Yes | — | Public host of the nb-image-gen app for NB2 image URLs |
| `{{DEFAULT_ASPECT_RATIO}}` | No | `1:1` | Default aspect ratio for generation |
| `{{DEFAULT_RESOLUTION}}` | No | `2K` | Default resolution passed to NB2 |

All required tokens are set by the setup skill — you do not need to fill them in manually.

**Note on `{{BRAND_SLUG}}`:** The install protocol must substitute this token in `dest` paths before copying brain seed files. If your install protocol does not support token substitution in `dest` paths, the setup skill handles this instead — it copies seed templates from the neutral staging path `/agent/brain/_seeds/static-ad-generator/` into the correct brand path.

**Note on `{{APP_HOST}}`:** This is written into `public-urls.json` for each product during setup. If the app is rebuilt or the sandbox is restarted and the host changes, re-run the setup skill for affected products to refresh the public URL registry.

---

## How Runneth uses this

### Trigger phrases
- "generate an ad for [product]"
- "make me a static for [product]"
- "build an ad for [product]"

### What Runneth reads per generation
1. `/agent/brain/{{BRAND_SLUG}}/_config.json` — workspace ID, app host, brand code
2. `motion workspace-goal` + `motion spend-threshold` — preferred metric and threshold
3. `motion creative-insights` — last 30 days, filtered to product + image format
4. `/agent/brain/{{BRAND_SLUG}}/products/{product}.json` — claims, ingredients, filter strings
5. `/agent/brain/{{BRAND_SLUG}}/learnings/{product}.json` — active HIGH/MEDIUM learnings
6. `/agent/brain/{{BRAND_SLUG}}/adgen/{product}/product-spec.md` — reference lock
7. `/agent/brain/skills/creative-strategy-engine.md` + hook/format/mechanic skills
8. `/agent/brain/{{BRAND_SLUG}}/adgen/{product}/reference-images/public-urls.json` — NB2 image URLs

### What Runneth writes per generation
- `/agent/brain/{{BRAND_SLUG}}/adgen/{product}/gen-briefs/YYYYMMDD-{slug}.json` — brief record
- `/agent/brain/{{BRAND_SLUG}}/adgen/{product}/gen-runs/YYYYMMDD-{slug}/nb2-prompt.md` — refined prompt
- `/agent/brain/{{BRAND_SLUG}}/adgen/{product}/gen-runs/YYYYMMDD-{slug}/output-1.jpg` — generated image
- `/agent/brain/{{BRAND_SLUG}}/learnings/{product}.json` — appends one ANECDOTAL learning entry
- `/agent/brain/{{BRAND_SLUG}}/naming/concept-registry.json` — registers new concept if net-new

### Key API endpoints (image server)

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check — returns `{ ok: true }` |
| GET | `/api/ref-images/:brand/:product/:filename` | Serves a reference image for NB2 imageUrls |

All other API calls (Gemini, NB2 submit, NB2 poll) go direct from Runneth via `secure-fetch` — not through the app server. The app server is a CDN only.

---

## Agent shell notes

- **NB2 poll must use regex extraction**, not `JSON.parse`. The poll response includes the full prompt text in `paramJson`, making the body too large to parse cleanly. Always use `--max-response-bytes 20000` and extract `successFlag` and `resultImageUrl` with regex.
- **NB2 imageUrls must be publicly accessible**. They come from `public-urls.json` which points to the nb-image-gen app's `/api/ref-images/...` endpoint. If the app goes down, fall back to `imageUrls: []` (text-to-image mode).
- **Gemini inline_data images**: base64-encoded reference images are included in the Gemini prompt refinement call to improve product fidelity. If the call fails due to payload size, remove images and rely on the text reference lock alone.
- **Content-Length**: The Fastify server strips `Content-Length` on incoming requests via an `onRequest` hook to prevent body-parser errors from the buildeth proxy layer.

---

## Fallbacks

| Condition | Behavior |
|---|---|
| Fewer than 3 image ads above spend threshold | Notes "no static performance baseline" and proceeds with product file + learnings only |
| No learnings yet for a product | Skips the learnings step, proceeds with product file and performance data |
| NB2 generation fails | Retries once. If still fails, surfaces the error and stops. |
| NB2 imageUrls unreachable | Falls back to `imageUrls: []` — text-to-image using the reference lock prompt |
| Gemini model not found | Lists available models and picks the best available `generateContent` model |
| No product-spec.md | Stops immediately and directs to setup skill |

---

## Ongoing maintenance

- **Add a product**: say "add a product to the ad generator" — runs setup from Step 5
- **Update a product spec**: re-run setup for that product and confirm the new Gemini extraction
- **Learning logs**: accumulate automatically with each generation. After ~5 generations per product, review the logs and promote high-confidence entries manually

---

## Version history

| Version | Date | Notes |
|---|---|---|
| 1.0.0 | 2026-05-07 | Initial release |
