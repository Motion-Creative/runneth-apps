#!/usr/bin/env node

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const DEFAULT_OUTPUT_DIR = '/agent/brain/meta/creatives'
const ACCOUNT_CONTEXT_PROJECTION_START =
  '<!-- aligned-onboarding:account-context-projection:start -->'
const ACCOUNT_CONTEXT_PROJECTION_END =
  '<!-- aligned-onboarding:account-context-projection:end -->'
const STRUCTURED_SUMMARY_SECTIONS = [
  'hookOrHeadline',
  'creativeBreakdown',
  'messagingAndPositioning',
]
const SUMMARY_SECTIONS = ['adDescription', ...STRUCTURED_SUMMARY_SECTIONS]

const usage = String.raw`Usage:
  node export-creative-corpus.mjs \
    --input <motion-meta-insights.json> \
    --workspace-id <workspace-id> \
    --brand <brand-or-account> \
    [--output-dir ${DEFAULT_OUTPUT_DIR}]
`

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const fail = (message) => {
  throw new Error(message)
}

const parseArgs = (argv) => {
  const options = {
    outputDir: DEFAULT_OUTPUT_DIR,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help') {
      process.stdout.write(usage)
      process.exit(0)
    }

    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) {
      fail(`${argument}: expected a value`)
    }

    if (argument === '--brand') {
      options.brand = value
    } else if (argument === '--input') {
      options.input = value
    } else if (argument === '--output-dir') {
      options.outputDir = value
    } else if (argument === '--workspace-id') {
      options.workspaceId = value
    } else {
      fail(`Unknown argument: ${argument}`)
    }
    index += 1
  }

  for (const [name, value] of [
    ['--brand', options.brand],
    ['--input', options.input],
    ['--output-dir', options.outputDir],
    ['--workspace-id', options.workspaceId],
  ]) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      fail(`${name}: required`)
    }
  }

  return options
}

const parseInput = async (path) => {
  const raw = await readFile(path, 'utf8')
  let input
  try {
    input = JSON.parse(raw)
  } catch (error) {
    fail(`${path}: invalid JSON (${error.message})`)
  }

  if (!isRecord(input) || !Array.isArray(input.creatives)) {
    fail(`${path}: expected an object with a creatives array`)
  }
  return input
}

const requireCreativeId = (creative, index) => {
  if (!isRecord(creative)) {
    fail(`creatives[${index}]: expected an object`)
  }
  if (typeof creative.id !== 'string' || creative.id.trim().length === 0) {
    fail(`creatives[${index}].id: expected a non-empty string`)
  }
  return creative.id.trim()
}

const readSummarySections = (creative, creativeId) => {
  if (creative.summary === undefined || creative.summary === null) {
    return Object.fromEntries(SUMMARY_SECTIONS.map((section) => [section, null]))
  }
  if (!isRecord(creative.summary)) {
    fail(`Creative ${creativeId} summary: expected an object or null`)
  }

  const sections = {}
  for (const section of SUMMARY_SECTIONS) {
    const value = creative.summary[section]
    if (value === undefined || value === null) {
      sections[section] = null
      continue
    }
    if (typeof value !== 'string' || value.trim().length === 0) {
      fail(`Creative ${creativeId} summary.${section}: expected a non-empty string or null`)
    }

    if (section === 'adDescription') {
      sections[section] = value
      continue
    }

    let parsed
    try {
      parsed = JSON.parse(value)
    } catch (error) {
      fail(`Creative ${creativeId} summary.${section}: invalid JSON (${error.message})`)
    }
    if (!isRecord(parsed) && !Array.isArray(parsed)) {
      fail(`Creative ${creativeId} summary.${section}: expected stringified object or array`)
    }
    sections[section] = parsed
  }
  return sections
}

const safeFileComponent = (value) => {
  const safe = value
    .normalize('NFKC')
    .replaceAll('/', '-')
    .replaceAll('\\', '-')
    .replace(/[\u0000-\u001f\u007f<>:"|?*]/gu, '-')
    .replace(/\s+/gu, ' ')
    .replace(/-+/gu, '-')
    .replace(/^[. ]+|[. ]+$/gu, '')
  return safe.length > 0 ? safe.slice(0, 120) : 'creative'
}

const compareStrings = (left, right) => (left < right ? -1 : left > right ? 1 : 0)

const yamlString = (value) => JSON.stringify(value)

const displayValue = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'Not returned by Motion'
  }
  if (typeof value === 'string') {
    return value
  }
  return JSON.stringify(value)
}

const renderStructuredValue = (value) => {
  if (value === undefined || value === null) {
    return 'Not returned by Motion.'
  }
  return JSON.stringify(value, null, 2)
    .split('\n')
    .map((line) => `    ${line}`)
    .join('\n')
}

const renderDefaultAccountContextProjection = (creative) =>
  [
    ACCOUNT_CONTEXT_PROJECTION_START,
    '## Account Context Projection',
    '',
    '### Naming Convention',
    '',
    `- Raw ad name: ${displayValue(creative.adName)}`,
    '- Decoded naming: Not projected yet',
    '',
    '### Spend State',
    '',
    `- Motion-reported seed: ${displayValue(creative.spendState)}`,
    '- Account Context result: Not projected yet',
    ACCOUNT_CONTEXT_PROJECTION_END,
  ].join('\n')

const extractAccountContextProjection = (content, filename) => {
  const startIndex = content.indexOf(ACCOUNT_CONTEXT_PROJECTION_START)
  const endIndex = content.indexOf(ACCOUNT_CONTEXT_PROJECTION_END)
  const hasDuplicateStart =
    startIndex !== -1 &&
    content.indexOf(
      ACCOUNT_CONTEXT_PROJECTION_START,
      startIndex + ACCOUNT_CONTEXT_PROJECTION_START.length,
    ) !== -1
  const hasDuplicateEnd =
    endIndex !== -1 &&
    content.indexOf(
      ACCOUNT_CONTEXT_PROJECTION_END,
      endIndex + ACCOUNT_CONTEXT_PROJECTION_END.length,
    ) !== -1

  if (
    startIndex === -1 ||
    endIndex === -1 ||
    endIndex < startIndex ||
    hasDuplicateStart ||
    hasDuplicateEnd
  ) {
    fail(
      `${filename}: existing file must contain exactly one complete account-context projection block`,
    )
  }

  return content.slice(
    startIndex,
    endIndex + ACCOUNT_CONTEXT_PROJECTION_END.length,
  )
}

const replaceAccountContextProjection = (content, projection, filename) => {
  const startIndex = content.indexOf(ACCOUNT_CONTEXT_PROJECTION_START)
  const endIndex = content.indexOf(ACCOUNT_CONTEXT_PROJECTION_END)
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    fail(`${filename}: generated file is missing its account-context projection block`)
  }
  return `${content.slice(0, startIndex)}${projection}${content.slice(
    endIndex + ACCOUNT_CONTEXT_PROJECTION_END.length,
  )}`
}

const renderCreative = (creative, creativeId, options) => {
  const name =
    typeof creative.adName === 'string' && creative.adName.trim().length > 0
      ? creative.adName.trim()
      : creativeId
  const summary = readSummarySections(creative, creativeId)
  const frontmatter = [
    '---',
    `title: ${yamlString(name)}`,
    `brand: ${yamlString(options.brand)}`,
    `workspace: ${yamlString(options.workspaceId)}`,
    `source_id: ${yamlString(creativeId)}`,
    ...(typeof creative.launchDate === 'string' && creative.launchDate.trim().length > 0
      ? [`event_at: ${yamlString(creative.launchDate.trim())}`]
      : []),
    ...(typeof creative.format === 'string' && creative.format.trim().length > 0
      ? [`format: ${yamlString(creative.format.trim())}`]
      : []),
    '---',
  ]
  const activeStatus =
    typeof creative.isActive === 'boolean'
      ? creative.isActive
        ? 'Active'
        : 'Inactive'
      : undefined
  const identity = [
    `- Motion ID: ${creativeId}`,
    `- Format: ${displayValue(creative.format)}`,
    `- Launch Date: ${displayValue(creative.launchDate)}`,
    `- Status: ${displayValue(activeStatus)}`,
    `- Campaign: ${displayValue(creative.campaignName)}`,
    `- Ad Set: ${displayValue(creative.adsetName)}`,
    `- Ad: ${displayValue(creative.adName)}`,
  ]

  const content = [
    ...frontmatter,
    '',
    `# ${name}`,
    '',
    '## Identity',
    '',
    ...identity,
    '',
    renderDefaultAccountContextProjection(creative),
    '',
    '## Ad Description',
    '',
    summary.adDescription ?? 'Not returned by Motion.',
    '',
    '## Hook or Headline',
    '',
    renderStructuredValue(summary.hookOrHeadline),
    '',
    '## Creative Breakdown',
    '',
    renderStructuredValue(summary.creativeBreakdown),
    '',
    '## Messaging and Positioning',
    '',
    renderStructuredValue(summary.messagingAndPositioning),
    '',
    '## Transcript',
    '',
    renderStructuredValue(creative.transcript),
    '',
    '## AI Tags (Motion Glossary)',
    '',
    renderStructuredValue(creative.glossaryTags),
    '',
  ].join('\n')

  return {
    content,
    filename: `${safeFileComponent(name)}--${safeFileComponent(creativeId)}.md`,
  }
}

const buildFiles = (input, options) => {
  const files = input.creatives.map((creative, index) => {
    const creativeId = requireCreativeId(creative, index)
    return {
      creativeId,
      ...renderCreative(creative, creativeId, options),
    }
  })

  files.sort((left, right) => {
    const filenameOrder = compareStrings(left.filename, right.filename)
    return filenameOrder !== 0
      ? filenameOrder
      : compareStrings(left.creativeId, right.creativeId)
  })

  const ownersByFilename = new Map()
  for (const file of files) {
    const existingOwner = ownersByFilename.get(file.filename)
    if (existingOwner !== undefined) {
      fail(
        `Creatives ${existingOwner} and ${file.creativeId} resolve to the same filename: ${file.filename}`,
      )
    }
    ownersByFilename.set(file.filename, file.creativeId)
  }
  return files
}

const prepareFiles = async (files, outputDir) => {
  const prepared = []
  for (const file of files) {
    const destination = join(outputDir, file.filename)
    let existingContent
    try {
      existingContent = await readFile(destination, 'utf8')
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }

    if (existingContent === undefined) {
      prepared.push(file)
      continue
    }

    const projection = extractAccountContextProjection(
      existingContent,
      file.filename,
    )
    prepared.push({
      ...file,
      content: replaceAccountContextProjection(
        file.content,
        projection,
        file.filename,
      ),
    })
  }
  return prepared
}

const writeFiles = async (files, outputDir) => {
  await mkdir(outputDir, { recursive: true })
  for (const [index, file] of files.entries()) {
    const destination = join(outputDir, file.filename)
    const temporary = join(outputDir, `.${file.filename}.${process.pid}.${index}.tmp`)
    await writeFile(temporary, file.content, { encoding: 'utf8', flag: 'wx' })
    await rename(temporary, destination)
  }
}

const main = async () => {
  const options = parseArgs(process.argv.slice(2))
  const input = await parseInput(options.input)
  const files = buildFiles(input, options)
  const preparedFiles = await prepareFiles(files, options.outputDir)
  await writeFiles(preparedFiles, options.outputDir)
  process.stdout.write(
    `${JSON.stringify({ exportedCount: files.length, files: files.map((file) => file.filename) })}\n`,
  )
}

main().catch((error) => {
  process.stderr.write(`Error: ${error.message}\n`)
  process.exitCode = 1
})
