---
name: voc-data-pull
description: |
  Pull raw voice-of-customer data - product reviews, support conversations, and ad comments -
  from a connected VoC platform into standardized files in the org's brain, one file per
  review/ticket/comment. Use when a reviews or support platform (Judge.me, Trustpilot, Yotpo,
  Junip, Okendo, Stamped, Gorgias, Intercom) is connected and its data should land in files,
  or when the user asks to "pull the reviews", "dump the reviews", "pull support tickets",
  "sync customer conversations to files", or "run the VoC data pull".
  Do NOT use for analyzing reviews (analyzing skill), building integration guides, or one-off
  API questions about a platform.
---

# VoC Data Pull

Pull raw voice-of-customer (VoC) items from a connected platform and write them into the
org's brain as standardized files: **one file per review, support ticket/conversation, or ad
comment**, each with a metadata header and the content body. Creative strategy packages build
on these files, so shape consistency matters more than volume.

## When to use

- A VoC platform was just connected (the platform's package intent installed this package)
  and a CSM or user asks to pull its data.
- The user asks to refresh or extend an existing VoC pull.
- The user asks for customer reviews/support conversations "in files" or "in the brain".

Run one platform per pull unless asked otherwise. Confirm the platform and, when relevant,
the date range before starting.

## Hard boundaries

- **Read-only against platforms.** List/read endpoints only. Never write, reply, or delete
  through a VoC platform API.
- **Bounded pulls.** Default to the trailing 12 months and cap paging (see per-platform page
  caps in the recipes). Only Yotpo bounds by date server-side; everywhere else, page in
  newest-first order where supported and stop client-side once items are older than the
  cutoff.
- **Raw data files are separate from integration guides.** Never write pulled data into
  `/agent/brain/integrations/<source>/` - the integration guide spec explicitly forbids raw
  dumps in guides. VoC data lives only under `/agent/brain/data-sources/`.
- **PII: leave `author_contact` null.** The unified template keeps the field, but the policy
  call on storing customer emails is pending. Do not populate it until told the policy allows
  it.

## Step 1 - Resolve the platform and connection path

Two connection paths exist and the pull mechanics differ:

| Path | Platforms | How to call the API |
|---|---|---|
| Pipedream OAuth | `judge_me`, `trustpilot`, `yotpo`, `gorgias_oauth`, `intercom`, `junip` (keys-auth in Pipedream) | `integrations` CLI: check `integrations status --app <slug>`, pick the account with `integrations accounts --app <slug>`, then `integrations proxy --app <slug> --account <accountId> --method GET --path <path>` (or the registered app command) |
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

Root: `/agent/brain/data-sources/<platform>/`. Use the platform's registry slug as the folder
name (`judge_me`, `gorgias_oauth`, ...; use `meta-ads` for ad comments).

- Reviews: `/agent/brain/data-sources/<platform>/reviews/review-<external_id>.md`
- Support tickets/conversations: `/agent/brain/data-sources/<platform>/daily/<pull-date>/ticket-<external_id>.md`
  (the Ramy Brook Gorgias precedent; `<pull-date>` is the pull run date, `YYYY-MM-DD`)
- Ad comments: `/agent/brain/data-sources/meta-ads/comments/comment-<external_id>.md`

If the org brain already has an established convention under `data-sources/`, follow the
existing convention instead and say so. The exact convention is pending confirmation from
creative strategy; do not invent additional hierarchy beyond the above.

Re-pulls: reviews and comments are immutable - skip files that already exist. Support tickets
live over time - re-writing a ticket file with fresher `updated_at`/messages is correct.

### File format - the unified metadata template

Every file is markdown: YAML frontmatter (the metadata header), then the body. The
frontmatter is ONE flat record shape for every VoC item. **All fields are always present;
use `null` when the source lacks the concept.** Never drop a field and never add org-specific
fields at the top level (org-specific platform fields ride in `custom`).

Common fields (every item):

| Field | Meaning |
|---|---|
| `source_platform` | Registry slug (`judge_me`, `gorgias_oauth`, `meta-ads`, ...) |
| `source_type` | `review` \| `support_conversation` \| `ad_comment` |
| `external_id` | The platform's id for the item |
| `created_at` | ISO 8601 |
| `title` | Review title / support subject; null when absent |
| `body` | Always populated in the file body section (see below), not duplicated in frontmatter |
| `author_name` | Reviewer/customer/commenter display name |
| `author_contact` | **Always null for now** (PII policy pending) |
| `reply_count` | Number of replies/messages beyond the root item; null when unknown |
| `parent_ref` | For ad-comment replies: the parent comment's `external_id`. Null for root items. |
| `source_url` | Link back to the item on the platform, when the platform provides one |

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

Ad-comment fields (null elsewhere):

| Field | Meaning |
|---|---|
| `reactions_total` | Total reactions on the comment |

Body and raw payload, after the frontmatter:

- `## Content` - the review text, or the **full conversation** for support items (one
  `### <author> - <timestamp>` subsection per message, in order), or the comment text.
- `## Raw payload` - the untouched platform payload for the item as a fenced `json` block.
  The template is never lossy; keep the raw payload even when it repeats mapped fields.

Copyable file skeletons are in `templates/review.md` and
`templates/support-conversation.md` in this skill folder. Per-platform field mappings
(`rating` <- Judge.me `rating` / Trustpilot `stars` / Yotpo `score` / Stamped `reviewRating`,
and so on) are in the recipes reference - each platform adapter is a field-mapping exercise,
not design work.

## Step 4 - Report

After the pull, report: platform, account used, date bound, item count written, folder path,
and any items skipped or pages capped. If the platform recipe was doc-grounded (not
live-verified), say which calls you verified live during this pull.

## Known v1 gaps - state these honestly when relevant

- **Junip**: no working API key verified yet; the recipe is doc-grounded and the pull must
  start with a bounded verification call.
- **Okendo / Stamped**: need a customer API key stored as a secret before any pull.
- **Trustpilot / Yotpo**: recipes are doc-grounded; verify grant coverage and the discovery
  step on first connect before promising data.
