import type { BaseModel } from './common.js'

/** A configured OAuth connection to a service. */
export interface Connection extends BaseModel {
  displayName: string
  pieceName: string
  externalId: string
  type: string
  status: 'ACTIVE' | 'ERROR' | 'EXPIRED'
  scope: 'PROJECT' | 'USER' | 'PLATFORM'
  ownerId?: string
}

/** Request to initiate an OAuth connection flow. */
export interface InitiateConnectionRequest {
  /** Provider slug from the provider registry, e.g. "microsoft", "google", "github" */
  providerSlug: string
  /** Optional piece name — short form ("gmail") preferred; long form ("@thinkfleet/piece-gmail") also accepted */
  pieceName?: string
  /** Display name for the connection */
  connectionDisplayName?: string
  /** OAuth callback URL — defaults to the platform's callback */
  callbackUrl: string
  /** OAuth scopes to request. If omitted, uses the provider's defaults. */
  scopes?: string[]
  /** Dynamic connection config (e.g., tenant ID for Microsoft) */
  connectionConfig?: Record<string, string>
}

/** Response from initiating an OAuth flow. */
export interface InitiateConnectionResponse {
  /** URL to redirect the user to for OAuth consent */
  authorizationUrl: string
  /** Session ID for tracking (stored server-side) */
  sessionId: string
}

/** Request to create a connection using Client Credentials grant. */
export interface ClientCredentialsRequest {
  providerSlug: string
  connectionDisplayName?: string
  scopes?: string[]
  connectionConfig?: Record<string, string>
}

/** Request to create a connection directly (API key, Basic auth, custom). */
export interface DirectConnectRequest {
  providerSlug: string
  connectionDisplayName?: string
  credentials: Record<string, string>
}

/** Result of testing a connection. */
export interface TestConnectionResponse {
  status: 'active' | 'error' | 'not_found'
  message: string
  refreshed?: boolean
}

/** Query parameters for listing connections. */
export interface ListConnectionsParams {
  pieceName?: string
  status?: string
  limit?: number
  cursor?: string
}

/** Request to check which OAuth method to use for a piece. */
export interface MethodForPieceResponse {
  method: 'native' | 'composio'
  providerSlug: string | null
  hasCredentials: boolean
  provider: {
    slug: string
    displayName: string
    defaultScopes: string[]
  } | null
}

// -----------------------------------------------------------------------------
// Global (platform-scoped) connections
// -----------------------------------------------------------------------------

export type AppConnectionStatus = 'ACTIVE' | 'MISSING' | 'ERROR'

/**
 * Platform-scoped (global) connection — visible to one or more projects on the
 * platform. When `allProjects` is true the connection is visible to every
 * project on the platform, including projects created after the connection.
 */
export interface GlobalConnection {
  id: string
  created: string
  updated: string
  externalId: string
  displayName: string
  type: string
  pieceName: string
  providerSlug: string | null
  /** When `allProjects` is true this is empty; otherwise the explicit allowlist. */
  projectIds: string[]
  /** When true the connection is available to all projects on the platform, including future ones. */
  allProjects: boolean
  platformId: string | null
  status: AppConnectionStatus
  ownerId: string | null
  metadata: Record<string, unknown> | null
  pieceVersion: string
}

export interface ListGlobalConnectionsParams {
  cursor?: string
  limit?: number
  displayName?: string
  pieceName?: string
  status?: AppConnectionStatus[]
}

export interface UpsertGlobalConnectionRequest {
  /** Connection type — typically a value of `AppConnectionType` ('OAUTH2', 'SECRET_TEXT', etc.) */
  type: string
  pieceName: string
  displayName: string
  value: Record<string, unknown>
  /** Projects this connection is available to. Ignored when `allProjects: true`; pass `[]`. */
  projectIds: string[]
  /** Set to true to make the connection available to every project on the platform, including future ones. */
  allProjects?: boolean
  externalId?: string
  metadata?: Record<string, unknown>
  pieceVersion?: string
}

export interface UpdateGlobalConnectionRequest {
  displayName: string
  /** Ignored when `allProjects: true`. */
  projectIds?: string[]
  /** Toggle "available to all projects". */
  allProjects?: boolean
  metadata?: Record<string, unknown>
}

export interface AddProjectsToGlobalConnectionRequest {
  /** One or more project IDs to add. Existing IDs are deduped, so calling this is idempotent. */
  projectIds: string[]
}

export interface RemoveProjectsFromGlobalConnectionRequest {
  /** One or more project IDs to remove. */
  projectIds: string[]
}
