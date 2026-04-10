// ─── Contacts (clawdbot_contact) ────────────────────────────────────

export type ContactSegment = 'new' | 'loyal' | 'at-risk' | 'lapsed'

export interface ClawdbotContact {
  id: string
  created: string
  updated: string
  chatbotId: string
  projectId: string
  name: string
  phone: string | null
  email: string | null
  relationship: string | null
  isEmergency: boolean
  priority: number
  notes: string | null
  metadata: unknown | null
  externalIds: Record<string, string> | null
  tags: string[]
  segment: string | null
  lifetimeValue: number | null
  lastInteractionAt: string | null
  chatIdentityId: string | null
}

export interface CreateContactRequest {
  name: string
  phone?: string
  email?: string
  relationship?: string
  isEmergency?: boolean
  priority?: number
  notes?: string
  metadata?: unknown
  externalIds?: Record<string, string>
  tags?: string[]
  segment?: ContactSegment
  lifetimeValue?: number
  chatIdentityId?: string
}

export type UpdateContactRequest = Partial<CreateContactRequest>

export interface LookupContactRequest {
  phone?: string
  email?: string
  externalId?: { systemKey: string; value: string }
  autoCreate?: boolean
  chatbotId?: string
  defaults?: {
    name?: string
    tags?: string[]
    segment?: ContactSegment
  }
}

export interface LookupContactResponse {
  contact: ClawdbotContact | null
  created: boolean
  error?: string
}

// ─── Contact Profile (canonical projection) ─────────────────────────

export interface ContactProfilePreference {
  value: string
  confidence: number
  importance: number
}

export interface ContactProfileFact {
  content: string
  importance: number
  confidence: number
  source: string | null
  category: string | null
}

export interface ContactProfilePatterns {
  totalOrders: number
  avgOrderValue: number | null
  lastOrderAt: string | null
  daysSinceLastOrder: number | null
  orderFrequencyLabel: string | null
  typicalDayOfWeek: string | null
  topItems: string[]
  lastPromotionRedeemed: string | null
}

export interface ContactProfileEventRef {
  id: string
  eventType: string
  title: string
  description: string | null
  occurredAt: string
  eventData: unknown | null
}

export interface ContactProfileRawMemory {
  id: string
  type: string
  content: string
  category: string | null
  importance: number
  confidence: number
  source: string | null
  scope: string
  status: string
  created: string
}

export interface ContactProfile {
  contact: ClawdbotContact
  chatIdentityId: string | null
  preferences: Record<string, ContactProfilePreference[]>
  facts: ContactProfileFact[]
  patterns: ContactProfilePatterns
  recentEvents: ContactProfileEventRef[]
  rawMemories: ContactProfileRawMemory[]
}

// ─── Contact Events ─────────────────────────────────────────────────

export type ContactEventType =
  | 'purchase'
  | 'campaign_sent'
  | 'campaign_redeemed'
  | 'campaign_ignored'
  | 'interaction'
  | 'feedback'
  | 'enrollment'
  | 'custom'

export interface ClawdbotContactEvent {
  id: string
  created: string
  updated: string
  contactId: string
  projectId: string
  chatbotId: string | null
  eventType: ContactEventType
  title: string
  description: string | null
  eventData: unknown | null
  occurredAt: string
  source: string | null
  engagementRuleId: string | null
  engagementExecutionId: string | null
}

export interface CreateContactEventRequest {
  contactId: string
  eventType: ContactEventType
  title: string
  description?: string
  eventData?: unknown
  occurredAt?: string
  source?: string
}
