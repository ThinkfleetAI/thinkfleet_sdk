import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import { normalizePieceName } from '../core/piece-name.js'
import type {
  Agent,
  PopulatedAgent,
  CreateAgentRequest,
  UpdateAgentRequest,
  ChatRequest,
  ChatResponse,
  AgentTool,
  AddIntegrationToolRequest,
  AddFlowToolRequest,
  AddKnowledgeBaseToolRequest,
  AddDataSchemaToolRequest,
  UpdateToolRequest,
} from '../types/agents.js'

export class AgentToolsResource {
  constructor(private readonly http: HttpClient) {}

  async addIntegration(agentId: string, body: AddIntegrationToolRequest, options?: RequestOptions): Promise<AgentTool> {
    return this.http.post<AgentTool>(`/chatbots/${agentId}/tools`, { ...body, type: 'PIECE', pieceName: normalizePieceName(body.pieceName) }, options)
  }

  async addFlow(agentId: string, body: AddFlowToolRequest, options?: RequestOptions): Promise<AgentTool> {
    return this.http.post<AgentTool>(`/chatbots/${agentId}/tools`, { ...body, type: 'FLOW' }, options)
  }

  async addKnowledgeBase(agentId: string, body: AddKnowledgeBaseToolRequest, options?: RequestOptions): Promise<AgentTool> {
    return this.http.post<AgentTool>(`/chatbots/${agentId}/tools`, { ...body, type: 'KNOWLEDGE_BASE' }, options)
  }

  async addDataSchema(agentId: string, body: AddDataSchemaToolRequest, options?: RequestOptions): Promise<AgentTool> {
    return this.http.post<AgentTool>(`/chatbots/${agentId}/tools`, { ...body, type: 'DATA_SCHEMA' }, options)
  }

  async update(agentId: string, toolId: string, body: UpdateToolRequest, options?: RequestOptions): Promise<AgentTool> {
    return this.http.patch<AgentTool>(`/chatbots/${agentId}/tools/${toolId}`, body, options)
  }

  async delete(agentId: string, toolId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/chatbots/${agentId}/tools/${toolId}`, options)
  }
}

export class AgentsResource {
  readonly tools: AgentToolsResource

  constructor(private readonly http: HttpClient) {
    this.tools = new AgentToolsResource(http)
  }

  async list(options?: RequestOptions): Promise<Agent[]> {
    return this.http.get<Agent[]>('/chatbots', { type: 'AGENT' }, options)
  }

  async get(agentId: string, options?: RequestOptions): Promise<PopulatedAgent> {
    return this.http.get<PopulatedAgent>(`/chatbots/${agentId}`, undefined, options)
  }

  async create(body: CreateAgentRequest, options?: RequestOptions): Promise<Agent> {
    return this.http.post<Agent>('/chatbots', { ...body, type: 'AGENT' }, options)
  }

  async update(agentId: string, body: UpdateAgentRequest, options?: RequestOptions): Promise<Agent> {
    return this.http.patch<Agent>(`/chatbots/${agentId}`, body, options)
  }

  async delete(agentId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/chatbots/${agentId}`, options)
  }

  async chat(agentId: string, body: ChatRequest, options?: RequestOptions): Promise<ChatResponse> {
    return this.http.post<ChatResponse>(
      `/chatbots/${agentId}/agent-chat`,
      body,
      { ...options, timeout: options?.timeout ?? 120000 },
    )
  }

  /**
   * Stream a chat response from an agent using Server-Sent Events.
   * Yields parsed SSE events as they arrive for real-time UI updates.
   *
   * @example
   * ```ts
   * for await (const event of tf.agents.chatStream('agentId', { message: 'Hello' })) {
   *   if (event.data) {
   *     const parsed = JSON.parse(event.data)
   *     process.stdout.write(parsed.text ?? '')
   *   }
   * }
   * ```
   */
  chatStream(agentId: string, body: ChatRequest, options?: RequestOptions): AsyncGenerator<{ event?: string; data: string }> {
    return this.http.postStream(
      `/chatbots/${agentId}/agent-chat`,
      { ...body, stream: true },
      { ...options, timeout: options?.timeout ?? 120000 },
    )
  }
}
