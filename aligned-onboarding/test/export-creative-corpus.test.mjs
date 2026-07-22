import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { test } from 'node:test'

const ROOT = resolve(import.meta.dirname, '../..')
const EXPORTER = resolve(ROOT, 'aligned-onboarding/bin/export-creative-corpus.mjs')
const FIXTURE = resolve(
  ROOT,
  'aligned-onboarding/test/fixtures/static-image-all-summary-sections.json',
)

const runExporter = ({ input, outputDir }) =>
  spawnSync(
    process.execPath,
    [
      EXPORTER,
      '--input',
      input,
      '--workspace-id',
      'workspace-ridge',
      '--brand',
      'Ridge',
      '--output-dir',
      outputDir,
    ],
    { encoding: 'utf8' },
  )

test('exports every field from all four Motion summary sections', async () => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'creative-corpus-export-'))
  try {
    const outputDir = resolve(temporaryRoot, 'output')
    const result = runExporter({ input: FIXTURE, outputDir })
    assert.equal(result.status, 0, result.stderr)

    const filenames = await readdir(outputDir)
    assert.deepEqual(filenames, [
      'Ridge Static All Sections--creative-static-ridge.md',
    ])
    const markdown = await readFile(resolve(outputDir, filenames[0]), 'utf8')

    for (const sentinel of [
      'AD_DESCRIPTION_SENTINEL',
      'HOOK_SENTINEL',
      'OVERLAY_SENTINEL',
      'STORYLINE_SENTINEL',
      'VISUAL_STYLE_SENTINEL',
      'VISUALS_SENTINEL',
      'BRAND_FRAMING_SENTINEL',
      'PRODUCT_FRAMING_SENTINEL',
      'FONT_SENTINEL',
      'EFFECT_SENTINEL',
      'CTA_SENTINEL',
      'OFFER_SENTINEL',
      'BENEFIT_SENTINEL',
      'FEATURE_SENTINEL',
      'PAIN_POINT_SENTINEL',
      'SOCIAL_PROOF_SENTINEL',
      'FUNNEL_SENTINEL',
      'DESIRED_OUTCOME_SENTINEL',
      'EMOTION_SENTINEL',
      'CULTURAL_CONTEXT_SENTINEL',
      'AUDIENCE_SENTINEL',
      'PERSUASION_SENTINEL',
      'TAG_SENTINEL',
    ]) {
      assert.match(markdown, new RegExp(sentinel))
    }
    assert.match(markdown, /## Creative Breakdown/u)
    assert.match(markdown, /## Messaging and Positioning/u)
    assert.doesNotMatch(markdown, /\[object Object\]/u)

    const secondOutputDir = resolve(temporaryRoot, 'second-output')
    const secondResult = runExporter({ input: FIXTURE, outputDir: secondOutputDir })
    assert.equal(secondResult.status, 0, secondResult.stderr)
    assert.equal(
      await readFile(resolve(secondOutputDir, filenames[0]), 'utf8'),
      markdown,
    )
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
})

test('fails malformed non-null summary sections with the creative ID and section', async (t) => {
  const fixture = JSON.parse(await readFile(FIXTURE, 'utf8'))

  for (const section of [
    'adDescription',
    'hookOrHeadline',
    'creativeBreakdown',
    'messagingAndPositioning',
  ]) {
    await t.test(section, async () => {
      const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'creative-corpus-invalid-'))
      try {
        const malformed = structuredClone(fixture)
        malformed.creatives[0].summary[section] =
          section === 'adDescription' ? { unexpected: true } : '{not-valid-json'
        const input = resolve(temporaryRoot, 'input.json')
        const outputDir = resolve(temporaryRoot, 'output')
        await writeFile(input, JSON.stringify(malformed), 'utf8')

        const result = runExporter({ input, outputDir })
        assert.equal(result.status, 1)
        assert.match(result.stderr, /creative-static-ridge/u)
        assert.match(result.stderr, new RegExp(section))
        await assert.rejects(readdir(outputDir), { code: 'ENOENT' })
      } finally {
        await rm(temporaryRoot, { recursive: true, force: true })
      }
    })
  }
})
