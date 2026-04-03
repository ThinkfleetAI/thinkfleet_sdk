import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  ShieldOverview,
  ShieldRequest,
  ShieldCostAnalytics,
  ShieldDeveloperBreakdown,
  ListShieldRequestsParams,
} from '../types/shield.js'

export class ShieldResource {
  constructor(private readonly http: HttpClient) {}

  /** Get the Shield dashboard overview (compliance score, totals, blocks). */
  async overview(options?: RequestOptions): Promise<ShieldOverview> {
    return this.http.get<ShieldOverview>('/shield/overview', undefined, { ...options, rawPath: true })
  }

  /** List recent AI proxy events with guardrail metadata. */
  async listEvents(params?: ListShieldRequestsParams, options?: RequestOptions): Promise<ShieldRequest[]> {
    return this.http.get<ShieldRequest[]>(
      '/shield/events',
      params as Record<string, string | number | boolean | undefined>,
      { ...options, rawPath: true },
    )
  }

  /** Get cost analytics broken down by model, developer, and day. */
  async costAnalytics(params?: { startDate?: string; endDate?: string }, options?: RequestOptions): Promise<ShieldCostAnalytics> {
    return this.http.get<ShieldCostAnalytics>(
      '/shield/cost-analytics',
      params as Record<string, string | number | boolean | undefined>,
      { ...options, rawPath: true },
    )
  }

  /** Get per-developer breakdown of usage, cost, and violations. */
  async developerBreakdown(options?: RequestOptions): Promise<ShieldDeveloperBreakdown[]> {
    return this.http.get<ShieldDeveloperBreakdown[]>('/shield/developers', undefined, { ...options, rawPath: true })
  }
}
