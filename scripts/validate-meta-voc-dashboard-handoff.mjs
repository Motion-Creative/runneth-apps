import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const manifest = JSON.parse(read('meta-and-voc-onboarding/package.json'))
const index = JSON.parse(read('package-index.json'))
const validation = read(
  'meta-and-voc-onboarding/meta/meta-validation-onboarding-package.md',
)
const guard = read(
  'meta-and-voc-onboarding/meta-onboarding-rules/meta-analysis-validation.md',
).trim()
const skill = read('meta-and-voc-onboarding/dashboard-design/SKILL.md')
const activation = read('meta-and-voc-onboarding/instructions/activation.md')

test('package installs the complete dashboard-design skill directory', () => {
  const resource = manifest.resources.find(({ id }) => id === 'dashboard-design-skill')

  assert.deepEqual(resource, {
    id: 'dashboard-design-skill',
    type: 'directory',
    sourcePath: 'dashboard-design',
    executablePaths: [],
    target: {
      root: 'agent_skills',
      path: 'dashboard-design',
    },
  })
})

test('package and registry release the automatic handoff together', () => {
  const entry = index.packages.find(({ id }) => id === manifest.id)

  assert.equal(manifest.version, '6')
  assert.equal(entry?.version, manifest.version)
  assert.match(manifest.description, /automatically invokes dashboard-design/)
})

test('dashboard selection immediately invokes the skill without a second customer request', () => {
  const formPrompt = validation.indexOf(
    'you want it in: a deck, a dashboard, or a document?',
  )
  const dashboardBranch = validation.indexOf(
    '**Dashboard:** invoke the installed `dashboard-design` skill now',
  )
  const detailGathering = validation.indexOf('Gather only what Field 10 does not already answer:')

  assert.notEqual(formPrompt, -1)
  assert.notEqual(dashboardBranch, -1)
  assert.notEqual(detailGathering, -1)
  assert.ok(formPrompt < dashboardBranch)
  assert.ok(dashboardBranch < detailGathering)
  assert.match(
    validation,
    /the customer does not issue a second request and does not see or choose\n  the internal handoff/,
  )
})

test('automatic handoff covers initial builds, rebuilds, and scheduled refreshes', () => {
  assert.match(
    guard,
    /immediately when the customer selects dashboard, then use it for the\n  initial build, every regeneration, and every scheduled refresh/,
  )
  assert.match(
    validation,
    /routine's rebuild\n   instructions must invoke `dashboard-design`/,
  )
  assert.match(
    skill,
    /use automatically whenever Meta validation builds, rebuilds, or refreshes/,
  )
})

test('staged validation guard exactly matches the embedded runtime guard', () => {
  assert.match(guard, /runneth:meta-validation-gate v8/)
  assert.ok(validation.includes(guard))
})

test('automatic updates reconcile stale guards before the roster early return', () => {
  const refresh = activation.indexOf('## Guard refresh on automatic package updates')
  const rosterReturn = activation.indexOf(
    "If that block lists **this conversation's workspace**",
  )

  assert.notEqual(refresh, -1)
  assert.notEqual(rosterReturn, -1)
  assert.ok(refresh < rosterReturn)
  assert.match(activation, /Read all four staged guard files/)
  assert.match(activation, /Compare each complete sentinel-wrapped block byte-for-byte/)
  assert.match(activation, /do not run `post-install\.md`/)
  assert.match(
    activation,
    /do not inspect accounts, create routines, edit `\/agent\/INDEX\.md`, or change any workspace brain/,
  )
})
