import type { Workflow } from "@runneth/workflow/v1";

type RefreshOutput = {
  changed: string[];
  unchanged: string[];
  stale: string[];
  highlights: string[];
  lastRefreshed: string;
  itemsUpdated: number;
};

/**
 * Context Kit Brand Refresh Workflow
 *
 * Re-pulls all Motion-sourced brand data for Bucket A and Bucket B items.
 * Does NOT touch naming decoder, KPI map, or query contract — those are
 * owned by the ad-naming package and its own refresh workflow.
 *
 * Writes ONLY "## Latest Import From Motion" sections.
 * Preserves "## Runneth Instructions" exactly.
 *
 * Motion CLI pattern for bash tasks:
 *   ENVELOPE=$(motion ...)                           # capture envelope to var
 *   FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file') # parse file path
 *   jq '...' "$FILE"                                 # read actual data
 *
 * Agent tasks write structured output to /tmp/ck-results/*.json.
 * Bash tasks read those files. No stdout-parsing of agent responses.
 */
export const wf: Workflow<Record<string, never>, RefreshOutput> = async ({
  task,
}) => {
  // ─── Step 1: Pull Motion data via bash ───────────────────────────────────

  await task.bash({
    key: "pull-workspace-data",
    script: `
      set -euo pipefail
      mkdir -p /tmp/ck-refresh

      ENVELOPE=$(motion workspace-goal)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
      cp "$FILE" /tmp/ck-refresh/workspace-goal.json

      ENVELOPE=$(motion spend-threshold)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
      cp "$FILE" /tmp/ck-refresh/spend-threshold.json

      ENVELOPE=$(motion brand-context --data-query "summary")
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
      cp "$FILE" /tmp/ck-refresh/brand-context.json

      echo "workspace-data-done"
    `,
  });

  await task.bash({
    key: "pull-glossary-spine",
    script: `
      set -euo pipefail

      ENVELOPE=$(motion ai-glossary)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
      cp "$FILE" /tmp/ck-refresh/glossary.json

      ENVELOPE=$(motion meta insights --include-glossary --date-range last_30d --sort topSpend --limit 100)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
      cp "$FILE" /tmp/ck-refresh/insights-glossary.json

      echo "glossary-done"
    `,
  });

  await task.bash({
    key: "pull-inspo-brands",
    script: `
      set -euo pipefail

      ENVELOPE=$(motion inspo brands --limit 20)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
      cp "$FILE" /tmp/ck-refresh/inspo-brands.json

      echo "inspo-done"
    `,
  });

  await task.bash({
    key: "pull-voc-transcripts",
    script: `
      set -euo pipefail

      ENVELOPE=$(motion meta insights --include-transcript --date-range last_30d --sort topSpend --limit 20)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
      cp "$FILE" /tmp/ck-refresh/transcripts.json

      echo "voc-done"
    `,
  });

  // ─── Step 2: Agent re-drafts each item ───────────────────────────────────
  // Each agent writes a result JSON to /tmp/ck-results/<item>.json.
  // Format: {"changed": true/false, "preview": "one short sentence"}

  await task.bash({
    key: "setup-results-dir",
    script: `mkdir -p /tmp/ck-results`,
  });

  await task.agent({
    key: "update-brand-context",
    prompt: `
      Update /agent/brain/context-kit/brand-context.md from refreshed Motion data.

      Source files: /tmp/ck-refresh/brand-context.json and /tmp/ck-refresh/insights-glossary.json
      (read .creatives[].glossaryTags[] from insights-glossary for tag distribution).

      Rules:
      - Read the current file first. Preserve any "## Runneth Instructions" section exactly.
      - Rewrite ONLY "## Latest Import From Motion": brand name, positioning, product description,
        proof points from top-spend tags, 2-sentence tone, 2-sentence audience.
      - Write back to /agent/brain/context-kit/brand-context.md.
      - Mirror to /agent/apps/context-kit/data/brand-context.md.
      - Write {"changed": true/false, "preview": "one short sentence"} to /tmp/ck-results/brand-context.json.
    `,
  });

  await task.agent({
    key: "update-kpis-goal",
    prompt: `
      Update /agent/brain/context-kit/kpis-goal.md from refreshed Motion data.

      Source: /tmp/ck-refresh/workspace-goal.json (primary KPI and attribution windows).

      Note: the per-campaign KPI map is owned by the ad-naming package.
      Only update the primary KPI, conversion event, and attribution window sections here.

      Rules:
      - Preserve "## Runneth Instructions" exactly.
      - Rewrite only "## Latest Import From Motion".
      - Write back and mirror to data/kpis-goal.md.
      - Write {"changed": true/false, "preview": "..."} to /tmp/ck-results/kpis-goal.json.
    `,
  });

  await task.agent({
    key: "update-spend-threshold",
    prompt: `
      Update /agent/brain/context-kit/spend-threshold.md from /tmp/ck-refresh/spend-threshold.json.
      Preserve "## Runneth Instructions". Rewrite only "## Latest Import From Motion".
      Write back, mirror, write {"changed": true/false, "preview": "..."} to /tmp/ck-results/spend-threshold.json.
    `,
  });

  await task.agent({
    key: "update-voice",
    prompt: `
      Update /agent/brain/context-kit/voice.md from /tmp/ck-refresh/insights-glossary.json.
      Read .creatives[].glossaryTags[] — focus on visual-format, asset-type, hook-tactic, messaging-angle by spend.
      Derive 4-6 named voice characteristics (sounds-like / doesn't-sound-like pairs).
      Preserve "## Runneth Instructions". Rewrite only "## Latest Import From Motion".
      If Motion data is empty: status = "inferred", add sourceNote.
      Write back, mirror, write {"changed": true/false, "preview": "..."} to /tmp/ck-results/voice.json.
    `,
  });

  await task.agent({
    key: "update-voc",
    prompt: `
      Update /agent/brain/context-kit/voc.md from /tmp/ck-refresh/transcripts.json.
      Read .creatives[].transcript for top-spend videos.
      Build or refresh the 7-category swipe file with near-verbatim language:
      pain, emotional language, desire, before/after, objections, competitor complaints, trigger events.
      Preserve "## Runneth Instructions". Rewrite only "## Latest Import From Motion".
      If transcripts are empty, note it clearly.
      Write back, mirror, write {"changed": true/false, "preview": "..."} to /tmp/ck-results/voc.json.
    `,
  });

  await task.agent({
    key: "update-competitors",
    prompt: `
      Update /agent/brain/context-kit/competitors.md from /tmp/ck-refresh/inspo-brands.json.
      Read .data.brands[] for the customer's followed brands.
      Note name, Motion brand ID, active ad count signal for each.
      Flag brands with substantially more or fewer ads than the current file shows.
      Preserve "## Runneth Instructions". Rewrite only "## Latest Import From Motion".
      Write back, mirror, write {"changed": true/false, "preview": "..."} to /tmp/ck-results/competitors.json.
    `,
  });

  // ─── Step 3: Collect results + check staleness ────────────────────────────

  const collectResult = await task.bash({
    key: "collect-results",
    script: `
      set -euo pipefail

      node -e "
        const fs = require('fs');
        const items = ['brand-context', 'kpis-goal', 'spend-threshold', 'voice', 'voc', 'competitors'];
        const changed = [];
        const unchanged = [];
        const highlights = [];

        for (const item of items) {
          try {
            const result = JSON.parse(fs.readFileSync('/tmp/ck-results/' + item + '.json', 'utf8'));
            if (result.changed) {
              changed.push(item);
              if (result.preview) highlights.push(item + ': ' + result.preview);
            } else {
              unchanged.push(item);
            }
          } catch {
            unchanged.push(item);
          }
        }

        const stale = [];
        try {
          const state = JSON.parse(fs.readFileSync('/agent/brain/context-kit/context-kit-state.json', 'utf8'));
          const cutoff = Date.now() - (21 * 86400 * 1000);
          for (const [id, item] of Object.entries(state.items || {})) {
            if (item.updatedAt && new Date(item.updatedAt).getTime() < cutoff && item.status !== 'missing') {
              stale.push(id);
            }
          }
        } catch {}

        const today = new Date().toISOString().slice(0, 10);
        console.log(JSON.stringify({ changed, unchanged, stale, highlights, lastRefreshed: today, itemsUpdated: changed.length }));
      "
    `,
  });

  // ─── Step 4: Update state ─────────────────────────────────────────────────

  await task.bash({
    key: "update-state",
    script: `
      set -euo pipefail
      TODAY=$(node -e "console.log(new Date().toISOString().slice(0,10))")

      node -e "
        const fs = require('fs');
        let state = {};
        try { state = JSON.parse(fs.readFileSync('/agent/brain/context-kit/context-kit-state.json', 'utf8')); } catch {}
        state.lastRefreshed = '$TODAY';
        const out = JSON.stringify(state, null, 2);
        fs.writeFileSync('/agent/brain/context-kit/context-kit-state.json', out);
        fs.writeFileSync('/agent/apps/context-kit/data/context-kit-state.json', out);
      "
    `,
  });

  let output: RefreshOutput = {
    changed: [],
    unchanged: [],
    stale: [],
    highlights: [],
    lastRefreshed: new Date().toISOString().slice(0, 10),
    itemsUpdated: 0,
  };

  try {
    output = JSON.parse(collectResult.stdout.trim());
  } catch {
    // Return partial result
  }

  return output;
};
