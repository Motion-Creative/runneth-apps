# Meta Creative Corpus Playbook (Onboarding Package)

**How Runneth builds and maintains the per-creative attribute corpus for a Meta account,
using the Account Context Brain it already has.**

This is the creative-attributes part of the Meta onboarding package. It pairs with the
**Meta Account Context Brain** (`/agent/brain/meta/account-context.md`).

The one-line model:

> The **Account Context Brain** tells Runneth **how to analyze** the account. The **Creative
> Corpus** gives Runneth **the attributes it needs to actually do the job**: one enriched record
> per active creative.

The Creative Corpus depends on the Account Context Brain for interpretation and does not
re-derive it. It only pulls from Motion what the Account Context Brain cannot already tell it: the
creative content itself.

---

## What this is

The output is:

- **Individual creative Markdown files**, one per active creative, with identity, the complete Motion
  ad description, hook/headline, creative breakdown, messaging and positioning, transcript, AI
  tags, and naming.
- An optional thin **tagging taxonomy** file, only if the Account Context Brain has a decoded
  naming convention to
  project.
- These files are automatically retrievable through **Knoweth**. There is no separate corpus
  index to build.

## How retrieval works here (Knoweth first, corpus-search to supplement)

Runneth already has Knoweth, its local retrieval layer. Any Markdown written under
`/agent/brain/` in a readable lane is automatically chunked, indexed, and surfaced as
pre-context in future turns. Knoweth is the default and needs no setup:

- Writing the file under `/agent/brain/meta/creatives/` is the index step. No manual `index`,
  `embed`, or `refresh` needed for Knoweth to surface it.
- To confirm a file is discoverable, reference its topic in a later turn, or list the folder.
- Use `ContextConfig` only if these files need a specific lane (for example a workspace lane).

**corpus-search supplements Knoweth** for this package. It ships alongside (see the README for
install) and is the right tool when you need structured, filterable search over the creative files:
by `kind`, brand, field, or a specific intent across the whole corpus, rather than the automatic
pre-context Knoweth surfaces. Knoweth stays the default for everyday recall; reach for corpus-search
when you need to query the corpus deliberately. corpus-search requires its own index step (below);
Knoweth does not.

---

## Step 1 - Read what the Account Context Brain already knows (do not re-derive)

Open `/agent/brain/meta/account-context.md` first and pull these directly:

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

---

## Step 2 - Pull the creative corpus from Motion

This is the genuinely new data the Account Context Brain does not hold. Use the workspace and window from the Account Context Brain
(default `last_365d`).

```
motion meta insights --date-range last_365d --include-glossary --include-metrics --include-transcript --summary-sections adDescription --summary-sections hookOrHeadline --summary-sections creativeBreakdown --summary-sections messagingAndPositioning --workspace-id <workspaceId from the Account Context Brain>
```

Inspect the returned file with `jq`:

- `totalCount` vs `providerTotalCount`: if they differ, the pull is partial. Narrow and re-pull
  before treating it as the full set.
- `.creatives[0]`: confirm `summary.adDescription`, `summary.hookOrHeadline`,
  `summary.creativeBreakdown`, `summary.messagingAndPositioning`, `glossaryTags`, and `transcript`
  are populated. The three structured summary sections are JSON strings in the CLI output; do not
  treat them as prose or select a few nested fields.
- `.adsWithoutCreativeAsset`: spend-bearing ads with no synced creative. Skip them for
  individual files.

Always pull `--include-glossary` and capture the tags Motion returns, using Motion's own
definitions. Whether they get surfaced in analysis is the Account Context Brain's call; capturing them is not
conditional.

**Transcripts.** `--include-transcript` returns `creative.transcript` on the same pull, so one
pass usually gets everything. On a large corpus this can be heavy, and some rows may come back
without a transcript. Export the full pull first. Then, for each missing video transcript, run a
fully enriched scoped re-pull over the creative asset IDs from that pull:

```
motion meta insights --scope creative-asset-id --creative-asset-id <id> [--creative-asset-id <id> ...] --date-range last_365d --include-glossary --include-metrics --include-transcript --summary-sections adDescription --summary-sections hookOrHeadline --summary-sections creativeBreakdown --summary-sections messagingAndPositioning --workspace-id <workspaceId>
```

Export each fully enriched scoped result after the full pull. This order replaces the selected
creative with a record that still contains all four summary sections, glossary tags, identity, and
the backfilled transcript. Never export a transcript-only scoped result: its absent summaries and
tags are not evidence that the creative has no summaries or tags. Only video creatives have a
spoken transcript. If a fully enriched scoped re-pull still returns no transcript, record that it
has none rather than inventing one.

Note the exact pull date and window. This anchors the "corpus as of" timestamp.

Export the returned JSON file with the package's deterministic exporter:

```
node /agent/.agents/skills/aligned-onboarding/bin/export-creative-corpus.mjs --input <motion-meta-insights.json> --workspace-id <workspaceId> --brand <brand-or-account> --output-dir /agent/brain/meta/creatives
```

The exporter validates all non-null summary sections before writing any files. If it reports a
creative ID and section, re-pull or repair that source record; do not replace the section with a
handwritten reduction. On replacement, it also preserves the protected Account Context Projection
block described in Step 4.

---

## Step 3 - Tagging taxonomy (only if there is something to project)

If the Account Context Brain has a decoded naming convention, project it into a short reference
file: the naming table (pattern to meaning) plus the standard MD template below. If it has no
naming decode,
skip the naming table entirely; the per-creative files simply carry the raw ad name.

Do not build elaborate auto-tagging logic. Keep this file to the naming table (if any) and the
template. Save it at:
```
/agent/brain/meta/creatives/_tagging-taxonomy.md
```
The underscore keeps it at the top of the folder and signals it is a reference, not a creative.

---

## Step 4 - Generate individual creative MD files (the attributes)

One file per creative.

**File naming:** `<safe-ad-name>--<Motion-creative-ID>.md`. The exporter replaces filesystem-unsafe
characters and includes the creative ID so duplicate ad names cannot overwrite each other.

**Location:** `/agent/brain/meta/creatives/<safe-ad-name>--<Motion-creative-ID>.md`

**Each file contains this complete content contract:**

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
- Motion ID, Format, Launch Date, Status, Campaign, Ad Set

<!-- aligned-onboarding:account-context-projection:start -->
## Account Context Projection

### Naming Convention
- Decoded fields from the Account Context Brain if it has a decoder; otherwise the raw ad name

### Spend State
- The state derived from this creative's spend using the Account Context Brain's confirmed custom
  thresholds
<!-- aligned-onboarding:account-context-projection:end -->

## Ad Description
- The complete `summary.adDescription` string

## Hook or Headline
- The complete parsed `summary.hookOrHeadline` object or array, including every spoken, overlay,
  visual, and headline field Motion returned

## Creative Breakdown
- The complete parsed `summary.creativeBreakdown` object or array, including storyline, visuals,
  visual style, people, text, video elements, brand description, product description, and
  fonts/effects/language when returned

## Messaging and Positioning
- The complete parsed `summary.messagingAndPositioning` object or array, including CTAs, offer,
  benefits, features, pain points, social proof, stage of funnel, desired outcomes, and the nested
  emotional and audience insight when returned

## Transcript
- The complete `creative.transcript` object (`--include-transcript`). Video only. Note "Not returned
  by Motion" when absent.

## AI Tags (Motion Glossary)
- The complete `creative.glossaryTags` array, including Motion's definitions. Always captured.
```

The four requested summary sections are the content contract. Preserve each section in full. Do
not reduce `hookOrHeadline` to the first hook, replace `creativeBreakdown` with a short description,
or flatten `messagingAndPositioning` to value propositions. Storyline, visuals, product framing,
pain points, desired outcomes, funnel stage, and audience insight are all durable corpus content.
Null or missing sections may be recorded as not returned; malformed non-null sections must stop the
export.

**Protected Account Context Projection.** The exporter owns the Motion-derived sections and seeds
the marker block with the raw ad name and Motion-reported spend state. After the first export, read
the Account Context Brain and replace the contents inside that one marker pair with:

- the decoded naming fields from its naming decoder, or the raw ad name if no decoder exists; and
- Spend State derived from `metrics.spend` against its confirmed custom thresholds.

Keep both marker comments. On every later full or scoped export, the exporter copies that whole
block verbatim from the existing destination into the replacement file. It refuses to overwrite an
existing destination that does not contain exactly one complete marker block, so authored naming
or threshold decisions cannot be silently discarded. Edit Account Context projections only inside
the block; Motion content stays outside it.

**Why this shape (so it works with corpus-search):** the frontmatter keys (`brand`, `workspace`,
`source_id`, `event_at`) are what corpus-search filters and dedupes on, so keep them accurate.
`source_id` is the Motion creative ID and makes re-indexing idempotent (an update replaces the
record instead of duplicating it). Keep each part under its own `##` heading, because corpus-search
chunks by header: that keeps the hook, creative breakdown, messaging, transcript, and tags
independently searchable.
Knoweth reads the same file with no frontmatter required; the frontmatter exists purely to make
corpus-search filtering work.

**What to skip:**
- Metrics (spend, ROAS, CTR): they change constantly; summaries, transcripts, and tags do not.
- `adsWithoutCreativeAsset` rows: no creative content to enrich.
- Tool-calling notes and CLI mechanics: these files are customer-facing account content, not
  internal Runneth-team notes.

**Spend State** is a lightweight performance-tier proxy. Write it inside the protected Account
Context Projection block and derive it from `metrics.spend` against the thresholds already in the
Account Context Brain (do not re-fetch the workspace spend threshold):
- Above threshold and scaling: `scaling`
- At threshold, holding: `holding`
- Below threshold or declining: `declining`

---

## Step 5 - Make it retrievable

Writing the files under `/agent/brain/meta/creatives/` is the index step for Knoweth, which picks
them up automatically for everyday recall.

- For Knoweth: nothing else to run. If the files need a specific lane or read scope, set that once
  with `ContextConfig`. To sanity-check, reference a creative topic in a later turn or list the
  folder.
- For corpus-search (the supplement): register `/agent/brain/meta/creatives` as an enabled source in
  corpus-search's `sources.json` with `kind: creative` during install, so its `refresh` keeps the
  folder current automatically. To index on demand: `bash /agent/tools/corpus-search/corpus-search.sh
  index markdown --source /agent/brain/meta/creatives --kind creative`. Re-runs are idempotent,
  deduped by `source_id`. This step is only for corpus-search; Knoweth needs no index.

---

## Step 6 - Update the brain index

Add two entries to `/agent/INDEX.md`:

**1. The creatives folder**
```
- path: /agent/brain/meta/creatives/
  aliases: creative corpus, creative library, [workspace] creatives, per-creative files, creative tags, meta account attributes
  note: Per-creative MD files for [workspace] actives as of [date]. Identity, format, launch date, spend state, campaign, naming, transcript, and Motion AI glossary tags. No metrics. Interpretation source of truth is the Account Context Brain (account-context.md).
  created: [date]
  updated: [date]
```

**2. The taxonomy** (only if you created one)
```
- path: /agent/brain/meta/creatives/_tagging-taxonomy.md
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

1. Pull recent launches: `motion meta insights --date-range last_7d --include-glossary --include-metrics --include-transcript --summary-sections adDescription --summary-sections hookOrHeadline --summary-sections creativeBreakdown --summary-sections messagingAndPositioning --workspace-id <workspaceId>`
2. Compare returned creative IDs against existing files in `/agent/brain/meta/creatives/`.
3. Run the deterministic exporter over the returned JSON. It creates or replaces the file for each
   returned creative while preserving existing Account Context Projection blocks.
4. For each missing video transcript, run the fully enriched scoped re-pull from Step 2 and export
   that result second. Never export a transcript-only result.
5. For new files, project decoded naming and custom-threshold Spend State into the protected block.
6. Knoweth picks up the new files automatically. For corpus-search, run its refresh so filterable
   search stays current: `bash /agent/tools/corpus-search/corpus-search.sh refresh`.
7. Update the `updated` date on the creatives folder entry in `/agent/INDEX.md`, and append a
   one-line note to the `meta` folder `_changelog.md` (same convention the Account Context Brain uses).

**What you do not touch daily:**
- AI tags, transcripts, and Motion summaries are stable once set. Only re-pull if Motion re-ran
  its AI pipeline on a creative.
- Naming and custom-threshold Spend State projections do not need regeneration unless the Account
  Context Brain changes; the exporter preserves their protected block.
- Existing files do not need regeneration unless the taxonomy changes.

### Event-triggered

| Event | What to do |
|---|---|
| Naming conventions change in the Account Context Brain | Re-project the naming table and re-decode affected protected blocks |
| Campaign structure changes (new campaigns, renamed ad sets) | Update the naming table and re-tag affected files |
| A creative's Spend State changes materially | Re-derive Spend State inside its protected block from the Account Context thresholds |
| Motion re-tags or re-transcribes a creative | Run the fully enriched scoped re-pull and export it after the full pull |
| A new workspace is added | Run the Account Context Brain fill-in first for that workspace, then this playbook |

Because the Account Context Brain is upstream, taxonomy changes start there: update it, then
re-project the Creative Corpus. Do not fork a naming decision into the Creative Corpus that
contradicts the Account Context Brain.

---

## Multi-workspace

Customer brains are usually one workspace, but multi-workspace orgs are real. When the brain
holds more than one workspace, scope per workspace so entries do not collide:

- `/agent/brain/meta/<workspace-slug>/account-context.md`
- `/agent/brain/meta/<workspace-slug>/creatives/`
- `/agent/brain/meta/<workspace-slug>/creatives/_tagging-taxonomy.md`
- Index with workspace-scoped aliases in `/agent/INDEX.md`.
- If you use Knoweth lanes to separate workspaces, set the lane once with `ContextConfig`.

---

## Precedence and relationship to the Account Context Brain

- The Account Context Brain (`account-context.md`) is the source of truth for interpretation: what "best" means,
  how names decode, what the thresholds are, and how AI tags are used in analysis.
- The Creative Corpus (this file's output) is the source of truth for creative content: what each creative is,
  says, and shows, plus its transcript and Motion AI tags.
- The Creative Corpus always captures the attributes. The Account Context Brain decides how they are used. When the two
  disagree on an interpretation, the Account Context Brain wins. Re-project the Creative Corpus rather than editing it to
  diverge.

---

## Quick reference

| What | Where |
|---|---|
| Account Context Brain | `/agent/brain/meta/account-context.md` |
| Individual creative files | `/agent/brain/meta/creatives/<safe-ad-name>--<Motion-creative-ID>.md` |
| Tagging taxonomy (optional) | `/agent/brain/meta/creatives/_tagging-taxonomy.md` |
| Brain index | `/agent/INDEX.md` |
| Change log | `/agent/brain/meta/_changelog.md` |

| What | Command |
|---|---|
| Pull creative corpus | `motion meta insights --date-range last_365d --include-glossary --include-metrics --include-transcript --summary-sections adDescription --summary-sections hookOrHeadline --summary-sections creativeBreakdown --summary-sections messagingAndPositioning --workspace-id <workspaceId>` |
| Export creative corpus | `node /agent/.agents/skills/aligned-onboarding/bin/export-creative-corpus.mjs --input <motion-meta-insights.json> --workspace-id <workspaceId> --brand <brand-or-account>` |
| Enriched transcript backfill | `motion meta insights --scope creative-asset-id --creative-asset-id <id> --date-range last_365d --include-glossary --include-metrics --include-transcript --summary-sections adDescription --summary-sections hookOrHeadline --summary-sections creativeBreakdown --summary-sections messagingAndPositioning --workspace-id <workspaceId>` |
| Pull recent launches | `motion meta insights --date-range last_7d --include-glossary --include-metrics --include-transcript --summary-sections adDescription --summary-sections hookOrHeadline --summary-sections creativeBreakdown --summary-sections messagingAndPositioning --workspace-id <workspaceId>` |

Default window is `last_365d` unless the account or the person overrides it. There are no
corpus-search commands. Knoweth handles retrieval over the brain automatically.
