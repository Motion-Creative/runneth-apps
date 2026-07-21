# VoC platform pull recipes

Per-platform endpoints, pagination, discovery steps, and unified-template field mappings.
Evidence levels: **live-verified** (probed through the real Connect proxy on a dev account)
vs **doc-grounded** (provider docs, unprobed - verify with a bounded call before promising
data). Registry slugs are the Builder integration registry's; use them as `--app` values and
as the `data-sources/<platform>/` folder name.

Pagination defaults for every platform: page size 100 (or the platform max), hard cap of 50
pages per pull unless the user asks for full history, and a client-side date cutoff on the
item's created date except where a server-side bound exists (Yotpo only).

---

## judge_me (Pipedream OAuth) - endpoint live-verified, payload doc-grounded

- Base: `https://judge.me/api/v1`
- List reviews: `GET /reviews?page=1&per_page=100` - `per_page` max 100, page-numbered;
  iterate `page` until a short page.
- Product-scoped: `GET /reviews?product_id={judgeMeProductId}&page=1`. Resolve a Judge.me
  product id from a Shopify product id via `GET /products/-1?external_id={shopifyProductId}`.
- Date bound: none on the API - page through and cut off client-side by `created_at`.
- Field mapping: `rating` <- `rating` (1-5 int); body <- `body`; `title` <- `title`;
  `product_ref` <- `product_external_id` (Shopify product id; `product_handle` also exists);
  `author_name` <- `reviewer.name`; `created_at` <- `created_at`; `verified` <- `verified`;
  media in `pictures[]` (keep in raw payload only).

## trustpilot (Pipedream OAuth) - doc-grounded, verify on first connect

Two-step:

1. Discovery: `GET /v1/business-units/find?name={domain}` -> `businessUnitId`
2. List: `GET /v1/business-units/{businessUnitId}/reviews?perPage=100&page=1` (public
   reviews; `stars` filter available). A private-reviews variant exists at
   `/v1/private/business-units/{businessUnitId}/reviews` - scope-dependent, verify the grant
   on connect.

- Date bound: none - client-side cutoff.
- Field mapping: `rating` <- `stars`; body <- `text`; `title` <- `title`;
  `author_name` <- `consumer.displayName`; `created_at` <- `createdAt`; `companyReply` stays
  in the raw payload.
- **`product_ref` is always null**: Trustpilot core is company-level reviews. Product reviews
  are a separate API surface - verify grant coverage before using it.

## yotpo (Pipedream OAuth) - doc-grounded, verify on first connect

- Discovery: every call needs the per-account `{appKey}`. Where it comes from on a fresh
  connect (connected-account metadata vs an API discovery call) must be verified when the
  account exists - treat it as the first-call gap.
- List: `GET https://api.yotpo.com/v1/apps/{appKey}/reviews?count=100&page=1` with `star={n}`
  and `updated_at_min=YYYY-MM-DD` filters.
- Date bound: `updated_at_min` - **the only platform here with a native date bound**.
- Field mapping: `rating` <- `score`; body <- `content`; `title` <- `title`;
  `author_name` <- `user.display_name`; `created_at` <- `created_at`; `product_ref` <- `sku`;
  `verified` <- `verified_buyer`; votes stay in the raw payload.

## junip (keys-auth in Pipedream) - BLOCKED: no working key verified

- The registry entry's only example is `GET /v1/stores` on `https://api.juniphq.com` (a
  connection check). Junip's docs describe `GET /v1/product_reviews` (cursor-paginated).
- Doc-grounded with no scope truth: start with a bounded read (one small page) before
  promising anything. If the stored key 401s, the key is dead - route to reconnection, do
  not retry.

## okendo (secrets path - NOT in Pipedream's catalog)

- Auth: customer API key stored as a secret; call with `secure-fetch`. "Connect" for Okendo
  means storing a key.
- Discovery: the store id.
- List: `GET https://api.okendo.io/v1/stores/{storeId}/reviews` - cursor-paginated.
- Field mapping (doc-grounded; confirm names against a real key): `rating` <- `rating`;
  body <- `body`; `title` <- `title`; `product_ref` <- `productId`;
  `author_name` <- reviewer name field; `created_at` <- `dateCreated`;
  `verified` <- verified status field.

## stamped (secrets path - NOT in Pipedream's catalog)

- Auth: customer API key + storeHash, via `secure-fetch`.
- List: `GET /api/v2/dashboard/reviews?storeHash=...` (dashboard API).
- Field mapping (doc-grounded; confirm against a real key): `rating` <- `reviewRating`;
  body <- `reviewMessage`; `title` <- `reviewTitle`; `product_ref` <- `productId`
  (`productTitle` also exists); `author_name` <- `author`; `created_at` <- `dateCreated`;
  `verified` <- `reviewVerifiedType`.

## gorgias (registry: `gorgias_oauth`) - live-verified. Support conversations, not reviews.

- `source_type: support_conversation`.
- List: `GET /api/tickets?limit=N&order_by=updated_datetime:desc` - cursor pagination via
  `meta.next_cursor` (observed live). `GET /api/account` verifies the connection.
- Messages: fetch per ticket with `GET /api/messages?ticket_id=...` so the file body carries
  the full conversation.
- Date bound: none - newest-first ordering plus client-side cutoff.
- Field mapping: `title` <- `subject`; `status` <- `status`; `channel` <- `channel`/`via`;
  `tags` <- `tags[]` names; `author_name` <- `customer.name`; `created_at` <-
  `created_datetime`; `updated_at` <- `updated_datetime`; `reply_count` <- `messages_count`;
  `custom` <- `custom_fields` (pass through as-is - this is where org-specific headers like
  Category/Detail/Customer tier come from); `rating` is null (no CSAT on the ticket object).

## intercom (Pipedream OAuth) - live-verified. Conversations + CSAT, not reviews.

- `source_type: support_conversation`.
- List: `GET /conversations?per_page=N` - cursor pagination via `pages.next.starting_after`
  (plus `total_count`). Send the pinned `Intercom-Version` header the registry documents.
- Date-bounded pulls: `POST /conversations/search` (live-verified) is the date-boundable
  path - prefer it for bounded pulls.
- Messages: conversation parts, fetched per conversation.
- Field mapping: `title` <- `source.subject`; body <- `source.body` plus conversation parts;
  `status` <- `state`; `author_name` <- `source.author` / contact name;
  `created_at`/`updated_at` <- `created_at`/`updated_at`; `custom` <- `custom_attributes`;
  `rating` <- `conversation_rating` (CSAT - the review-like signal); `channel` from the
  source type when present.
- Intercom workspaces can be large: keep `per_page` small on the first call and stay
  deliberate about pull size.

## meta ad comments (Motion native - NOT a Runneth integration)

- `source_type: ad_comment`, platform folder `meta-ads`.
- Rides the org's existing Motion Meta connection; no Runneth connect at all.
- Pull: `motion meta creative-comments` (per the motion-cli skill). Per creative asset, max
  50 ids per request; root comments bounded at 1,000 per ad unit (explicitly non-exhaustive -
  the tool reports coverage level, gaps, and warnings). Served from Motion's cache, so fresh
  comments can lag. Junk comments are filtered by default; replies and reactions are opt-in.
  Output lands as a JSON file in the workdir - transform that into the per-comment files.
- Field mapping: `external_id` <- `id`; body <- `text`; `author_name` <- `authorName`;
  `created_at` <- `createdAt`; `reactions_total` <- `reactions.total`;
  `reply_count` <- `replyCount`; replies become their own files with `parent_ref` set to the
  parent comment id; `rating`, `product_ref`, and `verified` are null.

---

## Variation summary (what actually changes per platform)

| dimension | judge_me | trustpilot | yotpo | okendo | stamped |
|---|---|---|---|---|---|
| rating field | `rating` | `stars` | `score` | `rating` | `reviewRating` |
| text field | `body` | `text` | `content` | `body` | `reviewMessage` |
| product ref | Shopify product id | **none (company-level)** | `sku` | `productId` | `productId` |
| date bound on API | none (client-side) | none (client-side) | **`updated_at_min`** | TBD | TBD |
| pagination | page number | page number | page number | cursor | page number |
| discovery step | none | businessUnitId | **appKey** | storeId | storeHash |
| connection path | OAuth registry | OAuth registry | OAuth registry | **secret key** | **secret key** |
