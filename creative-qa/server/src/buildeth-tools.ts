import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type { BuildethRuntimeContext } from './runtime.js'

export type BuildethRuntimeToolsContext = Readonly<{
  appRoot?: string | null
  auth: Readonly<{ token: string }>
  backendApiUrl: string
  conversationId: string
  requestId: string
  sandboxAgentApiUrl?: string | null
  workspaceId: string
}>

export type BuildethMotionTools = Readonly<Record<string, (input: unknown) => Promise<unknown>>>
export type BuildethMemoryTools = Readonly<Record<string, (input: unknown) => Promise<unknown>>>
export type BuildethReminderTools = Readonly<Record<string, (input: unknown) => Promise<unknown>>>

export type BuildethRuntimeToolsModule = Readonly<{
  memory: BuildethMemoryTools
  motion: BuildethMotionTools
  reminder: BuildethReminderTools
  runWithBuildethRuntimeToolsContext: <T>(
    context: BuildethRuntimeToolsContext,
    fn: () => Promise<T>
  ) => Promise<T>
}>

const DEFAULT_RUNTIME_TOOLS_BUNDLE_PATH = '/opt/agent/buildeth-runtime-tools.js'

const resolveRuntimeToolsBundlePath = (): string => {
  const configuredPath = process.env.BUILDETH_RUNTIME_TOOLS_BUNDLE_PATH?.trim()
  if (!configuredPath) { return DEFAULT_RUNTIME_TOOLS_BUNDLE_PATH }
  return path.isAbsolute(configuredPath) ? configuredPath : path.resolve(configuredPath)
}

export const loadBuildethRuntimeTools = async (): Promise<BuildethRuntimeToolsModule> => {
  const bundlePath = resolveRuntimeToolsBundlePath()
  const moduleUrl = pathToFileURL(bundlePath).href
  return (await import(moduleUrl)) as BuildethRuntimeToolsModule
}

const requireRuntimeValue = (value: string | null, message: string): string => {
  if (value === null) { throw new Error(message) }
  return value
}

const toRuntimeToolsContext = (runtime: BuildethRuntimeContext): BuildethRuntimeToolsContext => {
  return {
    appRoot: runtime.appRoot,
    auth: {
      get token(): string {
        return requireRuntimeValue(runtime.authToken, 'Buildeth runtime backend auth is required for runtime tools')
      },
    },
    get backendApiUrl(): string {
      return requireRuntimeValue(runtime.backendApiUrl, 'Buildeth runtime backend auth is required for runtime tools')
    },
    conversationId: runtime.conversationId,
    requestId: runtime.requestId,
    sandboxAgentApiUrl: runtime.sandboxAgentApiUrl,
    get workspaceId(): string {
      return requireRuntimeValue(runtime.workspaceId, 'Buildeth runtime workspaceId is required for runtime tools')
    },
  }
}

export const runWithBuildethToolRuntime = async <T>(
  runtime: BuildethRuntimeContext,
  fn: () => Promise<T>
): Promise<T> => {
  const runtimeTools = await loadBuildethRuntimeTools()
  return await runtimeTools.runWithBuildethRuntimeToolsContext(toRuntimeToolsContext(runtime), fn)
}

export const loadBuildethMotionTools = async (): Promise<BuildethMotionTools> => {
  return (await loadBuildethRuntimeTools()).motion
}

export const loadBuildethMemoryTools = async (): Promise<BuildethMemoryTools> => {
  return (await loadBuildethRuntimeTools()).memory
}

export const loadBuildethReminderTools = async (): Promise<BuildethReminderTools> => {
  return (await loadBuildethRuntimeTools()).reminder
}
