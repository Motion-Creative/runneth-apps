```yaml
triggers:
  phrases:
    - "generate an ad"
    - "generate a static"
    - "make me a static"
    - "make an ad"
    - "create an ad for"
    - "build an ad"
    - "make a static for"
    - "generate static ad"
  intent: "User wants to generate a production-ready static ad image for a product in their catalog"
  excludes:
    - "generate a video"
    - "generate a brief"
    - "generate a concept"
```

# generate-ad Skill

Triggered when a user says anything matching: "generate an ad", "make me a static", "create an ad for", "build an ad", "generate a static", or similar intent.

Runs end-to-end from brief to generated image and production-ready ad name, with a mandatory brief review gate before generation fires.

---

## Configuration

Before running, the following must be set up in this sandbox (handled by the setup skill):

- `/agent/brain/{{BRAND_SLUG}}/_config.json` — brand config (workspace ID, app host, brand code)
- `/agent/brain/{{BRAND_SLUG}}/products/{product}.json` — product file with claims, ingredients, ad_name_filter_strings
- `/agent/brain/{{BRAND_SLUG}}/adgen/{product}/product-spec.md` — product reference lock (generated during setup)
- `/agent/brain/{{BRAND_SLUG}}/adgen/{product}/reference-images/` — uploaded product images
- `/agent/brain/{{BRAND_SLUG}}/adgen/{product}/reference-images/public-urls.json` — public CDN URLs
- `/agent/brain/{{BRAND_SLUG}}/adgen/{product}/_meta.json` — GADV counter

Read brand config at the start of every run:
```bash
cat /agent/brain/{{BRAND_SLUG}}/_config.json
```
Extract: `workspace_id`, `app_host`, `brand_code`.

---

## Step 0 — Resolve product and intent

**From the user's message, determine:**

1. **Product** — which product is the ad for?
   - List products by reading `/agent/brain/{{BRAND_SLUG}}/products/` (exclude `_template.json`)
   - Match user's description to a product slug
   - If unclear, ask: "Which product is this for?" and list available products
   - If a product has no `product-spec.md`, surface immediately and stop: "I need a product spec before I can generate for [product]. Run setup to add one."

2. **Intent** — net-new concept or iteration on an existing ad?
   - If user mentions a specific ad or says "iterate", "improve", "test", "riff on" → iteration
   - If "new concept", "fresh", "from scratch", or no prior ad mentioned → net-new
   - If ambiguous, default to net-new and note it

3. **Aspect ratio** — if specified (1:1, 4:5, 9:16), capture it. Default: `{{DEFAULT_ASPECT_RATIO}}`.

Set these before proceeding.

---

## Step 1 — Gather data

**1a. Performance data (statics for this product)**

```bash
motion workspace-goal
motion spend-threshold
motion creative-insights \
  --workspace-id {workspace_id} \
  --date-range last_30d \
  --limit 150 \
  --sort topSpend \
  --summary-sections adDescription \
  --summary-sections hookOrHeadline \
  --include-metrics
```

Read the returned file. Filter to:
- Product's ad name filter strings (from `ad_name_filter_strings` in the product file)
- Format: `image` only
- Spend above threshold from `motion spend-threshold`
- Metrics at `creative.metrics.*`

Extract: `spend`, `roas`, `ctr`, `thumbstop`, `holdRate`

If fewer than 3 image ads above threshold → note "no static performance baseline" and proceed.

**1b. Product context and learnings**

Read:
- `/agent/brain/{{BRAND_SLUG}}/products/{product}.json` — claims, key ingredients, how-to-use, ad_name_filter_strings
- `/agent/brain/{{BRAND_SLUG}}/learnings/{product}.json` — active HIGH/MEDIUM entries
- `/agent/brain/{{BRAND_SLUG}}/adgen/{product}/product-spec.md` — reference locks (Option A/B/C)

---

## Step 2 — Apply creative engine

Read: `/agent/brain/skills/creative-strategy-engine.md`

From the data, identify:
- **Persona**: specific (age range, identity, context), not generic
- **Awareness stage**: match to the 5-stage model
- **Angle**: single strongest messaging angle

Read: `/agent/brain/skills/visual-formats.md`, `/agent/brain/skills/hook-tactics.md`, `/agent/brain/skills/creative-mechanics.md`, `/agent/brain/skills/hook-writing.md`

Select:
- **Visual format**: for static — one-shot, before/after, feature-benefit callout, native text overlay, review format
- **Mechanic**: borrowed enemy, reframe, implied answer, social witness, contrast without comment
- **Hook tactic**: from the tactic library, matched to persona triggers
- **Hook**: one primary hook. For statics, this is the headline.

---

## Step 3 — Build the brief

```
## [Product] — [Visual Format] — [Mechanic]

**Persona:** [1 sentence — specific]
**Angle:** [1 sentence — the core strategic move]
**Funnel stage:** [Awareness / Consideration / Conversion]

**What this ad needs to do:**
[2–3 sentences on the job this creative is doing]

**Hook:**
> "[Primary hook text]"
[1 sentence explaining why this hook for this persona]

**Visual direction:**
[Scene, subject, mood, what's in frame, what's not]
[Reference images to use: specify filenames from reference-images/ folder]
[Reference lock: Option A / B / C]

**Copy on image:**
[Exact lines labeled: headline, subhead, byline, CTA]

**What to avoid:**
[2–3 specific things from product spec negative prompts]

**Performance signals:**
[2–3 bullets from data — or "No static performance baseline yet" if fewer than 3 ads]
```

---

## Step 4 — Save brief and surface for review

**Get the next GADV ID:**

```bash
cat /agent/brain/{{BRAND_SLUG}}/adgen/{product}/_meta.json
```

Use `next_gadv_num`. Format: `GADV-{NNN}` (zero-padded to 3 digits).

**Save the gen-brief JSON:**

Path: `/agent/brain/{{BRAND_SLUG}}/adgen/{product}/gen-briefs/YYYYMMDD-{concept-slug}.json`

```json
{
  "id": "GADV-NNN",
  "date": "YYYY-MM-DD",
  "product": "{product-slug}",
  "brand": "{{BRAND_SLUG}}",
  "intent": "net-new|iteration",
  "source_iter_id": null,
  "persona": "...",
  "angle": "...",
  "mechanic": "...",
  "hook": "...",
  "visual_format": "...",
  "funnel_stage": "...",
  "content_type": "...",
  "content_subtype": "...",
  "hook_type_abbrev": "...",
  "reference_lock": "option-a|option-b|option-c",
  "reference_images": ["filename.jpg"],
  "performance_signals_used": ["..."],
  "aspect_ratio": "{{DEFAULT_ASPECT_RATIO}}",
  "brief_text": "...",
  "status": "draft",
  "nb2_prompt_path": null,
  "generated_image_path": null,
  "ad_name": null,
  "concept_id": null,
  "notes": "",
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

**Show the full brief inline in chat.** Then say:
> "Brief saved as GADV-NNN. Reply **approved** or **go** to generate, or tell me what to change."

**Do not proceed to Step 5 until the user explicitly approves.**

---

## Step 5 — Gemini prompt refinement

On approval: update gen-brief status to `approved`, write back.

Read brand config for `app_host`. Build Gemini text input:

```python
import json, base64

product_spec = open(f'/agent/brain/{{BRAND_SLUG}}/adgen/{product}/product-spec.md').read()

system_prompt = """You are a world-class AI image generation prompt engineer for direct-response advertising.
Produce ONE complete production-ready NB2 image generation prompt using these exact bold headers:
**REFERENCE LOCK**, **SCENE**, **COMPOSITION**, **LIGHTING**, **COLOR**,
**TYPOGRAPHY - PRODUCT LABEL**, **FORMAT**, **TEXT ON IMAGE - RENDER EXACTLY AS WRITTEN**,
**LOGO PLACEMENT**, **NEGATIVE PROMPT**, **OUTPUT**.
Write ONLY the prompt. No preamble or commentary."""

user_text = f"""CREATIVE BRIEF:\n{brief_text}\n\nPRODUCT SPEC (use the {reference_lock} reference lock):\n{product_spec}\n\nTARGET ASPECT RATIO: {aspect_ratio}\nTARGET RESOLUTION: {{DEFAULT_RESOLUTION}}"""

gemini_body = {
    "contents": [{"parts": [{"text": system_prompt + "\n\n---\n\n" + user_text}]}],
    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 4096}
}
```

**Optionally include reference images (improves prompt fidelity):**

```python
ref_parts = []
for img_file in reference_image_files[:2]:
    with open(img_file, 'rb') as f:
        data = base64.b64encode(f.read()).decode()
    ref_parts.append({"inline_data": {"mime_type": "image/jpeg", "data": data}})
gemini_body["contents"][0]["parts"] = ref_parts + [{"text": system_prompt + "..."}]
```

**Call Gemini via secure-fetch:**

```bash
python3 -c "import json; json.dump(body, open('/tmp/gemini_refine_body.json','w'))"

secure-fetch run \
  --url "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  --method POST \
  --secret-key GEMINI_API_KEY \
  --auth-header "x-goog-api-key" \
  --auth-scheme "" \
  --header "Content-Type: application/json" \
  --body "$(cat /tmp/gemini_refine_body.json)" \
  --max-response-bytes 30000
```

Parse: `candidates[0].content.parts[0].text`

**If model returns 404**, list available models:
```bash
secure-fetch run --url "https://generativelanguage.googleapis.com/v1beta/models" \
  --method GET --secret-key GEMINI_API_KEY --auth-header "x-goog-api-key" --auth-scheme "" \
  --max-response-bytes 50000
```

Save the refined prompt to:
```
/agent/brain/{{BRAND_SLUG}}/adgen/{product}/gen-runs/YYYYMMDD-{slug}/nb2-prompt.md
```

Update gen-brief: set `nb2_prompt_path`. Write back.

---

## Step 6 — NB2 generation via secure-fetch

Read `/agent/brain/{{BRAND_SLUG}}/adgen/{product}/reference-images/public-urls.json`.
Select URLs matching the filenames in `reference_images` from the gen-brief.

```bash
NB2_BODY=$(python3 -c "
import json
body = {
    'prompt': open('/tmp/refined_prompt.txt').read(),
    'imageUrls': {reference_image_urls},
    'aspectRatio': '{aspect_ratio}',
    'resolution': '{{DEFAULT_RESOLUTION}}',
    'outputFormat': 'jpg'
}
print(json.dumps(body))
")

secure-fetch run \
  --url "https://api.nanobananaapi.ai/api/v1/nanobanana/generate-2" \
  --method POST \
  --secret-key NANO_BANANA_API_KEY \
  --auth-header "Authorization" \
  --auth-scheme "Bearer" \
  --header "Content-Type: application/json" \
  --body "$NB2_BODY" \
  --max-response-bytes 2048
```

Extract `taskId` from `response.body → JSON.parse → data.taskId`

**Poll until complete — use regex, not JSON.parse (response body includes full prompt):**

```bash
for i in $(seq 1 37); do
  sleep 8
  POLL=$(secure-fetch run \
    --url "https://api.nanobananaapi.ai/api/v1/nanobanana/record-info?taskId=$TASK_ID" \
    --method GET \
    --secret-key NANO_BANANA_API_KEY \
    --auth-header "Authorization" \
    --auth-scheme "Bearer" \
    --max-response-bytes 20000)

  FLAG=$(echo "$POLL" | python3 -c "
import sys, re
m = re.search(r'\"successFlag\":(\d+)', sys.stdin.read())
print(m.group(1) if m else '?')
  ")

  if [ "$FLAG" = "1" ]; then
    RESULT_URL=$(echo "$POLL" | python3 -c "
import sys, re
m = re.search(r'\"resultImageUrl\":\"([^\"]+)\"', sys.stdin.read())
print(m.group(1) if m else '')
    ")
    break
  elif [ "$FLAG" = "2" ] || [ "$FLAG" = "3" ]; then
    echo "Generation failed"; break
  fi
done
```

**Download result:**

```bash
OUTPUT_PATH="/agent/brain/{{BRAND_SLUG}}/adgen/{product}/gen-runs/YYYYMMDD-{slug}/output-1.jpg"
curl -s -L --max-time 30 "$RESULT_URL" -o "$OUTPUT_PATH"
cp "$OUTPUT_PATH" "./artifacts/YYYYMMDD-{product}-{slug}-v1.jpg"
```

---

## Step 7 — Build the ad name

Read `/agent/brain/{{BRAND_SLUG}}/naming/concept-registry.json`.

If the concept name is new, register it: use `next_available_number`, create identifier, append, increment counter, write back.

Assembled ad name format:
```
b-{{BRAND_CODE}}_p-{product_code}_crt-AI_c-NB2_t-I_ct-{ct}_cst-{cst}_cn-{concept_id}_h-{h}_cp-L_v-V1
```

Add size suffix for non-default ratios: `4:5` → `_4x5`, `9:16` → `_9x16`

**Field mapping:**
- `b` = `{{BRAND_CODE}}`
- `p` = product code (from product file)
- `crt` = `AI` (AI Generated)
- `c` = `NB2` (model used)
- `t` = `I` (image)
- `ct` = content_type abbreviation from gen-brief
- `cst` = content_subtype abbreviation
- `cn` = concept identifier from registry
- `h` = hook_type_abbrev from gen-brief
- `cp` = `L` (Launch) for net-new
- `v` = `V1`

If your org uses a different naming convention, apply it here instead.

---

## Step 8 — Write learning entry

Append to `/agent/brain/{{BRAND_SLUG}}/learnings/{product}.json`:

```json
{
  "id": "LRN-{NNN}",
  "dimension": "visual_concept",
  "signal": "[angle] + [mechanic] + [hook_tactic] tested as [visual_format] static",
  "detail": "[1 sentence — what was hypothesised and why]",
  "confidence": "ANECDOTAL",
  "source": "ad_generation",
  "source_detail": "GADV-XXX",
  "image_path": "[generated_image_path]",
  "ad_name": "[ad_name]",
  "status": "active",
  "created_at": "ISO timestamp",
  "last_validated": "ISO timestamp"
}
```

---

## Step 9 — Deliver

Update gen-brief: `status: generated`, `generated_image_path`, `ad_name`, `concept_id`, `updated_at`.
Increment `next_gadv_num` in `_meta.json`.

**Deliver in chat:**
1. Generated image as a file `link` widget (absolute path to artifacts copy)
2. Production-ready ad name in a code block
3. One-line summary: product · hook · visual format · GADV ID

---

## Error handling

| Error | Fix |
|---|---|
| No `product-spec.md` | Stop immediately, direct to setup skill |
| No static performance data | Note it, proceed with learnings only |
| Gemini model 404 | List models via GET /v1beta/models, use first available `generateContent` model |
| NB2 fails (flag 2 or 3) | Retry once. If fails again, note it and stop |
| NB2 poll truncated | Always use `--max-response-bytes 20000` and regex — never JSON.parse the full poll body |
| NB2 imageUrls unreachable | Fall back to `imageUrls: []` (text-to-image) — the reference lock compensates |
