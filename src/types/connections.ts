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
  /** Optional piece name for internal bookkeeping, e.g. "@activepieces/piece-gmail" */
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
