#!/usr/bin/env node
// sync-alyshas-skills.mjs
//
// Pulls the creative-strategy skill bodies from the upstream SOURCE OF TRUTH
// (Motion-Creative/alyshas-skills) into the two Runneth use-case packages that
// ship them (brand-audit, creative-deep-dive).
//
// Design contract
// ---------------
// - Alysha's repo is the canonical source for every skill BODY. Edit skills
//   there, then run this to refresh the packages. Do not hand-edit the bundled
//   copies under */skills/*.md.
// - Skill bodies must stay harness-neutral so they install and run in ANY org.
//   Runneth-specific behavior (per-workspace storage, INDEX wiring, continuity
//   rules, refresh routine) lives in the package layer: the orchestrator
//   SKILL.md, setup skill, install-config.json, and post-install-intro.md.
//   This script never touches that layer.
// - Portability guard is FAIL-CLOSED: if any upstream body still contains an
//   environment-specific tool name, the sync aborts and tells you to fix it
//   upstream. That keeps the source of truth honest instead of silently
//   diverging the packages from it.
//
// Usage
//   GITHUB_TOKEN=<token> node scripts/sync-alyshas-skills.mjs [--check]
//   --check  verify-only: report what would change and run the guard, write nothing.
//
// Exit codes: 0 ok / no changes, 1 guard failure or fetch error, 2 drift (with --check).

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const REPO = "Motion-Creative/alyshas-skills";
const REF = "main";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHECK_ONLY = process.argv.includes("--check");

// upstream skill folder -> package destination (relative to repo root)
const MAP = {
  // foundation -> brand-audit
  "brand-intake": "brand-audit/skills/brand-intake.md",
  "product-catalog": "brand-audit/skills/product-catalog.md",
  "review-audit": "brand-audit/skills/review-audit.md",
  "brand-relevant-keywords": "brand-audit/skills/brand-relevant-keywords.md",
  "competitor-analysis": "brand-audit/skills/competitor-analysis.md",
  "creative-strategy-engine": "brand-audit/skills/creative-strategy-engine.md",
  // execution + diagnostic -> creative-deep-dive
  "creative-analysis": "creative-deep-dive/skills/creative-analysis.md",
  "creative-mechanics": "creative-deep-dive/skills/creative-mechanics.md",
  "hook-analysis": "creative-deep-dive/skills/hook-analysis.md",
  "hook-evaluator": "creative-deep-dive/skills/hook-evaluator.md",
  "hook-tactics": "creative-deep-dive/skills/hook-tactics.md",
  "hook-voice-patterns": "creative-deep-dive/skills/hook-voice-patterns.md",
  "hook-writing": "creative-deep-dive/skills/hook-writing.md",
  "visual-formats": "creative-deep-dive/skills/visual-formats.md",
  "voice-copy-standards": "creative-deep-dive/skills/voice-copy-standards.md",
};

// environment-specific tool names that must never reach a portable body
const FORBIDDEN = [/\bweb_search\b/, /\bweb_fetch\b/, /\bpresent_files\b/];

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  console.error("Set GITHUB_TOKEN (or GH_TOKEN) to a PAT with read access to " + REPO);
  process.exit(1);
}

async function fetchBody(skill) {
  const url = `https://api.github.com/repos/${REPO}/contents/${skill}/SKILL.md?ref=${REF}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.raw+json",
      "User-Agent": "runneth-apps-sync",
    },
  });
  if (!res.ok) throw new Error(`fetch ${skill}: ${res.status} ${res.statusText}`);
  return await res.text();
}

const violations = [];
const changed = [];
let failed = false;

for (const [skill, dest] of Object.entries(MAP)) {
  let body;
  try {
    body = await fetchBody(skill);
  } catch (e) {
    console.error("ERROR " + e.message);
    failed = true;
    continue;
  }
  const hits = FORBIDDEN.filter((re) => re.test(body)).map((re) => String(re));
  if (hits.length) {
    violations.push(`${skill}: ${hits.join(", ")}`);
    continue; // never write a body that fails the portability guard
  }
  const destPath = join(ROOT, dest);
  const current = existsSync(destPath) ? readFileSync(destPath, "utf8") : null;
  if (current !== body) {
    changed.push(dest);
    if (!CHECK_ONLY) writeFileSync(destPath, body);
  }
}

if (violations.length) {
  console.error("\nPortability guard FAILED. Fix these upstream in " + REPO + " before syncing:");
  violations.forEach((v) => console.error("  - " + v));
  console.error("\nReplace environment-specific tool names with capability-neutral language.");
  process.exit(1);
}
if (failed) process.exit(1);

if (changed.length === 0) {
  console.log("Up to date. No package bodies changed.");
  process.exit(0);
}

console.log((CHECK_ONLY ? "Would update" : "Updated") + " " + changed.length + " file(s):");
changed.forEach((c) => console.log("  - " + c));
if (CHECK_ONLY) {
  console.log("\nDrift detected (run without --check to apply). Remember to bump the affected install-config.json version + changelog.");
  process.exit(2);
}
console.log("\nNext: bump version + changelog in the affected install-config.json, then open a PR.");
