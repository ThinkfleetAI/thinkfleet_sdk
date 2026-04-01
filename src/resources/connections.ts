import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import { normalizePieceName } from '../core/piece-name.js'
import type {
  ComposioApp,
  MappedComposioApp,
  InitiateConnectionRequest,
  InitiateConnectionResponse,
  FinalizeConnectionRequest,
  FinalizeConnectionResponse,
  ConnectionStatusResponse,
  ComposioIntegration,
  InitiateIntegrationRequest,
  FinalizeIntegrationRequest,
  FinalizeIntegrationResponse,
  ComposioAction,
} from '../types/connections.js'

/** Merge rawPath: true into request options */
function raw(options?: RequestOptions): RequestOptions {
  return { ...options, rawPath: true }
}

/**
 * OAuth connections for service integrations.
 *
 * Usage flow for mobile/desktop apps:
 * 1. `connections.isConfigured()` — check if OAuth provider is available
 * 2. `connections.listApps()` — show available services to the user
 * 3. `connections.initiate({ pieceName: 'gmail', projectId, displayName })` — get OAuth URL
 * 4. Open `redirectUrl` in system browser / in-app browser / WebView
 * 5. User authorizes → browser redirects to callback (handled server-side)
 * 6. Poll `connections.getStatus(composioAccountId)` until status is 'ACTIVE'
 * 7. `connections.finalize({ composioAccountId, pieceName: 'gmail', projectId, displayName })`
 *
 * Or use the convenience method:
 * ```typescript
 * const result = await client.connections.connect(
 *   { pieceName: 'gmail', projectId, displayName: 'Gmail' },
 *   (url) => Linking.openURL(url),  // React Native
 * )
 * ```
 */
export class ConnectionsResource {
  readonly integrations: ComposioIntegrationsResource

  constructor(private readonly http: HttpClient) {
    this.integrations = new ComposioIntegrationsResource(http)
  }

  /** Check if Composio is configured on the platform */
  async isConfigured(options?: RequestOptions): Promise<boolean> {
    const result = await this.http.get<{ configured: boolean }>('/composio/configured', undefined, raw(options))
    return result.configured
  }

  /** List all available Composio apps */
  async listApps(options?: RequestOptions): Promise<ComposioApp[]> {
    return this.http.get<ComposioApp[]>('/composio/apps', undefined, raw(options))
  }

  /** List Composio apps that are mapped to platform integrations */
  async listMappedApps(options?: RequestOptions): Promise<MappedComposioApp[]> {
    return this.http.get<MappedComposioApp[]>('/composio/apps/mapped', undefined, raw(options))
  }

  /**
   * Initiate an OAuth connection flow.
   * Returns a `redirectUrl` to open in a browser for user consent.
   */
  async initiate(body: InitiateConnectionRequest, options?: RequestOptions): Promise<InitiateConnectionResponse> {
    return this.http.post<InitiateConnectionResponse>('/composio/initiate', { ...body, pieceName: normalizePieceName(body.pieceName) }, raw(options))
  }

  /**
   * Check the status of a pending OAuth connection.
   * Poll this after the user completes the OAuth flow in the browser.
   * Status will be 'INITIATED', 'ACTIVE', or 'FAILED'.
   */
  async getStatus(composioAccountId: string, options?: RequestOptions): Promise<ConnectionStatusResponse> {
    return this.http.get<ConnectionStatusResponse>(`/composio/status/${composioAccountId}`, undefined, raw(options))
  }

  /**
   * Finalize the connection after OAuth is complete.
   * Call this after `getStatus()` returns 'ACTIVE'.
   */
  async finalize(body: FinalizeConnectionRequest, options?: RequestOptions): Promise<FinalizeConnectionResponse> {
    return this.http.post<FinalizeConnectionResponse>('/composio/finalize', { ...body, pieceName: normalizePieceName(body.pieceName) }, raw(options))
  }

  /**
   * Convenience method: initiate OAuth, wait for completion, and finalize.
   *
   * @param body - Connection parameters
   * @param openUrl - Callback to open the OAuth URL (e.g., `Linking.openURL` on React Native)
   * @param pollIntervalMs - How often to check status (default: 3000ms)
   * @param timeoutMs - Max time to wait for authorization (default: 300000ms = 5 min)
   */
  async connect(
    body: InitiateConnectionRequest,
    openUrl: (url: string) => void | Promise<void>,
    pollIntervalMs = 3000,
    timeoutMs = 300000,
    options?: RequestOptions,
  ): Promise<FinalizeConnectionResponse> {
    const { redirectUrl, composioAccountId } = await this.initiate(body, options)

    await openUrl(redirectUrl)

    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
      const { status } = await this.getStatus(composioAccountId, options)
      if (status === 'ACTIVE') {
        return this.finalize({
          composioAccountId,
          pieceName: normalizePieceName(body.pieceName),
          projectId: body.projectId,
          displayName: body.displayName,
        }, options)
      }
      if (status === 'FAILED') {
        return { success: false, error: 'OAuth authorization failed.' }
      }
    }

    return { success: false, error: 'OAuth authorization timed out.' }
  }
}

/**
 * Agent-only Composio integrations (apps not mapped to pieces).
 * These routes are project-scoped (/v1/projects/:projectId/composio-integrations/).
 */
export class ComposioIntegrationsResource {
  constructor(private readonly http: HttpClient) {}

  /** List Composio integrations for the project */
  async list(options?: RequestOptions): Promise<ComposioIntegration[]> {
    return this.http.get<ComposioIntegration[]>('/composio-integrations', undefined, options)
  }

  /** List available Composio apps not mapped to platform integrations */
  async listAvailableApps(options?: RequestOptions): Promise<ComposioApp[]> {
    return this.http.get<ComposioApp[]>('/composio-integrations/available-apps', undefined, options)
  }

  /** Initiate OAuth for an agent-only integration */
  async initiate(body: InitiateIntegrationRequest, options?: RequestOptions): Promise<InitiateConnectionResponse> {
    return this.http.post<InitiateConnectionResponse>('/composio-integrations/initiate', body, options)
  }

  /** Finalize an agent-only integration after OAuth */
  async finalize(body: FinalizeIntegrationRequest, options?: RequestOptions): Promise<FinalizeIntegrationResponse> {
    return this.http.post<FinalizeIntegrationResponse>('/composio-integrations/finalize', body, options)
  }

  /** List actions available for an integration */
  async listActions(integrationId: string, options?: RequestOptions): Promise<ComposioAction[]> {
    return this.http.get<ComposioAction[]>(`/composio-integrations/${integrationId}/actions`, undefined, options)
  }

  /** Delete an integration */
  async delete(integrationId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/composio-integrations/${integrationId}`, options)
  }
}
