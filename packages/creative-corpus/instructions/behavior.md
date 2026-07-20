# Creative Corpus package instructions

This package builds and maintains a durable per-creative library for the connected Meta account. Every creative the account has ever run gets its own Markdown file in `/agent/brain/meta/creatives/`, indexed by creative asset ID.

## Install order

1. Context Kit (brand knowledge foundation)
2. Ad Naming (naming decoder at `/agent/brain/ad-naming/naming-decoder.md` — corpus uses it for decoded naming in corpus files)
3. Creative Corpus (this package)

Creative Corpus works without ad-naming, but corpus files will have a placeholder in the "Decoded Ad Name" section until the naming decoder is installed.

## Knoweth lane

| Lane ID | Path | Kind |
|---|---|---|
| `creative-corpus` | `/agent/brain/meta/creatives/` | `directory` |

The skill registers this lane on first run. Individual creative files are surfaced by Knoweth based on creative IDs or ad names mentioned in the conversation.

## Content vs. metrics rule (critical)

| What lives in the corpus | What stays a live Motion pull |
|---|---|
| Hook / opening line | Spend (last N days) |
| Motion summary sections / creative text | ROAS, CPA, CTR |
| Glossary tags (AI-derived) | Thumbstop, hold rate |
| Decoded ad name (from ad-naming) | Current status |
| Summary / value props | Recent impressions |
| Format, launch date | Conversion counts |
| `spendState` (coarse, daily refresh) | |

## Naming decoder path

The corpus checks for the naming decoder at `/agent/brain/ad-naming/naming-decoder.md` (the ad-naming package path). If ad-naming is not installed, corpus files carry: `"Install the ad-naming package to enable ad name decoding."` in the Decoded Ad Name section.

## File naming convention

`{sanitized-adname}__{sanitized-full-creative-id}.md`
- `sanitized-adname`: ad name with non-alphanumeric chars → `-`, max 60 chars
- `sanitized-full-creative-id`: the complete Motion creative asset ID, normalized
  to safe filename characters

The full creative ID is the stable key. Match existing files by the full-ID suffix or
exact `id:` frontmatter; an ad-name change must not create a duplicate.

## When to use the corpus

Use corpus files when:
- The question is about a specific creative by name or ID
- Analyzing patterns across the full account (hook tactics, messaging angles, format mix)
- Building briefs that reference past hooks and creative text
- VoC mining beyond the current `last_30d` pull
- Looking up paused or historical creatives

Use live Motion pulls for current performance numbers.

## Refresh behavior

The daily agent-mode routine reads the installed skill and performs refresh work in
an agent turn:
1. Pulls `last_7d` for new creative IDs not yet in the corpus.
2. New IDs: fetches enrichment in batches of ≤15, writes new corpus files.
3. Existing IDs in the `last_7d` pull: updates `spendState` and `status` in-place.
4. Does NOT re-pull summary sections for already-indexed creatives.

Every Motion call must run directly in the agent turn. Never call Motion from
`task.bash` or a script-mode routine.

## State file

`/agent/brain/meta/corpus-state.json` tracks: `totalCreatives`, `lastBuildDate`,
`lastRefreshDate`, `corpusLaneId`, `refreshRoutineId`, and
`filenameConventionVersion`.

## Rules

- Never re-pull summary sections for already-indexed files.
- Always batch enrichment at ≤15 IDs per `motion meta insights --scope creative-asset-id` call.
- Use `--date-range last_365d` on ID-scoped calls.
- Use repeated `--glossary-category` and `--summary-sections` flags from the skill.
  Do not use rejected `--include-glossary` or blocked `--include-transcript` flags.
- Write is create-if-absent; refresh is update-in-place via the full creative ID.
