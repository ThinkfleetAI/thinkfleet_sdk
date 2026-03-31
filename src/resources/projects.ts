import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions, SeekPage } from '../core/types.js'
import type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
} from '../types/projects.js'

export class ProjectsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all projects the authenticated user has access to.
   *
   * @example
   * ```ts
   * const projects = await tf.projects.list()
   * ```
   */
  async list(options?: RequestOptions): Promise<SeekPage<Project>> {
    return this.http.get<SeekPage<Project>>('/projects', undefined, { ...options, rawPath: true })
  }

  /**
   * Get a project by ID.
   *
   * @example
   * ```ts
   * const project = await tf.projects.get('projectId')
   * ```
   */
  async get(projectId: string, options?: RequestOptions): Promise<Project> {
    return this.http.get<Project>(`/projects/${projectId}`, undefined, { ...options, rawPath: true })
  }

  /**
   * Create a new project on the platform.
   *
   * @example
   * ```ts
   * const project = await tf.projects.create({
   *   displayName: 'My New Project',
   * })
   * ```
   */
  async create(body: CreateProjectRequest, options?: RequestOptions): Promise<Project> {
    return this.http.post<Project>('/projects', body, { ...options, rawPath: true })
  }

  /**
   * Update a project's settings.
   *
   * @example
   * ```ts
   * await tf.projects.update('projectId', {
   *   displayName: 'Renamed Project',
   * })
   * ```
   */
  async update(projectId: string, body: UpdateProjectRequest, options?: RequestOptions): Promise<Project> {
    return this.http.post<Project>(`/projects/${projectId}`, body, { ...options, rawPath: true })
  }
}
