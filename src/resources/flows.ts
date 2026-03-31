import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions, SeekPage } from '../core/types.js'
import type {
  PopulatedFlow,
  CreateFlowRequest,
  ListFlowsParams,
  CountFlowsParams,
  FlowOperationRequest,
} from '../types/flows.js'

/** Flows are at /v1/flows (not under /projects/:projectId/) */
function raw(options?: RequestOptions): RequestOptions {
  return { ...options, rawPath: true }
}

export class FlowsResource {
  private readonly projectId: string

  constructor(private readonly http: HttpClient, projectId: string) {
    this.projectId = projectId
  }

  /**
   * List flows in the project with optional filtering.
   *
   * @example
   * ```ts
   * const flows = await tf.flows.list({ status: 'ENABLED', limit: 20 })
   * ```
   */
  async list(params?: ListFlowsParams, options?: RequestOptions): Promise<SeekPage<PopulatedFlow>> {
    return this.http.get<SeekPage<PopulatedFlow>>('/flows', { projectId: this.projectId, ...params } as Record<string, string | number | boolean | undefined>, raw(options))
  }

  /**
   * Get a single flow by ID.
   *
   * @example
   * ```ts
   * const flow = await tf.flows.get('flowId')
   * ```
   */
  async get(flowId: string, options?: RequestOptions): Promise<PopulatedFlow> {
    return this.http.get<PopulatedFlow>(`/flows/${flowId}`, undefined, raw(options))
  }

  /**
   * Create a new flow.
   *
   * @example
   * ```ts
   * const flow = await tf.flows.create({ displayName: 'My New Flow' })
   * ```
   */
  async create(body: CreateFlowRequest, options?: RequestOptions): Promise<PopulatedFlow> {
    return this.http.post<PopulatedFlow>('/flows', { projectId: this.projectId, ...body }, raw(options))
  }

  /**
   * Apply an operation to a flow (change status, rename, move to folder).
   *
   * @example
   * ```ts
   * // Enable a flow
   * await tf.flows.update('flowId', {
   *   type: 'CHANGE_STATUS',
   *   request: { status: 'ENABLED' },
   * })
   *
   * // Rename a flow
   * await tf.flows.update('flowId', {
   *   type: 'CHANGE_NAME',
   *   request: { displayName: 'New Name' },
   * })
   * ```
   */
  async update(flowId: string, body: FlowOperationRequest, options?: RequestOptions): Promise<PopulatedFlow> {
    return this.http.post<PopulatedFlow>(`/flows/${flowId}`, body, raw(options))
  }

  /**
   * Delete a flow.
   *
   * @example
   * ```ts
   * await tf.flows.delete('flowId')
   * ```
   */
  async delete(flowId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/flows/${flowId}`, raw(options))
  }

  /**
   * Count flows in the project.
   *
   * @example
   * ```ts
   * const count = await tf.flows.count({ status: 'ENABLED' })
   * ```
   */
  async count(params?: CountFlowsParams, options?: RequestOptions): Promise<number> {
    return this.http.get<number>('/flows/count', { projectId: this.projectId, ...params } as Record<string, string | number | boolean | undefined>, raw(options))
  }

  /**
   * Enable a flow (convenience method).
   */
  async enable(flowId: string, options?: RequestOptions): Promise<PopulatedFlow> {
    return this.update(flowId, { type: 'CHANGE_STATUS', request: { status: 'ENABLED' as any } }, options)
  }

  /**
   * Disable a flow (convenience method).
   */
  async disable(flowId: string, options?: RequestOptions): Promise<PopulatedFlow> {
    return this.update(flowId, { type: 'CHANGE_STATUS', request: { status: 'DISABLED' as any } }, options)
  }

  /**
   * Rename a flow (convenience method).
   */
  async rename(flowId: string, displayName: string, options?: RequestOptions): Promise<PopulatedFlow> {
    return this.update(flowId, { type: 'CHANGE_NAME', request: { displayName } }, options)
  }
}
