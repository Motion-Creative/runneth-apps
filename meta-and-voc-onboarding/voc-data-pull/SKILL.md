---
name: voc-data-pull
description: |
  Pull raw voice-of-customer data - product reviews, support conversations, surveys,
  community posts, and comments - from an available VoC platform into standardized files in
  the org's brain, one file per item. Use when ANY VoC platform - one with a recipe
  (Judge.me, Trustpilot, Yotpo, Junip, Okendo, Stamped, Reviews.io, Gorgias, Intercom,
  Zendesk, Klaviyo, Attentive, Gong, Hotjar, Reddit, Discord, YouTube) or any other
  reachable platform whose data is customer voice - is reachable by any path - OAuth
  connection, stored API key, or Motion native - and its data should land in files, or when
  the user asks to "pull the reviews", "dump the reviews", "pull support tickets", "sync
  customer conversations to files", or "run the VoC data pull".
  Do NOT use for analyzing customer voice (use the voc-audit skill), building integration
  guides, or one-off API questions about a platform.
---

# VoC Data Pull

Pull raw voice-of-customer (VoC) items from a connected platform and write them into the
org's brain as standardized files: **one file per review, support ticket/conversation, or ad
comment**, each with a metadata header and the content body. Creative strategy packages build
on these files, so shape consistency matters more than volume.

## When to use

- The meta-and-voc-onboarding package (the package that carries this skill) just finished
  installing on this VM - that install is the ask, per its README's "After install"
  section - or the team or user asks to set up the VoC data sync -> run the "Set up the
  recurring sync" procedure below. Setup never happens at any other unprompted moment -
  never just because a platform connects.
- A `voc-sync-<platform>` routine run is executing (the normal path - see Recurring sync
  runs below).
- The user asks to pull, refresh, or extend VoC data, or asks for reviews/support
  conversations "in files" or "in the brain". Route these through the routine, not an
  in-conversation pull: make sure `voc-sync-<platform>` exists (setup procedure below),
  then `routine run --id <routine-id>` for an immediate refresh.

Run one platform per pull unless asked otherwise. Never wait for confirmation to start -
the window rules below fully determine what to pull.

## Hard boundaries

- **Read-only against platforms.** List/read endpoints only. Never write, reply, or delete
  through a VoC platform API.
- **Bounded pulls, complete within the bound.** Default to the trailing 12 months; the date
  window is the coverage contract - everything inside it gets pulled, nothing outside it
  does. Use a server-side date bound where the platform's recipe names one (e.g. Yotpo's
  `since_date`, Klaviyo's `created` filter, Gong's `fromDateTime`, Intercom's
  `POST /conversations/search`); everywhere else, page newest-first and stop once items are
  older than the cutoff. The 50-pages-per-run cap is runaway protection only: hitting it
  means "pause, report, and continue in further batches until the window is covered" -
  never "done." A run that ends short of coverage states "coverage stopped at
  <oldest covered date>" per account in its summary (Step 4), and the next run resumes
  from that date before the normal incremental window. This section owns the coverage
  contract; recipes only state per-platform mechanics.
- **Raw data files are separate from integration guides.** Never write pulled data into
  `/agent/brain/integrations/<source>/` - the integration guide spec explicitly forbids raw
  dumps in guides. VoC data lives only under `/agent/brain/data-sources/voc/`.
- **PII: leave `author_contact` null.** The unified template keeps the field, but the policy
  call on storing customer emails is pending. Do not populate it until told the policy allows
  it. Raw platform payloads are NOT persisted in output files (see the file format below), so
  do not paste payload JSON - which carries reviewer emails and other PII - into any brain
  file.

## Step 1 - Resolve the platform and connection path

Two connection paths exist and the pull mechanics differ:

| Path | Platforms | How to call the API |
|---|---|---|
| Pipedream OAuth | `judge_me`, `trustpilot`, `yotpo`, `gorgias_oauth`, `intercom`, `reddit`, `zendesk`, `klaviyo`, `attentive`, `gong`, `hotjar`, `discord`, `youtube_data`, `junip` and `reviews_io` (keys-auth in Pipedream) | `integrations` CLI: check `integrations status --app <slug>`, pick the account with `integrations accounts --app <slug>`, then `integrations proxy --app <slug> --account <accountId> --method GET --path <path>` (or the registered app command) |
| Stored secret (customer API key) | `okendo`, `stamped` - and **any platform above whose org stores a key instead of connecting OAuth** | `secure-fetch` (`secure-fetch run --url <url> --secret-key <SECRET_KEY> ...`) per `/runneth/references/secure-fetch-cli--command-contracts.md`. If no stored key exists, request one via the secret-collection flow - never ask for the key in chat. |
| Motion native | Meta ad comments | `motion meta creative-comments` (no Runneth connect involved) |

The path is how this customer set the platform up, not a property of the platform: any
VoC platform may arrive as an OAuth connection **or** a stored secret, so an
availability check always checks both `integrations status --app <slug>` and the stored
secrets - for
every VoC platform, not just Okendo/Stamped (which are secrets-only because no
Pipedream app exists for them). The secret store cannot be listed (the runtime refuses
Bash reads of `/agent/.runtime/secrets`, and neither `secret` nor `secure-fetch` has a
list command): probe per platform by attempting its documented secret key
(`secret run --env KEY=<SECRET_KEY> -- true`, or a bounded `secure-fetch run`) and treat
a "secret not available" error as not stored.

**Driving a platform from a stored secret (instead of the proxy):** the recipe's endpoints
and mappings stay the same, but you must supply what the proxy normally injects. Get the
base URL, auth header shape, and platform notes from the app's registry-backed guide (the
`integrations` CLI catalog / the registered app's guide - it exists even before a connect).
Known proxy-injected specifics: Klaviyo's `revision` header is auto-sent only through the
proxy - on the secrets path send it yourself (see the recipe); Gong, Gorgias, and Zendesk
use per-account hosts - get the account's host from the customer, never guess it. A
platform whose API only accepts OAuth tokens cannot be driven by a static key at all - the
bounded verification call settles that per org; if it fails on the secrets path, report the
gap, do not improvise auth.

Exact endpoints, pagination, discovery steps, and field mappings for every platform are in
`references/platform-recipes.md` in this skill folder. Read the recipe for the target
platform before calling anything.

**The recipe list is not the scope - VoC data is the scope.** Any other reachable platform
whose data is customer voice (reviews, support conversations, surveys, community posts,
comments) is in scope with no recipe at all: resolve its connection path exactly as above
(OAuth via the `integrations` proxy, or a stored key via `secure-fetch` with the registry
guide's base URL and auth shape), then pull it through Step 2's no-recipe path. Platforms
whose data is not customer voice (commerce, analytics, ads infra, internal comms) stay out
of scope regardless of reachability. Priority when both kinds are reachable: handle the
recipe'd platforms first, then the no-recipe ones - and a platform that has a recipe is
always pulled through its recipe, never freelanced through the no-recipe path.

## Step 2 - Pull with the platform recipe

Follow the recipe first: run its discovery step when it has one (Trustpilot businessUnitId,
Yotpo appKey, Okendo storeId, Stamped storeHash), then page through the list endpoint with
the recipe's pagination style, applying the date bound.

For support platforms (Gorgias, Intercom, Zendesk), also fetch each conversation's messages
so the file body can carry the full conversation.

**The data is the mandate; the recipe is guidance.** Many recipes are doc-grounded and the
platform's live API is the truth. When reality differs from the recipe - an endpoint moved,
a field is named differently, pagination works another way - adapt from the live payload and
the platform's docs and **keep pulling**. Never abort or stall a pull because a recipe is
stale or incomplete. Specifically:

- A recipe field name that does not exist in the real payload -> find the equivalent field
  and use it; if there is no equivalent, write `null` and move on.
- An endpoint that 404s -> probe the platform's current API for the listing that returns
  the same data; use it.
- Unknown pagination -> discover it from the response shape (cursor, page number, next
  link) and page it fully.
- Record every deviation in the run report (what the recipe said, what the API actually
  was) so the recipe gets corrected.

**No recipe at all? Same job, live-first.** A VoC platform with no section in
`references/platform-recipes.md` is pulled the same way a stale recipe is handled - from
the live API, start to finish: find the platform's listing endpoints for its customer-voice
data (its API docs and the registry guide are the sources), discover pagination from the
response shape, apply the date window client-side unless a server-side bound exists, and
map the real payload onto the unified record - `source_type` is whichever of the four
existing types the data actually is (survey responses are `review` when rated,
`support_conversation` when conversational), the platform's registry slug is the folder
and `source_platform`, and anything org-specific rides in `custom`. Pull the raw data you
find. Report it as "no recipe - live-adapted" with the calls used, so a recipe can be
written from the run.

What never flexes: the hard boundaries (read-only, PII rules, bounded windows), the output
contract (unified record fields, file shape, id-keyed paths), and honest coverage reporting.
The only legitimate reasons to stop are auth that fails, an API the org's plan does not
expose, or a hard boundary - and each of those is reported as an explicit gap, never
silently. A missing recipe is never a reason to stop.

## Step 3 - Write the files

### Folder convention

Root: `/agent/brain/data-sources/voc/<platform>/` - all VoC pulls live under the shared
`voc/` parent, one flat folder per platform, no type subfolders. Use the platform's registry
slug as the folder name (`judge_me`, `gorgias_oauth`, ...; use `meta-ads` for ad comments).
The filename prefix carries the source type:

- Reviews: `/agent/brain/data-sources/voc/<platform>/review-<external_id>.md`
- Support tickets/conversations: `/agent/brain/data-sources/voc/<platform>/ticket-<external_id>.md`
- Ad comments: `/agent/brain/data-sources/voc/meta-ads/comment-<external_id>.md`
- Community posts/comments (Reddit): `/agent/brain/data-sources/voc/reddit/post-<external_id>.md`
  and `/agent/brain/data-sources/voc/reddit/comment-<external_id>.md`

Every path is keyed by the item's `external_id` and nothing else - this is the contract
that re-pull dedupe, ticket overwrite, and the recurring-sync incremental window all depend
on, so it holds even when the org brain has an existing folder convention under
`data-sources/`: adopt the surrounding folder layout if one exists, but keep the id-keyed
filenames, and say so in the report. Do not invent additional hierarchy beyond the above.

Re-pull write policy, per source type:

- **Reviews**: immutable at the source - skip files that already exist.
- **Support tickets**: live over time - overwrite the ticket's file when the source shows a
  fresher `updated_at` or more messages.
- **Ad comments and community posts**: content is fixed but engagement mutates (reactions,
  reply counts, scores) - overwrite when the item is inside the run's pull window, skip
  when it is older than the window.

The id-keyed path is what makes every overwrite land on the same file.

### File format

Every file has the same three-part layout, top to bottom (copyable skeletons for all three
source types are in `templates/`):

1. **Headline + human header** - an `# H1` identity line, then a block of bold-label lines
   (`**Label:** value`, each line ending with two trailing spaces so markdown keeps the line
   breaks). The header is a human-readable *projection* of the metadata for that source
   type - humanized values (`No` instead of `false`, `—` for empty), only the fields that
   are meaningful for the item, and every key in `custom` surfaced as its own label (that is
   where org-specific lines like `Category` / `Customer tier` come from). It is never the
   source of truth; the metadata block below is.
   - Reviews: `# Review #<external_id> - "<title>" <stars>` (`★`/`☆` out of 5; omit the
     quoted title when null). Labels: Platform, Rating, Reviewer, Date, Product, Verified
     buyer.
   - Support: `# Ticket #<external_id> - Re: <subject>`. Labels: Platform, Date, Status,
     Channel, Customer, each `custom` key, Tags, Messages (count + last activity).
   - Ad comments: `# Ad comment #<external_id>`. Labels: Platform (facebook/instagram),
     Author, Date, Reactions, Replies, and In reply to when `parent_ref` is set.
   - Community posts: `# Reddit post — "<title>"` (comments: `# Reddit comment #<id>`).
     Labels: Subreddit, Author, Date, Upvotes, Replies, and In reply to for comments.
2. **The content**, between two `---` rules: the review text as plain prose, the **full
   conversation** for support items (one `### <author> (<role>) - <timestamp>` section per
   message, in order), or the comment text.
3. **The metadata block** - a collapsed section, exactly:

   ```
   <details>
   <summary>Metadata (unified VoC record)</summary>

   [fenced yaml block]

   </details>
   ```

   The yaml inside is the machine contract downstream packages parse. It is ONE flat record
   shape for every VoC item. **All fields are always present; use `null` when the source
   lacks the concept.** Never drop a field and never add org-specific fields at the top
   level (org-specific platform fields ride in `custom`). Keep the blank lines around the
   fenced block - markdown inside `<details>` needs them.

Do NOT write the raw platform payload into the file. Map the recipe's fields, keep anything
org-specific in `custom`, and leave the rest of the payload behind.

### The unified metadata record

Common fields (every item):

| Field | Meaning |
|---|---|
| `source_platform` | Registry slug (`judge_me`, `gorgias_oauth`, `meta-ads`, ...) |
| `source_type` | `review` \| `support_conversation` \| `ad_comment` \| `community_post` |
| `external_id` | The platform's id for the item |
| `created_at` | ISO 8601 |
| `title` | Review title / support subject; null when absent |
| `body` | Always populated in the file body section (see below), not duplicated in the metadata block |
| `author_name` | Reviewer/customer/commenter display name |
| `author_contact` | **Always null for now** (PII policy pending) |
| `reply_count` | Number of replies/messages **beyond the root item** (a 4-message ticket has `reply_count: 3`); null when unknown |
| `parent_ref` | For ad-comment replies: the parent comment's `external_id`. Null for root items. |
| `source_url` | Link back to the item on the platform. Set it only from the recipe's `source_url` mapping; most platforms provide none in the list payload - then it is null. Never invent a URL pattern. |

Review fields (null for support and ad comments):

| Field | Meaning |
|---|---|
| `rating` | 1-5 integer. Intercom CSAT (`conversation_rating`) maps here too. |
| `product_ref` | Platform product reference. Null for Trustpilot (company-level reviews). |
| `verified` | Verified-buyer boolean |

Support-conversation fields (null for reviews and ad comments):

| Field | Meaning |
|---|---|
| `status` | open/closed/resolved <- Gorgias `status`, Intercom `state` |
| `channel` | email/chat/phone/social <- Gorgias `channel`/`via` |
| `tags` | List of tag names <- Gorgias `tags[]` (e.g. `csat_excluded`) |
| `updated_at` | ISO 8601 - tickets live over time |
| `custom` | Pass-through object of platform custom fields <- Gorgias `custom_fields`, Intercom `custom_attributes`. Carry keys as-is; do not enumerate or rename. |

Ad-comment and community-post fields (null elsewhere):

| Field | Meaning |
|---|---|
| `reactions_total` | Total reactions on the comment, or upvotes/score for community posts |

`body` is the file's content section (part 2 of the layout), not a yaml key - it is the one
template field that lives outside the metadata block.

Per-platform field mappings (`rating` <- Judge.me `rating` / Trustpilot `stars` / Yotpo
`score` / Stamped `reviewRating`, and so on) are in the recipes reference - each platform
adapter is a field-mapping exercise, not design work.

## Set up the recurring sync

All pulling happens through one daily routine per connected platform (`voc-sync-<platform>`).
**Setup runs when this package finishes installing (the install is the ask) or when asked
directly** - never at any other unprompted moment. When triggered, do this for each
available VoC platform - recipe or no recipe (Step 1's scope rule), and available means
the org can reach it by any path (OAuth connection, stored API key, or Motion native;
Step 1 resolves which): run
`routine list --search "voc-sync-<platform>"` - routine absence is what needs setup, not
folder state:

- **Routine exists** -> do nothing (already set up).
- **Routine absent** -> create it, kick its first run, and tell the user. Exactly this:

1. Create (fill in the real current conversation id for `<conversation-id>`; keep the cron
   and names exactly as written):

   ```
   routine add --name "voc-sync-<platform>" \
     --delivery "Daily incremental success: no notification - the files are the deliverable. On the first fully covered backfill across any voc-sync-* routine, if /agent/brain/_changelog.md does not already contain a voc-audit-offer entry, send one brief note to web conversation <conversation-id>: name the source that finished, say the customer voice is ready, and ask 'Would you like me to run a Voice of Customer Audit?' Then append a dated voc-audit-offer entry to /agent/brain/_changelog.md. Never run the audit without a person's yes. If the run fails, a platform is disconnected, or coverage is incomplete, send a brief note to the same conversation." \
     --prompt "Run the voc-data-pull skill for <platform> as a recurring sync run, following the skill's Recurring sync rules exactly - they define the pull window, account iteration, disconnect handling, and coverage reporting." \
     --cron "0 6 * * *"
   ```

2. Kick the first sync run now (it happens in the background; the window rules below make
   it a full backfill when no files exist yet, incremental otherwise):

   ```
   routine run --id <routine-id>
   ```

3. Tell the user in one or two sentences: the initial pull is running in the background and
   the data stays updated daily. Explain that once the first full backfill is ready, Runneth
   will offer a manual Voice of Customer Audit. Do not run or present the audit now, and do
   not mention routine mechanics unless asked.

**Never run the pull inside the user's conversation.** All pulling happens in the routine's
runs; a one-off refresh beyond the daily cadence is `routine run --id <routine-id>`.

**Key-auth gate (junip, reviews_io, okendo, stamped, and any key-stored platform):** the
key is per-customer, so before creating its routine verify access with one bounded call
(junip: `GET /v1/stores`; reviews_io: the merchant reviews list; okendo: `GET /v1/stores`;
no-recipe platforms: the smallest listing call the registry guide or API docs name); if it
fails, tell the user the key needs replacing and create nothing for that platform.

## Recurring sync runs

When you are executing one of those routine runs, these rules apply on top of the normal
skill flow:

- **Pull window** (this is what makes runs incremental - id-keyed files only dedupe
  writes, they do not shrink API paging):
  - `/agent/brain/data-sources/voc/<platform>/` empty -> pull the trailing 12 months (this
    run is the backfill).
  - Otherwise -> pull from the **newest existing item's `created_at` minus 2 days**
    (overlap for safety; self-healing across paused or failed runs), never further back
    than 12 months. For support tickets, use the platform's `updated_at` bound where the
    recipe has one, so updated conversations are re-pulled and overwritten.
- **Iterate every connected account** of the platform - a second account connected later
  must not be stranded by the routine-exists no-op.
- **Disconnected platform** -> do nothing except say so in the run summary. Do not pause
  or cancel the routine; reconnecting self-heals (the connect flow re-fires, the routine
  already exists, the next run resumes).
- **Delivery**: daily incremental success is silent - the files are the deliverable and the
  run summary is recorded in history. The first `voc-sync-*` run to complete full backfill
  coverage sends one offer to the delivery conversation: "Would you like me to run a Voice
  of Customer Audit?" Before sending, check `/agent/brain/_changelog.md` for a
  `voc-audit-offer` entry; if found, stay silent. After sending, append a dated
  `voc-audit-offer` entry naming the source whose backfill completed. This is an offer only:
  never run the audit until a person says yes. Failures, disconnects, and incomplete
  coverage get a brief note to the delivery conversation.
- Everything else - boundaries, recipes, file format, coverage reporting - is the normal
  skill contract.

## Step 4 - Report

After the pull, report: platform, account used, date bound, item count written, folder path,
whether the full date window was covered, and any items skipped. If a run hit the page cap,
report the batches used and confirm coverage continued to the cutoff. If a run ends before
the window is covered, state "coverage stopped at <oldest covered date>" per account in the
run summary - the next run reads it from routine history and resumes from that date before
applying the normal incremental window. If the platform recipe
was doc-grounded (not live-verified), say which calls you verified live during this pull.

## Known v1 gaps - state these honestly when relevant

- **Per-platform evidence and caveats live in one place: each recipe's header and bullets
  in `references/platform-recipes.md`** (live-verified vs registry-verified vs
  doc-grounded, plan gates, key requirements, org-specific pull targets, API limits). Read
  the target platform's recipe before promising data, and state its evidence level and
  caveats honestly when relevant. Do not restate them here.
- **Template deviation, pending sign-off**: the proposed unified template lists a `raw`
  (untouched payload) column; this package deliberately does not persist raw payloads in
  files - leaner files, and no platform PII stored beyond what the mapped fields carry. If
  the template sign-off insists on `raw`, the file format gains a collapsed raw-payload
  section back.
