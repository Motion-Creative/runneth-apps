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
   live workspace pulls (motion CLI), the live web crawl, and any wired customer
   integrations are merged in with the package contents (which include CSM-side
   Apify pulls and external-paid sources). A brain that hasn't pulled brand
   context, performance, competitor inspo, web crawl, and the customer's wired
   review source is partial by definition.
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
   ├── apify/           Reddit, IG, TikTok, etc. (CSM-side, delivered in package)
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
7. **Brain content vs brain mechanics.** Content the team supplied — their
   words, their decisions, their progress — lives in the customer-facing brain.
   Motion's process — extraction logic, customization mappings, sentiment
   reads, engagement signals, internal interpretations, suggested-next-moves —
   stays Motion-internal at `customers/<slug>/_internal-context/`. The
   principle "only what the org put in the world" applies to BOTH content and
   interpretation: the team's words ship; Motion's read of those words doesn't.
   When a call analysis produces both structured findings AND Motion's
   interpretation, split the output into two files (one customer-facing, one
   internal). Same source call, two destinations.
8. **The operational layer is auditable, not decorative.** The three registries
   (`integrations/`, `routines/`, `apps/`) exist so any teammate can see what's
   connected, what runs, and what's been built without reading the manifest or
   grepping the filesystem. Populate `integrations/` from the manifest at
   install; scaffold `routines/` and `apps/` with READMEs even when empty. Each
   integration entry names the brain domains it feeds; each routine entry names
   its write target; each app entry names the durable state it reads. These
   registries are the source of truth for data lineage on the brain side.

## The 10 brain domains + signals layer + operational layer

1. **Identity** — team roster, roles, working style. Per-person scope at `identity/people/<handle>/`.
2. **Brand** — positioning, voice, voice rules, products. Structured product catalogue at `brand/products/<product-slug>/spec.md` with materials, price, sizes, claims, photos, status.
3. **Customers** — personas, pain language, transformation language, VoC verbatims. Substructure:
   - `customers/personas/<persona-slug>.md` — per-persona deep dives (pains, desires, objections, language, transformations, vocabulary)
   - `customers/reviews/by-source/`, `customers/reviews/by-product/`, `customers/reviews/by-theme/` — structured review data from Yotpo, Trustpilot, Amazon, Google, etc.
   - `customers/ad-comments/by-creative/`, `customers/ad-comments/by-theme/` — per-creative comment sampling and cross-creative theme aggregation
4. **Competition** — competitors the team has named, with their active ads. Per-brand scope at `competition/<brand-slug>/`.
5. **Performance** — top creatives, account structure, KPIs, benchmarks. Substructure for pattern recognition:
   - `performance/by-hook-tactic.md` — aggregated by hook tactic
   - `performance/by-hook-voice.md` — aggregated by hook voice pattern
   - `performance/by-visual-format.md` — aggregated by visual format
   - `performance/by-messaging-angle.md` — aggregated by messaging angle
   - `performance/by-persona.md` — aggregated by target persona
   - `performance/by-awareness-stage.md` — aggregated by awareness stage
6. **Strategy** — OKRs, active bets, channel and budget allocation
7. **Calendar** — launches, seasonal moments, operating rhythms
8. **Library** — brand kit, templates, brief library, asset inventory
9. **Knowledge** — decisions made, tests run, lessons, terminology
10. **Preferences** — how the team and individuals want Runneth to behave

Plus two foundational layers sitting as siblings to the ten domains:

**`onboarding/`** — the anchor that grounds everything. Captured during the alignment call, refined during the Runneth Set Up call, maintained during ongoing CSM 1:1s. Contains the why-Motion answer, pain points, goals, success criteria, the onboarding checklist, and per-call analysis logs. **Shapes setup decisions** (which routines run, which integrations get prioritized, which signals populate, which capability cards get weighted). Does NOT shape creative output (briefs are grounded in domain content + signals, not in setup config). Documented in Step 4.W.

**`signals/`** — forward-looking intelligence. Cross-domain whitespace, gaps, and opportunities derived from synthesis findings. Read by the briefing chain when the team requests a brief; updated by refresh routines week over week. Eight standard files documented in Step 4.X.

Plus an **operational layer** — three registries that sit as siblings to the ten domains and `signals/`. Where domains are brand knowledge and `signals/` is forward-looking intelligence, the operational layer records what's connected, what runs, and what's been built:

- **`integrations/`** — the connection registry. One folder per connected integration plus a README index. Each entry records which brain domains the integration feeds, so data lineage is auditable from the brain side. Documented in Step 4.Y.
- **`routines/`** — the routine registry. One file per routine with its full config and write target, so any teammate can see what keeps each domain or signal current. Documented in Step 4.Y.
- **`apps/`** — the app registry. A README index of built apps and the durable state each one reads, so apps stay views-over-state, not state owners. Documented in Step 4.Y.

The clean mental model: **domains = brand knowledge, `signals/` = forward-looking intelligence, `integrations/` + `routines/` + `apps/` = the operational layer (what's connected, what runs, what's been built).**

## Step 1 — Find and stage the package

The CSM has typically already delivered the package to this VM via SSH (using runneth-cli from their local machine). Files should be at `/agent/brain/_sources/` waiting for synthesis.

Check these locations in order:

1. **Already staged (the common case)**: `/agent/brain/_sources/_manifest.json` present? You're set. The CSM pushed the package to GitHub for canonical storage AND streamed it onto this VM via runneth-cli SSH tunnel. Files are ready; proceed to Step 1.5.
2. **GitHub clone (fallback)**: if the package isn't staged but `CUSTOMER_BRAIN_READ_PAT` is in this sandbox's secrets and the customer slug is known (from `_state.json`, the prep-customer-brain handoff, or the CSM telling you in conversation), clone the customer's subdirectory from `Motion-Creative/customer_brain`:
   ```bash
   cd /tmp && rm -rf cb
   git clone https://x-access-token:$(secret env CUSTOMER_BRAIN_READ_PAT)@github.com/Motion-Creative/customer_brain.git cb
   mkdir -p /agent/brain/_sources/
   cp -r cb/<customer-slug>/* /agent/brain/_sources/
   ```
   Verify `/agent/brain/_sources/_manifest.json` exists after the copy.
3. **Tar in uploads (legacy fallback)**: any `./uploads/*runneth-package*.tar.gz`? Extract:
   ```bash
   mkdir -p /agent/brain/_sources/
   tar -xzf ./uploads/<file>.tar.gz --strip-components=1 -C /agent/brain/_sources/
   ```
4. **Loose files in uploads (legacy fallback)** (README, _manifest.json, identity-seed/, _sources/): copy to `/agent/brain/_sources/`.
5. **Drive URL shared in conversation (legacy fallback)**: use `google url download <url>` to grab the tar.gz, then extract per option 3.

If none of these are present, tell the user the package hasn't arrived yet and
ask them to upload it. Do not try to build a brain from public web alone — the
package contains material the team gave us directly that we should not skip.

Read `_manifest.json`. Note which sources were included, which were intentionally
excluded (so you don't go scrape them anyway), and what the customer-side
responsibilities are.

## Step 1.5 — Ensure the brain-layer skills are installed from the library (GitHub)

The brain-layer skills are **not** shipped in the package. They are distributed through the public Runneth Use Case Library (`Motion-Creative/runneth-apps`, a public repo), so every install pulls the current version straight from GitHub instead of a stale bundled copy that could overwrite a fresh one.

- **`brain-onboard`** — already installed from the library link the CSM used to start this install, so it is current. Do NOT reinstall or overwrite it from anywhere.
- **`corpus-search`** — grab from the library if not already present.
- **`team-member-memory`** — grab from the library if not already present.

For corpus-search and team-member-memory, fetch each skill's files from the public repo and install them **per that skill's own `install-config.json` placement**, not by dumping everything into the skills folder (their supporting files belong under `/agent/tools/` and `/agent/brain/admin/`, not the skills directory). The repo is public, so no token is needed on the customer VM.

```bash
REPO_RAW="https://raw.githubusercontent.com/Motion-Creative/runneth-apps/main"
REPO_API="https://api.github.com/repos/Motion-Creative/runneth-apps"

for skill in corpus-search team-member-memory; do
  # Already present (or locally customized)? Leave it alone — never clobber.
  if [ -f "/agent/.agents/skills/$skill/SKILL.md" ]; then
    echo "$skill already installed — skipping"
    continue
  fi

  # Stage the whole skill directory from the public library.
  stage="/tmp/skill-$skill"; rm -rf "$stage"; mkdir -p "$stage"
  curl -fsSL "$REPO_API/git/trees/main?recursive=1" \
    | python3 -c "import json,sys; [print(x['path']) for x in json.load(sys.stdin)['tree'] if x['type']=='blob' and x['path'].startswith('$skill/')]" \
    | while read -r path; do
        rel="${path#$skill/}"
        mkdir -p "$stage/$(dirname "$rel")"
        curl -fsSL "$REPO_RAW/$path" -o "$stage/$rel"
      done

  # Place the skill definition itself.
  mkdir -p "/agent/.agents/skills/$skill"
  cp "$stage/SKILL.md" "/agent/.agents/skills/$skill/SKILL.md"
done
```

Then apply each staged skill's `install-config.json` `installs[]` entries to place its supporting files at their real destinations, honoring `if-not-exists`, `chmod`, and any `insert-after` / `insert-fallback` rules:

- **corpus-search** installs its CLI and libs under `/agent/tools/corpus-search/` and ships an `install.sh` that bootstraps sqlite-vec, config, and the schema. Place its files per its install-config, then run `bash /agent/tools/corpus-search/install.sh` and follow the `[TODO]` lines it prints.
- **team-member-memory** installs its whoami scripts under `/agent/brain/admin/` (chmod 0755) and inserts its behavior snippet into the brain. Honor its `if-not-exists` entries so an existing customized copy is never overwritten.

If an install-config entry uses a token (e.g. `{{TEAM_MEMBER_TEMPLATE_PATH}}`) or an insert target that can't be resolved at runtime, place what you can and surface the unresolved item on the welcome card and onboarding checklist rather than guessing a path.

After install, verify each skill's `SKILL.md` is present at `/agent/.agents/skills/<skill>/SKILL.md`, and record the installed version (read each skill's `install-config.json` `version`) into `_state.json` (Step 7).

If a skill can't be fetched (no network, GitHub unreachable), surface that on the welcome card and continue with synthesis. The team can install it later from the library — but corpus-search powers brain search and team-member-memory powers per-person learning, so flag the gap clearly.

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

## Step 2B — Read Apify data from the package (CSM-side delivered)

**Apify moved to CSM-side as of v2.0.0.** prep-customer-brain runs the Apify scrapers (Reddit, Instagram, TikTok, Pinterest, YouTube, TrustPilot, Amazon, G2/Capterra, LinkedIn) during package prep with the same skip rules. The data ships in the package at `_sources/apify/`. Customer Runneths no longer need `APIFY_API_KEY` configured.

### What this step does

Read whatever Apify pulls the CSM included in the package:

1. Walk `/agent/brain/_sources/apify/`
2. For each `<scraper>.json` file, note the scraper, the date, and the row count
3. Carry the data into Step 4 synthesis:
   - Reddit, Instagram, TikTok output → Customers domain (community VoC) and Brand domain (organic voice samples)
   - TrustPilot, Amazon → Customers domain (review VoC)
   - LinkedIn → Brand domain (company positioning) and Identity domain (employee signals)

### If Apify data is missing from the package

If `_sources/apify/` is empty or missing entries the team would expect (e.g., brand has Instagram presence but no `instagram.json`), surface the gap on the welcome card under "What's not in the brain yet":

> "Apify Instagram scrape wasn't run during CSM prep. Tell your CSM and we'll include it next refresh."

The customer can ask the CSM to re-run prep with the missing scrapers. brain-onboard does NOT attempt to run Apify itself.

### Why CSM-side

- One less integration for customers to configure (no `APIFY_API_KEY` needed)
- Motion controls the data quality, scraper selection, rate-limit handling
- Async/timeout complexity stays where it's easier to manage
- Apify cost runs through Motion's account, predictable and auditable

### Trade-off (data freshness)

CSM-side means Apify data refreshes only on prep-customer-brain runs (typically monthly or on-demand). Reddit conversations, IG/TikTok organic, and TrustPilot reviews don't shift fast enough for daily refresh to be necessary. If a specific customer needs higher-frequency Apify pulls, the CSM can wire a per-customer refresh routine — but this is the exception, not the default.

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
| `_state.json` present AND brain content has frontmatter on every file | **Clean refresh** | Proceed to Step 4 with `--mode refresh` semantics |
| `_state.json` absent AND brain folders have content | **Legacy upgrade** | Run the upgrade-safe path below |
| `_state.json` present BUT brain content lacks frontmatter on some files | **Schema upgrade** | Run the upgrade-safe path below (added in v1.3.0 after Printfresh surfaced this case) |

**How to detect "lacks frontmatter on some files":** sample 5 random files from each domain folder. If any file doesn't start with `---\n` (markdown frontmatter) or `_meta` block at the top of the root object (JSON), treat the brain as needing schema upgrade.

Schema upgrade applies the same upgrade-safe walk as legacy upgrade. The team's existing content gets surfaced for preserve/discard confirmation before re-synthesis with the new frontmatter contract.

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

7. **Onboarding checklist relocation (v1.x → v2.0).** If `/agent/brain/onboarding-checklist.md` (root path from v1.x) exists, move it to `/agent/brain/onboarding/checklist.md`. Create the onboarding/ folder if needed. Leave a 30-day stub at the old path pointing to the new location. Preserve any team edits.

7. **Proceed to Step 4 (Synthesize)** with the package + live workspace pulls. The preserved user-owned files coexist alongside the freshly synthesized system-owned content because they declare different `managed_by` values.

### Why this matters

A teammate who used the save-this-to-brain pattern during their prior conversations has durable saves in files that may not carry frontmatter. Without this upgrade-safe path, brain-onboard would overwrite those saves silently during re-synthesis. The archive plus user-confirmation flow prevents that without slowing down fresh installs.

## Step 4 — Synthesize the 10 brain domains

For each domain, produce a primary markdown doc at `/agent/brain/<domain>/README.md`
plus structured item files where the domain is list-shaped. Every line carries
a source pill in the format `{source: <file-or-call>}`.

**Every domain folder gets a `_changelog.md`** appended with one line per synthesis run: timestamp, what got written, source counts. Format:

```markdown
## 2026-06-03T17:35:00Z
- brain-onboard: initial synthesis — populated README.md (8 sources) + 12 product specs + 4 persona files
- brain-onboard: aggregated performance by hook-tactic, hook-voice, visual-format, messaging-angle (24 creatives, 6 tactics found)
```

Future routines append to the same file. Visible audit trail, no silent updates.

### Substructure synthesis logic

For three domains, synthesis populates structured substructures, not just a flat README:

**Brand domain — `brand/products/`:**
1. Pull product data from sources in priority order: `brand-audit/<workspace>/product-catalog.md` if it exists, then `_sources/web/products/*` from the brand site crawl, then HubSpot products if synced, then Shopify products if connected.
2. For each product, slugify the name to get `<product-slug>`.
3. Write `brand/products/<product-slug>/spec.md` with frontmatter (product_name, sku, category, price_usd, materials, sizes, colors, status, launch_date) and body sections (description, photos, related-product-slugs).
4. Write `brand/products/<product-slug>/claims.md` if claims data exists (Yotpo claims, brand-audit substantiation).
5. Write `brand/products/README.md` with a catalogue overview: total count, categories, top SKUs by review volume, status breakdown.

**Customers domain — `customers/personas/`, `customers/reviews/`, `customers/ad-comments/`:**
1. **Personas:** for each persona identified from brand-context, brand-audit, or Apollo ICP, write `customers/personas/<persona-slug>.md` with frontmatter and sections for pains, desires, objections, language, transformations, vocabulary, demographics.
2. **Reviews:** pull from wired source (Yotpo first), Apify scrapers second.
   - Write `customers/reviews/by-source/<source>.md` for each (yotpo, trustpilot, amazon, google).
   - Write `customers/reviews/by-product/<product-slug>.md` joining reviews to the product catalogue.
   - Cluster reviews by theme into `customers/reviews/by-theme/{pain,desire,objection,comparison,use-case}.md`.
   - Save raw review JSON to `customers/reviews/raw/<source>.json` for re-clustering.
3. **Ad comments:** pull from Meta Graph API and TikTok Business API.
   - Per creative: write `customers/ad-comments/by-creative/<creative-id>.md` with top 20 comments (sentiment-weighted), reply patterns, sentiment summary.
   - Cluster across creatives by theme: write `customers/ad-comments/by-theme/{questions,objections,enthusiasm,confusion}.md`.
   - Volume management: do NOT store every comment. Sample top 20-50 per creative; reference full data in Meta/TikTok for re-fetch on demand.

**Performance domain — aggregations:**
1. Pull all creatives from `motion meta insights --include-metrics --group-by name` and `motion tiktok insights --grain ads`.
2. For each creative, pull its glossary tags from `motion ai-glossary` (visual format, messaging angle, hook tactic, hook voice).
3. Aggregate metrics (spend, ROAS, CTR, CPA, conversions, ROAS-weighted) per tag group.
4. Write one file per dimension:
   - `performance/by-hook-tactic.md` — tactic name, # creatives, spend, avg ROAS, top performer, trend
   - `performance/by-hook-voice.md` — voice pattern, # creatives, spend, avg ROAS, top performer, trend
   - `performance/by-visual-format.md` — format name, # creatives, spend, avg ROAS, top performer, trend
   - `performance/by-messaging-angle.md` — angle, # creatives, spend, avg ROAS, top performer, trend
   - `performance/by-persona.md` — persona, # creatives, spend, avg ROAS, top performer, trend
   - `performance/by-awareness-stage.md` — stage, # creatives, spend, avg ROAS, top performer, trend
5. Each aggregation includes period-over-period delta (last 7d vs prior 30d) so trend is visible.

### Primary inputs table


| Domain | Primary inputs |
|---|---|
| **Identity** | `identity-seed/team.md` from package; do not enrich with LinkedIn or scraped data |
| **Brand** | `_sources/web/*` + `_sources/motion/brand-context.json` + `_sources/company-facts.json` |
| **Customers** | Yotpo reviews (archive-first, then live) + `_sources/motion/brand-context.json` ICP + Apify Reddit/IG/TikTok output if no first-party VoC source is wired |
| **Competition** | Confirmed competitor set (seed + team additions) + the `_sources/inspo/<slug>.json` files for each |
| **Performance** | All `_sources/motion/meta-*`, `tiktok-*`, `creative-trends.json`, `creative-cache.json`, `benchmark.json` |
| **Strategy** | `_sources/motion/workspace-goal.json` + `_sources/motion/spend-threshold.json` + `_sources/motion/custom-conversions.json` |
| **Calendar** | Leave empty until the team confirms which integration owns calendar (Google Calendar, Notion, Asana, or whatever the team actually uses for launches and operating rhythms); note as "pending — confirm with CSM" |
| **Library** | `_sources/motion/creative-cache.json` index + pending integration for briefs/assets (Drive, Notion, Figma, Frame.io, or whatever the team uses; confirm with CSM) |
| **Knowledge** | `_sources/motion/glossary.json` + any decisions surfaced from the conversation history during synthesis |
| **Preferences** | Empty; grows as users give feedback during conversations |

**Validation before declaring synthesis done:** walk each `_sources/<category>/`
folder. If files exist in the staging directory but no domain doc cites them,
the synthesis is PARTIAL. Either merge them into the right domain doc now or
record the gap in the welcome card so the team isn't surprised. Don't say the
brain is done when staged sources remain unmerged.

**Additional validation for v1.3.0 substructures:**
- Brand: every product source row produces a `products/<slug>/spec.md` OR is logged as skipped with reason
- Customers personas: at least one persona file exists per persona named in brand-context or brand-audit
- Customers reviews: if a review source is wired but `by-source/<source>.md` is missing, that's a gap
- Customers ad-comments: if Meta Graph API or TikTok Business API is wired but `by-creative/` is empty, that's a gap
- Performance aggregations: every creative in `by-creative` should be tagged into at least one aggregation file (creatives without glossary tags get flagged in `_changelog.md`)

For domains where the data clearly maps, write durable facts with source pills.
For domains where the data is thin, write what's there and explicitly note what's
missing so the welcome card can ask about it.

## Step 4.W — Read the anchor

Between the ten-domain synthesis and the signals layer, read the onboarding/ folder to understand WHY this customer is paying for Motion. The anchor shapes how brain-onboard configures Runneth for them — which routines run, which integrations get prioritized, which signals populate, which capability cards get weighted. It does NOT shape creative output later.

### What lives in onboarding/ vs Motion-internal

Per standing rule #7 (brain content vs brain mechanics):

- **onboarding/** holds the team's content: what they said, decided, named, are solving. Their answer to why-Motion, their pain points, their goals, their success criteria, their progress, their words from each call.
- **Motion-internal** (`customers/<slug>/_internal-context/`) holds Motion's read: sentiment analysis, engagement levels per teammate, red flags, deal-health signals, intervention suggestions, the mapping of pain to setup decisions with full rationale.

Step 4.W reads only from onboarding/. Motion-internal interpretations stay on the CSM side.

### The onboarding/ folder

```
brain/onboarding/
├── README.md
├── why-motion.md                # THE ANCHOR (frontmatter: anchor: true)
├── pain-points.md               # what they're solving, structured by area
├── goals.md                     # 6-month vision and longer-term goals
├── success-criteria.md          # how they'll evaluate Motion was worth it
├── team-decisions.md            # track choice (AI-native vs Motion-foundation), integration choices
├── checklist.md                 # operational progress
├── calls-overview.md            # thin customer-facing explanation of the 5-call sequence
├── calls/                       # one file per onboarding call — CUSTOMER-FACING content only
│   ├── alignment-<gong-id>.md   # structured findings (their words, organized) — NO Motion interpretation
│   ├── runneth-setup-<gong-id>.md
│   ├── automations-workshop-<gong-id>.md
│   ├── motion-training-<gong-id>.md
│   └── csm-1on1-<date>-<gong-id>.md
└── _changelog.md
```

**The calls/ split.** Each onboarding call produces two outputs:
- `onboarding/calls/<call-id>.md` (customer-facing) — structured findings: their words, organized by the call template's sections. Field labels but no Motion interpretation. First names only; no Motion-internal role labels.
- `customers/<slug>/_internal-context/calls/<call-id>.md` (Motion-internal) — full Gong analysis including sentiment read, per-teammate engagement signal, red flags, deal-health flags, suggested next moves, intervention triggers.

Same source call, two outputs. The customer sees their own conversation back. Motion keeps the analytical lens internal.

### why-motion.md frontmatter contract

```yaml
---
domain: onboarding
ownership: user
substance: facts
managed_by: csm (initial) / user (ongoing)
sources:
  - { layer: 1, ref: "alignment call <gong-id>" }
  - { layer: 1, ref: "sales handoff hubspot:<deal-id>" }
anchor: true               # special marker — read this on every conversation
shapes:                    # which downstream decisions this file influences
  - routine-selection
  - integration-priority
  - signal-population
  - capability-weighting
refresh_cadence: on-customer-confirmation
last_refreshed: <iso>
confidence: high
---
```

### Population (from prep-customer-brain package)

If `_sources/alignment-findings.json` was included in the package by prep-customer-brain (the CSM pre-extracted the four anchor fields from the Gong alignment-call transcript), use it as the initial draft for why-motion.md, pain-points.md, goals.md, success-criteria.md. Frontmatter status starts as `confirmed_by_team: false`.

If the file is missing (alignment call hasn't happened yet, or pre-extraction didn't run), write stub files with `population_status: empty-needs-alignment-call` and surface that on the welcome card as a pending checklist item.

### Mapping anchor → downstream weights

For each pain point in pain-points.md, identify which downstream items it shapes:

| Pain area | Routines to prioritize | Integrations to prioritize | Signals to prioritize | Capability cards to weight |
|---|---|---|---|---|
| Brief production bottleneck | brief-templating, hooks-harvest | Asana, Notion, Drive | review-requests, hook-vocabulary | Copywriter, Creative Strategist |
| No competitor visibility | competitor-intel | (none typically wired) | inspo-steals, hook-vocabulary | Strategist, Founder |
| Slow hook iteration | weekly-performance-refresh | (Motion already wired) | format-gaps, audience-gaps | Performance, Strategist |
| Persona/customer ambiguity | review-refresh, audience-glossary-refresh | Yotpo, Apify | review-requests, audience-gaps | Copywriter, Founder |
| Reporting/visibility | weekly-performance-deck | (Motion already wired) | (none specific) | Performance, Founder |

This mapping is canonical. Customer-specific pain points that don't match a canonical pattern get logged in onboarding/team-decisions.md for the CSM to flag.

### Output of Step 4.W

A `_state.json` block recording:
```json
{
  "anchor": {
    "read_at": "<iso>",
    "why_motion_present": true,
    "pain_points_count": 3,
    "confirmed_by_team": false,
    "shapes_weights": {
      "prioritized_routines": [...],
      "prioritized_integrations": [...],
      "prioritized_signals": [...],
      "weighted_capabilities": {...}
    }
  }
}
```

Step 4.X (signals), Step 6 (welcome card), and Step 6.5 (checklist) all read this block.

### If the anchor is missing

If `onboarding/why-motion.md` is absent or empty, run in "uniform" mode:
- All signals weighted equally
- All capability cards weighted equally
- Welcome card surfaces a section: "Schedule the alignment call to anchor your brain"
- Checklist Section 0 (anchor confirmation) shows all items as todo

The team fills in the anchor during the alignment call → Runneth Set Up sequence, and brain-onboard re-weights on the next refresh.

## Step 4.X — Populate the signals layer

After the ten brain domains synthesize, derive the signals layer at `/agent/brain/signals/`. This is forward-looking intelligence: whitespace, gaps, untested opportunities. The team reads these when requesting briefs; routines update them week over week.

### Where schemas live

**Schemas are canonical and live in the GitHub repo**, not in this skill. Clone them at install time:

```bash
cd /tmp && rm -rf signal-schemas
git clone --depth 1 https://x-access-token:$(secret env CUSTOMER_BRAIN_READ_PAT)@github.com/Motion-Creative/customer_brain.git signal-schemas-repo
cp -r signal-schemas-repo/_signals-schemas /tmp/signal-schemas
```

The repo holds two layers:

1. **`_signals-schemas/` (canonical)** — eight standard signal types every brand can have. JSON Schemas for shape, `<signal>.population.md` for the rule that derives content.
2. **`<customer-slug>/_signals-custom/` (per-customer)** — optional extension schemas the CSM added for this specific customer (e.g., material-trend-gaps for an apparel brand, buying-committee-gaps for B2B SaaS). Same schema + population.md format.

Read both. Custom schemas extend canonical; they don't replace.

### Why schemas in repo, populated content local

Schemas are brand-agnostic — same shape for every install. Keeping them in the repo means:

- One source of truth for all customers
- New canonical signal types ship via PR to the repo, not via brain-onboard upgrade
- Custom signal types per customer use the same schema discipline
- Customer Runneths get schema updates automatically on next refresh

Populated signals stay local at `/agent/brain/signals/`. They don't push back to the repo because customer Runneths only have read access. The CSM checks customer signal state by asking Runneth, not by browsing the repo.

The signals/ directory always contains one populated file per schema (canonical + custom). If a signal can't be populated because upstream brain content is too sparse, write the file with `items: []` and `_meta.population_status: empty-needs-upstream-content`.

### Directory layout

```
brain/signals/
├── README.md                  # overview, signal counts, last-refreshed dates
├── format-gaps.json           # product × format whitespace
├── audience-gaps.json         # untargeted audience segments × product fits
├── inspo-steals.json          # competitor angles not in own rotation
├── seasonal-whitespace.json   # upcoming occasions with no creative coverage
├── review-requests.json       # customer asks from VoC mining
├── organic-paid-gaps.json     # organic themes absent from paid rotation
├── hook-vocabulary.json       # competitor language territories not in own copy
├── graveyard-candidates.json  # paused concepts worth reconsidering
└── _changelog.md
```

### Common file frontmatter (`_meta` block on every JSON)

```json
{
  "_meta": {
    "domain": "signals",
    "ownership": "system",
    "substance": "patterns",
    "managed_by": "brain-onboard (initial) / <refresh-routine> (ongoing)",
    "sources": [{ "layer": "synthesis", "ref": "<brain content read to derive this>" }],
    "refresh_cadence": "weekly",
    "last_refreshed": "<iso>",
    "confidence": "<high | medium | low>",
    "population_status": "<populated | partial | empty-needs-upstream-content>",
    "population_status_reason": "<why empty if applicable, e.g. 'no competitors confirmed yet'>"
  },
  "items": [ ... ]
}
```

### Population rules per file (brand-agnostic logic, brand-specific output)

Each signal file has a deterministic population rule. brain-onboard runs the rule against the brand's actual synthesized content. The rule produces brand-specific items.

**Read the rules from `_signals-schemas/<signal>.population.md` in the repo.** The eight canonical population rules summarized below; see the repo for full detail and any custom rules added per customer.

**1. `format-gaps.json` — product × format whitespace**

- **Reads:** `brand/products/<slug>/spec.md` (all products) + `performance/by-visual-format.md` (proven formats by ROAS/CTR)
- **Rule:** For each product with spend ≥ $500 in last 90 days, identify proven formats it has never been tested in. A "proven format" is any visual format in `performance/by-visual-format.md` ranked in the top quartile by primary KPI account-wide.
- **Item shape:** `{ product_slug, product_name, untested_formats: [{ format, account_kpi, account_spend, why_brief_worthy }], priority: high|medium|low }`
- **Brand-agnostic:** the cross-reference logic is identical for any brand. Printfresh produces prints × formats; an apparel brand produces SKUs × formats; a wellness brand produces products × formats.

**2. `audience-gaps.json` — untargeted audience segments × product fits**

- **Reads:** motion ai-glossary audience taxonomy + `performance/by-persona.md` + `brand/products/`
- **Rule:** Pull every Intended Audience value from `motion ai-glossary`. Cross-reference against audience tags appearing in active creative (from `motion meta insights` glossary tags). Surface audiences with **zero** active creative in the last 60 days that have a clear product fit (intersection with `brand/products/` keywords).
- **Item shape:** `{ audience_segment, product_fits: [product_slugs], creative_gap_days, why_brief_worthy }`
- **Brand-agnostic:** the gap detection logic is identical. Brand-specific audiences emerge from the glossary.

**3. `inspo-steals.json` — competitor angles not in own rotation**

- **Reads:** `competition/<brand-slug>/active-ads.md` (all confirmed competitors) + `performance/by-messaging-angle.md` + `performance/by-hook-tactic.md`
- **Rule:** For each watched competitor, extract messaging angles and hook tactics from their active ads (using motion ai-glossary tags on inspo creatives). Identify angles or tactics appearing in **2+ competitors** that are absent from own active creative.
- **Item shape:** `{ angle_or_tactic, used_by_competitors: [brand_slugs], not_in_own_creative_since: iso_or_never, why_brief_worthy }`
- **Brand-agnostic:** works for any brand with named competitors and inspo creative pulls.

**4. `seasonal-whitespace.json` — upcoming occasions with no creative coverage**

- **Reads:** `calendar/` + `performance/top-creatives.md`
- **Rule:** For each known upcoming launch, seasonal moment, or operating rhythm in `calendar/` within the next 90 days, check if creative has been briefed (presence in `performance/top-creatives.md` or in active spend within the relevant window). Flag moments with no creative coverage.
- **Item shape:** `{ occasion, date, days_until, creative_status: "none"|"partial"|"covered", urgency: high|medium|low, suggested_anchor_products: [slugs] }`
- **Brand-agnostic:** works for any brand with calendar content. Empty if calendar domain is sparse.

**5. `review-requests.json` — customer asks from VoC mining**

- **Reads:** `customers/reviews/raw/<source>.json` (all raw review data)
- **Rule:** Pattern-match review verbatims for explicit asks. Common patterns: "I wish you had X," "I would buy X if," "please make X," "why don't you have X," "I'm looking for X." Cluster matches into themes. Surface themes with ≥3 mentions.
- **Item shape:** `{ ask_theme, verbatim_examples: [up to 5], mention_count, related_product_slugs, gap_type: product|silhouette|use-case|seasonal|other }`
- **Brand-agnostic:** the pattern-matching is identical across brands. Empty if no review source is wired.

**6. `organic-paid-gaps.json` — organic themes absent from paid rotation**

- **Reads:** `_sources/apify/instagram.json` + `_sources/apify/tiktok.json` (organic content) + `performance/by-messaging-angle.md`
- **Rule:** Tag organic posts with motion ai-glossary messaging angles. For each organic angle with engagement above brand-account median, check if that angle has any active paid creative. Surface angles performing organically but absent from paid.
- **Item shape:** `{ messaging_angle, organic_engagement_signal, top_organic_examples: [post_urls], paid_status: "no-active-creative", why_brief_worthy }`
- **Brand-agnostic:** works for any brand with organic content pulled via Apify.

**7. `hook-vocabulary.json` — competitor language territories not in own copy**

- **Reads:** `competition/<brand-slug>/active-ads.md` (competitor ad copy) + `performance/top-creatives.md` (own ad copy)
- **Rule:** Extract distinctive language patterns from competitor ad copy: nouns repeated across multiple ads of the same competitor, verbs/adjectives used by 2+ competitors, sensory or emotional language territories. Compare against own active creative copy. Surface language territories present in competitors but absent from own.
- **Item shape:** `{ language_territory, competitor_examples: [{ brand, ad_copy_excerpt }], not_in_own_copy: true, sample_application: "how this could be brief-worthy" }`
- **Brand-agnostic:** linguistic comparison logic is identical across brands.

**8. `graveyard-candidates.json` — paused concepts worth reconsidering**

- **Reads:** `_sources/motion/creative-cache.json` (historical creatives, including paused) + `performance/top-creatives.md` (current active)
- **Rule:** From the historical creative cache, identify ads with strong historical performance (top quartile by primary KPI when active) that have been inactive for ≥45 days. For each, infer pause reason (fatigue, seasonal, audience shift, replaced by similar) and suggest resurrection conditions.
- **Item shape:** `{ creative_id, creative_summary, paused_since, historical_kpi, inferred_pause_reason, resurrection_conditions: "what would have to be true to relaunch" }`
- **Brand-agnostic:** works for any brand with sufficient performance history.

### Population status semantics

Every signal file declares its population status in `_meta`:

- `populated` — file has items derived from sufficient brain content
- `partial` — some upstream content available, more would help (e.g., 1 competitor confirmed but the rule expects ≥2 for inspo-steals)
- `empty-needs-upstream-content` — upstream brain content too sparse to derive signals (e.g., no review source wired, so review-requests can't be populated)

When the team triggers a brief, the briefing chain reads only files with status `populated` or `partial`. Empty files are surfaced in the welcome card and the onboarding checklist as "Connect <source> to unlock <signal>".

### Refresh

Signals/ updates on the same cadence as the underlying brain content:

- Per-routine: if `competitor-intel` runs weekly, `inspo-steals.json` and `hook-vocabulary.json` re-derive at the end of that routine
- Per-routine: if `weekly-performance-refresh` runs, `format-gaps.json` and `graveyard-candidates.json` re-derive
- Per-routine: if `review-refresh` runs, `review-requests.json` re-derives
- On-demand: any team member can ask "refresh signals" and Runneth re-derives all signals (canonical + custom) from current brain content

Every refresh re-clones schemas from `_signals-schemas/` so the customer Runneth picks up new canonical schemas, schema updates, or custom schemas the CSM added since the last refresh.

### `signals/README.md` overview

Written by brain-onboard at install. Lists the eight files with counts, last-refreshed timestamps, and population status. Format:

```markdown
# Signals overview

Forward-looking intelligence derived from synthesis. Read by the briefing chain.

| File | Items | Status | Last refreshed |
|---|---|---|---|
| format-gaps.json | 12 | populated | <iso> |
| audience-gaps.json | 0 | empty-needs-upstream-content | <iso> |
| ... |

Connect the missing sources to unlock empty signal files. See `/agent/brain/onboarding-checklist.md`.
```

### Briefing chain integration

When the team requests a brief (via runneth-classic's briefing chain or any other brief generation flow), Step 1.5 of the briefing chain reads all populated signal files and selects the 1-3 most brief-changing items relevant to the brief target. The brief that comes back reflects what hasn't been tested, what customers are asking for, and what competitors are doing that the team isn't.

This is the architectural shift Rachel codified during the Printfresh pilot: routines write signals, briefs are human-initiated, and Runneth pulls signals as inputs every time. The brain gets smarter every week not because routines write briefs, but because the signal state of the world is current.

## Step 4.Y — Populate the operational layer

After the signals layer, scaffold the operational layer: three registries at `/agent/brain/integrations/`, `/agent/brain/routines/`, and `/agent/brain/apps/`. They sit as siblings to the ten domains and `signals/`. This is the auditable counterpart to the brain's knowledge — what's connected, what runs, what's been built — so any teammate can read data lineage off the brain instead of the manifest or the filesystem.

All three registries always get a `README.md` at install, even when near-empty, with the table header and a `(none yet)` row where applicable. `integrations/` is seeded immediately from the manifest; `routines/` and `apps/` start sparse and grow as the team wires routines and builds apps. Every README carries the standard `_meta` frontmatter, with `managed_by` reflecting who maintains the registry going forward.

### `integrations/` — the connection registry

Mirrors the internal `integration-capabilities-library` pattern. One folder per connected integration plus a README index.

```
integrations/
├── README.md                     # table: integration, status, feeds-which-domains, last verified
├── <integration>/
│   └── capabilities-and-scopes.md
```

- **Populated at install** from the manifest: `wired_customer_integrations` (status `connected`) and `tools_team_uses_not_yet_in_runneth` (status `recommended`, not yet connected). Write one README row per integration in both states.
- **Each entry records which brain domains it feeds** (e.g. Yotpo → Customers reviews, Shopify → Brand products, Northbeam → Performance), so data lineage is auditable from the brain side, not just the manifest.
- **Kept current by the `oauth_connection` automation turn / `integration-onboarding`,** which already writes the `capabilities-and-scopes.md` file shape for each integration. Don't duplicate that work here — scaffold the registry, seed the README from the manifest, and let the onboarding flow own per-integration capability files going forward. For integrations already wired at install, write the per-integration folder with whatever capability detail the manifest carries; flag the rest as `pending integration-onboarding`.

`integrations/README.md` frontmatter + table:

```markdown
---
domain: integrations
ownership: system
substance: facts
managed_by: brain-onboard (initial) / oauth_connection + integration-onboarding (ongoing)
refresh_cadence: on-connect
last_refreshed: <iso>
confidence: high
---

# Integrations registry

What's connected to this Runneth and which brain domains each source feeds.

| Integration | Status | Feeds domains | Last verified |
|---|---|---|---|
| Yotpo | connected | Customers (reviews) | <iso> |
| Shopify | recommended | Brand (products) | — |
| ... |
```

### `routines/` — the routine registry

The folder Reza's own example tree draws that the brain is otherwise missing. Solves the same audit problem as the internal `routine-storage-audit`: every routine declares what it writes to.

```
routines/
├── README.md                     # table: routine, cadence, trigger, writes-to, last run, status
├── <routine-slug>.md             # one per routine: full config + write target
```

- **Starts near-empty at install** (few routines wired day one); grows as routines get set up. Write the README with the table header and a `(none yet)` row if nothing is wired.
- **Each entry names its write target** — which domain doc or `signals/` file it refreshes — closing the loop on the "routines write signals" architecture so any teammate can see what keeps each domain or signal current.
- When a routine is later created (via the `reminder` CLI or a setup skill), add or update its `<routine-slug>.md` and the README row. The signals refresh routines documented in Step 4.X each get a registry entry naming the signal files they re-derive.

`routines/README.md` frontmatter + table:

```markdown
---
domain: routines
ownership: system
substance: facts
managed_by: brain-onboard (initial) / routine setup (ongoing)
refresh_cadence: on-change
last_refreshed: <iso>
confidence: high
---

# Routines registry

What runs on a schedule and what each routine keeps current.

| Routine | Cadence | Trigger | Writes to | Last run | Status |
|---|---|---|---|---|---|
| (none yet) |
```

### `apps/` — the app registry

```
apps/
├── README.md                     # table: app, route, reads-which-state, purpose, created
```

- **Starts empty;** grows as apps get built. README has the table header and a `(none yet)` row.
- **Records the durable state each app reads** so apps stay views-over-state, not state owners. When an app is built, add its row naming the brain paths or `data/` files it reads.

`apps/README.md` frontmatter + table:

```markdown
---
domain: apps
ownership: system
substance: facts
managed_by: brain-onboard (initial) / app-builder (ongoing)
refresh_cadence: on-change
last_refreshed: <iso>
confidence: high
---

# Apps registry

What's been built and which durable state each app reads.

| App | Route | Reads state | Purpose | Created |
|---|---|---|---|---|
| (none yet) |
```

### Validation

- All three READMEs exist after this step, each with valid `_meta` frontmatter.
- `integrations/README.md` has one row per manifest integration (connected + recommended); no wired integration from the manifest is missing.
- `routines/` and `apps/` READMEs render even when empty (`(none yet)` row).
- Append a `_changelog.md` line per registry on each synthesis run, same format as the domains.

## Step 5 — Update INDEX.md

Append entries to `/agent/INDEX.md` for each domain doc written, so future
conversations can find them. Include aliases and a one-line note per entry.

## Step 6 — Render the welcome card

The card leads with **why the team is here** (the anchor), then **what the brain enables for each person** (capability frame), then **what's in the brain** (per-domain readout). Capability frame stays before data-readback.

Structure:

1. **Header.** "<Brand> is in Runneth's brain."
2. **Why Motion (the anchor) — NEW.** Above-the-fold dark ink callout block. Reads from `onboarding/why-motion.md`. Includes:
   - The why-Motion answer (one paragraph the team confirmed)
   - 2-4 pain points the team is solving (from `onboarding/pain-points.md`)
   - Optional: success criteria if confirmed
   This block stays prominent because every conversation, every refresh, every team member walks in seeing why they're here first.
3. **Onboarding status — NEW.** One line under the anchor:
   > "8 of 22 onboarding milestones complete · Next: Confirm why-motion with your team (Runneth Set Up call Jun 6)"
   Links to the full checklist at `onboarding/checklist.md`.
4. **"What's in your brain by domain" readout.** One short section per domain,
   each leading with a headline number and 2–3 highlights. This replaces the
   old "knows by heart" snapshot — the per-domain readout covers the same
   high-signal facts (KPI, top performer, headcount, brand positioning,
   customer voice, dominant hook) but anchored to where they actually live
   in the brain. Format per domain:

   ```markdown
   ### <Domain>
   - <Headline number or fact>
   - <Highlight 1 from this domain's actual content>
   - <Highlight 2 from this domain's actual content>
   - <Pending note if domain is sparse>
   ```

   Required per domain (skip if empty after synthesis — note as pending):

   - **Identity:** N teammates rostered, named roles, agency partners flagged
   - **Brand:** positioning one-liner, voice traits (3), product count and top
     by review volume
   - **Customers:** N personas, top 3 pain themes, total reviews + comments
     indexed, sources wired
   - **Competition:** N competitors confirmed (or pending team confirmation
     with names), per-brand active-ad counts when known
   - **Performance:** N active creatives, spend range, primary KPI, top
     performer by that KPI, best hook tactic and best visual format by KPI,
     period-over-period trend if available
   - **Strategy:** primary KPI + attribution windows, spend threshold, active
     bets if surfaced from workspace-goal
   - **Calendar:** known upcoming launches/seasonal moments (or pending — team decides which integration owns calendar)
   - **Library:** brand-kit/asset inventory (or pending — team decides which integration owns library content)
   - **Knowledge:** glossary term count, decisions surfaced from conversation
     history
   - **Preferences:** empty on day one — grows as the team gives feedback

   Plus a **Signals** section sitting alongside (not inside) the ten domains:

   - **Signals:** N opportunities surfaced across the eight signal files (format-gaps, audience-gaps, inspo-steals, seasonal-whitespace, review-requests, organic-paid-gaps, hook-vocabulary, graveyard-candidates). Headline: total item count + count of files that are empty pending upstream content. End with `/agent/brain/signals/`.

   Plus one **Operational layer** line sitting alongside the domains and signals:

   - **Operational layer:** N integrations wired, M recommended (not yet connected); R routines running; A apps built. One line, e.g. "3 integrations wired, 4 recommended; 0 routines yet; 0 apps." End with the three registry paths: `/agent/brain/integrations/`, `/agent/brain/routines/`, `/agent/brain/apps/`.

   Each domain section ends with a 1-line link or path so the team knows
   where to look: "Full content at `/agent/brain/<domain>/`".

5. **Capability cards by role (weighted by anchor — NEW behavior).** Order/emphasize cards based on which pain points each role addresses (from Step 4.W's `weighted_capabilities` block). Example: if the team's top pain is "brief production bottleneck," the Copywriter and Creative Strategist cards lead. If the top pain is "no competitor visibility," the Strategist and Founder cards lead. The card content is unchanged; only the order and visual emphasis adapt.

One card per active teammate or per role,
   showing what's concretely different now that the brain is built. Each card:
   - Person's name (or role if anonymous)
   - Three or four capability one-liners ("draft a brief that pulls customer
     pains by name," "teardown last week's ad against our persona set," etc.)
   - One or two suggested prompts the person can paste

6. **"What's not in the brain yet."** List pending OAuths and integrations as
   explicit asks, framed by what the team actually uses for each domain. For
   each recommended integration, **show why it's recommended** by tying it to
   a specific pain point from `onboarding/pain-points.md`. Example:
   > "Connect Asana — addresses your brief production bottleneck pain."
   This is transparent and shows the team how Motion thinks about their setup.
   Pull the pairing from `tools_team_uses_not_yet_in_runneth` in the manifest,
   not from a default mapping. Never assume a specific tool fills a specific domain —
   the team might use Google Calendar, Notion, Asana, or nothing for Calendar;
   they might use Drive, Notion, Figma, or Frame.io for Library. If a domain is
   sparse and no integration has been named for it, say so plainly: "Calendar —
   no source identified yet, decide with CSM what to use." If synthesis was
   PARTIAL because staged sources weren't merged into domain docs, flag that
   here too. Include any Motion gaps surfaced during install (creative cache
   disabled, TikTok not connected, Apify scrapers blocked, etc.).

   End this section with a one-line link to the full onboarding checklist:

   > Full onboarding checklist at `/agent/brain/onboarding-checklist.md` — work through this with your CSM to get from "brain installed" to Runneth as a member of the team.

### Domain readout rules

- Lead with a **concrete number**, not "populated/empty." "12 products in
  catalog" beats "Brand populated."
- Use the **brand's actual content** in highlights, not the spec template.
  Quote real customer voice, name real top performers, name real competitors.
- If a domain is sparse, say so explicitly with what the team would need to fill it, not a default tool name: "Calendar — no source identified yet, decide with CSM" beats "Pending Notion OAuth."
- Keep each domain section to 3–4 lines max. The team should scan all ten
  in under 30 seconds.

### Below the card

Two minimal asks:

- **Role chip** (creative strategist, brand lead, performance marketing,
  content, ops, marketing leader)
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
The capability-first structure plus the per-domain readout replaces any
generic "here's what we ingested" framing.

## Step 6.5 — Write the onboarding checklist

Right after the welcome card renders, write `/agent/brain/onboarding/checklist.md` — the brand-agnostic continuation checklist for the team and their CSM to accomplish together. **Location moved in v2.0.0** from `/agent/brain/onboarding-checklist.md` (root) to `/agent/brain/onboarding/checklist.md` (under the onboarding folder) so all anchor-related content sits together.

This is the document Reza's vision implies: how the team gets from "brain installed" to "Runneth feels like a member of the team."

The checklist file persists in the brain. The team can update progress over time (checking items off). The CSM reads it during weekly check-ins. The onboarding-progress-watcher routine runs **customer-side** (in the customer Runneth) and auto-updates detectable items daily by checking their own Slack channels, integrations, refresh routine state, and brain content. The customer Runneth owns its own progress detection. New teammates onboarding into the customer Runneth read the checklist to learn the patterns.

### v1.x → v2.0 migration

If `/agent/brain/onboarding-checklist.md` (root) exists from a v1.x install:
1. Move it to `/agent/brain/onboarding/checklist.md`
2. Leave a 30-day stub at the old path pointing to the new location
3. Preserve any team edits

If neither path exists, write fresh per the structure below.

### File location and frontmatter

```yaml
---
domain: onboarding
ownership: mixed
substance: facts
managed_by: brain-onboard (initial) / user (progress tracking) / onboarding-progress-watcher (customer-side, auto-detect)
sources:
  - { layer: meta, ref: "synthesis findings from brain-onboard install" }
refresh_cadence: never
last_refreshed: <iso>
confidence: high
---
```

Save at `/agent/brain/onboarding/checklist.md`. Surface it on the welcome card as a one-line status under the anchor (see Step 6 item 3) AND under "What's not in the brain yet" as: "Full onboarding checklist at `/agent/brain/onboarding/checklist.md` — work through this with your CSM."

### Checklist structure

Five sections. Some items always present, some pulled from synthesis findings.

```markdown
# Onboarding checklist

Status: [ ] todo  [/] in progress  [x] done

## 0. Anchor confirmation (Ale's ask — confirm the why-Motion)

[Pulled from `onboarding/why-motion.md`, `onboarding/pain-points.md`, etc.]
- [ ] why-motion.md drafted from alignment call
- [ ] Team confirms why-motion captures what they're solving (during Runneth Set Up)
- [ ] Pain points ranked and confirmed
- [ ] Success criteria agreed with team

## 1. Calls scheduled and complete

[Pulled from Gong + HubSpot calendar for the new five-call onboarding sequence]
- [ ] Alignment call completed
- [ ] Runneth Set Up scheduled
- [ ] Automations Workshop scheduled
- [ ] Motion Training scheduled
- [ ] First CSM 1:1 booked

## 2. Brain enrichment (close the gaps surfaced at install)

### Integrations to connect
[Pulled from "What's not in the brain yet" — each pending OAuth becomes one item]
- [ ] Connect <integration> to fill <domain>
- ...

### Brain content to confirm
[Pulled from synthesis findings flagged for team review]
- [ ] Confirm competitor watchlist (current seed: <list>)
- [ ] Confirm persona names and priorities
- [ ] Add any internal data the team wants in the brain (decks, notes, transcripts)
- ...

### Motion gaps to resolve
[Pulled from Motion-side gaps surfaced during install]
- [ ] Enable creative cache in Motion settings
- [ ] Connect TikTok ad account if relevant
- [ ] Configure Apify API key for organic VoC pulls
- ...

## 3. Operating habits (set up how Runneth works alongside the team)

### Slack channels
- [ ] Create #ask-runneth (where anyone on the team asks Runneth anything)
- [ ] Create #train-runneth (where champion + CSM debug failed answers)
- [ ] Add Runneth to both channels
- [ ] Invite teammates

### Roles
- [ ] Identify the brain champion (one power user who pairs with CSM going forward)
- [ ] Each teammate selects role chip on first conversation

### Refresh routines
- [ ] Walk through refresh-config conversation with CSM (Runneth recommends, team confirms)
- [ ] Wire agreed routines as scheduled scripts
- [ ] Confirm first weekly refresh fires successfully

## 4. First dopamine moments (Reza's pattern: the team experiences the value)

- [ ] Each teammate asks at least one question in #ask-runneth
- [ ] Team uses "save this" or "remember this" pattern at least once
- [ ] First brief generated using the signals layer + persona + product dossier
- [ ] First failed answer routed through #train-runneth and resolved

## 5. Compound effect (weeks 2-4)

- [ ] Wire routines for the domains the team confirmed should stay current
- [ ] Connect any pending integrations from section 1
- [ ] Champion saves at least three things to brain independently
- [ ] Team references signals files when planning next creative

## 6. Forever loop (ongoing)

- [ ] Weekly: CSM scans #ask-runneth and #train-runneth, fixes failed answers
- [ ] Monthly: CSM re-runs prep-customer-brain and pushes refresh
- [ ] Quarterly: full team walk through brain health with CSM
- [ ] Brain champion identifies anything to flag back to Motion as a feature request
```

### Per-customer customization

Sections 2, 3, 4, 5 are template — same shape every customer. Sections 1 items are pulled from real synthesis findings:

- **Integrations** — every entry in the welcome card's "What's not in the brain yet" becomes a checklist item with the destination domain noted. These items mirror the `integrations/` registry written in Step 4.Y (each `recommended` row); point each checklist item at its registry entry so connection status lives in one place.
- **Brain content to confirm** — pull from any domain doc that ended with "pending team confirmation" or competitor-seed entries the team hasn't named
- **Motion gaps** — pull from anything Motion-side surfaced during install: creative cache disabled, TikTok not connected, Apify key missing, attribution windows undefined, etc.
- **Refresh routines** — the section 2 "Refresh routines" items correspond to the `routines/` registry written in Step 4.Y. As each routine is wired, its checklist item is satisfied and a registry row appears naming its write target.

If a section has no items because nothing was flagged, write the section header with "(nothing pending)" instead of dropping it. The structure stays consistent across customers so teams know what to expect.

### Updating progress

The team checks items off by editing the file directly or by telling Runneth "mark X done." brain-onboard never re-overwrites the checklist after the initial write. Routines may APPEND new items if new gaps emerge (a new integration the team mentioned, a new Motion setting that needs tuning), but never remove or re-check existing items. The team owns progress tracking.

### Why this matters

Reza's vision: the CSM and customer are partners for life, with a clear shared playbook. The checklist is that playbook, made concrete for each specific customer. It eliminates the freeforall by giving every install the same shape of follow-up, while still being specific to that team's actual gaps.

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
  "onboarding_folder_populated_at": "<iso>",
  "onboarding_checklist_written_at": "<iso>",
  "anchor_read_at": "<iso>",
  "anchor_shapes_applied": true,
  "domains_empty": ["preferences"],
  "operational_layer_populated": true,
  "operational_layer": {
    "integrations_registered": 3,
    "integrations_recommended": 4,
    "routines_registered": 0,
    "apps_registered": 0
  },
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
- Whether the operational layer is populated (integrations/routines/apps registries written)
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
- **Never run `motion meta age-gender` or any Meta demographic analysis.** Demographics are not part of the brain build. They are expensive to pull, slow to synthesize, and not load-bearing for creative strategy work. Personas come from VoC (Yotpo reviews, ad comments), not from Meta-targeting demographics.
