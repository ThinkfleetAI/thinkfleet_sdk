import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  MemoryItem,
  CreateMemoryRequest,
  UpdateMemoryRequest,
  ConfirmMemoryRequest,
  PromoteMemoryRequest,
  MemorySearchRequest,
  MemorySearchResult,
  MemoryFeedback,
  SubmitFeedbackRequest,
  ListMemoryParams,
  MemoryStats,
} from '../types/memory.js'

// Keep backward-compatible exports
export type MemorySearchResponse = { results: MemorySearchResult[] }
export type SaveMemoryRequest = CreateMemoryRequest
export type SaveMemoryResponse = { id: string; content: string }

export class MemoryResource {
  readonly admin: AdminMemoryResource
  readonly project: ProjectMemoryResource

  constructor(private readonly http: HttpClient) {
    this.admin = new AdminMemoryResource(http)
    this.project = new ProjectMemoryResource(http)
  }

  // ── Agent-scoped memory (per chatbot) ────────────────────────────

  /**
   * List memory items for a specific agent.
   *
   * @example
   * ```ts
   * const memories = await tf.memory.list('agentId', {
   *   type: 'fact',
   *   scope: 'project',
   *   limit: 20,
   * })
   * ```
   */
  async list(agentId: string, params?: ListMemoryParams, options?: RequestOptions): Promise<MemoryItem[]> {
    return this.http.get<MemoryItem[]>(
      `/chatbots/${agentId}/memory`,
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }

  /**
   * Create a memory item for an agent.
   *
   * @example
   * ```ts
   * await tf.memory.create('agentId', {
   *   content: 'User prefers dark mode',
   *   type: 'preference',
   *   scope: 'user',
   * })
   *
   * // With visual memory
   * await tf.memory.create('agentId', {
   *   content: "User's dog named Bella",
   *   type: 'fact',
   *   visualDescription: 'Golden retriever, female, light cream coat, brown eyes',
   *   imageFileId: 'abc123',
   * })
   * ```
   */
  async create(agentId: string, body: CreateMemoryRequest, options?: RequestOptions): Promise<MemoryItem> {
    return this.http.post<MemoryItem>(`/chatbots/${agentId}/memory`, body, options)
  }

  /**
   * Update a memory item.
   */
  async update(agentId: string, memoryId: string, body: UpdateMemoryRequest, options?: RequestOptions): Promise<MemoryItem> {
    return this.http.patch<MemoryItem>(`/chatbots/${agentId}/memory/${memoryId}`, body, options)
  }

  /**
   * Delete a memory item.
   */
  async delete(agentId: string, memoryId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/chatbots/${agentId}/memory/${memoryId}`, options)
  }

  /**
   * Confirm or reject a pending memory item.
   *
   * @example
   * ```ts
   * await tf.memory.confirm('agentId', 'memoryId', {
   *   status: 'confirmed',
   * })
   * ```
   */
  async confirm(agentId: string, memoryId: string, body: ConfirmMemoryRequest, options?: RequestOptions): Promise<MemoryItem> {
    return this.http.post<MemoryItem>(`/chatbots/${agentId}/memory/${memoryId}/confirm`, body, options)
  }

  /**
   * Semantic search across agent memories.
   *
   * @example
   * ```ts
   * const results = await tf.memory.search('agentId', {
   *   query: 'golden retriever light coat',
   *   limit: 10,
   * })
   * ```
   */
  async search(agentId: string, params: MemorySearchRequest, options?: RequestOptions): Promise<MemorySearchResult[]> {
    return this.http.post<MemorySearchResult[]>(`/chatbots/${agentId}/memory/search`, params, options)
  }

  /**
   * Submit feedback on a memory item.
   */
  async submitFeedback(agentId: string, memoryId: string, body: SubmitFeedbackRequest, options?: RequestOptions): Promise<void> {
    return this.http.post(`/chatbots/${agentId}/memory/${memoryId}/feedback`, body, options)
  }

  /**
   * List feedback for a memory item.
   */
  async listFeedback(agentId: string, memoryId: string, options?: RequestOptions): Promise<MemoryFeedback[]> {
    return this.http.get<MemoryFeedback[]>(`/chatbots/${agentId}/memory/${memoryId}/feedback`, undefined, options)
  }

  // ── Developer API shortcuts (backward-compatible) ────────────────

  /**
   * Search via the developer API (searches across all agents).
   * @deprecated Use `search()` with an agentId for scoped search.
   */
  async devSearch(
    agentId: string,
    params: { query: string; limit?: number },
    options?: RequestOptions,
  ): Promise<MemorySearchResponse> {
    return this.http.post<MemorySearchResponse>(
      `/developer/agents/${agentId}/memory/search`,
      params,
      { ...options, rawPath: true },
    )
  }

  /**
   * Save via the developer API.
   * @deprecated Use `create()` with an agentId for full control.
   */
  async devSave(
    agentId: string,
    body: SaveMemoryRequest,
    options?: RequestOptions,
  ): Promise<SaveMemoryResponse> {
    return this.http.post<SaveMemoryResponse>(
      `/developer/agents/${agentId}/memory/save`,
      body,
      { ...options, rawPath: true },
    )
  }
}

// ── Project-level memory ─────────────────────────────────────────────

export class ProjectMemoryResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List the current user's memories across all agents.
   */
  async mine(params?: { limit?: number; offset?: number }, options?: RequestOptions): Promise<MemoryItem[]> {
    return this.http.get<MemoryItem[]>(
      '/memory/mine',
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }

  /**
   * Delete one of your own memory items.
   */
  async delete(memoryId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/memory/${memoryId}`, options)
  }

  /**
   * Submit feedback on a response that used memories.
   */
  async submitFeedback(body: { memoryId: string } & SubmitFeedbackRequest, options?: RequestOptions): Promise<void> {
    return this.http.post('/memory/feedback', body, options)
  }
}

// ── Admin memory management ──────────────────────────────────────────

export class AdminMemoryResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all memories in the project (admin view).
   */
  async list(params?: ListMemoryParams, options?: RequestOptions): Promise<MemoryItem[]> {
    return this.http.get<MemoryItem[]>(
      '/admin/memory',
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }

  /**
   * List platform-level memories (shared across all projects).
   */
  async listPlatform(params?: { status?: string; limit?: number; offset?: number }, options?: RequestOptions): Promise<MemoryItem[]> {
    return this.http.get<MemoryItem[]>(
      '/admin/memory/platform',
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }

  /**
   * List memories pending review.
   */
  async listPendingReview(params?: { limit?: number; offset?: number }, options?: RequestOptions): Promise<MemoryItem[]> {
    return this.http.get<MemoryItem[]>(
      '/admin/memory/review',
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }

  /**
   * Get memory statistics for the admin dashboard.
   */
  async stats(options?: RequestOptions): Promise<MemoryStats> {
    return this.http.get<MemoryStats>('/admin/memory/stats', undefined, options)
  }

  /**
   * Create a memory item at any scope (admin).
   */
  async create(body: CreateMemoryRequest, options?: RequestOptions): Promise<MemoryItem> {
    return this.http.post<MemoryItem>('/admin/memory', body, options)
  }

  /**
   * Update any memory item (admin).
   */
  async update(memoryId: string, body: UpdateMemoryRequest, options?: RequestOptions): Promise<MemoryItem> {
    return this.http.patch<MemoryItem>(`/admin/memory/${memoryId}`, body, options)
  }

  /**
   * Confirm or reject a pending memory (admin).
   */
  async confirm(memoryId: string, body: ConfirmMemoryRequest, options?: RequestOptions): Promise<MemoryItem> {
    return this.http.post<MemoryItem>(`/admin/memory/${memoryId}/confirm`, body, options)
  }

  /**
   * Promote or demote a memory to a different scope (admin).
   *
   * @example
   * ```ts
   * // Promote a project memory to platform-wide
   * await tf.memory.admin.promote('memoryId', {
   *   targetScope: 'platform',
   * })
   * ```
   */
  async promote(memoryId: string, body: PromoteMemoryRequest, options?: RequestOptions): Promise<MemoryItem> {
    return this.http.post<MemoryItem>(`/admin/memory/${memoryId}/promote`, body, options)
  }

  /**
   * Semantic search across all scopes (admin).
   */
  async search(params: MemorySearchRequest & { projectId?: string }, options?: RequestOptions): Promise<MemorySearchResult[]> {
    return this.http.post<MemorySearchResult[]>('/admin/memory/search', params, options)
  }

  /**
   * Delete any memory item (admin).
   */
  async delete(memoryId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/admin/memory/${memoryId}`, options)
  }

  /**
   * List feedback for a memory item (admin).
   */
  async listFeedback(memoryId: string, options?: RequestOptions): Promise<MemoryFeedback[]> {
    return this.http.get<MemoryFeedback[]>(`/admin/memory/${memoryId}/feedback`, undefined, options)
  }
}
