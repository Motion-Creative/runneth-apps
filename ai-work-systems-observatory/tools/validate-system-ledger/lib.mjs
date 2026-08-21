const CONFIDENCE = new Set(["high", "medium", "low", "unresolved"]);
const HEALTH = new Set(["healthy", "watch", "failing", "unknown"]);
const FORBIDDEN_KEYS = new Set(["peopleLeaderboard", "personLeaderboard", "employeeRank", "productivityScore", "performanceScore"]);
const VALUE_KEYS = new Set(["timeSaved", "roi", "validatedValue", "avoidedHiring", "capacityReclaimed", "valueRealized"]);
const REQUIRED_REGRESSION = ["mondayChange", "rolesWorkingDifferently", "aiResponsibilities", "humanApprovals", "topThreeSystems", "supportingEvidence"];

function isObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function nonEmptyString(value) { return typeof value === "string" && value.trim().length > 0; }
function nonEmptyArray(value) { return Array.isArray(value) && value.length > 0; }

function walk(node, path, visit) {
  if (Array.isArray(node)) {
    node.forEach((value, index) => walk(value, `${path}[${index}]`, visit));
    return;
  }
  if (!isObject(node)) return;
  for (const [key, value] of Object.entries(node)) {
    const next = path ? `${path}.${key}` : key;
    visit(key, value, next, node);
    walk(value, next, visit);
  }
}

function requireArray(object, key, errors, prefix = "") {
  if (!Array.isArray(object?.[key])) errors.push(`${prefix}${key} must be an array`);
}

function uniqueIds(rows, key, errors, prefix = "") {
  const seen = new Set();
  (rows ?? []).forEach((row, index) => {
    const id = row?.[key];
    if (!nonEmptyString(id)) {
      errors.push(`${prefix}${key} is required at index ${index}`);
      return;
    }
    if (seen.has(id)) errors.push(`${prefix}duplicate ${key}: ${id}`);
    seen.add(id);
  });
  return seen;
}

function validateEvidenceRefs(refs, evidenceIds, path, errors, allowEmpty = false) {
  if (!Array.isArray(refs) || (!allowEmpty && refs.length === 0)) {
    errors.push(`${path} must contain evidence references`);
    return;
  }
  refs.forEach((ref) => {
    if (!evidenceIds.has(ref)) errors.push(`${path} references missing evidence ${ref}`);
  });
}

function validateCommonDocument(document, expectedType, errors) {
  if (document.schemaVersion !== 2) errors.push("schemaVersion must be 2");
  if (document.documentType !== expectedType) errors.push(`documentType must be ${expectedType}`);
  if (!isObject(document.meta)) errors.push("meta is required");
  if (!Array.isArray(document.limitations)) errors.push("limitations must be an array");
  walk(document, "", (key, value, path, parent) => {
    if (FORBIDDEN_KEYS.has(key)) errors.push(`${path} is not allowed`);
    if (VALUE_KEYS.has(key) && value !== null && value !== undefined) {
      const hasValidation = nonEmptyString(parent.manualBaselineId)
        || nonEmptyString(parent.outcomeSourceId)
        || nonEmptyArray(parent.validationEvidenceRefs);
      if (!hasValidation) errors.push(`${path} requires an approved manual baseline or validated outcome source`);
    }
  });
}

export function validateLedger(ledger) {
  const errors = [];
  const warnings = [];
  if (!isObject(ledger)) return { valid: false, errors: ["ledger must be a JSON object"], warnings };
  validateCommonDocument(ledger, "observed-state-ledger", errors);
  if (!isObject(ledger.observedState)) errors.push("observedState is required");
  for (const key of ["sourceCoverage", "evidence", "limitations", "unknowns"]) requireArray(ledger, key, errors);
  const state = isObject(ledger.observedState) ? ledger.observedState : {};
  for (const key of ["roles", "operatingRhythms", "handoffs", "decisions", "approvals", "outputs", "manualFriction", "currentSystems", "recurringMechanisms", "capabilities", "deliveredAssets", "incompleteSetups"]) requireArray(state, key, errors, "observedState.");

  const evidence = Array.isArray(ledger.evidence) ? ledger.evidence : [];
  const evidenceIds = uniqueIds(evidence, "evidenceId", errors, "evidence.");
  evidence.forEach((item, index) => {
    if (!nonEmptyString(item?.sourceId)) errors.push(`evidence[${index}].sourceId is required`);
    if (!nonEmptyString(item?.reference)) errors.push(`evidence[${index}].reference is required`);
    if (!CONFIDENCE.has(item?.confidence)) errors.push(`evidence[${index}].confidence is invalid`);
  });

  const currentSystems = Array.isArray(state.currentSystems) ? state.currentSystems : [];
  uniqueIds(currentSystems, "systemId", errors, "observedState.currentSystems.");
  currentSystems.forEach((system, index) => {
    const path = `observedState.currentSystems[${index}]`;
    if (system?.lifecycle !== "current-operating-system") errors.push(`${path}.lifecycle must be current-operating-system`);
    if (!nonEmptyString(system?.businessJob)) errors.push(`${path}.businessJob is required`);
    if (system?.owner?.status !== "confirmed") errors.push(`${path}.owner.status must be confirmed`);
    validateEvidenceRefs(system?.owner?.evidenceRefs, evidenceIds, `${path}.owner.evidenceRefs`, errors);
    if (!isObject(system?.trigger) || !nonEmptyString(system.trigger.type)) errors.push(`${path}.trigger is required`);
    if (!nonEmptyString(system?.trigger?.cadence) && !nonEmptyString(system?.trigger?.condition)) errors.push(`${path}.trigger requires cadence or condition`);
    validateEvidenceRefs(system?.trigger?.evidenceRefs, evidenceIds, `${path}.trigger.evidenceRefs`, errors);
    if (!nonEmptyArray(system?.inputs)) errors.push(`${path}.inputs must identify at least one input`);
    if (!nonEmptyString(system?.output?.artifact) || !nonEmptyString(system?.output?.audience) || !nonEmptyString(system?.output?.destination)) errors.push(`${path}.output requires artifact, audience, and destination`);
    if (system?.consumption?.status !== "observed") errors.push(`${path}.consumption.status must be observed`);
    validateEvidenceRefs(system?.consumption?.evidenceRefs, evidenceIds, `${path}.consumption.evidenceRefs`, errors);
    if (!HEALTH.has(system?.health?.status)) errors.push(`${path}.health.status is invalid`);
    if (!nonEmptyString(system?.health?.window?.start) || !nonEmptyString(system?.health?.window?.end)) errors.push(`${path}.health.window requires start and end`);
    validateEvidenceRefs(system?.health?.evidenceRefs, evidenceIds, `${path}.health.evidenceRefs`, errors);
    if (!nonEmptyString(system?.humanControl)) errors.push(`${path}.humanControl is required`);
    if (!CONFIDENCE.has(system?.confidence)) errors.push(`${path}.confidence is invalid`);
    if (!nonEmptyString(system?.lastConfirmedAt)) errors.push(`${path}.lastConfirmedAt is required`);
    validateEvidenceRefs(system?.evidenceRefs, evidenceIds, `${path}.evidenceRefs`, errors);
  });

  const lifecycleArrays = [
    [state.capabilities, "capabilityId", "available-capability", "capabilities"],
    [state.deliveredAssets, "assetId", "delivered-asset", "deliveredAssets"],
    [state.incompleteSetups, "setupId", "incomplete-setup", "incompleteSetups"],
    [state.recurringMechanisms, "mechanismId", "recurring-mechanism", "recurringMechanisms"],
  ];
  lifecycleArrays.forEach(([rows, idKey, lifecycle, name]) => {
    uniqueIds(Array.isArray(rows) ? rows : [], idKey, errors, `observedState.${name}.`);
    (Array.isArray(rows) ? rows : []).forEach((row, index) => {
      if (row?.lifecycle !== lifecycle) errors.push(`observedState.${name}[${index}].lifecycle must be ${lifecycle}`);
      validateEvidenceRefs(row?.evidenceRefs, evidenceIds, `observedState.${name}[${index}].evidenceRefs`, errors);
    });
  });

  if (!isObject(ledger.adoptionDefinition)) {
    errors.push("adoptionDefinition is required");
  } else {
    const adoption = ledger.adoptionDefinition;
    if (adoption.name !== "qualified-system consumption coverage") errors.push("adoptionDefinition.name must be qualified-system consumption coverage");
    if (!nonEmptyString(adoption.population) || !nonEmptyString(adoption.rule)) errors.push("adoptionDefinition requires population and rule");
    if (!Number.isInteger(adoption.numerator) || adoption.numerator < 0) errors.push("adoptionDefinition.numerator must be a non-negative integer");
    if (!Number.isInteger(adoption.denominator) || adoption.denominator < 0) errors.push("adoptionDefinition.denominator must be a non-negative integer");
    if (Number.isInteger(adoption.denominator) && adoption.denominator !== currentSystems.length) errors.push("adoptionDefinition.denominator must equal qualified current-system count");
    if (adoption.numerator > adoption.denominator) errors.push("adoptionDefinition.numerator cannot exceed denominator");
    validateEvidenceRefs(adoption.evidenceRefs, evidenceIds, "adoptionDefinition.evidenceRefs", errors, currentSystems.length === 0);
  }

  const coverage = Array.isArray(ledger.sourceCoverage) ? ledger.sourceCoverage : [];
  coverage.forEach((source, index) => {
    if (!nonEmptyString(source?.sourceId)) errors.push(`sourceCoverage[${index}].sourceId is required`);
    if (typeof source?.available !== "boolean") errors.push(`sourceCoverage[${index}].available must be boolean`);
    if (!nonEmptyString(source?.readAt)) warnings.push(`sourceCoverage[${index}] has no readAt`);
  });
  return { valid: errors.length === 0, errors, warnings };
}

export function validateOperatingModel(model) {
  const errors = [];
  const warnings = [];
  if (!isObject(model)) return { valid: false, errors: ["operating model must be a JSON object"], warnings };
  validateCommonDocument(model, "proposed-operating-model", errors);
  if (!isObject(model.executiveThesis)) errors.push("executiveThesis is required");
  if (!isObject(model.synthesis)) errors.push("synthesis is required");
  for (const key of ["manualCoordination", "decisionsPrepared", "continuouslyUpdatedOutputs", "mandatoryHumanJudgment", "highestCapacityUnlock", "mondayChange"]) {
    if (!nonEmptyString(model.synthesis?.[key]) && !nonEmptyArray(model.synthesis?.[key])) errors.push(`synthesis.${key} is required`);
  }
  for (const key of ["proposedSystems", "roleChanges", "weeklyCadence", "opportunities", "buildSequence", "limitations"]) requireArray(model, key, errors);
  const proposed = Array.isArray(model.proposedSystems) ? model.proposedSystems : [];
  if (proposed.length < 3 || proposed.length > 5) errors.push("proposedSystems must contain 3 to 5 recommendations");
  uniqueIds(proposed, "systemId", errors, "proposedSystems.");
  proposed.forEach((system, index) => {
    const path = `proposedSystems[${index}]`;
    if (system?.status !== "proposed" || system?.layer !== "proposed") errors.push(`${path} must be labeled proposed`);
    for (const key of ["name", "currentGap", "trigger", "aiRole", "humanRole", "output", "destination", "ownerRecommendation", "successSignal", "rationale"]) {
      if (!nonEmptyString(system?.[key])) errors.push(`${path}.${key} is required`);
    }
    if (!nonEmptyArray(system?.evidenceRefs) && !nonEmptyString(system?.hypothesis)) errors.push(`${path} requires evidenceRefs or an explicit hypothesis`);
  });
  const opportunities = Array.isArray(model.opportunities) ? model.opportunities : [];
  const ranks = opportunities.map((item) => item?.rank).filter(Number.isInteger);
  if (!ranks.includes(1) || !ranks.includes(2) || !ranks.includes(3)) errors.push("opportunities must include ranks 1, 2, and 3");
  return { valid: errors.length === 0, errors, warnings };
}

export function validateReport(report) {
  const errors = [];
  const warnings = [];
  if (!isObject(report)) return { valid: false, errors: ["report must be a JSON object"], warnings };
  validateCommonDocument(report, "executive-operating-report", errors);
  for (const key of ["executiveThesis", "currentOperatingModel", "currentSystems", "futureOperatingModel", "roleAndRhythmChanges", "opportunityPortfolio", "evidenceGovernance", "regressionAnswers"]) {
    if (!isObject(report[key])) errors.push(`${key} is required`);
  }
  if (!Array.isArray(report.headlineMetrics) || report.headlineMetrics.length < 2 || report.headlineMetrics.length > 4) errors.push("headlineMetrics must contain 2 to 4 items");
  const current = report.currentSystems?.systems;
  if (!Array.isArray(current)) errors.push("currentSystems.systems must be an array");
  (Array.isArray(current) ? current : []).forEach((system, index) => {
    if (system?.layer !== "observed" || system?.lifecycle !== "current-operating-system") errors.push(`currentSystems.systems[${index}] must be an observed current operating system`);
    if (!nonEmptyArray(system?.evidenceRefs)) errors.push(`currentSystems.systems[${index}] requires evidenceRefs`);
    if (!nonEmptyString(system?.healthWindow)) errors.push(`currentSystems.systems[${index}] requires healthWindow`);
  });
  const proposed = report.futureOperatingModel?.systems;
  if (!Array.isArray(proposed) || proposed.length < 3 || proposed.length > 5) errors.push("futureOperatingModel.systems must contain 3 to 5 proposed systems");
  (Array.isArray(proposed) ? proposed : []).forEach((system, index) => {
    if (system?.layer !== "proposed" || system?.status !== "proposed") errors.push(`futureOperatingModel.systems[${index}] must be labeled proposed`);
    if (!nonEmptyArray(system?.evidenceRefs) && !nonEmptyString(system?.hypothesis)) errors.push(`futureOperatingModel.systems[${index}] requires evidenceRefs or hypothesis`);
  });
  for (const key of REQUIRED_REGRESSION) {
    const value = report.regressionAnswers?.[key];
    if (!nonEmptyString(value) && !nonEmptyArray(value)) errors.push(`regressionAnswers.${key} is required`);
  }
  if (!Array.isArray(report.evidenceGovernance?.observedClaims)) errors.push("evidenceGovernance.observedClaims must be an array");
  (report.evidenceGovernance?.observedClaims ?? []).forEach((claim, index) => {
    if (claim?.type !== "fact" && claim?.type !== "inference" && claim?.type !== "unknown") errors.push(`evidenceGovernance.observedClaims[${index}].type is invalid`);
    if (claim?.type === "fact" && !nonEmptyArray(claim?.evidenceRefs)) errors.push(`evidenceGovernance.observedClaims[${index}] fact requires evidenceRefs`);
  });
  if (!Array.isArray(report.evidenceGovernance?.recommendations)) errors.push("evidenceGovernance.recommendations must be an array");
  (report.evidenceGovernance?.recommendations ?? []).forEach((claim, index) => {
    if (claim?.type !== "recommendation") errors.push(`evidenceGovernance.recommendations[${index}].type must be recommendation`);
  });
  return { valid: errors.length === 0, errors, warnings };
}

export function validateDocument(document) {
  if (document?.documentType === "observed-state-ledger") return validateLedger(document);
  if (document?.documentType === "proposed-operating-model") return validateOperatingModel(document);
  if (document?.documentType === "executive-operating-report") return validateReport(document);
  return { valid: false, errors: ["Unknown documentType"], warnings: [] };
}
