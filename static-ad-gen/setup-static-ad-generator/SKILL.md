```yaml
triggers:
  phrases:
    - "set up static ad generator"
    - "set up static-ad-generator"
    - "personalize static ad generator"
    - "reconfigure static ad generator"
    - "run static ad setup"
    - "add a product to the ad generator"
    - "add reference images"
  intent: "User wants to configure or reconfigure the static ad generator for their sandbox, add a product, or add reference images"
```

# setup-static-ad-generator Skill

One-time (and re-runnable) onboarding for the static ad generator. Walks through four steps in order. Can also be re-invoked to add a new product at any time.

---

## Before starting

Check whether a brand config already exists:

```bash
cat /agent/brain/{{BRAND_SLUG}}/_config.json 2>/dev/null
```

**If it exists:** load the config, show a summary of what's already configured, and ask:
> "Your brand config is already set up (workspace: [id], brand: [name]). Do you want to add a new product, or reconfigure everything from scratch?"

- If adding a product: skip to Step 4.
- If reconfiguring: proceed from Step 1.

**If it does not exist:** proceed from Step 1.

---

## Step 1 — API Keys

Check both required secrets. The generate-ad workflow needs:
- `GEMINI_API_KEY` — for brief refinement into a production NB2 prompt
- `NANO_BANANA_API_KEY` — for NB2 image generation

Tell the user:
> "I need two API keys before we can generate ads. Please don't paste them into chat — I'll collect them securely."

Surface a `secret-input` widget for any missing keys.

Once keys are confirmed available, continue.

---

## Step 2 — Workspace ID

Detect the Motion workspace ID automatically:

```bash
motion workspace-goal
```

Extract the `workspaceId` from the response. Show it to the user and confirm:
> "I found your Motion workspace ID: [id]. Does this look right?"

If the user confirms, save it. If they want a different workspace, ask them to paste the correct ID.

---

## Step 3 — Brand config

Ask three questions, one at a time:

**Question 1:**
> "What's your brand name? (e.g. Acme Co)"

**Question 2:**
> "What one or two-letter code should we use in ad names for this brand? (e.g. A for Acme). This appears in the ad naming convention as `b-{code}`."

**Question 3:**
> "What's a short slug for your brand used in file paths? Lowercase, hyphens only. (e.g. acme-co)"

After all three answers, write the brand config:

```bash
cat > /agent/brain/{brand_slug}/_config.json << 'EOF'
{
  "brand_name": "{brand_name}",
  "brand_code": "{brand_code}",
  "brand_slug": "{brand_slug}",
  "workspace_id": "{workspace_id}",
  "app_host": "",
  "created_at": "{ISO timestamp}",
  "updated_at": "{ISO timestamp}"
}
EOF
```

Also write:

```bash
mkdir -p /agent/brain/{brand_slug}/naming
mkdir -p /agent/brain/{brand_slug}/products
mkdir -p /agent/brain/{brand_slug}/learnings
mkdir -p /agent/brain/{brand_slug}/adgen

# Copy seed templates from staging area
SEED=/agent/brain/_seeds/static-ad-generator
cp $SEED/product-template.json /agent/brain/{brand_slug}/products/_template.json
cp $SEED/learning-log-template.json /agent/brain/{brand_slug}/learnings/_template.json
cp $SEED/concept-registry.json /agent/brain/{brand_slug}/naming/concept-registry.json
cp $SEED/creator-registry.json /agent/brain/{brand_slug}/naming/creator-registry.json
```

Tell the user:
> "Brand config saved. Now I need to confirm the image server URL."

---

## Step 4 — App host

Check the nb-image-gen app URL:

```bash
app list
```

Find the `nb-image-gen` route. The public host is the full URL for that app (e.g. `https://abc123.app.runneth.com`).

If the app is not listed or not ready:
> "The image server isn't running yet. Run `app build nb-image-gen` and then `app verify nb-image-gen` before continuing. Let me know when it's done."
Wait for confirmation, then re-check.

Once confirmed, extract the host and update brand config:

```python
import json
config = json.load(open('/agent/brain/{brand_slug}/_config.json'))
config['app_host'] = '{app_host}'
config['updated_at'] = '{ISO timestamp}'
json.dump(config, open('/agent/brain/{brand_slug}/_config.json', 'w'), indent=2)
```

---

## Step 5 — Product setup (repeat for each product)

Ask:
> "Which products do you want to set up for ad generation? List them one per line, or just name one to start."

For each product, run the following sub-flow:

### 5a — Product name and slug

Ask:
> "What's the full product name? And what short slug should we use in file paths? (e.g. tattoo-frost)"

Create the product adgen directory:
```bash
mkdir -p /agent/brain/{brand_slug}/adgen/{product_slug}/reference-images
mkdir -p /agent/brain/{brand_slug}/adgen/{product_slug}/gen-briefs
mkdir -p /agent/brain/{brand_slug}/adgen/{product_slug}/gen-runs
```

Write `_meta.json`:
```json
{
  "product": "{product_slug}",
  "next_gadv_num": 1,
  "created_at": "{ISO timestamp}"
}
```

### 5b — Product details

Ask:
> "Tell me about [product]. You can paste from your product page, PDP copy doc, or just describe it. I need: what it does, key ingredients or features, and how it's used."

After they provide this, write a product file at `/agent/brain/{brand_slug}/products/{product_slug}.json`:

```json
{
  "product_name": "{product_name}",
  "product_slug": "{product_slug}",
  "product_code": "",
  "brand": "{brand_slug}",
  "description": "{description}",
  "key_ingredients_or_features": [],
  "claims": [],
  "how_to_use": [],
  "ad_name_filter_strings": ["{product_slug}", "{product_name}"],
  "price_usd": null,
  "notes": "",
  "updated_at": "{ISO timestamp}"
}
```

Tell them:
> "Got it. One more thing — what's the product code abbreviation for ad naming? (e.g. TF for Tattoo Frost). If you don't have a naming convention yet, just say 'skip' and we'll fill this in later."

Update the `product_code` field if they provide one.

### 5c — Reference image upload

Ask:
> "Now upload your product reference images for [product]. Drag and drop them into chat — up to 5 images work best (product hero, open/detail, lifestyle, texture, packaging). More than 5 is fine but I'll use the first 5 for spec extraction."

Wait for the user to upload. Check `ls ./uploads/` once they say they're done. List the uploaded files.

Ask:
> "Here's what I see: [list files]. Are all of these for [product], or should I exclude any?"

Move confirmed images to the product reference-images folder:
```bash
cp ./uploads/{filename} /agent/brain/{brand_slug}/adgen/{product_slug}/reference-images/{01-slug-name.jpg}
```

Name files sequentially with a short descriptive slug: `01-hero.jpg`, `02-open-product.jpg`, `03-lifestyle.jpg`, etc.

### 5d — Gemini spec generation

Tell the user:
> "Analyzing your images to generate a product spec sheet. This is the source of truth for all generation prompts — I'll show you the result for review."

Build the Gemini extraction request. Include all uploaded images as inline_data:

```python
import json, base64

images = []
for img_path in reference_image_paths[:4]:  # cap at 4 — keeps Gemini payload under limits
    with open(img_path, 'rb') as f:
        data = base64.b64encode(f.read()).decode()
    ext = img_path.split('.')[-1].lower()
    mime = 'image/png' if ext == 'png' else 'image/webp' if ext == 'webp' else 'image/jpeg'
    images.append({"inline_data": {"mime_type": mime, "data": data}})

extraction_prompt = """Analyze these product images and produce a structured product spec sheet in this exact format:

## Product Spec — [Product Name]

### Physical form factor
[Shape, dimensions (if visible), materials, surface finish, closures or mechanisms]

### Colors
[Every color with hex approximation. Background, primary surface, secondary surface, accents, text]

### Typography found on product
[Every text element visible: exact wording, approximate style (serif/sans/script), weight, placement, size relative to product]

### Packaging copy or claims (verbatim if readable)
[Any readable copy, taglines, claims, ingredient callouts, instructions]

### Reference lock — Option A: [Primary hero view]
[2–3 sentences: product position, background, lighting, what is and is not in frame. Written as a prompt constraint.]
NEGATIVE PROMPT: [What must not appear]

### Reference lock — Option B: [Detail or secondary view]
[2–3 sentences. Different framing than Option A.]
NEGATIVE PROMPT: [What must not appear]

### Reference lock — Option C: [Lifestyle or context view — if available]
[2–3 sentences. If no lifestyle image was provided, note: "No lifestyle reference available — use text-to-image with product description only."]
NEGATIVE PROMPT: [What must not appear]

### Generation notes
[Any product-specific constraints an AI image generator should know: fragile details, common failure modes, important brand marks]"""

body = {
    "contents": [{"parts": images + [{"text": extraction_prompt}]}],
    "generationConfig": {"temperature": 0.2, "maxOutputTokens": 2048}
}
json.dump(body, open('/tmp/spec_extraction.json', 'w'))
```

Call Gemini:
```bash
secure-fetch run \
  --url "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent" \
  --method POST \
  --secret-key GEMINI_API_KEY \
  --auth-header "x-goog-api-key" \
  --auth-scheme "" \
  --header "Content-Type: application/json" \
  --body "$(cat /tmp/spec_extraction.json)" \
  --max-response-bytes 15000
```

Parse `candidates[0].content.parts[0].text` and show it in chat:

> "Here's the product spec I extracted from your images. Review it carefully — especially the typography and reference locks. What needs to change?"

Wait for user feedback. Apply any corrections they give. Once they say it's good:

Save as:
```
/agent/brain/{brand_slug}/adgen/{product_slug}/product-spec.md
```

### 5e — Public URL registry

Write the public URL file for NB2 generation:

```python
import json

app_host = config['app_host']
public_urls = {}
for filename in reference_image_filenames:
    key = filename.replace('.jpg', '').replace('.png', '').replace('.webp', '')
    public_urls[key] = f"https://{app_host}/nb-image-gen/api/ref-images/{brand_slug}/{product_slug}/{filename}"

public_urls['_base'] = f"https://{app_host}/nb-image-gen/api/ref-images/{brand_slug}/{product_slug}/"
json.dump(public_urls, open(f'/agent/brain/{brand_slug}/adgen/{product_slug}/reference-images/public-urls.json', 'w'), indent=2)
```

### 5f — Empty learning log

Write an empty learning log at `/agent/brain/{brand_slug}/learnings/{product_slug}.json`:

```json
{
  "_meta": {
    "product": "{product_slug}",
    "brand": "{brand_slug}",
    "created_at": "{ISO timestamp}",
    "note": "Learning entries added by generate-ad skill and iteration outcome capture"
  },
  "learnings": []
}
```

### 5g — Confirm and continue

Tell the user:
> "[Product] is ready for generation. You can say 'generate an ad for [product]' to start."

Then ask:
> "Do you have another product to set up, or are you ready to generate?"

If another product: return to Step 5a.
If done: proceed to Step 6.

---

## Step 6 — Naming conventions

Ask:
> "Do you have an existing ad naming convention, or would you like to use the default format? The default is: `b-{brand_code}_p-{product_code}_crt-AI_c-NB2_t-I_ct-{content_type}_cn-{concept_id}_v-V1`"

- If they say use the default: note it in brand config and skip.
- If they have an existing convention: ask them to describe it or paste an example. Save a summary as `/agent/brain/{brand_slug}/naming/naming-convention.md`.

---

## Step 7 — Summary

Show a setup summary:

```
✅ Setup complete

Brand: [brand_name] ([brand_code])
Workspace: [workspace_id]
Image server: [app_host]

Products ready for generation:
[list each product with product_code and number of reference images]

To generate an ad, say: "generate an ad for [product name]"
To add another product later, say: "add a product to the ad generator"
```

Done.
