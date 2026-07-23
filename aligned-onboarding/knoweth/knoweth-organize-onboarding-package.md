# Knoweth: Organize the Brain (Onboarding Package)

### Version 0.1 — draft for review (July 2026)

**How Runneth organizes the brain after the questions are answered, so retrieval stays tight and the org stays understood as the team keeps adding to it.**

The one-line model:

> The data parts (VoC Data Pull, Meta Creative Attribution + Account Context) put **content** in the brain. **Knoweth** is the retrieval layer over it. This part does the organizing: it makes the content findable, sets the standing save-and-maintenance discipline, and holds as the team edits the brain for weeks. It runs after the content and the confirmed interpretation exist.

This part is **cross-cutting**: unlike the Meta-only parts, it governs every data-source family and every future write.

---

## What is actually queryable today (read this first)

Knoweth is a resolver that indexes the brain (SQLite + a lexical index + optional embeddings) and returns ranked chunks. **The harness requests exactly three lanes on every query: `global`, `user:<userId>`, and `project:<workspaceId>` (the Motion workspace).** Consequences that shape everything here:

- The brain root defaults to the **`global`** lane, so everything in the brain is searched. Keep shared content in `global`.
- **Do not carve data-source-family or initiative lanes** (`voc`, `meta`, `campaign:...`) on a live VM. Those lanes are not in the requested read set, so their content would go dark.
- **"Project" is the workspace**, not an arbitrary initiative. A campaign or initiative is a **tag**, not a project lane. Multi-workspace orgs (agencies) get per-workspace separation for free.
- Tags/attributes are a **ranking signal, not a gate**: they boost lexical rank and feed the embedding input, but only the lane ACL scopes. So the working slicer is tags plus a consistent naming decoder.

Two stores are **not** indexed by Knoweth: **Cacheth** (creative asset/summary/AI tags/transcript) and **Counteth** (performance). Content only in those is answered by the CLI, with Knoweth supplying the interpretation layer.

---

## How this activates

Staging this file does not self-run anything. To activate it, merge the two guard blocks below into `/agent/user.md` with the standard sentinel convention (idempotent, replace-in-place if the sentinel exists, never duplicate, never edit outside the sentinels).

**Guard 1 — organize (runs once, after the questions are answered).**

```
<!-- BEGIN runneth:knoweth-organize v1 -->
Knoweth organize (after the questions are answered):
- When the account interpretation is [CONFIRMED] (e.g. /agent/brain/meta/account-context.md fields
  signed off) and data-source content has landed (VoC files under /agent/brain/data-sources/voc/**;
  creatives under /agent/brain/meta/creatives/ or Cacheth flagged in), and the brain has not been
  organized yet, organize it. Do not wait to be asked.
- TODAY only three lanes are searched: global, user:<userId>, and project:<workspaceId> (the Motion
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

## Prerequisites (hard gate)

Do not organize until both are true: the account interpretation is `[CONFIRMED]`, and data-source content has landed (VoC files exist; creatives exist under `meta/creatives/` or Cacheth is flagged in). Organizing an empty brain produces empty scopes. If either is missing, say what is missing and route back; never fake it.

## Where it sits in the combined run

Drop-in staging is automatic; a person says "run the package." The run: (1) set up integrations if not connected; (2) pull data and ask the interpretation questions (Account Context Brain); (3) **organize the brain (this part)** now that content and confirmed interpretation exist; (4) run the validation loop (starter questions, confirm or correct). Sequencing: organize right after the questions and before validation, so validation exercises the organized brain.

## Persistence

The durable artifacts are the **tag vocabulary + naming decoder** and the two `/agent/user.md` guard blocks above. The Knoweth lane config only carries what is actually queried today (global, `user:` isolation, the automatic workspace lane). Index this doc in `/agent/INDEX.md` (aliases: knoweth, organize, lanes, tags, retrieval, brain maintenance).

---

## The answer standard: route by where the evidence lives, then combine

Classify each question by its evidence home, then combine:

- **Knoweth-indexed (brain files, in `global`):** VoC (`data-sources/voc/**`), the Meta interpretation layer (`meta/account-context.md`, naming decoder), asset library, per-creative files when written. Answered directly: lexical (tags/keywords) + dense.
- **Store-backed (not in Knoweth):** creative content (summary, AI tags, transcript) in **Cacheth**, performance in **Counteth**. Answered by the CLI; Knoweth supplies the interpretation.

Routing by question:

- "What are 1-star reviewers saying about Product A?" -> VoC files; lexical on rating/product/segment tags + dense; agent-side filter. Pure Knoweth.
- "Campaign names / account structure / naming / what the data means to us" -> `meta/account-context.md` + naming decoder. Pure Knoweth.
- "Top winning ads this week" -> Counteth (rank by the account's winner metric + spend floor) + Cacheth (creative identity) + account-context (what "winner" means). A join.
- "Performance by campaign / product" -> Counteth + naming decode.
- "Themes in winning ads (from AI tags + summaries)" -> Counteth (winners) + Cacheth (AI tags/summaries) + account-context. This is why "AI tags aren't searchable in Knoweth": in staging the per-creative files are not written, so their tags live in Cacheth, not the Knoweth index. Route tag/theme questions through Cacheth; do not expect Knoweth to contain them.
- "What are we testing / scaling / graduating" -> Counteth (spend state) + account-context (graduation rule).

---

## Allocating new content (tag -> project -> lane)

When new content or a new dimension shows up, allocate in this order, proactively (not driven by where a file happened to land):

- **Tag it (default).** A slice of existing content (rating, segment, product, campaign, angle) stays in `global` and gets a tag. Costs nothing, always discoverable, gives the "slice inside a lane" behavior. Most new things land here.
- **Project = workspace (automatic).** Do not hand-carve project lanes; the only project lane queried is the workspace.
- **Lane (rare).** Only for genuine read isolation (`user:` per-person today; a client lane in a future multi-tenant setup).
- **Propose, do not silently create.** If a tag is asked for constantly, or the org clearly works in bounded initiatives, propose promoting it (to a family lane once the harness supports it, or a documented tag convention now). Keep the written allocation policy so new content is classified consistently over time.

---

## Forward path (design for it, do not ship it yet)

The family-lane scheme (a lane per data-source family, plus a few earned business lanes) becomes viable only when the harness layers configured lanes into the requested read set. Until that ships, family lanes stay as tags in `global`. This is filed as a harness dependency. When it lands: promote the high-value tags to family lanes via `[[lane_assignments]]`, keep the set small and under the cap (a real VM hit the cap by making a lane per platform and per workstream), and update the config then. The Knoweth config format is TOML: `[[roots]]` with `lane_id` + `path`, `[[lane_assignments]]` path globs (last match wins), `[policy]` with `[[policy.lane_grants]]` keyed by `user_id`/`project_id`.

---

## How this actually governs Runneth (be honest about it)

This doc is findable reference knowledge. On its own it does not hard-enforce anything; the two `/agent/user.md` guard blocks are what make the organize trigger fire and the save/maintenance discipline always-on, and that merge is admin-gated. The durable levers are the tag vocabulary, the naming decoder, and the guard blocks. Without the merge, the method is followed by hand and drifts; with it, it holds.

---

## Changelog

### v0.1 (July 2026) — first draft
- Cross-cutting Knoweth part added to the combined onboarding package: organize the brain after the questions, plus the standing save + maintenance discipline.
- Grounded in the real retrieval wiring: only `global`, `user:<userId>`, and `project:<workspaceId>` are queried today; everything shared stays in `global` + tags; family lanes are a documented forward path gated on a harness change.
- Two sentinel guard blocks: `runneth:knoweth-organize` and `runneth:knoweth-brain`.
