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

export interface RenderedMessageTemplate {
  subject: string | null
  body: string
  unresolvedPlaceholders: string[]
  policyWarnings: ChannelPolicyWarning[]
  selectedVariantId: string | null
  selectedVariantLabel: string | null
}

export interface RenderMessageTemplateRequest {
  contactId: string
  extras?: Record<string, unknown>
}

export interface PreviewMessageTemplateRequest {
  sampleContext?: Record<string, unknown>
  variantId?: string
  seedContactId?: string
}
