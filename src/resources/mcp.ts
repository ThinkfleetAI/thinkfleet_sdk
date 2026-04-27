import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import { normalizePieceName } from '../core/piece-name.js'
import type {
  McpServer,
  PopulatedMcpServer,
  McpIntegration,
  McpExternalServer,
  AddIntegrationRequest,
  BatchAddIntegrationRequest,
  UpdateIntegrationRequest,
  UpdateMcpServerRequest,
  AddExternalServerRequest,
  UpdateExternalServerRequest,
} from '../types/mcp.js'

export class McpIntegrationsResource {
  constructor(private readonly http: HttpClient) {}

  async list(options?: RequestOptions): Promise<McpIntegration[]> {
    return this.http.get<McpIntegration[]>('/mcp-server/piece-tools', undefined, options)
  }

  async add(body: AddIntegrationRequest, options?: RequestOptions): Promise<McpIntegration> {
    return this.http.post<McpIntegration>('/mcp-server/piece-tools', { ...body, pieceName: normalizePieceName(body.pieceName) }, options)
  }

  async batchAdd(body: BatchAddIntegrationRequest, options?: RequestOptions): Promise<McpIntegration[]> {
    return this.http.post<McpIntegration[]>('/mcp-server/piece-tools/batch', { ...body, pieceName: normalizePieceName(body.pieceName) }, options)
  }

  async update(toolId: string, body: UpdateIntegrationRequest, options?: RequestOptions): Promise<McpIntegration> {
    return this.http.patch<McpIntegration>(`/mcp-server/piece-tools/${toolId}`, body, options)
  }

  async delete(toolId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/mcp-server/piece-tools/${toolId}`, options)
  }
}

export class McpExternalServersResource {
  constructor(private readonly http: HttpClient) {}

  async list(options?: RequestOptions): Promise<McpExternalServer[]> {
    return this.http.get<McpExternalServer[]>('/mcp-server/external-servers', undefined, options)
  }

  async add(body: AddExternalServerRequest, options?: RequestOptions): Promise<McpExternalServer> {
    return this.http.post<McpExternalServer>('/mcp-server/external-servers', body, options)
  }

  async update(serverId: string, body: UpdateExternalServerRequest, options?: RequestOptions): Promise<McpExternalServer> {
    return this.http.patch<McpExternalServer>(`/mcp-server/external-servers/${serverId}`, body, options)
  }

  async delete(serverId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/mcp-server/external-servers/${serverId}`, options)
  }
}

export class McpResource {
  readonly integrations: McpIntegrationsResource
  readonly externalServers: McpExternalServersResource

  constructor(private readonly http: HttpClient) {
    this.integrations = new McpIntegrationsResource(http)
    this.externalServers = new McpExternalServersResource(http)
  }

  async get(options?: RequestOptions): Promise<PopulatedMcpServer> {
    return this.http.get<PopulatedMcpServer>('/mcp-server', undefined, options)
  }

  async update(body: UpdateMcpServerRequest, options?: RequestOptions): Promise<McpServer> {
    return this.http.post<McpServer>('/mcp-server', body, options)
  }

  async rotateToken(options?: RequestOptions): Promise<McpServer> {
    return this.http.post<McpServer>('/mcp-server/rotate', undefined, options)
  }

  async skills(options?: RequestOptions): Promise<McpSkillsManifest> {
    return this.http.get<McpSkillsManifest>('/mcp-server/skills.json', undefined, options)
  }

  /** Skills manifest as an OpenAPI 3.0 YAML document. Returned as raw string. */
  async skillsOpenApi(options?: RequestOptions): Promise<string> {
    return this.http.getText('/mcp-server/skills.openapi.yaml', undefined, options)
  }

  /**
   * Get the MCP server connection URL for external AI tools (Claude Code, Codex, Cursor, etc.).
   * Returns the HTTP endpoint URL and the bearer token needed to connect.
   *
   * @example
   * ```ts
   * const { url, token } = await tf.mcp.getConnectionInfo()
   * // Use in Claude Code:
   * // claude mcp add thinkfleet --transport streamable-http --url {url} --header "Authorization: Bearer {token}"
   * ```
   */
  async getConnectionInfo(options?: RequestOptions): Promise<{ url: string; token: string }> {
    const server = await this.get(options)
    const baseUrl = (this.http as any).options?.baseUrl ?? ''
    const projectId = (this.http as any).options?.projectId ?? ''
    return {
      url: `${baseUrl}/api/v1/projects/${projectId}/mcp-server/http`,
      token: server.token,
    }
  }

  /**
   * List all MCP tools registered on the server (built-in services + piece
   * tools + external servers). Talks the MCP streamable-HTTP protocol
   * directly so it sees the same tool surface external clients see.
   */
  async listTools(): Promise<Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>> {
    const result = await this.callMcp('tools/list')
    return (result?.tools ?? []) as Array<{ name: string; description: string; inputSchema: Record<string, unknown> }>
  }

  /**
   * Invoke an MCP tool by name. Talks the same streamable-HTTP protocol
   * Claude Code / Codex use, so this is a faithful test of how external
   * clients will see the server.
   *
   * Returns the parsed tool result. If the tool returns JSON in its text
   * content, it's parsed automatically; otherwise the raw text is returned.
   *
   * @example
   * ```ts
   * const result = await tf.mcp.callTool('memory_remember', {
   *   content: 'User prefers TypeScript',
   *   type: 'preference',
   *   importance: 7,
   * })
   * ```
   */
  async callTool(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
    const result = await this.callMcp('tools/call', { name, arguments: args })
    if (result?.isError) {
      const text = this.extractText(result.content)
      throw new Error(`MCP tool error (${name}): ${text || 'unknown'}`)
    }
    const text = this.extractText(result?.content)
    if (!text) return result
    try { return JSON.parse(text) }
    catch { return text }
  }

  private extractText(content: unknown): string {
    if (!Array.isArray(content)) return ''
    return content
      .filter((c: { type?: string }) => c?.type === 'text')
      .map((c: { text?: string }) => c.text ?? '')
      .join('\n')
  }

  /**
   * Low-level MCP protocol POST. Speaks streamable-HTTP — the response
   * is either application/json or text/event-stream; we accept both and
   * extract the JSON-RPC payload either way.
   */
  private async callMcp(method: string, params?: Record<string, unknown>): Promise<any> {
    const conn = await this.getConnectionInfo()
    const fetchFn = (this.http as any).options?.fetchFn ?? globalThis.fetch.bind(globalThis)

    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: Math.random().toString(36).slice(2),
      method,
      params: params ?? {},
    })

    const res = await fetchFn(conn.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${conn.token}`,
      },
      body,
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`MCP HTTP ${res.status}: ${text.substring(0, 500)}`)
    }

    const contentType = res.headers.get('content-type') ?? ''
    const text = await res.text()

    let payload: any
    if (contentType.includes('text/event-stream')) {
      // Parse SSE — find the first `data: ` line containing the JSON-RPC response.
      const dataLine = text.split('\n').find((l: string) => l.startsWith('data: '))
      if (!dataLine) throw new Error(`Unexpected SSE response (no data line): ${text.substring(0, 200)}`)
      payload = JSON.parse(dataLine.slice(6))
    }
    else {
      payload = JSON.parse(text)
    }

    if (payload.error) {
      throw new Error(`MCP RPC error: ${JSON.stringify(payload.error)}`)
    }
    return payload.result
  }
}

/** Typed skills manifest returned by skills.json endpoint */
export interface McpSkillsManifest {
  tools: Array<{
    name: string
    description: string
    inputSchema: Record<string, unknown>
  }>
}
