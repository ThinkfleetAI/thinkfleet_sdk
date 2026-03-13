import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions, SeekPage } from '../core/types.js'
import type {
  ClassifyTaskRequest,
  ClassifyTaskResponse,
  DispatchTaskRequest,
  DispatchTaskResponse,
  DispatchCrewRequest,
  DispatchCrewResponse,
  SendTaskMessageRequest,
  TaskSessionHistoryResponse,
  HomeFeedResponse,
  RecentSession,
  ListTaskHistoryParams,
} from '../types/tasks.js'

export class TasksResource {
  constructor(private readonly http: HttpClient) {}

  async classify(body: ClassifyTaskRequest, options?: RequestOptions): Promise<ClassifyTaskResponse> {
    return this.http.post<ClassifyTaskResponse>('/tasks/classify', body, options)
  }

  async dispatch(body: DispatchTaskRequest, options?: RequestOptions): Promise<DispatchTaskResponse> {
    return this.http.post<DispatchTaskResponse>('/tasks/dispatch', body, options)
  }

  async dispatchCrew(body: DispatchCrewRequest, options?: RequestOptions): Promise<DispatchCrewResponse> {
    return this.http.post<DispatchCrewResponse>('/tasks/dispatch-crew', body, options)
  }

  async feed(options?: RequestOptions): Promise<HomeFeedResponse> {
    return this.http.get<HomeFeedResponse>('/tasks/feed', undefined, options)
  }

  async listHistory(params?: ListTaskHistoryParams, options?: RequestOptions): Promise<SeekPage<RecentSession>> {
    return this.http.get<SeekPage<RecentSession>>('/tasks/history', params as Record<string, string | number | boolean | undefined>, options)
  }

  async getHistory(agentId: string, sessionId: string, options?: RequestOptions): Promise<TaskSessionHistoryResponse> {
    return this.http.get<TaskSessionHistoryResponse>(`/tasks/${agentId}/${sessionId}/history`, undefined, options)
  }

  async sendFollowUp(agentId: string, sessionId: string, body: SendTaskMessageRequest, options?: RequestOptions): Promise<{ queued: boolean }> {
    return this.http.post<{ queued: boolean }>(
      `/tasks/${agentId}/${sessionId}/send`,
      body,
      { ...options, timeout: options?.timeout ?? 120000 },
    )
  }
}
