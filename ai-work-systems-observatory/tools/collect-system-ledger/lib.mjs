const NON_EMPTY = (value) => value !== undefined && value !== null && value !== "";
const toId = (value) => String(value ?? "unknown")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "") || "unknown";

export function compactRecord(record, keys) {
  const output = {};
  for (const key of keys) {
    if (NON_EMPTY(record?.[key])) output[key] = record[key];
  }
  return output;
}

function inventoryId(sourceId, row, index) {
  return row?.routineId ?? row?.taskId ?? row?.workflowId ?? row?.appId ?? row?.id ?? row?.name ?? `${sourceId}-${index + 1}`;
}

function inventoryName(sourceId, row, index) {
  return String(row?.name ?? inventoryId(sourceId, row, index));
}

export function classifyInventoryEvidence(inventory = {}, generatedAt) {
  const evidence = [];
  const capabilities = [];
  const deliveredAssets = [];
  const recurringMechanisms = [];
  const incompleteSetups = [];

  for (const [sourceId, rows] of Object.entries(inventory)) {
    if (!Array.isArray(rows)) continue;
    rows.forEach((row, index) => {
      const rawId = inventoryId(sourceId, row, index);
      const name = inventoryName(sourceId, row, index);
      const evidenceId = `evidence-${toId(sourceId)}-${toId(rawId)}`;
      evidence.push({
        evidenceId,
        sourceId,
        kind: "inventory-metadata",
        observedAt: generatedAt,
        summary: `${name} was present in the ${sourceId} inventory.`,
        reference: `local-inventory:${sourceId}:${rawId}`,
        confidence: "high",
      });

      const status = String(row?.status ?? "unknown").toLowerCase();
      if (sourceId === "packages") {
        capabilities.push({
          capabilityId: `capability-${toId(rawId)}`,
          name,
          lifecycle: "available-capability",
          availabilityStatus: status,
          sourceType: row?.sourceType ?? "package",
          evidenceRefs: [evidenceId],
          qualificationNote: "Installation proves availability only. Setup, ownership, output, consumption, and value remain unverified.",
        });
      } else if (sourceId === "apps") {
        deliveredAssets.push({
          assetId: `asset-${toId(rawId)}`,
          name,
          lifecycle: "delivered-asset",
          deliveryStatus: status,
          route: row?.route,
          audience: "unknown",
          consumptionStatus: "unknown",
          evidenceRefs: [evidenceId],
          qualificationNote: "A ready app is a delivered asset until audience consumption or downstream use is observed.",
        });
      } else if (["routines", "tasks", "workflows"].includes(sourceId)) {
        recurringMechanisms.push({
          mechanismId: `mechanism-${toId(sourceId)}-${toId(rawId)}`,
          name,
          lifecycle: "recurring-mechanism",
          mechanismType: sourceId.slice(0, -1),
          status,
          triggerHint: row?.schedule ?? "unknown",
          evidenceRefs: [evidenceId],
          qualificationGaps: [
            "business job",
            "directly confirmed owner",
            "output and audience",
            "observed consumption",
            "run-health assessment window",
            "human control",
          ],
        });
      }

      if (["incomplete", "pending_setup", "setup_required", "needs_setup"].includes(status)) {
        incompleteSetups.push({
          setupId: `setup-${toId(sourceId)}-${toId(rawId)}`,
          name,
          lifecycle: "incomplete-setup",
          sourceId,
          status,
          missing: ["completed configuration", "confirmed usable output"],
          evidenceRefs: [evidenceId],
        });
      }
    });
  }

  return { evidence, capabilities, deliveredAssets, recurringMechanisms, incompleteSetups };
}

export function buildDiscoveryLedger({ generatedAt, sourceCoverage, inventory }) {
  const classified = classifyInventoryEvidence(inventory, generatedAt);
  return {
    schemaVersion: 2,
    documentType: "observed-state-ledger",
    generatedAt,
    meta: {
      mode: "discovery",
      generatedAt,
      organizationName: "Unresolved organization",
      scope: "Approved local inventory only",
      interpretationBoundary: "Inventory records are evidence inputs. They do not prove a business job, confirmed owner, consumption, health, adoption, outcome, or value.",
    },
    sourceCoverage,
    evidence: classified.evidence,
    observedState: {
      roles: [],
      operatingRhythms: [],
      handoffs: [],
      decisions: [],
      approvals: [],
      outputs: [],
      manualFriction: [],
      currentSystems: [],
      recurringMechanisms: classified.recurringMechanisms,
      capabilities: classified.capabilities,
      deliveredAssets: classified.deliveredAssets,
      incompleteSetups: classified.incompleteSetups,
    },
    adoptionDefinition: {
      name: "qualified-system consumption coverage",
      unit: "systems",
      population: "qualified current operating systems in the approved scope",
      rule: "A qualified system counts as adopted only when repeat consumption, approval, action, or downstream reliance is observed.",
      numerator: 0,
      denominator: 0,
      evidenceRefs: [],
      status: "not-computable-until-systems-qualify",
    },
    discoveryRequests: [
      { field: "roles-and-responsibilities", action: "Use approved team sources and bounded conversation search." },
      { field: "recurring-decisions-and-rhythms", action: "Find scheduled reviews, meetings, handoffs, and decision outputs." },
      { field: "ownership", action: "Require direct confirmation evidence before marking an owner confirmed." },
      { field: "consumption", action: "Find evidence that intended audiences reviewed, approved, acted on, or repeatedly used outputs." },
      { field: "run-health", action: "Read run history and record a visible assessment window." },
    ],
    limitations: [
      "The deterministic collector reads inventory metadata only.",
      "Message bodies, external outcomes, team structure, and run histories require separately approved retrieval.",
    ],
    unknowns: [
      "Which recurring mechanisms support a real business job?",
      "Who directly owns each mechanism?",
      "Which outputs are consumed or used?",
      "What run-history window supports health?",
    ],
    inventory,
  };
}

export function parseJsonSource(text) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) throw new Error("Command returned no output");
  return JSON.parse(trimmed);
}

export function parseRoutineList(text) {
  const payload = parseJsonSource(text);
  const rows = Array.isArray(payload?.data?.routines) ? payload.data.routines : [];
  return rows.map((row) => compactRecord(row, [
    "routineId", "name", "status", "mode", "schedule", "timezone", "nextRunAt", "failStreak",
  ]));
}

export function parseTaskList(text) {
  const payload = parseJsonSource(text);
  const rows = Array.isArray(payload?.tasks) ? payload.tasks : [];
  return rows.map((row) => compactRecord(row, [
    "id", "taskId", "name", "kind", "status", "createdAt", "updatedAt",
  ]));
}

export function parseWorkflowList(text) {
  const payload = parseJsonSource(text);
  const rows = Array.isArray(payload?.workflows) ? payload.workflows : [];
  return rows.map((row) => compactRecord(row, [
    "id", "workflowId", "name", "status", "version", "createdAt", "updatedAt",
  ]));
}

export function parsePackageList(text) {
  const payload = parseJsonSource(text);
  const rows = Array.isArray(payload?.packages) ? payload.packages : [];
  return rows.map((row) => {
    const record = compactRecord(row, ["id", "name", "version", "status", "installedAt", "updatedAt"]);
    if (NON_EMPTY(row?.source?.type)) record.sourceType = row.source.type;
    return record;
  });
}

export function parseAppList(text) {
  const lines = String(text ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.map((line) => {
    const [name, ...fields] = line.split("\t");
    const row = { name };
    for (const field of fields) {
      const separator = field.indexOf("=");
      if (separator < 1) continue;
      const key = field.slice(0, separator);
      const value = field.slice(separator + 1);
      if (NON_EMPTY(value)) row[key] = value;
    }
    return row;
  });
}
