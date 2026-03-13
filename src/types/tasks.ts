export enum TaskComplexity {
  SIMPLE = 'simple',
  MEDIUM = 'medium',
  COMPLEX = 'complex',
}

export enum TaskType {
  ONE_TIME = 'one_time',
  RECURRING = 'recurring',
  AUTOMATION = 'automation',
}

export interface ClassifyTaskRequest {
  message: string
}

export interface ClassifyTaskResponse {
  title: string
  personaId: string
  personaName: string
  personaDescription: string
  personaCategory: string
  personaIcon: string
  needsCrew: boolean
  crewPersonas: Array<{
    id: string
    name: string
    description: string
  }>
  complexity: TaskComplexity
  taskType: TaskType
}

export interface DispatchTaskRequest {
  personaId: string
  message: string
  attachmentFileIds?: string[]
}

export interface DispatchTaskResponse {
  agentId: string
  sessionId: string
  personaName: string
}

export interface DispatchCrewRequest {
  title: string
  personaIds: string[]
  objective: string
}

export interface DispatchCrewResponse {
  crewId: string
  executionId: string
}

export interface SendTaskMessageRequest {
  message: string
  attachmentFileIds?: string[]
}

export interface TaskSessionMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  attachments?: Array<{
    type: string
    fileId: string
    mimeType: string
    fileName?: string
    durationMs?: number
    transcription?: string
  }>
}

export interface TaskSessionHistoryResponse {
  messages: TaskSessionMessage[]
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    estimatedCostUsd: number
  }
}

export interface ConnectedService {
  id: string
  displayName: string
  pieceName: string
}

export interface RecentSession {
  sessionId: string
  agentId: string
  agentName: string
  firstMessage: string
  updatedAt: string
  status: 'running' | 'done'
}

export interface HomeFeedResponse {
  connectedServices: ConnectedService[]
  recentSessions: RecentSession[]
}

export interface ListTaskHistoryParams {
  limit?: number
  cursor?: string
}
