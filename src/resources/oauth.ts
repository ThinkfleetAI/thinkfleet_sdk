import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  OAuthProvider,
  IntegrationConfig,
  CreateIntegrationConfigRequest,
  AvailableProvider,
  InitiateOAuthRequest,
  InitiateOAuthResponse,
  ClientCredentialsRequest,
  DirectConnectRequest,
  OAuthConnection,
  ListProvidersParams,
} from '../types/oauth.js'

export class OAuthResource {
  readonly providers: OAuthProvidersResource
  readonly configs: OAuthConfigsResource

  constructor(private readonly http: HttpClient) {
    this.providers = new OAuthProvidersResource(http)
    this.configs = new OAuthConfigsResource(http)
  }

  /** Initiate an OAuth2 Authorization Code flow. Returns the authorization URL to redirect the user. */
  async initiate(body: InitiateOAuthRequest, options?: RequestOptions): Promise<InitiateOAuthResponse> {
    return this.http.post<InitiateOAuthResponse>('/oauth/initiate', body, options)
  }

  /** Create a connection using Client Credentials grant. */
  async clientCredentials(body: ClientCredentialsRequest, options?: RequestOptions): Promise<OAuthConnection> {
    return this.http.post<OAuthConnection>('/oauth/client-credentials', body, options)
  }

  /** Create a connection directly (API key, Basic auth, custom). */
  async connect(body: DirectConnectRequest, options?: RequestOptions): Promise<OAuthConnection> {
    return this.http.post<OAuthConnection>('/oauth/connect', body, options)
  }

  /**
   * Send an authenticated proxy request through a stored connection.
   * The proxy auto-injects the OAuth token or API key.
   * Agents use this so they never see raw credentials.
   *
   * Connection metadata is passed in the request body wrapper.
   */
  async proxy(
    path: string,
    body: unknown,
    connectionId: string,
    proxyOptions?: { method?: string; baseUrlOverride?: string; retries?: number },
    options?: RequestOptions,
  ): Promise<unknown> {
    return this.http.post(`/proxy/${path}`, {
      connectionId,
      method: proxyOptions?.method ?? 'POST',
      baseUrlOverride: proxyOptions?.baseUrlOverride,
      retries: proxyOptions?.retries,
      body,
    }, options)
  }
}

export class OAuthProvidersResource {
  constructor(private readonly http: HttpClient) {}

  /** List all available OAuth providers (400+). */
  async list(params?: ListProvidersParams, options?: RequestOptions): Promise<OAuthProvider[]> {
    return this.http.get<OAuthProvider[]>(
      '/providers',
      params as Record<string, string | number | boolean | undefined>,
      { ...options, rawPath: true },
    )
  }

  /** Get a specific provider by slug. */
  async get(slug: string, options?: RequestOptions): Promise<OAuthProvider> {
    return this.http.get<OAuthProvider>(`/providers/${slug}`, undefined, { ...options, rawPath: true })
  }
}

export class OAuthConfigsResource {
  constructor(private readonly http: HttpClient) {}

  /** List integration configs (project + platform defaults). */
  async list(options?: RequestOptions): Promise<IntegrationConfig[]> {
    return this.http.get<IntegrationConfig[]>('/integration-configs', undefined, options)
  }

  /** List providers with active connections and connection counts. */
  async listAvailable(options?: RequestOptions): Promise<AvailableProvider[]> {
    return this.http.get<AvailableProvider[]>('/integration-configs/available', undefined, options)
  }

  /** Create or update OAuth app credentials for a provider. */
  async create(body: CreateIntegrationConfigRequest, options?: RequestOptions): Promise<IntegrationConfig> {
    return this.http.post<IntegrationConfig>('/integration-configs', body, options)
  }

  /** Delete an integration config. */
  async delete(configId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/integration-configs/${configId}`, options)
  }
}
