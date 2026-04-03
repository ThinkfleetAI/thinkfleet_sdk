import type { BaseModel } from './common.js'

export interface OAuthProvider {
  id: string
  slug: string
  displayName: string
  authMode: string
  authorizationUrl?: string
  tokenUrl?: string
  refreshUrl?: string
  defaultScopes?: string[]
  scopeSeparator?: string
  categories?: string[]
  disablePkce?: boolean
  authorizationMethod?: string
  bodyFormat?: string
  docs?: string
  logoUrl?: string
}

export interface IntegrationConfig extends BaseModel {
  platformId: string
  projectId?: string
  providerSlug: string
  clientId: string
  scopes?: string[]
  additionalConfig?: Record<string, unknown>
  enabled: boolean
}

export interface CreateIntegrationConfigRequest {
  providerSlug: string
  clientId: string
  clientSecret: string
  scopes?: string[]
  additionalConfig?: Record<string, unknown>
}

export interface AvailableProvider {
  slug: string
  displayName: string
  authMode: string
  logoUrl?: string
  connectionCount: number
  configured: boolean
}

export interface InitiateOAuthRequest {
  providerSlug: string
  connectionDisplayName?: string
  callbackUrl: string
  scopes?: string[]
}

export interface InitiateOAuthResponse {
  authorizationUrl: string
  sessionId: string
}

export interface ClientCredentialsRequest {
  providerSlug: string
  connectionDisplayName?: string
  clientId?: string
  clientSecret?: string
  scopes?: string[]
}

export interface DirectConnectRequest {
  providerSlug: string
  connectionDisplayName?: string
  credentials: Record<string, string>
}

export interface OAuthConnection extends BaseModel {
  displayName: string
  providerSlug: string
  status: string
  pieceName: string
  externalId: string
}

export interface ProxyRequestOptions {
  connectionId: string
  method?: string
  baseUrlOverride?: string
  retries?: number
}

export interface ListProvidersParams {
  authMode?: string
  category?: string
  search?: string
  limit?: number
  offset?: number
}
