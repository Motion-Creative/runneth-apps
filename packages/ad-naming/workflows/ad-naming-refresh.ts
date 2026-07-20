import type { Workflow } from "@runneth/workflow/v1";

type AdNamingRefreshOutput = {
  decoderChanged: boolean;
  kpiMapChanged: boolean;
  queryContractChanged: boolean;
  highlights: string[];
  lastRefreshed: string;
};

/**
 * Ad Naming Refresh Workflow
 *
 * Refreshes all three ad-naming brain files from live Motion data:
 * - naming-decoder.md (from fresh ad names sample)
 * - kpi-map.md (from naming decoder + workspace goal + custom conversions)
 * - query-contract.md (from workspace goal + custom conversions + thumbstop test)
 *
 * Motion CLI pattern for bash tasks:
 *   ENVELOPE=$(motion ...)
 *   FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
 *   jq '...' "$FILE"
 *
 * Agent tasks write results to /tmp/an-results/*.json.
 * Bash tasks read those files. No stdout-parsing of agent responses.
 */
export const wf: Workflow<Record<string, never>, AdNamingRefreshOutput> = async ({
  task,
}) => {
  // ─── Step 1: Pull fresh data via bash ────────────────────────────────────

  await task.bash({
    key: "pull-adnames-sample",
    script: `
      set -euo pipefail
      mkdir -p /tmp/an-refresh /tmp/an-results

      ENVELOPE=$(motion meta ads --grain adnames --date-range last_90d --sort-by spend --sort-direction desc --limit 200)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
      cp "$FILE" /tmp/an-refresh/adnames.json

      echo "adnames-done: $(jq '.data.summaryRows | length' /tmp/an-refresh/adnames.json) rows"
    `,
  });

  await task.bash({
    key: "pull-workspace-context",
    script: `
      set -euo pipefail

      ENVELOPE=$(motion workspace-goal)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
      cp "$FILE" /tmp/an-refresh/workspace-goal.json

      ENVELOPE=$(motion meta custom-conversion-metrics)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
      cp "$FILE" /tmp/an-refresh/custom-conversions.json

      echo "workspace-context-done"
    `,
  });

  await task.bash({
    key: "pull-campaign-sample",
    script: `
      set -euo pipefail

      ENVELOPE=$(motion meta insights --date-range last_30d --sort topSpend --limit 100)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
      # Extract just campaign names for KPI map refresh
      jq '[.creatives[] | .campaignName] | unique | map(select(. != null))' "$FILE" > /tmp/an-refresh/campaign-names.json

      echo "campaign-names-done: $(jq length /tmp/an-refresh/campaign-names.json) unique names"
    `,
  });

  await task.bash({
    key: "test-thumbstop",
    script: `
      set -euo pipefail

      ENVELOPE=$(motion meta insights --date-range last_30d --sort topSpend --limit 1 --table-kpi thumbstop_rate)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')

      # Check if thumbstop_rate returns a non-null value
      THUMBSTOP=$(jq -r '.creatives[0].tableKpiMetrics.thumbstop_rate.value // "null"' "$FILE" 2>/dev/null || echo "null")
      echo "$THUMBSTOP" > /tmp/an-refresh/thumbstop-available.txt

      echo "thumbstop-test-done: $THUMBSTOP"
    `,
  });

  // ─── Step 2: Agent refreshes each file ───────────────────────────────────

  await task.agent({
    key: "refresh-naming-decoder",
    prompt: `
      Refresh /agent/brain/ad-naming/naming-decoder.md from a fresh ad names sample.

      Source: /tmp/an-refresh/adnames.json
      Read ad names from .data.summaryRows[].adName or .data.result.adnames[].adName.

      If naming-decoder.md already exists:
      - Check for new dimensions or values not in the current decoder.
      - If new: add them, note what changed.
      - If no change: write {"changed": false, "preview": "No new naming dimensions detected"} to /tmp/an-results/naming-decoder.json and stop.

      If naming-decoder.md does not exist:
      - Parse repeating delimited patterns from ad names.
      - Write a full decoder: system name, dimension table (prefix, full name, observed values with plain meanings), decode template, worked example.
      - Status: "drafted"

      Write back to /agent/brain/ad-naming/naming-decoder.md.
      Write {"changed": true/false, "preview": "short description of what changed"} to /tmp/an-results/naming-decoder.json.
    `,
  });

  await task.agent({
    key: "refresh-kpi-map",
    prompt: `
      Refresh /agent/brain/ad-naming/kpi-map.md.

      Sources:
      - /agent/brain/ad-naming/naming-decoder.md (campaign dimension if present)
      - /tmp/an-refresh/workspace-goal.json (primary KPI, conversion event, attribution windows)
      - /tmp/an-refresh/custom-conversions.json (conversion event IDs and names, at .data.customConversions[])
      - /tmp/an-refresh/campaign-names.json (unique campaign names from last 30 days)

      Build or update the per-campaign KPI map table.
      For each campaign segment (derived from naming decoder campaign dimension, or campaign name patterns):
      - Optimization target (from naming + workspace goal)
      - Primary conversion event (from custom-conversions matched to campaign purpose)
      - Testing cut and graduation thresholds (from workspace goal or standard rules)

      If no clear segments: write a single row for the primary optimization target.

      Write back to /agent/brain/ad-naming/kpi-map.md.
      Write {"changed": true/false, "preview": "..."} to /tmp/an-results/kpi-map.json.
    `,
  });

  await task.agent({
    key: "refresh-query-contract",
    prompt: `
      Refresh /agent/brain/ad-naming/query-contract.md.

      Sources:
      - /tmp/an-refresh/workspace-goal.json (attribution windows at .data.conversionDetails[].attributionWindow)
      - /tmp/an-refresh/custom-conversions.json (conversion events at .data.customConversions[])
      - /tmp/an-refresh/thumbstop-available.txt (contains "null" or a numeric value)

      Update the contract sections:
      1. Attribution windows: read click and view values from workspace-goal.
      2. Conversion events: list each conversion's name, id, _count key, _cost key.
      3. Thumbstop: read thumbstop-available.txt — if not "null", thumbstop_rate is available; otherwise note it returns null.
      4. Data-layer gotchas: keep existing static rules, do not remove them.

      If query-contract.md does not exist, create it from scratch with all sections.

      Write back to /agent/brain/ad-naming/query-contract.md.
      Write {"changed": true/false, "preview": "..."} to /tmp/an-results/query-contract.json.
    `,
  });

  // ─── Step 3: Collect results + update state ───────────────────────────────

  const collectResult = await task.bash({
    key: "collect-and-update-state",
    script: `
      set -euo pipefail
      TODAY=$(node -e "console.log(new Date().toISOString().slice(0,10))")

      node -e "
        const fs = require('fs');

        function readResult(item) {
          try { return JSON.parse(fs.readFileSync('/tmp/an-results/' + item + '.json', 'utf8')); }
          catch { return { changed: false, preview: 'result file not found' }; }
        }

        const decoder = readResult('naming-decoder');
        const kpiMap = readResult('kpi-map');
        const queryContract = readResult('query-contract');

        const highlights = [];
        if (decoder.changed && decoder.preview) highlights.push('naming-decoder: ' + decoder.preview);
        if (kpiMap.changed && kpiMap.preview) highlights.push('kpi-map: ' + kpiMap.preview);
        if (queryContract.changed && queryContract.preview) highlights.push('query-contract: ' + queryContract.preview);

        // Update state
        let state = {};
        try { state = JSON.parse(fs.readFileSync('/agent/brain/ad-naming/ad-naming-state.json', 'utf8')); } catch {}
        state.lastRefreshed = '$TODAY';
        if (!state.lastBuildDate) state.lastBuildDate = '$TODAY';
        fs.writeFileSync('/agent/brain/ad-naming/ad-naming-state.json', JSON.stringify(state, null, 2));

        const output = {
          decoderChanged: decoder.changed,
          kpiMapChanged: kpiMap.changed,
          queryContractChanged: queryContract.changed,
          highlights,
          lastRefreshed: '$TODAY',
        };
        console.log(JSON.stringify(output));
      "
    `,
  });

  let output: AdNamingRefreshOutput = {
    decoderChanged: false,
    kpiMapChanged: false,
    queryContractChanged: false,
    highlights: [],
    lastRefreshed: new Date().toISOString().slice(0, 10),
  };

  try {
    output = JSON.parse(collectResult.stdout.trim());
  } catch {
    // Return partial result
  }

  return output;
};
