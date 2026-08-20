#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  closeSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  parseAppList,
  parsePackageList,
  parseRoutineList,
  parseTaskList,
  parseWorkflowList,
} from "./lib.mjs";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const outPath = valueAfter("--out");
const timeoutMs = Number(valueAfter("--timeout-ms") ?? 60000);

if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120000) {
  console.error("--timeout-ms must be between 1000 and 120000");
  process.exit(2);
}

const sourceDefinitions = [
  { sourceId: "routines", command: "routine", args: ["list"], parse: parseRoutineList },
  { sourceId: "tasks", command: "task", args: ["list"], parse: parseTaskList },
  { sourceId: "workflows", command: "workflow", args: ["list"], parse: parseWorkflowList },
  { sourceId: "packages", command: "package", args: ["list"], parse: parsePackageList },
  { sourceId: "apps", command: "app", args: ["list"], parse: parseAppList },
];

const inventory = {};
const sourceCoverage = [];
const tempRoot = mkdtempSync(join(tmpdir(), "observatory-collector-"));

try {
  for (const source of sourceDefinitions) {
    const startedAt = new Date().toISOString();
    const stdoutFile = join(tempRoot, `${source.sourceId}.out`);
    const stdoutFd = openSync(stdoutFile, "w");
    let result;
    try {
      // File-backed stdout avoids truncation from CLIs that exit before a piped
      // stdout stream fully drains. The temporary files are removed below.
      result = spawnSync(source.command, source.args, {
        encoding: "utf8",
        timeout: timeoutMs,
        maxBuffer: 16 * 1024 * 1024,
        stdio: ["ignore", stdoutFd, "pipe"],
      });
    } finally {
      closeSync(stdoutFd);
    }

    const stdout = readFileSync(stdoutFile, "utf8");
    if (result.error || result.status !== 0) {
      const details = [
        result.error?.message,
        String(result.stderr || "").trim(),
        result.signal ? `signal ${result.signal}` : undefined,
        result.status !== null ? `exit ${result.status}` : undefined,
      ].filter(Boolean).join("; ");
      inventory[source.sourceId] = [];
      sourceCoverage.push({
        sourceId: source.sourceId,
        available: false,
        readAt: startedAt,
        rowsObserved: null,
        error: details || "Command failed",
      });
      continue;
    }

    try {
      const rows = source.parse(stdout);
      inventory[source.sourceId] = rows;
      sourceCoverage.push({
        sourceId: source.sourceId,
        available: true,
        readAt: startedAt,
        rowsObserved: rows.length,
        limitations: "Local inventory metadata only. Activity does not prove workflow value, use, or ownership.",
      });
    } catch (error) {
      inventory[source.sourceId] = [];
      sourceCoverage.push({
        sourceId: source.sourceId,
        available: false,
        readAt: startedAt,
        rowsObserved: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

sourceCoverage.push({
  sourceId: "team-members",
  available: false,
  readAt: new Date().toISOString(),
  rowsObserved: null,
  limitations: "The local collector cannot access live user management. The approved setup flow must retrieve it through the active runtime identity and user-management tools.",
});
sourceCoverage.push({
  sourceId: "conversations",
  available: false,
  readAt: new Date().toISOString(),
  rowsObserved: null,
  limitations: "Message bodies are excluded by default. Bounded metadata or corpus retrieval requires separate explicit approval.",
});

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  mode: "discovery",
  sourceCoverage,
  inventory,
  candidateWorkflows: [],
  unresolved: [],
  interpretationBoundary: "Inventory records are evidence inputs, not meaningful workflows. Workflow grouping, ownership, maturity, use, outcomes, and value require approved reconciliation and explicit evidence.",
};

const serialized = `${JSON.stringify(output, null, 2)}\n`;
if (outPath) {
  const absolute = resolve(outPath);
  mkdirSync(dirname(absolute), { recursive: true });
  writeFileSync(absolute, serialized, "utf8");
  process.stdout.write(`${JSON.stringify({ successful: true, file: absolute, sourceCount: sourceCoverage.length })}\n`);
} else {
  process.stdout.write(serialized);
}
