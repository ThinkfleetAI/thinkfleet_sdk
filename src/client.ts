import { HttpClient } from './core/http-client.js'
import { ConnectionsResource } from './resources/connections.js'
import { ContactsResource } from './resources/contacts.js'
import { DatabasesResource } from './resources/databases.js'
import { EngagementResource } from './resources/engagement.js'
import { EventDestinationsResource } from './resources/event-destinations.js'
import { FlowRunsResource } from './resources/flow-runs.js'
import { FlowsResource } from './resources/flows.js'
import { FunctionsResource } from './resources/functions.js'
import { GuardrailsResource } from './resources/guardrails.js'
import { KnowledgeBasesResource } from './resources/knowledge-bases.js'
import { LatticeResource } from './resources/lattice.js'
import { LocationsResource } from './resources/locations.js'
import { McpResource } from './resources/mcp.js'
import { OAuthResource } from './resources/oauth.js'
import { ProjectsResource } from './resources/projects.js'
import { SecretManagersResource } from './resources/secret-managers.js'

export interface ThinkFleetOptions {
  /** API key in the format `sk-XXXXX...` */
  apiKey: string
  /** Default project ID for all requests */
  projectId: string
  /** Base URL of the ThinkFleet API (default: `https://app.thinkfleet.ai`) */
  baseUrl?: string
  /** Maximum number of retries for failed requests (default: 2) */
  maxRetries?: number
  /** Default timeout in milliseconds (default: 30000). */
  timeout?: number
  /** Custom fetch implementation for environments without native fetch */
  fetch?: typeof globalThis.fetch
}

export class ThinkFleet {
  readonly functions: FunctionsResource
  readonly databases: DatabasesResource
  readonly contacts: ContactsResource
  readonly lattice: LatticeResource
  readonly engagement: EngagementResource
  readonly knowledgeBases: KnowledgeBasesResource
  readonly mcp: McpResource
  readonly connections: ConnectionsResource
  readonly flows: FlowsResource
  readonly flowRuns: FlowRunsResource
  readonly locations: LocationsResource
  readonly projects: ProjectsResource
  readonly guardrails: GuardrailsResource
  readonly oauth: OAuthResource
  readonly eventDestinations: EventDestinationsResource
  readonly secretManagers: SecretManagersResource

  constructor(options: ThinkFleetOptions) {
    if (!options.apiKey) {
      throw new Error('ThinkFleet: apiKey is required')
    }
    if (!options.projectId) {
      throw new Error('ThinkFleet: projectId is required')
    }

    const http = new HttpClient({
      apiKey: options.apiKey,
      projectId: options.projectId,
      baseUrl: (options.baseUrl ?? 'https://app.thinkfleet.ai').replace(/\/+$/, ''),
      maxRetries: options.maxRetries ?? 2,
      timeout: options.timeout ?? 30000,
      fetchFn: options.fetch ?? globalThis.fetch.bind(globalThis),
    })

    this.functions = new FunctionsResource(http)
    this.databases = new DatabasesResource(http)
    this.contacts = new ContactsResource(http)
    this.lattice = new LatticeResource(http)
    this.engagement = new EngagementResource(http)
    this.knowledgeBases = new KnowledgeBasesResource(http)
    this.mcp = new McpResource(http)
    this.connections = new ConnectionsResource(http)
    this.flows = new FlowsResource(http, options.projectId)
    this.flowRuns = new FlowRunsResource(http, options.projectId)
    this.locations = new LocationsResource(http)
    this.projects = new ProjectsResource(http)
    this.guardrails = new GuardrailsResource(http)
    this.oauth = new OAuthResource(http)
    this.eventDestinations = new EventDestinationsResource(http)
    this.secretManagers = new SecretManagersResource(http)
  }
}
