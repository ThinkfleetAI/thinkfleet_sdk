export interface ShieldOverview {
  totalRequests: number
  totalTokens: number
  totalCostCents: number
  guardrailSavingsCents: number
  piiBlockCount: number
  injectionBlockCount: number
  complianceScore: number
  periodStart: string
  periodEnd: string
}

export interface ShieldRequest {
  id: string
  timestamp: string
  userId: string
  userName?: string
  model: string
  provider: string
  inputTokens: number
  outputTokens: number
  costCents: number
  guardrailViolations: string[]
  blocked: boolean
  latencyMs: number
}

export interface ShieldCostAnalytics {
  byModel: Array<{ model: string; costCents: number; tokenCount: number }>
  byDeveloper: Array<{ userId: string; userName?: string; costCents: number; tokenCount: number }>
  byDay: Array<{ date: string; costCents: number; tokenCount: number }>
}

export interface ShieldDeveloperBreakdown {
  userId: string
  userName?: string
  requestCount: number
  tokenCount: number
  costCents: number
  violations: number
  lastActive: string
}

export interface ListShieldRequestsParams {
  limit?: number
  offset?: number
  userId?: string
  blocked?: boolean
  startDate?: string
  endDate?: string
}
