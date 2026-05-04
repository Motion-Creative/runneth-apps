# review-library-init

Build a tagged, scored review library from any review API into a flat folder of
markdown files, with optional app cache rebuild and weekly sync reminder.

---

## When to Trigger

Trigger this skill when the user:
- Says "run review library init", "build my review library", "ingest reviews", or any variation
- Asks to pull and organize customer reviews from an external API
- Wants to set up a review knowledge base for creative strategy work

---

## Step 0 — Confirm Parameters

Ask the user for any parameters not already stated. Present the table below and
ask them to confirm or override each value. Accept "use default" for optional fields.

If the user cannot provide a required field mapping, ask them to paste a sample
review object from their API and infer the dotted paths from it.

### Connection Parameters

| Parameter | Default | Notes |
|---|---|---|
| BRAIN_PATH | `/agent/brain/reviews` | Root folder for review files |
| DATE_CUTOFF | trailing 12 months (compute as today minus 365 days, YYYY-MM-DD) | Use "all" for full history |
| APP_NAME | `review-library` | App to rebuild cache for; use "none" to skip |
| API_BASE_URL | — | Full URL to the reviews list endpoint. **Required.** |
| API_SECRET_KEY | — | Name of the org-level secret holding the API key. **Required.** Never ask for the key value itself. |
| AUTH_HEADER | `Authorization` | Header name for auth injection |
| AUTH_SCHEME | `Bearer` | Prefix before the secret value. Use empty string `""` for raw token. |
| PAGINATION_STYLE | `cursor` | One of: `cursor`, `page`, `offset` |
| PAGE_SIZE_PARAM | `page_size` | Query param name for page size |
| PAGE_SIZE | `50` | Reviews per page |
| CURSOR_PARAM | `after` | Query param for cursor (cursor pagination only) |
| CURSOR_PATH | `meta.after` | Dotted path to next cursor in response (cursor pagination only) |
| PAGE_PARAM | `page` | Query param for page number (page pagination only) |
| OFFSET_PARAM | `offset` | Query param for offset (offset pagination only) |
| RATE_LIMIT_DELAY | `0.6` | Seconds to sleep between page requests |
| SOURCE_LABEL | — | Human-readable label written into each file's frontmatter. **Required.** |

### Field Mappings

Dotted paths into a single review object from the API response.

| Mapping | Default | Notes |
|---|---|---|
| REVIEWS_LIST_PATH | `data` | Path to the array of reviews in the response |
| FIELD_ID | `id` | Required. Used as filename. |
| FIELD_BODY | `body` | Required. Review text. |
| FIELD_RATING | `rating` | Required. Integer 1-5. |
| FIELD_DATE | `created_at` | Required. ISO date or Unix timestamp. |
| FIELD_PRODUCT_NAME | `product.name` | Falls back to FIELD_PRODUCT_FALLBACK if null |
| FIELD_PRODUCT_FALLBACK | `target_title` | Optional secondary path for product name |
| FIELD_VERIFIED | `verified_buyer` | Optional; defaults to false if missing |
| FIELD_STATE | _(empty)_ | Optional. If set, only reviews where this field equals `published` are kept. Leave empty if the API has no state field. |

### Weekly Sync Schedule

| Parameter | Default |
|---|---|
| SYNC_CRON | `0 14 * * 1` (Monday 2 PM) |
| SYNC_TIMEZONE | `America/Los_Angeles` |

Ask the user if they want a different schedule before proceeding.

---

## Step 1 — Pull All Reviews

Build the first request URL: `{API_BASE_URL}?{PAGE_SIZE_PARAM}={PAGE_SIZE}`

Run the first request:

```
secure-fetch run \
  --url "{API_BASE_URL}?{PAGE_SIZE_PARAM}={PAGE_SIZE}" \
  --method GET \
  --secret-key {API_SECRET_KEY} \
  --auth-header "{AUTH_HEADER}" \
  --auth-scheme "{AUTH_SCHEME}" \
  --header "Content-Type: application/json" \
  --max-response-bytes 2000000 > /tmp/rl_page_1.json 2>&1
```

Then paginate according to PAGINATION_STYLE. Sleep RATE_LIMIT_DELAY seconds
between every request. Save each page to `/tmp/rl_page_N.json`.

**Stop early** on any page if DATE_CUTOFF is not "all": after saving the page,
check whether the oldest review date on that page predates DATE_CUTOFF using:

```bash
python3 -c "
import json, sys
def get_path(obj, path):
    cur = obj
    for p in path.split('.'):
        cur = cur.get(p) if isinstance(cur, dict) else None
    return cur
with open('/tmp/rl_page_N.json') as f:
    data = json.load(f)
reviews = get_path(data, 'REVIEWS_LIST_PATH') or []
dates = [str(get_path(r, 'FIELD_DATE') or '') for r in reviews if get_path(r, 'FIELD_DATE')]
print(min(dates) if dates else '')
"
```

If the minimum date returned is earlier than DATE_CUTOFF, stop pagination after
this page. The Python script will apply the cutoff per-review precisely.

---

### Cursor Pagination

1. Read the cursor from the page just saved:

```bash
python3 -c "
import json
def get_path(obj, path):
    cur = obj
    for p in path.split('.'):
        cur = cur.get(p) if isinstance(cur, dict) else None
    return cur
with open('/tmp/rl_page_N.json') as f:
    data = json.load(f)
cursor = get_path(data, 'CURSOR_PATH')
print(cursor if cursor is not None else '')
"
```

2. If the cursor is non-empty and different from the previous cursor, run:

```
secure-fetch run \
  --url "{API_BASE_URL}?{PAGE_SIZE_PARAM}={PAGE_SIZE}&{CURSOR_PARAM}={CURSOR_VALUE}" \
  --method GET \
  --secret-key {API_SECRET_KEY} \
  --auth-header "{AUTH_HEADER}" \
  --auth-scheme "{AUTH_SCHEME}" \
  --header "Content-Type: application/json" \
  --max-response-bytes 2000000 > /tmp/rl_page_{N+1}.json 2>&1
```

3. Sleep RATE_LIMIT_DELAY seconds. Repeat from step 1 with the new page file.

4. Stop when the cursor is null, empty, or unchanged from the previous iteration.

---

### Page Pagination

Start with PAGE=1. After saving each page, count the items:

```bash
python3 -c "
import json
def get_path(obj, path):
    cur = obj
    for p in path.split('.'):
        cur = cur.get(p) if isinstance(cur, dict) else None
    return cur
with open('/tmp/rl_page_N.json') as f:
    data = json.load(f)
reviews = get_path(data, 'REVIEWS_LIST_PATH') or []
print(len(reviews))
"
```

If count > 0, increment PAGE and run:

```
secure-fetch run \
  --url "{API_BASE_URL}?{PAGE_SIZE_PARAM}={PAGE_SIZE}&{PAGE_PARAM}={PAGE}" \
  --method GET \
  --secret-key {API_SECRET_KEY} \
  --auth-header "{AUTH_HEADER}" \
  --auth-scheme "{AUTH_SCHEME}" \
  --header "Content-Type: application/json" \
  --max-response-bytes 2000000 > /tmp/rl_page_{PAGE}.json 2>&1
```

Sleep RATE_LIMIT_DELAY seconds. Stop when count equals 0.

---

### Offset Pagination

Start with OFFSET=0, PAGE=1. After saving each page, count items (same snippet
as page pagination above). If count > 0, set OFFSET = PAGE * PAGE_SIZE, increment
PAGE, and run:

```
secure-fetch run \
  --url "{API_BASE_URL}?{PAGE_SIZE_PARAM}={PAGE_SIZE}&{OFFSET_PARAM}={OFFSET}" \
  --method GET \
  --secret-key {API_SECRET_KEY} \
  --auth-header "{AUTH_HEADER}" \
  --auth-scheme "{AUTH_SCHEME}" \
  --header "Content-Type: application/json" \
  --max-response-bytes 2000000 > /tmp/rl_page_{PAGE}.json 2>&1
```

Sleep RATE_LIMIT_DELAY seconds. Stop when count equals 0.

---

## Steps 2–7 — Process Reviews, Score, Tag, Write Files

Write the config file then run the processing script. All steps 2 through 7
(product slug derivation, scoring, tagging, file writes, _meta.json, _index.md)
run inside the script in a single pass.

### 2a — Write Config

Write the confirmed parameter values to `/tmp/rl_config.json`:

```bash
cat > /tmp/rl_config.json << 'EOFCONFIG'
{
  "BRAIN_PATH":             "{BRAIN_PATH}",
  "DATE_CUTOFF":            "{DATE_CUTOFF}",
  "SOURCE_LABEL":           "{SOURCE_LABEL}",
  "API_BASE_URL":           "{API_BASE_URL}",
  "REVIEWS_LIST_PATH":      "{REVIEWS_LIST_PATH}",
  "FIELD_ID":               "{FIELD_ID}",
  "FIELD_BODY":             "{FIELD_BODY}",
  "FIELD_RATING":           "{FIELD_RATING}",
  "FIELD_DATE":             "{FIELD_DATE}",
  "FIELD_PRODUCT_NAME":     "{FIELD_PRODUCT_NAME}",
  "FIELD_PRODUCT_FALLBACK": "{FIELD_PRODUCT_FALLBACK}",
  "FIELD_VERIFIED":         "{FIELD_VERIFIED}",
  "FIELD_STATE":            "{FIELD_STATE}"
}
EOFCONFIG
```

Replace every `{PLACEHOLDER}` with the confirmed resolved value before writing.

### 2b — Run the Processing Script

The script lives at:
`/agent/.agents/skills/review-library-init/scripts/process_reviews.py`

Run it and capture its JSON summary output:

```bash
python3 /agent/.agents/skills/review-library-init/scripts/process_reviews.py \
  --config /tmp/rl_config.json \
  > /tmp/rl_summary.json 2>&1
```

Read `/tmp/rl_summary.json` after it completes. This file contains all the
stats needed for the Step 10 report.

---

## Step 8 — Regenerate App Cache (Conditional)

**Skip entirely if APP_NAME is "none".**

If APP_NAME is set, first check whether the app server directory exists:

```bash
test -d /agent/apps/{APP_NAME}/server/src && echo "exists" || echo "missing"
```

**If "missing":** log `App cache skipped -- app not found` and continue to Step 9.
Do not attempt `app build` or `app verify`.

**If "exists":** Re-run the processing script with the `--cache-output` flag to
write the cache JSON:

```bash
python3 /agent/.agents/skills/review-library-init/scripts/process_reviews.py \
  --config /tmp/rl_config.json \
  --cache-output /agent/apps/{APP_NAME}/server/src/reviews-cache.json \
  > /dev/null 2>&1
```

Then rebuild and verify the app:

```bash
app build {APP_NAME}
app verify {APP_NAME}
```

Report the result as "App cache rebuilt and verified" or note any build error.

---

## Step 9 — Schedule Weekly Sync

Check for an existing reminder first:

```bash
reminder list
```

If a reminder named "Weekly Review Sync" already exists, note its ID and skip
creation. Do not create a duplicate.

If no such reminder exists, construct the full content string by substituting
all confirmed parameter values for every placeholder **before** calling
`reminder add`. The CLI must receive a fully-rendered string with no literal
curly-brace placeholders remaining.

The rendered content should follow this template (replace everything in angle
brackets with the confirmed resolved values):

```
Run the weekly review sync for <BRAIN_PATH>.
1. READ <BRAIN_PATH>/_meta.json for last_review_date and api_base_url.
2. PULL reviews newer than last_review_date from <API_BASE_URL> using secret <API_SECRET_KEY> via <AUTH_HEADER>: <AUTH_SCHEME> auth.
3. SCORE (skip score 1 and empty), TAG, and WRITE new files to <BRAIN_PATH>/product-slug/review_id.md. Do not overwrite existing files.
4. UPDATE _meta.json and _index.md.
5. REGENERATE app cache at /agent/apps/<APP_NAME>/server/src/reviews-cache.json and rebuild app. (Skip if APP_NAME is none.)
6. REPORT: new reviews added, score breakdown, any score 5 or standout-language reviews listed verbatim.
```

Then run:

```bash
reminder add \
  --name "Weekly Review Sync" \
  --content "<FULLY RENDERED CONTENT STRING>" \
  --cron "<SYNC_CRON>" \
  --timezone "<SYNC_TIMEZONE>"
```

---

## Step 10 — Report

Read `/tmp/rl_summary.json` and return the following in chat:

1. **Total reviews written** and breakdown by product slug and score
2. **Score 5 count** and **standout-language count**
3. **Date range** of reviews ingested (earliest to latest)
4. **App cache status**: "rebuilt and verified", "skipped -- app not found", or "skipped -- APP_NAME is none"
5. **Reminder**: reminder ID if just created, or "already existed: {ID}"
6. **Low-volume products**: any product slugs with fewer than 5 quality reviews (score >= 3), flagged for low signal volume
7. **Skipped reviews**: count of reviews skipped for missing required fields; list up to 20 IDs if any

---

## Constraints

- API_SECRET_KEY refers to an org-level secret name only. Never prompt for the
  key value itself and never log it.
- Do not overwrite existing review files. The script uses `os.path.exists()`
  to check before every write.
- Review body text is always written verbatim. Never edit or paraphrase.
- Score 1 reviews and reviews with no body are never written.
- All file writes happen in a single Python pass inside the script, not
  interactively one file at a time.
- If DATE_CUTOFF is "all", paginate until exhausted with no date-based stop.
- If a required field mapping returns null for a review, skip that review and
  include it in the "skipped: missing fields" section of the Step 10 report.
- The reminder add call must always receive a fully interpolated content string.
  Never pass literal `{VARIABLE}` placeholders to the CLI.
