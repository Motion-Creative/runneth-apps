import { chmodSync } from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import { getBuildethRuntime } from './runtime.js'

type SqliteInfo = Readonly<{
  path: string
  version: string
}>

const sqliteDatabaseByPath = new Map<string, DatabaseSync>()
const SQLITE_FILE_MODE = 0o664

const resolveSqlitePath = (): string => {
  return path.join(getBuildethRuntime().appRoot, 'app.sqlite')
}

const ensureSqliteFileMode = (sqlitePath: string): void => {
  chmodSync(sqlitePath, SQLITE_FILE_MODE)
}

export const getSqlite = (): DatabaseSync => {
  const sqlitePath = resolveSqlitePath()
  const existing = sqliteDatabaseByPath.get(sqlitePath)
  if (existing !== undefined) {
    return existing
  }

  const created = new DatabaseSync(sqlitePath)
  ensureSqliteFileMode(sqlitePath)
  sqliteDatabaseByPath.set(sqlitePath, created)
  return created
}

const resolveSqliteVersion = (): string => {
  const row = getSqlite().prepare('SELECT sqlite_version() AS version').get()
  if (!row || typeof row !== 'object') {
    throw new Error('Invalid SQLite version response')
  }

  const value = row['version']
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('SQLite version value is missing')
  }

  return value
}

export const getSqliteInfo = (): SqliteInfo => {
  return {
    path: resolveSqlitePath(),
    version: resolveSqliteVersion(),
  }
}

export const sqlite: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_target, property): unknown {
    const database = getSqlite()
    const value = Reflect.get(database as object, property)
    if (typeof value !== 'function') {
      return value
    }

    return (...args: readonly unknown[]): unknown => {
      return Reflect.apply(value as Function, database, args)
    }
  },
}) as DatabaseSync
