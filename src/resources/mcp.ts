import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions, SeekPage } from '../core/types.js'
import { ThinkFleetError } from '../core/errors.js'
import type {
  ListMcpToolCallsParams,
  McpCallOptions,
  McpConnectionInfo,
  McpServer,
  McpTool,
  McpToolCall,
  McpToolResult,
  PopulatedMcpServer,
  UpdateMcpServerRequest,
} from '../types/mcp.js'

const PROTOCOL_VERSION = '2025-06-18'

/** Audit log of every tool call made against the project MCP server. */
export class McpToolCallsResource {
  constructor(private readonly http: HttpClient) {}

  async list(params?: ListMcpToolCallsParams, options?: RequestOptions): Promise<SeekPage<McpToolCall>> {
    return this.http.get<SeekPage<McpToolCall>>('/mcp-server/tool-calls', params as Record<string, string | number | string[] | undefined>, options)
  }
}

/**
 * The project MCP server: one endpoint that gives AI agents (Claude Code,
 * Cursor, Codex, your own agent) the project's tools — Functions marked
 * `mcpEnabled` (`fn_*`), read-only database tools (`db_list`, `db_schema`,
 * `db_query`), customer intelligence (`tf_*`) and flows with an MCP trigger.
 *
 * @example
 * ```ts
 * // Connect a coding agent
 * console.log(await tf.mcp.claudeCodeCommand())
 *
 * // Or call tools from your own code
 * const tools = await tf.mcp.listTools()
 * const result = await tf.mcp.callTool('db_query', { database: 'shop', query: { find: 'orders', limit: 5 } })
 * ```
 */
export class McpResource {
  readonly toolCalls: McpToolCallsResource
  private cachedToken: string | null = null
  private nextId = 1

  constructor(private readonly http: HttpClient) {
    this.toolCalls = new McpToolCallsResource(http)
  }

  async get(options?: RequestOptions): Promise<PopulatedMcpServer> {
    const server = await this.http.get<PopulatedMcpServer>('/mcp-server', undefined, options)
    this.cachedToken = server.token
    return server
  }

  /** Switch built-in tools off (or back on) by name. */
  async update(body: UpdateMcpServerRequest, options?: RequestOptions): Promise<McpServer> {
    return this.http.post<McpServer>('/mcp-server', body, options)
  }

  /** Issue a new static token. Connected clients using the old one stop working. */
  async rotateToken(options?: RequestOptions): Promise<McpServer> {
    const server = await this.http.post<McpServer>('/mcp-server/rotate', {}, options)
    this.cachedToken = server.token
    return server
  }

  /** Streamable HTTP endpoint URL for this project. */
  url(options?: RequestOptions): string {
    return this.http.url('/mcp-server/http', options)
  }

  /** URL and static token for connecting an MCP client. */
  async getConnectionInfo(options?: RequestOptions): Promise<McpConnectionInfo> {
    const server = await this.get(options)
    return { url: this.url(options), token: server.token }
  }

  /**
   * A ready-to-run `claude mcp add` command. It contains the token: run it,
   * don't commit or log it.
   */
  async claudeCodeCommand(name = 'flobyte', options?: RequestOptions): Promise<string> {
    const { url, token } = await this.getConnectionInfo(options)
    return `claude mcp add --transport http ${name} ${url} --header "Authorization: Bearer ${token}"`
  }

  /** Tools the server currently advertises. */
  async listTools(options?: McpCallOptions & RequestOptions): Promise<McpTool[]> {
    const tools: McpTool[] = []
    let cursor: string | undefined
    do {
      const result = await this.rpc<{ tools: McpTool[]; nextCursor?: string }>('tools/list', cursor ? { cursor } : {}, options)
      tools.push(...(result.tools ?? []))
      cursor = result.nextCursor
    } while (cursor)
    return tools
  }

  /**
   * Call a tool. Resolves with the tool result even when `isError` is true
   * (that is the tool reporting a failure); throws on transport or protocol errors.
   */
  async callTool(name: string, args: Record<string, unknown> = {}, options?: McpCallOptions & RequestOptions): Promise<McpToolResult> {
    return this.rpc<McpToolResult>('tools/call', { name, arguments: args }, options)
  }

  /**
   * One JSON-RPC request over Streamable HTTP. The server is stateless (no
   * session id), so each request stands alone; if it insists on a handshake
   * we send `initialize` in the same exchange pattern and retry once.
   */
  private async rpc<T>(method: string, params: Record<string, unknown>, options?: McpCallOptions & RequestOptions): Promise<T> {
    const token = options?.token ?? this.cachedToken ?? (await this.get(options)).token
    try {
      return await this.send<T>(token, method, params, options)
    }
    catch (error) {
      if (error instanceof ThinkFleetError && error.code === 'MCP_NOT_INITIALIZED') {
        await this.send(token, 'initialize', { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: '@thinkfleet/sdk', version: '0' } }, options)
        return this.send<T>(token, method, params, options)
      }
      throw error
    }
  }

  private async send<T>(token: string, method: string, params: Record<string, unknown>, options?: McpCallOptions & RequestOptions): Promise<T> {
    const id = this.nextId++
    const response = await this.http.fetchWithTimeout(this.url(options), {
      method: 'POST',
      redirect: 'error',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'MCP-Protocol-Version': PROTOCOL_VERSION,
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    }, { timeout: options?.timeout, signal: options?.signal })

    const text = await response.text()
    if (response.status === 401) {
      throw new ThinkFleetError('MCP token rejected. Rotate it or pass a valid token.', 401, 'MCP_UNAUTHORIZED')
    }
    const message = parseRpcResponse(text, response.headers.get('content-type'), id)
    if (!message) {
      throw new ThinkFleetError(`MCP ${method}: HTTP ${response.status} with no JSON-RPC response`, response.status, 'MCP_PROTOCOL_ERROR')
    }
    if (message.error) {
      const notInitialized = /not initialized|initialize/i.test(message.error.message ?? '')
      throw new ThinkFleetError(`MCP ${method}: ${message.error.message}`, response.status, notInitialized ? 'MCP_NOT_INITIALIZED' : 'MCP_ERROR', { rpcCode: message.error.code })
    }
    return message.result as T
  }
}

interface RpcMessage {
  id?: number | string | null
  result?: unknown
  error?: { code: number; message: string }
}

/** Accepts a plain JSON body or an SSE stream (`data:` lines) and returns the response with our id. */
function parseRpcResponse(text: string, contentType: string | null, id: number): RpcMessage | null {
  const candidates: unknown[] = []
  if (contentType?.includes('text/event-stream')) {
    for (const line of text.split('\n')) {
      if (line.startsWith('data:')) {
        try {
          candidates.push(JSON.parse(line.slice(5).trim()))
        }
        catch { /* keep-alive or partial line */ }
      }
    }
  }
  else if (text) {
    try {
      const parsed = JSON.parse(text)
      candidates.push(...(Array.isArray(parsed) ? parsed : [parsed]))
    }
    catch {
      return null
    }
  }
  const messages = candidates.filter((m): m is RpcMessage => typeof m === 'object' && m !== null && ('result' in m || 'error' in m))
  return messages.find(m => m.id === id) ?? messages[0] ?? null
}
