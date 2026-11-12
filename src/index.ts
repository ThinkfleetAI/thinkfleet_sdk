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

export type { SeekPage, RequestOptions, RequestInterceptor, ResponseInterceptor, QueryParams } from './core/types.js'
export {
  normalizePieceName,
  denormalizeLegacyPiecePrefix,
  rewriteLegacyPiecePrefixDeep,
} from './core/piece-name.js'

// Resources
export { KnowledgeBasesResource, KnowledgeBaseDocumentsResource, KnowledgeBaseSourcesResource } from './resources/knowledge-bases.js'
export { McpResource, McpToolCallsResource } from './resources/mcp.js'
export { FunctionsResource } from './resources/functions.js'
export { DatabasesResource } from './resources/databases.js'
export { ContactsResource } from './resources/contacts.js'
export { LatticeResource } from './resources/lattice.js'
export {
  EngagementResource,
  EngagementRulesResource,
  PromotionsResource,
  DispatchLogResource,
  EngagementSettingsResource,
} from './resources/engagement.js'
export { ConnectionsResource, GlobalConnectionsResource } from './resources/connections.js'
export { FlowsResource } from './resources/flows.js'
export { FlowRunsResource } from './resources/flow-runs.js'
export { LocationsResource } from './resources/locations.js'
export { ProjectsResource } from './resources/projects.js'

export type {
  Location,
  LocationNode,
  LocationMember,
  LocationAddress,
  LocationStatus,
  LocationRole,
  CreateLocationRequest,
  UpdateLocationRequest,
  MoveLocationRequest,
  AddLocationMemberRequest,
} from './types/locations.js'

export type {
  FlowRun,
  FlowTemplateExport,
  ListFlowRunsParams,
  RunAndWaitOptions,
  TerminalFlowRunStatus,
} from './types/flows.js'
export { TERMINAL_FLOW_RUN_STATUSES } from './types/flows.js'

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

// Types — MCP, Functions, Databases, customer intelligence
export type * from './types/mcp.js'
export type * from './types/functions.js'
export type * from './types/databases.js'
export type * from './types/contacts.js'
export type * from './types/lattice.js'
export type * from './types/engagement.js'

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
  AppConnectionStatus,
  GlobalConnection,
  ListGlobalConnectionsParams,
  UpsertGlobalConnectionRequest,
  UpdateGlobalConnectionRequest,
  AddProjectsToGlobalConnectionRequest,
  RemoveProjectsFromGlobalConnectionRequest,
} from './types/connections.js'

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

// Resources — Event Destinations (webhook subscriptions for platform events)
export { EventDestinationsResource } from './resources/event-destinations.js'
export type {
  EventDestination,
  CreateEventDestinationRequest,
  UpdateEventDestinationRequest,
  ListEventDestinationsParams,
  TestEventDestinationRequest,
} from './types/event-destinations.js'
export { ApplicationEventName } from './types/event-destinations.js'

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

// Resources — Secret Managers (BYO external vault for connection secrets)
export { SecretManagersResource } from './resources/secret-managers.js'
export {
  SecretManagerProvider,
  SecretManagerScope,
  SECRET_MANAGER_FIELDS_SEPARATOR,
  buildSecretReference,
} from './types/secret-managers.js'
export type {
  HashicorpConfig,
  AwsSecretsManagerConfig,
  CyberArkConfig,
  OnePasswordConfig,
  SecretManagerConfig,
  SecretManagerConnection,
  SecretManagerConnectionStatus,
  SecretManagerConnectionWithStatus,
  ConnectSecretManagerRequest,
  ListSecretManagersParams,
} from './types/secret-managers.js'
