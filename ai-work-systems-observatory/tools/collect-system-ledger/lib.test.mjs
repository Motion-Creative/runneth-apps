import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDiscoveryLedger,
  classifyInventoryEvidence,
  parseAppList,
  parsePackageList,
  parseRoutineList,
  parseTaskList,
  parseWorkflowList,
} from "./lib.mjs";
import { validateLedger } from "../validate-system-ledger/lib.mjs";

test("builds schema v2 discovery output without manufacturing systems", () => {
  const generatedAt = "2026-08-20T00:00:00.000Z";
  const output = buildDiscoveryLedger({
    generatedAt,
    sourceCoverage: [{ sourceId: "apps", available: true, readAt: generatedAt, rowsObserved: 1 }],
    inventory: { apps: [{ name: "One-time report", status: "ready", appId: "app-1" }] },
  });
  assert.equal(output.meta.mode, "discovery");
  assert.deepEqual(output.observedState.currentSystems, []);
  assert.equal(output.observedState.deliveredAssets.length, 1);
  assert.equal(output.observedState.deliveredAssets[0].lifecycle, "delivered-asset");
  assert.equal(validateLedger(output).valid, true);
});

test("classifies packages as capabilities and routines as recurring mechanisms", () => {
  const classified = classifyInventoryEvidence({
    packages: [{ id: "p-1", name: "Creator Intel", status: "installed" }],
    routines: [{ routineId: "r-1", name: "Daily review", status: "active", schedule: "daily" }],
  }, "2026-08-20T00:00:00.000Z");
  assert.equal(classified.capabilities[0].lifecycle, "available-capability");
  assert.equal(classified.recurringMechanisms[0].lifecycle, "recurring-mechanism");
  assert.ok(classified.recurringMechanisms[0].qualificationGaps.includes("observed consumption"));
});

test("parses compact routine output", () => {
  const rows = parseRoutineList(JSON.stringify({ data: { routines: [{ routineId: "r-1", name: "Weekly review", status: "active", mode: "agent", prompt: "must not be copied" }] } }));
  assert.deepEqual(rows, [{ routineId: "r-1", name: "Weekly review", status: "active", mode: "agent" }]);
});

test("parses task and workflow arrays without durable prompt bodies", () => {
  assert.deepEqual(parseTaskList('{"tasks":[{"id":"t-1","name":"Audit","kind":"agent","prompt":"secret"}]}'), [{ id: "t-1", name: "Audit", kind: "agent" }]);
  assert.deepEqual(parseWorkflowList('{"workflows":[{"id":"w-1","name":"Normalize","version":2,"source":"hidden"}]}'), [{ id: "w-1", name: "Normalize", version: 2 }]);
});

test("parses installed package source type", () => {
  assert.deepEqual(parsePackageList('{"packages":[{"id":"p-1","name":"Package","version":"1","source":{"type":"backend-github"}}]}'), [{ id: "p-1", name: "Package", version: "1", sourceType: "backend-github" }]);
});

test("parses tab-separated app output", () => {
  const rows = parseAppList("observatory\troute=/observatory\tstatus=ready\tappId=a-1\turl=https://example.test/observatory\n");
  assert.deepEqual(rows, [{ name: "observatory", route: "/observatory", status: "ready", appId: "a-1", url: "https://example.test/observatory" }]);
});
