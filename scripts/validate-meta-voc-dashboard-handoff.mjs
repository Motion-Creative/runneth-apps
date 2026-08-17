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
const postInstall = read('meta-and-voc-onboarding/post-install.md')

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

test('automatic updates keep v7 installs compatible without rewriting user instructions', () => {
  const compatibility = activation.indexOf('## Dashboard-form report compatibility')
  const rosterReturn = activation.indexOf(
    "If that block lists **this conversation's workspace**",
  )

  assert.ok(compatibility !== -1 && compatibility < rosterReturn)
  assert.match(activation, /existing `runneth:meta-validation-gate v7` installs/i)
  assert.match(activation, /scheduled routine refreshes a dashboard-form weekly report/)
  assert.match(
    activation,
    /Automatic package updates must leave `\/agent\/user\.md` byte-for-byte unchanged/,
  )
  assert.doesNotMatch(activation, /Guard refresh on automatic package updates/)
})

test('approved post-install writes preserve the latest whole-file payload and full roster', () => {
  assert.match(
    postInstall,
    /exact payload sent by that Write becomes the only\n  source payload/,
  )
  assert.match(postInstall, /Never fall back to the conversation-start system-prompt copy/)
  assert.match(
    postInstall,
    /If the exact payload from the most recent successful Write is unavailable, stop/,
  )
  assert.match(
    postInstall,
    /append this workspace to its list and\n   leave the existing names alone/,
  )
})
