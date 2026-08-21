#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const EVALUATOR_ID = "package-readiness";
const EVALUATOR_VERSION = "1";
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/u;
const TEMPLATE_PATTERN = /\$\{workspace\.(id|name|slug)\}/gu;
const MAX_CONTRACT_BYTES = 256 * 1024;
const MAX_CONTRACTS = 1_000;
const MAX_CANDIDATES_PER_CHECK = 1_000;
const MAX_METADATA_FILE_BYTES = 1024 * 1024;

const isRecord = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertKeys = (value, expected, label) => {
  const actual = Object.keys(value).sort();
  assert(
    JSON.stringify(actual) === JSON.stringify([...expected].sort()),
    `${label} has unexpected keys: ${JSON.stringify(actual)}`,
  );
};

const assertId = (value, label) => {
  assert(typeof value === "string" && ID_PATTERN.test(value), `${label} must be a kebab-case id`);
};

const assertNonEmptyString = (value, label) => {
  assert(typeof value === "string" && value.trim().length > 0, `${label} must be a non-empty string`);
};

const assertScalar = (value, label) => {
  assert(
    value === null || ["string", "number", "boolean"].includes(typeof value),
    `${label} must be a JSON scalar`,
  );
};

const assertSafeRelativePath = (value, label, allowWildcard) => {
  assertNonEmptyString(value, label);
  assert(!path.isAbsolute(value), `${label} must be relative to the agent root`);
  const segments = value.split("/");
  assert(segments.every((segment) => segment.length > 0), `${label} must not contain empty segments`);
  assert(segments.every((segment) => segment !== "." && segment !== ".."), `${label} must not traverse directories`);
  for (const segment of segments) {
    if (segment === "*" && allowWildcard) {
      continue;
    }
    assert(!segment.includes("*") && !segment.includes("?") && !segment.includes("["), `${label} contains an unsupported wildcard`);
  }
  assert(
    !allowWildcard || segments.filter((segment) => segment === "*").length <= 1,
    `${label} may contain at most one wildcard segment`,
  );
};

const validateSource = (source, priorCheckIds, label) => {
  assert(isRecord(source), `${label} must be an object`);
  if (source.type === "glob") {
    const keys = source.identity === undefined ? ["pattern", "type"] : ["identity", "pattern", "type"];
    assertKeys(source, keys, label);
    assertSafeRelativePath(source.pattern, `${label}.pattern`, true);
    if (source.identity !== undefined) {
      assert(isRecord(source.identity), `${label}.identity must be an object`);
      assertKeys(source.identity, ["equals", "key"], `${label}.identity`);
      assertNonEmptyString(source.identity.key, `${label}.identity.key`);
      assertScalar(source.identity.equals, `${label}.identity.equals`);
    }
    return;
  }
  if (source.type === "check") {
    assertKeys(source, ["checkId", "type"], label);
    assertId(source.checkId, `${label}.checkId`);
    assert(priorCheckIds.has(source.checkId), `${label}.checkId must reference an earlier check`);
    return;
  }
  if (source.type === "sibling") {
    assertKeys(source, ["checkId", "path", "type"], label);
    assertId(source.checkId, `${label}.checkId`);
    assert(priorCheckIds.has(source.checkId), `${label}.checkId must reference an earlier check`);
    assertSafeRelativePath(source.path, `${label}.path`, false);
    return;
  }
  throw new Error(`${label}.type is unsupported`);
};

const validateAssertion = (assertion, label) => {
  assert(isRecord(assertion), `${label} must be an object`);
  if (assertion.type === "equals") {
    assertKeys(assertion, ["key", "type", "value"], label);
    assertNonEmptyString(assertion.key, `${label}.key`);
    assertScalar(assertion.value, `${label}.value`);
    return;
  }
  if (assertion.type === "count-values-equals") {
    assertKeys(assertion, ["key", "objectKey", "type", "value"], label);
    assertNonEmptyString(assertion.key, `${label}.key`);
    assertNonEmptyString(assertion.objectKey, `${label}.objectKey`);
    assertScalar(assertion.value, `${label}.value`);
    return;
  }
  throw new Error(`${label}.type is unsupported`);
};

export const validateContract = (contract) => {
  assert(isRecord(contract), "contract must be an object");
  assertKeys(
    contract,
    ["checks", "packageId", "readyStage", "schemaVersion", "scope", "stages"],
    "contract",
  );
  assert(contract.schemaVersion === 1, "contract.schemaVersion must be 1");
  assertId(contract.packageId, "contract.packageId");
  assert(["vm", "workspace"].includes(contract.scope), "contract.scope must be vm or workspace");
  assertId(contract.readyStage, "contract.readyStage");
  assert(Array.isArray(contract.checks) && contract.checks.length > 0, "contract.checks must be non-empty");
  assert(Array.isArray(contract.stages) && contract.stages.length > 0, "contract.stages must be non-empty");

  const checkIds = new Set();
  for (const [index, check] of contract.checks.entries()) {
    const label = `contract.checks[${String(index)}]`;
    assert(isRecord(check), `${label} must be an object`);
    assertKeys(check, ["assertions", "id", "source", "type"], label);
    assertId(check.id, `${label}.id`);
    assert(!checkIds.has(check.id), `${label}.id must be unique`);
    assert(check.type === "markdown-yaml", `${label}.type must be markdown-yaml`);
    validateSource(check.source, checkIds, `${label}.source`);
    assert(Array.isArray(check.assertions), `${label}.assertions must be an array`);
    check.assertions.forEach((entry, assertionIndex) =>
      validateAssertion(entry, `${label}.assertions[${String(assertionIndex)}]`),
    );
    checkIds.add(check.id);
  }

  const stageIds = new Set();
  for (const [index, stage] of contract.stages.entries()) {
    const label = `contract.stages[${String(index)}]`;
    assert(isRecord(stage), `${label} must be an object`);
    assertKeys(stage, ["id", "label", "requires"], label);
    assertId(stage.id, `${label}.id`);
    assert(!stageIds.has(stage.id), `${label}.id must be unique`);
    assertNonEmptyString(stage.label, `${label}.label`);
    assert(Array.isArray(stage.requires) && stage.requires.length > 0, `${label}.requires must be non-empty`);
    const requirements = new Set();
    for (const requirement of stage.requires) {
      assertId(requirement, `${label}.requires[]`);
      assert(checkIds.has(requirement), `${label}.requires references unknown check ${String(requirement)}`);
      assert(!requirements.has(requirement), `${label}.requires contains duplicate ${String(requirement)}`);
      requirements.add(requirement);
    }
    stageIds.add(stage.id);
  }
  assert(stageIds.has(contract.readyStage), "contract.readyStage must reference a stage");
  return contract;
};

const parseScalar = (rawValue) => {
  const value = rawValue.replace(/\s+#.*$/u, "").trim();
  if (value === "null" || value === "~") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/u.test(value)) return Number(value);
  if (value.startsWith('"') && value.endsWith('"')) return JSON.parse(value);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/gu, "'");
  if (value === "[]") return [];
  if (value === "{}") return {};
  return value;
};

export const parseMarkdownYaml = (content) => {
  const blocks = [...content.matchAll(/```ya?ml[ \t]*\r?\n([\s\S]*?)```/giu)];
  assert(blocks.length > 0, "metadata block is missing");
  const rawBlock = blocks.at(-1)?.[1] ?? "";
  const root = {};
  const stack = [{ indent: -1, value: root }];
  for (const [lineIndex, rawLine] of rawBlock.split(/\r?\n/u).entries()) {
    if (rawLine.trim().length === 0 || rawLine.trimStart().startsWith("#")) continue;
    const match = /^(\s*)([A-Za-z0-9_-]+):(?:\s*(.*))?$/u.exec(rawLine);
    assert(match !== null, `metadata line ${String(lineIndex + 1)} is unsupported`);
    const indent = match[1].replace(/\t/gu, "    ").length;
    const key = match[2];
    const rawValue = match[3] ?? "";
    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop();
    const parent = stack.at(-1).value;
    assert(!(key in parent), `metadata key ${key} is duplicated`);
    if (rawValue.trim().length === 0) {
      const child = {};
      parent[key] = child;
      stack.push({ indent, value: child });
    } else {
      parent[key] = parseScalar(rawValue);
    }
  }
  return root;
};

const readKey = (value, key) => {
  let current = value;
  for (const segment of key.split(".")) {
    if (!isRecord(current) || !(segment in current)) return undefined;
    current = current[segment];
  }
  return current;
};

const renderTemplate = (value, workspace) => {
  if (typeof value !== "string") return value;
  return value.replace(TEMPLATE_PATTERN, (_match, key) => {
    assert(workspace !== null, `workspace template ${String(key)} is unavailable for VM scope`);
    return String(workspace[key]);
  });
};

const safeLstat = async (filePath) => {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return null;
    throw error;
  }
};

const expandGlob = async (agentRoot, pattern) => {
  const segments = pattern.split("/");
  let candidates = [path.resolve(agentRoot)];
  for (const segment of segments) {
    const next = [];
    for (const candidate of candidates) {
      const candidateStats = await safeLstat(candidate);
      if (candidateStats !== null && candidateStats.isSymbolicLink()) continue;
      if (segment === "*") {
        const entries = await readdir(candidate, { withFileTypes: true }).catch((error) => {
          if (error && typeof error === "object" && error.code === "ENOENT") return [];
          throw error;
        });
        for (const entry of entries) {
          if (!entry.isSymbolicLink() && entry.isDirectory()) next.push(path.join(candidate, entry.name));
        }
      } else {
        const target = path.join(candidate, segment);
        const stats = await safeLstat(target);
        if (stats !== null && !stats.isSymbolicLink()) next.push(target);
      }
      assert(next.length <= MAX_CANDIDATES_PER_CHECK, "check candidate limit exceeded");
    }
    candidates = next;
  }
  return candidates.sort((left, right) => left.localeCompare(right));
};

const readMetadataFile = async (filePath) => {
  const stats = await lstat(filePath);
  assert(stats.isFile() && !stats.isSymbolicLink(), "metadata source is not a regular file");
  assert(stats.size <= MAX_METADATA_FILE_BYTES, "metadata file exceeds size limit");
  return {
    filePath,
    metadata: parseMarkdownYaml(await readFile(filePath, "utf8")),
  };
};

const resolveSource = async ({ agentRoot, check, internalResults, workspace }) => {
  const source = check.source;
  if (source.type === "check") {
    const prior = internalResults.get(source.checkId);
    if (prior?.status !== "passed") return { status: "failed", reason: "dependency-not-passed" };
    return { status: "passed", filePath: prior.filePath, metadata: prior.metadata };
  }
  if (source.type === "sibling") {
    const prior = internalResults.get(source.checkId);
    if (prior?.status !== "passed") return { status: "failed", reason: "dependency-not-passed" };
    const filePath = path.resolve(path.dirname(prior.filePath), source.path);
    const parent = `${path.dirname(prior.filePath)}${path.sep}`;
    if (!filePath.startsWith(parent)) return { status: "error", reason: "unsafe-source" };
    const stats = await safeLstat(filePath);
    if (stats === null) return { status: "failed", reason: "file-not-found" };
    try {
      return { status: "passed", ...(await readMetadataFile(filePath)) };
    } catch {
      return { status: "error", reason: "metadata-invalid" };
    }
  }

  const candidates = await expandGlob(agentRoot, source.pattern);
  if (candidates.length === 0) return { status: "failed", reason: "file-not-found" };
  let invalidMetadata = false;
  for (const filePath of candidates) {
    let parsed;
    try {
      parsed = await readMetadataFile(filePath);
    } catch {
      invalidMetadata = true;
      continue;
    }
    if (source.identity === undefined) return { status: "passed", ...parsed };
    const expected = renderTemplate(source.identity.equals, workspace);
    if (Object.is(readKey(parsed.metadata, source.identity.key), expected)) {
      return { status: "passed", ...parsed };
    }
  }
  return invalidMetadata
    ? { status: "error", reason: "metadata-invalid" }
    : { status: "failed", reason: "identity-not-found" };
};

const assertionsPass = (assertions, metadata, workspace) => {
  for (const assertion of assertions) {
    if (assertion.type === "equals") {
      if (!Object.is(readKey(metadata, assertion.key), renderTemplate(assertion.value, workspace))) return false;
      continue;
    }
    const countValue = readKey(metadata, assertion.key);
    const objectValue = readKey(metadata, assertion.objectKey);
    if (!Number.isInteger(countValue) || !isRecord(objectValue)) return false;
    const expected = renderTemplate(assertion.value, workspace);
    const actualCount = Object.values(objectValue).filter((value) => Object.is(value, expected)).length;
    if (actualCount !== countValue) return false;
  }
  return true;
};

const evaluateTarget = async ({ agentRoot, contract, workspace }) => {
  const internalResults = new Map();
  const checks = [];
  for (const check of contract.checks) {
    let source;
    try {
      source = await resolveSource({ agentRoot, check, internalResults, workspace });
    } catch {
      source = { status: "error", reason: "source-error" };
    }
    let result = source;
    if (source.status === "passed" && !assertionsPass(check.assertions, source.metadata, workspace)) {
      result = { status: "failed", reason: "assertion-failed" };
    }
    internalResults.set(check.id, result);
    checks.push(
      result.status === "passed"
        ? { id: check.id, status: "passed" }
        : { id: check.id, reason: result.reason, status: result.status },
    );
  }

  const passedChecks = new Set(checks.filter(({ status }) => status === "passed").map(({ id }) => id));
  const cumulativeRequirements = new Set();
  let highestStageIndex = -1;
  for (const [stageIndex, stage] of contract.stages.entries()) {
    stage.requires.forEach((checkId) => cumulativeRequirements.add(checkId));
    if ([...cumulativeRequirements].every((checkId) => passedChecks.has(checkId))) highestStageIndex = stageIndex;
    else break;
  }
  const readyStageIndex = contract.stages.findIndex(({ id }) => id === contract.readyStage);
  const highestStage = highestStageIndex < 0 ? null : contract.stages[highestStageIndex];
  const hasError = checks.some(({ status }) => status === "error");
  const ready = !hasError && highestStageIndex >= readyStageIndex;
  const state = hasError ? "error" : ready ? "ready" : highestStage === null ? "needs_setup" : "in_progress";
  return {
    state,
    stageId: highestStage?.id ?? null,
    stageLabel: highestStage?.label ?? null,
    ready,
    checks,
  };
};

const validateWorkspaceInventory = (inventory) => {
  assert(isRecord(inventory), "workspace inventory must be an object");
  assertKeys(inventory, ["schemaVersion", "workspaces"], "workspace inventory");
  assert(inventory.schemaVersion === 1, "workspace inventory schemaVersion must be 1");
  assert(Array.isArray(inventory.workspaces), "workspace inventory workspaces must be an array");
  const ids = new Set();
  for (const [index, workspace] of inventory.workspaces.entries()) {
    const label = `workspace inventory workspaces[${String(index)}]`;
    assert(isRecord(workspace), `${label} must be an object`);
    assertKeys(workspace, ["id", "name", "slug"], label);
    assertNonEmptyString(workspace.id, `${label}.id`);
    assert(typeof workspace.name === "string", `${label}.name must be a string`);
    assertNonEmptyString(workspace.slug, `${label}.slug`);
    assert(!ids.has(workspace.id), `${label}.id must be unique`);
    ids.add(workspace.id);
  }
  return inventory.workspaces;
};

const rollup = (contract, targets) => {
  if (targets.length === 0) return { state: "error", stageId: null, stageLabel: null, readyCount: 0 };
  const readyCount = targets.filter(({ ready }) => ready).length;
  const hasError = targets.some(({ state }) => state === "error");
  let state;
  if (hasError) state = "error";
  else if (readyCount === targets.length) state = "ready";
  else if (readyCount > 0) state = "partial";
  else if (targets.every(({ state: targetState }) => targetState === "needs_setup")) state = "needs_setup";
  else state = "in_progress";

  const stageIndexes = targets.map(({ stageId }) =>
    stageId === null ? -1 : contract.stages.findIndex(({ id }) => id === stageId),
  );
  const rollupStageIndex = Math.min(...stageIndexes);
  const rollupStage = rollupStageIndex < 0 ? null : contract.stages[rollupStageIndex];
  return {
    state,
    stageId: rollupStage?.id ?? null,
    stageLabel: rollupStage?.label ?? null,
    readyCount,
  };
};

const readContracts = async (contractsDir) => {
  const entries = await readdir(contractsDir, { withFileTypes: true }).catch((error) => {
    if (error && typeof error === "object" && error.code === "ENOENT") return [];
    throw error;
  });
  const names = entries
    .filter((entry) => entry.isFile() && !entry.isSymbolicLink() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  assert(names.length <= MAX_CONTRACTS, "contract count exceeds limit");
  const contracts = [];
  for (const name of names) {
    const filePath = path.join(contractsDir, name);
    const stats = await lstat(filePath);
    assert(stats.size <= MAX_CONTRACT_BYTES, `${name} exceeds the contract size limit`);
    const raw = await readFile(filePath, "utf8");
    let contract;
    try {
      contract = JSON.parse(raw);
    } catch (error) {
      throw new Error(`${name} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
    validateContract(contract);
    assert(name === `${contract.packageId}.json`, `${name} must match package id ${contract.packageId}`);
    contracts.push({
      contract,
      contractDigest: createHash("sha256").update(raw).digest("hex"),
    });
  }
  return contracts;
};

export const evaluateReadiness = async ({ agentRoot, contractsDir, evaluatedAt, workspaceInventory }) => {
  assert(!Number.isNaN(Date.parse(evaluatedAt)), "evaluatedAt must be an ISO timestamp");
  const workspaces = validateWorkspaceInventory(workspaceInventory);
  const packages = [];
  for (const { contract, contractDigest } of await readContracts(contractsDir)) {
    const rawTargets = contract.scope === "workspace" ? workspaces : [null];
    const evaluatedTargets = [];
    for (const workspace of rawTargets) {
      evaluatedTargets.push({
        workspace,
        result: await evaluateTarget({ agentRoot, contract, workspace }),
      });
    }
    const targets = evaluatedTargets.map(({ result }) => result);
    const summary = rollup(contract, targets);
    packages.push({
      packageId: contract.packageId,
      contractDigest,
      scope: contract.scope,
      readyStage: contract.readyStage,
      state: summary.state,
      stageId: summary.stageId,
      stageLabel: summary.stageLabel,
      counts: { ready: summary.readyCount, total: targets.length },
      workspaces:
        contract.scope === "workspace"
          ? evaluatedTargets.map(({ workspace, result }) => ({
              workspaceId: workspace.id,
              workspaceName: workspace.name,
              ...result,
            }))
          : [],
      ...(contract.scope === "vm" ? { vm: targets[0] } : {}),
    });
  }
  return {
    schemaVersion: 1,
    evaluatedAt: new Date(evaluatedAt).toISOString(),
    evaluator: { id: EVALUATOR_ID, version: EVALUATOR_VERSION },
    packages,
  };
};

const parseArguments = (argv) => {
  const options = {
    agentRoot: "/agent",
    contractsDir: null,
    evaluatedAt: new Date().toISOString(),
    output: "-",
    pretty: false,
    workspaces: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--pretty") {
      options.pretty = true;
      continue;
    }
    const value = argv[index + 1];
    assert(value !== undefined, `Missing value for ${token}`);
    if (token === "--agent-root") options.agentRoot = value;
    else if (token === "--contracts-dir") options.contractsDir = value;
    else if (token === "--evaluated-at") options.evaluatedAt = value;
    else if (token === "--output") options.output = value;
    else if (token === "--workspaces") options.workspaces = value;
    else throw new Error(`Unknown option: ${token}`);
    index += 1;
  }
  assert(options.workspaces !== null, "--workspaces is required");
  options.contractsDir ??= path.join(options.agentRoot, "tools", "package-readiness", "contracts");
  return options;
};

const writeSnapshot = async (outputPath, content) => {
  if (outputPath === "-") {
    process.stdout.write(content);
    return;
  }
  const resolved = path.resolve(outputPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  const temporary = `${resolved}.tmp-${String(process.pid)}`;
  try {
    await writeFile(temporary, content, { encoding: "utf8", mode: 0o600 });
    await rename(temporary, resolved);
  } finally {
    await rm(temporary, { force: true });
  }
};

const main = async () => {
  const options = parseArguments(process.argv.slice(2));
  const workspaceInventory = JSON.parse(await readFile(path.resolve(options.workspaces), "utf8"));
  const snapshot = await evaluateReadiness({
    agentRoot: path.resolve(options.agentRoot),
    contractsDir: path.resolve(options.contractsDir),
    evaluatedAt: options.evaluatedAt,
    workspaceInventory,
  });
  const content = `${JSON.stringify(snapshot, null, options.pretty ? 2 : 0)}\n`;
  await writeSnapshot(options.output, content);
};

if (process.argv[1] !== undefined && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`package-readiness: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
