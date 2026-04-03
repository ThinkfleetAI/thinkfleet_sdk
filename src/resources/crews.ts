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
  constructor(private readonly http: HttpClient) {}

  async list(crewId: string, crewProjectId: string, options?: RequestOptions): Promise<BoardColumn[]> {
    return this.http.get<BoardColumn[]>(`/crews/${crewId}/projects/${crewProjectId}/columns`, undefined, options)
  }

  async create(crewId: string, crewProjectId: string, body: CreateBoardColumnRequest, options?: RequestOptions): Promise<BoardColumn> {
    return this.http.post<BoardColumn>(`/crews/${crewId}/projects/${crewProjectId}/columns`, body, options)
  }

  async update(crewId: string, crewProjectId: string, columnId: string, body: UpdateBoardColumnRequest, options?: RequestOptions): Promise<BoardColumn> {
    return this.http.patch<BoardColumn>(`/crews/${crewId}/projects/${crewProjectId}/columns/${columnId}`, body, options)
  }

  async delete(crewId: string, crewProjectId: string, columnId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/crews/${crewId}/projects/${crewProjectId}/columns/${columnId}`, options)
  }

  async reorder(crewId: string, crewProjectId: string, body: ReorderColumnsRequest, options?: RequestOptions): Promise<void> {
    return this.http.post(`/crews/${crewId}/projects/${crewProjectId}/columns/reorder`, body, options)
  }
}

export class CrewTasksResource {
  constructor(private readonly http: HttpClient) {}

  async list(crewId: string, crewProjectId: string, options?: RequestOptions): Promise<BoardTask[]> {
    return this.http.get<BoardTask[]>(`/crews/${crewId}/projects/${crewProjectId}/tasks`, undefined, options)
  }

  async create(crewId: string, crewProjectId: string, body: CreateBoardTaskRequest, options?: RequestOptions): Promise<BoardTask> {
    return this.http.post<BoardTask>(`/crews/${crewId}/projects/${crewProjectId}/tasks`, body, options)
  }

  async update(crewId: string, crewProjectId: string, taskId: string, body: UpdateBoardTaskRequest, options?: RequestOptions): Promise<BoardTask> {
    return this.http.patch<BoardTask>(`/crews/${crewId}/projects/${crewProjectId}/tasks/${taskId}`, body, options)
  }

  async delete(crewId: string, crewProjectId: string, taskId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/crews/${crewId}/projects/${crewProjectId}/tasks/${taskId}`, options)
  }

  async move(crewId: string, crewProjectId: string, taskId: string, body: MoveTaskRequest, options?: RequestOptions): Promise<BoardTask> {
    return this.http.post<BoardTask>(`/crews/${crewId}/projects/${crewProjectId}/tasks/${taskId}/move`, body, options)
  }

  async run(crewId: string, crewProjectId: string, taskId: string, body?: RunBoardTaskRequest, options?: RequestOptions): Promise<BoardTaskExecutionResponse> {
    return this.http.post<BoardTaskExecutionResponse>(
      `/crews/${crewId}/projects/${crewProjectId}/tasks/${taskId}/run`,
      body,
      { ...options, timeout: options?.timeout ?? 120000 },
    )
  }
}

export class CrewsResource {
  readonly columns: CrewColumnsResource
  readonly tasks: CrewTasksResource

  constructor(private readonly http: HttpClient) {
    this.columns = new CrewColumnsResource(http)
    this.tasks = new CrewTasksResource(http)
  }

  async list(options?: RequestOptions): Promise<Crew[]> {
    return this.http.get<Crew[]>('/crews', undefined, options)
  }

  async create(body: CreateCrewRequest, options?: RequestOptions): Promise<Crew> {
    return this.http.post<Crew>('/crews', body, options)
  }

  async get(crewId: string, options?: RequestOptions): Promise<Crew> {
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
