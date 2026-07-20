---
name: creative-corpus
description: Builds and maintains the durable per-creative brain library for this Meta account. Triggers on "build my corpus", "index my creatives", "build creative library", "set up creative corpus", "index the account", "build the brain library".
---

# Creative Corpus skill

Build the corpus once, keep it fresh with a daily script routine. After build, every analysis reads local files instead of re-hitting Motion.

## Step 0 — Check state

Read `/agent/brain/meta/corpus-state.json`. If `lastBuildDate` exists, the corpus is already built — go to refresh mode (offer to run the refresh task or check the routine is set up).

If `totalCreatives` is 0 or absent, this is a first build. Proceed with the full build workflow.

## Step 1 — Register the Knoweth lane (first run only)

If `corpusLaneId` is absent from state:
1. Call ContextConfig with action `update` to register the `creative-corpus` lane pointing at `/agent/brain/meta/creatives/` as a directory lane with `read: true`.
2. Save the returned lane ID (or a generated stable ID) to state as `corpusLaneId`.

## Step 2 — Register and run the build workflow (first run only)

1. Read the workflow source at `/agent/brain/meta/corpus-build.ts`.
2. Run `workflow push /agent/brain/meta/corpus-build.ts --name creative-corpus-build`.
3. Save the returned workflow ID to `corpus-state.json` as `buildWorkflowId`.
4. Create the task: `task add --kind workflow --workflow-id <id> --name "Creative Corpus Build"`. Save as `buildTaskId`.
5. Run the task: `task run --id <buildTaskId>`. Tell the customer: "I'm building your creative corpus — this pulls summaries, transcripts, and tags for every creative in your account. It runs in the background and will take a few minutes depending on your library size. I'll let you know when it's done."
6. `task wait --run <runId>` with a generous timeout. When complete, read the output and report: "Built [n] creative files. Your creative brain is ready."

## Step 3 — Set up the daily refresh routine (after build completes)

1. Register the refresh script as a script-mode routine:
```
routine add \
  --name "Creative corpus daily refresh" \
  --cron "0 5 * * *" \
  --delivery "Update corpus state only — no conversation needed unless errors occur." \
  --prompt "Run the corpus refresh script. If the script fails, report the error in a new web conversation." \
  --script /agent/brain/meta/corpus-refresh.mjs
```
2. Save the routine ID to `corpus-state.json` as `refreshRoutineId`.
3. Tell the customer: "I've set up a daily refresh that runs at 5am. New creative launches will appear in the corpus the next morning."

## Step 4 — Using the corpus

After build, the corpus lane is active. When the customer asks questions that benefit from corpus depth:

- **"What hooks have we ever run about fear?"** → `rg -l "fear" /agent/brain/meta/creatives/` then read matching files.
- **"Show me every UGC creative from last year"** → filter corpus files by `format: ugc` and `launchDate`.
- **"What did this ad say?"** → find by ad name or ID, read `transcript` field.
- **"What customer language do we use around [topic]?"** → grep transcripts across the full corpus.
- **"Build me briefs based on our best hooks"** → read top-spend corpus files, extract hook lines, generate briefs.

Always say: "I'm reading this from your creative corpus — [n] creatives indexed locally." Do not re-pull from Motion for content questions when the corpus file exists.

## Rules

- Do not re-pull transcripts or summaries for already-indexed creatives. They are durable content.
- Always batch ≤15 IDs per enrichment call.
- The corpus does not replace live Motion pulls for current performance numbers.
- If a creative ID is mentioned that is not in the corpus, offer to fetch and add it: `motion meta insights --scope creative-asset-id --creative-asset-id <id> --include-transcript --include-glossary --date-range last_365d`.
- Keep the PLAYBOOK.md updated when the build finishes. It is the maintenance reference.
