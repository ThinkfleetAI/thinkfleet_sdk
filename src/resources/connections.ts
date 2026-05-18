import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions, SeekPage } from '../core/types.js'
import { normalizePieceName } from '../core/piece-name.js'
import type {
  Connection,
  InitiateConnectionRequest,
  InitiateConnectionResponse,
  ClientCredentialsRequest,
  DirectConnectRequest,
  TestConnectionResponse,
  ListConnectionsParams,
  MethodForPieceResponse,
  GlobalConnection,
  ListGlobalConnectionsParams,
  UpsertGlobalConnectionRequest,
  UpdateGlobalConnectionRequest,
  AddProjectsToGlobalConnectionRequest,
  RemoveProjectsFromGlobalConnectionRequest,
} from '../types/connections.js'

function raw(options?: RequestOptions): RequestOptions {
  return { ...options, rawPath: true }
}

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
  /**
   * Platform-scoped ("global") connections shared across one or more projects.
   * Set `allProjects: true` on upsert to share with every project on the
   * platform — including projects created after the connection. Requires
   * platform-admin credentials.
   */
  readonly global: GlobalConnectionsResource

  constructor(private readonly http: HttpClient) {
    this.global = new GlobalConnectionsResource(http)
  }

  /** List connections for the current project. */
  async list(params?: ListConnectionsParams, options?: RequestOptions): Promise<{ data: Connection[]; next: string | null; previous: string | null }> {
    return this.http.get('/app-connections', params as Record<string, string | number | boolean | undefined>, { ...options, rawPath: true, injectProjectId: true })
  }

  /**
   * Get a single connection by ID.
   *
   * The platform has no dedicated `GET /app-connections/{id}` endpoint, so this
   * method fetches the project-scoped list and filters client-side. Throws
   * `NotFoundError` if the ID isn't in the current project.
   */
  async get(connectionId: string, options?: RequestOptions): Promise<Connection> {
    const page = await this.list(undefined, options)
    const found = page.data.find(c => c.id === connectionId)
    if (!found) {
      const { NotFoundError } = await import('../core/errors.js')
      throw new NotFoundError(`Connection ${connectionId} not found in project`)
    }
    return found
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

/**
 * Global (platform-scoped) connections.
 *
 * A global connection is owned by the platform and made visible to one or
 * more projects via its `projectIds` allowlist. Set `allProjects: true` to
 * make a connection available to every project on the platform — including
 * projects created *after* the connection.
 *
 * @example
 * ```typescript
 * // Option A — set-and-forget: connection follows all current and future projects
 * await tf.connections.global.upsert({
 *   type: 'SECRET_TEXT',
 *   pieceName: 'openai',
 *   displayName: 'OpenAI (platform)',
 *   value: { type: 'SECRET_TEXT', secret_text: process.env.OPENAI_API_KEY },
 *   projectIds: [],
 *   allProjects: true,
 * })
 *
 * // Option B — selective: when you create a new project, grant access to existing globals
 * const project = await tf.projects.create({ displayName: 'New Project' })
 * await tf.connections.global.addProjects(connectionId, { projectIds: [project.id] })
 * ```
 *
 * All routes require platform-admin authentication.
 */
export class GlobalConnectionsResource {
  constructor(private readonly http: HttpClient) {}

  /** List all global connections on the platform. */
  async list(params?: ListGlobalConnectionsParams, options?: RequestOptions): Promise<SeekPage<GlobalConnection>> {
    const query: Record<string, string | number | boolean | undefined> = {}
    if (params?.cursor) query.cursor = params.cursor
    if (params?.limit) query.limit = params.limit
    if (params?.displayName) query.displayName = params.displayName
    if (params?.pieceName) query.pieceName = params.pieceName
    if (params?.status) query.status = params.status.join(',')
    return this.http.get<SeekPage<GlobalConnection>>('/global-connections', query, raw(options))
  }

  /**
   * Create or upsert a global connection. Pass `allProjects: true` to make the
   * connection available to every project on the platform, including projects
   * created after this call.
   */
  async upsert(body: UpsertGlobalConnectionRequest, options?: RequestOptions): Promise<GlobalConnection> {
    return this.http.post<GlobalConnection>('/global-connections', {
      ...body,
      pieceName: normalizePieceName(body.pieceName),
      scope: 'PLATFORM',
    }, raw(options))
  }

  /**
   * Update an existing global connection.
   * - Pass `allProjects: true` to make it available to all projects (current and future).
   * - Pass `projectIds` to replace the explicit allowlist (ignored when `allProjects` is true).
   */
  async update(connectionId: string, body: UpdateGlobalConnectionRequest, options?: RequestOptions): Promise<GlobalConnection> {
    return this.http.post<GlobalConnection>(`/global-connections/${connectionId}`, body, raw(options))
  }

  /** Delete a global connection. */
  async delete(connectionId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete<void>(`/global-connections/${connectionId}`, raw(options))
  }

  /**
   * Add one or more projects to an existing global connection.
   *
   * Idempotent — already-present project IDs are deduped. Useful when you
   * create a new project and want to grant it access to existing globals
   * without rewriting the full `projectIds` array.
   */
  async addProjects(connectionId: string, body: AddProjectsToGlobalConnectionRequest, options?: RequestOptions): Promise<GlobalConnection> {
    return this.http.post<GlobalConnection>(`/global-connections/${connectionId}/projects/add`, body, raw(options))
  }

  /** Remove one or more projects from an existing global connection. */
  async removeProjects(connectionId: string, body: RemoveProjectsFromGlobalConnectionRequest, options?: RequestOptions): Promise<GlobalConnection> {
    return this.http.post<GlobalConnection>(`/global-connections/${connectionId}/projects/remove`, body, raw(options))
  }
}
