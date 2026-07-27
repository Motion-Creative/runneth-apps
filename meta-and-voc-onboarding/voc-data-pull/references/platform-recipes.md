# VoC platform pull recipes

Per-platform endpoints, pagination, discovery steps, and unified-template field mappings.
Evidence levels: **live-verified** (probed through the real Connect proxy on a real
account), **registry-verified** (paths and mechanics confirmed in the Builder integration
registry's curated, live-probe-informed examples - not probed on a customer account here),
and **doc-grounded** (provider docs, unprobed - verify with a bounded call before
promising data). Recipes are best-effort guidance, not law: the live API is the truth,
adaptation is expected, and a stale recipe must never stop a pull (see the skill's Step 2
mandate). Registry slugs are the Builder integration registry's; use them as `--app`
values and as the `data-sources/voc/<platform>/` folder name. A VoC platform with no
section in this file is still in scope: pull it through the skill's no-recipe path
(Step 2) - live API, unified template, same boundaries.

Pagination defaults for every platform: page size 100 (or the platform max), and a
client-side date cutoff on the item's created date except where a server-side bound
exists - each recipe states its own date bound; prefer a server-side bound over a
client-side cutoff wherever the recipe has one.

**The coverage contract (window, page-cap resume, "coverage stopped at" reporting) is
owned by the skill** - `SKILL.md`'s hard boundaries and Step 4 report rules. Recipes only
state each platform's mechanics; they never redefine coverage.

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
  media in `pictures[]` is not carried into the file; `source_url` <- null (the list payload
  carries no permalink).

## trustpilot (Pipedream OAuth, keys in connect modal) - registry-verified paths, verify on first connect

Use relative paths through the proxy (the connected account carries the API host). Two-step:

1. Discovery: `GET /v1/business-units/find?name={domain}` (`name` = the website domain,
   required) -> `businessUnitId`; or `GET /v1/business-units/search?query={partialName}`.
   Resolve once and reuse.
2. List: `GET /v1/business-units/{businessUnitId}/reviews?perPage=100&page=1` (public
   reviews; `perPage` max 100; `stars`, `language`, `orderBy` filters available). Private
   reviews with consumer details live at
   `/v1/private/business-units/{businessUnitId}/reviews` and need the business-user OAuth
   token - verify the grant on connect.

- Date bound: none - client-side cutoff.
- Field mapping: `rating` <- `stars`; body <- `text`; `title` <- `title`;
  `author_name` <- `consumer.displayName`; `created_at` <- `createdAt`; `companyReply` is not
  carried into the file; `source_url` <- a `links`/review-URL field if the payload carries one
  (verify on first connect), else null.
- **`product_ref` is always null**: Trustpilot core is company-level reviews. Product reviews
  are a separate API surface - verify grant coverage before using it.

## yotpo (Pipedream OAuth) - API mechanics live-verified (proxy path still unverified: plan-gated connect)

- Discovery: every call needs the per-account `{appKey}` - asked for in the connect modal
  (App Key), carried by the connected account.
- List: `GET https://api.yotpo.com/v1/apps/{appKey}/reviews?count=100&page=1`. **Reviews
  return oldest first**; sort/direction params are silently ignored - page forward until a
  page repeats/empties.
- Date bound (live-verified): `since_date=YYYY-MM-DD` filters on creation date - use it for
  backfill and incremental. `updated_at_min` does NOT work. `since_updated_at` works but
  sorts by id ascending and mixes in older recently-edited reviews - if you use it to catch
  edits, filter client-side for genuinely new items.
- Field mapping: `rating` <- `score`; body <- `content`; `title` <- `title`;
  `author_name` <- `user.display_name`; `created_at` <- `created_at`; `product_ref` <- `sku`;
  `verified` <- `verified_buyer`; votes are not carried into the file; `source_url` <- null (no
  permalink in the list payload).

## junip (keys-auth in Pipedream) - live-verified against a customer account

- Connect asks for the Store Key (needs-setup). Base `https://api.juniphq.com`; verify the
  key with `GET /v1/stores` (also returns store rating average + distribution).
- List: `GET /v1/product_reviews` (newest first) and `GET /v1/store_reviews`. **v1 only -
  v2 paths 404 through this connection.**
- Pagination (live-verified): cursor via `?page[after]={cursor}`, taking the value from
  `meta.page.after`; null cursor = last page. Pages are fixed at 50 rows - page-size params
  are ignored.
- **No server-side date or product filter - every filter param tested is ignored.** Pull
  pages newest-first and cut client-side on the review's created date; filter by product id
  client-side too.
- Field mapping: `rating` <- rating; body <- review body; `title` <- title;
  `author_name` <- **null on payloads (display names are not returned)** - put the stable
  customer id in `custom` instead; `created_at` <- created; `verified` <- verified-buyer
  flag; `product_ref` <- product id; `source_url` <- null.

## okendo (secrets path - NOT in Pipedream's catalog)

- Auth: customer API key stored as a secret; call with `secure-fetch`. "Connect" for Okendo
  means storing a key.
- Discovery: the store id.
- List: `GET https://api.okendo.io/v1/stores/{storeId}/reviews` - cursor-paginated.
- Field mapping (doc-grounded; confirm names against a real key): `rating` <- `rating`;
  body <- `body`; `title` <- `title`; `product_ref` <- `productId`;
  `author_name` <- reviewer name field; `created_at` <- `dateCreated`;
  `verified` <- verified status field; `source_url` <- null (no permalink documented).

## stamped (secrets path - NOT in Pipedream's catalog)

- Auth: customer API key + storeHash, via `secure-fetch`.
- List: `GET /api/v2/dashboard/reviews?storeHash=...` (dashboard API). Pagination:
  page-numbered via a `page` param (doc-grounded - verify against a real key).
- Field mapping (doc-grounded; confirm against a real key): `rating` <- `reviewRating`;
  body <- `reviewMessage`; `title` <- `reviewTitle`; `product_ref` <- `productId`
  (`productTitle` also exists); `author_name` <- `author`; `created_at` <- `dateCreated`;
  `verified` <- `reviewVerifiedType`; `source_url` <- null (no permalink documented).

## gorgias (registry: `gorgias_oauth`) - live-verified. Support conversations, not reviews.

- `source_type: support_conversation`.
- List: `GET /api/tickets?limit=N&order_by=updated_datetime:desc` - cursor pagination via
  `meta.next_cursor` (observed live). `GET /api/account` verifies the connection.
- Messages: fetch per ticket with `GET /api/messages?ticket_id=...` so the file body carries
  the full conversation.
- Date bound: none - newest-first ordering plus client-side cutoff.
- Field mapping: `title` <- `subject`; `status` <- `status`; `channel` <- `channel`/`via`;
  `tags` <- `tags[]` names; `author_name` <- `customer.name`; `created_at` <-
  `created_datetime`; `updated_at` <- `updated_datetime`; `reply_count` <-
  `messages_count - 1` (`messages_count` includes the root message; `reply_count` counts
  messages beyond it); `custom` <- `custom_fields` (pass through as-is - this is where
  org-specific headers like Category/Detail/Customer tier come from); `rating` <- CSAT when
  available: `GET /api/satisfaction-surveys?limit=100` returns scores and comments once
  customers respond - join by ticket id (the ticket object itself carries no CSAT);
  `source_url` <- construct `https://<account domain>/app/ticket/<id>`
  from the domain in the `/api/account` response - null if the domain is unknown.

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
  source type when present; `reply_count` <- count of conversation parts beyond the source
  message; `source_url` <- null (inbox permalinks need workspace context the payload does
  not carry).
- Intercom workspaces can be large: keep `per_page` small on the first call and stay
  deliberate about pull size.

## reddit (Pipedream OAuth) - doc-grounded, verify on first connect. Community posts, not reviews.

- `source_type: community_post`, platform folder `reddit`.
- **Connection:** Pipedream OAuth, needs-setup (the connect modal asks for a Reddit Client
  ID/Secret). Base `https://oauth.reddit.com`; always add `raw_json=1` to reads.
- **Pull targets are org-specific - confirm before the first pull**: which subreddits
  (brand's own sub, category subs) and/or search queries (brand name, product names).
  Candidates: `GET /r/{subreddit}/new?limit=100&raw_json=1`,
  `GET /r/{subreddit}/search?q={query}&restrict_sr=1&sort=new&limit=100&raw_json=1`,
  `GET /search?q={query}&restrict_sr=0&sort=new&limit=100&raw_json=1`.
- **Pagination:** cursor via fullname `after` tokens (`limit` max 100). Items are under
  `data.children[].data`; the next cursor is `data.after`; stop when `data.after` is null -
  NOT when a page looks short.
- **Coverage contract: the full 12-month window, worked around Reddit's listing limit.**
  Reddit's API refuses to return more than ~1000 items per listing (platform-imposed, not
  ours). Do not accept 1000 as the coverage: slice the window instead - pull per listing
  (subreddit new, top with time filters, search with date-bounded queries) and combine, so
  each slice stays under the limit and the whole 12 months gets covered. Only if slicing
  still cannot reach older in-window items, report the exact gap (dates not reachable and
  why) instead of claiming the window is covered.
- Date bound: none server-side on listings - `sort=new` plus client-side cutoff on
  `created_utc`.
- Field mapping: `title` <- `title` (posts; null for comments); body <- `selftext` (posts) /
  `body` (comments); `author_name` <- `author` (username; `author_contact` stays null
  regardless); `created_at` <- `created_utc` (epoch -> ISO 8601);
  `reactions_total` <- `score`; `reply_count` <- `num_comments` (posts);
  `parent_ref` <- parent fullname for comments (comments become their own files);
  `source_url` <- `https://www.reddit.com` + `permalink`; subreddit name rides in `custom`
  (`{ "subreddit": "..." }`); `rating`, `product_ref`, `verified`, and the support fields
  are null.
- Comment trees: pull comments only for in-scope posts and only when the org wants them
  (deep trees multiply volume fast); each pulled comment is its own file with `parent_ref`.

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
  parent comment id; `rating`, `product_ref`, and `verified` are null; `source_url` <- null
  (the payload carries no permalink).

---

## reviews_io (keys in Pipedream connect modal) - registry-verified paths. Merchant + product reviews.

- Writes `review` files. Auth is a Pipedream-managed Store ID + API key; **API credentials
  exist only on an active Plus plan** - trial and lower plans have none. Static base
  `https://api.reviews.io`.
- List: `GET /merchant/reviews?per_page=25&page=1` (company-level) and
  `GET /product/review?per_page=25&page=1` (product-level, singular path; `sku={sku}` to
  filter one product). Page until a short page.
- Date bound: none documented - newest-first plus client-side cutoff; verify ordering on
  first pull.
- Field mapping (doc-grounded): `rating` <- rating; body <- review text; `title` <- title;
  `author_name` <- reviewer name; `created_at` <- date; `product_ref` <- sku (product
  reviews) / null (merchant); `verified`/`source_url` <- verify against a real payload.

## zendesk (Pipedream OAuth) - doc-grounded, verify on first connect. Support conversations.

- Writes `ticket` files. List: `GET /api/v2/tickets` (cursor pagination via
  `page[after]`); comments per ticket via `GET /api/v2/tickets/{id}/comments`.
- Date bound: incremental exports support `start_time`; otherwise sort by `updated_at`
  desc with a client-side cutoff. Use `updated_at` for the re-pull bound.
- Field mapping (doc-grounded): body <- ticket subject + comment bodies (one `###` section
  per comment, in order); `author_name` <- requester name; `created_at` <- `created_at`;
  `reply_count` <- comment count - 1; `rating` <- satisfaction rating when present;
  `source_url` <- the agent-facing ticket URL.

## klaviyo (Pipedream OAuth or stored key) - registry-verified. Reviews product.

- Writes `review` files from Klaviyo Reviews. List:
  `GET /api/reviews/?filter=greater-or-equal(created,<ISO>)&sort=-created` - server-side
  date bound plus newest-first, use it for both backfill and incremental. The required
  `revision` header is sent automatically by Builder through the Pipedream proxy - **on the
  stored-secret path you must send it yourself** (`revision: 2026-04-15`, base
  `https://a.klaviyo.com`, `Authorization: Klaviyo-API-Key <key>`).
- Pagination: follow the full `links.next` URL from the response - do not build the cursor
  yourself.
- Field mapping (doc-grounded): `rating` <- `attributes.rating`; body <-
  `attributes.content`; `title` <- `attributes.title`; `product_ref` <- related product id;
  `author_name` <- `attributes.author`; `created_at` <- `attributes.created`;
  `verified` <- `attributes.verified`; `source_url` <- null.

## attentive (Pipedream OAuth or stored key) - doc-grounded, verify on first connect. SMS replies.

- Writes `ticket` files (one conversation per subscriber thread). API surface for message
  history is limited - verify what the org's plan exposes before promising data; if only
  webhooks exist, report that as a gap rather than polling.
- Field mapping (doc-grounded): body <- message texts in order; `author_name` <- subscriber
  phone/name; `created_at` <- message timestamp; `rating`/`verified`/`product_ref` <- null.

## gong (Pipedream OAuth, one-click) - registry-verified. Recorded customer calls.

- Writes `ticket` files (one per call; the transcript is the conversation). Gong uses a
  per-account API host - use relative `/v2/` paths through the proxy, never a hardcoded
  domain.
- List: `GET /v2/calls?fromDateTime=<ISO>&toDateTime=<ISO>` for the simple list; for richer
  fields use `POST /v2/calls/extensive` with `{"filter": {"fromDateTime": ...},
  "contentSelector": {"context": "Extended"}}` (cursor rides in the request body).
  Transcripts: `POST /v2/calls/transcript` with `{"filter": {"callIds": [...]}}`.
- Date bound: server-side `fromDateTime`/`toDateTime` - use for both backfill and
  incremental.
- Field mapping (doc-grounded): body <- transcript turns as `###` sections per speaker;
  `author_name` <- external participant name; `created_at` <- call `started`;
  `reply_count` <- turn count - 1; `source_url` <- call URL when exposed.

## hotjar (Pipedream OAuth or stored key) - doc-grounded, verify on first connect. Surveys + feedback.

- Writes `review` files (a survey/feedback response maps to the review shape: score ->
  `rating`, response text -> body). List: survey responses endpoint per site id - verify
  the exact path against the org's plan on first connect.
- Field mapping (doc-grounded): `rating` <- score (normalize to the platform's scale noted
  in `custom`); body <- open-text response; `created_at` <- response timestamp;
  `author_name`/`verified`/`product_ref` <- null unless the survey captures them.

## discord (Pipedream OAuth) - doc-grounded, verify on first connect. Community posts.

- Writes `community_post` files, same shape as Reddit. Pull targets (guild + channels) are
  org-specific and must be confirmed before the first pull. List:
  `GET /channels/{channelId}/messages` (cursor pagination via `before`).
- Date bound: none server-side - client-side cutoff on message timestamp.
- Field mapping (doc-grounded): body <- `content`; `author_name` <- author username;
  `created_at` <- `timestamp`; `reactions_total` <- sum of reaction counts;
  `parent_ref` <- referenced message id for replies/threads; `source_url` <- message link
  (`https://discord.com/channels/<guild>/<channel>/<message>`).

## youtube (registry: `youtube_data`) - doc-grounded, verify on first connect. Video comments.

- Writes `comment` files, same species as Meta ad comments. List:
  `GET /youtube/v3/commentThreads?allThreadsRelatedToChannelId=<channelId>` (cursor
  pagination via `pageToken`); replies ride in the thread payload or via `comments.list`.
- Date bound: none server-side on threads - order by time and cut client-side on
  `publishedAt`.
- Field mapping (doc-grounded): body <- `textOriginal`; `author_name` <-
  `authorDisplayName`; `created_at` <- `publishedAt`; `reactions_total` <- `likeCount`;
  `reply_count` <- `totalReplyCount`; `parent_ref` <- parent comment id for replies;
  `source_url` <- video URL + comment anchor.

## Variation summary (what actually changes per platform)

| dimension | judge_me | trustpilot | yotpo | junip | okendo | stamped |
|---|---|---|---|---|---|---|
| rating field | `rating` | `stars` | `score` | `rating` | `rating` | `reviewRating` |
| text field | `body` | `text` | `content` | `body` | `body` | `reviewMessage` |
| product ref | Shopify product id | **none (company-level)** | `sku` | `product.remote_id` | `productId` | `productId` |
| date bound on API | none (client-side) | none (client-side) | **`since_date`** | none (client-side) | TBD | TBD |
| pagination | page number | page number | page number (oldest-first) | `page[after]` cursor | cursor | page number (doc-grounded) |
| discovery step | none | businessUnitId | **appKey** | none | storeId | storeHash |
| connection path | OAuth registry | OAuth registry | OAuth registry | **secret key** | **secret key** | **secret key** |

Reviews.io and the non-review platforms (support, engagement, community, Meta ad comments)
are covered by their own recipe sections above rather than this review-platform table.
