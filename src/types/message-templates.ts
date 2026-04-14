export type MessageTemplateChannel =
  | 'email'
  | 'sms'
  | 'push'
  | 'whatsapp'
  | 'webchat'
  | 'agent_prompt'
  | 'custom'

export interface MessageTemplateVariant {
  id: string
  name: string
  subject: string | null
  body: string
  weight: number
  label: string | null
}

export interface ClawdbotMessageTemplate {
  id: string
  created: string
  updated: string
  projectId: string
  name: string
  description: string | null
  channel: MessageTemplateChannel
  subject: string | null
  body: string
  placeholders: string[]
  sampleContext: unknown | null
  variants: MessageTemplateVariant[]
  createdById: string | null
}

export interface CreateMessageTemplateRequest {
  name: string
  description?: string
  channel: MessageTemplateChannel
  subject?: string
  body: string
  placeholders?: string[]
  sampleContext?: unknown
  variants?: MessageTemplateVariant[]
}

export type UpdateMessageTemplateRequest = Partial<CreateMessageTemplateRequest>

export type ChannelPolicyWarningSeverity = 'info' | 'warning' | 'error'

export interface ChannelPolicyWarning {
  severity: ChannelPolicyWarningSeverity
  code: string
  message: string
}

export interface ChannelPolicy {
  channel: MessageTemplateChannel
  maxChars: number | null
  hardMaxChars: number | null
  supportsHtml: boolean
  supportsSubject: boolean
  requiresSubject: boolean
  notes: string[]
}

/**
 * Tap-action attached to an RCS suggestion chip.
 */
export type RcsSuggestionAction =
  | { kind: 'reply'; postbackData: string }
  | { kind: 'open_url'; url: string }
  | { kind: 'dial'; phoneNumber: string }

export interface RcsSuggestion {
  /** Button label. RCS spec caps this at 25 chars. */
  text: string
  action: RcsSuggestionAction
}

export interface RcsCard {
  title: string
  description?: string
  mediaAssetId?: string
  suggestions?: RcsSuggestion[]
}

export interface RcsContent {
  layout: 'text' | 'card' | 'carousel'
  /** Required for 'card' (1 card) and 'carousel' (2–10 cards). */
  cards?: RcsCard[]
  /** Standalone suggestion chips for the 'text' layout. */
  suggestions?: RcsSuggestion[]
}

/**
 * Rendered RCS card — `mediaAssetId` has been resolved to a concrete URL.
 */
export interface RenderedRcsCard {
  title: string
  description?: string
  mediaUrl?: string
  suggestions?: RcsSuggestion[]
}

export interface RenderedRcsPayload {
  layout: 'text' | 'card' | 'carousel'
  cards?: RenderedRcsCard[]
  suggestions?: RcsSuggestion[]
}

/** Alias kept for naming parity with the shared schema. */
export type PolicyWarning = ChannelPolicyWarning

export interface RenderedMessageTemplate {
  subject: string | null
  body: string
  unresolvedPlaceholders: string[]
  policyWarnings: ChannelPolicyWarning[]
  selectedVariantId: string | null
  selectedVariantLabel: string | null
  /** Resolved media asset URLs for MMS/RCS/EMAIL attachments. */
  mediaUrls: string[]
  /** Resolved RCS payload (null when channel !== RCS or none set). */
  rcsPayload: RenderedRcsPayload | null
  /** Hard-blocking policy violations — delivery layer should refuse these. */
  blockingErrors: ChannelPolicyWarning[]
}

export interface RenderMessageTemplateRequest {
  /** Optional — omit for extras-only / broadcast renders. */
  contactId?: string
  extras?: Record<string, unknown>
}

export interface PreviewMessageTemplateRequest {
  sampleContext?: Record<string, unknown>
  variantId?: string
  seedContactId?: string
}
