---
name: creative-corpus
description: Builds and maintains the durable per-creative brain library for this Meta account. Triggers on "build my corpus", "index my creatives", "build creative library", "set up creative corpus", "index the account", "build the brain library".
---

# Creative Corpus skill

Build the corpus once, then keep it fresh with a daily agent-mode routine. After
build, every analysis reads local files instead of re-hitting Motion for durable
creative content.

## Step 0 — Check state

Read `/agent/brain/meta/corpus-state.json`. If `lastBuildDate` exists, the corpus is already built — go to refresh mode (offer to run the refresh task or check the routine is set up).

If `totalCreatives` is 0 or absent, this is a first build. Proceed with the full build workflow.

## Step 1 — Register the Knoweth lane (first run only)

If `corpusLaneId` is absent from state:
1. Call ContextConfig with action `update` to register the `creative-corpus` lane pointing at `/agent/brain/meta/creatives/` as a directory lane with `read: true`.
2. Save the returned lane ID (or a generated stable ID) to state as `corpusLaneId`.

## Step 2 — Build directly in this agent turn (first run only)

Do not run Motion from `task.bash`, a workflow bash task, or a script-mode routine.
Task-scoped broker tokens cannot access the trusted Motion tool. Perform every Motion
call directly in this agent turn; use bash only for deterministic local file work.

1. Tell the customer you are building the corpus, then create
   `/agent/brain/meta/creatives/` if needed.
2. Pull the creative roster in three separate windows: `last_30d`, days 31-60, and
   days 61-90. Use `motion meta insights` with `--sort topSpend`,
   `--include-metrics`, and `--limit 500`. Parse each envelope's `.file`.
3. Deduplicate by the full creative asset ID. Skip an ID when a corpus file already
   has that exact `id:` frontmatter or ends in its sanitized full-ID suffix.
4. Enrich new IDs in batches of no more than 15. Repeat `--creative-asset-id` and
   each category/section flag:
   ```
   motion meta insights \
     --scope creative-asset-id \
     --creative-asset-id <id> \
     --date-range last_365d \
     --include-metrics \
     --glossary-category intended-audience \
     --glossary-category messaging-angle \
     --glossary-category hook-tactic \
     --glossary-category visual-format \
     --glossary-category asset-type \
     --glossary-category offer-type \
     --glossary-category seasonality \
     --summary-sections hookOrHeadline \
     --summary-sections creativeBreakdown \
     --summary-sections messagingAndPositioning \
     --summary-sections emotionalAndAudienceInsight \
     --summary-sections adDescription
   ```
5. Write one Markdown file per creative using
   `{sanitized-adname}__{sanitized-full-creative-id}.md`. Limit the ad-name prefix
   to 60 characters. The full ID is the stable key; never use an ID prefix.
6. Store the full `id`, ad name, format, launch date, campaign name, status,
   `spendState`, and `indexedAt` in frontmatter. Store the five summary sections,
   glossary tags, value props, and decoded ad name in the body. Do not label summary
   sections as a verbatim transcript.
7. Update `corpus-state.json` with `totalCreatives`, `lastBuildDate`, and
   `filenameConventionVersion: 2`; append the result to `PLAYBOOK.md`.
8. Report built/skipped/failed counts. If any full IDs are missing from the result,
   name them rather than silently counting them as built.

## Step 3 — Set up the daily agent-mode refresh (after build completes)

1. Register an agent-mode routine. Do not pass `--script`:
```
routine add \
  --name "Creative corpus daily refresh" \
  --cron "0 5 * * *" \
  --delivery "Update corpus state only — no conversation needed unless new creatives are indexed or errors occur." \
  --prompt "Start an agent turn and read the installed creative-corpus skill. Run its refresh procedure directly with trusted Motion tools; never call Motion from task.bash or a script. Match existing files by full creative ID, enrich new IDs in batches of 15 or fewer with the documented glossary-category and summary-sections flags, update spendState and status for existing IDs, update corpus-state.json, and open a new conversation only when new creatives were indexed or errors occurred."
```
2. Save the routine ID to `corpus-state.json` as `refreshRoutineId`.
3. Tell the customer: "I've set up a daily refresh that runs at 5am. New creative launches will appear in the corpus the next morning."

## Step 4 — Using the corpus

After build, the corpus lane is active. When the customer asks questions that benefit from corpus depth:

- **"What hooks have we ever run about fear?"** → `rg -l "fear" /agent/brain/meta/creatives/` then read matching files.
- **"Show me every UGC creative from last year"** → filter corpus files by `format: ugc` and `launchDate`.
- **"What did this ad say?"** → find by full ID or ad name and read its summary sections.
- **"What customer language do we use around [topic]?"** → search the creative-text sections across the corpus.
- **"Build me briefs based on our best hooks"** → read top-spend corpus files, extract hook lines, generate briefs.

Always say: "I'm reading this from your creative corpus — [n] creatives indexed locally." Do not re-pull from Motion for content questions when the corpus file exists.

## Rules

- Do not re-pull summary sections for already-indexed creatives. They are durable content.
- Always batch ≤15 IDs per enrichment call.
- The corpus does not replace live Motion pulls for current performance numbers.
- Use the sanitized full creative asset ID as the filename suffix and canonical key.
  Resolve existing files by full-ID suffix or exact `id:` frontmatter so ad-name
  changes do not create duplicates.
- If a creative ID is mentioned that is not in the corpus, offer to fetch and add it
  with the same ID-scoped glossary-category and summary-sections command from Step 2.
- Keep the PLAYBOOK.md updated when the build finishes. It is the maintenance reference.
