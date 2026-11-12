import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  CreateDatabaseRequest,
  DatabaseQueryRequest,
  DatabaseQueryResult,
  DatabaseSchema,
  FqlQuery,
  FunctionDatabase,
  TestDatabaseResponse,
  UpdateDatabaseRequest,
} from '../types/databases.js'

/**
 * Databases a project connects for its Functions (`ctx.db.<name>`), the
 * query console and read-only MCP access. The connection is tested before
 * it is saved; credentials are encrypted at rest and never returned.
 *
 * @example
 * ```ts
 * const db = await tf.databases.create({
 *   name: 'shop',
 *   connectionString: process.env.SHOP_DATABASE_URL,
 *   access: 'READ_WRITE',
 *   mcpEnabled: true,
 * })
 * const { tables } = await tf.databases.schema(db.id)
 * const { rows } = await tf.databases.find(db.id, { find: 'orders', where: { total: { gte: 100 } }, limit: 20 })
 * ```
 */
export class DatabasesResource {
  constructor(private readonly http: HttpClient) {}

  async list(options?: RequestOptions): Promise<FunctionDatabase[]> {
    return this.http.get<FunctionDatabase[]>('/function-databases', undefined, options)
  }

  async get(databaseId: string, options?: RequestOptions): Promise<FunctionDatabase> {
    return this.http.get<FunctionDatabase>(`/function-databases/${databaseId}`, undefined, options)
  }

  async create(body: CreateDatabaseRequest, options?: RequestOptions): Promise<FunctionDatabase> {
    return this.http.post<FunctionDatabase>('/function-databases', body, options)
  }

  async update(databaseId: string, body: UpdateDatabaseRequest, options?: RequestOptions): Promise<FunctionDatabase> {
    return this.http.post<FunctionDatabase>(`/function-databases/${databaseId}`, body, options)
  }

  async delete(databaseId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/function-databases/${databaseId}`, options)
  }

  /** Re-test the stored connection. */
  async test(databaseId: string, options?: RequestOptions): Promise<TestDatabaseResponse> {
    return this.http.post<TestDatabaseResponse>(`/function-databases/${databaseId}/test`, {}, options)
  }

  /** Tables and columns. */
  async schema(databaseId: string, options?: RequestOptions): Promise<DatabaseSchema> {
    return this.http.get<DatabaseSchema>(`/function-databases/${databaseId}/schema`, undefined, options)
  }

  /** Run an FQL query or one parameterized SQL statement. Writes need `READ_WRITE` access. */
  async query<Row = Record<string, unknown>>(databaseId: string, body: DatabaseQueryRequest, options?: RequestOptions): Promise<DatabaseQueryResult<Row>> {
    return this.http.post<DatabaseQueryResult<Row>>(`/function-databases/${databaseId}/query`, body, options)
  }

  /** Shorthand for `query(id, { query })`. */
  async find<Row = Record<string, unknown>>(databaseId: string, query: FqlQuery, options?: RequestOptions): Promise<DatabaseQueryResult<Row>> {
    return this.query<Row>(databaseId, { query }, options)
  }

  /** Shorthand for `query(id, { sql, params })`. */
  async sql<Row = Record<string, unknown>>(databaseId: string, sql: string, params?: unknown[], options?: RequestOptions): Promise<DatabaseQueryResult<Row>> {
    return this.query<Row>(databaseId, { sql, params }, options)
  }
}
