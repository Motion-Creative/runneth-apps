# Runneth Brain + Knoweth: Setup and Maintenance (Onboarding Package)

### Version 1.0 (July 2026)

**How Runneth organizes the brain so retrieval stays tight and the org stays understood as it grows: lanes over the content onboarding produced, plus the standing save and maintenance discipline that keeps it that way.**

The one-line model:

> The data packages (VoC Data Pull, Meta Creative Attribution + Account Context) put **content** in the brain. **Knoweth** puts **structure** over it: lanes and projects that gate retrieval, a save contract so new writes land right, and a maintenance loop so weeks of human edits do not rot it. Knoweth runs after the content and the confirmed interpretation exist, then holds going forward.

This part is **cross-cutting**. Unlike the Meta-only parts, it spans every data-source family on the VM (VoC, asset library, Meta, and any others) and every future write. It reflects the live packages (VoC Data Pull under `data-sources/voc/`, Aligned Onboarding v2 under `/agent/brain/meta/`) and the Cacheth/Counteth creative stores; the two roots are reconciled by the lane -> path map below, not by moving files.

---

## How this activates and where it sits in onboarding

This is the last setup step of the combined run and the first line of ongoing maintenance. Installing only stages this file; it does not self-run. It activates the same way as the other parts: when a person runs the package (the README run order), merge the two guard blocks below into `/agent/user.md`, then the triggers fire.

**MERGE INSTRUCTIONS:** For each block, if its sentinel (`runneth:knoweth-organize` or `runneth:knoweth-brain`) already exists in `/agent/user.md`, replace it in place. Otherwise append it. Never duplicate. Do not edit anything outside the sentinels.

**Guard 1 — organize the brain (runs once, after the questions are answered).**

```
<!-- BEGIN runneth:knoweth-organize v1 -->
Knoweth organize (after the questions are answered):
- When the account interpretation is [CONFIRMED] (e.g. /agent/brain/meta/account-context.md fields
  signed off) and data-source content has landed (VoC files under /agent/brain/data-sources/voc/**;
  creatives under /agent/brain/meta/creatives/ or Cacheth flagged in), and the brain has not been
  organized yet, organize it. Do not wait to be asked.
- TODAY only three lanes are searched: global, user:<userId>, and project:<workspaceId> (the
  workspace). Keep all shared content in the global lane (the brain root default) and make it findable
  with tags/attributes and a naming decoder. Do NOT carve data-source-family or initiative lanes
  (voc, meta, campaign, ...): those lanes are not queried yet, so the content would go dark. Use a
  user: lane only for genuine per-person isolation. The workspace lane is automatic.
- Do not organize an empty brain. If content has not landed, say what is missing and route back.
- Record the tag vocabulary + naming decoder, and note it in /agent/brain/_changelog.md. When the
  harness starts layering configured lanes (see the forward path), promote high-value tags to family
  lanes then, not before.
<!-- END runneth:knoweth-organize v1 -->
```

**Guard 2 — standing save and maintenance contract (always on).**

```
<!-- BEGIN runneth:knoweth-brain v1 -->
Knoweth brain discipline (all writes, going forward):
- On every save (from a pull, a conversation, or an upload), route it: raw vs compiled vs spec; the
  data-source family folder (voc -> data-sources/voc/**, meta -> /agent/brain/meta/**); tags/attributes
  and provenance. Keep it in the global lane so it is searchable today; the folder is for human
  navigation, not a lane. Where Cacheth is flagged in, do not also write per-creative files.
- Keep compiled pages in sync with raw: new evidence restales and regenerates the dependent page; a
  correction updates the compiled page (never raw) and propagates. Curate, do not append: merge into
  the existing page rather than spawning a duplicate.
- Adopt stray human-added files (classify and tag, or flag) without moving the human's folders.
  Default new dimensions to tags, not lanes; only user: isolation and the automatic workspace lane
  are real lanes today.
- Keep one brain-maintenance routine: run `routine list --search "brain-maintenance"`; if absent,
  create it (a scheduled sweep for stray/untagged files, duplicates, stale pages, retention
  candidates) and never run the sweep in-conversation.
<!-- END runneth:knoweth-brain v1 -->
```

### Prerequisites (hard gate)
Do not set up lanes until both are true: the account interpretation is `[CONFIRMED]`, and data-source content has landed (VoC files exist; creatives exist under `meta/creatives/` or Cacheth is flagged in). Lanes describe what is actually in the brain, so laning before content produces empty or wrong scopes. If either is missing, say what is missing and route back; never fake it.

### Scope
Cross-cutting: every data-source family and every future write, not one platform. The per-source packages own their own folder conventions and how-to docs; Knoweth owns the layer above them (lanes, the retrieval contract, save routing, maintenance) and the **lane -> path map** that names each family's real root. One owner per fact; Knoweth points down to the source packages rather than restating their paths.

### Persistence
The durable artifacts are the tag vocabulary + naming decoder plus the two `/agent/user.md` guard blocks above; the Knoweth lane config only carries what is actually queried today (global, user isolation, the automatic workspace lane). Index this doc in `/agent/INDEX.md` (aliases: knoweth, lanes, retrieval, save routing, brain maintenance) with a one-line note.

### Where it sits in the combined run
The package files land on the VM automatically; a person says "run the package." The run: (1) set up integrations if not connected; (2) pull data and ask the interpretation questions (Account Context Brain); (3) run the validation loop (starter questions, the customer confirms or corrects); (4) **organize the brain with Knoweth now that content and confirmed interpretation exist**; then it holds going forward through the guard blocks and the maintenance routine. Sequencing note: lanes are best set up once interpretation is confirmed and content has landed. If validation should exercise the organized brain, run the organize step just before the validation loop rather than strictly last; confirm the exact position for your rollout.

**How to read this.** The method is the standard and the contents are decided. The structure, schemas, procedures, and rules below are the same on every VM. What you fill in is decided per brand: which segments, products, metrics, personas, naming, and sources exist all come from that brand's own data and needs. Follow the method exactly; decide the contents from the brand. Where a rule depends on a platform detail that can change (a capacity limit, the config format, whether a store is flagged in), verify it against the live configuration.

---

## 1. The two-layer brain: raw and compiled
Knowledge has two layers and flows one way.
- **raw = evidence.** Source material, never rewritten in substance. It lives in one of two places: as **brain files** under `data-sources/<family>/<integration>/` (one flat folder per integration; item type is the filename prefix; the folder is for navigation, and today all of it sits in the `global` lane), or in a **harness-backed store** when the platform has one. Meta is deployment-dependent: **by default** the creative-attribution step writes one file per creative under `/agent/brain/meta/creatives/<AdName>.md` (identity, summary, hook, transcript, AI tags, naming), and writing the file IS the index step. **Where Cacheth is flagged in**, per-creative summaries live in Cacheth (performance in Counteth) and are surfaced through Knoweth, so those files are NOT written. Same content is either brain files or a harness store depending on whether Cacheth is present, never both.
- **compiled = understanding.** Agent-maintained to a schema: the interpretation specs and the synthesized analysis (segments, personas, performance reads). The human corrects it in conversation, never hand-edits it. The agent may create, rewrite, merge, and delete compiled pages within the schema.
- **One-way flow: raw to compiled, never back.** Evidence is the source of truth; a compiled page is the current understanding of it. When they disagree, fix the compiled page, not the evidence.
- **Curate, do not just append.** Merge duplicates, delete dead pages.

Both layers are the agent's to manage; the one-way flow and never-rewrite-raw discipline are behavioral, enforced by Runneth (see section 12), not by separate storage.

---

## 2. How Knoweth retrieves (grounded in the Knoweth service)
Knoweth is a Rust resolver that indexes approved brain roots into SQLite + a Tantivy lexical index + optional OpenAI embedding vectors, and answers `/resolve` with ranked chunks (not whole files), each carrying its metadata. It watches roots and reindexes on change. Two stores are NOT indexed by Knoweth: **Cacheth** (creative asset/summary/AI tags/transcript) and **Counteth** (performance metrics). Anything living only in those stores is not Knoweth-searchable.

Per query, in order:
1. **Lane ACL gate (hard).** Lanes are hard namespaces (`lane_id`): `global`, `user:<id>`, `project:<id>`, or a family/domain lane. A request carries `user_id`, `project_id`, and requested `lanes.read`; Knoweth intersects them with the `[policy]` grants and searches only authorized lanes. **In the current harness the requested read set is exactly `[user:<userId>, project:<workspaceId>, global]` with `project_id = <workspaceId>`, so today only the global lane, the caller's user lane, and the workspace lane are searched.** Custom family lanes (`voc`, `meta`, ...) are never requested and never searched; the brain root defaults to `global`, so everything in the brain is found, and carving a sub-lane would move it out of `global` and hide it.
2. **Three candidate channels inside the authorized lanes:** lexical BM25 (Tantivy, boosting title, heading path, **tag**, exact phrase, path, body, with exact symbol/path/filename matches protected); graph expansion (document/import/path-twin neighbors); and adaptive dense (one query embedding vs cached chunk vectors, used when lexical/exact confidence is low, `use_dense_when_confidence_below` ~0.72).
3. **Exact-preserving RRF fusion** merges the three, then an **intent-aware packer** assembles the context (exact-lookup vs summary vs procedural vs comparison packing, with document focus).

Two consequences drive everything below. **Tags/attributes are a ranking signal, not a gate:** they boost lexical rank and feed the embedding input, but never scope the search; only the lane ACL scopes. So keep vocabulary consistent, keep a naming decoder, and put the words a question will use into the file. Terminology: what earlier notes called a "facet" is not a Knoweth primitive. The real levers are **lanes/projects** (the ACL gate) and **attributes/tags** (a ranking signal in the text).

### The answer standard: route by where the evidence lives, then combine
Every onboarding/validation question resolves to one of two evidence homes; classify first, then combine the mechanisms.
- **Knoweth-indexed (brain files):** VoC (`data-sources/voc/**`), the Meta interpretation layer (`meta/account-context.md`, naming taxonomy), asset-library, and per-creative files *when they are written*. Answered directly: lane gate + lexical (tags/keywords) + dense.
- **Store-backed (not in Knoweth):** Meta creative content (summary, AI tags, transcript) in **Cacheth**, performance in **Counteth**. Answered by the CLI, with Knoweth supplying only the interpretation lane.

Routing by question type:
- "What are 1-star reviewers saying about Product A?" -> `voc` lane; lexical on rating/product/segment terms + dense; agent-side filter. Pure Knoweth.
- "Campaign names / account structure / naming / what the data means to us" -> `meta` lane: `account-context.md` + naming taxonomy. Pure Knoweth.
- "Top winning ads this week" -> Counteth (rank by the account's winner metric + spend floor) + Cacheth (creative identity) + `meta` account-context (what "winner" means). A join; Knoweth is the interpretation, not the data.
- "Performance by campaign / product" -> Counteth + `meta` naming decode (which campaigns map to which product).
- "Themes in winning ads (from AI tags + summaries)" -> Counteth (winners) + Cacheth (AI tags/summaries) + `meta` account-context (winner def). This is exactly why "AI tags aren't searchable in Knoweth": where Cacheth is flagged in, the per-creative files are not written, so their tags live in Cacheth, not the Knoweth index. Either write the per-creative files (default model, so tags become lexical-boosted + embedded) or route tag/theme questions through Cacheth. Do not expect Knoweth's index to contain Cacheth tags.
- "What are we testing / scaling / graduating" -> Counteth (spend state) + `meta` account-context (the graduation rule, still a flagged/needed field).

### Why some data is not indexed in Knoweth
Everything the agent needs is reachable; the question is where it is stored, not whether it can be used. Knoweth indexes the **brain files** (VoC, the interpretation layer, specs, asset metadata) so they are searchable by meaning and keyword. The **creative store (Cacheth)** and **performance store (Counteth)** are large, structured, frequently-updated datasets with their own query paths; they are surfaced through the CLI (and, under Knoweth, alongside brain results), not copied into the search index. Duplicating them into files would bloat the index, split the source of truth, and go stale. So a creative or metric is "not in Knoweth" the same way a database is not in a wiki: the wiki points at it. Write the interpretation (what a creative means, how a metric is judged) as a brain file; leave the creative and the number in their store.

### Works with or without Knoweth
The organizing discipline here, folders, tags, save routing, specs, and maintenance, is retrieval-agnostic: it holds whether or not Knoweth is the retrieval layer on a given VM. Only the lane configuration is Knoweth-specific. Retrieval scoping (lanes and projects) becomes fully live as the Knoweth harness rolls out; until a VM is on it, the safe default that works on any harness is to keep shared content in `global` and slice with tags. A parallel version of this package without Knoweth reuses everything except the lane config, so keep the two separable: never write a file that only makes sense if lanes are active.

---

## 3. The two organization layers: folders vs the retrieval overlay
- **Folders = the human layer.** The visible, editable brain tree; the customer's map. They reorganize it freely. Optimize for human sense-making. Caveat: not everything retrievable is visible here. Harness-backed lanes (meta creatives in Cacheth) have no files in the tree, so the human-facing view is the folder tree plus the agent or a source-of-truth dashboard for those lanes.
- **Lanes and projects = the retrieval overlay.** Agent-owned, optimized for retrieval. Coupled to folders via glob patterns, but many-to-many (one folder can feed several projects; one project can span folders). Under the hood both are the same primitive, a `lane_id` (`global`, `user:<id>`, `project:<id>`, or a family/domain lane); a request layers several (e.g. `["meta","project:css-2026","global"]`) and `[policy]` grants keyed by `user_id`/`project_id` decide which are readable. So a "project" is a lane by convention, and user/team separation means `user:`/`team:` lanes plus grants, not a different mechanism. Front-matter is not itself a Knoweth query filter (see section 5).

**How folders affect lanes.** Today they mostly do not: all shared brain content sits in the `global` lane regardless of folder, so reorganizing folders never changes retrieval scope. Folders are the human's navigation map. (Forward path: once the harness layers configured lanes, a family folder could back a family lane via `[[lane_assignments]]`; until then keep everything in `global` and slice with tags.) Knock-on effects that still hold: save-routing must write into the right family folder and tag it, or a file is mis-tagged; existing-org repair must re-home stray files and backfill tags; and any routine or app that reads the brain by path breaks if folders move, so treat the folder layout as stable.

---

## 4. The canonical Knoweth config rule
**What is queryable today (the hard constraint).** The harness requests exactly three lanes: `global`, `user:<userId>`, and `project:<workspaceId>` (the workspace). Family/business/initiative lanes are not requested, so they are not searched. Therefore:
1. **Default all shared content to the `global` lane** (the brain root default) and make it findable with **tags/attributes + a naming decoder**. Tags are the working slicer. Do not carve data-source-family lanes (`voc`, `meta`, `asset-library`) or initiative lanes (`project:css-2026`) on a live VM today: a `[[lane_assignments]]` glob would move that content out of `global` and it would go dark. `project` is the workspace, not an arbitrary initiative, so a campaign/initiative is a **tag**, not a project lane. Multi-workspace orgs (agencies) get per-workspace separation for free via `project:<workspaceId>`.
2. **Use a real lane only for what is actually gated today:** `user:` lanes for genuine per-person isolation, and the automatic workspace lane. Everything finer (segment, product, campaign, rating, angle, hook) is a tag, resolved by keyword/dense ranking plus agent-side filtering. Put those words in the file so they are findable.
3. **Forward path (design for it, do not ship it yet).** The family-lane scheme (a lane per data-source family, plus a few earned business lanes) becomes viable only when the harness layers configured lanes into the requested read set. Until that ships, family lanes stay as tags in `global`. File the harness change as a dependency; when it lands, promote the high-value tags to family lanes via `[[lane_assignments]]`, keep the set small and under the cap (over-laning, e.g. a lane per platform or per workstream, is the usual way to blow the cap), and update the config then.
4. **Folders = the human's navigable tree.** Folders are for human sense-making, not lanes today (the lane is `global` regardless of folder). Reorganizing folders is safe; it does not change retrieval scope.

### Allocating new content (tag -> project -> lane)
When new content or a new dimension shows up, allocate it in this order, proactively (not driven by where a file happened to land):
- **Tag it (default).** A slice of existing content (rating, segment, product, campaign, angle) stays in `global` and gets a tag. Costs nothing, always discoverable, gives the "slice inside a lane" behavior. Most new things land here.
- **Project = workspace (automatic).** Do not hand-carve project lanes; the only project lane queried is the workspace. Multi-workspace separation is free.
- **Lane (rare).** Only for genuine read isolation (`user:` per-person; a client lane in a future multi-tenant setup). Today only `user:` isolation is wired.
- **Propose, do not silently create.** If a tag is asked for constantly or the org clearly works in bounded initiatives, propose promoting it (to a family lane once the harness supports it, or a documented tag convention now). Keep a written allocation policy so new content is classified consistently over time.

### How and when lanes get set up (users and workspaces)
Lanes are not something the setup hand-builds for most orgs. What happens automatically: every request already carries the caller's `user:<userId>` lane and the `project:<workspaceId>` lane for the workspace it runs in, layered with `global`. So:
- **`global`** is set up by default (the brain root); shared org content lives here and needs no lane work.
- **The workspace lane (`project:<workspaceId>`)** is automatic per workspace. You do not create it; content saved while working a workspace is scoped to it. This is how a multi-workspace org gets per-workspace separation for free.
- **A `user:` lane** is only set up when there is genuinely per-person private content or a person-level isolation need. You populate it by assigning that person's content to their user lane (by path or tag) and granting it to their `user_id`; most single-brand orgs never need one.
- **Custom lanes** (a data-source family, a client, a business area) are the forward path only; they are not queried today, so do not create them now.
The scenario test: shared across the org -> `global`; belongs to one workspace -> the workspace lane already holds it; one person's private material -> a `user:` lane; anything finer -> a tag.

### Adapting to the org type: single-brand vs multi-workspace
Orgs differ, and the setup should read which kind it is rather than assume. Most orgs run a single workspace; a smaller number (agencies and large teams) run many, and those multi-workspace orgs generate a large share of real usage. Adapt:
- **Single-workspace org:** the workspace is the whole brand. Everything is `global` plus the automatic workspace lane; tags do all the slicing. Do not invent projects or lanes, there is nothing to separate.
- **Multi-workspace org (agency, large team):** each workspace is already its own `project:<workspaceId>` lane, so per-client/per-brand separation is automatic. Put shared, reusable knowledge (playbooks, templates, cross-client conventions) in `global` so every workspace can reach it, and let each workspace's own content stay in its workspace lane. Do not carve custom per-client lanes; that duplicates what the workspace lane already does and burns the cap.
This is what "a project inside a lane" means in practice: a query layers `[user, project:<workspaceId>, global]`, so a workspace's content sits inside the org-wide `global` context at query time. The workspace is the one business dimension that maps to a project today; every other dimension (segment, product, campaign) is a tag inside that scope, not its own project or lane.

### Slices the config must make easy
For `voc`: by star rating, by tag, by segment/persona, by emerging segment, by keyword, by quote. For `meta`: by campaign, by the account's KPI, and by decoded angle/hook/format via the naming decoder. These are not structured filters; they resolve by keyword search on the facet text plus agent-side filtering of returned files, so put the facet words in the file (header and body) to make the slices findable.

### Isolation vs retrieval scoping
A lane is the only hard boundary. Today a single brand needs no isolation lanes at all (everything sits in `global`); an agency gets per-client separation for free from the automatic `project:<workspaceId>` lane. Reserve a `user:` lane only for genuine per-person isolation.

### Default skeleton (guaranteed on every VM, the contract Knoweth defaults against)
```
/agent/brain/
  data-sources/                                    # raw evidence; folders for navigation (all in the global lane today)
    voc/<integration>/review-<id>.md              # one flat folder per integration; item type is the filename prefix
    voc/<integration>/ticket-<id>.md              # (no reviews/ or tickets/ subfolders)
    voc/meta-ads/comment-<id>.md                  # meta ad comments are VoC
    voc/reddit/post-<id>.md
    voc/<integration>/<integration>-context.md    # compiled: segments, personas, keywords, quotes
    asset-library/<integration>/file-<id>.md      # creative/asset files; another data-source family (lane)
  meta/                                            # meta lane (today under /agent/brain/meta/, NOT data-sources/)
    creatives/<AdName>.md                          # one file per creative by default; writing the file is the index step
    creatives/_tagging-taxonomy.md                 # provisional naming table, only if a convention is detected
    account-context.md                             # compiled interpretation (9 fields + spend-confidence floor)
    _changelog.md
                                                   # where Cacheth is flagged in: creatives live in Cacheth/Counteth, NOT written as files
  integrations/<source>/                          # source guide specs; raw dumps forbidden here   [not indexed]
  team/<person>.md  team/user-map.json
/agent/INDEX.md
```
Meta lives under `/agent/brain/meta/`, not `data-sources/`. By default the creative-attribution step writes one file per creative under `meta/creatives/` (writing the file is the index step); where Cacheth is flagged in, those creatives live in Cacheth (Counteth for performance) and are surfaced via Knoweth, so no files are written. `account-context.md` is the interpretation layer in both cases.

### Declaring the config (real format, from the Knoweth service)
Knoweth reads a TOML config (`version = 2`). The pieces that matter for lanes/projects:
- `[[roots]]` with `lane_id` + `path` sets a root's default lane (a `voc` root defaults every file under it to the `voc` lane).
- `[[lane_assignments]]` override the lane for a root-relative path glob, last match wins (e.g. `css-2026/**` -> `project:css-2026`). This is how a project or business lane is carved out of a tree.
- `[policy]` with `default_read_lanes` and `[[policy.lane_grants]]` keyed by `user_id` and/or `project_id` (each `read = [lanes...]`, optional `write`) is the ACL: it decides which layered lanes a request can read. User/team separation lives here (grant `user:alice` only to `user_id = "alice"`).
- `[embeddings]`, `[hybrid]`, `[resolver]` tune the search channels (checked-in default is guarded OpenAI hybrid: lexical + graph + adaptive dense, fused with RRF).
The lane count matters because every authorized lane is scored per query; keep the set small (verify the cap). **Caveat: today only `global`, `user:<userId>`, and `project:<workspaceId>` are in the requested read set, so `[[lane_assignments]]` that create family/initiative lanes are forward-path only, using them now hides content.** Keep content in `global` plus tags until the harness layers configured lanes. The skeleton plus the front-matter attributes are the content the config's roots/assignments are generated from. Note the repo is migrating to the OS package format (`runneth-package.json` schema-v1, targets under `agent_brain`/`agent_skills`/`agent_tools`/`agent_apps`); the Knoweth package registers there.

---

## 5. Front-matter (findability and provenance, not a filter)
Front-matter is **not a Knoweth query filter.** Retrieval runs on lane (today `global`, `user:<userId>`, and the workspace) plus lexical/dense search over the text. The header earns its place for four things only: lexical findability (facet words become searchable text), provenance (`sources` cite the exact raw file), chunk-standalone context (a chunk is retrieved without its neighbors), and agent-side filtering of returned files. Keep it lean and do not restate what the path or config already encode. VoC raw file (one per item), aligned to the installer package's unified record:
```
---
kind: evidence
source_platform: <platform>
source_type: review | ticket | comment
external_id: "<id>"
lane: voc                        # forward-path tag; today content is in the global lane, this only bites once the harness layers configured lanes
project: [voc, segment-<name>, product-<name>]   # membership tag used only if the config reads it; segment/product are searchable facets, not structured filters
rating: <1-5 or null>
tags: [<brand tag>, ...]
segment: <segment/persona or null>
author_contact: null            # PII policy: contact nulled; retained payload PII flagged
captured: <date>
retain_until: <date or window>
---
<verbatim item, never rewritten>
```
Compiled page (analysis, spec): `page_type: compiled | spec`, `lane`, `project`, `substance: facts | interpretation`, `sources: [...]` citing raw, `last_compiled`, `confidence`. Meta interpretation pages point at the Cacheth creative and the campaign KPI rather than embedding creative data.

---

## 6. Save routing and refresh
On new information, decide in order:
1. **Evidence with no harness store** (VoC item, asset file, transcript, note) -> `data-sources/<family>/<integration>/<type>-<id>.md` (e.g. `data-sources/voc/<integration>/review-<id>.md`, `data-sources/asset-library/<integration>/file-<id>.md`), append/overwrite by id (idempotent), never rewrite substance, indexed.
2. **Meta creatives** -> by default write one file per creative under `/agent/brain/meta/creatives/`; where Cacheth is flagged in, leave them in Cacheth/Counteth surfaced via Knoweth and do not write those files. Never keep both.
3. **Compiled understanding** (segments, personas, performance read, a fact) -> the matching compiled page; merge/rewrite, cite raw, follow the schema.
4. **How-to-read a source/metric/dashboard** -> a spec in `integrations/` (reference, unindexed).
5. **Preference or standing instruction** -> `team/<person>`. **One-off scratch** -> do not persist.
Enforce one-way flow; regenerate a compiled page from evidence when corrected, never hand-patch; update the index on durable saves.

**Refresh and cost.** The raw pull becomes a deterministic script (cheap, near-free). The agentic analysis on top (compiling segments/personas/reads) is the expensive step. Set cadence deliberately and, ideally, with CSM/user input; do not silently ship an expensive recurring routine a customer does not know about. Bounded pulls (a trailing window, server-side date bounds where available) keep both cost and index size in check; archive raw past `retain_until` once its facts are compiled and cited.

---

## 7. Deciding the structure for a brand
Today all shared content lives in the `global` lane, so what the agent decides per brand is the **tag vocabulary and the naming decoder**: which segments/personas exist, which products and campaigns to tag, the account's real KPI, and the words each question will use. Method:
1. List the real questions the team asks (from data, routines, interview answers).
2. Tag each by the dimension it scopes on (segment, product, campaign, rating, funnel stage).
3. Make every recurring dimension a **tag/attribute** with a consistent name, recorded in the naming decoder. Note the dimensions asked for constantly as **candidates for a future family lane** (forward path); do not carve a lane now.
4. Read the human's folders as a signal of what matters, and complement rather than mirror them.

The costly-to-reverse decision is the lane set; that is exactly why the default is tags (which re-tag cheaply) and why family lanes wait for the harness change rather than being carved on day one. Stay minimal: `global` + tags now, `user:` lanes only for real isolation, the workspace project lane automatic.

---

## 8. Standard specs: what they are and how to set them up
A **Standard spec** is a canonical, triggerable setup for one capability, stood up the same way on every VM: the raw ingestion contract, the compiled schema, the questions to ask the human, and the validation. Three initial Standards:
- **Meta (Aligned Onboarding v2, three steps).** Step 1 Creative Attribution: one enriched record per active creative (identity, summary, hook, transcript, AI tags, naming) written to `/agent/brain/meta/creatives/<AdName>.md` by default (writing the file is the index step), or, where Cacheth is flagged in, left in Cacheth/Counteth and surfaced via Knoweth with no files written. Step 2 Account Context Brain (`/agent/brain/meta/account-context.md`): the interpretation layer, nine fields, with naming decode confirmed as the handoff from Step 1 and the mandatory spend-confidence-floor ask. Step 3 Validation: the answer-and-confirm loop, the weekly deck, and the MVCE (minimum viable context engine) gate. Ask the human the account idiosyncrasies platform settings cannot capture: the real success metric, which conversion event judges winners and whether products roll up, attribution windows, the cut rule, per-campaign KPI differences, naming clarifications. Validate: performance questions answer with numbers that reconcile to source.
- **Voice of Customer.** Raw is one file per review/ticket/comment under `data-sources/voc/<integration>/` (item type in the filename), unified metadata, never sanitized, `author_contact` nulled. Compiled is the analysis layer: segments, emerging segments, keywords, quotes, personas, each tracing to items. Ask the human: canonical sources, which personas are established vs aspirational, off-limits claims. Validate: every claim traces to a real verbatim.
- **Brain and Knoweth setup (this document).** Raw is the connected-data probe; compiled is the org-understanding page plus the specs; it lays the seeded skeleton and the default overlay.

The spec files are short reference pages the human fills in with the agent's help. Fill-in loop: connect the data, teach the agent the idiosyncrasies, visualize to validate, confirm against the question set.

**The standard-spec shape, in more detail.** A spec is a short, load-bearing definition of one capability that Runneth is trained to recognize and the customer fills in with content, not structure. It has four parts: the raw ingestion contract (what lands, where, in what file shape), the compiled schema (what the interpretation page looks like), the questions to ask the human (the idiosyncrasies platform data cannot capture), and the validation (how you know it is right). The same shape backs the other durable primitives the org builds on, a dashboard, a context source, a routine: each is a named definition of the primitive's shape, so the language is agreed, taught to Runneth, and consistent across VMs. The customer never edits the structure; they supply the specifics (their sources, their metrics, their naming), and Runneth keeps the filled spec in sync with the evidence.

---

## 9. Initial setup sequence, new org
1. **Probe** what is connected; record as evidence, best-effort.
2. **Write the org-understanding page** from that data, each line citing evidence; flag unknowns as asks; assume platform settings are wrong and re-ask.
3. **Keep shared content in the `global` lane** and set the tag vocabulary + naming decoder (family lanes are a forward path, not carved today).
4. **Decide the facets** per brand (segments, products, campaigns, KPI) from the questions.
5. **Seed the load-bearing compiled pages first:** org-understanding, the naming decoder / meta interpretation, the VoC analysis layer, the question validator. Content-first, not empty scaffolding.
6. **Validate and run the loop** (section 11).

Setup experience: **act, do not be "too meta."** Do the work and surface results; do not narrate what you are about to do and ask permission at each step. Autofill everything you can, then surface only the 3-8 gap questions the human must answer; the CSM or customer answers them through their own process.

---

## 10. Existing org repair checklist
1. **Read the existing folders** and respect them.
2. **Inventory dependencies** (routines, apps that reference paths) before moving or re-tagging.
3. **Audit lanes.** Collapse any lane-per-platform or lane-per-workstream mess back into `global` + tags; those custom lanes are not queried today, so their content is likely dark. Keep only `user:` isolation lanes and the automatic workspace lane.
4. **Migrate in safe order: tags first, then projects, then lanes.** Never delete a lane holding unique indexed content without re-homing it.
5. **Move source dumps into `data-sources/`**; stop copying Cacheth-backed creatives into files; stop indexing specs.
6. **Fill or remove empty scaffolding.**
7. **Dry-run, apply, then verify what is actually readable** and run the validator.

---

## 11. Validation and the eval loop
- **The question validator** is the done-signal: can the agent answer the org's core questions correctly from its own data. Run it graded; a failure points at a missing spec or a bad pull.
- **Close the loop with good / bad / why**; corrections regenerate the compiled page, never touch raw.
- **Instrument questions trained and trusted** as the real metric.
- **A validation dashboard is the visual proof** the compiled understanding reconciles to source, in the customer's own metrics.

---

## 12. Rollout, triggering, and how it stays consistent
- **The package ships to the GitHub repo and installs on every VM, but installing does not act.** A trigger is needed: an SSH conversation per VM that says "use this package / do the readme," which runs the setup. New orgs onboard this way; existing orgs get a manual cleanup pass.
- **VoC auto-installs on connect** (the connect-time dispatch), so a connected platform pulls without a manual trigger; secrets-path platforms use the manual `package intent add-integration` route.
- **Refresh** runs as a deterministic script (cheap pull) with agentic analysis on top (set cadence deliberately, section 6).
- **Non-divergence has two homes.** One is the per-VM setup/config file (the handoff that lays the overlay). The other is Runneth's system prompt, which must teach how Knoweth works, the retrieval model (global + tags today, family lanes as a forward path), where each store lives (Cacheth/Counteth vs brain files), and where to save. That system-prompt work is a separate stream; without it the method is followed by hand and drifts, with it the method holds. This doc is the specification; the prompt change makes it stick.

### Self-organization over time
Setup gets a VM clean on day one; staying organized over weeks of real use is a separate, mostly-runtime problem, because the human keeps adding and moving files and Runneth keeps writing. What degrades: user-added files land with no front-matter, no family folder, or no tags; folder moves orphan content or break path-based routines; compiled pages go stale as new raw arrives; duplicates accumulate; conversational corrections do not propagate; the lane scheme erodes as ad-hoc lanes creep in; raw grows past the index budget; new integrations and new segments/products appear mid-life; and renames break keyword retrieval.

Countering that is behavior Runneth runs on the relevant turns, not a one-time setup:
- **Classify on every save.** Any write (pull, conversation, upload) runs the save-routing decision: raw vs compiled vs spec, family/lane, project tags, provenance. User-triggered saves land correctly, not in a default dump.
- **Adopt stray files.** When Runneth reads the brain and finds human-added files with no header or outside the convention, classify and tag them into the right lane/project or flag them, without moving the human's folders.
- **Respect and re-anchor on reorganization.** When the human moves folders, re-derive the overlay and re-anchor membership; if a move crossed a family boundary, reconcile the lane.
- **Keep compiled in sync with raw.** New evidence triggers regeneration of the dependent compiled pages with fresh citations; mark a compiled page stale when its raw changed. This is one-way flow enforced over time.
- **Curate, not append.** Find the existing page on a topic and merge or supersede rather than spawn a duplicate; delete dead pages.
- **Propagate corrections.** A conversational correction fixes the compiled page (never raw) and checks whether it invalidates other compiled pages.
- **Guard the scheme.** Resist adding lanes; default new dimensions to facets/projects; propose a lane only when it clearly earns one.
- **Enforce retention.** Archive raw past its window once compiled, keeping the index lean.
- **Extend cleanly.** A new integration mid-life runs the same probe -> family folder -> spec -> lane-decision -> seed flow; new segments/products/campaigns update the org-understanding page and the facet vocabulary.
- **Maintain vocabulary.** Because retrieval is keyword-first, a rename updates the naming decoder and adds aliases (or re-tags) so old content stays findable under new terms.

Some of this is reactive (on the turn it comes up); the rest needs a **recurring maintenance routine** (the daily/weekly brain-audit shape): scan for stray/untagged files, duplicates, stale compiled pages, ad-hoc lanes, and retention candidates, then fix or surface them. Pull-side refresh is a cheap deterministic script; the audit and compile are the agentic steps, so set cadence deliberately. Bottom line: setup organizes day one, but self-organization over weeks lives in the system prompt (these behaviors) plus a maintenance routine. Without them the brain drifts back to entropy no matter how clean the initial setup.
---

## Maintaining this going forward
Two mechanisms keep the brain organized after day one, and both are set up by this part:
1. **The `runneth:knoweth-brain` guard in `/agent/user.md`** (Guard 2 above) makes the discipline always-on: every save is routed and tagged, compiled pages regenerate when their raw changes, corrections update the compiled page (never raw), stray human-added files get adopted, and duplicates get merged rather than appended. This is what stops weeks of human edits from rotting the brain.
2. **The `brain-maintenance` routine** (create-if-absent) runs the scheduled sweep the guard cannot do reactively: stray/untagged files, duplicates, stale compiled pages, ad-hoc lanes, and retention candidates.
`/agent/user.md` is the durable home for this behavior, so keep it current as the org evolves: a rename updates the naming decoder (and adds aliases, since retrieval is keyword-first); a new integration runs the same probe -> folder -> spec -> tag flow; a new recurring dimension becomes a tag. Section 12 has the full behavior list; this is the short version to hold in your head.

## 13. Gotchas
- **Only `global`, `user:<userId>`, and `project:<workspaceId>` are queried today; keep shared content in `global` + tags and do not carve family/initiative lanes (they go dark). Lane count stays capped for the forward path.**
- **Empty scaffolding equals empty retrieval.** Seed content-first.
- **Keep one canonical view of the model** (this doc); the agent misread its own setup when there was none.
- **Read-access scoping can silently hide everything;** verify readability after setup.
- **Where Cacheth is flagged in, do not also write per-creative files** (Knoweth surfaces the creatives from Cacheth; files would duplicate). Where Cacheth is not present, the creative-attribution step DOES write one file per creative, and that file is the index step.
- **Sourcing discipline holds:** trust live data, assume manual platform settings are wrong and re-ask, never fabricate, label inferences.

---

## 14. Worked example (illustrative)
A brand asks "top ads for Product A last week." Runneth ranks in Counteth by the account's winner metric, pulls creative identity from Cacheth, and reads the interpretation page (`meta/account-context.md`, in `global`) for how Product A is judged plus the naming decoder for angle/hook/format. A VoC question ("what are one-star reviewers saying about Product A") searches the `global` lane over `data-sources/voc/<integration>/review-*`, ranked by the `rating:1` and `product-a` tags plus segment terms, with agent-side filtering. Neither carves a lane. When the human corrects an interpretation, the compiled page regenerates from the cited raw; the raw is never edited.

---

## 15. Standard method, brand-decided contents
- **Standard on every VM:** the raw/compiled model and one-way flow; how retrieval works; folders vs overlay; the retrieval model (everything in `global` + tags today, `user:` isolation, workspace project automatic, family lanes a forward path); the front-matter schema; save routing and refresh discipline; the Standard-spec format; setup, repair, and rollout; the validation loop; and not duplicating Cacheth/Counteth into files.
- **Decided per brand:** the tag vocabulary and naming decoder (segments/personas, products, campaigns, KPI), any future family-lane candidates; the contents of each spec; and what the org-understanding page says. These come from the probe, the interview answers, and the human's folders.

Verify against the live configuration before finalizing: the lane cap, the config-declaration format, which stores are flagged in (Cacheth/Counteth), and whether the harness has begun layering configured lanes. The direction (global + tags today, family lanes as a forward path gated on the harness change; project = workspace; front-matter for findability and provenance, not a Knoweth filter; content-first; harness stores not duplicated; validate) holds regardless.

---

## How this actually governs Runneth (be honest about it)
This doc is findable reference knowledge. On its own it does not hard-enforce lanes or save-routing; the two `/agent/user.md` guard blocks are what make the lane-setup trigger fire and the save/maintenance discipline always-on, and that merge is admin-gated. The enforceable artifact is the Knoweth lane config; the guard blocks are the standing behavior; this doc is the human-readable contract the CSM, the customer, and Runneth can all point at. Without the guard merge, the method is followed by hand and drifts; with it, it holds.

## Changelog
### v0.1 (July 2026) — first draft aligned to the packages
- Reframed the front to the Aligned Onboarding house style: version, one-line model, activation guard blocks, hard-gate prerequisites, scope, persistence, honesty section.
- Two sentinel guard blocks: `runneth:knoweth-organize` (post-questions organize) and `runneth:knoweth-brain` (standing save + maintenance).

### v0.2 (July 2026) — corrected to the real retrieval wiring
- Traced the harness: the requested read set is `[user:<userId>, project:<workspaceId>, global]`; `project` is the workspace, and family/custom lanes are not queried today.
- Reframed the lane model (section 4) to: everything in `global` + tags today; `user:` for isolation; workspace project is automatic; family lanes are a documented forward path gated on a harness change (option B).
- Guard 1 renamed lanes-setup -> organize (tags + naming decoder, not family lanes).
- Positioned as the last setup step of the combined run and the first line of ongoing maintenance; sequencing of lanes vs validation flagged for the package owner.
- Body (two-layer model, retrieval, lanes, front-matter, save routing, self-organization, packaging) unchanged.
