import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  Crew,
  CrewProject,
  CrewExecution,
  BoardColumn,
  BoardTask,
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
} from '../types/crews.js'

export class CrewColumnsResource {
  constructor(private readonly http: HttpClient, private readonly crewBasePath: () => string) {}

  async list(crewProjectId: string, options?: RequestOptions): Promise<BoardColumn[]> {
    return this.http.get<BoardColumn[]>(`${this.crewBasePath()}/projects/${crewProjectId}/columns`, undefined, options)
  }

  async create(crewProjectId: string, body: CreateBoardColumnRequest, options?: RequestOptions): Promise<BoardColumn> {
    return this.http.post<BoardColumn>(`${this.crewBasePath()}/projects/${crewProjectId}/columns`, body, options)
  }

  async update(crewProjectId: string, columnId: string, body: UpdateBoardColumnRequest, options?: RequestOptions): Promise<BoardColumn> {
    return this.http.patch<BoardColumn>(`${this.crewBasePath()}/projects/${crewProjectId}/columns/${columnId}`, body, options)
  }

  async delete(crewProjectId: string, columnId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`${this.crewBasePath()}/projects/${crewProjectId}/columns/${columnId}`, options)
  }

  async reorder(crewProjectId: string, body: ReorderColumnsRequest, options?: RequestOptions): Promise<void> {
    return this.http.post(`${this.crewBasePath()}/projects/${crewProjectId}/columns/reorder`, body, options)
  }
}

export class CrewTasksResource {
  constructor(private readonly http: HttpClient, private readonly crewBasePath: () => string) {}

  async list(crewProjectId: string, options?: RequestOptions): Promise<BoardTask[]> {
    return this.http.get<BoardTask[]>(`${this.crewBasePath()}/projects/${crewProjectId}/tasks`, undefined, options)
  }

  async create(crewProjectId: string, body: CreateBoardTaskRequest, options?: RequestOptions): Promise<BoardTask> {
    return this.http.post<BoardTask>(`${this.crewBasePath()}/projects/${crewProjectId}/tasks`, body, options)
  }

  async update(crewProjectId: string, taskId: string, body: UpdateBoardTaskRequest, options?: RequestOptions): Promise<BoardTask> {
    return this.http.patch<BoardTask>(`${this.crewBasePath()}/projects/${crewProjectId}/tasks/${taskId}`, body, options)
  }

  async delete(crewProjectId: string, taskId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`${this.crewBasePath()}/projects/${crewProjectId}/tasks/${taskId}`, options)
  }

  async move(crewProjectId: string, taskId: string, body: MoveTaskRequest, options?: RequestOptions): Promise<BoardTask> {
    return this.http.post<BoardTask>(`${this.crewBasePath()}/projects/${crewProjectId}/tasks/${taskId}/move`, body, options)
  }

  async run(crewProjectId: string, taskId: string, body?: RunBoardTaskRequest, options?: RequestOptions): Promise<BoardTaskExecutionResponse> {
    return this.http.post<BoardTaskExecutionResponse>(
      `${this.crewBasePath()}/projects/${crewProjectId}/tasks/${taskId}/run`,
      body,
      { ...options, timeout: options?.timeout ?? 120000 },
    )
  }
}

export class CrewsResource {
  readonly columns: CrewColumnsResource
  readonly tasks: CrewTasksResource
  private currentCrewId: string | null = null

  constructor(private readonly http: HttpClient) {
    const getBasePath = () => {
      if (!this.currentCrewId) throw new Error('No crew context set. Call crews.get() first or use forCrew().')
      return `/crews/${this.currentCrewId}`
    }
    this.columns = new CrewColumnsResource(http, getBasePath)
    this.tasks = new CrewTasksResource(http, getBasePath)
  }

  forCrew(crewId: string): this {
    this.currentCrewId = crewId
    return this
  }

  async list(options?: RequestOptions): Promise<Crew[]> {
    return this.http.get<Crew[]>('/crews', undefined, options)
  }

  async create(body: CreateCrewRequest, options?: RequestOptions): Promise<Crew> {
    return this.http.post<Crew>('/crews', body, options)
  }

  async get(crewId: string, options?: RequestOptions): Promise<Crew> {
    this.currentCrewId = crewId
    return this.http.get<Crew>(`/crews/${crewId}`, undefined, options)
  }

  async update(crewId: string, body: UpdateCrewRequest, options?: RequestOptions): Promise<Crew> {
    return this.http.patch<Crew>(`/crews/${crewId}`, body, options)
  }

  async delete(crewId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/crews/${crewId}`, options)
  }

  async execute(crewId: string, body: ExecuteCrewRequest, options?: RequestOptions): Promise<CrewExecution> {
    return this.http.post<CrewExecution>(
      `/crews/${crewId}/execute`,
      body,
      { ...options, timeout: options?.timeout ?? 120000 },
    )
  }

  // Project methods
  async listProjects(crewId: string, options?: RequestOptions): Promise<CrewProject[]> {
    return this.http.get<CrewProject[]>(`/crews/${crewId}/projects`, undefined, options)
  }

  async createProject(crewId: string, body: CreateCrewProjectRequest, options?: RequestOptions): Promise<CrewProject> {
    return this.http.post<CrewProject>(`/crews/${crewId}/projects`, body, options)
  }

  async getProject(crewId: string, projectId: string, options?: RequestOptions): Promise<CrewProject> {
    return this.http.get<CrewProject>(`/crews/${crewId}/projects/${projectId}`, undefined, options)
  }

  async updateProject(crewId: string, projectId: string, body: UpdateCrewProjectRequest, options?: RequestOptions): Promise<CrewProject> {
    return this.http.patch<CrewProject>(`/crews/${crewId}/projects/${projectId}`, body, options)
  }

  async deleteProject(crewId: string, projectId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/crews/${crewId}/projects/${projectId}`, options)
  }

  async getBoard(crewId: string, projectId: string, options?: RequestOptions): Promise<ProjectBoardResponse> {
    return this.http.get<ProjectBoardResponse>(`/crews/${crewId}/projects/${projectId}/board`, undefined, options)
  }

  async getCostSummary(crewId: string, projectId: string, options?: RequestOptions): Promise<CostSummary> {
    return this.http.get<CostSummary>(`/crews/${crewId}/projects/${projectId}/cost-summary`, undefined, options)
  }
}
