# Integration Type Protocols

> Referenced by integration-onboarding and integration-activation.
> When an integration doesn't fit a type cleanly, surface it, evaluate,
> and add a new type rather than forcing a bad fit.

---

## How to identify the type

Read the integration name, the official docs summary, and any context
from the conversation. Ask: what is the primary job this integration does?

| If the primary job is... | Type |
|---|---|
| Ad performance data — spend, impressions, clicks, conversions, creative metrics | Type 1 — Performance data platform |
| Attribution — cross-platform ad tracking, MTA, unified ROAS | Type 2 — Attribution / cross-platform join |
| Adding a capability or enrichment — research, AI, point-in-time data | Type 3 — Capability tool |
| Org context — docs, projects, tasks, team communication | Type 4 — Workspace / organizational |
| Customer or revenue data — CRM, e-commerce, pipeline, orders | Type 5 — Customer / business intelligence |

When in doubt, look at the data objects the API returns. Ad objects with
metrics → Type 1. Attribution events by ad ID → Type 2. Document objects
or task objects → Type 4. Contact/deal/order objects → Type 5.

---

## Type 1 — Performance Data Platforms

**Examples:** Meta Ads, TikTok Ads, Google Ads, Snapchat Ads, Pinterest Ads,
LinkedIn Ads, YouTube Ads

**Primary job:** Enable performance analysis — what's working, at what cost,
with what efficiency across creatives, campaigns, and time periods.

**What makes this type hard:** Large datasets with many metrics, aggressive
rate limits, metrics that aren't always present (null on low-spend ads),
date window restrictions, inconsistent field naming across platforms.

### Storage protocol

Design the schema before building anything. The schema drives the query library.

Core tables:
```sql
ads (
  ad_id TEXT PRIMARY KEY,
  workspace_id TEXT,
  name TEXT,
  format TEXT,         -- video/image/carousel
  status TEXT,
  ad_type TEXT,
  launch_date TEXT,
  ad_text TEXT,
  call_to_action TEXT,
  landing_page TEXT,
  thumbnail_url TEXT,
  synced_at TEXT
)

ad_metrics (
  ad_id TEXT,
  date TEXT,           -- YYYY-MM-DD for daily metrics
  period TEXT,         -- 'last_7d', 'last_30d', etc for aggregate pulls
  metrics_json TEXT,   -- full metrics blob, queryable via json_extract
  synced_at TEXT,
  PRIMARY KEY (ad_id, period)
)

campaigns (
  campaign_id TEXT PRIMARY KEY,
  name TEXT,
  status TEXT,
  objective TEXT,
  synced_at TEXT
)

sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT,
  date_range TEXT,
  rows_synced INTEGER,
  synced_at TEXT
)
```

FTS5 index on ad name, copy, landing page for text search.

### Required query templates

- `top-by-metric.sql` — top N ads by any insight metric
- `period-shift.sql` — period-over-period delta for any metric
- `stale-active.sql` — active ads below engagement threshold
- `concept-breakdown.sql` — metrics aggregated by ad name pattern
- `funnel-breakdown.sql` — hook → hold → click → convert ratios per ad
- `format-comparison.sql` — average metrics by ad format

**Sync:** `python3 sync.py --preset last_30d`
**Health:** `python3 health.py`
**Custom SQL:** `sqlite3 store.db "SELECT ..."` — agent composes on the fly

### Common quirks by platform and standard solutions

**Null metrics on low-impression ads**
- Symptom: thumbstop_ratio, hold_rate, etc. return null for ads with <500-1000 impressions
- Standard solution: calculate from raw counts when available (e.g. `3s_video_views / impressions`). If raw counts also missing, exclude from ratio analysis with a note in output, don't surface as an error.

**Rate limits lower than documented**
- Symptom: 429 errors before reaching documented limit
- Standard solution: implement exponential backoff with jitter (start at 1s, max 60s). Cache aggressively in SQLite to minimize repeat calls.

**Date window restrictions**
- Symptom: API rejects ranges over 90 days even when docs say 365
- Standard solution: chunk the request into multiple windows, merge client-side. Transparent to user.

**Inconsistent metric naming**
- Symptom: same metric has different field names across API versions or endpoints
- Standard solution: normalize in the client layer with a field alias map. User always sees the canonical name.

**Campaign hierarchy fan-out**
- Symptom: getting all ads requires paginating through campaigns → adsets → ads
- Standard solution: use the grouped ads endpoint if available; otherwise parallelize hierarchy traversal with controlled concurrency.

---

## Type 2 — Attribution / Cross-Platform Join

**Examples:** Northbeam, Triple Whale, Rockerbox, Hyros, Elevar, RedTrack,
any MTA or multi-touch attribution platform

**Primary job:** Merge the ad platform's view of performance with the attribution
tool's view to get a unified, deduplicated picture per ad.

**What makes this type hard:** The join key between platforms is almost never
clean. Ad IDs may not match. Ad names get modified. Attribution windows differ.
The same conversion can be counted differently by each platform.

### The joining protocol

**Step 1 — Find the join key**
Try in this order:
1. Exact ad ID match (most reliable, often unavailable)
2. UTM parameter match (utm_content or utm_campaign often carries ad ID)
3. Ad name exact match
4. Ad name fuzzy match (normalize: lowercase, strip punctuation, collapse whitespace)

Document which join key is available for this specific integration.

**Step 2 — Handle join key failures**
Some ads will always fail to match. Standard handling:
- Unmatched platform ads: include in output with attribution columns as null
- Unmatched attribution rows: flag as `orphaned_attribution` — spend without a known ad
- Never silently drop rows from either side

**Step 3 — Handle metric definition differences**
The same metric (e.g., "purchase") is defined differently by each platform.
Document both definitions explicitly in the practical guide.
Add a `delta_pct` column in the unified view showing the divergence.

### Storage protocol

```sql
ad_platform_metrics (
  ad_id TEXT,
  ad_name TEXT,
  platform TEXT,       -- 'meta', 'tiktok', etc
  period TEXT,
  metrics_json TEXT,
  synced_at TEXT,
  PRIMARY KEY (ad_id, platform, period)
)

attribution_metrics (
  ad_id TEXT,          -- join key (may be null if only name match available)
  ad_name TEXT,
  attribution_source TEXT,  -- 'northbeam', 'triple_whale', etc
  period TEXT,
  metrics_json TEXT,
  synced_at TEXT,
  PRIMARY KEY (ad_name, attribution_source, period)
)

unified_view AS (
  -- materialized by the reconcile command, not a live view
  -- one row per ad per period with both sides merged
)
```

### Required query templates

- `unified-view.sql` — platform + attribution metrics joined per ad
- `reconcile.sql` — ads where platform and attribution diverge by > N%
- `orphaned.sql` — attribution rows that couldn't be matched to a platform ad
- `roas-comparison.sql` — platform ROAS vs attribution ROAS side by side

**Sync:** `python3 sync.py --kind platform` and `python3 sync.py --kind attribution`
**Health:** `python3 health.py` — includes join key validation

### Common quirks and standard solutions

**No shared ad ID**
- Standard solution: build a name-normalization function. Test it against a sample of 50 ads before declaring the join viable.

**Attribution window mismatch**
- Symptom: 7-day attribution in platform vs 1-day in attribution tool
- Standard solution: always show both windows in unified output. Never aggregate across mismatched windows.

**Duplicate conversion counting**
- Symptom: same purchase counted by both platforms, inflating totals
- Standard solution: use attribution tool as the source of truth for conversions, platform as source of truth for spend/impressions. Document this clearly.

---

## Type 3 — Capability / AI Tools

**Examples:** Perplexity, OpenAI, Anthropic, research APIs, enrichment services,
any tool that adds a specific capability or returns point-in-time context

**Primary job:** Answer a specific question or perform a specific task on demand.
Not a data source to store and query — a capability to call.

**What makes this type different:** Stateless by nature. No sync needed.
The value is in calling the right capability at the right moment, not in
building a local store.

### Setup protocol

- Understand the one or two primary capabilities being added
- Document the call pattern precisely: input shape, output shape, latency
- Identify when in a workflow this capability should be invoked (proactively by Runneth, or on request)
- No data layer needed unless the capability will be called programmatically more than once a week

### Common quirks and standard solutions

**Response format inconsistency**
- Standard solution: normalize output in a wrapper before surfacing. User sees a consistent structure.

**Rate limits on research APIs**
- Standard solution: cache responses in brain files with a TTL. Avoid repeat calls for identical queries within the cache window.

**Context window limits**
- Standard solution: chunk large inputs, merge outputs. Transparent to user.

---

## Type 4 — Workspace / Organizational

**Examples:** Notion, Google Drive, GitHub, Linear, Asana, Jira, Slack,
any platform where the team does their work

**Primary job:** Bidirectional — pull organizational context into the brain,
push outputs and artifacts back to where the team works.

**What makes this type hard:** Structure varies dramatically by org. The same
platform used by two teams looks completely different. Permissions are complex.
There's a lot of noise alongside valuable signal.

### Setup protocol

The activation's structural detective work is the primary value here.
The context sweep is heavier than any other type.

Pull → classify → disperse:
- SOPs and process docs → brain, Layer 1 for relevant session types
- Project/task status → brain, checked on relevant conversations
- Team context → team files, loaded with person
- Historical decisions → brain, Layer 2 indexed

Write-back targets:
- Identify where outputs should go (which Notion workspace, which Drive folder, which Linear team)
- Document the write target in the activation plan
- The sync script or activation should handle pushing for the most common output types

### Common quirks and standard solutions

**Nested permission structures**
- Standard solution: test permissions with a probe call before attempting write. Fail gracefully with a specific message about which permission is needed.

**Stale/large content**
- Standard solution: prioritize by recency and activity. Files not touched in 90+ days are sweep noise unless explicitly named.

**Write format requirements**
- Symptom: Notion blocks, Drive MIME types, etc. have format requirements that aren't obvious
- Standard solution: normalize content to the platform's required format in the client. User provides markdown or plain text; client handles the conversion.

---

## Type 5 — Customer / Business Intelligence

**Examples:** Salesforce, HubSpot, Shopify, Stripe, WooCommerce,
any platform holding customer, revenue, or pipeline data

**Primary job:** Enable queryable business context — who are the customers,
how are deals moving, what's the revenue picture.

**What makes this type hard:** Sensitive data requiring careful handling.
Complex object relationships (contacts, companies, deals, products all relate
to each other). Export/sync volumes can be large.

### Storage protocol

```sql
customers (
  customer_id TEXT PRIMARY KEY,
  name TEXT, email TEXT, company TEXT,
  segment TEXT, status TEXT,
  created_at TEXT, synced_at TEXT
)

deals (
  deal_id TEXT PRIMARY KEY,
  customer_id TEXT,
  name TEXT, stage TEXT, value REAL,
  created_at TEXT, closed_at TEXT, synced_at TEXT
)

revenue_events (
  event_id TEXT PRIMARY KEY,
  customer_id TEXT,
  event_type TEXT,    -- purchase/subscription/refund
  amount REAL,
  occurred_at TEXT,
  synced_at TEXT
)
```

### Required query templates

- `pipeline-health.sql` — deals by stage with value totals
- `revenue-trend.sql` — revenue by period
- `churn-signals.sql` — customers with failure or downgrade patterns
- `segment-breakdown.sql` — metrics by customer segment

**Sync:** `python3 sync.py --kind customers` and `python3 sync.py --kind revenue`
**Health:** `python3 health.py` — includes privacy summary on first run

### Privacy handling (required)
Store minimum necessary fields. Note in the practical guide what is stored
and why. The health check outputs a privacy summary listing what is stored
and why on first run — confirm it's intentional.

---

## New type discovery

When an integration doesn't fit cleanly:

1. Name the primary job in one sentence
2. Identify the storage requirement (SQL, document, stateless, join)
3. Identify the primary access pattern (query, sync, call-on-demand, bidirectional)
4. Propose a type name and add it here

Examples of integrations that might not fit cleanly:
- **Ad creative libraries** (DAM platforms, Frame.io): primarily asset storage with metadata — closer to Type 4 but with binary asset handling
- **Competitive intelligence** (Semrush, SimilarWeb): research + analytics hybrid — Type 3 with Type 1 storage characteristics
- **Survey/feedback platforms** (Typeform, Qualtrics): structured response data — Type 5 with custom schema

When in doubt, propose the hybrid and document the reasoning.
