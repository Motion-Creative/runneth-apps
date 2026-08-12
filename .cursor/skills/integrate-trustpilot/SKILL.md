---
name: integrate-trustpilot
description: |
  Connect to Trustpilot Business API and fetch workspace-brand reviews for downstream workflows.
  Use when users ask to pull Trustpilot reviews, set up Trustpilot, or connect Trustpilot.
user-invocable: true
last_verified: 2026-04-16
---

## Overview

This skill connects to the Trustpilot Business API, retrieves reviews for the workspace brand,
saves them to workdir for downstream use. It handles the full
cold-start flow: credential check, business unit discovery, paginated fetch, and handoff.

Two input paths are supported:
- **API path** - preferred for automation; uses stored credentials via secure-fetch
- **CSV path** - immediate fallback; user exports from Trustpilot Business dashboard and uploads the file

## User Setup Steps

1. Confirm the user has Trustpilot Business API access enabled.
2. Locate API key and API secret in Trustpilot Business dashboard integrations/API area.
3. Create Base64 string from `api_key:api_secret`.
4. Register encoded value as integration secret and proceed with token fetch.

---

## Pre-Flight: Check for Existing Credentials

Before prompting for credentials, check whether they are already saved:
- Look for `TRUSTPILOT_BASIC_CREDENTIALS` in the agent runtime environment
- Look for a saved business unit ID in `/agent/workspaces/{workspaceId}/config/trustpilot/trustpilot_config.json`

If credentials exist and a business unit ID is saved, skip to Phase 2 (fetch reviews).
If credentials exist but no business unit ID is saved, skip to Phase 1b (discover business unit).
If no credentials exist, start at Phase 1a.

---

## Phase 1a: Collect Credentials

Emit the secret-input widget and explain what is needed before proceeding.

Tell the user:
- They need a Trustpilot for Business account with the API module enabled
- Credentials are found in: Trustpilot Business dashboard > Integrations > API
- Trustpilot OAuth requires API Key + API Secret, encoded as HTTP Basic credentials

Collect one combined secret:
- secretKey: `TRUSTPILOT_BASIC_CREDENTIALS`
- scope: workspace
- allowedHosts: `["api.trustpilot.com"]`

Tell the user to store a Base64-encoded `api_key:api_secret` string.
Helper command they can run locally:

```bash
echo -n "your_api_key:your_api_secret" | base64
```

Do not proceed until `TRUSTPILOT_BASIC_CREDENTIALS` is provided.

## Secret Registration

- Required secret: `TRUSTPILOT_BASIC_CREDENTIALS`
- allowedHosts: `["api.trustpilot.com"]`

---

## Phase 1b: Discover Business Unit ID

Use `secure-fetch` to find the business unit ID for the workspace brand domain.

## Access/Permissions Setup

- Ensure the credentials map to the intended Trustpilot Business account.
- Resolve and save the correct business unit ID for the workspace brand domain before review pulls.

**Step 1: Get an access token**

```text
POST https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

Use this command shape (redirect first, parse second):

```bash
secure-fetch run \
  --url "https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken" \
  --method POST \
  --secret-key TRUSTPILOT_BASIC_CREDENTIALS \
  --auth-header "Authorization" \
  --auth-scheme "Basic" \
  --header "Content-Type: application/x-www-form-urlencoded" \
  --body "grant_type=client_credentials" \
  --max-response-bytes 500000 > /tmp/trustpilot_token.json 2>&1

python3 -c "import json; d=json.load(open('/tmp/trustpilot_token.json')); b=json.loads(d['body']); print(d['status']); print('has_token=', bool(b.get('access_token')))"
```

Output-format note: this parser assumes `secure-fetch run` returns a JSON envelope with `status` and `body`.
Validate this in a live environment before production use. If output is raw response content instead,
parse `/tmp/trustpilot_token.json` directly as the API response and extract `access_token` from that body.

Extract `access_token` from the response. If this fails with 401, the credentials are invalid - tell the user and re-emit the secret-input widget.

**Step 2: Find the business unit**

```text
GET https://api.trustpilot.com/v1/business-units/find?name={brand_domain}
Authorization: Bearer {access_token}
```

```bash
TOKEN=$(python3 -c "import json; d=json.load(open('/tmp/trustpilot_token.json')); print(json.loads(d['body'])['access_token'])")
secure-fetch run \
  --url "https://api.trustpilot.com/v1/business-units/find?name={brand_domain}" \
  --method GET \
  --secret-key TRUSTPILOT_BASIC_CREDENTIALS \
  --header "Authorization: Bearer ${TOKEN}" \
  --max-response-bytes 500000 > /tmp/trustpilot_bu.json 2>&1
```

Use the brand domain from workspace brand context (e.g. `manychat.com`). Extract `id` from the response - this is the business unit ID.

**Save the business unit ID** to `/agent/workspaces/{workspaceId}/config/trustpilot/trustpilot_config.json`:

```json
{
  "businessUnitId": "{id}",
  "brandDomain": "{brand_domain}",
  "savedAt": "{ISO date}"
}
```

---

## Phase 2: Fetch Reviews

Default: fetch 100 most recent reviews. If the user specified a different count, use that.
Maximum per page: 100. Use pagination for counts above 100.

At the start of Phase 2, fetch a fresh `access_token` if `TOKEN` is not already set in the current shell context.
Do not assume `TOKEN` exists when Phase 1b is skipped.

**Review fetch endpoint:**

```text
GET https://api.trustpilot.com/v1/business-units/{businessUnitId}/reviews
  ?perPage=100
  &page=1
  &orderBy=createdat.desc
Authorization: Bearer {access_token}
```

```bash
secure-fetch run \
  --url "https://api.trustpilot.com/v1/business-units/{businessUnitId}/reviews?perPage=100&page=1&orderBy=createdat.desc" \
  --method GET \
  --secret-key TRUSTPILOT_BASIC_CREDENTIALS \
  --header "Authorization: Bearer ${TOKEN}" \
  --max-response-bytes 2000000 > /tmp/trustpilot_reviews_p1.json 2>&1
```

Paginate by incrementing `page` until the target count is reached or no more reviews exist.

**Fields to extract per review:**
- `id`
- `stars` (1-5)
- `title`
- `text`
- `createdAt`
- `consumer.displayName`
- `companyReply` (if present)

Save the full extracted review set to `./workdir/trustpilot-reviews.json`.

Report to the user: how many reviews were fetched, date range covered, and star distribution (count per star level).

---

## Phase 2b: CSV Fallback Path

If the user uploads a CSV instead of using the API:

1. Read the file from `./uploads/`
2. Identify columns for: rating/stars, review title, review body, date
3. Normalize to the same structure as the API output
4. Save to `./workdir/trustpilot-reviews.json`
5. Continue to Phase 3

If column names are ambiguous, ask one clarifying question before proceeding.

---

## Phase 3: Integration Completion

Once `./workdir/trustpilot-reviews.json` is saved:
- confirm completion of Trustpilot integration fetch
- report review count, date range, and star distribution
- provide artifact path for whichever downstream workflow the user chooses

---

## Reuse in Future Sessions

On subsequent runs, the skill checks for the saved business unit ID first. If found, it skips
credential collection and business unit discovery and goes straight to Phase 2. This makes
repeat runs fast - just trigger the skill and it fetches fresh reviews immediately.

If the user wants to reset credentials or change the brand domain, they can say
"reset Trustpilot credentials" or "change Trustpilot brand."

---

## Constraints

- Do not call `secure-fetch` from app code. This skill runs in the agent shell only.
- Do not fabricate review data. If the API returns fewer reviews than requested, report the actual count.
- Do not include the access token in any artifact or saved file.
- Do not surface Trustpilot API credentials in prose or chat.
- If the API module is not enabled on the user's Trustpilot plan, the token request will fail with 403. Tell the user they need to upgrade or use the CSV path instead.
- If no reviews are returned for the business unit, confirm the domain is correct before retrying.
- This skill fetches reviews only. Do not make changes to the Trustpilot account, respond to reviews, or call write endpoints.

## Official References

- [Trustpilot client credentials flow](https://developers.trustpilot.com/grant-type-client-credentials/)
- [Trustpilot business units overview](https://developers.trustpilot.com/business-units-api-overview/)
