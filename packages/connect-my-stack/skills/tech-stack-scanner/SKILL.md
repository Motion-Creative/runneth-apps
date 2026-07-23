---
name: tech-stack-scanner
description: >
  BuiltWith-style technographic detection ENGINE. Point it at a competitor's or
  prospect's domain and it returns the marketing/adtech/ecommerce stack that site is
  running. Use ONLY for competitor or standalone tech-stack research, on phrases like
  "what's <competitor> running", "builtwith for <site>", "scan <competitor>'s tech
  stack", "detect the stack on <url>". DO NOT use this skill when a customer wants to
  scan their OWN site to identify and connect their tools to Runneth, or asks to
  "connect my stack", "set up my integrations", or "what tools am I running" — that is
  the connect-my-stack skill, which calls this engine internally. If the intent is the
  customer's own onboarding or connecting tools, defer to connect-my-stack.
argument-hint: "<domain> [<domain2> ...] [--json]"
---

# Tech Stack Scanner

Replicates what builtwith.com does: fingerprint the technologies a website runs, straight
off the live site. The standalone skill is for competitor or prospect research;
`connect-my-stack` calls the same engine internally for customer onboarding.

**Two mechanisms, one detection engine:**
- **Browser capture (primary, `lib/scan.js`)** — loads the page in headless Chromium and
  records every outbound network request. This is the strongest signal because most tags
  (pixels, tag managers, chat widgets) are injected at runtime and only a real browser sees
  them fire. This is the same Playwright pattern `landing-page-summary` uses.
- **Fetch capture (fallback, `lib/fetch-capture.mjs`)** — a plain HTTPS fetch of the HTML +
  headers, parsing referenced hosts and inline snippets. No install required, runs anywhere.
  Catches most vendors (they leave a script src or inline loader in the HTML) but can miss a
  tag that is injected purely at runtime with no HTML marker.

Both write the **same capture JSON shape**, and `lib/detect.mjs` does the matching either way.

---

## When to use this vs technographic-lookup

- **tech-stack-scanner (this):** live site scan of any domain. Works for prospects and
  competitors, not just accounts in our book. Answers "what is running on their site right now."
- **technographic-lookup:** rolls up the Apollo `apollo_technologies` / `web_technologies`
  fields we pre-sync into HubSpot, joined against a HubSpot company list. Answers "which of our
  accounts use X" across the book. As fresh as the last Apollo sync.

They complement each other. Use this for a live per-domain read; use technographic-lookup for
book-wide rollups.

---

## Inputs

- One or more **domains** (bare domain or full URL; `https://` is added if missing).
- `--json` to emit the machine payload instead of the human report.
- `--customer` to remap output for the internal `connect-my-stack` onboarding flow.

If no domain is given, ask for one in chat.

---

## Phase 0 — Select a capture mode

Prefer browser capture when Playwright and Chromium are already available. Do not download
browser dependencies during a customer run. If the browser path is unavailable or fails,
fall through to fetch capture; the detection quality remains useful.

```bash
SCANNER_DIR=/agent/.agents/skills/tech-stack-scanner
WORK=./workdir/techscan && mkdir -p "$WORK"

node "$SCANNER_DIR/lib/scan.js" --check >/dev/null 2>&1
```

An exit code of zero means the browser library is visible to the installed scanner. A nonzero
exit means use fetch capture. Even after a successful check, fall back to fetch capture if the
browser launch or navigation fails. In root-run container VMs, the scanner passes
`--no-sandbox` because Chromium otherwise cannot launch; non-root environments keep the
Chromium sandbox enabled.

---

## Phase 1 — Capture

Per domain, produce a capture JSON at `./workdir/techscan/<slug>.json`.

**If the browser is available:**
```bash
node "$SCANNER_DIR/lib/scan.js" "<domain>" "$WORK/<slug>.json"
```

**Otherwise (fallback, always works):**
```bash
node "$SCANNER_DIR/lib/fetch-capture.mjs" "<domain>" "$WORK/<slug>.json"
```

---

## Phase 2 — Detect

```bash
node "$SCANNER_DIR/lib/detect.mjs" "$WORK/<slug>.json"          # human report
node "$SCANNER_DIR/lib/detect.mjs" "$WORK/<slug>.json" --json   # machine payload
node "$SCANNER_DIR/lib/detect.mjs" "$WORK/<slug>.json" --customer # onboarding view
```

The report groups detected technologies by category with the evidence that matched (network
host, JS global, header, cookie, meta, or HTML). Anything matched **only** on an HTML substring
is flagged `_(likely)_` — treat those as lower confidence. It also lists third-party hosts that
fired but matched no signature, which is your lead for extending the library.
Customer mode maps results to Runneth's customer-facing categories, uses ads-language
names, separates Meta/TikTok as Motion-provided ad platforms, and omits technical evidence
from the human report while retaining the same confidence and unmatched-host behavior.

---

## Output to the user

- Lead with the headline: platform + the few integrations that matter for the conversation
  (e.g. "Shopify store, Klaviyo for email, Meta + TikTok pixels, Yotpo reviews, Recharge subs").
- Then the grouped list. Keep low-confidence items marked as such.
- State the capture mode used. If fetch mode, add one line: runtime-injected tags with no HTML
  marker may be missed; re-run with the browser for a fuller read.
- For multiple domains, give a short per-domain block, and a shared-stack callout if comparing.

---

## Extending the signature library

`lib/signatures.json` is the brain. Each entry matches on any one of: `network` (request-host
substrings — strongest), `global` (JS `window` property names), `header` (response header
key→substring), `cookie` (cookie-name substrings), `meta` (generator content), `html` (regex on
the rendered DOM — weakest, tends to false-positive so keep tokens specific). Add a vendor by
appending an entry; use the "unmatched third-party hosts" list from a real scan to find the host
patterns worth adding. Keep `html` tokens tight (a bare `mage/` matches `image/`).

---

## Runtime notes

- Write all scratch and capture files to `./workdir/`. Never write to `/tmp/`.
- This reads public websites only; no stored secret is required.
- Detection is a fingerprint, not proof. Present it as "detected", and let the reader confirm
  anything decision-critical.
