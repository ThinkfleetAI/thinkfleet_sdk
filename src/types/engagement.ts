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

// ─── Engagement rules ─────────────────────────────────────────────

export type EngagementTriggerConfig =
  | { type: 'schedule'; cronExpression: string; timezone?: string }
  /** Fires when a contact event of this type is logged (e.g. `pattern_break` from Lattice). */
  | { type: 'event'; eventType: string }
  /** Fires for contacts with no `eventType` event in `absenceDays`, checked on `checkCronExpression`. */
  | { type: 'absence'; eventType: string; absenceDays: number; checkCronExpression: string; timezone?: string }

export type EngagementContactSegment = 'new' | 'loyal' | 'at-risk' | 'lapsed'

export interface EngagementContactFilter {
  tags?: string[]
  segments?: EngagementContactSegment[]
  minLifetimeValue?: number
  maxLifetimeValue?: number
  lastInteractionBeforeDays?: number
  eventConditions?: Array<Record<string, unknown>>
  eventAbsence?: Array<{ eventType: string; withinDays: number }>
}

export type EngagementActionType = 'generate_offer' | 'send_reminder' | 're_engage' | 'custom' | 'dispatch_flow_event'
export type EngagementChannel = 'sms' | 'email' | 'whatsapp' | 'webchat'

export interface EngagementActionConfig {
  actionType: EngagementActionType
  channel: EngagementChannel
  /** AI prompt for the message; rendered with the contact's profile and Lattice context. */
  promptTemplate: string
  messageTemplateId?: string
  webhookUrl?: string
  /** Flow that receives the event for `dispatch_flow_event` — send through any system. */
  linkedFlowId?: string
  webhookAuthToken?: string
  promoProviderFlowId?: string
  deliveryFlowId?: string
  vendorRegisterFlowId?: string
  promoProviderTimeoutMs?: number
  deliveryTimeoutMs?: number
  vendorRegisterTimeoutMs?: number
  failOpenOnPromoError?: boolean
  failOpenOnDeliveryError?: boolean
  failOpenOnVendorRegisterError?: boolean
}

export type EngagementTriggerMode = 'manual' | 'cron' | 'ai-heartbeat'

export interface EngagementRule {
  id: string
  created: string
  updated: string
  projectId: string
  chatbotId: string | null
  name: string
  description: string | null
  triggerConfig: EngagementTriggerConfig
  contactFilter: EngagementContactFilter
  actionConfig: EngagementActionConfig
  triggerMode: EngagementTriggerMode
  enabled: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  executionCount: number
  createdById: string | null
}

export interface CreateEngagementRuleRequest {
  /** Legacy: limit the rule to one agent's contacts. Rules belong to the project (and location). */
  chatbotId?: string
  name: string
  description?: string
  triggerConfig: EngagementTriggerConfig
  contactFilter: EngagementContactFilter
  actionConfig: EngagementActionConfig
  triggerMode?: EngagementTriggerMode
  enabled?: boolean
}

export type UpdateEngagementRuleRequest = Partial<Omit<CreateEngagementRuleRequest, 'chatbotId' | 'description'>> & {
  description?: string | null
}

export type EngagementExecutionStatus = 'running' | 'completed' | 'failed' | 'partial' | 'cancelled'

export interface EngagementExecution {
  id: string
  created: string
  updated: string
  engagementRuleId: string
  projectId: string
  status: EngagementExecutionStatus
  contactsTargeted: number
  contactsReached: number
  contactsConverted: number
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
  executionDetails: unknown | null
}

export type EngagementOutcome = 'sent' | 'delivered' | 'replied' | 'converted' | 'ignored' | 'failed'

/** Report what happened after a message went out, from whichever system saw it (POS, CRM, ESP). */
export interface RecordEngagementOutcomeRequest {
  executionId?: string
  contactId?: string
  outcome: EngagementOutcome
  metadata?: unknown
}
