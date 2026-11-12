import type { BaseModel } from './common.js'

export type McpServerType = 'PROJECT' | 'PLATFORM'

export interface McpServer extends BaseModel {
  platformId: string | null
  projectId: string | null
  type: McpServerType
  /** Static bearer token for `/mcp-server/http`. Treat as a secret. */
  token: string
  /** Built-in `ap_*` / `tf_*` tools the owner switched off; null means none. */
  disabledTools: string[] | null
}

export interface PopulatedMcpServer extends McpServer {
  /** Flows with an MCP trigger, exposed as tools. */
  flows: unknown[]
}

export interface UpdateMcpServerRequest {
  disabledTools?: string[]
}

export interface McpConnectionInfo {
  /** Streamable HTTP endpoint. */
  url: string
  token: string
}

export type McpToolCallStatus = 'SUCCEEDED' | 'FAILED' | 'DENIED'

export interface McpToolCall extends BaseModel {
  mcpServerId: string
  projectId: string
  toolName: string
  status: McpToolCallStatus
  durationMs: number
  input: unknown
  errorMessage: string | null
  platformId: string | null
  userId: string | null
  /** Which client made the call, e.g. `claude-code`, `cursor`. */
  clientKey: string | null
  pieceName: string | null
  actionName: string | null
  connectionExternalId: string | null
  member?: unknown | null
}

export interface ListMcpToolCallsParams {
  cursor?: string
  limit?: number
  toolName?: string
  statuses?: McpToolCallStatus[]
  memberIds?: string[]
  clientKeys?: string[]
  createdAfter?: string
  createdBefore?: string
}

/** A tool as advertised by the MCP server (`tools/list`). */
export interface McpTool {
  /** e.g. `fn_top_customers_ab12`, `db_query`, `tf_customer_profile`, flow tools. */
  name: string
  title?: string
  description?: string
  inputSchema: Record<string, unknown>
  annotations?: {
    readOnlyHint?: boolean
    destructiveHint?: boolean
    idempotentHint?: boolean
    openWorldHint?: boolean
  }
}

export interface McpToolResult {
  content: Array<{ type: string; text?: string; [key: string]: unknown }>
  structuredContent?: Record<string, unknown>
  isError?: boolean
}

export interface McpCallOptions {
  /** MCP token. Defaults to the project server's static token (fetched once and cached). */
  token?: string
  timeout?: number
  signal?: AbortSignal
}
