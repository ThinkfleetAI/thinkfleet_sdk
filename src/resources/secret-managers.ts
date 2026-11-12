import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions, SeekPage } from '../core/types.js'
import type {
  ConnectSecretManagerRequest,
  ListSecretManagersParams,
  SecretManagerConnectionWithStatus,
} from '../types/secret-managers.js'

/**
 * Secret Managers — connect an external vault (HashiCorp Vault, AWS Secrets
 * Manager, CyberArk Conjur, 1Password) and reference its secrets from
 * connections. Secrets are fetched from your vault at flow run time and are
 * never stored in ThinkFleet's database.
 *
 * @example
 * ```ts
 * // 1. Connect a vault
 * const mgr = await tf.secretManagers.connect({
 *   name: 'Production Vault',
 *   providerId: SecretManagerProvider.HASHICORP,
 *   scope: SecretManagerScope.PLATFORM,
 *   config: {
 *     url: 'https://vault.example.com',
 *     roleId: '...',
 *     secretId: '...',
 *   },
 * })
 *
 * // 2. Reference a secret from a connection value
 * const ref = buildSecretReference(mgr.id, 'secret/data/db:password')
 * await tf.connections.upsert({ ..., value: { password: ref } })
 * ```
 *
 * **Auth:** platform-admin API key required. Available on plans with the
 * Secret Managers entitlement.
 */
export class SecretManagersResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List connected secret managers with their live status
   * (`configured` / `connected`). Pass `projectId` to filter to the
   * managers a given project may resolve.
   */
  async list(
    params?: ListSecretManagersParams,
    options?: RequestOptions,
  ): Promise<SeekPage<SecretManagerConnectionWithStatus>> {
    return this.http.get<SeekPage<SecretManagerConnectionWithStatus>>(
      '/secret-managers',
      params as Record<string, string | number | boolean | undefined>,
      { ...options, rawPath: true },
    )
  }

  /**
   * Connect a new external vault. The credentials are live-tested against
   * the provider before the connection is saved — a bad token rejects the
   * call rather than persisting a broken connection.
   */
  async connect(
    body: ConnectSecretManagerRequest,
    options?: RequestOptions,
  ): Promise<SecretManagerConnectionWithStatus> {
    return this.http.post<SecretManagerConnectionWithStatus>('/secret-managers', body, {
      ...options,
      rawPath: true,
    })
  }

  /**
   * Update an existing secret manager (re-supply the full config; it is
   * re-tested before saving). Cached secret values for this manager are
   * invalidated.
   */
  async update(
    id: string,
    body: ConnectSecretManagerRequest,
    options?: RequestOptions,
  ): Promise<SecretManagerConnectionWithStatus> {
    return this.http.post<SecretManagerConnectionWithStatus>(`/secret-managers/${id}`, body, {
      ...options,
      rawPath: true,
    })
  }

  /**
   * Disconnect a secret manager. Connections that referenced it will stop
   * resolving their secrets.
   */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/secret-managers/${id}`, { ...options, rawPath: true })
  }
}
