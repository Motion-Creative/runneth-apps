# Runneth Brain + Knoweth: Setup and Maintenance (Onboarding Package)

### Version 1.0 (July 2026)

**How Runneth organizes the brain so retrieval stays tight and the org stays understood as it grows: lanes over the content onboarding produced, plus the standing save and maintenance discipline that keeps it that way.**

The one-line model:

> The data packages (VoC Data Pull, Meta Creative Attributes + Account Context) put **content** in the brain. **Knoweth** puts **structure** over it: lanes and projects that gate retrieval, a save contract so new writes land right, and a maintenance loop so weeks of human edits do not rot it. Knoweth runs after the content and the confirmed interpretation exist, then holds going forward.

This part is **cross-cutting**. Unlike the Meta-only parts, it spans every data-source family on the VM (VoC, asset library, Meta, and any others) and every future write. It reflects the live packages (VoC Data Pull under `data-sources/voc/`, Meta and Voice of Customer Onboarding under `/agent/brain/meta/`) and the Cacheth creative store; the two roots are reconciled by the lane -> path map below, not by moving files.

---

## How this activates and where it sits in onboarding

This is the last setup step of the combined run and the first line of ongoing maintenance. Installing only stages this file; it does not self-run. It activates the same way as the other parts: when a person runs the package (the README run order), merge the two guard blocks below into `/agent/user.md`, then the triggers fire.

**MERGE INSTRUCTIONS:** For each block, if its sentinel (`runneth:knoweth-organize` or `runneth:knoweth-brain`) already exists in `/agent/user.md`, replace it in place. Otherwise append it. Never duplicate. Do not edit anything outside the sentinels. The canonical copies of these blocks are the staged guard files `/agent/brain/meta-and-voc-onboarding/guards/knoweth-organize.md` and `/agent/brain/meta-and-voc-onboarding/guards/knoweth-brain.md` - merge from those files, copying each block byte-for-byte; never paraphrase, condense, or restate any part of a block (the package's post-install run does this in its single scripted guard merge). The blocks below are shown for context and must stay identical to the staged files.

**Guard 1 — organize the brain (runs once, after the questions are answered).**

```
<!-- BEGIN runneth:knoweth-organize v2 -->
Knoweth organize (after the questions are answered):
- Organize the brain when all three gates hold; do not wait to be asked:
  (1) the account interpretation is [CONFIRMED] - check the fields-confirmed count in the
  "File metadata" block at the end of /agent/brain/meta/account-context.md;
  (2) content has landed: the voc-sync-<platform> backfill reports full date-window coverage (not
  just files existing - read the latest run summary via routine history --id <routine-id>),
  and creatives are in Cacheth;
  (3) /agent/brain/_tag-vocabulary.md does not exist - writing it is the organize step's last act,
  so its existence means done; update the file instead of re-running.
- TODAY only three lanes are searched: global, user:<userId>, and project:<workspaceId> (the
  workspace). Keep all shared content in the global lane (the brain root default) and make it findable
  with tags/attributes and a naming decoder. Do NOT carve data-source-family or initiative lanes
  (voc, meta, campaign, ...): those lanes are not queried yet, so the content would go dark. Use a
  user: lane only for genuine per-person isolation. The workspace lane is automatic.
- Detect single- vs multi-workspace first: a single-workspace org is all global + tags; a multi-workspace org relies on the automatic per-workspace lane and puts shared knowledge in global. Do not carve custom lanes either way.
- Do not organize an empty brain. If content has not landed, say what is missing and route back.
- Finish by writing the tag vocabulary + naming decoder to /agent/brain/_tag-vocabulary.md (gate 3's
  done-marker) and noting it in /agent/brain/_changelog.md. When the harness starts layering
  configured lanes (see the forward path), promote high-value tags to family lanes then, not before.
<!-- END runneth:knoweth-organize v2 -->
```

**Guard 2 — standing save and maintenance contract (always on).**

```
<!-- BEGIN runneth:knoweth-brain v2 -->
Knoweth brain discipline (all writes, going forward):
- On every save (from a pull, a conversation, or an upload), route it: raw vs compiled vs spec; the
  data-source family folder (voc -> data-sources/voc/**, meta -> /agent/brain/meta/**); tags/attributes
  and provenance. Raw VoC files keep their skill-owned format - never add tags or front-matter
  to them; facet vocabulary goes in the compiled analysis pages that cite them. Keep it in the
  global lane so it is searchable today; the folder is for human
  navigation, not a lane. Cacheth is the system of record for per-creative content: write a
  per-creative file only when a person explicitly asks, and treat it as a dated snapshot (the
  cache stays the retrieval source of truth for current facts). Performance metrics are pulled
  live via the motion CLI, never saved.
- Keep compiled pages in sync with raw: new evidence restales and regenerates the dependent page; a
  correction updates the compiled page (never raw) and propagates. Curate, do not append: merge into
  the existing page rather than spawning a duplicate.
- Adopt stray human-added files (classify and tag, or flag) without moving the human's folders.
  Default new dimensions to tags, not lanes; only user: isolation and the automatic workspace lane
  are real lanes today.
- Keep one brain-maintenance routine: run `routine list --search "brain-maintenance"`; if absent,
  create it (a scheduled sweep for stray/untagged files, duplicates, stale pages, and retention
  candidates; per-creative files in the brain exist only by a person's explicit ask - if the
  sweep finds ones of unknown provenance, ask the person before archiving, never silently move
  or delete them) and never run the sweep in-conversation.
<!-- END runneth:knoweth-brain v2 -->
```

### Activation checklist (verify it actually fired)
Because this activates by a run following the README rather than by an automatic trigger, verify it landed:
1. Both sentinels `runneth:knoweth-organize` and `runneth:knoweth-brain` are present in `/agent/user.md`.
2. The organize step ran: `/agent/brain/_tag-vocabulary.md` exists (the tag vocabulary + naming decoder, and the durable done-marker) and is noted in `/agent/brain/_changelog.md`.
3. The `brain-maintenance` routine exists (`routine list --search "brain-maintenance"`).
If any is missing, activation is incomplete; finish it before calling the package done.

### Prerequisites (hard gate)
Do not set up lanes until Guard 1's gates 1 and 2 hold: the account interpretation is `[CONFIRMED]`, and content has landed complete (the VoC backfill reports full date-window coverage - a mid-backfill folder has files but has not "landed"). Lanes describe what is actually in the brain, so laning before content produces empty or wrong scopes. If either is missing, say what is missing and route back; never fake it.

**Gate 2 fallback — VoC data without a sync routine.** If VoC content landed outside the
voc-data-pull skill (synced externally), the `routine history` coverage report does not exist
and gate 2 would wait forever. Verify coverage directly from the files instead: for each
platform folder under `/agent/brain/data-sources/voc/`, read the oldest and newest item dates
and confirm the range spans the intended pull window with recent items present. Two honesty
rules: this is a weaker signal than the backfill report (a partial pull can look complete on
date range alone), so record that the check was file-based; and data without a routine is not
staying current, so passing the gate this way comes with an offer to set up the sync routine
— it clears the organize step, not the missing sync.

### Scope
Cross-cutting: every data-source family and every future write, not one platform. The per-source packages own their own folder conventions and how-to docs; Knoweth owns the layer above them (lanes, the retrieval contract, save routing, maintenance) and the **lane -> path map** that names each family's real root. One owner per fact; Knoweth points down to the source packages rather than restating their paths.

### Persistence
The durable artifacts are the tag vocabulary + naming decoder at `/agent/brain/_tag-vocabulary.md` (also the organize done-marker) plus the two `/agent/user.md` guard blocks above; the Knoweth lane config only carries what is actually queried today (global, user isolation, the automatic workspace lane). Index this doc in `/agent/INDEX.md` (aliases: knoweth, lanes, retrieval, save routing, brain maintenance) with a one-line note.

### Where it sits in the combined run
The run order is owned by the package README ("Install and run order", at `/agent/brain/meta-and-voc-onboarding/README.md` beside this doc); this part is its organize step. The sequence is deliberately not restated here - Guard 1 fires on its gates, not on a step number, and sequencing changes go in the README.

**How to read this.** The method is the standard and the contents are decided. The structure, schemas, procedures, and rules below are the same on every VM. What you fill in is decided per brand: which segments, products, metrics, personas, naming, and sources exist all come from that brand's own data and needs. Follow the method exactly; decide the contents from the brand. Where a rule depends on a platform detail that can change (a capacity limit, the config format), verify it against the live configuration.

---

## 1. The two-layer brain: raw and compiled
Knowledge has two layers and flows one way.
- **raw = evidence.** Source material, never rewritten in substance. It lives in one of two places: as **brain files** under `data-sources/<family>/...` (file conventions owned by the family's own package - for VoC that is the voc-data-pull skill; the folders are for navigation, and today all of it sits in the `global` lane), or in a **harness-backed store** when the platform has one. Meta creative content lives in a harness-backed store: complete per-creative records (identity, summary, hook, transcript, AI tags, naming) in **Cacheth** — a hydration layer behind the `motion cache` CLI, transparent to the agent. Knoweth indexes the summary artifacts Cacheth generates (identity, ad names, copy, summary text), so summary-level creative context surfaces through Knoweth; transcripts and AI tags stay CLI-only. Performance metrics are not stored at all - they are pulled live through the `motion` CLI (the Motion CLI Data-Query Guide is the contract). Nothing in the package writes per-creative files to the brain; the brain-side Meta layer is interpretation only (`account-context.md` plus its operational decoder `naming-decoder.json`). A per-creative file appears in the brain only when a person explicitly asked for one — a dated snapshot, with the cache the retrieval source of truth for current facts.
- **compiled = understanding.** Agent-maintained to a schema: the interpretation specs and the synthesized analysis (segments, personas, performance reads). The human corrects it in conversation, never hand-edits it. The agent may create, rewrite, merge, and delete compiled pages within the schema.
- **One-way flow: raw to compiled, never back.** Evidence is the source of truth; a compiled page is the current understanding of it. When they disagree, fix the compiled page, not the evidence.
- **Curate, do not just append.** Merge duplicates, delete dead pages.

Both layers are the agent's to manage; the one-way flow and never-rewrite-raw discipline are behavioral, enforced by Runneth (see section 12), not by separate storage.

---

## 2. How Knoweth retrieves (grounded in the Knoweth service)
Knoweth is a Rust resolver that indexes approved brain roots into SQLite + a Tantivy lexical index + optional OpenAI embedding vectors, and answers `/resolve` with ranked chunks (not whole files), each carrying its metadata. It watches roots and reindexes on change. **Cacheth** is indexed only through the summary artifacts it generates: Knoweth sees each creative's identity, ad names, copy, and summary text, but never the complete record — transcripts and glossary/AI tags are not Knoweth-searchable and are reached with `motion cache get-creative`. Performance metrics are not stored anywhere - they are pulled live via the `motion` CLI.

Per query, in order:
1. **Lane ACL gate (hard).** Lanes are hard namespaces (`lane_id`): `global`, `user:<id>`, `project:<id>`, or a family/domain lane. A request carries `user_id`, `project_id`, and requested `lanes.read`; Knoweth intersects them with the `[policy]` grants and searches only authorized lanes. **In the current harness the requested read set is exactly `[user:<userId>, project:<workspaceId>, global]` with `project_id = <workspaceId>`, so today only the global lane, the caller's user lane, and the workspace lane are searched** (verified against agent-builder's `resolveKnowethReadLanes`). Custom family lanes (`voc`, `meta`, ...) are never requested and never searched; the brain root defaults to `global`, so everything in the brain is found, and carving a sub-lane would move it out of `global` and hide it.
2. **Three candidate channels inside the authorized lanes:** lexical BM25 (Tantivy, boosting title, heading path, **tag**, exact phrase, path, body, with exact symbol/path/filename matches protected); graph expansion (document/import/path-twin neighbors); and adaptive dense (one query embedding vs cached chunk vectors, used when lexical/exact confidence is low, `use_dense_when_confidence_below` ~0.72).
3. **Exact-preserving RRF fusion** merges the three, then an **intent-aware packer** assembles the context (exact-lookup vs summary vs procedural vs comparison packing, with document focus).

Two consequences drive everything below. **Tags/attributes are a ranking signal, not a gate:** they boost lexical rank and feed the embedding input, but never scope the search; only the lane ACL scopes. So keep vocabulary consistent, keep a naming decoder, and put the words a question will use into the file. Terminology: what earlier notes called a "facet" is not a Knoweth primitive. The real levers are **lanes/projects** (the ACL gate) and **attributes/tags** (a ranking signal in the text).

### The answer standard: route by where the evidence lives, then combine
Every onboarding/validation question resolves to one of two evidence homes; classify first, then combine the mechanisms.
- **Knoweth-indexed (brain files):** VoC (`data-sources/voc/**`), the Meta interpretation layer (`meta/account-context.md` plus its operational decoder `meta/naming-decoder.json`), and asset-library. Answered directly: lane gate + lexical (tags/keywords) + dense.
- **Store- or CLI-backed:** Meta creative content in **Cacheth** — summary-level artifacts are in the Knoweth index, but AI tags and transcripts are CLI-only (`motion cache get-creative`); performance metrics via live `motion` CLI pulls (per the Motion CLI Data-Query Guide). Answered by those query paths, with Knoweth supplying the interpretation lane and summary-level creative context.

In every join below, the winner metric and all interpretation come from `account-context.md` (per the account-context guard); Motion workspace settings the CLI can return (workspace goal, preferred KPI, spend threshold) are never used as interpretation.

Two rules before applying any filter:
- **Read the naming decode first.** Before filtering by campaign, ad set, or ad name, read the account's naming conventions — `account-context.md` (Field 4) and its operational decoder `/agent/brain/meta/naming-decoder.json` (typed positions, query fields, filter patterns like `_VALUE_`) — and filter on the decoded meaning, not a guessed substring.
- **Match the signal to the question.** Structural questions (funnel stage, audience, product mapping, campaign role) filter on campaign/ad-set names through the decode. Creative questions (format, hook type, content type, angle) use Cacheth tags and content — ad names may not encode any of that. When both carry the signal (e.g. a funnel stage encoded in the name and tagged in the summary), cross-check them; when they disagree, say so instead of picking one silently.

Routing by question type:
- "What are 1-star reviewers saying about Product A?" -> `voc` lane; lexical on rating/product/segment terms + dense; agent-side filter. Pure Knoweth.
- "Campaign names / account structure / naming / what the data means to us" -> `meta` lane: `account-context.md` + `naming-decoder.json`. Pure Knoweth.
- "Top winning ads this week" -> motion CLI (rank by the account's winner metric + spend floor) + Cacheth (creative identity) + `meta` account-context (what "winner" means). A join; Knoweth is the interpretation, not the data.
- "Performance by campaign / product" -> motion CLI + `meta` naming decode (which campaigns map to which product).
- "Themes in winning ads (from AI tags + summaries)" -> motion CLI (winners) + Cacheth (AI tags/summaries) + `meta` account-context (winner def). AI tags live in Cacheth, not the Knoweth index - route tag/theme questions through Cacheth; do not expect Knoweth's index to contain them.
- "What are we testing / scaling / graduating" -> motion CLI (spend state) + `meta` account-context (the graduation rule, still a flagged/needed field).
- "Why are our winners working / why do customers respond" -> motion CLI (what is winning) + Cacheth (what the creative says and shows) + `voc` (why customers respond: reviews, support themes) - and ad comments (`data-sources/voc/<platform>/`) connect performance and customer voice on the same creatives in near-real time. Treat performance and VoC as one system: performance shows what is winning, VoC explains why.

**Show the work.** Any answer that ranked, filtered, or interpreted states in plain language: which filter it applied (and the decode behind it), which signal it read (names, tags, transcript, reviews - and when freshness matters, how fresh: Cacheth records carry per-layer hydration timestamps), and what it could not confirm. One plain sentence alongside the answer, not a template. Never deliver a bare number that hides a judgment call.

### Why some data is not indexed in Knoweth
Everything the agent needs is reachable; the question is where it is stored, not whether it can be used. Knoweth indexes the **brain files** (VoC, the interpretation layer, specs, asset metadata) so they are searchable by meaning and keyword. The **creative store (Cacheth)** is a large, structured, frequently-updated dataset with its own query path: Knoweth indexes the summary artifacts it generates, but the complete records (transcripts, glossary/AI tags, ad-unit detail) stay in the store behind the `motion cache` CLI, and **performance metrics** are live platform data behind the `motion` CLI; both are reached through those query paths (and, under Knoweth, alongside brain results), not copied wholesale into the search index. Duplicating them into files would bloat the index, split the source of truth, and go stale. So a complete creative record or a metric is "not in Knoweth" the same way a database is not in a wiki: the wiki points at it. Write the interpretation (what a creative means, how a metric is judged) as a brain file; leave the creative in its store and pull the number live.

### Works with or without Knoweth
The organizing discipline here, folders, tags, save routing, specs, and maintenance, is retrieval-agnostic: it holds whether or not Knoweth is the retrieval layer on a given VM. Only the lane configuration is Knoweth-specific. Retrieval scoping (lanes and projects) becomes fully live as the Knoweth harness rolls out; until a VM is on it, the safe default that works on any harness is to keep shared content in `global` and slice with tags. A parallel version of this package without Knoweth reuses everything except the lane config, so keep the two separable: never write a file that only makes sense if lanes are active. Setting up before the Knoweth harness reaches a VM is fine: organizing, tags, save routing, specs, and maintenance all work regardless of harness; only lane/project scoping (including the automatic workspace lane) becomes fully live once the harness reaches the VM. Never block setup on it or promise lane behavior that is not on yet, `global` + tags is correct either way.

---

## 3. The two organization layers: folders vs the retrieval overlay
- **Folders = the human layer.** The visible, editable brain tree; the customer's map. They reorganize it freely. Optimize for human sense-making. Caveat: not everything retrievable is visible here. Harness-backed lanes (meta creatives in Cacheth) have no files in the tree, so the human-facing view is the folder tree plus the agent or a source-of-truth dashboard for those lanes.
- **Lanes and projects = the retrieval overlay.** Agent-owned, optimized for retrieval. Coupled to folders via glob patterns, but many-to-many (one folder can feed several projects; one project can span folders). Under the hood both are the same primitive, a `lane_id` (`global`, `user:<id>`, `project:<id>`, or a family/domain lane); a request layers several (e.g. `["meta","project:css-2026","global"]`) and `[policy]` grants keyed by `user_id`/`project_id` decide which are readable. So a "project" is a lane by convention, and user/team separation means `user:`/`team:` lanes plus grants, not a different mechanism. File metadata is not itself a Knoweth query filter (see section 5).

**How folders affect lanes.** Today they mostly do not: all shared brain content sits in the `global` lane regardless of folder, so reorganizing folders never changes retrieval scope. Folders are the human's navigation map. (Forward path: once the harness layers configured lanes, a family folder could back a family lane via `[[lane_assignments]]`; until then keep everything in `global` and slice with tags.) Knock-on effects that still hold: save-routing must write into the right family folder and tag it, or a file is mis-tagged; existing-org repair must re-home stray files and backfill tags; and any routine or app that reads the brain by path breaks if folders move, so treat the folder layout as stable.

---

## 4. The canonical Knoweth config rule
**What is queryable today (the hard constraint).** The harness requests exactly three lanes: `global`, `user:<userId>`, and `project:<workspaceId>` (the workspace). Family/business/initiative lanes are not requested, so they are not searched. Therefore:
1. **Default all shared content to the `global` lane** (the brain root default) and make it findable with **tags/attributes + a naming decoder**. Tags are the working slicer. Do not carve data-source-family lanes (`voc`, `meta`, `asset-library`) or initiative lanes (`project:css-2026`) on a live VM today: a `[[lane_assignments]]` glob would move that content out of `global` and it would go dark. `project` is the workspace, not an arbitrary initiative, so a campaign/initiative is a **tag**, not a project lane. Multi-workspace orgs (agencies) get per-workspace separation for free via `project:<workspaceId>`.
2. **Use a real lane only for what is actually gated today:** `user:` lanes for genuine per-person isolation, and the automatic workspace lane. Everything finer (segment, product, campaign, rating, angle, hook) is a tag, resolved by keyword/dense ranking plus agent-side filtering. Put those words in the file so they are findable.
3. **Forward path (design for it, do not ship it yet).** The family-lane scheme (a lane per data-source family, plus a few earned business lanes) becomes viable only when the harness layers configured lanes into the requested read set. Until that ships, family lanes stay as tags in `global`. The dependency is concrete: agent-builder's lane resolution (`resolveKnowethReadLanes` in `apps/agent/src/harness/harneth/harneth-harness.ts`) requests exactly `[user:<userId>, project:<workspaceId>, global]` today and must learn to layer configured lanes (tracked as PDEC-9225). When it lands, promote the high-value tags to family lanes via `[[lane_assignments]]`, keep the set small and under the cap (over-laning, e.g. a lane per platform or per workstream, is the usual way to blow the cap), and update the config then.
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
Step zero of organizing: read how many workspaces the org has, then follow the matching path. Orgs differ, and the setup should read which kind it is rather than assume. Most orgs run a single workspace; a smaller number (agencies and large teams) run many, and those multi-workspace orgs generate a large share of real usage. Adapt:
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
    voc/<platform>/                                # items only, id-keyed; format owned by the voc-data-pull skill.
                                                   # No non-item files (the sync's window checks read this folder)
    voc/<platform>-context.md                      # compiled VoC analysis (segments, personas, keywords, quotes)
                                                   # - beside the item folders, never inside them
    asset-library/<integration>/file-<id>.md      # creative/asset files; another data-source family (lane)
  meta/                                            # meta lane (today under /agent/brain/meta/, NOT data-sources/)
    account-context.md                             # compiled interpretation (9 fields incl. the confirmed naming
                                                   # decode + spend floor / winner-cut criteria)
    naming-decoder.json                            # Field 4's operational decoder, only if a convention is confirmed
    _changelog.md
                                                   # per-creative content lives in Cacheth, summaries surfaced via Knoweth -
                                                   # brain files only as person-requested snapshots; performance is
                                                   # pulled live via the motion CLI
  integrations/<source>/                          # source guide specs; raw dumps forbidden here   [not indexed]
  team/<person>.md  team/user-map.json
/agent/INDEX.md
```
### Declaring the config (real format, from the Knoweth service)
Knoweth reads a TOML config (`version = 2`). The pieces that matter for lanes/projects:
- `[[roots]]` with `lane_id` + `path` sets a root's default lane (a `voc` root defaults every file under it to the `voc` lane).
- `[[lane_assignments]]` override the lane for a root-relative path glob, last match wins (e.g. `css-2026/**` -> `project:css-2026`). This is how a project or business lane is carved out of a tree.
- `[policy]` with `default_read_lanes` and `[[policy.lane_grants]]` keyed by `user_id` and/or `project_id` (each `read = [lanes...]`, optional `write`) is the ACL: it decides which layered lanes a request can read. User/team separation lives here (grant `user:alice` only to `user_id = "alice"`).
- `[embeddings]`, `[hybrid]`, `[resolver]` tune the search channels (checked-in default is guarded OpenAI hybrid: lexical + graph + adaptive dense, fused with RRF).
The lane count matters because every authorized lane is scored per query; keep the set small (verify the cap). **Caveat: today only `global`, `user:<userId>`, and `project:<workspaceId>` are in the requested read set, so `[[lane_assignments]]` that create family/initiative lanes are forward-path only, using them now hides content.** Keep content in `global` plus tags until the harness layers configured lanes. The skeleton plus the metadata/tag conventions are the content the config's roots/assignments are generated from.

---

## 5. File metadata (findability and provenance, not a filter)
File metadata is **not a Knoweth query filter.** Retrieval runs on lane (today `global`, `user:<userId>`, and the workspace) plus lexical/dense search over the text - and metadata is text, wherever it sits in the file. It earns its place for four things only: lexical findability (facet words become searchable text), provenance (`sources` cite the exact raw file), chunk-standalone context (a chunk is retrieved without its neighbors), and agent-side filtering of returned files. Keep it lean and do not restate what the path or config already encode.

**Raw VoC files: the format is owned by the voc-data-pull skill (`/agent/.agents/skills/voc-data-pull/SKILL.md`) - never add front-matter to them.** Their metadata block sits at the bottom of the file; it is text, so Knoweth searches it exactly as it would a yaml header. Do not convert, duplicate, or extend it. Facet vocabulary the unified record does not carry (segment/persona assignments, brand tags, decoded product names) belongs in the compiled VoC analysis pages that cite the raw items, never injected into raw files.

**Compiled pages (analysis, spec) - the front-matter this doc owns:** `page_type: compiled | spec`, `substance: facts | interpretation`, `sources: [...]` citing raw, `last_compiled`, `confidence`, and `tags: [<brand tag>, segment-<name>, product-<name>, ...]` (searchable facets, not structured filters). `lane:` / `project:` keys are forward-path tags only - today content sits in the `global` lane and they bite only once the harness layers configured lanes. Meta interpretation pages point at the Cacheth creative and the campaign KPI rather than embedding creative data.

---

## 6. Save routing and refresh
On new information, decide in order:
1. **Evidence with no harness store** (VoC item, asset file, transcript, note) -> the family's own file contract: VoC items follow the voc-data-pull skill (id-keyed files under `data-sources/voc/<platform>/`, written by the sync routine, not ad hoc); other families use `data-sources/<family>/<integration>/<type>-<id>.md` (e.g. `data-sources/asset-library/<integration>/file-<id>.md`). Append/overwrite by id (idempotent), never rewrite substance, indexed.
2. **Meta creatives** -> Cacheth, summary artifacts surfaced via Knoweth (transcripts and AI tags via the `motion cache` CLI); performance metrics are pulled live via the motion CLI, never saved. A per-creative brain file is written only on a person's explicit ask, as a dated snapshot; the cache stays the retrieval source of truth for current facts.
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
- **Meta (Meta and Voice of Customer Onboarding, three steps).** Step 1 Creative Attributes: one enriched record per active creative (identity, summary, hook, transcript, AI tags, naming) held in Cacheth, its summary artifacts surfaced via Knoweth (transcripts and AI tags via the `motion cache` CLI), with performance pulled live via the motion CLI (the Motion CLI Data-Query Guide, installed beside this doc, is the query contract); no per-creative files are written to the brain. Step 2 Account Context Brain (`/agent/brain/meta/account-context.md`): the interpretation layer, nine fields, with the naming decode confirmed as the handoff from Step 1 (its operational output is `/agent/brain/meta/naming-decoder.json`) and Field 9's four captures (ranking metric, CPA target, winner/cut criteria incl. the spend floor, default reporting window); Field 10 (reporting structure + marketing calendar, synthesized from Fields 4, 7, and 9) is the deck spec — it gates the validation deck, not the question loop. Step 3 Validation: the answer-and-confirm loop, the weekly deck built from the Field 10 spec, and the MVCE (minimum viable context engine) gate. Ask the human the account idiosyncrasies platform settings cannot capture: the real success metric, which conversion event judges winners and whether products roll up, attribution windows, the cut rule, per-campaign KPI differences, naming clarifications. Validate: performance questions answer with numbers that reconcile to source.
- **Voice of Customer.** Raw is owned end-to-end by the voc-data-pull skill at `/agent/.agents/skills/voc-data-pull/SKILL.md` (folder convention, file format, unified metadata record, PII rules, sync routine). Compiled is the analysis layer (`data-sources/voc/<platform>-context.md`, beside the platform item folders, never inside them): segments, emerging segments, keywords, quotes, personas, each tracing to items. Ask the human: canonical sources, which personas are established vs aspirational, off-limits claims. Validate: every claim traces to a real verbatim.
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
5. **Move source dumps into `data-sources/`**; per-creative files in the brain exist only by a person's explicit ask (see the Cacheth gotcha) - if any are of unknown provenance, ask the person before archiving, never silently move or delete them; stop indexing specs.
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
- **VoC setup is manual too.** Nothing runs just because a platform is connected: when a person (or the onboarding run) asks, the voc-data-pull skill's "Set up the recurring sync" procedure creates one daily `voc-sync-<platform>` routine per available platform and kicks the backfill. Stored-key platforms (Okendo, Stamped) first need a customer key via the secret-collection flow.
- **Refresh** runs as a deterministic script (cheap pull) with agentic analysis on top (set cadence deliberately, section 6).
- **Non-divergence has two homes.** One is the per-VM setup/config file (the handoff that lays the overlay). The other is Runneth's system prompt, which must teach how Knoweth works, the retrieval model (global + tags today, family lanes as a forward path), where each kind of data lives (Cacheth vs brain files vs live motion CLI pulls), and where to save. That system-prompt work is a separate stream; without it the method is followed by hand and drifts, with it the method holds. This doc is the specification; the prompt change makes it stick.

### Self-organization over time
Setup gets a VM clean on day one; staying organized over weeks of real use is a separate, mostly-runtime problem, because the human keeps adding and moving files and Runneth keeps writing. What degrades: user-added files land with no metadata, no family folder, or no tags; folder moves orphan content or break path-based routines; compiled pages go stale as new raw arrives; duplicates accumulate; conversational corrections do not propagate; the lane scheme erodes as ad-hoc lanes creep in; raw grows past the index budget; new integrations and new segments/products appear mid-life; and renames break keyword retrieval.

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
- **Cacheth is a primitive - assume it is present; it is the system of record for per-creative content** (Knoweth surfaces their summary artifacts from Cacheth; nothing in the package writes creative files to the brain). A per-creative file exists in the brain only when a person explicitly asked for it: a dated snapshot that will not stay synced with the cache - cite the cache for current facts. If the maintenance sweep finds per-creative files of unknown provenance, ask the person before archiving; never silently move or delete them.
- **Sourcing discipline holds:** trust live data, assume manual platform settings are wrong and re-ask, never fabricate, label inferences.

---

## 14. Worked example (illustrative)
A brand asks "top ads for Product A last week." Runneth pulls performance through the motion CLI, ranks by the account's winner metric (defined in `account-context.md`, not a Motion workspace setting), pulls creative identity from Cacheth, and reads the interpretation page (`meta/account-context.md`, in `global`) for how Product A is judged plus the naming decoder for angle/hook/format. A VoC question ("what are one-star reviewers saying about Product A") searches the `global` lane over `data-sources/voc/<platform>/review-*`, ranked lexically on the metadata block's rating field and the product/segment terms from the tag vocabulary, with agent-side filtering. Neither carves a lane. When the human corrects an interpretation, the compiled page regenerates from the cited raw; the raw is never edited.

---

## 15. Standard method, brand-decided contents
- **Standard on every VM:** the raw/compiled model and one-way flow; how retrieval works; folders vs overlay; the retrieval model (everything in `global` + tags today, `user:` isolation, workspace project automatic, family lanes a forward path); the file-metadata conventions (raw VoC format owned by the VoC skill, compiled-page front-matter owned here); save routing and refresh discipline; the Standard-spec format; setup, repair, and rollout; the validation loop; and not duplicating Cacheth content or live CLI metrics into files.
- **Decided per brand:** the tag vocabulary and naming decoder (segments/personas, products, campaigns, KPI), any future family-lane candidates; the contents of each spec; and what the org-understanding page says. These come from the probe, the interview answers, and the human's folders.

Verify against the live configuration before finalizing: the lane cap, the config-declaration format, and whether the harness has begun layering configured lanes. The direction (global + tags today, family lanes as a forward path gated on the harness change; project = workspace; metadata for findability and provenance, not a Knoweth filter; content-first; harness stores not duplicated; validate) holds regardless.

---

## How this actually governs Runneth (be honest about it)
This doc is findable reference knowledge. On its own it does not hard-enforce lanes or save-routing; the two `/agent/user.md` guard blocks are what make the lane-setup trigger fire and the save/maintenance discipline always-on, and that merge is admin-gated. The enforceable artifact is the Knoweth lane config; the guard blocks are the standing behavior; this doc is the human-readable contract the CSM, the customer, and Runneth can all point at. Without the guard merge, the method is followed by hand and drifts; with it, it holds.

## Changelog

Maintained in the package repo at `meta-and-voc-onboarding/CHANGELOG.md` — not staged to
customer brains.
