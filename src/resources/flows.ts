import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions, SeekPage } from '../core/types.js'
import type {
  PopulatedFlow,
  CreateFlowRequest,
  ListFlowsParams,
  CountFlowsParams,
  FlowOperationRequest,
  RunFlowRequest,
  FlowRunResponse,
  FlowTemplateExport,
  FlowRun,
  RunAndWaitOptions,
} from '../types/flows.js'
import { FlowRunsResource } from './flow-runs.js'

/** Flows are at /v1/flows (not under /projects/:projectId/) */
function raw(options?: RequestOptions): RequestOptions {
  return { ...options, rawPath: true }
}

export class FlowsResource {
  private readonly projectId: string
  private readonly runs: FlowRunsResource

  constructor(private readonly http: HttpClient, projectId: string) {
    this.projectId = projectId
    this.runs = new FlowRunsResource(http, projectId)
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
   * Enable a flow.
   *
   * The server processes a status flip in two phases:
   *   1. Synchronous: queues a background job, sets `operationStatus`
   *      to `ENABLING`, returns the flow with `status: DISABLED`.
   *   2. Asynchronous: trigger sources register, then `status` flips
   *      to `ENABLED` and `operationStatus` resets to `NONE`.
   *
   * This method waits through phase 2 so the returned flow reflects
   * the final state. Pass `{ wait: false }` to get the legacy fire-
   * and-forget behavior (returns immediately after phase 1).
   *
   * @example
   * ```ts
   * const flow = await tf.flows.enable('flowId')
   * // flow.status === 'ENABLED'
   * ```
   */
  async enable(
    flowId: string,
    options?: RequestOptions & { wait?: boolean; pollIntervalMs?: number; pollTimeoutMs?: number },
  ): Promise<PopulatedFlow> {
    const flow = await this.update(
      flowId,
      { type: 'CHANGE_STATUS', request: { status: 'ENABLED' as any } },
      options,
    )
    if (options?.wait === false) return flow
    return this.waitForStatus(flowId, 'ENABLED', options)
  }

  /**
   * Disable a flow. Same async behavior as {@link enable}.
   *
   * @example
   * ```ts
   * const flow = await tf.flows.disable('flowId')
   * // flow.status === 'DISABLED'
   * ```
   */
  async disable(
    flowId: string,
    options?: RequestOptions & { wait?: boolean; pollIntervalMs?: number; pollTimeoutMs?: number },
  ): Promise<PopulatedFlow> {
    const flow = await this.update(
      flowId,
      { type: 'CHANGE_STATUS', request: { status: 'DISABLED' as any } },
      options,
    )
    if (options?.wait === false) return flow
    return this.waitForStatus(flowId, 'DISABLED', options)
  }

  /**
   * Poll `GET /flows/:id` until the flow reaches the target status AND
   * `operationStatus` is settled. Bounded by `pollTimeoutMs` (default
   * 30s) and `pollIntervalMs` (default 1s).
   *
   * Internal helper for {@link enable} and {@link disable}, but exposed
   * for callers who want to wait on a status change applied through
   * `update()` directly.
   */
  async waitForStatus(
    flowId: string,
    target: 'ENABLED' | 'DISABLED',
    options?: RequestOptions & { pollIntervalMs?: number; pollTimeoutMs?: number },
  ): Promise<PopulatedFlow> {
    const intervalMs = options?.pollIntervalMs ?? 1000
    const timeoutMs = options?.pollTimeoutMs ?? 30_000
    const deadline = Date.now() + timeoutMs

    let last: PopulatedFlow | null = null
    while (Date.now() < deadline) {
      const flow = await this.get(flowId, options)
      last = flow
      const settled =
        flow.status === target &&
        (flow.operationStatus === 'NONE' ||
          flow.operationStatus == null)
      if (settled) return flow
      await new Promise((r) => setTimeout(r, intervalMs))
    }

    // Timed out waiting. Return whatever we last saw — the caller can
    // inspect `operationStatus` to decide whether to keep waiting,
    // surface an error, or accept the in-flight state.
    return last ?? this.get(flowId, options)
  }

  /**
   * Rename a flow (convenience method).
   */
  async rename(flowId: string, displayName: string, options?: RequestOptions): Promise<PopulatedFlow> {
    return this.update(flowId, { type: 'CHANGE_NAME', request: { displayName } }, options)
  }

  /**
   * Construct the public webhook URL for a flow with a "Catch Webhook"
   * trigger. The URL is deterministic — `${baseUrl}/api/v1/webhooks/${flowId}`
   * — so this method just builds it from the SDK's configured baseUrl.
   *
   * Pass `sync: true` to get the synchronous variant (waits for the flow
   * to complete and returns the output).
   *
   * Authentication: webhook URLs are public by design — anyone with the
   * URL can trigger the flow. If your flow needs auth, gate it inside
   * the flow itself (check headers, body, or use the connection-token
   * pattern).
   *
   * @example
   * ```ts
   * const url = tf.flows.getWebhookUrl('myFlowId')
   * // -> 'https://app.thinkfleet.ai/api/v1/webhooks/myFlowId'
   *
   * const syncUrl = tf.flows.getWebhookUrl('myFlowId', { sync: true })
   * // -> 'https://app.thinkfleet.ai/api/v1/webhooks/myFlowId/sync'
   * ```
   */
  getWebhookUrl(flowId: string, opts?: { sync?: boolean }): string {
    const baseUrl = (this.http as any).options?.baseUrl ?? ''
    const suffix = opts?.sync ? '/sync' : ''
    return `${baseUrl}/api/v1/webhooks/${flowId}${suffix}`
  }

  /**
   * Run a flow asynchronously via its webhook trigger.
   * Returns immediately with the flow run ID.
   *
   * @example
   * ```ts
   * const run = await tf.flows.run('flowId', {
   *   payload: { email: 'user@example.com', name: 'John' },
   * })
   * console.log(run.id) // flow run ID
   * ```
   */
  async run(flowId: string, body?: RunFlowRequest, options?: RequestOptions): Promise<FlowRunResponse> {
    return this.http.post<FlowRunResponse>(`/webhooks/${flowId}`, body?.payload ?? {}, {
      ...options,
      rawPath: true,
    })
  }

  /**
   * Run a flow synchronously via its webhook trigger.
   * Waits for the flow to complete and returns the output.
   *
   * @example
   * ```ts
   * const result = await tf.flows.runSync('flowId', {
   *   payload: { query: 'summarize this document' },
   * })
   * console.log(result) // flow output
   * ```
   */
  async runSync(flowId: string, body?: RunFlowRequest, options?: RequestOptions): Promise<FlowRunResponse> {
    return this.http.post<FlowRunResponse>(`/webhooks/${flowId}/sync`, body?.payload ?? {}, {
      ...options,
      rawPath: true,
      timeout: options?.timeout ?? 120000,
    })
  }

  /**
   * Export a flow as a portable template JSON blob. Use with `createFromJson`
   * to clone the flow into another project or location.
   *
   * @example
   * ```ts
   * const exported = await tf.flows.getTemplate('flowId')
   * // Save / version `exported` as JSON.
   * ```
   */
  async getTemplate(flowId: string, options?: RequestOptions): Promise<FlowTemplateExport> {
    return this.http.get<FlowTemplateExport>(
      `/flows/${flowId}/template`,
      undefined,
      raw(options),
    )
  }

  /**
   * Create a flow from a stored template (seeded from the marketplace or a
   * previous export persisted to templates).
   *
   * @example
   * ```ts
   * const flow = await tf.flows.createFromTemplate('templateId', {
   *   displayName: 'Claims Intake — Denver',
   *   locationId: denver.id,
   * })
   * ```
   */
  async createFromTemplate(
    templateId: string,
    params: Omit<CreateFlowRequest, 'templateId'>,
    options?: RequestOptions,
  ): Promise<PopulatedFlow> {
    return this.create({ ...params, templateId }, options)
  }

  /**
   * Create a flow from a previously-exported JSON payload (e.g. the result of
   * `flows.getTemplate`, or a hand-built template). Two-step: create the flow,
   * then import the payload into it.
   *
   * @example
   * ```ts
   * const exported = await tf.flows.getTemplate(sourceFlowId)
   * const cloned = await tf.flows.createFromJson(exported.template, {
   *   locationId: denver.id,
   * })
   * ```
   */
  async createFromJson(
    template: FlowTemplateExport,
    params?: Omit<CreateFlowRequest, 'templateId'>,
    options?: RequestOptions,
  ): Promise<PopulatedFlow> {
    const flow = await this.create(
      {
        displayName: params?.displayName ?? template.displayName,
        folderId: params?.folderId,
        locationId: params?.locationId,
        externalId: params?.externalId,
      },
      options,
    )
    const imported = await this.update(
      flow.id,
      {
        type: 'IMPORT_FLOW',
        request: {
          displayName: params?.displayName ?? template.displayName,
          trigger: template.trigger,
        },
      },
      options,
    )
    return imported
  }

  /**
   * Kick off a flow run and poll until it reaches a terminal status. Returns
   * the finished FlowRun. Prefer `runSync` when the backend webhook-sync path
   * is available — `runAndWait` is the fallback for longer-running flows
   * (e.g. multi-step agent tasks) where you need a separate poll channel.
   *
   * @example
   * ```ts
   * const finished = await tf.flows.runAndWait('flowId',
   *   { payload: { caseId: '42' } },
   *   { timeoutMs: 10 * 60_000, onProgress: (r) => console.log(r.status) },
   * )
   * if (finished.status !== 'SUCCEEDED') throw new Error(finished.status)
   * ```
   */
  async runAndWait(
    flowId: string,
    body?: RunFlowRequest,
    waitOptions?: RunAndWaitOptions & RequestOptions,
  ): Promise<FlowRun> {
    const started = await this.run(flowId, body, waitOptions)
    return this.runs.wait(started.id, waitOptions)
  }
}
