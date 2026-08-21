import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  evaluateReadiness,
  validateContract,
} from "../../package-readiness/runtime/check.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");
const contractPath = path.join(packageRoot, "readiness.json");
const workspaceInventory = {
  schemaVersion: 1,
  workspaces: [
    { id: "workspace-123", name: "New Brand Name", slug: "new-brand-name" },
  ],
};
const fixedTime = "2026-08-21T12:00:00.000Z";
const statusKeys = [
  "field_1_sources_of_truth",
  "field_2_conversion_events",
  "field_3_metric_gotchas",
  "field_4_naming_conventions",
  "field_5_attribution",
  "field_6_account_structure",
  "field_7_funnel_map",
  "field_8_creative_metrics",
  "field_9_targets_thresholds",
  "field_10_reporting",
];

const contextMarkdown = ({ confirmedFields, fieldsConfirmed }) => {
  const statuses = statusKeys.map((key, index) =>
    `  ${key}: ${index < confirmedFields ? "CONFIRMED" : "AUTO"}`,
  );
  return [
    "# Account Context",
    "",
    "## File metadata",
    "",
    "```yaml",
    "schema_version: 1",
    "workspace_id: workspace-123",
    `fields_confirmed: ${String(fieldsConfirmed)}`,
    "field_statuses:",
    ...statuses,
    "```",
    "",
  ].join("\n");
};

const prepareFixture = async ({
  confirmedFields = null,
  fieldsConfirmed = null,
  mvceState = null,
} = {}) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "meta-readiness-"));
  const contractsDir = path.join(root, "contracts");
  const agentRoot = path.join(root, "agent");
  await mkdir(contractsDir, { recursive: true });
  await cp(contractPath, path.join(contractsDir, "meta-and-voc-onboarding.json"));
  if (confirmedFields !== null && fieldsConfirmed !== null) {
    const metadataDir = path.join(
      agentRoot,
      "brain/old-brand-name/data-sources/meta",
    );
    await mkdir(metadataDir, { recursive: true });
    await writeFile(
      path.join(metadataDir, "account-context.md"),
      contextMarkdown({ confirmedFields, fieldsConfirmed }),
    );
    if (mvceState !== null) {
      await writeFile(
        path.join(metadataDir, "validation.md"),
        `# Validation\n\n\`\`\`yaml\nmvce_state: ${mvceState}\n\`\`\`\n`,
      );
    }
  }
  return { agentRoot, contractsDir };
};

const evaluate = async (fixture) => {
  const snapshot = await evaluateReadiness({
    ...fixture,
    evaluatedAt: fixedTime,
    workspaceInventory,
  });
  return snapshot.packages[0].workspaces[0];
};

test("contract makes account context confirmation the ready stage", async () => {
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  validateContract(contract);
  assert.equal(contract.readyStage, "account-context-confirmed");
  assert.deepEqual(
    contract.stages.map(({ id }) => id),
    ["context-seeded", "account-context-confirmed", "mvce-on"],
  );
  assert.ok(
    contract.checks
      .find(({ id }) => id === "account-context-confirmed")
      .assertions.every(({ key = "" }) => key !== "field_statuses.field_10_reporting"),
  );
});

test("missing account context needs setup", async () => {
  const result = await evaluate(await prepareFixture());
  assert.equal(result.state, "needs_setup");
  assert.equal(result.stageId, null);
  assert.equal(result.ready, false);
});

test("matching metadata in a renamed folder reaches context seeded", async () => {
  const result = await evaluate(
    await prepareFixture({ confirmedFields: 0, fieldsConfirmed: 0 }),
  );
  assert.equal(result.state, "in_progress");
  assert.equal(result.stageId, "context-seeded");
  assert.equal(result.ready, false);
});

test("fields one through nine confirm readiness while field ten remains AUTO", async () => {
  const result = await evaluate(
    await prepareFixture({ confirmedFields: 9, fieldsConfirmed: 9 }),
  );
  assert.equal(result.state, "ready");
  assert.equal(result.stageId, "account-context-confirmed");
  assert.equal(result.ready, true);
});

test("inconsistent fields_confirmed count does not reach readiness", async () => {
  const result = await evaluate(
    await prepareFixture({ confirmedFields: 9, fieldsConfirmed: 10 }),
  );
  assert.equal(result.state, "in_progress");
  assert.equal(result.stageId, "context-seeded");
  assert.deepEqual(result.checks[1], {
    id: "account-context-confirmed",
    reason: "assertion-failed",
    status: "failed",
  });
});

test("MVCE off remains ready at account context confirmed", async () => {
  const result = await evaluate(
    await prepareFixture({
      confirmedFields: 10,
      fieldsConfirmed: 10,
      mvceState: "off",
    }),
  );
  assert.equal(result.state, "ready");
  assert.equal(result.stageId, "account-context-confirmed");
});

test("canonical validation state advances the higher MVCE stage", async () => {
  const result = await evaluate(
    await prepareFixture({
      confirmedFields: 10,
      fieldsConfirmed: 10,
      mvceState: "on",
    }),
  );
  assert.equal(result.state, "ready");
  assert.equal(result.stageId, "mvce-on");
  assert.equal(result.stageLabel, "MVCE on");
});
