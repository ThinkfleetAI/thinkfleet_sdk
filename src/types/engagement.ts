// ─── Engagement Promotions ──────────────────────────────────────────

export type PromotionDiscountType =
  | 'percentage'
  | 'fixed_amount'
  | 'bogo'
  | 'free_item'
  | 'other'

export interface ClawdbotEngagementPromotion {
  id: string
  created: string
  updated: string
  projectId: string
  contactId: string
  engagementExecutionId: string | null
  promoCode: string
  source: string | null
  discountType: PromotionDiscountType | null
  discountValue: number | null
  expiresAt: string | null
  sentAt: string
  redeemedAt: string | null
  metadata: unknown | null
}

export interface CreateEngagementPromotionRequest {
  contactId: string
  engagementExecutionId?: string
  promoCode: string
  source?: string
  discountType?: PromotionDiscountType
  discountValue?: number
  expiresAt?: string
  metadata?: unknown
}

export interface MarkPromotionRedeemedRequest {
  redeemedAt?: string
}

// ─── Engagement Dispatch Log ────────────────────────────────────────

export type EngagementDispatchPath = 'internal_agent' | 'webhook' | 'linked_flow'
export type EngagementDispatchStatus = 'success' | 'failed' | 'skipped'

export interface ClawdbotEngagementDispatchLog {
  id: string
  created: string
  updated: string
  projectId: string
  engagementRuleId: string
  engagementExecutionId: string | null
  contactId: string
  chatIdentityId: string | null
  path: EngagementDispatchPath
  status: EngagementDispatchStatus
  messageTemplateId: string | null
  variantId: string | null
  variantLabel: string | null
  renderedSnippet: string | null
  errorMessage: string | null
  dispatchedAt: string
}

export interface ListEngagementDispatchLogRequest {
  engagementRuleId?: string
  contactId?: string
  path?: EngagementDispatchPath
  status?: EngagementDispatchStatus
  since?: string
  limit?: number
  offset?: number
}

export interface EngagementDispatchStats {
  totalSuccess: number
  totalFailed: number
  totalSkipped: number
  byVariant: Array<{
    variantId: string | null
    variantLabel: string | null
    count: number
  }>
}

// ─── Engagement Settings ────────────────────────────────────────────

export interface ClawdbotEngagementSettings {
  id: string
  created: string
  updated: string
  projectId: string
  defaultPromoProviderFlowId: string | null
  defaultPromoProviderFlowVersionId: string | null
  promoProviderTimeoutMs: number
  defaultDeliveryFlowId: string | null
  defaultDeliveryFlowVersionId: string | null
  deliveryTimeoutMs: number
  defaultVendorRegisterFlowId: string | null
  defaultVendorRegisterFlowVersionId: string | null
  failOpenOnPromoError: boolean
  failOpenOnDeliveryError: boolean
}

export interface UpdateEngagementSettingsRequest {
  defaultPromoProviderFlowId?: string | null
  defaultPromoProviderFlowVersionId?: string | null
  promoProviderTimeoutMs?: number
  defaultDeliveryFlowId?: string | null
  defaultDeliveryFlowVersionId?: string | null
  deliveryTimeoutMs?: number
  defaultVendorRegisterFlowId?: string | null
  defaultVendorRegisterFlowVersionId?: string | null
  failOpenOnPromoError?: boolean
  failOpenOnDeliveryError?: boolean
}
