import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  evaluateReadiness,
  parseMarkdownYaml,
  validateContract,
} from "../runtime/check.mjs";

const fixtures = path.resolve(import.meta.dirname, "fixtures");
const fixedTime = "2026-08-21T12:00:00.000Z";

const readJson = async (filePath) => JSON.parse(await readFile(filePath, "utf8"));

const evaluateFixture = async (root = fixtures) =>
  await evaluateReadiness({
    agentRoot: path.join(root, "agent"),
    contractsDir: path.join(root, "contracts"),
    evaluatedAt: fixedTime,
    workspaceInventory: await readJson(path.join(root, "workspaces.json")),
  });

test("fixture snapshot is stable and skips packages without contracts", async () => {
  const actual = await evaluateFixture();
  const expected = await readJson(path.join(fixtures, "expected-snapshot.json"));
  assert.deepEqual(actual, expected);
  assert.deepEqual(actual.packages.map(({ packageId }) => packageId), ["sample-onboarding"]);
});

test("workspace identity survives a renamed brain folder", async () => {
  const snapshot = await evaluateFixture();
  const acme = snapshot.packages[0].workspaces[0];
  assert.equal(acme.workspaceId, "workspace-1");
  assert.equal(acme.stageId, "validation-on");
  assert.equal(acme.ready, true);
  assert.equal(snapshot.packages[0].state, "partial");
});

test("confirmed count must match the actual confirmed statuses", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "package-readiness-"));
  await cp(fixtures, temporary, { recursive: true });
  const contextPath = path.join(
    temporary,
    "agent/brain/renamed-acme/data-sources/sample/context.md",
  );
  const content = await readFile(contextPath, "utf8");
  await writeFile(contextPath, content.replace("fields_confirmed: 1", "fields_confirmed: 2"));
  const snapshot = await evaluateFixture(temporary);
  const acme = snapshot.packages[0].workspaces[0];
  assert.equal(acme.stageId, "context-seeded");
  assert.equal(acme.state, "in_progress");
  assert.deepEqual(acme.checks[1], {
    id: "context-confirmed",
    reason: "assertion-failed",
    status: "failed",
  });
});

test("snapshot exposes reason codes but no paths or metadata values", async () => {
  const serialized = JSON.stringify(await evaluateFixture());
  assert.doesNotMatch(serialized, /renamed-acme/u);
  assert.doesNotMatch(serialized, /field_1/u);
  assert.doesNotMatch(serialized, /workspace_id/u);
  assert.doesNotMatch(serialized, /data-sources/u);
});

test("contract validation rejects path traversal and forward check references", () => {
  const base = {
    schemaVersion: 1,
    packageId: "unsafe-package",
    scope: "workspace",
    readyStage: "ready",
    stages: [{ id: "ready", label: "Ready", requires: ["unsafe-check"] }],
    checks: [
      {
        id: "unsafe-check",
        type: "markdown-yaml",
        source: { type: "glob", pattern: "../secrets.md" },
        assertions: [],
      },
    ],
  };
  assert.throws(() => validateContract(base), /must not traverse directories/u);
  assert.throws(
    () =>
      validateContract({
        ...base,
        checks: [
          {
            id: "unsafe-check",
            type: "markdown-yaml",
            source: { type: "check", checkId: "later-check" },
            assertions: [],
          },
          {
            id: "later-check",
            type: "markdown-yaml",
            source: { type: "glob", pattern: "brain/file.md" },
            assertions: [],
          },
        ],
      }),
    /must reference an earlier check/u,
  );
});

test("metadata parser uses the last fenced YAML block and preserves YAML 1.2 on", () => {
  assert.deepEqual(
    parseMarkdownYaml([
      "```yaml",
      "ignored: first",
      "```",
      "```yaml",
      "mvce_state: on",
      "nested:",
      "  value: 2 # comment",
      "```",
    ].join("\n")),
    { mvce_state: "on", nested: { value: 2 } },
  );
});
