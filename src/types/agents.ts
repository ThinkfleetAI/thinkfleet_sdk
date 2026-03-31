import type { BaseModel } from './common.js'

export enum AgentStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
}

export enum AgentVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum AiProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GROQ = 'groq',
  DEEPSEEK = 'deepseek',
  TOGETHER = 'together',
  PERPLEXITY = 'perplexity',
  MOONSHOT = 'moonshot',
  XAI = 'xai',
}

export enum WorkerRuntime {
  CLOUD = 'cloud',
  WORKER = 'worker',
}

export enum VoiceProvider {
  DEEPGRAM = 'deepgram',
  ELEVENLABS = 'elevenlabs',
  OPENAI = 'openai',
}

export interface VoiceConfig {
  provider: VoiceProvider
  voiceId: string
  speed?: number
  language?: string
}

export interface AgentAppearance {
  primaryColor?: string
  avatarUrl?: string
  customCss?: string
}

export enum ToolType {
  PIECE = 'PIECE',
  FLOW = 'FLOW',
  MCP = 'MCP',
  DATA_SCHEMA = 'DATA_SCHEMA',
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
  COMPOSIO_ACTION = 'COMPOSIO_ACTION',
  BUILT_IN_MCP = 'BUILT_IN_MCP',
}

export interface DataSchemaField {
  name: string
  displayName: string
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'EMAIL' | 'PHONE' | 'URL' | 'SELECT'
  description?: string
  required: boolean
  options?: string[]
}

export interface AgentTool extends BaseModel {
  chatbotId: string
  projectId: string
  type: ToolType
  displayName: string
  description: string | null
  enabled: boolean
  pieceName: string | null
  pieceVersion: string | null
  actionName: string | null
  connectionId: string | null
  shadowFlowId: string | null
  flowId: string | null
  mcpServerUrl: string | null
  mcpProtocol: string | null
  mcpAuthConfig: unknown | null
  dataSchema: DataSchemaField[] | null
  knowledgeBaseIds: string[] | null
  topK: number | null
  similarityThreshold: number | null
  composioIntegrationId: string | null
  composioActionId: string | null
  builtInToolName: string | null
}

export interface Agent extends BaseModel {
  projectId: string
  name: string
  description: string | null
  systemPrompt: string
  aiProvider: AiProvider
  modelName: string
  connectionId: string | null
  greeting: string | null
  appearance: AgentAppearance | null
  status: AgentStatus
  visibilityStatus: AgentVisibility
  type: 'AGENT'
  personaId: string | null
  temperature?: number
  maxTokens?: number
  maxSteps?: number
  contextWindow?: number
  workerRuntime?: WorkerRuntime
  reasoningMode?: boolean
  // Voice
  voiceEnabled?: boolean
  voiceConfig?: VoiceConfig | null
  // Self-reflection
  reflectionEnabled?: boolean
  reflectionDepth?: number
  // Heartbeat (scheduled proactive messages)
  heartbeatEnabled?: boolean
  heartbeatIntervalMinutes?: number
  heartbeatPrompt?: string | null
  heartbeatActiveHoursStart?: string | null
  heartbeatActiveHoursEnd?: string | null
  heartbeatTimezone?: string
  heartbeatTargetChannelId?: string | null
}

export interface PopulatedAgent extends Agent {
  tools: AgentTool[]
}

// Request types
export interface CreateAgentRequest {
  name: string
  description?: string
  systemPrompt: string
  aiProvider: AiProvider
  modelName: string
  connectionId?: string
  greeting?: string
  appearance?: AgentAppearance
  temperature?: number
  maxTokens?: number
  maxSteps?: number
  contextWindow?: number
  workerRuntime?: WorkerRuntime
  reasoningMode?: boolean
  voiceEnabled?: boolean
  voiceConfig?: VoiceConfig
}

export interface UpdateAgentRequest {
  name?: string
  description?: string | null
  systemPrompt?: string
  aiProvider?: AiProvider
  modelName?: string
  connectionId?: string | null
  greeting?: string | null
  appearance?: AgentAppearance | null
  status?: AgentStatus
  visibilityStatus?: AgentVisibility
  temperature?: number
  maxTokens?: number
  maxSteps?: number
  contextWindow?: number
  workerRuntime?: WorkerRuntime
  reasoningMode?: boolean
  voiceEnabled?: boolean
  voiceConfig?: VoiceConfig | null
  reflectionEnabled?: boolean
  reflectionDepth?: number
  heartbeatEnabled?: boolean
  heartbeatIntervalMinutes?: number
  heartbeatPrompt?: string | null
  heartbeatActiveHoursStart?: string | null
  heartbeatActiveHoursEnd?: string | null
  heartbeatTimezone?: string
  heartbeatTargetChannelId?: string | null
}

export interface ChatRequest {
  sessionId: string
  message: string
  attachmentFileIds?: string[]
}

export interface ChatUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  estimatedCostUsd: number
}

export interface ChatResponse {
  role: 'assistant'
  content: string
  steps?: unknown
  usage?: ChatUsage
}

export enum AttachmentType {
  IMAGE = 'image',
  VOICE = 'voice',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'tool'
  content: string
  toolCallId?: string
  toolName?: string
  toolInput?: unknown
  timestamp: string
  attachments?: Array<{
    type: AttachmentType
    fileId: string
    mimeType: string
    fileName?: string
    durationMs?: number
    transcription?: string
    extractedContext?: string
  }>
}

// Tool management requests
export interface AddIntegrationToolRequest {
  pieceName: string
  pieceVersion: string
  actionName: string
  connectionId?: string
  displayName?: string
}

export interface AddFlowToolRequest {
  flowId: string
  displayName?: string
  description?: string
}

export interface AddKnowledgeBaseToolRequest {
  displayName: string
  description?: string
  knowledgeBaseIds: string[]
  topK?: number
  similarityThreshold?: number
}

export interface AddDataSchemaToolRequest {
  displayName: string
  description?: string
  dataSchema: DataSchemaField[]
}

export interface UpdateToolRequest {
  displayName?: string
  description?: string | null
  enabled?: boolean
  connectionId?: string | null
}
