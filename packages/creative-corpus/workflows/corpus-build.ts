import type { Workflow } from "@runneth/workflow/v1";

type CorpusBuildOutput = {
  totalBuilt: number;
  totalSkipped: number;
  totalFailed: number;
  batches: number;
  buildDate: string;
};

/**
 * Creative Corpus Build Workflow
 *
 * Pulls every creative in the Meta account over a 90-day window,
 * batches IDs into groups of ≤15, fetches summary + transcript + glossary
 * for each batch, and writes one Markdown file per creative.
 *
 * Motion CLI pattern for bash tasks:
 *   ENVELOPE=$(motion meta insights ...)
 *   FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')
 *   jq '...' "$FILE"
 *
 * Split: bash for Motion pulls + file writes; agent only for naming decode (LLM needed).
 * Agent tasks write structured output to /tmp files; bash reads those.
 */
export const wf: Workflow<
  { forceRebuild?: boolean },
  CorpusBuildOutput
> = async ({ input, task }) => {
  const forceRebuild = input?.forceRebuild ?? false;

  // ─── Step 1: Pull creative roster across 3 x 30-day windows ──────────────
  // Separate calls — 90-day + summaries times out (Jude's lesson).
  // No transcripts/summaries here — just the roster for deduplication.

  await task.bash({
    key: "roster-last-30d",
    script: `
      set -euo pipefail
      mkdir -p /tmp/corpus-roster /tmp/corpus-batches /agent/brain/meta/creatives

      ENVELOPE=$(motion meta insights --date-range last_30d --sort topSpend --include-metrics --limit 500)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')

      jq '[.creatives[] | {
        id: .id,
        adName: (.adName // "unknown"),
        format: (.format // "unknown"),
        launchDate: (.launchDate // null),
        campaignName: (.campaignName // null),
        status: (.status // "unknown"),
        spend: (.metrics.spend // 0)
      }]' "$FILE" > /tmp/corpus-roster/batch-30.json

      echo "30d roster: $(jq length /tmp/corpus-roster/batch-30.json) creatives"
    `,
  });

  await task.bash({
    key: "roster-31-60d",
    script: `
      set -euo pipefail

      # Portable date arithmetic via node (avoids GNU vs BSD date differences)
      START=$(node -e "const d=new Date();d.setDate(d.getDate()-60);console.log(d.toISOString().slice(0,10))")
      END=$(node -e "const d=new Date();d.setDate(d.getDate()-31);console.log(d.toISOString().slice(0,10))")

      ENVELOPE=$(motion meta insights --start-date "$START" --end-date "$END" --sort topSpend --include-metrics --limit 500)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')

      jq '[.creatives[] | {
        id: .id,
        adName: (.adName // "unknown"),
        format: (.format // "unknown"),
        launchDate: (.launchDate // null),
        campaignName: (.campaignName // null),
        status: (.status // "unknown"),
        spend: (.metrics.spend // 0)
      }]' "$FILE" > /tmp/corpus-roster/batch-60.json

      echo "31-60d roster: $(jq length /tmp/corpus-roster/batch-60.json) creatives"
    `,
  });

  await task.bash({
    key: "roster-61-90d",
    script: `
      set -euo pipefail

      START=$(node -e "const d=new Date();d.setDate(d.getDate()-90);console.log(d.toISOString().slice(0,10))")
      END=$(node -e "const d=new Date();d.setDate(d.getDate()-61);console.log(d.toISOString().slice(0,10))")

      ENVELOPE=$(motion meta insights --start-date "$START" --end-date "$END" --sort topSpend --include-metrics --limit 500)
      FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')

      jq '[.creatives[] | {
        id: .id,
        adName: (.adName // "unknown"),
        format: (.format // "unknown"),
        launchDate: (.launchDate // null),
        campaignName: (.campaignName // null),
        status: (.status // "unknown"),
        spend: 0
      }]' "$FILE" > /tmp/corpus-roster/batch-90.json

      echo "61-90d roster: $(jq length /tmp/corpus-roster/batch-90.json) creatives"
    `,
  });

  // ─── Step 2: Deduplicate + create batches ─────────────────────────────────

  const batchSetup = await task.bash({
    key: "create-batches",
    script: `
      set -euo pipefail

      node -e "
        const fs = require('fs');
        const path = require('path');

        const r30 = JSON.parse(fs.readFileSync('/tmp/corpus-roster/batch-30.json', 'utf8') || '[]');
        const r60 = JSON.parse(fs.readFileSync('/tmp/corpus-roster/batch-60.json', 'utf8') || '[]');
        const r90 = JSON.parse(fs.readFileSync('/tmp/corpus-roster/batch-90.json', 'utf8') || '[]');

        // Deduplicate by id — keep highest-spend entry
        const byId = new Map();
        for (const c of [...r30, ...r60, ...r90]) {
          if (!c.id) continue;
          const existing = byId.get(c.id);
          if (!existing || (c.spend || 0) > (existing.spend || 0)) {
            byId.set(c.id, c);
          }
        }
        const allCreatives = Array.from(byId.values());

        // Skip already-indexed unless forceRebuild
        const forceRebuild = ${forceRebuild};
        const toProcess = forceRebuild ? allCreatives : allCreatives.filter(c => {
          const id8 = c.id.slice(0, 8);
          const slug = c.adName.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 80);
          return !fs.existsSync('/agent/brain/meta/creatives/' + slug + '__' + id8 + '.md');
        });

        // Batch into groups of 15
        const batches = [];
        for (let i = 0; i < toProcess.length; i += 15) {
          batches.push(toProcess.slice(i, i + 15));
        }

        // Write each batch file
        batches.forEach((batch, i) => {
          fs.writeFileSync('/tmp/corpus-batches/batch-' + i + '.json', JSON.stringify(batch));
        });

        const manifest = { total: allCreatives.length, toProcess: toProcess.length, batchCount: batches.length };
        fs.writeFileSync('/tmp/corpus-batches/manifest.json', JSON.stringify(manifest));
        console.log(JSON.stringify(manifest));
      "
    `,
  });

  let manifest = { total: 0, toProcess: 0, batchCount: 0 };
  try {
    manifest = JSON.parse(batchSetup.stdout.trim());
  } catch {
    // Default to 0 batches — nothing to process
  }

  // ─── Step 3: Check for naming decoder (used during file writes) ───────────

  await task.bash({
    key: "check-naming-decoder",
    script: `
      if [ -f /agent/brain/ad-naming/naming-decoder.md ]; then
        echo "decoder-present"
      else
        echo "decoder-absent"
      fi
    `,
  });

  // ─── Step 4: Process batches — fetch enrichment + write MD files ──────────
  // Each batch: bash fetches enrichment from Motion, then writes the MD files.
  // Agent is only called when naming decode needs LLM interpretation.

  let totalBuilt = 0;
  let totalFailed = 0;

  for (let batchIndex = 0; batchIndex < manifest.batchCount; batchIndex++) {
    // Fetch enrichment for this batch via bash
    await task.bash({
      key: `fetch-enrichment-${batchIndex}`,
      script: `
        set -euo pipefail

        # Read the batch to get IDs
        BATCH_FILE="/tmp/corpus-batches/batch-${batchIndex}.json"
        IDS=$(jq -r '.[].id' "$BATCH_FILE")

        # Build the --creative-asset-id flags
        ID_FLAGS=""
        while IFS= read -r id; do
          ID_FLAGS="$ID_FLAGS --creative-asset-id $id"
        done <<< "$IDS"

        # Fetch enrichment (single motion call — no pipe on the motion command itself)
        ENVELOPE=$(motion meta insights --scope creative-asset-id $ID_FLAGS --include-transcript --include-glossary --date-range last_365d --include-metrics)
        FILE=$(printf '%s' "$ENVELOPE" | jq -r '.file')

        # Save enrichment file path for the write step
        echo "$FILE" > /tmp/corpus-batches/enrichment-${batchIndex}-path.txt

        echo "batch-${batchIndex}: enrichment fetched from $FILE"
      `,
    });

    // Write MD files for this batch
    const writeResult = await task.bash({
      key: `write-files-${batchIndex}`,
      script: `
        set -euo pipefail

        BATCH_FILE="/tmp/corpus-batches/batch-${batchIndex}.json"
        ENRICHMENT_FILE=$(cat /tmp/corpus-batches/enrichment-${batchIndex}-path.txt)
        DECODER_EXISTS=$([ -f /agent/brain/ad-naming/naming-decoder.md ] && echo "true" || echo "false")
        TODAY=$(node -e "console.log(new Date().toISOString().slice(0,10))")

        node -e "
          const fs = require('fs');
          const path = require('path');

          const batch = JSON.parse(fs.readFileSync('$BATCH_FILE', 'utf8'));
          const enrichData = JSON.parse(fs.readFileSync('$ENRICHMENT_FILE', 'utf8'));
          const creativeMap = {};
          for (const c of (enrichData.creatives || [])) {
            if (c.id) creativeMap[c.id] = c;
          }

          const decoderExists = $DECODER_EXISTS;
          let built = 0;
          let failed = 0;

          for (const meta of batch) {
            try {
              const creative = creativeMap[meta.id] || {};
              const id8 = meta.id.slice(0, 8);
              const slug = meta.adName.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 80);
              const filePath = path.join('/agent/brain/meta/creatives', slug + '__' + id8 + '.md');

              const spend = meta.spend || 0;
              const spendState = spend > 1000 ? 'scaling' : spend > 0 ? 'active' : 'paused';

              const tags = (creative.glossaryTags || [])
                .map(t => '- ' + t.categoryId + ': ' + t.tagName)
                .join('\n') || 'No tags returned.';

              const transcript = creative.transcript || 'No transcript available.';
              const summary = creative.summary || 'No summary available.';
              const hook = transcript !== 'No transcript available.'
                ? transcript.split(/[.!?]/)[0]?.trim() || 'No hook extracted.'
                : (summary !== 'No summary available.' ? summary.slice(0, 150) : 'No hook available.');

              const decodedName = decoderExists
                ? 'See /agent/brain/ad-naming/naming-decoder.md for dimension definitions. Raw: ' + meta.adName
                : 'Install Ad Naming to enable ad name decoding.';

              const md = [
                '---',
                'id: ' + meta.id,
                'adName: ' + meta.adName,
                'id8: ' + id8,
                'format: ' + (meta.format || 'unknown'),
                'launchDate: ' + (meta.launchDate || 'unknown'),
                'campaignName: ' + (meta.campaignName || 'unknown'),
                'status: ' + (meta.status || 'unknown'),
                'spendState: ' + spendState,
                'indexedAt: $TODAY',
                '---',
                '',
                '# ' + meta.adName,
                '',
                '## Hook',
                hook,
                '',
                '## Transcript',
                transcript,
                '',
                '## Summary',
                summary,
                '',
                '## Glossary Tags',
                tags,
                '',
                '## Decoded Ad Name',
                decodedName,
              ].join('\n');

              fs.writeFileSync(filePath, md);
              built++;
            } catch (err) {
              console.error('Failed to write ' + meta.id + ': ' + err.message);
              failed++;
            }
          }

          console.log(JSON.stringify({ built, failed }));
        "
      `,
    });

    try {
      const result = JSON.parse(writeResult.stdout.trim());
      totalBuilt += result.built ?? 0;
      totalFailed += result.failed ?? 0;
    } catch {
      // Continue — partial batch
    }
  }

  // ─── Step 5: Update corpus state ──────────────────────────────────────────

  await task.bash({
    key: "update-corpus-state",
    script: `
      set -euo pipefail
      TODAY=$(node -e "console.log(new Date().toISOString().slice(0,10))")

      node -e "
        const fs = require('fs');
        let state = {};
        try { state = JSON.parse(fs.readFileSync('/agent/brain/meta/corpus-state.json', 'utf8')); } catch {}

        const files = fs.readdirSync('/agent/brain/meta/creatives')
          .filter(f => f.endsWith('.md') && f !== 'PLAYBOOK.md');

        state.totalCreatives = files.length;
        state.lastBuildDate = '$TODAY';
        fs.writeFileSync('/agent/brain/meta/corpus-state.json', JSON.stringify(state, null, 2));
        console.log(files.length + ' creatives indexed');
      "

      # Append to playbook build log
      TOTAL=$(node -e "
        const fs = require('fs');
        const s = JSON.parse(fs.readFileSync('/agent/brain/meta/corpus-state.json', 'utf8'));
        console.log(s.totalCreatives);
      ")
      echo "" >> /agent/brain/meta/creatives/PLAYBOOK.md
      echo "- $TODAY: Build run — \${TOTAL} total creatives indexed" >> /agent/brain/meta/creatives/PLAYBOOK.md
    `,
  });

  const buildDate = new Date().toISOString().slice(0, 10);

  return {
    totalBuilt,
    totalSkipped: manifest.toProcess - totalBuilt - totalFailed,
    totalFailed,
    batches: manifest.batchCount,
    buildDate,
  };
};
