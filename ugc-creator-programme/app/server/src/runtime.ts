import { AsyncLocalStorage } from 'node:async_hooks'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

export type BuildethRuntimeContext = Readonly<{
  appRoot: string
  workspaceId: string | null
  conversationId: string
  requestId: string
  backendApiUrl: string | null
  authToken: string | null
  sandboxAgentApiUrl: string
}>

export type BuildethCliName = 'app'

export type BuildethCliInput = Readonly<{
  cli: BuildethCliName
  args: readonly string[]
  cwd?: string
  env?: NodeJS.ProcessEnv
  maxBuffer?: number
}>

export type BuildethCliInvocation = Readonly<{
  command: BuildethCliName
  args: readonly string[]
  cwd: string
  env: NodeJS.ProcessEnv
  maxBuffer: number
}>

export type BuildethCliResult = Readonly<{
  stdout: string
  stderr: string
}>

type ExecFileErrorWithOutput = Error & {
  code?: number | string | null
  stderr?: string | Buffer
  stdout?: string | Buffer
}

const runtimeStorage = new AsyncLocalStorage<BuildethRuntimeContext>()
const execFileAsync = promisify(execFile)
const DEFAULT_MAX_BUFFER_BYTES = 10 * 1024 * 1024

const readProcessOutput = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }

  if (value instanceof Buffer) {
    return value.toString('utf8')
  }

  return ''
}

export const runWithBuildethRuntime = async <T>(
  runtime: BuildethRuntimeContext,
  fn: () => Promise<T>
): Promise<T> => {
  return await new Promise<T>((resolve, reject) => {
    runtimeStorage.run(runtime, () => {
      fn().then(resolve).catch(reject)
    })
  })
}

export const getBuildethRuntime = (): BuildethRuntimeContext => {
  const runtime = runtimeStorage.getStore()
  if (!runtime) {
    throw new Error('Buildeth runtime is not available')
  }

  return runtime
}

const resolveBuildethCliEnv = (
  runtime: BuildethRuntimeContext,
  envOverrides?: NodeJS.ProcessEnv
): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...(envOverrides ?? {}),
  }

  env.CONVERSATION_ID = runtime.conversationId

  if (runtime.workspaceId !== null) {
    env.WORKSPACE_ID = runtime.workspaceId
    env.CLAUDE_CODE_SESSION_ID = `${runtime.workspaceId}:${runtime.conversationId}`
  } else {
    delete env.WORKSPACE_ID
    delete env.CLAUDE_CODE_SESSION_ID
  }

  return env
}

export const buildBuildethCliInvocation = (
  input: BuildethCliInput,
  runtime: BuildethRuntimeContext = getBuildethRuntime()
): BuildethCliInvocation => {
  return {
    command: input.cli,
    args: [...input.args],
    cwd: input.cwd ?? runtime.appRoot,
    env: resolveBuildethCliEnv(runtime, input.env),
    maxBuffer: input.maxBuffer ?? DEFAULT_MAX_BUFFER_BYTES,
  }
}

export const execBuildethCli = async (
  input: BuildethCliInput,
  runtime: BuildethRuntimeContext = getBuildethRuntime()
): Promise<BuildethCliResult> => {
  const invocation = buildBuildethCliInvocation(input, runtime)

  try {
    const result = await execFileAsync(invocation.command, [...invocation.args], {
      cwd: invocation.cwd,
      env: invocation.env,
      encoding: 'utf8',
      maxBuffer: invocation.maxBuffer,
    })

    return {
      stdout: result.stdout,
      stderr: result.stderr,
    }
  } catch (error) {
    const processError = error as ExecFileErrorWithOutput
    const stdout = readProcessOutput(processError.stdout)
    const stderr = readProcessOutput(processError.stderr)
    const suffix = [stdout.trim() && `stdout: ${stdout.trim()}`, stderr.trim() && `stderr: ${stderr.trim()}`]
      .filter((value) => Boolean(value))
      .join('\n')
    const message = suffix.length > 0 ? `${processError.message}\n${suffix}` : processError.message
    const enrichedError = new Error(message)
    ;(enrichedError as ExecFileErrorWithOutput).code = processError.code
    ;(enrichedError as ExecFileErrorWithOutput).stdout = stdout
    ;(enrichedError as ExecFileErrorWithOutput).stderr = stderr
    throw enrichedError
  }
}
