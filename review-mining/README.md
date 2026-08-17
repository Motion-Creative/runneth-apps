# review-mining-init

A Runneth skill that pulls customer reviews from any REST API, scores and tags
every review for creative strategy value, and writes them as structured markdown
files into the org brain.

Works with any review platform that exposes a paginated JSON endpoint. Field
paths, auth headers, and pagination style are all configured at runtime -- no
code changes needed when switching sources.

---

## What It Produces

```
/agent/brain/reviews/           (or your chosen BRAIN_PATH)
  _meta.json                    last run, date range, source, total files
  _index.md                     folder map, score/tag distribution, retrieval guide
  product-slug-1/
    abc123.md
    def456.md
  product-slug-2/
    ghi789.md
```

Each `.md` file contains YAML frontmatter (`score`, `tags`, `product`,
`source`, `review_date`, `rating`, `verified_buyer`) followed by the verbatim
review body and one utility sentence describing its creative signal.

A **Weekly Review Sync** reminder is created automatically to keep the library
current without a full re-run.

---

## Installation

Copy the skill folder into the org's skills directory:

```bash
cp -r review-mining-init /agent/.agents/skills/review-mining-init
```

That's it. Runneth will detect and load the skill on the next conversation turn.

---

## Prerequisites

- The review API must be reachable over HTTPS.
- An org-level runtime secret must exist for the API key (stored by the org
  admin -- never passed as a value in chat).
- Python 3 must be available in the sandbox (it is by default).

---

## Running the Skill

Start a Runneth chat and say:

> "Run review mining init"

Runneth will ask you to confirm the connection and field mapping parameters
before pulling any data. You can accept defaults for most fields.

**Minimum required inputs:**
- `API_BASE_URL` -- the full URL to your reviews list endpoint
- `API_SECRET_KEY` -- the name of the secret in the org vault (e.g. `JUNIP_API_KEY`)
- `SOURCE_LABEL` -- a human-readable label for the source (e.g. `Junip`)

Everything else has a sensible default.

---

## Parameters Reference

### Connection

| Parameter | Default | Description |
|---|---|---|
| BRAIN_PATH | `/agent/brain/reviews` | Root folder for review files |
| DATE_CUTOFF | trailing 12 months | ISO date or "all" for full history |
| APP_NAME | `review-library` | App to rebuild cache for; "none" to skip |
| API_BASE_URL | — | Full URL to reviews list endpoint |
| API_SECRET_KEY | — | Name of the org secret holding the API key |
| AUTH_HEADER | `Authorization` | Header name for auth injection |
| AUTH_SCHEME | `Bearer` | Prefix before secret value; `""` for raw token |
| PAGINATION_STYLE | `cursor` | `cursor`, `page`, or `offset` |
| PAGE_SIZE_PARAM | `page_size` | Query param name for page size |
| PAGE_SIZE | `50` | Reviews per page |
| CURSOR_PARAM | `after` | Cursor query param name |
| CURSOR_PATH | `meta.after` | Dotted path to next cursor in response |
| PAGE_PARAM | `page` | Page number query param name |
| OFFSET_PARAM | `offset` | Offset query param name |
| RATE_LIMIT_DELAY | `0.6` | Seconds between page requests |
| SOURCE_LABEL | — | Label written into every file's frontmatter |

### Field Mappings

| Mapping | Default | Notes |
|---|---|---|
| REVIEWS_LIST_PATH | `data` | Path to the reviews array in the response |
| FIELD_ID | `id` | Review ID, used as filename |
| FIELD_BODY | `body` | Review text |
| FIELD_RATING | `rating` | Integer 1-5 |
| FIELD_DATE | `created_at` | ISO date or Unix timestamp |
| FIELD_PRODUCT_NAME | `product.name` | Falls back to FIELD_PRODUCT_FALLBACK |
| FIELD_PRODUCT_FALLBACK | `target_title` | Secondary product name path |
| FIELD_VERIFIED | `verified_buyer` | Defaults to false if missing |
| FIELD_STATE | _(empty)_ | If set, only `published` reviews are kept |

---

## Scoring

Body character length determines score. Score 1 is never written.

| Length | Score |
|---|---|
| empty / < 20 chars | 1 (skip) |
| 20-59 chars | 2 |
| 60-149 chars | 3 |
| 150-399 chars | 4 |
| 400+ chars | 5 |

---

## Tags

| Tag | When applied |
|---|---|
| `pain-point` | Keywords: struggling, chronic, nothing worked, painful, etc. |
| `trigger-moment` | Keywords: decided to try, heard about, last resort, etc. |
| `objection` | Keywords: skeptical, gimmick, too expensive, etc. |
| `transformation` | Keywords: game changer, never going back, life changing, etc. |
| `standout-language` | Score 5, or keywords: sleep like the dead, first time in years, etc. |
| `untagged` | No keyword matched |

---

## Weekly Sync

After the initial run, a **Weekly Review Sync** reminder is set for Monday
2 PM Pacific (configurable). When it fires, it will:

1. Read `_meta.json` for `last_review_date` and connection details
2. Pull only reviews newer than `last_review_date`
3. Score, tag, and write new files without overwriting existing ones
4. Update `_meta.json` and `_index.md`
5. Rebuild the app cache if an app is configured
6. Report new reviews added and surface any score-5 or standout-language
   reviews verbatim

---

## Using the Library

The fastest way to pull reviews for a creative brief:

- **Hook candidates:** look for `score: 5` + `tags: standout-language`
- **Before/after proof:** look for `tags: transformation`
- **Audience framing:** look for `tags: pain-point`
- **Purchase catalysts:** look for `tags: trigger-moment`
- **Objection handling:** look for `tags: objection`

Reference `_index.md` for the full folder map, score distribution, and
tag breakdown for the current library state.

---

## API Compatibility

Tested pagination models:

| Style | Use when |
|---|---|
| `cursor` | API returns a next-page token (Junip, Klaviyo, etc.) |
| `page` | API uses page numbers (Judge.me, Okendo, etc.) |
| `offset` | API uses numeric offset (Yotpo, custom APIs) |

If your API uses a different pattern, share a sample response in chat and
Runneth will infer the correct field paths and pagination shape.
