# Creative Corpus

Builds the institutional creative memory that makes every Runneth answer sharper. Seeds a per-creative Markdown library by pulling Motion summaries, transcripts, and glossary tags for every creative in your Meta account — then keeps it fresh with a daily refresh script.

Companion package to Context Kit and Ad Naming.

## What it builds

- `{adname}__{id8}.md` per creative under `/agent/brain/meta/creatives/`
- Hook, full transcript, value props, glossary tags, decoded naming per file
- A Knoweth lane for auto-injection of relevant corpus files into context
- A daily script-mode refresh routine that adds new launches and updates spend state

## What it does NOT do

- Store live performance metrics (spend, ROAS, CPA stay in Motion)
- Replace Motion for current performance analysis
- Re-pull transcripts once indexed (they don't change)

## Install order recommendation

1. Context Kit
2. Ad Naming (build the naming decoder — the corpus uses it for ad name decoding)
3. Creative Corpus

## App build gotchas

- The corpus has no board app of its own. State is visible in the Context Kit board under a companion section if Context Kit is installed.
- Package sync stages files but does NOT run the build workflow. Run `build my corpus` after install.

## Architecture notes

- Build: workflow (`corpus-build.ts`) registered by the skill on first run
- Refresh: script-mode routine (`corpus-refresh.mjs`) registered after build
- State: `/agent/brain/meta/corpus-state.json`
- Playbook: `/agent/brain/meta/creatives/PLAYBOOK.md`

## Content vs. metrics rule

The corpus owns durable creative content. Live metrics always come from a fresh Motion pull. The only performance signal stored in corpus files is a coarse `spendState` (scaling / active / paused) refreshed daily by the script.
