type MountedAppPaths = Readonly<{
  apiBasePath: string
  basePath: string
}>

const normalizeMountedPath = (rawPath: string): string => {
  const normalizedPath = new URL(rawPath, window.location.origin).pathname
  if (normalizedPath === '/') {
    return '/'
  }

  return normalizedPath.replace(/\/+$/, '')
}

const resolveApiBasePath = (basePath: string): string => {
  return basePath === '/' ? '/api' : `${basePath}/api`
}

export const readMountedAppPaths = (): MountedAppPaths => {
  const href = document.querySelector('base')?.getAttribute('href')
  if (href === null || typeof href === 'undefined') {
    throw new Error('Missing app base tag')
  }

  const basePath = normalizeMountedPath(href)
  return {
    apiBasePath: resolveApiBasePath(basePath),
    basePath,
  }
}
