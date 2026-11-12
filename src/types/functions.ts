import type { BaseModel } from './common.js'

/** Module source. `code` exports a handler: `export default async (input, ctx) => {...}`. */
export interface FunctionSourceCode {
  code: string
  /** Stringified package.json. Use `'{}'` when there are no dependencies. */
  packageJson: string
}

/**
 * Declared inputs. Either JSON Schema (`{ type: 'object', properties, required }`)
 * or a map of field name to a type string / `{ type, description, required }`.
 * String values from query strings and flows are coerced to the declared type.
 */
export type FunctionInputs = Record<string, unknown>

interface FunctionRuntimeSettings {
  /** Project databases the function may use as `ctx.db.<name>`. `['*']` binds all. */
  databases?: string[]
  timeoutMs?: number
  memoryMb?: number
  enabled?: boolean
  /** Expose as an MCP tool (`fn_<name>_<id>`) on the project MCP server. */
  mcpEnabled?: boolean
  /** Expose at `POST /api/v1/fn/:id`, authenticated with the function key. */
  publicEnabled?: boolean
}

export interface FlobyteFunction extends BaseModel, FunctionRuntimeSettings {
  projectId: string
  name: string
  description?: string
  sourceCode: FunctionSourceCode
  inputs?: FunctionInputs
  /** First characters of the current function key. The key itself is only returned by `rotateKey()`. */
  apiKeyPrefix?: string | null
  version?: number
  lastRunAt?: string | null
}

export interface CreateFunctionRequest extends FunctionRuntimeSettings {
  name: string
  description?: string
  sourceCode: FunctionSourceCode
  inputs?: FunctionInputs
}

export type UpdateFunctionRequest = Partial<CreateFunctionRequest>

export type FunctionErrorCode =
  | 'TIMEOUT'
  | 'OUT_OF_MEMORY'
  | 'COMPILE_ERROR'
  | 'RUNTIME_ERROR'
  | 'INVALID_INPUT'
  | 'LIMIT_EXCEEDED'
  | 'BUSY'
  | 'DISABLED'
  | 'SANDBOX_UNAVAILABLE'
  | (string & {})

/** Result of `run()` / `test()`. A failed run resolves with `success: false`; it does not throw. */
export interface RunFunctionResponse<T = unknown> {
  success: boolean
  output?: T
  logs?: string[]
  durationMs?: number
  error?: string
  errorCode?: FunctionErrorCode
  runId?: string | null
}

export interface TestFunctionRequest {
  sourceCode: FunctionSourceCode
  input?: unknown
  inputs?: FunctionInputs
  databases?: string[]
  timeoutMs?: number
  memoryMb?: number
}

export interface RotateFunctionKeyResponse {
  /** `fnk_...` — shown once. Store it as a secret. */
  apiKey: string
  apiKeyPrefix: string
}

export type FunctionRunTrigger = 'API' | 'PUBLIC' | 'MCP' | 'FLOW' | 'TEST'

export interface FunctionRun extends BaseModel {
  projectId: string
  functionId: string
  functionVersion: number
  trigger: FunctionRunTrigger
  status: 'SUCCEEDED' | 'FAILED'
  durationMs: number
  /** Bridge calls made (database, fetch, sleep). */
  calls: number
  errorCode: string | null
  errorMessage: string | null
  logs: Array<{ level: string; message: string }>
}

export interface InvokeFunctionOptions {
  /** The function's `fnk_` key. */
  key: string
  /** API origin. Defaults to the client's `baseUrl`. */
  baseUrl?: string
  timeout?: number
  signal?: AbortSignal
}

export interface InvokeFunctionResult<T = unknown> {
  output: T
  runId: string | null
  durationMs: number
}
