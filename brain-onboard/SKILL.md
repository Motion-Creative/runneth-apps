---
name: brain-onboard
description: |
  Build this org's Runneth brain from the pre-enrichment package the CSM
  uploaded, plus live pulls against this workspace and any wired customer
  integrations. Synthesizes everything across the 10 brain domains with source
  pills on every line, then renders the welcome card.

  Triggers on phrases like: "build my brain", "set up my Runneth",
  "run brain-onboard", "set up the brain from the uploaded package",
  "synthesize the brain", "process the brain package", "build the org brain",
  "do the brain onboarding".
---

# brain-onboard

## What this skill does

Takes the pre-enrichment package the CSM uploaded to this Runneth (a tar.gz or
directory under `/agent/brain/_sources/`, or files in `./uploads/`), runs the
remaining live data pulls inside this workspace, and synthesizes the result
into a populated org brain across 10 domains. Every brain line carries a
source pill so anyone on the team can audit or edit.

This skill is org-scoped. What it builds is the team's shared working memory,
not any one user's notebook. Everyone who lands in this Runneth later inherits
what gets built here.

## The principle

Only put into the brain things the org has actively put into the world:
- Things they told us at signup, on calls, in conversations
- Things they made public on their own brand channels
- Things their customers wrote about them on public review surfaces
- What this workspace's Motion data shows about their account

Do not invent or scrape:
- Third-party person enrichment about individuals on the team
- Third-party org enrichment scraped from databases
- Curated competitor suggestions from outside knowledge (only competitors the
  team has named go in)
- Motion-internal observations like health scores, ranking, or "recommended
  champion" framing — those stay on the CSM side and inform install, never the
  brain

If a fact would surprise the team because they didn't know we knew it, do not
put it in the brain.

## Standing rules for execution

These hold for every install. Apply them whenever the skill runs.

1. **The package is a seed, not the finished brain.** Synthesis is not done
   when the package files are read. The brain becomes complete only after the
   live workspace pulls (motion CLI), the live web crawl, the Apify scrapers,
   and any wired customer integrations are merged in. A brain that hasn't
   pulled brand context, performance, competitor inspo, web crawl, and the
   customer's wired review source is partial by definition.
2. **Check `archive/` before any fresh pull.** If a domain's data was archived
   from a prior brain (`/agent/brain/archive/<date>/...`), pull from the archive
   first and supplement with live only if the archive is stale. Re-pulling
   Yotpo, Meta, or any other source the team already has accumulated wastes
   their credit budget and loses local context.
3. **`_sources/` uses flat, named top-level folders** — one per category, not
   nested. Standard layout:
   ```
   _sources/
   ├── motion/          workspace performance + saved config (Layer 3)
   ├── inspo/           competitor + inspo brand ad libraries (Layer 3, motion inspo-creatives)
   ├── web/             live web crawl on brand site (Layer 2A)
   ├── apify/           Reddit, IG, TikTok, etc. (customer-side Apify)
   ├── external-paid/   X, TrustPilot, etc. that the CSM-side prep shipped
   ├── self-identified/ company-facts + team-roster from package (Layer 1 redacted)
   ├── yotpo/           (or stamped/, okendo/) customer-wired review data
   └── _manifest.json
   ```
   Each source category gets its own slot. Inspo lives under `_sources/inspo/`,
   not nested under `_sources/motion/`.
4. **The competitor seed is a starting point, not a final list.** Before locking
   the Competition domain, surface what's in the package's `competitor-seed.json`
   to the team and ask: "these are the brands we've heard you name; who else
   should we be watching?" Accept additions as team-authored from that point.
   Then run `motion search-brands` + `motion inspo-creatives` for every brand in
   the expanded set.
5. **Synthesis isn't done until staged sources are merged.** If files are in
   `_sources/<category>/` but no brain domain doc cites them, the synthesis is
   PARTIAL. Surface this in the welcome card so the team knows what's still in
   flight. Don't claim the brain is built when it's half-built.
6. **The welcome card leads with what the brain enables for each person on the
   team, not what data got ingested.** Capability cards per role with suggested
   prompts, not a data-readback. "Here's what you can do now" beats "here's
   what we pulled."

## The 10 brain domains

1. **Identity** — team roster, roles, working style
2. **Brand** — positioning, voice, products, voice rules, what they stand for
3. **Customers** — personas, pain language, transformation language, VoC verbatims
4. **Competition** — competitors the team has named, with their active ads
5. **Performance** — top creatives, account structure, KPIs, benchmarks
6. **Strategy** — OKRs, active bets, channel and budget allocation
7. **Calendar** — launches, seasonal moments, operating rhythms
8. **Library** — brand kit, templates, brief library, asset inventory
9. **Knowledge** — decisions made, tests run, lessons, terminology
10. **Preferences** — how the team and individuals want Runneth to behave

## Step 1 — Find and stage the package

The CSM ships a tar.gz or directory containing a `_manifest.json`, a `README.md`,
`identity-seed/team.md`, and a `_sources/` tree.

Check these locations in order:

1. **Already staged**: `/agent/brain/_sources/_manifest.json` present? You're set.
2. **Tar in uploads**: any `./uploads/*runneth-package*.tar.gz`? Extract:
   ```bash
   mkdir -p /agent/brain/_sources/
   tar -xzf ./uploads/<file>.tar.gz --strip-components=1 -C /agent/brain/_sources/
   ```
3. **Loose files in uploads** (README, _manifest.json, identity-seed/, _sources/): copy to `/agent/brain/_sources/`.
4. **Drive URL shared in conversation**: use `google url download <url>` to grab the tar.gz, then extract per option 2.

If none of these are present, tell the user the package hasn't arrived yet and
ask them to upload it. Do not try to build a brain from public web alone — the
package contains material the team gave us directly that we should not skip.

Read `_manifest.json`. Note which sources were included, which were intentionally
excluded (so you don't go scrape them anyway), and what the customer-side
responsibilities are.

## Step 2 — Run live workspace pulls (Layer 3)

These all run against this workspace through the built-in `motion` CLI. No
arguments needed unless specified — they default to this workspace.

| Call | Saves to |
|---|---|
| `motion brand-context --data-query brand_identity` | `_sources/motion/brand-context.json` |
| `motion workspace-goal` | `_sources/motion/workspace-goal.json` |
| `motion spend-threshold` | `_sources/motion/spend-threshold.json` |
| `motion meta insights --date-range last_30d --limit 30 --include-metrics --sort topSpend` | `_sources/motion/meta-insights-30d.json` |
| `motion tiktok insights --date-range last_30d --include-metrics` | `_sources/motion/tiktok-insights-30d.json` |
| `motion meta age-gender --date-range last_30d --include-metrics` | `_sources/motion/age-gender.json` |
| `motion creative-trends` | `_sources/motion/creative-trends.json` |
| `motion cache search-summaries` | `_sources/motion/creative-cache.json` |
| `motion meta custom-conversion-metrics` | `_sources/motion/custom-conversions.json` |
| `motion benchmark-compare` | `_sources/motion/benchmark.json` |
| `motion ai-glossary` | `_sources/motion/glossary.json` |

For each competitor:

1. Surface the package's `competitor-seed.json` to the team and confirm.
   Ask: "these are the brands we've heard you name; who else should we be
   watching?" Accept additions as team-authored from that point.
2. For every brand in the confirmed set: `motion search-brands --search-term "<name>"`
   then `motion inspo-creatives` on the returned brand id.
3. Save outputs to `_sources/inspo/<slug>.json`. Inspo gets its own folder — not
   nested under `_sources/motion/`.

If a call fails because the workspace isn't connected to that platform (e.g.,
no Meta), mark it in the resulting brain section as "data not available because
this platform isn't connected." Don't fabricate.

## Step 2A — Run live web crawl (Layer 2A)

The package does not ship pre-fetched web content (Layer 2A is customer-side).
Run the crawl live during execution.

Use `WebFetch` on the brand site:

- `https://<brand-domain>/` — home, value prop, primary CTA
- `https://<brand-domain>/about` or `/our-story` — brand history, voice
- `https://<brand-domain>/products` or `/shop` or `/collections` — catalog
- `https://<brand-domain>/sustainability`, `/values`, `/our-mission` (any present)
- `https://<brand-domain>/blog` or `/journal` — editorial voice samples
- `https://<brand-domain>/customers`, `/case-studies`, `/testimonials` (any present)

Plus `WebSearch` queries:

- `"<brand> news 2026"` for recent press
- `"<brand> competitors"` for analyst lists (use to inform the competitor
  confirmation question, not to auto-add to the seed)
- `"<brand> review"` for additional public review surfaces

Save outputs to `_sources/web/` (cleaned text or HTML, your call). Use as input
to the Brand domain synthesis.

## Step 2B — Run Apify scrapers (customer-side)

Apify is available to every Runneth customer through the standard `APIFY_API_KEY`
runtime secret. Run the relevant scrapers asynchronously, save outputs under
`_sources/apify/`.

Use the async actor pattern (sync calls time out at 120s):

1. POST `/v2/acts/<actor>/runs` with input to kick off
2. Save the returned `runId`
3. Poll `/v2/actor-runs/<runId>` every 10-30s until `status` is `SUCCEEDED`
   or 5min cap is hit
4. Pull dataset items from `/v2/actor-runs/<runId>/dataset/items`
5. Save to `_sources/apify/<scraper>.json`

Apply these skip rules before running each scraper:

| Scraper | Skip if |
|---|---|
| Apify TrustPilot | Yotpo / Stamped / Okendo wired (their first-party reviews are the primary source) |
| Apify Amazon | Brand doesn't sell on Amazon (DTC-only via Shopify, etc.) |
| Apify G2 / Capterra | Brand is DTC, not B2B SaaS |
| Apify Pinterest | Brand category is not aesthetics-led |
| Apify YouTube | Brand has no YouTube channel of meaningful size |

Default scrapers to run for most brands:

- Apify Reddit (no first-party substitute for community discussion)
- Apify Instagram on the brand handle
- Apify TikTok on the brand handle
- Apify LinkedIn company page

Each scraper's output goes into the Customers domain (for review-based VoC) or
the Brand domain (for organic voice samples) at synthesis time.

## Step 3 — Pull customer-wired integrations

If the package's manifest lists wired customer integrations (Yotpo, Shopify,
etc.), pull them using the credentials that exist in this sandbox — but check
the archive first.

**Archive-first rule.** If `/agent/brain/archive/<date>/` contains data from
this integration (e.g., archived Yotpo review exports), pull from the archive
first. Use it as the primary source. Make a fresh live call only if the
archive is materially stale (older than the integration's refresh cadence) or
missing. Don't waste credit pulling data the team already has.

For **Yotpo** specifically (the most common):
- Check `archive/<date>/reviews/`, `archive/<date>/yotpo/`, or similar for
  prior review exports
- If present: read from the archive, save extracted view to `_sources/yotpo/`
- If absent or stale: pull the 100 most recent reviews from `api.yotpo.com`
  using the secret already in this sandbox, save to
  `_sources/yotpo/recent-reviews-100.json`
- Either way, Yotpo is the **primary** customer pain / voice source. Outranks
  any Apify TrustPilot, Apify Amazon, or other Apify review scraper output.

For other wired integrations (Shopify catalog, Klaviyo email engagement,
Northbeam attribution, etc.), follow the same archive-first pattern: check
the archive, supplement with live as needed, save under `_sources/<integration>/`.

If an integration is mentioned in the manifest but credentials are missing,
flag it in the welcome card as "ready to connect."

## Step 3.5 — Detect upgrade and protect existing content (before synthesis)

Before any synthesis writes to brain domain folders, check what's already there. If the customer has a prior brain from an older brain-onboard version, content can be silently overwritten unless protected explicitly.

### Detect the install state

Check `/agent/brain/_state.json` and the brain folders together:

| Condition | Install state | Action |
|---|---|---|
| `_state.json` absent AND brain folders empty | **Fresh install** | Proceed to Step 4 normally |
| `_state.json` present AND `brain_onboard.synthesized_at` recorded | **Refresh** | Proceed to Step 4 with `--mode refresh` semantics |
| `_state.json` absent AND brain folders have content | **Upgrade from pre-v1.2.x install** | Run the upgrade-safe path below |

### Upgrade-safe path

When upgrade is detected, do not synthesize directly. Run these in order:

1. **Archive existing brain content.** Copy everything currently under `/agent/brain/<ten-domain>/` plus any sibling brain roots (`/agent/brain/members/`, `/agent/brain/competitor-intel/`) to a dated archive:

   ```bash
   ARCHIVE_DIR=/agent/brain/_archive/$(date -u +%Y-%m-%d)-pre-v2.2-upgrade
   mkdir -p "$ARCHIVE_DIR"
   for dir in identity brand customers competition performance strategy calendar library knowledge preferences members competitor-intel; do
     if [ -d "/agent/brain/$dir" ]; then
       cp -r "/agent/brain/$dir" "$ARCHIVE_DIR/"
     fi
   done
   ```

2. **Walk the archive for likely user-saved content.** Identify files that look like things a teammate explicitly saved versus auto-generated synthesis output. Heuristics that strongly signal user-owned content:

   - File path under `preferences/`, `knowledge/`, or `library/` (domains that default to user-managed)
   - File contains distinctive prose patterns: first-person language ("we", "our", "I"), recent dates in body text, specific names of people on the team
   - File modification time within the last 30 days AND no `managed_by: brain-onboard` or `managed_by: <routine-name>` in frontmatter
   - File matches naming conventions from the save-this pattern (`saved-*.md`, `note-*.md`, `*-decision.md`)
   - File is named in conversation history near phrases like "save this", "remember this", "add to brain"

   Compile candidates into a list with: file path, line count, brief excerpt (first 150 chars), modification time, why it was flagged.

3. **Surface findings on the welcome card before synthesizing.** Add a section to the welcome card:

   > "I found <N> files from your prior brain that look like things your team saved before this upgrade. Before I rebuild the brain from your new package, I'd like to preserve them. Here's what I found:
   >
   > - `[path/to/file]` — [first 100 chars] (saved [X days ago])
   > - `[path/to/file]` — [first 100 chars] (saved [X days ago])
   > - ...
   >
   > Should I preserve these as user-owned content in the new structure? Pick one:
   > - **Yes, preserve all of them.** I'll re-import with `managed_by: user` frontmatter so future refreshes don't touch them.
   > - **Preserve some.** Tell me which ones to keep and I'll skip the rest.
   > - **Discard.** Everything you found is auto-generated; rebuild fresh."

4. **Wait for explicit confirmation before proceeding to Step 4.** Do not synthesize until the team picks one of the three options. The archive at `/agent/brain/_archive/<date>-pre-v2.2-upgrade/` stays available as a recovery option regardless.

5. **Confirmed user-owned content gets re-imported with proper frontmatter.** When the team approves preservation, copy the approved files back into the appropriate domain folder and inject YAML frontmatter at the top:

   ```yaml
   ---
   domain: <inferred from original path>
   ownership: user
   substance: <facts | beliefs based on content>
   managed_by: user
   sources:
     - { layer: legacy, ref: "preserved from pre-v2.2 brain on upgrade" }
   refresh_cadence: never
   last_refreshed: <original modification time>
   confidence: high
   preserved_from: <original path under _archive/>
   ---
   ```

6. **Re-run skill migration helpers if their old paths existed.** `team-member-memory-migration-helper.sh` for `/agent/brain/members/` → `/agent/brain/identity/people/`. `competitor-intel-migration-helper.sh` for `/agent/brain/competitor-intel/` → `/agent/brain/competition/`. These are idempotent and safe to run after archive.

7. **Proceed to Step 4 (Synthesize)** with the package + live workspace pulls. The preserved user-owned files coexist alongside the freshly synthesized system-owned content because they declare different `managed_by` values.

### Why this matters

A teammate who used the save-this-to-brain pattern during their prior conversations has durable saves in files that may not carry frontmatter. Without this upgrade-safe path, brain-onboard would overwrite those saves silently during re-synthesis. The archive plus user-confirmation flow prevents that without slowing down fresh installs.

## Step 4 — Synthesize the 10 brain domains

For each domain, produce a primary markdown doc at `/agent/brain/<domain>/README.md`
plus structured item files where the domain is list-shaped. Every line carries
a source pill in the format `{source: <file-or-call>}`.

| Domain | Primary inputs |
|---|---|
| **Identity** | `identity-seed/team.md` from package; do not enrich with LinkedIn or scraped data |
| **Brand** | `_sources/web/*` + `_sources/motion/brand-context.json` + `_sources/company-facts.json` |
| **Customers** | Yotpo reviews (archive-first, then live) + `_sources/motion/brand-context.json` ICP + Apify Reddit/IG/TikTok output if no first-party VoC source is wired |
| **Competition** | Confirmed competitor set (seed + team additions) + the `_sources/inspo/<slug>.json` files for each |
| **Performance** | All `_sources/motion/meta-*`, `tiktok-*`, `age-gender.json`, `creative-trends.json`, `creative-cache.json`, `benchmark.json` |
| **Strategy** | `_sources/motion/workspace-goal.json` + `_sources/motion/spend-threshold.json` + `_sources/motion/custom-conversions.json` |
| **Calendar** | Leave mostly empty pending Notion/Calendar OAuth; note as "pending integration" |
| **Library** | `_sources/motion/creative-cache.json` index + pending Drive/Notion OAuth for briefs/assets |
| **Knowledge** | `_sources/motion/glossary.json` + any decisions surfaced from the conversation history during synthesis |
| **Preferences** | Empty; grows as users give feedback during conversations |

**Validation before declaring synthesis done:** walk each `_sources/<category>/`
folder. If files exist in the staging directory but no domain doc cites them,
the synthesis is PARTIAL. Either merge them into the right domain doc now or
record the gap in the welcome card so the team isn't surprised. Don't say the
brain is done when staged sources remain unmerged.

For domains where the data clearly maps, write durable facts with source pills.
For domains where the data is thin, write what's there and explicitly note what's
missing so the welcome card can ask about it.

## Step 5 — Update INDEX.md

Append entries to `/agent/INDEX.md` for each domain doc written, so future
conversations can find them. Include aliases and a one-line note per entry.

## Step 6 — Render the welcome card

The card leads with **what the brain enables for each person on the team**,
not what data got ingested. Capability frame, not data-readback frame.

Structure:

1. **Capability cards by role.** One card per active teammate or per role,
   showing what's concretely different now that the brain is built. Each card:
   - Person's name (or role if anonymous)
   - Three or four capability one-liners ("draft a brief that pulls customer
     pains by name," "teardown last week's ad against our persona set," etc.)
   - One or two suggested prompts the person can paste
2. **A "knows by heart" grid** with the high-signal values the brain holds:
   primary KPI, top creators or agency partners, named competitors plus other
   inspo brands, product line summary, anything specific that proves Runneth
   knows them.
3. **What's not in the brain yet.** List pending OAuths and integrations as
   explicit asks. ("Connect Notion to fill Calendar and Strategy. Connect Drive
   to fill Library.") If synthesis was PARTIAL because staged sources weren't
   merged into domain docs, flag that here too.

Below the card, two minimal asks:
- **Role chip** (creative strategist, brand lead, performance marketing, content,
  ops, marketing leader)
- **Optional connections** — read the manifest's `tools_team_uses_not_yet_in_runneth`
  field. Surface only entries where:
  1. `in_runneth: false` (they haven't already connected it)
  2. `recommend_oauth: true` (Runneth has a connector available)

  Before rendering, cross-check `integrations list` to confirm Runneth
  actually supports each tool. Skip any that aren't supported — don't dangle
  a connect button for something that won't work.

  This is the team's actual stack (Asana, Klaviyo, Figma, whatever they
  specifically use) — not a generic Drive + Notion default. If the manifest
  is missing that field or empty, fall back to Drive + Notion + Slack as a
  generic default and flag the gap on the card so prep can add it next refresh.

Do not ask for brand confirmation. The workspace already is the brand.
Do not lead with a list of files we ingested. Lead with what each person can
do now that they couldn't yesterday.

## Step 7 — Write state and stand by

Write `/agent/brain/_state.json` recording what got done:

```json
{
  "brain_version": "1.0.0",
  "package_version_consumed": "<from manifest>",
  "synthesized_at": "<iso>",
  "synthesized_by": "brain-onboard",
  "domains_populated": ["identity", "brand", "customers", "competition", "performance", "strategy", "knowledge"],
  "domains_partial": ["calendar", "library"],
  "domains_empty": ["preferences"],
  "motion_calls_succeeded": ["brand-context", "workspace-goal", "meta insights", ...],
  "motion_calls_failed": [...],
  "customer_integrations_pulled": ["yotpo"],
  "competitors_pulled": ["Petite Plume"]
}
```

This lets the CSM verify install health from outside with one read.

Once the welcome card renders, the skill is done. Future work happens through
ordinary conversations against the populated brain.

## Re-run (refresh)

If the CSM pushes a newer package (different `package_version` or newer
manifest timestamp than what's in `_state.json`):

1. Detect the diff against `_state.json.package_version_consumed`
2. Identify which domains changed
3. Re-synthesize only the affected domains
4. Preserve any user-edited brain content (check mtime/hash before overwrite;
   surface conflicts in welcome card)
5. Update `_state.json`

## When asked to verify install

If someone asks "did the brain build," "is the install healthy," "what's
populated," or similar, read `/agent/brain/_state.json` and summarize:

- Which domains are populated, partial, or empty
- Which Motion calls succeeded vs failed (and why)
- Which customer integrations got pulled
- Which competitors got resolved
- What pending OAuths or steps remain

If `_state.json` is missing or stale, the skill hasn't fully completed.
Re-run it.

## When something fails

- **Missing package**: do not fall back to public web alone. Tell the team the
  package isn't here and to upload it.
- **Motion CLI returns "no data source"**: skip that platform, note in brain.
- **Yotpo / wired integration credentials missing**: flag in welcome card,
  proceed without.
- **A specific motion call fails with a flag error**: try the simpler default
  shape first (no flags). Some commands fail if quirky flags are passed.
- **Brain content already exists from a prior run**: merge, don't overwrite.
  Preserve any user-edited content. Surface conflicts in the welcome card.

## What this skill never does

- Scrape LinkedIn, Apollo, or other third-party data about individuals
- Suggest competitors the team has not named
- Write Motion-internal framing into the brain (health scores, sentiment,
  expansion target language, champion-user naming)
- Invent facts to fill empty domains
- Skip the Yotpo / customer-wired integrations when they're available — those
  are the highest-signal customer-side data and the brain needs them
