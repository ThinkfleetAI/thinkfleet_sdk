import type { BaseModel } from './common.js'

export enum CrewStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DISBANDED = 'disbanded',
}

export enum CrewProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum BoardTaskStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  DELIVERED = 'delivered',
  DONE = 'done',
}

export enum BoardTaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum BoardTaskExecutionStatus {
  IDLE = 'idle',
  QUEUED = 'queued',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  BLOCKED = 'blocked',
}

export enum ColumnModelTier {
  AUTO = 'auto',
  FAST = 'fast',
  BALANCED = 'balanced',
  POWERFUL = 'powerful',
}

export enum CrewExecutionStatus {
  PENDING = 'pending',
  DECOMPOSING = 'decomposing',
  ASSIGNING = 'assigning',
  RUNNING = 'running',
  BLOCKED = 'blocked',
  COMPLETING = 'completing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

// Models
export interface Crew extends BaseModel {
  projectId: string
  name: string
  description: string | null
  leadChatbotId: string
  status: CrewStatus
  createdBy: string
}

export interface CrewMember extends BaseModel {
  crewId: string
  chatbotId: string
  role: string
}

export interface CrewExecution extends BaseModel {
  crewId: string
  projectId: string
  userId: string
  objective: string
  status: CrewExecutionStatus
  decomposition: unknown | null
  totalTasks: number
  completedTasks: number
  failedTasks: number
  blockedTasks: number
  startedAt: string | null
  completedAt: string | null
  summary: string | null
  artifacts: unknown | null
  errorMessage: string | null
  constraints: unknown | null
  rootTaskId: string | null
}

export interface CrewProject extends BaseModel {
  crewId: string
  name: string
  description: string | null
  status: CrewProjectStatus
  createdBy: string
}

export interface ColumnRule {
  id: string
  trigger: 'on_entry' | 'on_exit'
  type: string
  label: string
  config?: Record<string, unknown>
  enabled: boolean
}

export interface FlowHook {
  id: string
  flowId: string
  trigger: 'on_entry' | 'on_exit'
  enabled: boolean
}

export interface BoardColumn extends BaseModel {
  projectId: string
  name: string
  description: string | null
  position: number
  color: string | null
  icon: string | null
  ownerChatbotId: string | null
  prompt: string | null
  expectedOutput: string | null
  requiredOutcomes: unknown | null
  statusMapping: string | null
  rules: ColumnRule[] | null
  flowHooks: FlowHook[] | null
  modelTier: ColumnModelTier
  isDefault: boolean
}

export interface BoardTask extends BaseModel {
  projectId: string
  columnId: string | null
  title: string
  description: string | null
  assignedChatbotId: string | null
  status: BoardTaskStatus
  priority: BoardTaskPriority
  position: number
  deliverables: string | null
  createdBy: string
  externalSource: string | null
  externalId: string | null
  externalUrl: string | null
  lastSyncedAt: string | null
  executionStatus: BoardTaskExecutionStatus
  executionSessionId: string | null
  executionStartedAt: string | null
  executionCompletedAt: string | null
  executionError: string | null
  executionAttempts: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostUsd: number
  modelUsed: string | null
}

export interface BoardColumnWithTasks extends BoardColumn {
  tasks: BoardTask[]
}

export interface ProjectBoardResponse {
  project: CrewProject
  columns: BoardColumnWithTasks[]
}

export interface BoardTaskExecutionResponse {
  taskId: string
  executionStatus: BoardTaskExecutionStatus
  executionSessionId: string | null
  executionStartedAt: string | null
  executionCompletedAt: string | null
  executionError: string | null
  executionAttempts: number
  chatbotId: string | null
}

export interface CostSummary {
  totalCost: number
  taskCount: number
  byModel: Record<string, { cost: number; tokens: number }>
}

// Requests
export interface CreateCrewRequest {
  name: string
  description?: string
  leadPersonaId: string
  members?: Array<{
    personaId: string
    role: string
  }>
}

export interface UpdateCrewRequest {
  name?: string
  description?: string | null
  leadChatbotId?: string
  status?: CrewStatus
}

export interface ExecuteCrewRequest {
  objective: string
  constraints?: {
    maxConcurrentTasks?: number
    timeBudgetSec?: number
  }
}

export interface CreateCrewProjectRequest {
  name: string
  description?: string
  templateKey?: string
}

export interface UpdateCrewProjectRequest {
  name?: string
  description?: string | null
  status?: CrewProjectStatus
}

export interface CreateBoardColumnRequest {
  name: string
  description?: string
  color?: string
  icon?: string
  ownerChatbotId?: string
  prompt?: string
  expectedOutput?: string
  requiredOutcomes?: Array<{ name: string }>
  statusMapping?: string
  rules?: ColumnRule[]
  flowHooks?: FlowHook[]
  modelTier?: ColumnModelTier
}

export interface UpdateBoardColumnRequest {
  name?: string
  description?: string | null
  color?: string | null
  icon?: string | null
  ownerChatbotId?: string | null
  prompt?: string | null
  expectedOutput?: string | null
  requiredOutcomes?: Array<{ name: string }> | null
  statusMapping?: string | null
  rules?: ColumnRule[] | null
  flowHooks?: FlowHook[] | null
  modelTier?: ColumnModelTier
}

export interface ReorderColumnsRequest {
  columnIds: string[]
}

export interface CreateBoardTaskRequest {
  title: string
  description?: string
  assignedChatbotId?: string
  priority?: BoardTaskPriority
  columnId?: string
}

export interface UpdateBoardTaskRequest {
  title?: string
  description?: string | null
  assignedChatbotId?: string | null
  priority?: BoardTaskPriority
  deliverables?: string | null
}

export interface MoveTaskRequest {
  columnId: string
  position?: number
  force?: boolean
}

export interface RunBoardTaskRequest {
  force?: boolean
}
