import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions, SeekPage } from '../core/types.js'
import type {
  FlowRun,
  ListFlowRunsParams,
  TerminalFlowRunStatus,
} from '../types/flows.js'
import { TERMINAL_FLOW_RUN_STATUSES } from '../types/flows.js'

/** /v1/flow-runs is not under /projects/:projectId/ */
function raw(options?: RequestOptions): RequestOptions {
  return { ...options, rawPath: true }
}

/**
 * Access historical flow runs + poll for completion.
 *
 * The platform already offers webhook-sync execution via `flows.runSync`.
 * Use this resource when you need:
 *   - History: list past runs, filter by flow or status.
 *   - Inspection: fetch run details including tasks and duration.
 *   - Custom polling UX: start a run via `flows.run` then poll `get` on your
 *     own timeline (e.g. to show a UI progress bar or push events to a bus).
 */
export class FlowRunsResource {
  private readonly projectId: string

  constructor(private readonly http: HttpClient, projectId: string) {
    this.projectId = projectId
  }

  /**
   * List flow runs in the project.
   *
   * @example
   * ```ts
   * const runs = await tf.flowRuns.list({ status: 'FAILED', limit: 50 })
   * ```
   */
  async list(params?: ListFlowRunsParams, options?: RequestOptions): Promise<SeekPage<FlowRun>> {
    return this.http.get<SeekPage<FlowRun>>(
      '/flow-runs',
      { projectId: this.projectId, ...params } as Record<string, string | number | boolean | undefined>,
      raw(options),
    )
  }

  /**
   * Get a single flow run by id.
   */
  async get(runId: string, options?: RequestOptions): Promise<FlowRun> {
    return this.http.get<FlowRun>(`/flow-runs/${runId}`, undefined, raw(options))
  }

  /**
   * Retry a failed flow run.
   */
  async retry(runId: string, options?: RequestOptions): Promise<FlowRun> {
    return this.http.post<FlowRun>(`/flow-runs/${runId}/retry`, undefined, raw(options))
  }

  /**
   * True when the run has reached a status it won't transition out of
   * (SUCCEEDED, FAILED, TIMEOUT, CANCELED, etc.).
   */
  static isTerminal(run: { status: string }): run is { status: TerminalFlowRunStatus } {
    return (TERMINAL_FLOW_RUN_STATUSES as readonly string[]).includes(run.status)
  }

  /**
   * Poll a run until it reaches a terminal status or the timeout elapses.
   * Returns the final run object.
   *
   * @example
   * ```ts
   * const started = await tf.flows.run('flowId', { payload: { q: 'hi' } })
   * const finished = await tf.flowRuns.wait(started.id, {
   *   timeoutMs: 60_000,
   *   onProgress: (r) => console.log(r.status),
   * })
   * if (finished.status !== 'SUCCEEDED') throw new Error(finished.status)
   * ```
   */
  async wait(
    runId: string,
    options?: RequestOptions & {
      timeoutMs?: number
      pollIntervalMs?: number
      onProgress?: (run: FlowRun) => void
    },
  ): Promise<FlowRun> {
    const deadline = Date.now() + (options?.timeoutMs ?? 300_000)
    const interval = options?.pollIntervalMs ?? 2_000

    while (true) {
      const run = await this.get(runId, options)
      options?.onProgress?.(run)
      if (FlowRunsResource.isTerminal(run)) return run
      if (Date.now() > deadline) {
        throw new Error(`flowRuns.wait: timed out after ${options?.timeoutMs ?? 300_000}ms waiting for run ${runId} (last status: ${run.status})`)
      }
      await sleep(interval)
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
