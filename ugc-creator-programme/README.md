# ugc-creator-programme

**A live web app for managing your UGC creator programme — VIP relationships, active ambassadors, and sourcing targets in one place.**

Once installed, your team gets a shareable link to a two-tab creator hub:
- **Who We Have Access To** — VIP/investor relationships with brief recommendations and urgency flags, plus your full active ambassador programme with discount codes and next brief suggestions
- **Creator Sourcing List** — filterable by audience persona, tier, and video confidence, with a ready-to-copy outreach DM on every card

Creator data lives in a single JSON file in the brain. Update it any time — the app picks up changes immediately with no rebuild.

**Install time:** ~5 minutes  
**Requires:** Nothing. Works in any sandbox.

---

## Setup steps

Run these commands in order after copying the use case files into your sandbox:

```bash
# 1. Build the app
app build ugc-creator-programme

# 2. Verify the build
app verify ugc-creator-programme

# 3. Get the live URL
app list
```

Then run the setup skill to populate your brand's creator data:
> "Set up the ugc creator programme"

The setup skill walks through: brand name, audience personas, selection criteria, VIP relationships, ambassador programme, and sourcing targets.

---

## What gets installed

```
/agent/brain/ugc-creator-programme/
  creators.json              ← All creator data. Edit this to update the app.

/agent/.agents/skills/setup-ugc-creator-programme/
  SKILL.md                   ← Guided setup and ongoing creator management

/agent/apps/ugc-creator-programme/
  frontend/src/main.tsx      ← React app (reads from creators.json via API)
  frontend/src/app-paths.ts  ← App path resolution
  frontend/index.html        ← Page shell (brand name token applied here)
  frontend/package.json
  frontend/vite.config.ts
  frontend/tsconfig.json
  server/src/index.ts        ← Fastify server with /api/creators endpoint
  server/src/buildeth-tools.ts
  server/src/runtime.ts
  server/src/sqlite.ts
  server/package.json
  server/tsconfig.json
  server/tsconfig.build.json
```

---

## What to customize

| Token | Required | Description | Fallback |
|---|---|---|---|
| `{{BRAND_NAME}}` | Yes | Your brand name. Appears in the app header. | — |
| `{{BRAND_SUBTITLE}}` | No | One-line subtitle shown beneath the brand name. | `Creator Programme` |

All other content (personas, creators, criteria, DMs) is configured via the setup skill and stored in `creators.json`.

---

## How Runneth uses this

### Adding a creator
> "Add [name] to the creator programme"

Runneth asks for the details, appends to `creators.json`, and confirms. The app reflects the change immediately.

### Updating a VIP brief
> "Update [name]'s brief in the creator programme"

Runneth reads `creators.json`, edits the matching VIP entry, writes it back, and confirms.

### Flagging urgency
> "Mark [name] as urgent in the creator programme — [reason]"

Runneth sets `urgency: 'urgent'` and populates `urgencyNote` on the matching VIP entry.

### Reconfiguring
> "Reconfigure the ugc creator programme" or "Set up the creator programme"

Re-invokes the setup skill from the beginning.

---

## Key API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/creators` | Returns the full `creators.json` payload. 404 if file missing, 500 if JSON invalid. |
| `GET` | `/api/health` | Health check. Returns `{ ok: true }`. |

The frontend fetches `/api/creators` on mount and renders from the response. No other API calls are made.

---

## Data file format

`/agent/brain/ugc-creator-programme/creators.json` is the single source of truth. Shape:

```json
{
  "brandName": "string",
  "brandSubtitle": "string",
  "personas": { "key": "Label", ... },
  "selectionCriteria": [{ "main": "string", "sub": "string" }],
  "disqualifiers": [{ "main": "string", "sub": "string" }],
  "tierDescriptions": { "tier1": "string", "tier2": "string", "tier3": "string" },
  "priorityCallouts": ["string"],
  "vipCreators": [VIPCreator],
  "ambassadors": [Ambassador],
  "creators": [Creator]
}
```

Full type definitions are in `frontend/src/main.tsx`.

---

## Ongoing maintenance

The app is static — it reads whatever is in `creators.json`. To keep it current:

- **After each creator outreach** — update the creator's `caveats` note with any response received
- **When a new ambassador goes live** — add to `ambassadors` with code and initial content count
- **When a VIP brief becomes urgent** — update `urgency` and `urgencyNote`
- **Monthly** — review the sourcing list for any creators who should be promoted from Tier 2 to Tier 1

Runneth can do any of these on request. Just describe what changed.

---

## Fallbacks

- **`creators.json` missing:** `/api/creators` returns 404. Re-run setup skill to recreate the file.
- **JSON invalid:** `/api/creators` returns 500 with error detail. Check for syntax errors in `creators.json`.
- **App not built:** Run `app build ugc-creator-programme` and then `app verify ugc-creator-programme`.
- **Personas not matching:** Any `arch` value in a creator entry that doesn't match a key in `personas` will still render — it just won't have a matching filter button. Add the key to `personas` to fix.

---

## Version history

| Version | Date | Notes |
|---|---|---|
| 1.0.0 | 2026-05-08 | Initial release. Two-tab app, JSON-backed creator data, setup skill, copy-to-clipboard DMs. |
