# Meta Creative Attribution Playbook
### Step 1 of the Meta Onboarding Package

**How Runneth builds and maintains a per-creative attribution record for a Meta account.**

This is Step 1 of the Meta onboarding package. It runs before the Account Context Brain because
it collects raw creative facts — content, hooks, tags, transcripts, naming — without interpreting
them. Once built, it gives the Account Context Brain real material to work with.

> **Deployment note (staging): do not auto-build creative files in the brain.**
> In staging, per-creative summaries live in **Cacheth** and are surfaced through **Knoweth**.
> Installing this package must never trigger this playbook on its own, and nothing in this file
> (including the Maintenance section) runs automatically. Do not auto-pull creatives and write
> summary files under `/agent/brain/meta/creatives/`. Run this playbook only when a person
> explicitly asks for brain-stored attribution files for a workspace.

The one-line model:

> The **Account Context Brain** tells Runneth **how to analyze** the account. The **Creative
> Attribution** gives Runneth **the per-creative facts it needs to actually do the job**: one
> enriched record per active creative.

Creative Attribution does not interpret anything. Interpretation lives in the Account Context
Brain. This step only pulls from Motion what the Account Context Brain cannot tell it: the
creative content itself.

---

## What this produces

- **Individual creative Markdown files**, one per active creative, with identity, summary, hook,
  value props, transcript, AI tags, and naming.
- An optional **tagging taxonomy** file, only if a naming convention is detected.
- These files are automatically retrievable through Knoweth. Writing them is the index step.

---

## Step 1 - Start the onboarding

This step confirms the account scope and opens the attribution build with the customer.

1. Get the target `workspaceId`. Use `motion workspaces` if it is not already known.
2. Pull window defaults to `last_365d`. Only change this if the customer asks.
3. Open with a direct confirmation to the customer:

> I'm starting the Meta Creative Attribution build for **[account name]**. This pulls every active
> creative from your account and builds a searchable record of what each one says, shows, and is
> tagged as — the foundation for every performance read and creative recommendation going forward.
>
> I'll pull the last 12 months by default. This is Step 1 of your Meta onboarding. Once this is
> done, we'll move to Step 2 (Account Context Brain) to confirm how you want to judge performance.

4. Record the scope:
   - `workspaceId`: confirmed
   - Pull window: `last_365d` (or customer-specified)
   - Pull date: today's date as the "attribution as of" timestamp

No Account Context Brain is needed to run this step. Naming decodes are handled provisionally
in Step 3. Spend state is read directly from Motion.

---

## Step 2 - Pull the creative attribution from Motion

### 2a. Identity pull

Run this first. No summaries, no glossary. Returns every creative's identity, format, launch
date, status, spend state, campaign, and ad set. Completes quickly even for large accounts.

```
motion meta insights --date-range last_365d --include-metrics --workspace-id <workspaceId>
```

Inspect the returned file with `jq`:
- Check `totalCount` vs `providerTotalCount`. If they differ, the pull is partial.
- Check `.creatives[0]` to confirm `id`, `adName`, `campaignName`, `adsetName`, `launchDate`,
  `isActive`, `spendState`, and `format` are populated.
- Note `.adsWithoutCreativeAsset`. These are spend-bearing ads with no synced creative. Skip them.

**Save all creative IDs from this pull.** You need them for the enrichment batches.

### 2b. Enrichment pull

Adds summaries and AI tags to the creative IDs from 2a. Run in batches of 50 IDs per call using
Python subprocess. Do not attempt on the full account without batching.

```python
import json, subprocess

with open('./workdir/corpus_ids.json') as f:
    batches = json.load(f)['batches']

all_enriched = {}
for batch in batches:
    cmd = ['motion', 'meta', 'insights',
           '--scope', 'creative-asset-id',
           '--date-range', 'last_365d',
           '--summary-sections', 'adDescription',
           '--summary-sections', 'hookOrHeadline',
           '--summary-sections', 'messagingAndPositioning',
           '--glossary-category', 'visual-format',
           '--glossary-category', 'messaging-angle',
           '--glossary-category', 'hook-tactic',
           '--glossary-category', 'intended-audience',
           '--workspace-id', '<workspaceId>']
    for cid in batch:
        cmd += ['--creative-asset-id', cid]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
    envelope = json.loads(result.stdout)
    if envelope.get('successful') and envelope.get('file'):
        with open(envelope['file']) as f:
            data = json.load(f)
        for c in data.get('creatives', []):
            if c.get('id') and (c.get('summary') or c.get('glossaryTags')):
                all_enriched[c['id']] = {
                    'summary': c.get('summary') or {},
                    'glossaryTags': c.get('glossaryTags') or []
                }
```

50 IDs per batch is the reliable limit. Larger batches time out on high-spend creatives.

### 2c. Transcript pull

Transcripts are pulled scoped, not in bulk. Two passes:

1. **Top-spend videos** (end of the initial build): run a scoped transcript call covering the top
   50 video creatives by spend.
2. **On demand** for any specific creative later:

```
motion meta insights --scope creative-asset-id --creative-asset-id <id> \
  --include-transcript --date-range last_365d --workspace-id <workspaceId>
```

Only video creatives return a transcript. If a creative returns no transcript, record `"none"`.
Do not leave the field blank.

---

## Step 3 - Provisional naming decode

The identity pull (Step 2a) returns all ad names across the account. Use them to detect naming
patterns before writing any creative files.

1. Pull the full set of `adName` values from the identity pull result.
2. Look for structure: delimiters (underscores, hyphens, pipes), position-based encoding,
   recurring prefixes, tag-like codes.
3. If a pattern is detected, build a provisional decode table: position or segment → meaning →
   example values. Mark it **provisional**.
4. Use the provisional decode when writing creative files in Step 5. Mark decoded fields
   provisional in each file.

**Pass findings to the Account Context Brain.** When the Account Context Brain runs (Step 2 of
the onboarding), pre-populate Field 4 (Naming conventions) with this provisional decode table.
The Account Context Brain confirms, corrects, or replaces it — it does not start from scratch.

If no pattern is detected, record ad names raw in each creative file and note "no naming
convention detected" as the provisional finding for the Account Context Brain to confirm.

---

## Step 4 - Tagging taxonomy

Create this file only if a naming convention was detected in Step 3.

**Location:** `/agent/brain/meta/creatives/_tagging-taxonomy.md`

Contents: the provisional naming table (segment or position → meaning → example values) plus
the standard creative MD template from Step 5. Mark the naming table as provisional until the
Account Context Brain confirms it. The underscore prefix keeps it at the top of the folder and
signals it is a reference file, not a creative.

Skip this step entirely if no naming convention was detected.

---

## Step 5 - Generate individual creative MD files

One file per creative.

**File naming:** match the ad name exactly, `.md` extension. Replace slashes and special
characters with hyphens. Truncate to 200 characters before the `.md` extension. When two
creatives share the same ad name, append the last 6 characters of the `source_id` as a suffix
to prevent overwrites.

**Location:** `/agent/brain/meta/creatives/<AdName>.md`

**Template:**

```markdown
---
title: <Creative Name>
brand: <brand / ad account>
workspace: <workspaceId>
source_id: <Motion creative ID>
format: <Video | Image | Carousel>
event_at: <launch date>
is_active: <true | false>
spend_state: <scaling | holding | declining | unknown>
---

# <Creative Name>

## Identity
- Motion ID, Format, Launch Date, Status, Spend State, Campaign, Ad Set

## Naming Convention
- Decoded fields using the provisional naming table (if one was detected), or the raw ad name.
- Mark decoded values as provisional until the Account Context Brain confirms them.
- For @handle UGC or influencer creatives that fall outside the naming convention, note that
  explicitly.

## Creative Summary
- From Motion's adDescription summary section.

## Hook
- From Motion's hookOrHeadline summary section: spoken hook, text overlay, visual hook.

## Transcript
- From Motion's creative.transcript (video only). Write "none" if not returned.

## Value Propositions
- From Motion's messagingAndPositioning summary section.

## AI Tags (Motion Glossary)
- All tags Motion returns, grouped by category, using Motion's own definitions.
- If no tags were returned for this creative, say so explicitly.
```

**Spend State** comes from Motion's `spendState` field on the creative row. Use it directly.
Do not re-derive from spend numbers.

**What to skip:**
- Metrics (spend, ROAS, CPA, CTR, hold rate). They change on every pull.
- `adsWithoutCreativeAsset` rows. No creative content to enrich.
- Internal notes, CLI commands, or tool-calling mechanics. These files are account content.

---

## Step 6 - Make it retrievable

Writing the files under `/agent/brain/meta/creatives/` is the index step. Knoweth picks them up
automatically for everyday recall. No separate index command is needed.

If these files need a specific Knoweth lane or read scope, set that once with `ContextConfig`.

---

## Step 7 - Update the brain index

Add two entries to `/agent/INDEX.md`:

**1. The creatives folder**
```
- path: /agent/brain/meta/creatives/
  aliases: creative attribution, creative library, [account] creatives, per-creative files,
           creative tags, meta account attributes
  note: Per-creative MD files for [account] as of [date]. Identity, format, launch date,
        spend state, campaign, provisional naming decode, summaries, hooks, value props, and
        Motion AI glossary tags. No metrics. Interpretation source of truth is account-context.md.
  created: [date]
  updated: [date]
```

**2. The tagging taxonomy** (only if created)
```
- path: /agent/brain/meta/creatives/_tagging-taxonomy.md
  aliases: tagging taxonomy, naming convention, creative template, ad name decoder
  note: Provisional naming decode for [account]. Confirmed by Account Context Brain Field 4.
  created: [date]
  updated: [date]
```

---

## Maintenance

Maintenance applies only where a person explicitly requested the attribution build for this
workspace. It is not a standing routine that installs with the package; do not schedule or run it
otherwise.

### Daily

1. Pull recent launches:
   ```
   motion meta insights --date-range last_7d --include-metrics --workspace-id <workspaceId>
   ```
2. Compare returned creative IDs against existing files in `/agent/brain/meta/creatives/`.
3. For each new ID: generate its MD file using the batched enrichment approach (Step 2b, 50 IDs
   per batch).
4. For new video creatives: run a scoped transcript pull if spoken content is needed.
5. Update the `updated` date on the creatives folder entry in `/agent/INDEX.md`. Append a
   one-line note to `/agent/brain/meta/_changelog.md`.

**What you do not touch daily:**
- Summaries, glossary tags, and naming fields are stable once set. Re-pull only if Motion
  re-ran its AI pipeline on a creative.
- Existing files do not need regeneration unless the naming convention changes.

### Event-triggered

| Event | What to do |
|---|---|
| Account Context Brain confirms or corrects naming decode | Update the taxonomy file and re-decode affected creative files |
| Campaign structure changes | Update the Identity section on affected files |
| A creative's Spend State changes materially | Update its Spend State field |
| Motion re-tags or re-transcribes a creative | Re-pull and refresh that file's AI Tags or Transcript |
| A new workspace is added | Run this playbook for that workspace first, then the Account Context Brain |

---

## Multi-workspace

Most accounts are single-workspace, but multi-workspace orgs are real. When the brain holds
more than one workspace, scope per workspace to prevent file collisions:

- `/agent/brain/meta/<workspace-slug>/account-context.md`
- `/agent/brain/meta/<workspace-slug>/creatives/`
- `/agent/brain/meta/<workspace-slug>/creatives/_tagging-taxonomy.md`

Index with workspace-scoped aliases in `/agent/INDEX.md`. If you use Knoweth lanes to separate
workspaces, set the lane once with `ContextConfig`.

---

## Quick reference

| What | Where |
|---|---|
| Account Context Brain | `/agent/brain/meta/account-context.md` |
| Individual creative files | `/agent/brain/meta/creatives/<AdName>.md` |
| Tagging taxonomy (optional) | `/agent/brain/meta/creatives/_tagging-taxonomy.md` |
| Brain index | `/agent/INDEX.md` |
| Change log | `/agent/brain/meta/_changelog.md` |

| What | Command / approach |
|---|---|
| Identity pull | `motion meta insights --date-range last_365d --include-metrics --workspace-id <id>` |
| Enrichment pull | Python subprocess, 50 IDs per batch, `--scope creative-asset-id`, `--glossary-category` per dimension |
| Transcript (scoped) | `motion meta insights --scope creative-asset-id --creative-asset-id <id> --include-transcript --date-range last_365d --workspace-id <id>` |
| Daily new launches | `motion meta insights --date-range last_7d --include-metrics --workspace-id <id>` |
