import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  GuardrailPolicy,
  UpdateGuardrailPolicyRequest,
  GuardrailCheckResult,
  ScanTextRequest,
  ScanTextResult,
  PatternCatalog,
} from '../types/guardrails.js'

export class GuardrailsResource {
  constructor(private readonly http: HttpClient) {}

  /** Get the guardrail policy for the current project (auto-creates defaults). */
  async get(options?: RequestOptions): Promise<GuardrailPolicy> {
    return this.http.get<GuardrailPolicy>('/guardrails', undefined, options)
  }

  /** Update the guardrail policy. */
  async update(body: UpdateGuardrailPolicyRequest, options?: RequestOptions): Promise<GuardrailPolicy> {
    return this.http.patch<GuardrailPolicy>('/guardrails', body, options)
  }

  /** Get the full data protection pattern catalog (all available patterns grouped by category). */
  async getPatternCatalog(options?: RequestOptions): Promise<PatternCatalog> {
    return this.http.get<PatternCatalog>('/guardrails/patterns', undefined, options)
  }

  /** Test scan a text against the project's enabled data protection patterns. */
  async testScan(body: ScanTextRequest, options?: RequestOptions): Promise<ScanTextResult> {
    return this.http.post<ScanTextResult>('/guardrails/test', body, options)
  }
}
