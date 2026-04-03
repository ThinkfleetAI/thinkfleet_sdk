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

  async skillsOpenApi(options?: RequestOptions): Promise<string> {
    return this.http.get<string>('/mcp-server/skills.openapi.yaml', undefined, options)
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
}

/** Typed skills manifest returned by skills.json endpoint */
export interface McpSkillsManifest {
  tools: Array<{
    name: string
    description: string
    inputSchema: Record<string, unknown>
  }>
}
