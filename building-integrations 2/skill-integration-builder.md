---
name: integration-builder
description: |
  Builds the data layer for a connected integration: a Python sync script that
  handles API calls with quirk resolution baked in, a SQLite schema tuned to the
  integration type, a library of named SQL query templates, and a Python health
  check. No compiled binary. No Go. The agent runs everything directly.

  This replaces the CLI factory. The insight: for an agent-driven workflow, saved
  SQL queries are strictly better than CLI commands — more flexible, readable,
  composable, and editable on the fly without rebuilding anything.
---

## What gets built

```
/agent/brain/integrations/<name>/
  sync.py          — pulls data from the API into SQLite (handles auth, rate limits, quirks)
  schema.sql       — SQLite schema tuned to the integration type
  health.py        — auth + API + store health check, surfaces unhandled quirks
  store.db         — the SQLite database (created on first sync)
  queries/
    <name>.sql     — one file per named query pattern, self-documenting
```

The agent runs everything with `bash`:
```bash
python3 /agent/brain/integrations/<name>/sync.py --preset last_30d
sqlite3 /agent/brain/integrations/<name>/store.db < /agent/brain/integrations/<name>/queries/top-by-metric.sql
python3 /agent/brain/integrations/<name>/health.py
```

---

## When to build

Build when:
- The integration is Type 1 (performance data), Type 2 (attribution), or Type 5 (customer/BI)
- The team will query this integration's data more than once a week
- Compound analysis — joining, period comparison, pattern detection — is needed
- A local store would unlock queries the live API can't answer

Skip for:
- Type 3 (capability tools) — stateless, no store needed
- Type 4 (workspace/org) — context sweep is the value, not queryable metrics

---

## The quirk philosophy (enforced here)

Quirks live in `sync.py`, not in the query library.

The sync script is where auth headers get fixed, rate limits get handled, null
fields get reconstructed, and pagination gets chunked. By the time data reaches
SQLite, it should be clean and reliable. A query template should never need to
work around a platform quirk — that work is already done upstream.

Exhaust the same 8-level workaround hierarchy before adding a comment about a
limitation in a query template. If the query has to say "NOTE: this field is
sometimes null," the sync script didn't do its job.

---

## Phase 1 — Schema design

Design the SQLite schema before writing any code. The schema is the contract.
Everything else derives from it.

Read the integration type from the activation plan and apply the corresponding
schema from `/agent/brain/integrations/INTEGRATION-TYPE-PROTOCOLS.md`.

**All schemas include:**
```sql
CREATE TABLE IF NOT EXISTS sync_log (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  kind         TEXT NOT NULL,
  date_range   TEXT,
  rows_synced  INTEGER,
  duration_ms  INTEGER,
  synced_at    TEXT NOT NULL
);
```

**Type 1 — Performance data:**
```sql
CREATE TABLE IF NOT EXISTS ads (
  ad_id         TEXT PRIMARY KEY,
  name          TEXT,
  format        TEXT,
  status        TEXT,
  ad_type       TEXT,
  launch_date   TEXT,
  ad_text       TEXT,
  call_to_action TEXT,
  landing_page  TEXT,
  thumbnail_url TEXT,
  synced_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ad_metrics (
  ad_id       TEXT NOT NULL,
  period      TEXT NOT NULL,  -- 'last_7d', 'last_30d', etc.
  metrics_json TEXT NOT NULL, -- full metrics blob, queryable via json_extract
  synced_at   TEXT NOT NULL,
  PRIMARY KEY (ad_id, period)
);

CREATE VIRTUAL TABLE IF NOT EXISTS ads_fts USING fts5(
  ad_id, name, ad_text, call_to_action, landing_page,
  content='ads', content_rowid='rowid'
);
```

**Type 2 — Attribution:**
```sql
CREATE TABLE IF NOT EXISTS platform_metrics (
  ad_id       TEXT NOT NULL,
  ad_name     TEXT,
  platform    TEXT NOT NULL,
  period      TEXT NOT NULL,
  metrics_json TEXT NOT NULL,
  synced_at   TEXT NOT NULL,
  PRIMARY KEY (ad_id, platform, period)
);

CREATE TABLE IF NOT EXISTS attribution_metrics (
  ad_name           TEXT NOT NULL,
  attribution_source TEXT NOT NULL,
  period            TEXT NOT NULL,
  metrics_json      TEXT NOT NULL,
  synced_at         TEXT NOT NULL,
  PRIMARY KEY (ad_name, attribution_source, period)
);
```

**Type 5 — Customer/BI:**
Design based on the primary entities from the activation plan. Common pattern:
```sql
CREATE TABLE IF NOT EXISTS customers (
  customer_id TEXT PRIMARY KEY,
  name TEXT, email TEXT, company TEXT,
  segment TEXT, status TEXT,
  created_at TEXT, synced_at TEXT
);

CREATE TABLE IF NOT EXISTS revenue_events (
  event_id    TEXT PRIMARY KEY,
  customer_id TEXT,
  event_type  TEXT,
  amount      REAL,
  occurred_at TEXT,
  synced_at   TEXT
);
```

Write the final schema to `schema.sql`. Run it to create the database:
```bash
sqlite3 /agent/brain/integrations/<name>/store.db < /agent/brain/integrations/<name>/schema.sql
```

---

## Phase 2 — Write sync.py

The sync script is where all the hard work lives. It should be reliable,
defensive, and opinionated about what "clean data" means for this integration.

**Required sections in every sync.py:**

```python
#!/usr/bin/env python3
"""
<Integration> sync script
Pulls data from the <integration> API and writes it to the local SQLite store.

Usage:
  python3 sync.py --preset last_30d
  python3 sync.py --start 2024-01-01 --end 2024-03-31
  python3 sync.py --preset last_7d --kind adnames

Auth (environment variables required):
  <AUTH_ENV_VARS>

Store: /agent/brain/integrations/<name>/store.db
"""
```

**The auth layer — apply all known quirks immediately:**

Read the integration's `quirks.md` and apply every `handled-in-code` auth fix
directly in the `_build_headers()` function. Examples:
- Linear: no Bearer prefix on the token
- TikTok: custom header name from env
- APIs with expiring tokens: check expiry, surface warning, continue anyway

The auth layer is the first place a user could hit a problem. Fix it here first.

**Rate limit handling — always implement, never assume docs are accurate:**

```python
import time, random

def _request_with_backoff(session, method, url, **kwargs):
    """Exponential backoff with jitter. Assumes real limits may be lower than documented."""
    max_retries = 5
    base_delay = 1.0
    for attempt in range(max_retries):
        resp = session.request(method, url, **kwargs)
        if resp.status_code == 429:
            delay = (base_delay * (2 ** attempt)) + random.uniform(0, 1)
            time.sleep(min(delay, 60))
            continue
        return resp
    raise RuntimeError(f"Rate limit exceeded after {max_retries} attempts")
```

**Data normalization — clean before storing:**

For every field that community research or live verification flagged as
potentially messy:
- Null ratio fields → reconstruct from raw counts if available, store as null
  with a note in the metrics JSON if reconstruction fails
- Inconsistent field names across API versions → normalize to canonical names
- Date formats → normalize to ISO 8601
- Missing optional fields → use `None`, never a fallback value that looks real

**Sync log — always write:**

```python
def _log_sync(conn, kind, date_range, rows_synced, duration_ms):
    conn.execute(
        "INSERT INTO sync_log (kind, date_range, rows_synced, duration_ms, synced_at) "
        "VALUES (?, ?, ?, ?, datetime('now'))",
        (kind, date_range, rows_synced, duration_ms)
    )
    conn.commit()
```

**CLI-style argument parsing — keep it simple:**

```python
import argparse

parser = argparse.ArgumentParser(description='Sync <integration> data')
parser.add_argument('--preset', help='Date preset: last_7d, last_30d, last_90d...')
parser.add_argument('--start', help='Start date YYYY-MM-DD')
parser.add_argument('--end',   help='End date YYYY-MM-DD')
parser.add_argument('--kind',  default='ads', help='What to sync')
parser.add_argument('--limit', type=int, default=500)
args = parser.parse_args()
```

---

## Phase 3 — Write the query library

One `.sql` file per named query pattern in `queries/`. Each file is
self-documenting: what question it answers, what parameters it takes, example usage.

**File format:**
```sql
-- Query: <name>
-- Answers: <the specific question this query answers>
-- Parameters: <list parameters with types>
-- Example: sqlite3 store.db "SELECT * FROM (<paste_query_here>) LIMIT 10"
--
-- Note: Run sync.py first to populate the store.

SELECT ...
```

**Type 1 — Performance data queries:**

`queries/top-by-metric.sql` — Top N ads by any insight metric
`queries/period-shift.sql` — Period-over-period delta for any metric  
`queries/stale-active.sql` — Active ads below engagement threshold
`queries/concept-breakdown.sql` — Metrics aggregated by ad name pattern
`queries/funnel-breakdown.sql` — Hook → hold → click → convert ratios per ad
`queries/format-comparison.sql` — Average metrics by ad format

**Type 2 — Attribution queries:**

`queries/unified-view.sql` — Platform + attribution metrics joined per ad
`queries/reconcile.sql` — Ads where platform and attribution diverge by > N%
`queries/orphaned.sql` — Attribution rows that couldn't be matched to a platform ad
`queries/roas-comparison.sql` — Platform ROAS vs. attribution ROAS per ad

**Type 5 — Customer/BI queries:**

`queries/pipeline-health.sql` — Deals by stage with value totals
`queries/revenue-trend.sql` — Revenue by period
`queries/churn-signals.sql` — Customers with failure or downgrade patterns
`queries/segment-breakdown.sql` — Metrics by customer segment

**For the agent's use:**

Beyond the named library, the agent can and should compose custom SQL on the fly:
```bash
sqlite3 /agent/brain/integrations/<name>/store.db "
  SELECT ad_id, name,
    json_extract(metrics_json, '$.thumbstop_ratio') as thumbstop,
    json_extract(metrics_json, '$.spend') as spend
  FROM ad_metrics m
  JOIN ads a USING (ad_id)
  WHERE period = 'last_30d'
    AND json_extract(metrics_json, '$.impressions') > 1000
  ORDER BY thumbstop DESC
  LIMIT 20
"
```

The named library is for the most common patterns. Everything else is ad-hoc SQL.

---

## Phase 4 — Write health.py

A focused health check script. Runs fast. Returns a clear pass/fail.

**Checks:**
1. Required environment variables present and non-empty
2. Auth test — make one lightweight API call and confirm 200
3. Store exists and is accessible
4. Row counts per table (warns if zero — suggests sync hasn't run)
5. Last sync time (warns if > 7 days old)
6. Unhandled quirks from `quirks.md` — surface each one with workaround

**Output format:**
```
Checking <integration> integration...

  ✓ Auth: <header_name> present, token looks valid
  ✓ API: reachable (142ms)
  ✓ Store: /agent/brain/integrations/<name>/store.db
  ✓ Rows: ads=247  ad_metrics=741  sync_log=8
  ✓ Last sync: 2026-05-11 09:23 (14 hours ago)

  ⚠ Unhandled quirk: thumbstop_ratio null on low-impression ads
    Workaround: filter WHERE impressions > 1000 in queries

All checks passed (1 warning)
```

---

## Phase 5 — Index and document

**Update INDEX.md** with entries for:
- The sync script (when to run, what it pulls)
- The query library directory (Layer 2 — loaded when this integration is being analyzed)
- The health check (run before any analysis session if integration hasn't been used recently)

**Write a README.md** at `/agent/brain/integrations/<name>/README.md`:
```markdown
# <Integration> Data Layer

## Quick start
python3 sync.py --preset last_30d   # pull latest data
python3 health.py                    # verify everything is working

## Query library
ls queries/   # list available named queries
sqlite3 store.db < queries/top-by-metric.sql

## Custom SQL
sqlite3 store.db "SELECT ..."

## Schema
cat schema.sql

## Auth
<required env vars listed here>
```

---

## After build

1. Run `python3 health.py` — confirm auth and API connectivity
2. Run `python3 sync.py --preset last_7d` — confirm data flows in
3. Run one named query from `queries/` — confirm results are sensible
4. Update the activation plan with builder status
5. Update INDEX.md

---

## Skill changelog

| Date | Version | Change |
|---|---|---|
| 2026-05-11 | v1.0.0 | Initial version. Replaces Go CLI factory. Python sync script + SQLite schema + named query library + health check. Agent-native: runs directly with bash, no compilation. |
