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

export type FlowOperationRequest =
  | UpdateFlowStatusRequest
  | UpdateFlowNameRequest
  | UpdateFlowFolderRequest

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
