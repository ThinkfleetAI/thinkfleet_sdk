import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  ClawdbotEngagementDispatchLog,
  ClawdbotEngagementPromotion,
  ClawdbotEngagementSettings,
  CreateEngagementPromotionRequest,
  EngagementDispatchStats,
  ListEngagementDispatchLogRequest,
  MarkPromotionRedeemedRequest,
  UpdateEngagementSettingsRequest,
} from '../types/engagement.js'

/**
 * Engagement orchestration resources:
 *  - promotions: track sent codes + redemptions
 *  - dispatchLog: audit history of every rule firing
 *  - settings: project-level promo provider + delivery flow defaults
 *
 * Exposed as a single namespaced resource so the SDK surface stays clean:
 *   tf.engagement.promotions.create(...)
 *   tf.engagement.dispatchLog.list(...)
 *   tf.engagement.settings.get()
 */
export class EngagementResource {
  readonly promotions: PromotionsResource
  readonly dispatchLog: DispatchLogResource
  readonly settings: EngagementSettingsResource

  constructor(http: HttpClient) {
    this.promotions = new PromotionsResource(http)
    this.dispatchLog = new DispatchLogResource(http)
    this.settings = new EngagementSettingsResource(http)
  }
}

export class PromotionsResource {
  constructor(private readonly http: HttpClient) {}

  async create(
    body: CreateEngagementPromotionRequest,
    options?: RequestOptions,
  ): Promise<ClawdbotEngagementPromotion> {
    return this.http.post<ClawdbotEngagementPromotion>(`/engagement-promotions`, body, options)
  }

  async markRedeemed(
    promotionId: string,
    body: MarkPromotionRedeemedRequest = {},
    options?: RequestOptions,
  ): Promise<ClawdbotEngagementPromotion> {
    return this.http.post<ClawdbotEngagementPromotion>(
      `/engagement-promotions/${promotionId}/mark-redeemed`,
      body,
      options,
    )
  }

  async listForContact(
    contactId: string,
    options?: RequestOptions,
  ): Promise<ClawdbotEngagementPromotion[]> {
    return this.http.get<ClawdbotEngagementPromotion[]>(
      `/engagement-promotions/by-contact/${contactId}`,
      undefined,
      options,
    )
  }

  async list(
    params?: { limit?: number; offset?: number },
    options?: RequestOptions,
  ): Promise<ClawdbotEngagementPromotion[]> {
    return this.http.get<ClawdbotEngagementPromotion[]>(
      `/engagement-promotions`,
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }

  async get(promotionId: string, options?: RequestOptions): Promise<ClawdbotEngagementPromotion | null> {
    return this.http.get<ClawdbotEngagementPromotion | null>(
      `/engagement-promotions/${promotionId}`,
      undefined,
      options,
    )
  }

  async remove(promotionId: string, options?: RequestOptions): Promise<void> {
    await this.http.delete<void>(`/engagement-promotions/${promotionId}`, options)
  }
}

export class DispatchLogResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List dispatch log entries with filters. Use `since` for cursor-based
   * polling — only entries dispatched strictly after the given timestamp
   * are returned.
   */
  async list(
    params: ListEngagementDispatchLogRequest = {},
    options?: RequestOptions,
  ): Promise<ClawdbotEngagementDispatchLog[]> {
    return this.http.get<ClawdbotEngagementDispatchLog[]>(
      `/engagement-dispatches`,
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }

  async get(
    logId: string,
    options?: RequestOptions,
  ): Promise<ClawdbotEngagementDispatchLog | null> {
    return this.http.get<ClawdbotEngagementDispatchLog | null>(
      `/engagement-dispatches/${logId}`,
      undefined,
      options,
    )
  }

  async stats(
    params?: { engagementRuleId?: string; messageTemplateId?: string; since?: string },
    options?: RequestOptions,
  ): Promise<EngagementDispatchStats> {
    return this.http.get<EngagementDispatchStats>(
      `/engagement-dispatches/stats/summary`,
      params as Record<string, string | number | boolean | undefined>,
      options,
    )
  }
}

export class EngagementSettingsResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get the project's engagement settings (auto-creates a default row
   * on first call so the response is never null).
   */
  async get(options?: RequestOptions): Promise<ClawdbotEngagementSettings> {
    return this.http.get<ClawdbotEngagementSettings>(`/engagement-settings`, undefined, options)
  }

  async update(
    body: UpdateEngagementSettingsRequest,
    options?: RequestOptions,
  ): Promise<ClawdbotEngagementSettings> {
    return this.http.patch<ClawdbotEngagementSettings>(`/engagement-settings`, body, options)
  }
}
