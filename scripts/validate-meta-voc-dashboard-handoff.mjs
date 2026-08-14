import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const manifest = JSON.parse(read('meta-and-voc-onboarding/package.json'))
const validation = read('meta-and-voc-onboarding/meta/meta-validation-onboarding-package.md')
const guard = read(
  'meta-and-voc-onboarding/meta-onboarding-rules/meta-analysis-validation.md',
).trim()
const activation = read('meta-and-voc-onboarding/instructions/activation.md')

test('package installs the complete dashboard-design skill directory', () => {
  const resource = manifest.resources.find(({ id }) => id === 'dashboard-design-skill')

  assert.equal(resource?.type, 'directory')
  assert.equal(resource?.sourcePath, 'dashboard-design')
  assert.deepEqual(resource?.target, {
    root: 'agent_skills',
    path: 'dashboard-design',
  })
})

test('dashboard invokes the skill while deck and document keep their own paths', () => {
  assert.match(validation, /\*\*Dashboard:\*\* invoke the installed `dashboard-design` skill now/)
  assert.match(
    validation,
    /\*\*Deck or document:\*\* continue through that form's artifact path without invoking\n  `dashboard-design`/,
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

  assert.ok(refresh !== -1 && refresh < rosterReturn)
  assert.match(activation, /Compare each complete sentinel-wrapped block byte-for-byte/)
  assert.match(activation, /do not run `post-install\.md`/)
})
