import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions, SeekPage } from '../core/types.js'
import { ThinkFleetError } from '../core/errors.js'
import type {
  CreateFunctionRequest,
  FlobyteFunction,
  FunctionRun,
  InvokeFunctionOptions,
  InvokeFunctionResult,
  RotateFunctionKeyResponse,
  RunFunctionResponse,
  TestFunctionRequest,
  UpdateFunctionRequest,
} from '../types/functions.js'

/**
 * Functions — your own code, run in a sandbox, exposed as an API, a flow step
 * and an MCP tool.
 *
 * Code gets a `ctx` with the databases bound to the function
 * (`ctx.db.<name>.find/insert/update/query/sql`), `ctx.fetch` (public
 * internet only) and `ctx.sleep`. It has no filesystem, environment or
 * private network access.
 *
 * @example
 * ```ts
 * const fn = await tf.functions.create({
 *   name: 'top-customers',
 *   databases: ['shop'],
 *   inputs: { limit: 'number' },
 *   publicEnabled: true,
 *   sourceCode: {
 *     packageJson: '{}',
 *     code: `export default async ({ limit = 10 }, ctx) =>
 *       ctx.db.shop.find('customers', { orderBy: '-lifetime_value', limit })`,
 *   },
 * })
 * const { apiKey } = await tf.functions.rotateKey(fn.id)   // fnk_..., shown once
 * const top = await tf.functions.invoke(fn.id, { limit: 5 }, { key: apiKey })
 * ```
 */
export class FunctionsResource {
  constructor(private readonly http: HttpClient) {}

  async list(options?: RequestOptions): Promise<SeekPage<FlobyteFunction>> {
    return this.http.get<SeekPage<FlobyteFunction>>('/functions', undefined, options)
  }

  async get(functionId: string, options?: RequestOptions): Promise<FlobyteFunction> {
    return this.http.get<FlobyteFunction>(`/functions/${functionId}`, undefined, options)
  }

  async create(body: CreateFunctionRequest, options?: RequestOptions): Promise<FlobyteFunction> {
    return this.http.post<FlobyteFunction>('/functions', body, options)
  }

  /** Saving new code bumps `version`. */
  async update(functionId: string, body: UpdateFunctionRequest, options?: RequestOptions): Promise<FlobyteFunction> {
    return this.http.post<FlobyteFunction>(`/functions/${functionId}`, body, options)
  }

  async delete(functionId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/functions/${functionId}`, options)
  }

  /**
   * Run a saved function with your API key. Resolves with `success: false`
   * (and an `errorCode`) when the code fails; it does not throw for that.
   */
  async run<T = unknown>(functionId: string, input?: Record<string, unknown>, options?: RequestOptions): Promise<RunFunctionResponse<T>> {
    return this.http.post<RunFunctionResponse<T>>(`/functions/${functionId}/run`, { input: input ?? {} }, options)
  }

  /** Run unsaved code, e.g. from an editor or a coding agent, without creating a function. */
  async test<T = unknown>(body: TestFunctionRequest, options?: RequestOptions): Promise<RunFunctionResponse<T>> {
    return this.http.post<RunFunctionResponse<T>>('/functions/test', body, options)
  }

  /** Recent runs, newest first. */
  async listRuns(functionId: string, params?: { limit?: number }, options?: RequestOptions): Promise<FunctionRun[]> {
    return this.http.get<FunctionRun[]>(`/functions/${functionId}/runs`, params, options)
  }

  /** Issue a new `fnk_` key for the public endpoint. The previous key stops working. */
  async rotateKey(functionId: string, options?: RequestOptions): Promise<RotateFunctionKeyResponse> {
    return this.http.post<RotateFunctionKeyResponse>(`/functions/${functionId}/rotate-key`, {}, options)
  }

  /** Public endpoint URL: `POST` with a JSON body or `GET` with a query string. */
  publicUrl(functionId: string, baseUrl?: string): string {
    return `${(baseUrl ?? this.http.baseUrl).replace(/\/+$/, '')}/api/v1/fn/${encodeURIComponent(functionId)}`
  }

  /**
   * Call a deployed function through its public endpoint with the function's
   * `fnk_` key (not your API key). This is what your app's backend calls.
   * Throws a `ThinkFleetError` with the function's `errorCode` on failure.
   *
   * Keep the key server-side; never ship it to a browser.
   */
  async invoke<T = unknown>(functionId: string, input: Record<string, unknown> | undefined, options: InvokeFunctionOptions): Promise<InvokeFunctionResult<T>> {
    if (!options?.key) {
      throw new Error('ThinkFleet: functions.invoke requires the function key (fnk_...)')
    }
    const response = await this.http.fetchWithTimeout(this.publicUrl(functionId, options.baseUrl), {
      method: 'POST',
      redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${options.key}` },
      body: JSON.stringify(input ?? {}),
    }, { timeout: options.timeout, signal: options.signal })
    const text = await response.text()
    let data: unknown = null
    try {
      data = text ? JSON.parse(text) : null
    }
    catch {
      data = text
    }
    if (!response.ok) {
      const err = (data as { error?: { code?: string; message?: string } } | null)?.error
      throw new ThinkFleetError(err?.message ?? `HTTP ${response.status}`, response.status, err?.code ?? 'FUNCTION_ERROR')
    }
    return {
      output: data as T,
      runId: response.headers.get('x-flobyte-run-id'),
      durationMs: Number(response.headers.get('x-flobyte-duration-ms') ?? 0),
    }
  }
}
