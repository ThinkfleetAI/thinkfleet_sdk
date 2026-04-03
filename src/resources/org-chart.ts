import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  OrgPosition,
  PopulatedOrgPosition,
  Goal,
  BudgetRequest,
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

  /** Get a position with its reports-to chain, direct reports, and goals. */
  async get(positionId: string, options?: RequestOptions): Promise<PopulatedOrgPosition> {
    return this.http.get<PopulatedOrgPosition>(`/org-chart/positions/${positionId}`, undefined, options)
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

  /** Get the current status of a position (heartbeat, current task, spend). */
  async getStatus(positionId: string, options?: RequestOptions): Promise<{ status: string; currentTask?: string; spentCents: number; lastHeartbeat?: string }> {
    return this.http.get(`/org-chart/positions/${positionId}/status`, undefined, options)
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

  /** Get a goal with progress details. */
  async get(goalId: string, options?: RequestOptions): Promise<Goal> {
    return this.http.get<Goal>(`/org-chart/goals/${goalId}`, undefined, options)
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

  /** Get roll-up progress across a goal and all its sub-goals. */
  async getProgress(goalId: string, options?: RequestOptions): Promise<{ goalId: string; progressPercent: number; childGoals: Array<{ goalId: string; title: string; progressPercent: number }> }> {
    return this.http.get(`/org-chart/goals/${goalId}/progress`, undefined, options)
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
