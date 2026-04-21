import type { BaseModel } from './common.js'

export enum FlowStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
}

export interface FlowVersion {
  id: string
  displayName: string
  description?: string
  trigger: Record<string, unknown>
  valid: boolean
  state: string
}

export interface Flow extends BaseModel {
  projectId: string
  folderId?: string | null
  status: FlowStatus
  schedule?: Record<string, unknown> | null
  publishedVersionId?: string | null
}

export interface PopulatedFlow extends Flow {
  version: FlowVersion
}

export interface CreateFlowRequest {
  displayName: string
  folderId?: string
  /** Seed the new flow from a stored flow template by id. */
  templateId?: string
  /** Scope the new flow to a location (for multi-location projects). */
  locationId?: string
  /** External id for idempotent imports from your own systems. */
  externalId?: string
}

/**
 * Shape matches the `template` field of an Activepieces FlowTemplate export
 * (the object produced by `flows.getTemplate`). Use this when importing a
 * previously-exported flow JSON or a hand-crafted template.
 */
export interface FlowTemplateExport {
  displayName: string
  trigger: Record<string, unknown>
  /** Arbitrary extra fields — retained for forward compat. */
  [key: string]: unknown
}

/** Terminal statuses — a flow run in one of these states will not transition. */
export const TERMINAL_FLOW_RUN_STATUSES = [
  'SUCCEEDED',
  'FAILED',
  'INTERNAL_ERROR',
  'TIMEOUT',
  'CANCELED',
  'QUOTA_EXCEEDED',
  'MEMORY_LIMIT_EXCEEDED',
] as const

export type TerminalFlowRunStatus = (typeof TERMINAL_FLOW_RUN_STATUSES)[number]

export interface FlowRun {
  id: string
  created: string
  updated: string
  flowId: string
  flowVersionId: string
  projectId: string
  status: string
  startTime: string
  finishTime?: string | null
  tasks?: number
  duration?: number
  pauseMetadata?: Record<string, unknown> | null
  [key: string]: unknown
}

export interface ListFlowRunsParams {
  flowId?: string
  status?: string
  limit?: number
  cursor?: string
  createdAfter?: string
  createdBefore?: string
}

/**
 * Options for `flows.runAndWait` — the polling-based alternative to
 * `runSync` when you want fine-grained control over timeout/interval.
 */
export interface RunAndWaitOptions {
  /** How long to poll before giving up, in ms. Default 300_000 (5 min). */
  timeoutMs?: number
  /** Gap between polls, in ms. Default 2_000. */
  pollIntervalMs?: number
  /** Called on every poll with the current run. Useful for UI progress. */
  onProgress?: (run: FlowRun) => void
}

export interface ListFlowsParams {
  folderId?: string
  limit?: number
  cursor?: string
  status?: FlowStatus
  name?: string
}

export interface CountFlowsParams {
  folderId?: string
  status?: FlowStatus
}

export interface UpdateFlowStatusRequest {
  type: 'CHANGE_STATUS'
  request: {
    status: FlowStatus
  }
}

export interface UpdateFlowNameRequest {
  type: 'CHANGE_NAME'
  request: {
    displayName: string
  }
}

export interface UpdateFlowFolderRequest {
  type: 'MOVE_TO_FOLDER'
  request: {
    folderId: string | null
  }
}

/**
 * Replace the entire flow contents with a previously-exported template
 * (displayName, trigger, full step tree). Used by `flows.createFromJson`.
 */
export interface ImportFlowRequest {
  type: 'IMPORT_FLOW'
  request: {
    displayName: string
    /** The trigger step definition — matches FlowTemplate.template.trigger */
    trigger: Record<string, unknown>
    /** Optional schedule (CRON) */
    schedule?: Record<string, unknown> | null
  }
}

export type FlowOperationRequest =
  | UpdateFlowStatusRequest
  | UpdateFlowNameRequest
  | UpdateFlowFolderRequest
  | ImportFlowRequest

export interface RunFlowRequest {
  /** Payload to send to the flow's webhook trigger */
  payload?: Record<string, unknown>
  /** HTTP headers to include in the webhook request */
  headers?: Record<string, string>
}

export interface FlowRunResponse {
  /** The flow run ID */
  id: string
  /** Flow run status */
  status: string
  /** Output from the flow (only available for synchronous runs) */
  output?: unknown
  [key: string]: unknown
}
