import type { BaseModel } from './common.js'

export enum McpServerStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
}

export interface McpServer extends BaseModel {
  projectId: string
  status: McpServerStatus
  token: string
}

export interface McpIntegration extends BaseModel {
  mcpServerId: string
  projectId: string
  pieceName: string
  pieceVersion: string
  actionName: string
  connectionId: string | null
  shadowFlowId: string | null
  allowRuntimeCredentials: boolean
  displayName?: string
}

export interface McpExternalServer extends BaseModel {
  mcpServerId: string
  projectId: string
  name: string
  url: string
  protocol: string
  authConfig: unknown | null
  enabled: boolean
}

export interface PopulatedMcpServer extends McpServer {
  flows: unknown[]
  pieceTools: McpIntegration[]
  externalServers: McpExternalServer[]
}

// Requests
export interface AddIntegrationRequest {
  pieceName: string
  pieceVersion: string
  actionName: string
  connectionId?: string
  allowRuntimeCredentials?: boolean
  displayName?: string
}

export interface BatchAddIntegrationRequest {
  pieceName: string
  pieceVersion: string
  connectionId?: string
}

export interface UpdateIntegrationRequest {
  pieceName?: string
  pieceVersion?: string
  actionName?: string
  connectionId?: string
  allowRuntimeCredentials?: boolean
  displayName?: string
}

export interface UpdateMcpServerRequest {
  status: McpServerStatus
}

export interface AddExternalServerRequest {
  name: string
  url: string
  protocol?: string
  authConfig?: unknown
}

export interface UpdateExternalServerRequest {
  name?: string
  url?: string
  protocol?: string
  authConfig?: unknown
  enabled?: boolean
}
