const EVIDENCE_STAGES = [
  "executed",
  "delivered",
  "consumed",
  "used",
  "outcome_linked",
  "validated_value",
];
const CONFIDENCE = new Set(["high", "medium", "low", "unresolved"]);
const FORBIDDEN_KEYS = new Set([
  "peopleLeaderboard",
  "personLeaderboard",
  "employeeRank",
  "productivityScore",
  "performanceScore",
]);
const VALUE_KEYS = new Set(["timeSaved", "roi", "validatedValue", "avoidedHiring", "capacityReclaimed"]);

function walk(node, path, visit) {
  if (Array.isArray(node)) {
    node.forEach((value, index) => walk(value, `${path}[${index}]`, visit));
    return;
  }
  if (!node || typeof node !== "object") return;
  for (const [key, value] of Object.entries(node)) {
    visit(key, value, path ? `${path}.${key}` : key, node);
    walk(value, path ? `${path}.${key}` : key, visit);
  }
}

function requireArray(ledger, key, errors) {
  if (!Array.isArray(ledger[key])) errors.push(`${key} must be an array`);
}

function uniqueIds(rows, key, errors) {
  const seen = new Set();
  rows.forEach((row, index) => {
    const id = row?.[key];
    if (typeof id !== "string" || !id.trim()) {
      errors.push(`${key} is required at index ${index}`);
      return;
    }
    if (seen.has(id)) errors.push(`duplicate ${key}: ${id}`);
    seen.add(id);
  });
  return seen;
}

export function validateLedger(ledger) {
  const errors = [];
  const warnings = [];
  if (!ledger || typeof ledger !== "object" || Array.isArray(ledger)) {
    return { valid: false, errors: ["ledger must be a JSON object"], warnings };
  }
  if (ledger.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!ledger.meta || typeof ledger.meta !== "object") errors.push("meta is required");
  if (ledger.meta && !["illustrative", "live", "discovery"].includes(ledger.meta.mode)) {
    errors.push("meta.mode must be illustrative, live, or discovery");
  }

  for (const key of [
    "sourceCoverage",
    "teams",
    "systems",
    "workflows",
    "risks",
    "decisions",
    "manualBaselines",
    "successContracts",
  ]) requireArray(ledger, key, errors);

  const systems = Array.isArray(ledger.systems) ? ledger.systems : [];
  const workflows = Array.isArray(ledger.workflows) ? ledger.workflows : [];
  const baselines = Array.isArray(ledger.manualBaselines) ? ledger.manualBaselines : [];
  const contracts = Array.isArray(ledger.successContracts) ? ledger.successContracts : [];
  const systemIds = uniqueIds(systems, "systemId", errors);
  uniqueIds(workflows, "workflowId", errors);
  const baselineIds = uniqueIds(baselines, "baselineId", errors);
  const contractIds = uniqueIds(contracts, "contractId", errors);

  systems.forEach((system) => {
    if (!Number.isInteger(system.maturityLevel) || system.maturityLevel < 0 || system.maturityLevel > 5) {
      errors.push(`system ${system.systemId ?? "unknown"} maturityLevel must be an integer from 0 to 5`);
    }
    if (!CONFIDENCE.has(system.confidence)) {
      errors.push(`system ${system.systemId ?? "unknown"} confidence is invalid`);
    }
    if (!system.lastConfirmedAt) warnings.push(`system ${system.systemId ?? "unknown"} has no lastConfirmedAt`);
  });

  workflows.forEach((workflow) => {
    if (workflow.systemId && !systemIds.has(workflow.systemId)) {
      errors.push(`workflow ${workflow.workflowId ?? "unknown"} references missing system ${workflow.systemId}`);
    }
    if (!EVIDENCE_STAGES.includes(workflow.evidenceStage)) {
      errors.push(`workflow ${workflow.workflowId ?? "unknown"} evidenceStage is invalid`);
    }
    if (!CONFIDENCE.has(workflow.evidenceConfidence)) {
      errors.push(`workflow ${workflow.workflowId ?? "unknown"} evidenceConfidence is invalid`);
    }
    if (workflow.successContractId && !contractIds.has(workflow.successContractId)) {
      errors.push(`workflow ${workflow.workflowId ?? "unknown"} references missing success contract ${workflow.successContractId}`);
    }
    if (workflow.manualBaselineId && !baselineIds.has(workflow.manualBaselineId)) {
      errors.push(`workflow ${workflow.workflowId ?? "unknown"} references missing manual baseline ${workflow.manualBaselineId}`);
    }
    if (workflow.evidenceStage === "validated_value" && !workflow.manualBaselineId) {
      errors.push(`workflow ${workflow.workflowId ?? "unknown"} claims validated value without a manualBaselineId`);
    }
  });

  walk(ledger, "", (key, value, path, parent) => {
    if (FORBIDDEN_KEYS.has(key)) errors.push(`${path} is not allowed`);
    if (VALUE_KEYS.has(key) && value !== null && value !== undefined && !parent.manualBaselineId) {
      errors.push(`${path} requires manualBaselineId`);
    }
  });

  const coverage = Array.isArray(ledger.sourceCoverage) ? ledger.sourceCoverage : [];
  coverage.forEach((source, index) => {
    if (!source?.sourceId) errors.push(`sourceCoverage[${index}].sourceId is required`);
    if (typeof source?.available !== "boolean") errors.push(`sourceCoverage[${index}].available must be boolean`);
    if (!source?.readAt) warnings.push(`sourceCoverage[${index}] has no readAt`);
  });

  return { valid: errors.length === 0, errors, warnings };
}
