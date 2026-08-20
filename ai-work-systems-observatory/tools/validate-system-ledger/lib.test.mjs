import test from "node:test";
import assert from "node:assert/strict";
import { validateLedger } from "./lib.mjs";

const validLedger = {
  schemaVersion: 1,
  meta: { mode: "illustrative", organizationName: "Illustrative organization" },
  sourceCoverage: [{ sourceId: "apps", available: true, readAt: "2026-08-20T00:00:00.000Z" }],
  teams: [],
  systems: [{
    systemId: "system-1",
    name: "Weekly operating review",
    maturityLevel: 3,
    confidence: "medium",
    lastConfirmedAt: "2026-08-20T00:00:00.000Z",
  }],
  workflows: [{
    workflowId: "workflow-1",
    systemId: "system-1",
    name: "Compile review",
    evidenceStage: "delivered",
    evidenceConfidence: "medium",
  }],
  risks: [],
  decisions: [],
  manualBaselines: [],
  successContracts: [],
};

test("accepts a governed illustrative ledger", () => {
  assert.equal(validateLedger(validLedger).valid, true);
});

test("rejects value claims without a baseline", () => {
  const ledger = structuredClone(validLedger);
  ledger.workflows[0].evidenceStage = "validated_value";
  ledger.workflows[0].timeSaved = 8;
  const result = validateLedger(ledger);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /manualBaselineId/);
});

test("rejects people performance leaderboards", () => {
  const ledger = structuredClone(validLedger);
  ledger.peopleLeaderboard = [];
  const result = validateLedger(ledger);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /peopleLeaderboard/);
});
