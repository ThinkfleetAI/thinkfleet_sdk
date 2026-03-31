import { HttpClient } from './core/http-client.js'
import { AgentsResource } from './resources/agents.js'
import { TasksResource } from './resources/tasks.js'
import { KnowledgeBasesResource } from './resources/knowledge-bases.js'
import { McpResource } from './resources/mcp.js'
import { CrewsResource } from './resources/crews.js'
import { ConnectionsResource } from './resources/connections.js'
import { VoiceResource } from './resources/voice.js'
import { MemoryResource } from './resources/memory.js'
import { FlowsResource } from './resources/flows.js'
import { ProjectsResource } from './resources/projects.js'

export interface ThinkFleetOptions {
  /** API key in the format `sk-XXXXX...` */
  apiKey: string
  /** Default project ID for all requests */
  projectId: string
  /** Base URL of the ThinkFleet API (default: `https://api.thinkfleet.ai`) */
  baseUrl?: string
  /** Maximum number of retries for failed requests (default: 2) */
  maxRetries?: number
  /** Default timeout in milliseconds (default: 30000). Agent chat uses 120000ms. */
  timeout?: number
  /** Custom fetch implementation for environments without native fetch */
  fetch?: typeof globalThis.fetch
}

export class ThinkFleet {
  readonly agents: AgentsResource
  readonly tasks: TasksResource
  readonly knowledgeBases: KnowledgeBasesResource
  readonly mcp: McpResource
  readonly crews: CrewsResource
  readonly connections: ConnectionsResource
  readonly voice: VoiceResource
  readonly memory: MemoryResource
  readonly flows: FlowsResource
  readonly projects: ProjectsResource

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
      baseUrl: (options.baseUrl ?? 'https://api.thinkfleet.ai').replace(/\/+$/, ''),
      maxRetries: options.maxRetries ?? 2,
      timeout: options.timeout ?? 30000,
      fetchFn: options.fetch ?? globalThis.fetch.bind(globalThis),
    })

    this.agents = new AgentsResource(http)
    this.tasks = new TasksResource(http)
    this.knowledgeBases = new KnowledgeBasesResource(http)
    this.mcp = new McpResource(http)
    this.crews = new CrewsResource(http)
    this.connections = new ConnectionsResource(http)
    this.voice = new VoiceResource(http)
    this.memory = new MemoryResource(http)
    this.flows = new FlowsResource(http, options.projectId)
    this.projects = new ProjectsResource(http)
  }
}
