import type { BaseModel } from './common.js'

export type DatabaseAccess = 'READ_ONLY' | 'READ_WRITE'
export type DatabaseSslMode = 'disable' | 'require' | 'verify-full'

/** A database connected to a project. Credentials are write-only and never returned. */
export interface FunctionDatabase extends BaseModel {
  projectId: string
  /** Identifier used in function code: `ctx.db.<name>`. */
  name: string
  displayName: string
  type: 'POSTGRES'
  host: string
  port: number
  databaseName: string
  username: string
  ssl: string
  access: DatabaseAccess
  /** Reachable read-only by AI agents through the project MCP server (`db_list`, `db_schema`, `db_query`). */
  mcpEnabled: boolean
  lastTestedAt: string | null
  lastTestError: string | null
}

interface DatabaseConnectionFields {
  /** `postgres://user:password@host:5432/database?sslmode=require` */
  connectionString?: string
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
  ssl?: DatabaseSslMode
}

export interface CreateDatabaseRequest extends DatabaseConnectionFields {
  name: string
  displayName?: string
  type?: 'POSTGRES'
  access?: DatabaseAccess
  mcpEnabled?: boolean
}

/** A blank or omitted password keeps the stored one. */
export type UpdateDatabaseRequest = Partial<CreateDatabaseRequest>

export interface TestDatabaseResponse {
  ok: boolean
  error: string | null
  serverVersion?: string
}

export interface DatabaseSchema {
  tables: Array<{
    schema: string
    name: string
    columns: Array<{ name: string; type: string; nullable: boolean }>
  }>
  truncated: boolean
}

/** FQL condition value: a literal or an operator object such as `{ gte: 100 }`. */
export type FqlWhere = Record<string, unknown>

/**
 * FQL — a JSON query language compiled to parameterized SQL.
 * `update` and `delete` require `where`; `limit` is capped at 1000.
 */
export type FqlQuery =
  | { find: string; select?: string[]; where?: FqlWhere; orderBy?: string | string[]; limit?: number; offset?: number }
  | { count: string; where?: FqlWhere }
  | { insert: string; values: Record<string, unknown> | Array<Record<string, unknown>>; returning?: string[] }
  | { update: string; set: Record<string, unknown>; where: FqlWhere; returning?: string[] }
  | { delete: string; where: FqlWhere; returning?: string[] }

export interface DatabaseQueryRequest {
  query?: FqlQuery
  /** One parameterized SQL statement: `select * from t where id = $1`. */
  sql?: string
  params?: unknown[]
}

export interface DatabaseQueryResult<Row = Record<string, unknown>> {
  rows: Row[]
  rowCount: number
  fields: string[]
  truncated: boolean
}
