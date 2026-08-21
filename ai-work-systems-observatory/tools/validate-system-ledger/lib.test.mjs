import test from "node:test";
import assert from "node:assert/strict";
import { validateLedger, validateOperatingModel, validateReport } from "./lib.mjs";

const evidence = [
  { evidenceId: "e-owner", sourceId: "approval", kind: "direct-confirmation", observedAt: "2026-08-20T00:00:00.000Z", reference: "conversation:1", confidence: "high" },
  { evidenceId: "e-run", sourceId: "routine-history", kind: "run-history", observedAt: "2026-08-20T00:00:00.000Z", reference: "routine:r-1", confidence: "high" },
  { evidenceId: "e-use", sourceId: "delivery", kind: "consumption", observedAt: "2026-08-20T00:00:00.000Z", reference: "thread:1", confidence: "medium" },
];
const validLedger = {
  schemaVersion: 2,
  documentType: "observed-state-ledger",
  meta: { mode: "illustrative", organizationName: "Illustrative organization" },
  sourceCoverage: [{ sourceId: "apps", available: true, readAt: "2026-08-20T00:00:00.000Z" }],
  evidence,
  observedState: {
    roles: [], operatingRhythms: [], handoffs: [], decisions: [], approvals: [], outputs: [], manualFriction: [],
    currentSystems: [{
      systemId: "system-1", name: "Weekly review", lifecycle: "current-operating-system", businessJob: "Prepare the weekly decision", owner: { status: "confirmed", label: "Growth lead", evidenceRefs: ["e-owner"] },
      trigger: { type: "schedule", cadence: "Weekly", evidenceRefs: ["e-run"] }, inputs: ["Performance evidence"],
      output: { artifact: "Decision brief", audience: "Growth team", destination: "Weekly review" },
      consumption: { status: "observed", description: "Reviewed weekly", evidenceRefs: ["e-use"] },
      health: { status: "healthy", window: { start: "2026-08-01", end: "2026-08-20" }, successfulRuns: 3, failedRuns: 0, evidenceRefs: ["e-run"] },
      humanControl: "Growth lead approves actions", confidence: "high", lastConfirmedAt: "2026-08-20T00:00:00.000Z", evidenceRefs: ["e-owner", "e-run", "e-use"],
    }],
    recurringMechanisms: [], capabilities: [], deliveredAssets: [], incompleteSetups: [],
  },
  adoptionDefinition: { name: "qualified-system consumption coverage", unit: "systems", population: "qualified systems", rule: "Repeat consumption observed", numerator: 1, denominator: 1, evidenceRefs: ["e-use"] },
  limitations: [], unknowns: [],
};

test("accepts a fully qualified current system", () => assert.equal(validateLedger(validLedger).valid, true));
test("rejects a current system without consumption evidence", () => {
  const ledger = structuredClone(validLedger); ledger.observedState.currentSystems[0].consumption = { status: "unknown", evidenceRefs: [] };
  assert.match(validateLedger(ledger).errors.join("\n"), /consumption/);
});
test("rejects inferred ownership as confirmed system qualification", () => {
  const ledger = structuredClone(validLedger); ledger.observedState.currentSystems[0].owner.status = "inferred";
  assert.match(validateLedger(ledger).errors.join("\n"), /owner.status/);
});
test("rejects installed packages promoted into current systems", () => {
  const ledger = structuredClone(validLedger); ledger.observedState.currentSystems[0].lifecycle = "available-capability";
  assert.match(validateLedger(ledger).errors.join("\n"), /current-operating-system/);
});
test("rejects value claims without validated evidence", () => {
  const ledger = structuredClone(validLedger); ledger.observedState.currentSystems[0].timeSaved = 8;
  assert.match(validateLedger(ledger).errors.join("\n"), /manual baseline/);
});
test("rejects people performance leaderboards", () => {
  const ledger = structuredClone(validLedger); ledger.peopleLeaderboard = [];
  assert.match(validateLedger(ledger).errors.join("\n"), /peopleLeaderboard/);
});

const validModel = {
  schemaVersion: 2, documentType: "proposed-operating-model", meta: { mode: "illustrative" },
  executiveThesis: { headline: "Systemize decision preparation" },
  synthesis: { manualCoordination: "Brief assembly", decisionsPrepared: ["Weekly priorities"], continuouslyUpdatedOutputs: ["Decision brief"], mandatoryHumanJudgment: ["Approval"], highestCapacityUnlock: "Weekly system", mondayChange: "The brief arrives before the meeting" },
  proposedSystems: [1,2,3].map((rank) => ({ systemId: `p-${rank}`, name: `System ${rank}`, status: "proposed", layer: "proposed", currentGap: "Manual coordination", trigger: "Weekly", aiRole: "Prepare evidence", humanRole: "Approve", output: "Decision brief", destination: "Review", ownerRecommendation: "Team lead", successSignal: "Repeated use", rationale: "Recurring decision", evidenceRefs: ["e-use"] })),
  roleChanges: [], weeklyCadence: [], opportunities: [1,2,3].map((rank) => ({ rank, title: `Opportunity ${rank}` })), buildSequence: [], limitations: [],
};
test("accepts a labeled proposed operating model", () => assert.equal(validateOperatingModel(validModel).valid, true));
test("rejects a proposed system presented as current", () => { const model = structuredClone(validModel); model.proposedSystems[0].status = "current"; assert.match(validateOperatingModel(model).errors.join("\n"), /labeled proposed/); });

const validReport = {
  schemaVersion: 2, documentType: "executive-operating-report", meta: { mode: "illustrative" }, limitations: [],
  executiveThesis: {}, headlineMetrics: [{ value: "1", label: "Qualified system" }, { value: "3", label: "Proposed systems" }],
  currentOperatingModel: {}, currentSystems: { systems: [{ layer: "observed", lifecycle: "current-operating-system", evidenceRefs: ["e-run"], healthWindow: "Aug 1 to 20" }] },
  futureOperatingModel: { systems: [1,2,3].map((rank) => ({ layer: "proposed", status: "proposed", evidenceRefs: ["e-use"], rank })) },
  roleAndRhythmChanges: {}, opportunityPortfolio: {},
  evidenceGovernance: { observedClaims: [{ type: "fact", evidenceRefs: ["e-run"] }], recommendations: [{ type: "recommendation" }] },
  regressionAnswers: { mondayChange: "A brief arrives", rolesWorkingDifferently: "Leads approve", aiResponsibilities: "AI prepares evidence", humanApprovals: "Humans decide", topThreeSystems: ["One", "Two", "Three"], supportingEvidence: "Run and use evidence" },
};
test("accepts a report with visible current and proposed layers", () => assert.equal(validateReport(validReport).valid, true));
test("rejects a report missing Monday change", () => { const report = structuredClone(validReport); report.regressionAnswers.mondayChange = ""; assert.match(validateReport(report).errors.join("\n"), /mondayChange/); });
