import type { BaseModel } from './common.js'

export enum AutonomyLevel {
  MANUAL = 'MANUAL',
  SUPERVISED = 'SUPERVISED',
  SEMI_AUTONOMOUS = 'SEMI_AUTONOMOUS',
  AUTONOMOUS = 'AUTONOMOUS',
}

export enum GoalStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PAUSED = 'PAUSED',
}

export enum RuntimeType {
  CLOUD = 'CLOUD',
  MCP = 'MCP',
  REST = 'REST',
  DESKTOP = 'DESKTOP',
}

export interface PositionRuntimeConfig {
  runtimeType: RuntimeType
  mcpServerUrl?: string
  mcpAuthToken?: string
  customEndpoint?: string
  runnerId?: string
  sandboxImage?: string
  sandboxCpu?: number
  sandboxMemory?: number
  fallbackStrategy?: string
}

export interface OrgPosition extends BaseModel {
  projectId: string
  title: string
  role: string
  department?: string
  reportsToId?: string
  personaId?: string
  chatbotId?: string
  toolIds?: string[]
  runtimeConfig?: PositionRuntimeConfig
  budgetMonthlyCents?: number
  spentMonthlyCents?: number
  autonomyLevel: AutonomyLevel
  heartbeatIntervalSec?: number
  status: string
}

export interface PopulatedOrgPosition extends OrgPosition {
  reportsTo?: OrgPosition
  directReports: OrgPosition[]
  goals: Goal[]
}

export interface Goal extends BaseModel {
  projectId: string
  positionId: string
  parentGoalId?: string
  title: string
  description?: string
  successCriteria?: string
  status: GoalStatus
  progressPercent: number
  lastEvaluatedAt?: string
  lastAgentNote?: string
  level: number
  tokenUsageCents?: number
}

export interface KeyResult {
  id: string
  description: string
  targetValue: number
  currentValue: number
  unit?: string
}

export interface BudgetRequest extends BaseModel {
  positionId: string
  requestedCents: number
  reason: string
  status: string
  approvedBy?: string
  approvedCents?: number
}

export interface ConnectedAgent extends BaseModel {
  projectId: string
  positionId?: string
  name: string
  connectionType: string
  capabilities: string[]
  status: string
  lastHeartbeat?: string
  token: string
}

export interface CreatePositionRequest {
  title: string
  role: string
  department?: string
  reportsToId?: string
  personaId?: string
  toolIds?: string[]
  runtimeConfig?: PositionRuntimeConfig
  budgetMonthlyCents?: number
  autonomyLevel?: AutonomyLevel
  heartbeatIntervalSec?: number
}

export interface UpdatePositionRequest {
  title?: string
  role?: string
  department?: string
  reportsToId?: string
  personaId?: string
  toolIds?: string[]
  runtimeConfig?: PositionRuntimeConfig
  budgetMonthlyCents?: number
  autonomyLevel?: AutonomyLevel
  heartbeatIntervalSec?: number
}

export interface CreateGoalRequest {
  positionId: string
  parentGoalId?: string
  title: string
  description?: string
  successCriteria?: string
}

export interface UpdateGoalRequest {
  title?: string
  description?: string
  successCriteria?: string
  status?: GoalStatus
}

export interface RegisterAgentRequest {
  name: string
  positionId?: string
  connectionType: string
  capabilities: string[]
  runtimeConfig?: PositionRuntimeConfig
}

export interface OrgCostSummary {
  totalBudgetCents: number
  totalSpentCents: number
  byPosition: Array<{ positionId: string; title: string; budgetCents: number; spentCents: number }>
  byDepartment: Array<{ department: string; budgetCents: number; spentCents: number }>
}
