/**
 * Runneth package index contract tests.
 *
 * This validates only the new package-manager surface:
 * - runneth-package-index.json
 * - package manifests referenced by that index
 *
 * Existing use-case-library folders are intentionally ignored unless the index
 * references them. That keeps the migration from use cases to packages
 * incremental.
 */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'

const ROOT = resolve(import.meta.dirname, '..')
const INDEX_PATH = 'runneth-package-index.json'
const FLEET_APPROVAL_LABEL = 'runneth-fleet-change-approved'
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
const UPDATE_POLICIES = new Set(['auto', 'manual'])

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

const assertNonEmptyString = (value, label) => {
  assert.equal(typeof value, 'string', `${label}: must be a string`)
  assert.ok(value.trim().length > 0, `${label}: must not be empty`)
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

const assertSource = (source, label) => {
  assert.ok(isRecord(source), `${label}: must be an object`)
  assert.equal(typeof source.type, 'string', `${label}.type: must be a string`)

  if (source.type === 'github') {
    assertKeys(source, ['owner', 'path', 'ref', 'repo', 'type'], label)
    assert.ok(GITHUB_OWNER.test(source.owner), `${label}.owner: invalid GitHub owner`)
    assert.ok(GITHUB_REPO.test(source.repo), `${label}.repo: invalid GitHub repo`)
    assertRelativePath(source.path, `${label}.path`)
    assertNonEmptyString(source.ref, `${label}.ref`)
    return
  }

  if (source.type === 'local') {
    assertKeys(source, ['path', 'type'], label)
    assertRelativePath(source.path, `${label}.path`)
    return
  }

  assert.fail(`${label}.type: must be github or local`)
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

  if (resource.type === 'seed_file') {
    assertKeys(resource, ['id', 'sourcePath', 'target', 'type'], label)
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

  assert.fail(`${label}.type: must be file, seed_file, directory, or package_instruction`)
}

const assertPackageManifest = (manifest, label) => {
  assert.ok(isRecord(manifest), `${label}: must be an object`)
  assertKeys(
    manifest,
    ['description', 'id', 'name', 'resources', 'schemaVersion', 'updatePolicy', 'version'],
    label,
  )
  assert.equal(manifest.schemaVersion, 1, `${label}.schemaVersion: must be 1`)
  assertPackageId(manifest.id, `${label}.id`)
  assertNonEmptyString(manifest.name, `${label}.name`)
  assertNonEmptyString(manifest.description, `${label}.description`)
  assertSemver(manifest.version, `${label}.version`)
  assert.ok(UPDATE_POLICIES.has(manifest.updatePolicy), `${label}.updatePolicy: invalid`)
  assert.ok(Array.isArray(manifest.resources), `${label}.resources: must be array`)
  manifest.resources.forEach((resource, index) => {
    assertPackageResource(resource, `${label}.resources[${index}]`)
  })
}

const assertIndexEntry = (entry, label) => {
  assert.ok(isRecord(entry), `${label}: must be an object`)
  assertKeys(
    entry,
    [
      'categories',
      'description',
      'id',
      'name',
      'packageManagerVersion',
      'source',
      'updatePolicy',
      'version',
    ],
    label,
  )
  assert.equal(entry.packageManagerVersion, 1, `${label}.packageManagerVersion: must be 1`)
  assertPackageId(entry.id, `${label}.id`)
  assertNonEmptyString(entry.name, `${label}.name`)
  assertNonEmptyString(entry.description, `${label}.description`)
  assertSemver(entry.version, `${label}.version`)
  assert.ok(UPDATE_POLICIES.has(entry.updatePolicy), `${label}.updatePolicy: invalid`)
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
  if (source.type === 'local') {
    return `${source.path}/runneth-package.json`
  }

  if (
    source.type === 'github' &&
    source.owner === 'Motion-Creative' &&
    source.repo === 'runneth-apps'
  ) {
    return `${source.path}/runneth-package.json`
  }

  return null
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

const isAutoInstallable = (entry) => entry.updatePolicy === 'auto'

const sourceFingerprint = (entry) =>
  JSON.stringify({
    categories: [...entry.categories].sort(),
    source: entry.source,
    updatePolicy: entry.updatePolicy,
    version: entry.version,
  })

const fleetImpactMessages = (baseIndex, nextIndex) => {
  if (baseIndex === null) {
    return nextIndex.packages
      .filter(isAutoInstallable)
      .map((entry) => `${entry.id}: new auto package`)
  }

  const baseById = getIndexedPackageById(baseIndex)
  const nextById = getIndexedPackageById(nextIndex)
  const messages = []

  for (const nextEntry of nextIndex.packages) {
    const baseEntry = baseById.get(nextEntry.id)
    if (!baseEntry) {
      if (isAutoInstallable(nextEntry)) {
        messages.push(`${nextEntry.id}: new auto package`)
      }
      continue
    }

    if (!isAutoInstallable(baseEntry) && isAutoInstallable(nextEntry)) {
      messages.push(`${nextEntry.id}: changed to auto package`)
      continue
    }

    if (isAutoInstallable(baseEntry) && sourceFingerprint(baseEntry) !== sourceFingerprint(nextEntry)) {
      messages.push(`${nextEntry.id}: changed auto package version, source, policy, or categories`)
    }
  }

  for (const baseEntry of baseIndex.packages) {
    if (isAutoInstallable(baseEntry) && !nextById.has(baseEntry.id)) {
      messages.push(`${baseEntry.id}: removed auto package`)
    }
  }

  return messages
}

test('runneth-package-index.json matches the package index contract', () => {
  validatePackageIndex(readJSON(INDEX_PATH))
})

test('indexed local packages match their runneth-package.json manifests', () => {
  const index = readJSON(INDEX_PATH)
  for (const entry of index.packages) {
    const manifestPath = localManifestPathForSource(entry.source)
    if (manifestPath === null) {
      continue
    }

    assert.ok(existsSync(abs(manifestPath)), `${entry.id}: missing ${manifestPath}`)
    const manifest = readJSON(manifestPath)
    assertPackageManifest(manifest, manifestPath)
    assert.equal(manifest.id, entry.id, `${entry.id}: manifest id does not match index id`)
    assert.equal(manifest.version, entry.version, `${entry.id}: manifest version does not match index version`)
  }
})

test('auto package changes require explicit fleet approval', () => {
  const nextIndex = readJSON(INDEX_PATH)
  const messages = fleetImpactMessages(readBaseIndex(), nextIndex)
  if (messages.length === 0) {
    return
  }

  const labels = readPullRequestLabels()
  assert.ok(
    labels.includes(FLEET_APPROVAL_LABEL),
    [
      'This PR changes auto-installable Runneth packages.',
      'These changes may sync to matching VMs after merge.',
      `Add the ${FLEET_APPROVAL_LABEL} label after core engineering approval.`,
      '',
      ...messages.map((message) => `- ${message}`),
    ].join('\n'),
  )
})
