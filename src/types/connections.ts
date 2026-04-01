export interface ComposioApp {
  appId: string
  name: string
  description: string
  authSchemes: string[]
  logo?: string
  categories: string[]
  supportsOAuth: boolean
  primaryAuth?: 'oauth' | 'api_key' | 'both'
}

export interface MappedComposioApp {
  composioSlug: string
  composioName: string
  composioLogo?: string
  pieceName: string | null
  supportsOAuth: boolean
}

export interface InitiateConnectionRequest {
  /** Short piece name, e.g. "gmail", "slack", "google-sheets" */
  pieceName: string
  projectId: string
  displayName: string
}

export interface InitiateConnectionResponse {
  redirectUrl: string
  pendingId: string
  composioAccountId: string
}

export interface FinalizeConnectionRequest {
  composioAccountId: string
  /** Short piece name, e.g. "gmail", "slack", "google-sheets" */
  pieceName: string
  projectId: string
  displayName: string
}

export interface FinalizeConnectionResponse {
  success: boolean
  connectionId?: string
  error?: string
}

export interface ConnectionStatusResponse {
  status: string
}

// Agent-only integrations (Composio apps not mapped to pieces)
export interface ComposioIntegration {
  id: string
  projectId: string
  platformId: string
  composioSlug: string
  composioAccountId: string
  displayName: string
  composioAppName: string
  composioLogo?: string
  status: 'ACTIVE' | 'ERROR'
  created: string
  updated: string
}

export interface InitiateIntegrationRequest {
  composioSlug: string
  displayName: string
}

export interface FinalizeIntegrationRequest {
  composioAccountId: string
  composioSlug: string
  displayName: string
}

export interface FinalizeIntegrationResponse {
  success: boolean
  integrationId?: string
  error?: string
}

export interface ComposioAction {
  name: string
  displayName: string
  description: string
  parameters: unknown
}
