#!/usr/bin/env node
/**
 * Creative Corpus Daily Refresh Script
 *
 * Script-mode routine: runs without an agent turn.
 * Exit 0 = success. Exit non-zero = failure (triggers agent fallback run).
 *
 * Motion CLI pattern:
 *   execFileSync returns the envelope JSON to stdout.
 *   Parse .file from the envelope, then read from that path.
 *   Never redirect the motion command itself.
 *
 * What it does:
 * 1. Pulls motion meta insights --date-range last_7d to find new/changed creatives.
 * 2. New IDs: fetch enrichment in batches of ≤15, write new corpus files.
 * 3. Existing IDs: update spendState + status in-place (no transcript re-pull).
 * 4. Updates corpus-state.json with new counts and lastRefreshDate.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const CORPUS_DIR = "/agent/brain/meta/creatives";
const STATE_FILE = "/agent/brain/meta/corpus-state.json";
const BATCH_SIZE = 15;
const ROUTINE_TRIGGER = process.env.ROUTINE_TRIGGER ?? "";

// ─── Test gate ───────────────────────────────────────────────────────────────
if (ROUTINE_TRIGGER === "test") {
  process.stderr.write("[test] corpus-refresh: would pull last_7d and update corpus\n");
  process.stderr.write("[test] corpus-refresh: skipping real Motion calls\n");
  process.exit(0);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function motionCall(args) {
  const envelopeStr = execFileSync("motion", args, { encoding: "utf8" });
  const envelope = JSON.parse(envelopeStr);
  if (!envelope.successful) {
    throw new Error("motion " + args[0] + " failed: " + (envelope.message || "unknown error"));
  }
  return envelope.file;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function corpusFilePath(adName, id) {
  const slug = (adName || "unknown").replace(/[^a-zA-Z0-9-_]/g, "-").slice(0, 80);
  const id8 = id.slice(0, 8);
  return join(CORPUS_DIR, `${slug}__${id8}.md`);
}

function updateSpendStateInFile(filePath, spendState, status) {
  if (!existsSync(filePath)) return;
  let content = readFileSync(filePath, "utf8");
  content = content.replace(/^spendState: .+$/m, `spendState: ${spendState}`);
  content = content.replace(/^status: .+$/m, `status: ${status}`);
  writeFileSync(filePath, content);
}

function readState() {
  try { return readJson(STATE_FILE); } catch { return {}; }
}

function writeState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

const today = new Date().toISOString().slice(0, 10);
const errors = [];
let newFilesWritten = 0;
let existingFilesUpdated = 0;

try {
  // Step 1: Pull last_7d roster
  process.stderr.write("[corpus-refresh] Pulling last_7d roster...\n");

  const rosterFile = motionCall([
    "meta", "insights",
    "--date-range", "last_7d",
    "--sort", "topSpend",
    "--include-metrics",
    "--limit", "500",
  ]);

  const rosterData = readJson(rosterFile);
  const creatives = (rosterData.creatives || []).map(c => ({
    id: c.id,
    adName: c.adName || "unknown",
    format: c.format || "unknown",
    status: c.status || "unknown",
    spend: c.metrics?.spend || 0,
  })).filter(c => c.id);

  process.stderr.write(`[corpus-refresh] Found ${creatives.length} creatives in last_7d\n`);

  // Step 2: Split new vs existing
  const newCreatives = [];
  const existingCreatives = [];

  for (const c of creatives) {
    if (existsSync(corpusFilePath(c.adName, c.id))) {
      existingCreatives.push(c);
    } else {
      newCreatives.push(c);
    }
  }

  process.stderr.write(`[corpus-refresh] New: ${newCreatives.length}, Existing: ${existingCreatives.length}\n`);

  // Step 3: Update spendState on existing files (no Motion calls needed)
  for (const c of existingCreatives) {
    const spendState = c.spend > 1000 ? "scaling" : c.spend > 0 ? "active" : "paused";
    updateSpendStateInFile(corpusFilePath(c.adName, c.id), spendState, c.status);
    existingFilesUpdated++;
  }

  // Step 4: Fetch enrichment for new creatives in batches of ≤15
  const decoderExists = existsSync("/agent/brain/ad-naming/naming-decoder.md");

  for (let i = 0; i < newCreatives.length; i += BATCH_SIZE) {
    const batch = newCreatives.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stderr.write(`[corpus-refresh] Enriching batch ${batchNum} (${batch.length} IDs)...\n`);

    try {
      const idFlags = batch.flatMap(c => ["--creative-asset-id", c.id]);

      const enrichFile = motionCall([
        "meta", "insights",
        "--scope", "creative-asset-id",
        ...idFlags,
        "--include-transcript",
        "--include-glossary",
        "--date-range", "last_365d",
        "--include-metrics",
      ]);

      const enrichData = readJson(enrichFile);
      const creativeMap = {};
      for (const c of (enrichData.creatives || [])) {
        if (c.id) creativeMap[c.id] = c;
      }

      for (const meta of batch) {
        try {
          const creative = creativeMap[meta.id] || {};
          const id8 = meta.id.slice(0, 8);
          const spendState = meta.spend > 1000 ? "scaling" : meta.spend > 0 ? "active" : "paused";

          const tags = (creative.glossaryTags || [])
            .map(t => `- ${t.categoryId}: ${t.tagName}`)
            .join("\n") || "No tags returned.";

          const transcript = creative.transcript || "No transcript available.";
          const summary = creative.summary || "No summary available.";
          const hook = transcript !== "No transcript available."
            ? (transcript.split(/[.!?]/)[0]?.trim() || "No hook extracted.")
            : (summary !== "No summary available." ? summary.slice(0, 150) : "No hook available.");

          const decodedName = decoderExists
            ? `See /agent/brain/ad-naming/naming-decoder.md for dimension definitions. Raw: ${meta.adName}`
            : "Install Ad Naming to enable ad name decoding.";

          const md = [
            "---",
            `id: ${meta.id}`,
            `adName: ${meta.adName}`,
            `id8: ${id8}`,
            `format: ${meta.format}`,
            `launchDate: ${creative.launchDate || "unknown"}`,
            `campaignName: ${creative.campaignName || "unknown"}`,
            `status: ${meta.status}`,
            `spendState: ${spendState}`,
            `indexedAt: ${today}`,
            "---",
            "",
            `# ${meta.adName}`,
            "",
            "## Hook",
            hook,
            "",
            "## Transcript",
            transcript,
            "",
            "## Summary",
            summary,
            "",
            "## Glossary Tags",
            tags,
            "",
            "## Decoded Ad Name",
            decodedName,
          ].join("\n");

          writeFileSync(corpusFilePath(meta.adName, meta.id), md);
          newFilesWritten++;
        } catch (creativeErr) {
          errors.push(`Failed to write ${meta.id}: ${creativeErr.message}`);
        }
      }
    } catch (batchErr) {
      errors.push(`Batch ${batchNum} failed: ${batchErr.message}`);
    }
  }

  // Step 5: Update corpus state
  const totalFiles = readdirSync(CORPUS_DIR)
    .filter(f => f.endsWith(".md") && f !== "PLAYBOOK.md").length;

  const state = readState();
  state.totalCreatives = totalFiles;
  state.lastRefreshDate = today;
  writeState(state);

  process.stderr.write(
    `[corpus-refresh] Done. New: ${newFilesWritten}, Updated: ${existingFilesUpdated}, Total: ${totalFiles}\n`
  );

  if (errors.length > 0) {
    process.stderr.write(`[corpus-refresh] ${errors.length} errors:\n${errors.join("\n")}\n`);
    process.exit(1);
  }

  process.exit(0);

} catch (topErr) {
  process.stderr.write(`[corpus-refresh] Fatal: ${topErr.message}\n`);
  process.exit(1);
}
