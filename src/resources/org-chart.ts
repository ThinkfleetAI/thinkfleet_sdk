import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  OrgPosition,
  Goal,
  ConnectedAgent,
  CreatePositionRequest,
  UpdatePositionRequest,
  CreateGoalRequest,
  UpdateGoalRequest,
  RegisterAgentRequest,
  OrgCostSummary,
} from '../types/org-chart.js'

export class OrgChartResource {
  readonly positions: OrgPositionsResource
  readonly goals: OrgGoalsResource
  readonly connectedAgents: OrgConnectedAgentsResource

  constructor(private readonly http: HttpClient) {
    this.positions = new OrgPositionsResource(http)
    this.goals = new OrgGoalsResource(http)
    this.connectedAgents = new OrgConnectedAgentsResource(http)
  }

  /** Get org-wide cost summary (total budget, spent, by position, by department). */
  async getCostSummary(options?: RequestOptions): Promise<OrgCostSummary> {
    return this.http.get<OrgCostSummary>('/org-chart/budget/summary', undefined, options)
  }
}

export class OrgPositionsResource {
  constructor(private readonly http: HttpClient) {}

  /** List all positions in the org chart. */
  async list(options?: RequestOptions): Promise<OrgPosition[]> {
    return this.http.get<OrgPosition[]>('/org-chart/positions', undefined, options)
  }

  /**
   * Get a position. The platform has no `GET /org-chart/positions/{id}`
   * endpoint, so this method fetches the list and filters client-side.
   */
  async get(positionId: string, options?: RequestOptions): Promise<OrgPosition> {
    const all = await this.list(options)
    const found = all.find(p => p.id === positionId)
    if (!found) {
      const { NotFoundError } = await import('../core/errors.js')
      throw new NotFoundError(`Position ${positionId} not found`)
    }
    return found
  }

  /** List the direct reports of a position. */
  async listReports(positionId: string, options?: RequestOptions): Promise<OrgPosition[]> {
    return this.http.get<OrgPosition[]>(`/org-chart/positions/${positionId}/reports`, undefined, options)
  }

  /** Resolve the AI agent currently assigned to a position. */
  async getAgent(positionId: string, options?: RequestOptions): Promise<unknown> {
    return this.http.get<unknown>(`/org-chart/positions/${positionId}/agent`, undefined, options)
  }

  /** List deliverables produced by the agent at a position. */
  async listDeliverables(positionId: string, options?: RequestOptions): Promise<unknown[]> {
    return this.http.get<unknown[]>(`/org-chart/positions/${positionId}/deliverables`, undefined, options)
  }

  /** Create a new position. */
  async create(body: CreatePositionRequest, options?: RequestOptions): Promise<OrgPosition> {
    return this.http.post<OrgPosition>('/org-chart/positions', body, options)
  }

  /** Update a position (including runtime config for external AI tool attachment). */
  async update(positionId: string, body: UpdatePositionRequest, options?: RequestOptions): Promise<OrgPosition> {
    return this.http.patch<OrgPosition>(`/org-chart/positions/${positionId}`, body, options)
  }

  /** Delete a position. */
  async delete(positionId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/org-chart/positions/${positionId}`, options)
  }
}

export class OrgGoalsResource {
  constructor(private readonly http: HttpClient) {}

  /** List goals, optionally filtered by position. */
  async list(params?: { positionId?: string; status?: string }, options?: RequestOptions): Promise<Goal[]> {
    return this.http.get<Goal[]>(
      '/org-chart/goals',
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }

  /**
   * Get a goal. The platform has no `GET /org-chart/goals/{id}` endpoint,
   * so this method fetches the list and filters client-side.
   */
  async get(goalId: string, options?: RequestOptions): Promise<Goal> {
    const all = await this.list(undefined, options)
    const found = all.find(g => g.id === goalId)
    if (!found) {
      const { NotFoundError } = await import('../core/errors.js')
      throw new NotFoundError(`Goal ${goalId} not found`)
    }
    return found
  }

  /** Get the activity log for a goal (status changes, child goals, agent runs). */
  async getActivity(goalId: string, options?: RequestOptions): Promise<unknown[]> {
    return this.http.get<unknown[]>(`/org-chart/goals/${goalId}/activity`, undefined, options)
  }

  /** Create a new goal for a position. */
  async create(body: CreateGoalRequest, options?: RequestOptions): Promise<Goal> {
    return this.http.post<Goal>('/org-chart/goals', body, options)
  }

  /** Update a goal. */
  async update(goalId: string, body: UpdateGoalRequest, options?: RequestOptions): Promise<Goal> {
    return this.http.patch<Goal>(`/org-chart/goals/${goalId}`, body, options)
  }

  /** Delete a goal. */
  async delete(goalId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/org-chart/goals/${goalId}`, options)
  }

  /** Trigger AI decomposition of a goal into sub-tasks. */
  async decompose(goalId: string, options?: RequestOptions): Promise<Goal[]> {
    return this.http.post<Goal[]>(`/org-chart/goals/${goalId}/decompose`, {}, { ...options, timeout: 120000 })
  }

  /** Replan a goal (re-run AI planning to update sub-goals). */
  async replan(goalId: string, options?: RequestOptions): Promise<Goal> {
    return this.http.post<Goal>(`/org-chart/goals/${goalId}/replan`, {}, { ...options, timeout: 120000 })
  }
}

export class OrgConnectedAgentsResource {
  constructor(private readonly http: HttpClient) {}

  /** List all connected external agents. */
  async list(options?: RequestOptions): Promise<ConnectedAgent[]> {
    return this.http.get<ConnectedAgent[]>('/connected-agents', undefined, options)
  }

  /** Register an external AI tool (Claude Code, Codex, etc.) to a position. */
  async register(body: RegisterAgentRequest, options?: RequestOptions): Promise<ConnectedAgent> {
    return this.http.post<ConnectedAgent>('/connected-agents', body, options)
  }

  /** Update a connected agent's config. */
  async update(agentId: string, body: Partial<RegisterAgentRequest>, options?: RequestOptions): Promise<ConnectedAgent> {
    return this.http.patch<ConnectedAgent>(`/connected-agents/${agentId}`, body, options)
  }

  /** Remove a connected agent. */
  async delete(agentId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/connected-agents/${agentId}`, options)
  }
}
