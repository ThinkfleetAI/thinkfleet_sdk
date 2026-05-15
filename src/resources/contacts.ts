import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  ClawdbotContact,
  ClawdbotContactEvent,
  ContactProfile,
  CreateContactEventRequest,
  CreateContactRequest,
  LookupContactRequest,
  LookupContactResponse,
  UpdateContactRequest,
} from '../types/contacts.js'

/**
 * Contacts resource — CRM-like customer records that anchor agent memory.
 *
 * Two scopes:
 *  - chatbot-scoped CRUD via /chatbots/:chatbotId/contacts
 *  - project-scoped lookup + profile via /contacts/{lookup,...}
 *
 * Use `lookup()` or `lookupOrCreate()` from external integrations
 * (POS, support tickets, etc) — you don't need the internal contact ID.
 */
export class ContactsResource {
  constructor(private readonly http: HttpClient) {}

  // ─── chatbot-scoped CRUD ──────────────────────────────────────────

  async list(chatbotId: string, options?: RequestOptions): Promise<ClawdbotContact[]> {
    return this.http.get<ClawdbotContact[]>(
      `/chatbots/${chatbotId}/contacts`,
      undefined,
      options,
    )
  }

  async create(
    chatbotId: string,
    body: CreateContactRequest,
    options?: RequestOptions,
  ): Promise<ClawdbotContact> {
    return this.http.post<ClawdbotContact>(
      `/chatbots/${chatbotId}/contacts`,
      body,
      options,
    )
  }

  async update(
    chatbotId: string,
    contactId: string,
    body: UpdateContactRequest,
    options?: RequestOptions,
  ): Promise<ClawdbotContact> {
    return this.http.patch<ClawdbotContact>(
      `/chatbots/${chatbotId}/contacts/${contactId}`,
      body,
      options,
    )
  }

  async remove(chatbotId: string, contactId: string, options?: RequestOptions): Promise<void> {
    await this.http.delete<void>(`/chatbots/${chatbotId}/contacts/${contactId}`, options)
  }

  // ─── project-scoped lookup + profile ─────────────────────────────

  /**
   * Look up a contact by phone, email, or external system ID. Optionally
   * auto-creates if no contact matches.
   *
   * @example
   * ```ts
   * const result = await tf.contacts.lookup({
   *   phone: '+15551234567',
   *   autoCreate: true,
   *   chatbotId: 'cb_abc123',
   *   defaults: { name: 'Sarah' },
   * })
   * console.log(result.contact?.chatIdentityId)
   * ```
   */
  async lookup(body: LookupContactRequest, options?: RequestOptions): Promise<LookupContactResponse> {
    return this.http.post<LookupContactResponse>(`/contacts/lookup`, body, options)
  }

  /**
   * Get the structured memory profile for a contact.
   * Returns preferences, behavioral patterns, key facts, recent events,
   * and raw memory items in one canonical shape.
   */
  async getProfile(
    contactId: string,
    options?: RequestOptions,
  ): Promise<{ profile: ContactProfile | null; error?: string }> {
    return this.http.get<{ profile: ContactProfile | null; error?: string }>(
      `/contacts/${contactId}/profile`,
      undefined,
      options,
    )
  }

  /**
   * Look up a contact AND fetch their structured memory profile in one call.
   */
  async lookupProfile(
    body: { phone?: string; email?: string; externalId?: { systemKey: string; value: string } },
    options?: RequestOptions,
  ): Promise<{ profile: ContactProfile | null }> {
    return this.http.post<{ profile: ContactProfile | null }>(
      `/contacts/lookup-profile`,
      body,
      options,
    )
  }

  // ─── contact events ───────────────────────────────────────────────

  /**
   * Log a contact event (purchase, feedback, interaction, etc.).
   * Triggers async memory extraction in the background.
   */
  async logEvent(
    body: CreateContactEventRequest,
    options?: RequestOptions,
  ): Promise<ClawdbotContactEvent> {
    return this.http.post<ClawdbotContactEvent>(`/contact-events`, body, options)
  }

  async listEvents(
    params?: { contactId?: string; eventType?: string; since?: string; limit?: number; offset?: number },
    options?: RequestOptions,
  ): Promise<ClawdbotContactEvent[]> {
    return this.http.get<ClawdbotContactEvent[]>(
      `/contact-events`,
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }
}
