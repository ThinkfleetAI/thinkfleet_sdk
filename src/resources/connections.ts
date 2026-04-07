import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  Connection,
  InitiateConnectionRequest,
  InitiateConnectionResponse,
  ClientCredentialsRequest,
  DirectConnectRequest,
  TestConnectionResponse,
  ListConnectionsParams,
  MethodForPieceResponse,
} from '../types/connections.js'

/**
 * OAuth connections for service integrations.
 *
 * Usage flow:
 * 1. `connections.methodForPiece('gmail')` — check if native OAuth is configured
 * 2. `connections.initiate({ providerSlug: 'google', callbackUrl: '...' })` — get OAuth URL
 * 3. Open `authorizationUrl` in browser/popup for user consent
 * 4. User authorizes → callback creates connection server-side
 * 5. `connections.list()` — find the new connection
 * 6. `connections.test(connectionId)` — verify it works
 *
 * Or for API key / Basic auth:
 * ```typescript
 * const conn = await client.connections.connect({
 *   providerSlug: 'openai',
 *   credentials: { api_key: 'sk-...' },
 * })
 * ```
 */
export class ConnectionsResource {
  constructor(private readonly http: HttpClient) {}

  /** List connections for the current project. */
  async list(params?: ListConnectionsParams, options?: RequestOptions): Promise<{ data: Connection[]; next: string | null; previous: string | null }> {
    return this.http.get('/app-connections', params as Record<string, string | number | boolean | undefined>, { ...options, rawPath: true })
  }

  /** Get a single connection by ID. */
  async get(connectionId: string, options?: RequestOptions): Promise<Connection> {
    return this.http.get<Connection>(`/app-connections/${connectionId}`, undefined, { ...options, rawPath: true })
  }

  /** Delete a connection. */
  async delete(connectionId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/app-connections/${connectionId}`, { ...options, rawPath: true })
  }

  /** Test a connection — validates token, refreshes if needed, makes a real API call. */
  async test(connectionId: string, options?: RequestOptions): Promise<TestConnectionResponse> {
    return this.http.post<TestConnectionResponse>(`/app-connections/${connectionId}/test`, {}, { ...options, rawPath: true })
  }

  /**
   * Check which OAuth method is available for a piece.
   * Returns 'native' if integration config credentials exist, 'composio' otherwise.
   */
  async methodForPiece(pieceName: string, options?: RequestOptions): Promise<MethodForPieceResponse> {
    return this.http.get<MethodForPieceResponse>(
      `/oauth/method-for-piece/${encodeURIComponent(pieceName)}`,
      undefined,
      options,
    )
  }

  /**
   * Initiate an OAuth2 Authorization Code flow.
   * Returns the authorization URL to redirect the user to.
   */
  async initiate(body: InitiateConnectionRequest, options?: RequestOptions): Promise<InitiateConnectionResponse> {
    return this.http.post<InitiateConnectionResponse>('/oauth/initiate', body, options)
  }

  /** Create a connection using OAuth2 Client Credentials grant (no user interaction). */
  async clientCredentials(body: ClientCredentialsRequest, options?: RequestOptions): Promise<{ connectionId: string }> {
    return this.http.post<{ connectionId: string }>('/oauth/client-credentials', body, options)
  }

  /** Create a connection directly with API key, Basic auth, or custom credentials. */
  async connect(body: DirectConnectRequest, options?: RequestOptions): Promise<{ connectionId: string }> {
    return this.http.post<{ connectionId: string }>('/oauth/connect', body, options)
  }
}
