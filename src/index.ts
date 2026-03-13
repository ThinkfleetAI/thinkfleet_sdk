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

export type { SeekPage, RequestOptions } from './core/types.js'

// Resources
export { AgentsResource, AgentToolsResource } from './resources/agents.js'
export { TasksResource } from './resources/tasks.js'
export { KnowledgeBasesResource, KnowledgeBaseDocumentsResource, KnowledgeBaseSourcesResource } from './resources/knowledge-bases.js'
export { McpResource, McpIntegrationsResource, McpExternalServersResource } from './resources/mcp.js'
export { CrewsResource, CrewColumnsResource, CrewTasksResource } from './resources/crews.js'
export { ConnectionsResource, ComposioIntegrationsResource } from './resources/connections.js'

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

// Types — Connections (Composio OAuth)
export type {
  ComposioApp,
  MappedComposioApp,
  InitiateConnectionRequest,
  InitiateConnectionResponse,
  FinalizeConnectionRequest,
  FinalizeConnectionResponse,
  ConnectionStatusResponse,
  ComposioIntegration,
  InitiateIntegrationRequest,
  FinalizeIntegrationRequest,
  FinalizeIntegrationResponse,
  ComposioAction,
} from './types/connections.js'

// Types — Common
export type { BaseModel } from './types/common.js'
