#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { buildRoutinePrompt, parseRoutinePromptConfig } from './build-routine-prompt.mjs'

const assertLiteral = (value, field) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} requires a non-empty value`)
  }
  if (/[\r\n]/u.test(value)) {
    throw new Error(`${field} must be a single-line literal`)
  }
  return value.trim()
}

const assertConversationId = (value) => {
  const conversationId = assertLiteral(value, 'conversationId')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(conversationId)) {
    throw new Error('conversationId must be a canonical lowercase UUID')
  }
  return conversationId
}

const assertRecord = (value, field) => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${field} must be an object`)
  }
  return value
}

const assertExactKeys = (record, allowedKeys, field) => {
  const unknownKeys = Object.keys(record).filter((key) => !allowedKeys.includes(key))
  if (unknownKeys.length > 0) {
    throw new Error(`${field} contains unknown field: ${unknownKeys[0]}`)
  }
}

export const parseRoutineAddConfig = (value) => {
  const config = assertRecord(value, 'config')
  assertExactKeys(
    config,
    [
      'conversationId',
      'credential',
      'platform',
      'platformDisplayName',
      'sliceFilter',
      'workspace',
      'workspaceDisplayName',
      'workspaceId',
    ],
    'config',
  )

  return {
    conversationId: assertConversationId(config.conversationId),
    platformDisplayName: assertLiteral(config.platformDisplayName, 'platformDisplayName'),
    promptConfig: parseRoutinePromptConfig({
      credential: config.credential,
      platform: config.platform,
      ...(config.sliceFilter === undefined ? {} : { sliceFilter: config.sliceFilter }),
      workspace: config.workspace,
      workspaceId: config.workspaceId,
    }),
    workspaceDisplayName: assertLiteral(config.workspaceDisplayName, 'workspaceDisplayName'),
  }
}

const buildRoutineAddSpec = ({
  conversationId,
  platformDisplayName,
  promptConfig,
  workspaceDisplayName,
}) => {
  const { platform, workspace, workspaceId } = promptConfig
  const delivery = `Daily incremental success: no notification - the deliverable is the files under /agent/brain/${workspace}/data-sources/voc/${platform}/. On the first fully covered backfill across any VoC source sync for Motion workspace id ${workspaceId}, if /agent/brain/${workspace}/_changelog.md does not already contain a voc-audit-offer entry, send one brief note to web conversation ${conversationId}: name the source that finished, say the customer voice is ready, and offer a Voice of Customer Audit by previewing the plan in your own words - it will separate every entry by product, score each 1-5 for usefulness, and break the strong ones into five buckets (pain points, trigger moments, objections, transformations, standout language) plus personas per qualifying product - then ask whether they'd like anything added or have existing docs (like personas) to use as reference. Then append a dated voc-audit-offer entry to /agent/brain/${workspace}/_changelog.md. Never run the audit without a person's yes. If the run fails, the pinned account is disconnected, or coverage is incomplete, send a brief note to the same conversation with conversation send --to ${conversationId}.`

  return {
    delivery,
    name: `${platformDisplayName} sync — ${workspaceDisplayName}`,
    prompt: buildRoutinePrompt(promptConfig),
    schedule: {
      end: { type: 'never' },
      expression: '0 6 * * *',
      type: 'cron',
    },
  }
}

export const buildRoutineAddArgs = (config) => {
  const spec = buildRoutineAddSpec(config)
  return [
    'add',
    '--name',
    spec.name,
    '--delivery',
    spec.delivery,
    '--prompt',
    spec.prompt,
    '--cron',
    spec.schedule.expression,
  ]
}

const parseRoutineCommandResult = (result, command) => {
  if (result.error !== undefined) {
    throw result.error
  }
  if (result.signal !== null) {
    throw new Error(`routine ${command} stopped by signal ${result.signal}`)
  }
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim()
    throw new Error(`routine ${command} failed${detail.length === 0 ? '' : `: ${detail}`}`)
  }

  let parsed
  try {
    parsed = JSON.parse(result.stdout)
  } catch {
    throw new Error(`routine ${command} returned invalid JSON`)
  }
  const response = assertRecord(parsed, `routine ${command} result`)
  return assertRecord(response.routine, `routine ${command} result.routine`)
}

const runRoutineCommand = (args) => {
  return spawnSync('routine', args, {
    encoding: 'utf8',
    shell: false,
  })
}

const assertStoredRoutine = (routine, expected) => {
  const routineId = assertLiteral(routine.routineId, 'stored routineId')
  const mismatches = [
    ['name', routine.name, expected.name],
    ['delivery', routine.delivery, expected.delivery],
    ['prompt', routine.prompt, expected.prompt],
  ].filter(([, actual, wanted]) => actual !== wanted)

  const schedule = assertRecord(routine.schedule, 'stored routine schedule')
  if (
    schedule.type !== 'cron' ||
    schedule.expression !== expected.schedule.expression ||
    JSON.stringify(schedule.end) !== JSON.stringify(expected.schedule.end)
  ) {
    mismatches.push(['schedule', schedule, expected.schedule])
  }

  if (mismatches.length > 0) {
    throw new Error(
      `routine inspect did not match the generated ${mismatches.map(([field]) => field).join(', ')}`,
    )
  }
  return routineId
}

export const addAndVerifyRoutine = (config) => {
  const expected = buildRoutineAddSpec(config)
  const args = buildRoutineAddArgs(config)
  const addedRoutine = parseRoutineCommandResult(runRoutineCommand(args), 'add')
  const routineId = assertStoredRoutine(addedRoutine, expected)
  const inspectedRoutine = parseRoutineCommandResult(
    runRoutineCommand(['inspect', '--id', routineId]),
    'inspect',
  )
  assertStoredRoutine(inspectedRoutine, expected)
  return inspectedRoutine
}

const readInputPath = (argv) => {
  if (argv.length !== 2 || argv[0] !== '--input') {
    throw new Error('Usage: add-routine.mjs --input <structured-json-file>')
  }
  return argv[1]
}

const isDirectExecution =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectExecution) {
  try {
    const inputPath = readInputPath(process.argv.slice(2))
    const config = parseRoutineAddConfig(JSON.parse(readFileSync(inputPath, 'utf8')))
    process.stdout.write(`${JSON.stringify({ routine: addAndVerifyRoutine(config) }, null, 2)}\n`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stderr.write(`Unable to add VoC routine: ${message}\n`)
    process.exitCode = 1
  }
}
