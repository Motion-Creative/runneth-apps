const NON_EMPTY = (value) => value !== undefined && value !== null && value !== "";

export function compactRecord(record, keys) {
  const output = {};
  for (const key of keys) {
    if (NON_EMPTY(record?.[key])) output[key] = record[key];
  }
  return output;
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
    "routineId",
    "name",
    "status",
    "mode",
    "schedule",
    "timezone",
    "nextRunAt",
    "failStreak",
  ]));
}

export function parseTaskList(text) {
  const payload = parseJsonSource(text);
  const rows = Array.isArray(payload?.tasks) ? payload.tasks : [];
  return rows.map((row) => compactRecord(row, [
    "id",
    "taskId",
    "name",
    "kind",
    "status",
    "createdAt",
    "updatedAt",
  ]));
}

export function parseWorkflowList(text) {
  const payload = parseJsonSource(text);
  const rows = Array.isArray(payload?.workflows) ? payload.workflows : [];
  return rows.map((row) => compactRecord(row, [
    "id",
    "workflowId",
    "name",
    "status",
    "version",
    "createdAt",
    "updatedAt",
  ]));
}

export function parsePackageList(text) {
  const payload = parseJsonSource(text);
  const rows = Array.isArray(payload?.packages) ? payload.packages : [];
  return rows.map((row) => {
    const record = compactRecord(row, [
      "id",
      "name",
      "version",
      "status",
      "installedAt",
      "updatedAt",
    ]);
    if (NON_EMPTY(row?.source?.type)) record.sourceType = row.source.type;
    return record;
  });
}

export function parseAppList(text) {
  const lines = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

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
