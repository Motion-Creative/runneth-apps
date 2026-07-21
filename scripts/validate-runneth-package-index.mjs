/**
 * Runneth package index contract tests.
 *
 * This validates only the new package-manager surface:
 * - package-index.json
 * - package manifests referenced by that index
 *
 * Existing use-case-library folders are intentionally ignored unless the index
 * references them. That keeps the migration from use cases to packages
 * incremental.
 *
 * These assertions are a zero-dependency mirror of the runtime zod contracts in
 * Motion-Creative/agent-builder — keep them in sync with:
 * - packages/runneth-tools/src/runtime/packages/schema.ts   (index entry, source, policies)
 * - packages/runneth-tools/src/runtime/packages/manifest.ts (manifest v1/v2, tasks, workflows)
 * - packages/runneth-tools/src/runtime/packages/sync.ts     (install/update policy semantics
 *   behind the managed-sync fleet gate below)
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'

const ROOT = resolve(import.meta.dirname, '..')
const INDEX_PATH = 'package-index.json'
const FLEET_APPROVAL_LABEL = 'runneth-fleet-change-approved'
const PACKAGE_SOURCE_OWNER = 'Motion-Creative'
const PACKAGE_SOURCE_REPO = 'runneth-apps'
const PACKAGE_SOURCE_REF = 'main'
const PACKAGE_ID = /^[a-z0-9][a-z0-9-]*$/
const SEMVER = /^\d+\.\d+\.\d+$/
const GITHUB_OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38}[A-Za-z0-9])?$/
const GITHUB_REPO = /^[A-Za-z0-9._-]+$/
const RELATIVE_PATH = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?!.*\/\/).+$/
const RESOURCE_TARGET_ROOTS = new Set([
  'agent_apps',
  'agent_brain',
  'agent_skills',
  'agent_tools',
])
const INSTALL_POLICIES = new Set(['auto', 'manual'])
const PACKAGE_MANAGER_VERSIONS = new Set([1, 2])
const UPDATE_POLICIES = new Set(['auto', 'manual'])
const UNINSTALL_POLICIES = new Set(['allowed', 'protected'])
const MAX_TASK_TIMEOUT_MS = 2_147_483_647

const abs = (path) => resolve(ROOT, path)
const readJSON = (path) => JSON.parse(readFileSync(abs(path), 'utf8'))

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const assertKeys = (value, expectedKeys, label) => {
  const actualKeys = Object.keys(value).sort()
  assert.deepEqual(
    actualKeys,
    [...expectedKeys].sort(),
    `${label}: unexpected keys ${JSON.stringify(actualKeys)}`,
  )
}

// Strict key-set check where some keys are optional: required keys must all be
// present (enforced by the final assertKeys) and no key outside required+optional
// may appear.
const assertKeysWithOptional = (value, requiredKeys, optionalKeys, label) => {
  const expectedKeys = [
    ...requiredKeys,
    ...optionalKeys.filter((key) => key in value),
  ]
  assertKeys(value, expectedKeys, label)
}

const assertNonEmptyString = (value, label) => {
  assert.equal(typeof value, 'string', `${label}: must be a string`)
  assert.ok(value.trim().length > 0, `${label}: must not be empty`)
}

const assertTaskName = (value, label) => {
  assertNonEmptyString(value, label)
  assert.ok(value.trim().length <= 200, `${label}: must be at most 200 characters`)
}

const assertPackageId = (value, label) => {
  assertNonEmptyString(value, label)
  assert.ok(PACKAGE_ID.test(value), `${label}: must be kebab-case package id`)
}

const assertRelativePath = (value, label) => {
  assertNonEmptyString(value, label)
  assert.ok(RELATIVE_PATH.test(value), `${label}: unsafe relative path`)
}

const assertSemver = (value, label) => {
  assertNonEmptyString(value, label)
  assert.ok(SEMVER.test(value), `${label}: must be semver X.Y.Z`)
}

const assertOptionalNonEmptyString = (object, key, label) => {
  if (!(key in object)) {
    return
  }
  assertNonEmptyString(object[key], `${label}.${key}`)
}

const assertOptionalJsonValue = (object, key, label) => {
  if (!(key in object)) {
    return
  }

  assert.notEqual(object[key], undefined, `${label}.${key}: must be JSON`)
}

const assertRequiredJsonValue = (object, key, label) => {
  assert.ok(key in object, `${label}.${key}: is required`)
  assert.notEqual(object[key], undefined, `${label}.${key}: must be JSON`)
}

const assertSource = (source, label) => {
  assert.ok(isRecord(source), `${label}: must be an object`)
  assert.equal(typeof source.type, 'string', `${label}.type: must be a string`)

  if (source.type === 'github' || source.type === 'backend-github') {
    assertKeys(source, ['owner', 'path', 'ref', 'repo', 'type'], label)
    assert.ok(GITHUB_OWNER.test(source.owner), `${label}.owner: invalid GitHub owner`)
    assert.ok(GITHUB_REPO.test(source.repo), `${label}.repo: invalid GitHub repo`)
    assert.equal(source.owner, PACKAGE_SOURCE_OWNER, `${label}.owner: must be ${PACKAGE_SOURCE_OWNER}`)
    assert.equal(source.repo, PACKAGE_SOURCE_REPO, `${label}.repo: must be ${PACKAGE_SOURCE_REPO}`)
    assert.equal(source.ref, PACKAGE_SOURCE_REF, `${label}.ref: must be ${PACKAGE_SOURCE_REF}`)
    assertRelativePath(source.path, `${label}.path`)
    return
  }

  assert.fail(`${label}.type: must be github or backend-github`)
}

const assertTarget = (target, label) => {
  assert.ok(isRecord(target), `${label}: must be an object`)
  assertKeys(target, ['path', 'root'], label)
  assert.ok(RESOURCE_TARGET_ROOTS.has(target.root), `${label}.root: invalid target root`)
  assertRelativePath(target.path, `${label}.path`)
}

const assertPackageResource = (resource, label) => {
  assert.ok(isRecord(resource), `${label}: must be an object`)
  assertPackageId(resource.id, `${label}.id`)
  assertRelativePath(resource.sourcePath, `${label}.sourcePath`)

  if (resource.type === 'file') {
    assertKeys(resource, ['executable', 'id', 'sourcePath', 'target', 'type'], label)
    assert.equal(typeof resource.executable, 'boolean', `${label}.executable: must be boolean`)
    assertTarget(resource.target, `${label}.target`)
    return
  }

  if (resource.type === 'directory') {
    assertKeys(resource, ['executablePaths', 'id', 'sourcePath', 'target', 'type'], label)
    assert.ok(Array.isArray(resource.executablePaths), `${label}.executablePaths: must be array`)
    resource.executablePaths.forEach((entry, index) =>
      assertRelativePath(entry, `${label}.executablePaths[${index}]`),
    )
    assertTarget(resource.target, `${label}.target`)
    return
  }

  if (resource.type === 'package_instruction') {
    assertKeys(resource, ['id', 'sourcePath', 'type'], label)
    return
  }

  assert.fail(`${label}.type: must be file, directory, or package_instruction`)
}

const assertTaskSpec = (spec, label) => {
  assert.ok(isRecord(spec), `${label}: must be an object`)
  assert.equal(typeof spec.kind, 'string', `${label}.kind: must be a string`)

  if (spec.kind === 'agent') {
    assertKeysWithOptional(spec, ['kind', 'prompt'], ['name', 'outputSchema'], label)
    assertNonEmptyString(spec.prompt, `${label}.prompt`)
    if ('name' in spec) {
      assertTaskName(spec.name, `${label}.name`)
    }
    assertOptionalJsonValue(spec, 'outputSchema', label)
    return
  }

  if (spec.kind === 'bash') {
    assertKeysWithOptional(spec, ['kind', 'script'], ['cwd', 'env', 'timeoutMs'], label)
    assertNonEmptyString(spec.script, `${label}.script`)
    assertOptionalNonEmptyString(spec, 'cwd', label)
    if ('env' in spec) {
      assert.ok(isRecord(spec.env), `${label}.env: must be an object`)
      for (const [key, value] of Object.entries(spec.env)) {
        assert.equal(typeof value, 'string', `${label}.env.${key}: must be a string`)
      }
    }
    if ('timeoutMs' in spec) {
      assert.equal(Number.isInteger(spec.timeoutMs), true, `${label}.timeoutMs: must be an integer`)
      assert.ok(spec.timeoutMs > 0, `${label}.timeoutMs: must be positive`)
      assert.ok(
        spec.timeoutMs <= MAX_TASK_TIMEOUT_MS,
        `${label}.timeoutMs: must be at most ${MAX_TASK_TIMEOUT_MS}`,
      )
    }
    return
  }

  if (spec.kind === 'workflow') {
    assertKeys(spec, ['input', 'kind', 'workflow'], label)
    assertRequiredJsonValue(spec, 'input', label)
    assertTaskName(spec.workflow, `${label}.workflow`)
    return
  }

  assert.fail(`${label}.kind: must be agent, bash, or workflow`)
}

const assertPackageTask = (task, label) => {
  assert.ok(isRecord(task), `${label}: must be an object`)
  assertKeys(task, ['name', 'spec'], label)
  assertTaskName(task.name, `${label}.name`)
  assertTaskSpec(task.spec, `${label}.spec`)
}

const assertPackageWorkflow = (workflow, label) => {
  assert.ok(isRecord(workflow), `${label}: must be an object`)
  assertKeysWithOptional(
    workflow,
    ['name', 'sourcePath'],
    ['entry', 'inputSchema', 'outputSchema'],
    label,
  )
  assertTaskName(workflow.name, `${label}.name`)
  assertRelativePath(workflow.sourcePath, `${label}.sourcePath`)
  assertOptionalNonEmptyString(workflow, 'entry', label)
  assertOptionalJsonValue(workflow, 'inputSchema', label)
  assertOptionalJsonValue(workflow, 'outputSchema', label)
}

const MANIFEST_COMMON_KEYS = [
  'description',
  'id',
  'installPolicy',
  'name',
  'resources',
  'schemaVersion',
  'uninstallPolicy',
  'updatePolicy',
  'version',
]

// Shared by every manifest version: identity, policies, and resources. Repo
// policy requires semver versions in both v1 and v2 (the runtime only requires
// a non-empty string, so this is deliberately stricter).
const assertPackageManifestCommon = (manifest, label) => {
  assertPackageId(manifest.id, `${label}.id`)
  assertNonEmptyString(manifest.name, `${label}.name`)
  assertNonEmptyString(manifest.description, `${label}.description`)
  assertSemver(manifest.version, `${label}.version`)
  assert.ok(INSTALL_POLICIES.has(manifest.installPolicy), `${label}.installPolicy: invalid`)
  assert.ok(UPDATE_POLICIES.has(manifest.updatePolicy), `${label}.updatePolicy: invalid`)
  assert.ok(
    UNINSTALL_POLICIES.has(manifest.uninstallPolicy),
    `${label}.uninstallPolicy: invalid`,
  )
  assert.ok(Array.isArray(manifest.resources), `${label}.resources: must be array`)
  manifest.resources.forEach((resource, index) => {
    assertPackageResource(resource, `${label}.resources[${index}]`)
  })
}

const assertPackageManifestV1 = (manifest, label) => {
  assertKeys(manifest, MANIFEST_COMMON_KEYS, label)
  assert.equal(manifest.schemaVersion, 1, `${label}.schemaVersion: must be 1`)
  assertPackageManifestCommon(manifest, label)
}

const assertPackageManifestV2 = (manifest, label) => {
  assertKeysWithOptional(manifest, MANIFEST_COMMON_KEYS, ['tasks', 'workflows'], label)
  assert.equal(manifest.schemaVersion, 2, `${label}.schemaVersion: must be 2`)
  assertPackageManifestCommon(manifest, label)
  if ('tasks' in manifest) {
    assert.ok(Array.isArray(manifest.tasks), `${label}.tasks: must be array`)
    manifest.tasks.forEach((task, index) => {
      assertPackageTask(task, `${label}.tasks[${index}]`)
    })
  }
  if ('workflows' in manifest) {
    assert.ok(Array.isArray(manifest.workflows), `${label}.workflows: must be array`)
    manifest.workflows.forEach((workflow, index) => {
      assertPackageWorkflow(workflow, `${label}.workflows[${index}]`)
    })
  }
}

const assertPackageManifest = (manifest, label) => {
  assert.ok(isRecord(manifest), `${label}: must be an object`)

  if (manifest.schemaVersion === 1) {
    assertPackageManifestV1(manifest, label)
    return
  }

  if (manifest.schemaVersion === 2) {
    assertPackageManifestV2(manifest, label)
    return
  }

  assert.fail(`${label}.schemaVersion: must be 1 or 2`)
}

const assertIndexEntry = (entry, label) => {
  assert.ok(isRecord(entry), `${label}: must be an object`)
  assertKeys(
    entry,
    [
      'categories',
      'description',
      'id',
      'installPolicy',
      'name',
      'packageManagerVersion',
      'source',
      'uninstallPolicy',
      'updatePolicy',
      'version',
    ],
    label,
  )
  assert.ok(
    PACKAGE_MANAGER_VERSIONS.has(entry.packageManagerVersion),
    `${label}.packageManagerVersion: must be 1 or 2`,
  )
  assertPackageId(entry.id, `${label}.id`)
  assertNonEmptyString(entry.name, `${label}.name`)
  assertNonEmptyString(entry.description, `${label}.description`)
  assertSemver(entry.version, `${label}.version`)
  assert.ok(INSTALL_POLICIES.has(entry.installPolicy), `${label}.installPolicy: invalid`)
  assert.ok(UPDATE_POLICIES.has(entry.updatePolicy), `${label}.updatePolicy: invalid`)
  assert.ok(UNINSTALL_POLICIES.has(entry.uninstallPolicy), `${label}.uninstallPolicy: invalid`)
  assert.ok(Array.isArray(entry.categories), `${label}.categories: must be array`)
  assert.ok(entry.categories.length > 0, `${label}.categories: must not be empty`)
  entry.categories.forEach((category, index) =>
    assertNonEmptyString(category, `${label}.categories[${index}]`),
  )
  assertSource(entry.source, `${label}.source`)
}

const validatePackageIndex = (index) => {
  assert.ok(isRecord(index), `${INDEX_PATH}: must be an object`)
  assertKeys(index, ['indexRevision', 'packages', 'schemaVersion'], INDEX_PATH)
  assert.equal(index.schemaVersion, 1, `${INDEX_PATH}.schemaVersion: must be 1`)
  assertNonEmptyString(index.indexRevision, `${INDEX_PATH}.indexRevision`)
  assert.ok(Array.isArray(index.packages), `${INDEX_PATH}.packages: must be array`)

  const ids = new Set()
  for (const [indexNumber, entry] of index.packages.entries()) {
    assertIndexEntry(entry, `${INDEX_PATH}.packages[${indexNumber}]`)
    assert.ok(!ids.has(entry.id), `${INDEX_PATH}: duplicate package id ${entry.id}`)
    ids.add(entry.id)
  }
}

const localManifestPathForSource = (source) => {
  return `${source.path}/package.json`
}

const assertPathHasNoSymlinkSegments = (relativePath, label) => {
  const segments = relativePath.split('/')
  let currentPath = ROOT
  for (const segment of segments) {
    currentPath = resolve(currentPath, segment)
    const stats = lstatSync(currentPath)
    assert.ok(!stats.isSymbolicLink(), `${label}: must not contain symlinks`)
  }
}

const assertExistingFile = (relativePath, label) => {
  assertPathHasNoSymlinkSegments(relativePath, label)
  const stats = lstatSync(abs(relativePath))
  assert.ok(stats.isFile(), `${label}: must be a file`)
}

const assertExistingDirectory = (relativePath, label) => {
  assertPathHasNoSymlinkSegments(relativePath, label)
  const stats = lstatSync(abs(relativePath))
  assert.ok(stats.isDirectory(), `${label}: must be a directory`)
}

const assertManifestResourceFilesExist = (manifest, manifestRootPath) => {
  for (const [index, resource] of manifest.resources.entries()) {
    const label = `${manifest.id}: resources[${index}] ${resource.id}`
    const sourcePath = `${manifestRootPath}/${resource.sourcePath}`
    if (resource.type === 'directory') {
      assertExistingDirectory(sourcePath, `${label}.sourcePath`)
      for (const [executableIndex, executablePath] of resource.executablePaths.entries()) {
        assertExistingFile(
          `${sourcePath}/${executablePath}`,
          `${label}.executablePaths[${executableIndex}]`,
        )
      }
      continue
    }

    assertExistingFile(sourcePath, `${label}.sourcePath`)
  }
}

const assertManifestAssetFilesExist = (manifest, manifestRootPath) => {
  if (manifest.schemaVersion !== 2 || !Array.isArray(manifest.workflows)) {
    return
  }

  for (const [index, workflow] of manifest.workflows.entries()) {
    assertExistingFile(
      `${manifestRootPath}/${workflow.sourcePath}`,
      `${manifest.id}: workflows[${index}] ${workflow.name}.sourcePath`,
    )
  }
}

const assertManifestMatchesIndexEntry = (entry, manifest, manifestPath) => {
  assert.equal(manifest.id, entry.id, `${entry.id}: manifest id does not match index id`)
  assert.equal(
    manifest.version,
    entry.version,
    `${entry.id}: manifest version does not match index version`,
  )
  assert.equal(
    manifest.schemaVersion,
    entry.packageManagerVersion,
    `${entry.id}: manifest schemaVersion does not match index packageManagerVersion`,
  )
  assert.equal(manifest.name, entry.name, `${entry.id}: manifest name does not match index name`)
  assert.equal(
    manifest.description,
    entry.description,
    `${entry.id}: manifest description does not match index description`,
  )
  assert.equal(
    manifest.installPolicy,
    entry.installPolicy,
    `${entry.id}: manifest installPolicy does not match index installPolicy`,
  )
  assert.equal(
    manifest.updatePolicy,
    entry.updatePolicy,
    `${entry.id}: manifest updatePolicy does not match index updatePolicy`,
  )
  assert.equal(
    manifest.uninstallPolicy,
    entry.uninstallPolicy,
    `${entry.id}: manifest uninstallPolicy does not match index uninstallPolicy`,
  )
  const manifestRootPath = manifestPath.replace(/\/package\.json$/, '')
  assertManifestResourceFilesExist(manifest, manifestRootPath)
  assertManifestAssetFilesExist(manifest, manifestRootPath)
}

const getIndexedPackageById = (index) =>
  new Map(index.packages.map((entry) => [entry.id, entry]))

const readBaseIndex = () => {
  const baseRef = process.env.GITHUB_BASE_REF
  if (!baseRef) {
    return null
  }
  assert.ok(/^[A-Za-z0-9._/-]+$/.test(baseRef), `Unsafe GITHUB_BASE_REF: ${baseRef}`)

  try {
    const raw = execFileSync('git', ['show', `origin/${baseRef}:${INDEX_PATH}`], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return JSON.parse(raw)
  } catch (error) {
    if (error.status === 128) {
      return null
    }
    throw error
  }
}

const readPullRequestLabels = () => {
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath || !existsSync(eventPath)) {
    return []
  }

  const event = JSON.parse(readFileSync(eventPath, 'utf8'))
  return event.pull_request?.labels?.map((label) => label.name).filter(Boolean) ?? []
}

const affectsManagedSync = (entry) =>
  entry.installPolicy === 'auto' || entry.updatePolicy === 'auto'

const sourceFingerprint = (entry) =>
  JSON.stringify({
    categories: [...entry.categories].sort(),
    installPolicy: entry.installPolicy,
    // packageManagerVersion selects the manifest contract (v2 adds executable
    // tasks/workflows), so flipping it is a fleet-affecting change even when
    // the version string stays the same.
    packageManagerVersion: entry.packageManagerVersion,
    source: entry.source,
    uninstallPolicy: entry.uninstallPolicy,
    updatePolicy: entry.updatePolicy,
    version: entry.version,
  })

const fleetImpactMessages = (baseIndex, nextIndex) => {
  if (baseIndex === null) {
    return nextIndex.packages
      .filter(affectsManagedSync)
      .map((entry) => `${entry.id}: new managed-sync package`)
  }

  const baseById = getIndexedPackageById(baseIndex)
  const nextById = getIndexedPackageById(nextIndex)
  const messages = []

  for (const nextEntry of nextIndex.packages) {
    const baseEntry = baseById.get(nextEntry.id)
    if (!baseEntry) {
      if (affectsManagedSync(nextEntry)) {
        messages.push(`${nextEntry.id}: new managed-sync package`)
      }
      continue
    }

    if (!affectsManagedSync(baseEntry) && affectsManagedSync(nextEntry)) {
      messages.push(`${nextEntry.id}: changed to managed-sync package`)
      continue
    }

    if (affectsManagedSync(baseEntry) && sourceFingerprint(baseEntry) !== sourceFingerprint(nextEntry)) {
      messages.push(`${nextEntry.id}: changed managed-sync package version, source, policy, or categories`)
    }
  }

  for (const baseEntry of baseIndex.packages) {
    if (affectsManagedSync(baseEntry) && !nextById.has(baseEntry.id)) {
      messages.push(`${baseEntry.id}: removed managed-sync package`)
    }
  }

  return messages
}

test('package-index.json matches the package index contract', () => {
  validatePackageIndex(readJSON(INDEX_PATH))
})

test('package index contract accepts package manager v2 entries', () => {
  validatePackageIndex({
    indexRevision: 'test',
    packages: [
      {
        categories: ['analytics'],
        description: 'Analytics utilities',
        id: 'analytics',
        installPolicy: 'manual',
        name: 'Analytics',
        packageManagerVersion: 2,
        source: {
          owner: PACKAGE_SOURCE_OWNER,
          path: 'analytics',
          ref: PACKAGE_SOURCE_REF,
          repo: PACKAGE_SOURCE_REPO,
          type: 'backend-github',
        },
        uninstallPolicy: 'allowed',
        updatePolicy: 'auto',
        version: '1.0.0',
      },
    ],
    schemaVersion: 1,
  })
})

test('package manifest contract accepts v2 tasks and workflows', () => {
  assertPackageManifest(
    {
      description: 'Analytics utilities',
      id: 'analytics',
      installPolicy: 'manual',
      name: 'Analytics',
      resources: [
        {
          executable: true,
          id: 'cli',
          sourcePath: 'bin/analytics',
          target: {
            path: 'analytics',
            root: 'agent_tools',
          },
          type: 'file',
        },
        {
          executablePaths: ['scripts/run'],
          id: 'scripts',
          sourcePath: 'scripts',
          target: {
            path: 'analytics/scripts',
            root: 'agent_tools',
          },
          type: 'directory',
        },
        {
          id: 'instructions',
          sourcePath: 'instructions.md',
          type: 'package_instruction',
        },
      ],
      schemaVersion: 2,
      tasks: [
        {
          name: 'Classify creative',
          spec: {
            kind: 'agent',
            name: 'creative-classifier',
            outputSchema: {
              type: 'object',
            },
            prompt: 'Classify this creative.',
          },
        },
        {
          name: 'Normalize rows',
          spec: {
            cwd: './scripts',
            env: {
              MODE: 'strict',
            },
            kind: 'bash',
            script: 'node normalize.js',
            timeoutMs: 30_000,
          },
        },
        {
          name: 'Summarize rows',
          spec: {
            input: {
              limit: 10,
            },
            kind: 'workflow',
            workflow: 'summarize-rows',
          },
        },
      ],
      uninstallPolicy: 'allowed',
      updatePolicy: 'auto',
      version: '1.0.0',
      workflows: [
        {
          entry: 'wf',
          inputSchema: {
            type: 'object',
          },
          name: 'summarize-rows',
          outputSchema: null,
          sourcePath: 'workflows/summarize.ts',
        },
      ],
    },
    'package.json',
  )
})

test('package manifest contract keeps tasks and workflows out of v1', () => {
  assert.throws(() => {
    assertPackageManifest(
      {
        description: 'Analytics utilities',
        id: 'analytics',
        installPolicy: 'manual',
        name: 'Analytics',
        resources: [],
        schemaVersion: 1,
        tasks: [],
        uninstallPolicy: 'allowed',
        updatePolicy: 'auto',
        version: '1.0.0',
      },
      'package.json',
    )
  })
})

test('indexed packages match their package.json manifests', () => {
  const index = readJSON(INDEX_PATH)
  for (const entry of index.packages) {
    const manifestPath = localManifestPathForSource(entry.source)

    assert.ok(existsSync(abs(manifestPath)), `${entry.id}: missing ${manifestPath}`)
    const manifest = readJSON(manifestPath)
    assertPackageManifest(manifest, manifestPath)
    assertManifestMatchesIndexEntry(entry, manifest, manifestPath)
  }
})

test('managed-sync package changes require explicit fleet approval', () => {
  const nextIndex = readJSON(INDEX_PATH)
  const messages = fleetImpactMessages(readBaseIndex(), nextIndex)
  if (messages.length === 0) {
    return
  }

  const labels = readPullRequestLabels()
  assert.ok(
    labels.includes(FLEET_APPROVAL_LABEL),
    [
      'This PR changes managed-sync Runneth packages.',
      'These changes may sync to matching VMs after merge.',
      `Add the ${FLEET_APPROVAL_LABEL} label after core engineering approval.`,
      '',
      ...messages.map((message) => `- ${message}`),
    ].join('\n'),
  )
})
