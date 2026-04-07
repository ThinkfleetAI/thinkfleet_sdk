// Client
export { ThinkFleet, type ThinkFleetOptions } from './client.js'

// Core
export {
  ThinkFleetError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  TimeoutError,
} from './core/errors.js'

export type { SeekPage, RequestOptions, RequestInterceptor, ResponseInterceptor } from './core/types.js'
export { normalizePieceName } from './core/piece-name.js'

// Resources
export { AgentsResource, AgentToolsResource } from './resources/agents.js'
export { TasksResource } from './resources/tasks.js'
export { KnowledgeBasesResource, KnowledgeBaseDocumentsResource, KnowledgeBaseSourcesResource } from './resources/knowledge-bases.js'
export { McpResource, McpIntegrationsResource, McpExternalServersResource, type McpSkillsManifest } from './resources/mcp.js'
export { CrewsResource, CrewColumnsResource, CrewTasksResource } from './resources/crews.js'
export { ConnectionsResource } from './resources/connections.js'
export { VoiceResource } from './resources/voice.js'
export { MemoryResource, AdminMemoryResource, ProjectMemoryResource } from './resources/memory.js'
export { FlowsResource } from './resources/flows.js'
export { ProjectsResource } from './resources/projects.js'

// Types — Memory (backward-compatible + new)
export type {
  MemorySearchResponse,
  SaveMemoryRequest,
  SaveMemoryResponse,
} from './resources/memory.js'

// Types — Agents
export type {
  Agent,
  PopulatedAgent,
  AgentTool,
  AgentAppearance,
  VoiceConfig,
  DataSchemaField,
  CreateAgentRequest,
  UpdateAgentRequest,
  ChatRequest,
  ChatResponse,
  ChatUsage,
  ChatMessage,
  AddIntegrationToolRequest,
  AddFlowToolRequest,
  AddKnowledgeBaseToolRequest,
  AddDataSchemaToolRequest,
  UpdateToolRequest,
} from './types/agents.js'
export {
  AgentStatus,
  AgentVisibility,
  AiProvider,
  WorkerRuntime,
  VoiceProvider,
  ToolType,
  AttachmentType,
} from './types/agents.js'

// Types — Tasks
export type {
  ClassifyTaskRequest,
  ClassifyTaskResponse,
  DispatchTaskRequest,
  DispatchTaskResponse,
  DispatchCrewRequest,
  DispatchCrewResponse,
  SendTaskMessageRequest,
  TaskSessionMessage,
  TaskSessionHistoryResponse,
  ConnectedService,
  RecentSession,
  HomeFeedResponse,
  ListTaskHistoryParams,
} from './types/tasks.js'
export { TaskComplexity, TaskType } from './types/tasks.js'

// Types — Knowledge Base
export type {
  KnowledgeBase,
  KnowledgeBaseDocument,
  KnowledgeBaseChunk,
  KnowledgeBaseSource,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
  SearchKnowledgeBaseRequest,
  SearchResult,
  SearchKnowledgeBaseResponse,
  CreateSourceRequest,
  UpdateSourceRequest,
} from './types/knowledge-bases.js'
export { DocumentStatus, SourceProvider, SourceStatus } from './types/knowledge-bases.js'

// Types — MCP
export type {
  McpServer,
  PopulatedMcpServer,
  McpIntegration,
  McpExternalServer,
  AddIntegrationRequest,
  BatchAddIntegrationRequest,
  UpdateIntegrationRequest,
  UpdateMcpServerRequest,
  AddExternalServerRequest,
  UpdateExternalServerRequest,
} from './types/mcp.js'
export { McpServerStatus } from './types/mcp.js'

// Types — Crews
export type {
  Crew,
  CrewMember,
  CrewExecution,
  CrewProject,
  BoardColumn,
  BoardColumnWithTasks,
  BoardTask,
  ColumnRule,
  FlowHook,
  ProjectBoardResponse,
  BoardTaskExecutionResponse,
  CostSummary,
  CreateCrewRequest,
  UpdateCrewRequest,
  ExecuteCrewRequest,
  CreateCrewProjectRequest,
  UpdateCrewProjectRequest,
  CreateBoardColumnRequest,
  UpdateBoardColumnRequest,
  ReorderColumnsRequest,
  CreateBoardTaskRequest,
  UpdateBoardTaskRequest,
  MoveTaskRequest,
  RunBoardTaskRequest,
} from './types/crews.js'
export {
  CrewStatus,
  CrewProjectStatus,
  CrewExecutionStatus,
  BoardTaskStatus,
  BoardTaskPriority,
  BoardTaskExecutionStatus,
  ColumnModelTier,
} from './types/crews.js'

// Types — Connections (Native OAuth)
export type {
  Connection,
  InitiateConnectionRequest,
  InitiateConnectionResponse,
  ClientCredentialsRequest,
  DirectConnectRequest,
  TestConnectionResponse,
  ListConnectionsParams,
  MethodForPieceResponse,
} from './types/connections.js'

// Types — Voice
export type { VoiceCatalogEntry, SynthesizeVoiceRequest } from './types/voice.js'
export {
  DEEPGRAM_VOICES,
  ELEVENLABS_VOICES,
  OPENAI_VOICES,
  ALL_VOICES,
  getVoicesByProvider,
  getDefaultVoiceId,
} from './types/voice.js'

// Types — Flows
export type {
  Flow,
  PopulatedFlow,
  FlowVersion,
  CreateFlowRequest,
  ListFlowsParams,
  CountFlowsParams,
  FlowOperationRequest,
  UpdateFlowStatusRequest,
  UpdateFlowNameRequest,
  UpdateFlowFolderRequest,
  RunFlowRequest,
  FlowRunResponse,
} from './types/flows.js'
export { FlowStatus } from './types/flows.js'

// Types — Memory (full)
export type {
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
} from './types/memory.js'
export {
  MemoryItemType,
  MemoryScope,
  MemoryStatus,
  MemoryImpact,
  MemoryFeedbackRating,
} from './types/memory.js'

// Types — Projects
export type {
  Project,
  ProjectPlan,
  CreateProjectRequest,
  UpdateProjectRequest,
} from './types/projects.js'

// Types — Common
export type { BaseModel } from './types/common.js'

// Resources — Guardrails
export { GuardrailsResource } from './resources/guardrails.js'
export type {
  GuardrailPolicy,
  UpdateGuardrailPolicyRequest,
  GuardrailCheckResult,
  ScanTextRequest,
  ScanTextResult,
  PatternCatalog,
  PatternCatalogEntry,
  ModerationConfig,
  PromptInjectionConfig,
  PiiDetectionConfig,
  TokenBudget,
  ModelAccessPolicy,
  DataProtectionConfig,
  CustomPattern,
  TokenUsageDaily,
} from './types/guardrails.js'
export {
  GuardrailAction,
  GuardrailSensitivity,
  GuardrailViolationType,
  ModelAccessMode,
} from './types/guardrails.js'

// Resources — Shield (AI Proxy Governance)
export { ShieldResource } from './resources/shield.js'
export type {
  ShieldOverview,
  ShieldRequest,
  ShieldCostAnalytics,
  ShieldDeveloperBreakdown,
  ListShieldRequestsParams,
} from './types/shield.js'

// Resources — OAuth (Provider Registry + Credential Governance)
export { OAuthResource, OAuthProvidersResource, OAuthConfigsResource } from './resources/oauth.js'
export type {
  OAuthProvider,
  IntegrationConfig,
  CreateIntegrationConfigRequest,
  AvailableProvider,
  InitiateOAuthRequest,
  InitiateOAuthResponse,
  OAuthConnection,
  ProxyRequestOptions,
  ListProvidersParams,
} from './types/oauth.js'

// Resources — Org Chart (Enterprise Agent Orchestration)
export { OrgChartResource, OrgPositionsResource, OrgGoalsResource, OrgConnectedAgentsResource } from './resources/org-chart.js'
export type {
  OrgPosition,
  PopulatedOrgPosition,
  Goal,
  KeyResult,
  BudgetRequest,
  ConnectedAgent,
  PositionRuntimeConfig,
  CreatePositionRequest,
  UpdatePositionRequest,
  CreateGoalRequest,
  UpdateGoalRequest,
  RegisterAgentRequest,
  OrgCostSummary,
} from './types/org-chart.js'
export {
  AutonomyLevel,
  GoalStatus,
  RuntimeType,
} from './types/org-chart.js'
