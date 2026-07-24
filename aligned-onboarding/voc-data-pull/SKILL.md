---
name: voc-data-pull
description: |
  Pull raw voice-of-customer data - product reviews, support conversations, community posts,
  and ad comments - from an available VoC platform into standardized files in the org's brain,
  one file per review/ticket/post/comment. Use when a covered VoC platform (the Step 1 table:
  Judge.me, Trustpilot, Yotpo, Junip, Okendo, Stamped, Gorgias, Intercom, Reddit) is reachable
  by any path - OAuth connection, stored API key, or Motion native - and its data should land
  in files, or when the user asks to "pull the reviews", "dump the reviews", "pull support
  tickets", "sync customer conversations to files", or "run the VoC data pull".
  Do NOT use for analyzing reviews (analyzing skill), building integration guides, or one-off
  API questions about a platform.
---

# VoC Data Pull

Pull raw voice-of-customer (VoC) items from a connected platform and write them into the
org's brain as standardized files: **one file per review, support ticket/conversation, or ad
comment**, each with a metadata header and the content body. Creative strategy packages build
on these files, so shape consistency matters more than volume.

## When to use

- The team or user asks to set up the VoC data sync (directly, or as part of an
  onboarding run) -> run the "Set up the recurring sync" procedure below. Setup never
  happens unprompted.
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
  does. Use a server-side date bound where one exists (Yotpo's `updated_at_min`, Intercom's
  `POST /conversations/search`); everywhere else, page newest-first and stop once items are
  older than the cutoff. The per-run page cap in the recipes header is runaway protection
  only: hitting it means "pause, report, and continue in further batches until the window
  is covered" - never "done."
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
| Pipedream OAuth | `judge_me`, `trustpilot`, `yotpo`, `gorgias_oauth`, `intercom`, `reddit`, `junip` (keys-auth in Pipedream) | `integrations` CLI: check `integrations status --app <slug>`, pick the account with `integrations accounts --app <slug>`, then `integrations proxy --app <slug> --account <accountId> --method GET --path <path>` (or the registered app command) |
| Stored secret (customer API key) | `okendo`, `stamped` | `secure-fetch` (`n run --url <url> --secret-key <SECRET_KEY> ...`) per `/runneth/references/secure-fetch-cli--command-contracts.md`. If no stored key exists, request one via the secret-collection flow - never ask for the key in chat. |
| Motion native | Meta ad comments | `motion meta creative-comments` (no Runneth connect involved) |

Exact endpoints, pagination, discovery steps, and field mappings for every platform are in
`references/platform-recipes.md` in this skill folder. Read the recipe for the target
platform before calling anything.

## Step 2 - Pull with the platform recipe

Follow the recipe exactly: run its discovery step first when it has one (Trustpilot
businessUnitId, Yotpo appKey, Okendo storeId, Stamped storeHash), then page through the list
endpoint with the recipe's pagination style, applying the date bound.

For support platforms (Gorgias, Intercom), also fetch each conversation's messages so the
file body can carry the full conversation.

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
**Setup runs only when asked** (directly, or as part of an onboarding run) - never
unprompted. When asked, do this for each available covered platform - available means the
org can reach it by any path (OAuth connection, stored API key, or Motion native; Step 1
resolves which): run
`routine list --search "voc-sync-<platform>"` - routine absence is what needs setup, not
folder state:

- **Routine exists** -> do nothing (already set up).
- **Routine absent** -> create it, kick its first run, and tell the user. Exactly this:

1. Create (fill in the real current conversation id for `<conversation-id>`; keep the cron
   and names exactly as written):

   ```
   routine add --name "voc-sync-<platform>" \
     --delivery "No notification on success - the deliverable is the files under /agent/brain/data-sources/voc/<platform>/. If the run fails, a platform is disconnected, or coverage is incomplete, send a brief note to web conversation <conversation-id> with conversation send --to <conversation-id>." \
     --prompt "Run the voc-data-pull skill for <platform> as a recurring sync run, following the skill's Recurring sync rules exactly - they define the pull window, account iteration, disconnect handling, and coverage reporting." \
     --cron "0 6 * * *"
   ```

2. Kick the first sync run now (it happens in the background; the window rules below make
   it a full backfill when no files exist yet, incremental otherwise):

   ```
   routine run --id <routine-id>
   ```

3. Tell the user in one or two sentences: the initial pull is running in the background and
   the data stays updated daily. Do not mention routine mechanics unless asked.

**Never run the pull inside the user's conversation.** All pulling happens in the routine's
runs; a one-off refresh beyond the daily cadence is `routine run --id <routine-id>`.

**Junip gate:** junip's recipe is blocked on a dead key. Before creating `voc-sync-junip`,
verify access with one bounded call (`GET /v1/stores`); if it fails, tell the user the key
needs replacing and create nothing.

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
- **Delivery**: nothing on success - the files are the deliverable and the run summary is
  recorded in run history. Failures, disconnects, and incomplete coverage get a brief note
  to the delivery conversation named in the routine.
- Everything else - boundaries, recipes, file format, coverage reporting - is the normal
  skill contract.

## Step 4 - Report

After the pull, report: platform, account used, date bound, item count written, folder path,
whether the full date window was covered, and any items skipped. If a run hit the page cap,
report the batches used and confirm coverage continued to the cutoff. If the platform recipe
was doc-grounded (not live-verified), say which calls you verified live during this pull.

## Known v1 gaps - state these honestly when relevant

- **Junip**: no working API key verified yet; the recipe is doc-grounded and the pull must
  start with a bounded verification call.
- **Okendo / Stamped**: need a customer API key stored as a secret before any pull.
- **Trustpilot / Yotpo**: recipes are doc-grounded; verify grant coverage and the discovery
  step on first connect before promising data.
- **Reddit**: recipe is doc-grounded (registry examples, unprobed). Reddit's API caps every
  listing at ~1000 items - the coverage contract is still the full 12-month window: slice
  the window across listings and date-bounded queries per the recipe, and report any dates
  that remain unreachable as an explicit gap. Pull targets (subreddits, search queries) are
  org-specific and must be confirmed before the first pull.
- **Template deviation, pending sign-off**: the proposed unified template lists a `raw`
  (untouched payload) column; this package deliberately does not persist raw payloads in
  files - leaner files, and no platform PII stored beyond what the mapped fields carry. If
  the template sign-off insists on `raw`, the file format gains a collapsed raw-payload
  section back.
