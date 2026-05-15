import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  ContactContextResponse,
  ExtractPatternsRequest,
  ExtractPatternsResult,
  GetContextParams,
  LatticeSearchParams,
  LatticeSearchResponse,
  ListLatticeContactsParams,
  ListLatticeContactsResponse,
  ListPatternsParams,
  ListPatternsResponse,
  MonitorTickResult,
  RunDemoSeedRequest,
  RunDemoSeedResult,
} from '../types/lattice.js'

/**
 * Lattice — behavioral pattern intelligence.
 *
 * Mines a contact's event history for repeatable behaviors (weekly
 * purchases, daily logins, Friday-evening orders…) and emits
 * `pattern_break` contact events when an expected pattern fails to
 * fire. The engagement system consumes those events to drive outreach.
 *
 * The server-side implementation is a Rust gRPC engine — the SDK
 * speaks REST to the ThinkFleet API which translates to gRPC. Same
 * latency profile from the caller's view; the speed wins show up
 * under load.
 *
 * @example
 * ```ts
 * // Bulk re-extract patterns across the project
 * const result = await tf.lattice.extractPatterns({ windowDays: 90 })
 * console.log(`${result.patternsCreated} new patterns mined`)
 *
 * // List contacts with active patterns
 * const { contacts } = await tf.lattice.listContacts({ activeOnly: true })
 *
 * // Get a contact's full retrieval bundle for AI message rendering
 * const ctx = await tf.lattice.getContext(contactId)
 *
 * // Search across contacts, events, and patterns
 * const hits = await tf.lattice.search({ q: 'pizza' })
 * ```
 */
export class LatticeResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Force pattern (re-)extraction. Omit `contactId` to run a bulk
   * extraction across every contact in the project (capped at 5000
   * contacts per call server-side).
   *
   * Rate-limited at 10 calls/minute/client when the platform's
   * `API_RATE_LIMIT_AUTHN_ENABLED` flag is on.
   */
  async extractPatterns(
    body: ExtractPatternsRequest = {},
    options?: RequestOptions,
  ): Promise<ExtractPatternsResult> {
    return this.http.post<ExtractPatternsResult>('/lattice/patterns/extract', body, options)
  }

  /**
   * Manually run the monitor tick. The platform runs this on a 15-min
   * cron, so manual triggers exist primarily for debugging or for
   * tests that need an overdue pattern to fire immediately.
   *
   * Distributed-locked at the project scope: if another worker is
   * already ticking, the call returns a zero-valued result rather than
   * blocking.
   */
  async runMonitorTick(options?: RequestOptions): Promise<MonitorTickResult> {
    return this.http.post<MonitorTickResult>('/lattice/monitor/tick', {}, options)
  }

  /**
   * List contacts in the project that have at least one behavior pattern,
   * with active/total counts and the earliest upcoming `nextExpectedAt`.
   * Sorted by most-recently-updated pattern first.
   */
  async listContacts(
    params?: ListLatticeContactsParams,
    options?: RequestOptions,
  ): Promise<ListLatticeContactsResponse> {
    return this.http.get<ListLatticeContactsResponse>(
      '/lattice/contacts',
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }

  /**
   * List the behavioral patterns Lattice has learned for a contact.
   * Pass `includeInactive: true` for historical reasoning (e.g.
   * "Sarah used to order Fridays").
   */
  async listPatterns(
    contactId: string,
    params?: ListPatternsParams,
    options?: RequestOptions,
  ): Promise<ListPatternsResponse> {
    return this.http.get<ListPatternsResponse>(
      `/lattice/contacts/${encodeURIComponent(contactId)}/patterns`,
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }

  /**
   * Full retrieval bundle for a contact — profile, active patterns,
   * recent events, recent memories. The single payload a downstream
   * AI message-rendering step needs to produce a personalized response
   * without juggling multiple API calls.
   *
   * Includes a PPA-16 scope walk: USER/SESSION memories joined with
   * PROJECT/PLATFORM broadcast memories not tied to a specific contact,
   * ordered most-specific-first so token-budget truncation keeps the
   * right items.
   */
  async getContext(
    contactId: string,
    params?: GetContextParams,
    options?: RequestOptions,
  ): Promise<ContactContextResponse> {
    return this.http.get<ContactContextResponse>(
      `/lattice/contacts/${encodeURIComponent(contactId)}/context`,
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }

  /**
   * Cross-entity search across contacts, contact events, and behavior
   * patterns. Use when you don't know ahead of time which entity holds
   * the data you're looking for.
   *
   * The query must be at least 2 characters; shorter queries return
   * empty results to keep the search useful.
   */
  async search(
    params: LatticeSearchParams,
    options?: RequestOptions,
  ): Promise<LatticeSearchResponse> {
    const query: Record<string, string | number | undefined> = {
      q: params.q,
      limit: params.limit,
    }
    if (params.types && params.types.length > 0) {
      query.types = params.types.join(',')
    }
    return this.http.get<LatticeSearchResponse>('/lattice/search', query, options)
  }

  /**
   * Generate synthetic contacts + purchase events with embedded
   * Sarah-style patterns. **Dev / QA only** — gated server-side by
   * `AP_ALLOW_DEMO_SEED=true`; production calls return 403.
   *
   * Useful for smoke-testing the full pipeline: seed → extract →
   * tick → see PATTERN_BREAK fire on the synthetic contacts.
   */
  async runDemoSeed(
    body: RunDemoSeedRequest = {},
    options?: RequestOptions,
  ): Promise<RunDemoSeedResult> {
    return this.http.post<RunDemoSeedResult>('/lattice/demo/seed', body, options)
  }
}
