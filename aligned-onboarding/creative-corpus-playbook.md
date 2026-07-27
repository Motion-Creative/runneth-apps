# Meta Creative Corpus Playbook (Onboarding Package)

**How Runneth builds and maintains saved creative context for a Meta account, using the Account
Context Brain it already has.**

This is the creative-attributes part of the Meta onboarding package. It pairs with this workspace's
established Account Context Brain and, for report surfaces, the established Report Dashboard Setup.

The one-line model:

> The **Account Context Brain** tells Runneth **how to analyze** the account. The **Creative
> Corpus** gives Runneth **the durable creative context it needs to actually do the job**.

The Creative Corpus depends on the Account Context Brain for interpretation and does not
re-derive it. It pulls enough source-backed creative data from Motion to create customer-facing
context, but Motion or the creative store remains authoritative for exact assets, previews,
transcripts, and current source-backed content.

For reports and dashboards, the corpus supplies creative evidence: hooks, transcripts, previews,
tags, value props, and identity. Report Dashboard Setup decides how that evidence should appear on a
surface. Performance metrics stay live or saved-report-backed; they do not belong in the creative
files.

---

## What this is

The output is:

- **Individual creative Markdown files** for creatives that need durable saved context, with
  identity, summary, hook, value props, transcript notes, AI tags, and naming.
- An optional thin **tagging taxonomy** file, only if the Account Context Brain has a decoded naming
  convention to project.
- These files are available through default Brain retrieval when they are saved to Brain. They are
  not the canonical creative store and should not be created solely to mirror every source row.

Report and dashboard builds use these files for stable creative context, not for current
performance. If the established reporting/app setup asks for playable videos, same-size creative
cards, transcript snippets, or specific evidence columns, satisfy those requirements from this
corpus where possible and show visible caveats when media or transcripts are missing.

## How retrieval works here (default Brain retrieval first, corpus-search to supplement)

Runneth can surface readable Markdown under `/agent/brain/` as saved context in future turns. Treat
default Brain retrieval as the ordinary path for saved creative context:

- When a creative-context file is intentionally saved under the established creative-context folder
  or this package's default, stable names, source IDs, tags, headings, and
  `/agent/INDEX.md` entries make it findable for ordinary Brain recall.
- To confirm a file is discoverable, reference its topic in a later turn, or list the folder.
- Use `ContextConfig` only if these files need a specific lane (for example a workspace lane).

**corpus-search supplements default Brain retrieval** for this package. It ships alongside (see the
README for install) and is the right tool when you need structured, filterable search over the
creative files: by `kind`, brand, field, or a specific intent across the whole corpus. Default Brain
retrieval stays the ordinary path for everyday recall; reach for corpus-search when you need to
query the corpus deliberately. corpus-search requires its own index step below.

---

## Step 1 - Read what the Account Context Brain already knows (do not re-derive)

Open this workspace's established Account Context Brain first and pull these directly:

- **Naming conventions** (Account Context Brain field 4): if it has a decoded pattern, use it to decode
  each creative's name. If it does not, just store the raw ad name as the attribute and move on.
- **AI tags**: always capture them using Motion's own glossary definitions. The Account Context
  Brain governs how
  they are used in analysis, not whether the Creative Corpus records them.
- **Workspace and date window**: the target `workspaceId` and the default pull window
  (`last_365d` unless the account or the person overrides it), from the Account Context Brain's scope header.
- **Spend thresholds and targets**: used to derive Spend State without a separate threshold fetch.

If a needed field in the Account Context Brain is `[FLAGGED]` or missing, that is the only case where you gather
it live, and you flag it the same way rather than guessing.

When the corpus is being built or refreshed to support a report/dashboard surface, also read the
established reporting/app setup if it exists. Use it only for report evidence requirements such as
card content, table columns, media behavior, and taxonomy. Do not let it override the Account
Context Brain's interpretation of what counts as best, winning, scaling, or ready to cut.

---

## Step 2 - Pull source creative context from Motion

This is the source-backed creative data the Account Context Brain does not hold. Use the workspace
and window from the Account Context Brain (default `last_365d`).

```
motion meta insights --date-range last_365d --include-glossary --include-metrics --include-transcript --workspace-id <workspaceId from the Account Context Brain>
```

Inspect the returned file with `jq`:

- `totalCount` vs `providerTotalCount`: if they differ, the pull is partial. Narrow and re-pull
  before treating it as the full set.
- `.creatives[0]`: confirm summaries, hooks, glossaryTags, value props, and `transcript` are
  populated.
- `.adsWithoutCreativeAsset`: spend-bearing ads with no synced creative. Skip them for
  individual files.

Always pull `--include-glossary` and capture the tags Motion returns, using Motion's own
definitions. Whether they get surfaced in analysis is the Account Context Brain's call; capturing them is not
conditional.

**Transcripts.** `--include-transcript` returns `creative.transcript` on the same pull, so one
pass usually gets everything. On a large corpus this can be heavy, and some rows may come back
without a transcript. In that case, do a second scoped pass over the creative asset IDs from
this pull:

```
motion meta insights --scope creative-asset-id --creative-asset-id <id> [--creative-asset-id <id> ...] --include-transcript --date-range last_365d --workspace-id <workspaceId>
```

Only video creatives have a spoken transcript. If a creative returns no transcript, record that
it has none rather than inventing one.

Note the exact pull date and window. This anchors the "corpus as of" timestamp.

---

## Step 3 - Tagging taxonomy (only if there is something to project)

If the Account Context Brain has a decoded naming convention, project it into a short reference
file: the naming table (pattern to meaning) plus the standard MD template below. If it has no
naming decode,
skip the naming table entirely; the per-creative files simply carry the raw ad name.

Do not build elaborate auto-tagging logic. Keep this file to the naming table (if any) and the
template. Save it beside the creative-context files as `_tagging-taxonomy.md`. The underscore keeps
it at the top of the folder and signals it is a reference, not a creative.

---

## Step 4 - Generate saved creative-context MD files

Write one file per creative only when that creative needs durable saved context.

**File naming:** match the ad name exactly, `.md` extension, replace slashes or special
characters with hyphens.

**Location:** the established creative-context folder for this workspace, or this package's default
if one does not exist yet.

**Each file contains:**

```markdown
---
title: <Creative Name>
brand: <brand / ad account>
workspace: <workspaceId>
source_id: <Motion creative ID>
event_at: <launch date>
duration_s: <video length in seconds - video only>
---

# <Creative Name>

## Identity
- Motion ID, Format, Launch Date, Status, Spend State, Campaign, Ad Set

## Naming Convention
- Decoded fields if the Account Context Brain has a decoder; otherwise the raw ad name as-is

## Creative Summary
- From Motion's creative summary / adDescription field

## Hook
- From Motion's spoken hook / first-line hook field

## Transcript
- From Motion's creative.transcript (--include-transcript). Video only. Note "none" if not returned.

## Value Propositions
- From Motion's value propositions / messaging and positioning

## AI Tags (Motion Glossary)
- All tags Motion returns, with Motion's own definitions. Always captured.
```

**Why this shape (so it works with corpus-search):** the frontmatter keys (`brand`, `workspace`,
`source_id`, `event_at`) are what corpus-search filters and dedupes on, so keep them accurate.
`source_id` is the Motion creative ID and makes re-indexing idempotent (an update replaces the
record instead of duplicating it). Keep each part under its own `##` heading, because corpus-search
chunks by header: that keeps the hook, transcript, value props, and tags independently searchable.
Default Brain retrieval can use the same file without requiring this frontmatter; the frontmatter
exists to make corpus-search filtering work.

**What to skip:**
- Metrics (spend, ROAS, CTR): they change constantly; summaries, transcripts, and tags do not.
- `adsWithoutCreativeAsset` rows: no creative content to enrich.
- Tool-calling notes and CLI mechanics: these files are customer-facing account content, not
  internal Runneth-team notes.

**Spend State** is a lightweight performance-tier proxy. Derive it from `metrics.spend` against
the thresholds already in the Account Context Brain (do not re-fetch the workspace spend threshold):
- Above threshold and scaling: `scaling`
- At threshold, holding: `holding`
- Below threshold or declining: `declining`

---

## Step 5 - Make saved creative context retrievable

Saving creative-context files under the established creative-context folder, or this package's
default, makes them available for ordinary Brain recall.

- For default Brain retrieval: keep stable names, source IDs, headings, tags, and index entries. If
  the files need a specific lane or read scope, set that once with `ContextConfig`. To sanity-check,
  reference a creative topic in a later turn or list the folder.
- For corpus-search (the supplement): register the resolved creative-context folder as an enabled
  source in corpus-search's `sources.json` with `kind: creative` during install, so its `refresh`
  keeps the folder current automatically. To index on demand, pass that same resolved folder to
  `bash /agent/tools/corpus-search/corpus-search.sh index markdown --source <creativeContextFolder> --kind creative`.
  Re-runs are idempotent, deduped by `source_id`. This step is only for corpus-search.

---

## Step 6 - Update the brain index

Add entries to `/agent/INDEX.md` for the default creative-context folder, or for the established
creative-context folder if this workspace already uses one:

**1. The creatives folder**
```
- path: <creativeContextFolder>
  aliases: creative corpus, creative library, [workspace] creatives, saved creative context, creative tags, meta account attributes
  note: Saved creative-context files for [workspace] as of [date]. Identity, format, launch date, spend state, campaign, naming, transcript notes, and Motion AI glossary tags when useful. No metrics. Interpretation source is the Account Context Brain (account-context.md).
  created: [date]
  updated: [date]
```

**2. The taxonomy** (only if you created one)
```
- path: <creativeContextFolder>/_tagging-taxonomy.md
  aliases: tagging taxonomy, naming convention, creative template
  note: [workspace] naming projection and the standard MD template, derived from the Account Context Brain (account-context.md).
  created: [date]
  updated: [date]
```

---

## Maintenance - daily and event-triggered

The corpus grows over time. New creatives get added; nothing is removed unless a creative is
retired from the account.

### Daily

1. Pull recent launches: `motion meta insights --date-range last_7d --include-glossary --include-metrics --include-transcript --workspace-id <workspaceId>`
2. Compare returned creative IDs against existing files in the resolved creative-context folder.
3. For each new ID, generate its MD file (run the scoped transcript pass if the inline transcript
   came back empty).
4. Default Brain retrieval picks up the new files automatically. For corpus-search, run its refresh
   so filterable search stays current: `bash /agent/tools/corpus-search/corpus-search.sh refresh`.
5. Update the `updated` date on the creatives folder entry in `/agent/INDEX.md`, and append a
   one-line note to the `meta` folder `_changelog.md` (same convention the Account Context Brain uses).

**What you do not touch daily:**
- AI tags, transcripts, and Motion summaries are stable once set. Only re-pull if Motion re-ran
  its AI pipeline on a creative.
- Naming fields are stable unless the team changed their system, which is an Account Context Brain change.
- Existing files do not need regeneration unless the taxonomy changes.

### Event-triggered

| Event | What to do |
|---|---|
| Naming conventions change in the Account Context Brain | Re-project the naming table and re-decode affected files |
| Campaign structure changes (new campaigns, renamed ad sets) | Update the naming table and re-tag affected files |
| A creative's Spend State changes materially | Update its Spend State field |
| Motion re-tags or re-transcribes a creative | Re-pull and refresh that file's AI Tags or Transcript |
| A new workspace is added | Run the Account Context Brain fill-in first for that workspace, then this playbook |

Because the Account Context Brain is upstream, taxonomy changes start there: update it, then
re-project the Creative Corpus. Do not fork a naming decision into the Creative Corpus that
contradicts the Account Context Brain.

---

## Multi-workspace

Customer brains are usually one workspace, but multi-workspace orgs are real. When the brain
holds more than one workspace, scope per workspace so entries do not collide. These are default
examples; use the established indexed setup locations when the customer already has them:

- `/agent/brain/meta/<workspace-slug>/account-context.md`
- `/agent/brain/meta/<workspace-slug>/creatives/`
- `/agent/brain/meta/<workspace-slug>/creatives/_tagging-taxonomy.md`
- Index with workspace-scoped aliases in `/agent/INDEX.md`.
- If you use retrieval lanes to separate workspaces, set the lane once with `ContextConfig`.

---

## Precedence and relationship to the Account Context Brain

- The Account Context Brain (`account-context.md`) owns interpretation: what "best" means,
  how names decode, what the thresholds are, and how AI tags are used in analysis.
- Report Dashboard Setup (`report-dashboard-context.md`) owns report-surface
  packaging: standard views, metric order, evidence requirements, visual expectations, and cadence.
- Motion or the creative store is authoritative for exact creative content, media, previews,
  transcripts, and source-backed attributes. Creative Corpus files are saved customer-facing context
  with provenance.
- The Creative Corpus captures durable attributes when they are useful. The Account Context Brain
  decides how they are interpreted; Report Dashboard Setup decides how they appear on report
  surfaces. When either setup file disagrees with a creative-context file on an interpretation or
  packaging rule, update the saved context or report surface from the owning setup file rather than
  creating a second maintained truth.

---

## Quick reference

| What | Where |
|---|---|
| Account Context Brain | `<accountContextPath>` |
| Report Dashboard Setup | `<reportingSetupPath>` |
| Individual creative files | `<creativeContextFolder>/<AdName>.md` |
| Tagging taxonomy (optional) | `<creativeContextFolder>/_tagging-taxonomy.md` |
| Brain index | `/agent/INDEX.md` |
| Change log | `/agent/brain/meta/_changelog.md` |

| What | Command |
|---|---|
| Pull creative corpus | `motion meta insights --date-range last_365d --include-glossary --include-metrics --include-transcript --workspace-id <workspaceId>` |
| Transcript-only backfill | `motion meta insights --scope creative-asset-id --creative-asset-id <id> --include-transcript --date-range last_365d --workspace-id <workspaceId>` |
| Pull recent launches | `motion meta insights --date-range last_7d --include-glossary --include-metrics --include-transcript --workspace-id <workspaceId>` |

Default window is `last_365d` unless the account or the person overrides it. Default Brain
retrieval handles ordinary recall automatically. corpus-search is the optional filterable supplement
for deliberate corpus queries and has its own install/refresh commands.
