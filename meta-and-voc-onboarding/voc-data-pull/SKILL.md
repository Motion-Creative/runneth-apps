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
  Do NOT use for analyzing reviews (analyzing skill), building integration guides, or one-off
  API questions about a platform.
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
- A `voc-sync-<workspace>-<platform>` routine run is executing (the normal path - see Recurring sync
  runs below).
- The user asks to pull, refresh, or extend VoC data, or asks for reviews/support
  conversations "in files" or "in the brain". Route these through the routine, not an
  in-conversation pull: make sure `voc-sync-<workspace>-<platform>` exists (setup procedure below),
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
  <oldest covered date>" in its summary (Step 4), and the next run resumes
  from that date before the normal incremental window. This section owns the coverage
  contract; recipes only state per-platform mechanics.
- **Raw data files are separate from integration guides.** Never write pulled data into
  `/agent/brain/integrations/<source>/` - the integration guide spec explicitly forbids raw
  dumps in guides. VoC data lives only under `/agent/brain/<workspace>/data-sources/voc/`.
- **PII: leave `author_contact` null.** The unified template keeps the field, but the policy
  call on storing customer emails is pending. Do not populate it until told the policy allows
  it. Raw platform payloads are NOT persisted in output files (see the file format below), so
  do not paste payload JSON - which carries reviewer emails and other PII - into any brain
  file.

## Step 1 - Resolve the platform and connection path

Two connection paths exist and the pull mechanics differ:

| Path | Platforms | How to call the API |
|---|---|---|
| Pipedream OAuth | `judge_me`, `trustpilot`, `yotpo`, `gorgias_oauth`, `intercom`, `reddit`, `zendesk`, `klaviyo`, `attentive`, `gong`, `hotjar`, `discord`, `youtube_data`, `junip` and `reviews_io` (keys-auth in Pipedream) | `integrations` CLI: check `integrations status --app <slug>`, then `integrations proxy --app <slug> --account <pinnedAccountId> --method GET --path <path>` (or the registered app command). The account id comes from the workspace's pin (see "Pin the account" under setup), never from picking off the list at pull time. |
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

**Accounts are org-level; ownership is per workspace.** Connections live on the org's VM
with no workspace tag, and one org can hold several accounts of the same platform - or one
account genuinely shared by every workspace. Which account belongs to this workspace is
decided once, by a human, at setup ("Pin the account" below), and every pull afterwards
addresses that exact account (`--account <pinnedAccountId>`). Count is not evidence: a
single connected account may belong to a different workspace, so reachability alone never
decides ownership.

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

Root: `/agent/brain/<workspace>/data-sources/voc/<platform>/`, where `<workspace>` is the
Motion workspace this pull belongs to, slugged - lowercase, every run of characters that is not a-z or 0-9 becomes one hyphen, trim leading and trailing hyphens ("Huel EU" -> `huel-eu`, "Mr. Beast" -> `mr-beast`). **Every pull is scoped to one workspace.** The workspace folder is the boundary that
keeps two brands' customer voice apart: a pull for one workspace never writes into another's
folder, and pulls are never merged into a shared root. Items are keyed by `external_id`, so a
shared root would not overwrite - it would silently accumulate two brands' reviews into one
corpus, which is worse. Under the workspace folder, all VoC pulls live under the shared
`voc/` parent, one flat folder per platform, no type subfolders. Use the platform's registry
slug as the folder name (`judge_me`, `gorgias_oauth`, ...; use `meta-ads` for ad comments).
The filename prefix carries the source type:

- Reviews: `/agent/brain/<workspace>/data-sources/voc/<platform>/review-<external_id>.md`
- Support tickets/conversations: `/agent/brain/<workspace>/data-sources/voc/<platform>/ticket-<external_id>.md`
- Ad comments: `/agent/brain/<workspace>/data-sources/voc/meta-ads/comment-<external_id>.md`
- Community posts/comments (Reddit): `/agent/brain/<workspace>/data-sources/voc/reddit/post-<external_id>.md`
  and `/agent/brain/<workspace>/data-sources/voc/reddit/comment-<external_id>.md`

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

All pulling happens through one daily routine per connected platform (`voc-sync-<workspace>-<platform>`).
**Setup runs when this package finishes installing (the install is the ask) or when asked
directly** - never at any other unprompted moment. When triggered, do this for each
available VoC platform - recipe or no recipe (Step 1's scope rule), and available means
the org can reach it by any path (OAuth connection, stored API key, or Motion native;
Step 1 resolves which): run
`routine list --search "voc-sync-<workspace>-<platform>"` - routine absence is what needs setup, not
folder state:

- **Routine exists** -> do nothing (already set up).
- **Routine absent** -> pin the account, create the routine, kick its first run, and tell
  the user. Exactly this:

1. **Pin the account.** Resolve which account of the platform belongs to this workspace -
   by asking, never by inference:
   - OAuth path: `integrations accounts --app <slug>`, then show each account's identity
     (account name and account id) and ask. **Even when exactly one account is listed,
     ask**: "Is <accountName> the <platform> account for <workspace>? It may be shared
     with other workspaces, or this workspace's account may not be connected yet." A lone
     account can belong to a different workspace, so its existence is not an answer. The
     one exception: when the org has exactly one Motion workspace, everything on this VM
     belongs to it - pin a lone account without asking and note the auto-pin in the setup
     report. Two or more workspaces, or two or more accounts, always means asking.
   - The user names one -> that account id is the pin. Sharing is legitimate: two
     workspaces may pin the same account, each keeping its own routine and folder. If the
     user says the shared account carries more than this workspace's data (a multi-brand
     helpdesk, a multi-store review account), record the slice they name (brand, store,
     tag) and apply it as a filter in every pull.
   - The user says this workspace's account is not connected yet -> create nothing for
     this platform and record it as pending in the setup report (note that the existing
     connection belongs to another workspace). Once the account is connected, setup runs
     on ask, like any platform connected later. Never pin an account because it is the
     only one there.
   - Stored-secret path: the key is the account. Confirm ownership the same way, using
     the identity the bounded verification call returns (store name, subdomain, account
     label).
   - Motion native (Meta ad comments): no pin needed - `--workspace-id` already scopes it.

2. Create the routine. Fill in the real current conversation id for `<conversation-id>`,
   the resolved workspace folder name for `<workspace>`, the resolved workspace id for
   `<workspaceId>`, and the pinned account's name and id for `<accountName>` /
   `<accountId>`; keep the cron and the name shape exactly as written. **Every one of those
   values is written out literally, never left as a placeholder for the run to resolve:**
   routine runs execute in their own conversation with no workspace attached, so a routine
   that says "the current workspace" or "the connected account" has nothing to resolve and
   will either fail or guess. The workspace also belongs in the routine name because
   routines are VM-wide - a bare `voc-sync-<platform>` collides with another workspace's
   routine, and that collision is what mixes two brands' data:

   ```
   routine add --name "voc-sync-<workspace>-<platform>" \
     --delivery "No notification on success - the deliverable is the files under /agent/brain/<workspace>/data-sources/voc/<platform>/. If the run fails, the pinned account is disconnected, or coverage is incomplete, send a brief note to web conversation <conversation-id> with conversation send --to <conversation-id>." \
     --prompt "Run the voc-data-pull skill for <platform> as a recurring sync run for Motion workspace <workspace> (workspace id <workspaceId>). Pull only from the pinned account <accountName> (account id <accountId>): pass --account <accountId> on every integrations proxy call and never use another account of this platform, even if others are connected. Write every file under /agent/brain/<workspace>/data-sources/voc/<platform>/ and nowhere else; pass --workspace-id <workspaceId> on Motion commands that take it. Follow the skill's Recurring sync rules exactly - they define the pull window, disconnect handling, and coverage reporting." \
     --cron "0 6 * * *"
   ```

   When a slice filter was recorded at pin time, append it to the prompt as one literal
   sentence (for example "Only pull items for brand <brand>."). On the stored-secret path,
   replace the `--account` sentence with the secret key and confirmed identity ("Use the
   stored key <SECRET_KEY> for <identity>; if the key stops working, report - do not
   substitute another credential.").

3. Kick the first sync run now (it happens in the background; the window rules below make
   it a full backfill when no files exist yet, incremental otherwise):

   ```
   routine run --id <routine-id>
   ```

4. Tell the user in one or two sentences: the initial pull is running in the background and
   the data stays updated daily. Do not mention routine mechanics unless asked.

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
  - `/agent/brain/<workspace>/data-sources/voc/<platform>/` empty -> pull the trailing 12 months (this
    run is the backfill).
  - Otherwise -> pull from the **newest existing item's `created_at` minus 2 days**
    (overlap for safety; self-healing across paused or failed runs), never further back
    than 12 months. For support tickets, use the platform's `updated_at` bound where the
    recipe has one, so updated conversations are re-pulled and overwritten.
- **Pull only the pinned account** named in the routine prompt (`--account <accountId>`,
  or the named secret key). Other accounts of the same platform - including ones connected
  after setup - are never pulled by this routine: a new account belongs to whichever
  workspace confirms it in its own setup pass, not to whoever's routine runs first.
- **Pinned account disconnected** (the proxy answers that the account is not connected, or
  the stored key stops working) -> pull nothing, say so in the run summary, and send the
  failure note. Never fall back to another connected account of the platform. Do not pause
  or cancel the routine: reconnecting the same account self-heals (the routine already
  exists, the next run resumes). If the account is gone for good, the workspace re-pins
  in a new setup pass.
- **Delivery**: nothing on success - the files are the deliverable and the run summary is
  recorded in run history. Failures, disconnects, and incomplete coverage get a brief note
  to the delivery conversation named in the routine.
- Everything else - boundaries, recipes, file format, coverage reporting - is the normal
  skill contract.

## Step 4 - Report

After the pull, report: platform, account used, date bound, item count written, folder path,
whether the full date window was covered, and any items skipped. If a run hit the page cap,
report the batches used and confirm coverage continued to the cutoff. If a run ends before
the window is covered, state "coverage stopped at <oldest covered date>" in the
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
