# Meta Creative Attributes Playbook
### Step 1 of the Meta Onboarding Package

**How Runneth gets per-creative facts for a Meta account — from the creative content layer
(Cacheth), not from brain files — and detects the account's naming conventions.**

This is Step 1 of the Meta onboarding package. It runs before the Account Context Brain because
it establishes where creative facts come from and detects naming patterns — without interpreting
anything. Once done, it gives the Account Context Brain real material to work with.

> **Cacheth is the system of record for per-creative content.**
> Per-creative content (summaries, hooks, transcripts, AI tags) lives in **Cacheth**, the local
> creative cache, and is surfaced through **Knoweth**. This playbook writes no creative files,
> and nothing in the package does so on its own. Runneth saves a creative file to the brain only
> when a person explicitly asks for one — a dated snapshot that will not stay synced with the
> cache. When later citing such a file, prefer the cache for current facts.

The one-line model:

> The **Account Context Brain** tells Runneth **how to analyze** the account. The **Creative
> Attributes** step gives Runneth **the per-creative facts it needs to actually do the job** —
> via the creative content layer, one enriched record per active creative.

The Creative Attributes step does not interpret anything. Interpretation lives in the Account Context
Brain. This step only establishes access to what the Account Context Brain cannot tell it: the
creative content itself.

---

## What this produces

- A working **creative content layer**: Runneth knows what Cacheth holds and how to query it.
- A provisional **naming decode**, handed to the Account Context Brain as Field 4 proposals.
  Once confirmed, the decode lives in `/agent/brain/meta/account-context.md` — this step
  persists nothing itself.
- **No creative files** — nothing here writes per-creative content to the brain (Cacheth is the
  system of record; person-requested snapshot files are a separate, explicit ask).

---

## The creative content layer: what Cacheth holds and how to query it

Cacheth syncs each workspace's creative records from Motion automatically. A full record
(`motion cache get-creative`) holds:

- **Identity:** creative ID, workspace ID, origin, format, launch date, media URL.
- **Ad units:** every ad running the creative — ad / ad set / campaign IDs and names, active
  status, thumbnails, and the primary ad copy.
- **Glossary tags with definitions:** asset type, visual format, messaging angle, hook tactic,
  intended audience, seasonality, offer type.
- **Transcript** (video only): full text plus timed segments, language, duration.
- **Summary sections:** ad description and format; spoken / text-overlay / visual hooks with
  timestamps; a creative breakdown (scene-by-scene storyline, point of view, visuals, people,
  music, fonts); messaging and positioning (features, benefits, value props, pain points, CTA,
  offer, funnel stage); and emotional and audience insight (emotions with intensities,
  persuasion tactics, cultural context, intended audience).
- **Per-layer freshness timestamps:** when inventory, ad units, summary, transcript, and
  glossary were each last hydrated. Cite these when freshness matters to an answer.

What it does **not** hold: performance metrics or spend state. Those are always pulled live
through the motion CLI per the Data-Query Guide.

Runneth reaches this content two ways, cheapest first:

1. **Knoweth pre-context injection (passive, first priority).** Before every turn, Knoweth
   resolves the incoming query against the local index and injects matching creative chunks into
   the "Knoweth Pre-LLM Context" block. If the injected context answers the question, answer
   from it — no tool call.
2. **motion cache CLI (active, when injection is not enough).** Local, no API call:
   - `motion cache search-summaries --query "<text>" [--limit <n>]` — text search across ad
     names, ad copy, and summary content. Each match carries `creativeId`, `adNames[]`, an
     excerpt, and a relevance score — not the full record; follow up with `get-creative` for
     that.
   - `motion cache get-creative --creative-id <id>` — the complete record for one creative,
     including `adUnits[].adName`. Always the full record (no section filtering); extract the
     layer you need from the result file with `jq`.
   - `motion cache export-summaries --format jsonl` — the whole synced corpus, one record per
     creative, each carrying its `adNames[]`. `--format` is required (`duckdb` is the
     alternative when SQL-style queries suit a large corpus). The bulk path when the question
     spans the full account rather than a search match.
   - `motion cache status` — when the cache last synced and how many creatives it holds.
   - `motion cache refresh` — trigger a fresh sync from Motion to pull in newly launched
     creatives or updated summaries (the one cache command that reaches out to Motion).

   Every cache command accepts `--workspace-id <id>`; pass it explicitly per the Step 1 scope
   rule. All of these write their output to a file under `./workdir/` and return a pointer plus
   compact metadata; read the file with `jq`. Those result files are query scratch, not brain
   content.

   Flag-level detail, the full-record field layout, and `jq` extraction recipes live in the
   Cacheth Command Reference (`/agent/brain/meta-and-voc-onboarding/cacheth-command-reference.md`),
   installed beside the Data-Query Guide.

Freshness is the sync's job, not Runneth's: the cache bootstraps per workspace and keeps
hydrating in the background. If a creative seems to be missing, check `motion cache status` and
run `motion cache refresh`; if it is still absent, the live path is `motion meta insights
--summary-sections` per the Data-Query Guide (the same path that owns performance metrics) —
never reconstruct the record by hand.

---

## Step 1 — Confirm the scope

1. Get the target `workspaceId`. Use `motion workspaces` if it is not already known. Never
   assume a default workspace — resolve it explicitly before any pull or cache query.
2. When running inside post-install, resolve and record the scope silently — no message to
   the customer; the walkthrough owns the conversation later. Only on a standalone,
   human-requested run, open with a direct confirmation:

> I'm starting the Meta Creative Attributes step for **[account name]**. Your creative content —
> what each ad says, shows, and is tagged as — is already synced and searchable. What I'll do now
> is read your ad naming conventions so I can decode them, then we'll move to Step 2 (Account
> Context Brain) to confirm how you want to judge performance.

3. Record the scope: `workspaceId` confirmed, and today's date as the "attributes as of"
   timestamp.

---

## Step 2 — Provisional naming decode

1. Export the synced corpus and extract the full ad-name list (local, no API call):

   ```
   motion cache export-summaries --format jsonl
   ```

   One record per creative, each carrying its associated ad names — extract them with
   `jq -r '.adNames[]?'` on the returned file (a creative served in several ads carries that
   many names). If the cache is still bootstrapping the workspace, the list may be incomplete —
   `motion cache status` shows the sync state; run `motion cache refresh` and re-run the decode
   once the sync settles. The export file is `./workdir/` scratch, not brain content.
2. Look for structure in the `adName` values: delimiters (underscores, hyphens, pipes),
   position-based encoding, recurring prefixes, tag-like codes.
3. If a pattern is detected, build a provisional decode table: position or segment → meaning →
   example values. Mark it **provisional**.
4. Note where product/concept tokens live. Each full record's `adUnits[]` (via
   `motion cache get-creative`) carries the campaign and ad set names alongside each ad name —
   spot-check a handful of records to see whether the product tokens found in ad names also
   cascade into campaign or ad set names, or live at the ad level only. Record the provisional
   placement (e.g. "product names appear in ad names and campaign names") with the decode table.
5. **Pass findings to the Account Context Brain.** When the Account Context Brain runs (Step 2
   of the onboarding), pre-populate Field 4 (Naming conventions) with this provisional decode
   table and the product-token placement. The Account Context Brain confirms, corrects, or
   replaces them — it does not start from scratch.

If no pattern is detected, note "no naming convention detected" as the provisional finding for
the Account Context Brain to confirm.

The provisional decode is a handoff — this playbook writes nothing to the brain, and no
`/agent/INDEX.md` entry is needed here (per-creative content is in Cacheth, and Knoweth
surfaces it without an index step). On confirmation, the Account Context Brain (Field 4, the
single owner of account interpretation) saves the result in `account-context.md` and writes
the operational decoder to `/agent/brain/meta/naming-decoder.json` — typed positions, query
fields, and filter patterns per the Field 4 spec. Anything decoding an ad name at analysis
time reads the decoder through Field 4.

---

## Maintenance

There is nothing per-creative to maintain: the cache syncs itself, and new launches appear in it
automatically. What remains is event-triggered:

| Event | What to do |
|---|---|
| The account's naming convention changes | Re-run the naming decode (Step 2) and route the new provisional table through Field 4 |
| A new workspace is added | Run this playbook for that workspace first, then the Account Context Brain |

---

## Multi-workspace

Most accounts are single-workspace, but multi-workspace orgs are real. When the brain holds more
than one workspace, scope the brain files per workspace:

- `/agent/brain/meta/<workspace-slug>/account-context.md`
- `/agent/brain/meta/<workspace-slug>/naming-decoder.json`

The creative content layer needs no per-workspace folders: Cacheth's cache projects are already
workspace-scoped, and every cache query runs against the resolved workspace.

---

## Quick reference

| What | Where |
|---|---|
| Account Context Brain (incl. confirmed naming decode, Field 4) | `/agent/brain/meta/account-context.md` |
| Naming decoder (Field 4's operational output) | `/agent/brain/meta/naming-decoder.json` |
| Per-creative content | Cacheth (surfaced via Knoweth; brain files only as person-requested snapshots) |
| Brain index | `/agent/INDEX.md` |
| Change log | `/agent/brain/meta/_changelog.md` |

| What | Command / approach |
|---|---|
| Creative lookup (passive) | Knoweth pre-context injection — answer from injected chunks when sufficient |
| Creative search (active) | `motion cache search-summaries --query "<text>"` (local, no API call) |
| One creative's full record | `motion cache get-creative --creative-id <id>` (local, no API call) |
| Full corpus / naming decode | `motion cache export-summaries --format jsonl` + `jq -r '.adNames[]?'` (local, no API call) |
| Cache freshness / re-sync | `motion cache status` (local) / `motion cache refresh` (syncs from Motion) |
