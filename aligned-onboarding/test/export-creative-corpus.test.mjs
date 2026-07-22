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
const PROJECTION_START =
  '<!-- aligned-onboarding:account-context-projection:start -->'
const PROJECTION_END =
  '<!-- aligned-onboarding:account-context-projection:end -->'
const FILENAME = 'Ridge Static All Sections--creative-static-ridge.md'

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
    assert.deepEqual(filenames, [FILENAME])
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

test('merges an incomplete transcript retry without losing Motion enrichment or Account Context', async () => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'creative-corpus-merge-'))
  try {
    const outputDir = resolve(temporaryRoot, 'output')
    const initialInput = JSON.parse(await readFile(FIXTURE, 'utf8'))
    initialInput.creatives[0].format = 'video'
    const initialInputPath = resolve(temporaryRoot, 'initial-input.json')
    await writeFile(initialInputPath, JSON.stringify(initialInput), 'utf8')
    const initialResult = runExporter({ input: initialInputPath, outputDir })
    assert.equal(initialResult.status, 0, initialResult.stderr)

    const outputPath = resolve(outputDir, FILENAME)
    const initialMarkdown = await readFile(outputPath, 'utf8')
    const projectionStartIndex = initialMarkdown.indexOf(PROJECTION_START)
    const projectionEndIndex = initialMarkdown.indexOf(PROJECTION_END)
    assert.notEqual(projectionStartIndex, -1)
    assert.notEqual(projectionEndIndex, -1)

    const accountContextProjection = [
      PROJECTION_START,
      '## Account Context Projection',
      '',
      '### Naming Convention',
      '',
      '- NAMING_DECODER_SENTINEL: product=Ridge Wallet; angle=Minimalism',
      '',
      '### Spend State',
      '',
      '- CUSTOM_THRESHOLD_SENTINEL: hold from 4000 to 5000 account-context units',
      '- CUSTOM_SPEND_STATE_SENTINEL: 4200 is holding',
      PROJECTION_END,
    ].join('\n')
    await writeFile(
      outputPath,
      `${initialMarkdown.slice(0, projectionStartIndex)}${accountContextProjection}${initialMarkdown.slice(
        projectionEndIndex + PROJECTION_END.length,
      )}`,
      'utf8',
    )

    const scopedInput = structuredClone(initialInput)
    scopedInput.totalCount = 1
    scopedInput.providerTotalCount = 1
    delete scopedInput.creatives[0].summary
    delete scopedInput.creatives[0].glossaryTags
    scopedInput.creatives[0].transcript = {
      durationMs: 42000,
      language: 'en',
      status: 'completed',
      text: 'TRANSCRIPT_BACKFILL_SENTINEL: fully enriched scoped re-pull',
    }
    const scopedInputPath = resolve(temporaryRoot, 'scoped-input.json')
    await writeFile(scopedInputPath, JSON.stringify(scopedInput), 'utf8')

    const scopedResult = runExporter({ input: scopedInputPath, outputDir })
    assert.equal(scopedResult.status, 0, scopedResult.stderr)
    const mergedMarkdown = await readFile(outputPath, 'utf8')

    for (const sentinel of [
      'AD_DESCRIPTION_SENTINEL',
      'HOOK_SENTINEL',
      'STORYLINE_SENTINEL',
      'PRODUCT_FRAMING_SENTINEL',
      'PAIN_POINT_SENTINEL',
      'DESIRED_OUTCOME_SENTINEL',
      'FUNNEL_SENTINEL',
      'AUDIENCE_SENTINEL',
      'TAG_SENTINEL',
      'TRANSCRIPT_BACKFILL_SENTINEL',
      'NAMING_DECODER_SENTINEL',
      'CUSTOM_THRESHOLD_SENTINEL',
      'CUSTOM_SPEND_STATE_SENTINEL',
    ]) {
      assert.match(mergedMarkdown, new RegExp(sentinel))
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
})

test('refuses to overwrite an existing file without the Account Context projection block', async () => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'creative-corpus-authored-'))
  try {
    const outputDir = resolve(temporaryRoot, 'output')
    const initialResult = runExporter({ input: FIXTURE, outputDir })
    assert.equal(initialResult.status, 0, initialResult.stderr)

    const outputPath = resolve(outputDir, FILENAME)
    const authoredContent = [
      '---',
      'source_id: "creative-static-ridge"',
      '---',
      '',
      '# Authored creative',
      '',
      'NAMING_DECODER_SENTINEL',
      '',
    ].join('\n')
    await writeFile(outputPath, authoredContent, 'utf8')

    const result = runExporter({ input: FIXTURE, outputDir })
    assert.equal(result.status, 1)
    assert.match(result.stderr, new RegExp(FILENAME))
    assert.match(result.stderr, /account-context projection block/u)
    assert.equal(await readFile(outputPath, 'utf8'), authoredContent)
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
})

test('renames one stable source_id record and retains its Account Context projection', async () => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'creative-corpus-rename-'))
  try {
    const outputDir = resolve(temporaryRoot, 'output')
    const initialResult = runExporter({ input: FIXTURE, outputDir })
    assert.equal(initialResult.status, 0, initialResult.stderr)

    const initialPath = resolve(outputDir, FILENAME)
    const initialMarkdown = await readFile(initialPath, 'utf8')
    const projectionStartIndex = initialMarkdown.indexOf(PROJECTION_START)
    const projectionEndIndex = initialMarkdown.indexOf(PROJECTION_END)
    const projected = [
      PROJECTION_START,
      '## Account Context Projection',
      '',
      '### Naming Convention',
      '',
      '- RENAMED_PROJECTION_SENTINEL: decoded before representative-name drift',
      '',
      '### Spend State',
      '',
      '- CUSTOM_SPEND_STATE_SENTINEL: holding',
      PROJECTION_END,
    ].join('\n')
    await writeFile(
      initialPath,
      `${initialMarkdown.slice(0, projectionStartIndex)}${projected}${initialMarkdown.slice(
        projectionEndIndex + PROJECTION_END.length,
      )}`,
      'utf8',
    )

    const renamedInput = JSON.parse(await readFile(FIXTURE, 'utf8'))
    renamedInput.creatives[0].adName = 'Ridge Static Renamed'
    const renamedInputPath = resolve(temporaryRoot, 'renamed-input.json')
    await writeFile(renamedInputPath, JSON.stringify(renamedInput), 'utf8')

    const renameResult = runExporter({ input: renamedInputPath, outputDir })
    assert.equal(renameResult.status, 0, renameResult.stderr)
    const renamedFilename = 'Ridge Static Renamed--creative-static-ridge.md'
    assert.deepEqual(await readdir(outputDir), [renamedFilename])
    const renamedMarkdown = await readFile(
      resolve(outputDir, renamedFilename),
      'utf8',
    )
    assert.match(renamedMarkdown, /RENAMED_PROJECTION_SENTINEL/u)
    assert.match(renamedMarkdown, /CUSTOM_SPEND_STATE_SENTINEL/u)
    assert.match(renamedMarkdown, /source_id: "creative-static-ridge"/u)
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
})

test('fails a source_id rename before writing when the destination is owned', async () => {
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), 'creative-corpus-collision-'))
  try {
    const outputDir = resolve(temporaryRoot, 'output')
    const initialResult = runExporter({ input: FIXTURE, outputDir })
    assert.equal(initialResult.status, 0, initialResult.stderr)

    const initialPath = resolve(outputDir, FILENAME)
    const initialMarkdown = await readFile(initialPath, 'utf8')
    const collisionFilename = 'Ridge Static Renamed--creative-static-ridge.md'
    const collisionPath = resolve(outputDir, collisionFilename)
    const collisionContent = initialMarkdown
      .replace('source_id: "creative-static-ridge"', 'source_id: "other-creative"')
      .replace('# Ridge Static All Sections', '# Other creative')
    await writeFile(collisionPath, collisionContent, 'utf8')

    const renamedInput = JSON.parse(await readFile(FIXTURE, 'utf8'))
    renamedInput.creatives[0].adName = 'Ridge Static Renamed'
    const renamedInputPath = resolve(temporaryRoot, 'renamed-input.json')
    await writeFile(renamedInputPath, JSON.stringify(renamedInput), 'utf8')

    const result = runExporter({ input: renamedInputPath, outputDir })
    assert.equal(result.status, 1)
    assert.match(result.stderr, /destination is already owned by other-creative/u)
    assert.equal(await readFile(initialPath, 'utf8'), initialMarkdown)
    assert.equal(await readFile(collisionPath, 'utf8'), collisionContent)
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
