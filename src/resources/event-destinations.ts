import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions, SeekPage } from '../core/types.js'
import type {
  CreateEventDestinationRequest,
  EventDestination,
  ListEventDestinationsParams,
  TestEventDestinationRequest,
  UpdateEventDestinationRequest,
} from '../types/event-destinations.js'

/**
 * Event destinations — register external webhook URLs to receive
 * platform events (flow run finished, flow created, etc.).
 *
 * @example
 * ```ts
 * // Get notified every time any flow run finishes
 * await tf.eventDestinations.create({
 *   url: 'https://my-app.example.com/hooks/thinkfleet',
 *   events: [ApplicationEventName.FLOW_RUN_FINISHED],
 * })
 *
 * // The webhook payload includes the flow run + status (succeeded / failed / etc.)
 * // so you can branch on the result without polling.
 * ```
 *
 * **Auth:** these routes require a platform-admin API key. A standard
 * project-scoped API key won't have access.
 *
 * **Verifying delivery:** `tf.eventDestinations.test({ url })` POSTs a
 * synthetic FLOW_CREATED event to your URL — handy for confirming
 * connectivity + signature handling before subscribing live events.
 */
export class EventDestinationsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all event destinations registered on this platform.
   */
  async list(params?: ListEventDestinationsParams, options?: RequestOptions): Promise<SeekPage<EventDestination>> {
    return this.http.get<SeekPage<EventDestination>>(
      '/event-destinations',
      params as Record<string, string | number | boolean | undefined>,
      { ...options, rawPath: true },
    )
  }

  /**
   * Register a new event destination — a URL + the list of event types
   * to deliver to it. Same URL can be registered multiple times with
   * different event subsets if you want to fan out by topic.
   */
  async create(body: CreateEventDestinationRequest, options?: RequestOptions): Promise<EventDestination> {
    return this.http.post<EventDestination>('/event-destinations', body, { ...options, rawPath: true })
  }

  /**
   * Update an existing destination's URL or event subscription list.
   */
  async update(id: string, body: UpdateEventDestinationRequest, options?: RequestOptions): Promise<EventDestination> {
    return this.http.patch<EventDestination>(`/event-destinations/${id}`, body, { ...options, rawPath: true })
  }

  /**
   * Delete a destination. In-flight deliveries already queued may still
   * fire once before the deletion takes effect.
   */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/event-destinations/${id}`, { ...options, rawPath: true })
  }

  /**
   * Send a synthetic FLOW_CREATED event to the URL — a connectivity test.
   * Doesn't create a destination row; just exercises the delivery path.
   */
  async test(body: TestEventDestinationRequest, options?: RequestOptions): Promise<{ success: true }> {
    return this.http.post<{ success: true }>('/event-destinations/test', body, { ...options, rawPath: true })
  }
}
