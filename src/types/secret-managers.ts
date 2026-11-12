/**
 * Secret Managers — bring your own external vault for connection secrets.
 *
 * Connect HashiCorp Vault, AWS Secrets Manager, CyberArk Conjur, or
 * 1Password. Once connected, a connection's secret fields can hold a
 * *reference* of the form `{{<connectionId>|ap_sep_v1|<path>}}` instead of
 * the raw secret. ThinkFleet resolves the reference from your vault at flow
 * run time — the secret value never lands in ThinkFleet's database.
 *
 * Mounted at the API under `/api/v1/secret-managers`. These routes require a
 * platform-admin API key (a project-scoped key won't have access). Available
 * on plans with the Secret Managers entitlement.
 */

/** Supported external vault providers. */
export enum SecretManagerProvider {
  HASHICORP = 'hashicorp',
  AWS = 'aws',
  CYBERARK = 'cyberark-conjur',
  ONEPASSWORD = 'onepassword',
}

/** Which projects may resolve secrets from a given connection. */
export enum SecretManagerScope {
  /** Resolvable by every project on the platform. */
  PLATFORM = 'PLATFORM',
  /** Resolvable only by the projects listed in `projectIds`. */
  PROJECT = 'PROJECT',
}

/** Delimiter inside a secret reference string. */
export const SECRET_MANAGER_FIELDS_SEPARATOR = '|ap_sep_v1|'

// --- Per-provider auth config (sent on connect; never returned) -------------

export interface HashicorpConfig {
  /** Vault base URL, e.g. https://vault.example.com */
  url: string
  /** Optional Vault Enterprise namespace. */
  namespace?: string
  /** AppRole role id. */
  roleId: string
  /** AppRole secret id. */
  secretId: string
}

export interface AwsSecretsManagerConfig {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

export interface CyberArkConfig {
  organizationAccountName: string
  loginId: string
  url: string
  apiKey: string
}

export interface OnePasswordConfig {
  /** 1Password Service Account token. */
  serviceAccountToken: string
}

export type SecretManagerConfig =
  | HashicorpConfig
  | AwsSecretsManagerConfig
  | CyberArkConfig
  | OnePasswordConfig

// --- Models -----------------------------------------------------------------

export interface SecretManagerConnection {
  id: string
  created: string
  updated: string
  platformId: string
  providerId: SecretManagerProvider
  name: string
  scope: SecretManagerScope
  /** Present only when scope is PROJECT. */
  projectIds?: string[]
}

export interface SecretManagerConnectionStatus {
  /** Whether stored credentials exist. */
  configured: boolean
  /** Whether the last live check to the vault succeeded. */
  connected: boolean
}

export interface SecretManagerConnectionWithStatus extends SecretManagerConnection {
  status: SecretManagerConnectionStatus
}

// --- Requests ---------------------------------------------------------------

interface ConnectBase {
  name: string
  scope: SecretManagerScope
  /** Required when scope is PROJECT. */
  projectIds?: string[]
}

export type ConnectSecretManagerRequest =
  | (ConnectBase & { providerId: SecretManagerProvider.HASHICORP, config: HashicorpConfig })
  | (ConnectBase & { providerId: SecretManagerProvider.AWS, config: AwsSecretsManagerConfig })
  | (ConnectBase & { providerId: SecretManagerProvider.CYBERARK, config: CyberArkConfig })
  | (ConnectBase & { providerId: SecretManagerProvider.ONEPASSWORD, config: OnePasswordConfig })

export interface ListSecretManagersParams {
  /** Filter to managers visible to this project. */
  projectId?: string
}

/**
 * Build a secret reference to drop into a connection value field. The
 * reference resolves to the live secret at flow run time.
 *
 * The `path` format is provider-specific:
 *   - HashiCorp: `mount/data/path:key` (e.g. `secret/data/db:password`)
 *   - AWS:       `secretName:jsonKey`  (e.g. `prod/db-creds:password`)
 *   - CyberArk:  the Conjur variable id
 *   - 1Password: `op://vault/item/field`
 *
 * @example
 * ```ts
 * const ref = buildSecretReference(mgr.id, 'prod/db-creds:password')
 * await tf.connections.upsert({ ..., value: { password: ref } })
 * ```
 */
export function buildSecretReference(connectionId: string, path: string): string {
  return `{{${connectionId}${SECRET_MANAGER_FIELDS_SEPARATOR}${path}}}`
}
