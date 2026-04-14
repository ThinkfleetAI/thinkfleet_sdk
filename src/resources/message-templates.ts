import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  ChannelPolicy,
  ClawdbotMessageTemplate,
  CreateMessageTemplateRequest,
  PreviewMessageTemplateRequest,
  RenderedMessageTemplate,
  RenderMessageTemplateRequest,
  UpdateMessageTemplateRequest,
} from '../types/message-templates.js'

/**
 * Reusable message templates with placeholder syntax that hydrates from
 * the contact memory profile, A/B variants with deterministic per-contact
 * selection, and pre-flight channel policy validation.
 */
export class MessageTemplatesResource {
  constructor(private readonly http: HttpClient) {}

  async list(options?: RequestOptions): Promise<ClawdbotMessageTemplate[]> {
    return this.http.get<ClawdbotMessageTemplate[]>(`/message-templates`, undefined, options)
  }

  async get(templateId: string, options?: RequestOptions): Promise<ClawdbotMessageTemplate> {
    return this.http.get<ClawdbotMessageTemplate>(`/message-templates/${templateId}`, undefined, options)
  }

  async create(body: CreateMessageTemplateRequest, options?: RequestOptions): Promise<ClawdbotMessageTemplate> {
    return this.http.post<ClawdbotMessageTemplate>(`/message-templates`, body, options)
  }

  async update(
    templateId: string,
    body: UpdateMessageTemplateRequest,
    options?: RequestOptions,
  ): Promise<ClawdbotMessageTemplate> {
    return this.http.patch<ClawdbotMessageTemplate>(`/message-templates/${templateId}`, body, options)
  }

  async remove(templateId: string, options?: RequestOptions): Promise<void> {
    await this.http.delete<void>(`/message-templates/${templateId}`, options)
  }

  /**
   * Render a template against a real contact's memory profile.
   * Resolves variant selection, hydrates placeholders, and validates
   * the rendered output against the channel policy.
   *
   * @example
   * ```ts
   * const rendered = await tf.messageTemplates.render('tpl_abc', {
   *   contactId: 'con_xyz',
   *   extras: { promotion: { code: 'PIZZA20', discountValue: 20 } },
   * })
   * console.log(rendered.body, rendered.policyWarnings)
   * ```
   */
  async render(
    templateId: string,
    params?: RenderMessageTemplateRequest,
    options?: RequestOptions,
  ): Promise<RenderedMessageTemplate> {
    return this.http.post<RenderedMessageTemplate>(
      `/message-templates/${templateId}/render`,
      params ?? {},
      options,
    )
  }

  /**
   * Preview a template using sample data (no real contact required).
   */
  async preview(
    templateId: string,
    body: PreviewMessageTemplateRequest = {},
    options?: RequestOptions,
  ): Promise<RenderedMessageTemplate> {
    return this.http.post<RenderedMessageTemplate>(
      `/message-templates/${templateId}/preview`,
      body,
      options,
    )
  }

  /**
   * Get channel policy snapshots for all supported channels.
   * Used to power char counters / constraint hints in your own UI.
   */
  async channelPolicies(options?: RequestOptions): Promise<ChannelPolicy[]> {
    return this.http.get<ChannelPolicy[]>(`/message-templates/channel-policies`, undefined, options)
  }
}
