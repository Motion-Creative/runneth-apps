---
name: integrate-junip
description: Connect to Junip Admin v2 and retrieve review data. Use when users ask to connect Junip, set up Junip integration, or pull Junip reviews.
user-invocable: true
last_verified: 2026-04-16
---

# Integrate Junip

## Trigger And Scope

Use for Junip private app auth, verification, and review retrieval from Admin v2.

## Version Metadata

- `api_version`: `admin/v2`
- `last_verified`: `2026-04-16`

## Core Workflow Checklist

1. Collect secret `JUNIP_API_KEY` for host `api.juniphq.com` (never ask user to paste key in chat).
   - Use `secret-input` widget with `secretKey: JUNIP_API_KEY` and `allowedHosts: ["api.juniphq.com"]`.
2. If needed, guide private app creation: audience `All customers`, permission `reviews:read`, install app.
3. Verify auth with `GET /admin/v2/product_reviews?page_size=5`.
4. Pull reviews from `/admin/v2/product_reviews?page_size=50` using `meta.after` cursor pagination.
5. Write artifact JSON to known path and report count plus window/filter details.

## Output Contract And Artifact Paths

- Default artifact path: `/tmp/junip_reviews_all.json`
- Artifact shape: JSON array of review objects from v2 `body.data`
- Must report: review count, date window applied, and whether strict client-side filtering was applied

## Review Object Shape (v2)

Top-level:
- reviews list: `body.data`
- next page cursor: `body.meta.after`

Common review fields:
- `id`: integer review id
- `body`: review text
- `rating`: integer `1-5`
- `created_at`: ISO datetime
- `state`: `published | pending | rejected | flagged`
- `target_title`: product title/variant label
- `product.name`: cleaner product name
- `verified_buyer`: boolean
- `customer`: customer object
- `attachments`: photo/video list
- `survey_answers`: list

## Template Vs Live State Rules

- This file is repo guidance and can be updated.
- Do not overwrite user workspace data products unless requested.
- If a user already has a Junip extraction pipeline, merge improved endpoint/auth rules without replacing user-specific downstream transforms.

## Verification Gate (Pass/Fail)

Run a small auth check and pass only if all are true:
- status is `200`
- response body has `data` as an array
- response body has `meta.after` field (nullable is fine)
- parser uses v2 keys (`data`, `meta.after`) and not v1 keys (`product_reviews`, `meta.page.after`)

If verification fails, stop and resolve auth/endpoint issues before full pull.

## Critical Facts - Do Not Deviate

- Correct base URL: `https://api.juniphq.com/admin/v2/`
- Correct reviews endpoint: `/admin/v2/product_reviews`
- Auth: `Authorization: Bearer <API_KEY>`
- Bearer token is the private app **API key** from Credentials
- Secret key is for webhook signature verification, not API auth
- Secret to register: `JUNIP_API_KEY` scoped to `api.juniphq.com`

Wrong-but-common paths:
- `/v1/product_reviews`: returns up to 50 and private-app pagination behavior is unreliable
- `/v2/product_reviews`: returns `404`

## Credential Collection Details

Where API key comes from in Junip Admin:
1. Log in to `app.juniphq.com`
2. Open **Apps**
3. Open the private app
4. Copy **API key** from **Credentials** (not Secret key)

If user does not have a private app yet:
1. Create private app
2. Audience: `All customers`
3. Permission: `reviews:read`
4. Save and install
5. Copy API key

## Nuance (Defaults And Edge Cases)

- Date window default: trailing 12 months unless user asks for full history or explicit date.
- Cursor stop condition can straddle a date boundary; apply strict client-side filtering when exact windows matter.
- Prefer file redirect for large responses before parsing to avoid truncation issues.
- Use this pattern (redirect first, parse second):

```bash
secure-fetch run --url "https://api.juniphq.com/admin/v2/product_reviews?page_size=50" \
  --method GET --secret-key JUNIP_API_KEY --auth-header "Authorization" --auth-scheme "Bearer" \
  --header "Content-Type: application/json" --max-response-bytes 2000000 > /tmp/junip_page.json 2>&1
python3 -c "import json; d=json.load(open('/tmp/junip_page.json')); print(d['status'])"
```

- Use this pagination loop skeleton for full pulls:

```python
import json, subprocess, time

all_reviews = []
cursor = None

while True:
    url = "https://api.juniphq.com/admin/v2/product_reviews?page_size=50"
    if cursor:
        url += f"&page_after={cursor}"

    subprocess.run(
        f'secure-fetch run --url "{url}" --method GET --secret-key JUNIP_API_KEY '
        f'--auth-header "Authorization" --auth-scheme "Bearer" '
        f'--header "Content-Type: application/json" --max-response-bytes 2000000 > /tmp/junip_page.json 2>&1',
        shell=True,
        check=False,
    )

    payload = json.load(open("/tmp/junip_page.json"))
    body = json.loads(payload["body"])
    reviews = body.get("data", [])
    next_cursor = body.get("meta", {}).get("after")

    if not reviews:
        break

    all_reviews.extend(reviews)

    # Stop when cursor is missing or repeats.
    if not next_cursor or next_cursor == cursor:
        break

    cursor = next_cursor
    time.sleep(0.6)
```

- Pace requests (about 2 req/sec) to reduce rate-limit risk.

## Troubleshooting Quick Map

| Symptom | Likely Cause | Fix |
|---|---|---|
| `401` on `/admin/v2/` | Wrong credential copied | Re-collect **API key** from Credentials |
| `403` | Missing app scope | Ensure `reviews:read`, reinstall app |
| `404` on `/v2/product_reviews` | Wrong path | Use `/admin/v2/product_reviews` |
| Stuck at same 50 reviews | Using v1 route | Move to v2 + `meta.after` cursor |
| JSON parse error on larger pages | Truncated piped output | Redirect to file, then parse |
| Only subset of reviews | App audience scoped too narrowly | Recreate/reconfigure app with `All customers` |
