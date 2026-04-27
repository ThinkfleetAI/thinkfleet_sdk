import type { BaseModel } from './common.js'

export enum MemoryItemType {
  FACT = 'fact',
  PREFERENCE = 'preference',
  EVENT = 'event',
  INSIGHT = 'insight',
  OBSERVATION = 'observation',
  RULE = 'rule',
  CORRECTION = 'correction',
  SUMMARY = 'summary',
}

export enum MemoryScope {
  PLATFORM = 'platform',
  PROJECT = 'project',
  LOCATION = 'location',
  AGENT = 'agent',
  USER = 'user',
  SESSION = 'session',
}

export enum MemoryStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SUPERSEDED = 'superseded',
  REJECTED = 'rejected',
}

export enum MemoryImpact {
  HIGH = 'HIGH',
  LOW = 'LOW',
}

export enum MemoryFeedbackRating {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
}

export interface MemoryItem extends BaseModel {
  platformId: string
  projectId: string | null
  locationId: string | null
  chatbotId: string | null
  chatIdentityId: string | null
  type: MemoryItemType
  content: string
  category: string | null
  importance: number
  source: string | null
  sessionKey: string | null
  metadata: Record<string, unknown> | null
  scope: MemoryScope
  status: MemoryStatus
  confidence: number
  impact: MemoryImpact | null
  supersededById: string | null
  confirmedByUserId: string | null
  confirmedAt: string | null
  negativeRatingCount: number
  // Bi-temporal: validFrom/validTo describe when the fact was true in
  // the world; learnedAt is when the agent recorded it; lastAccessedAt
  // is bumped on every retrieval (powers the recency scorer + decay).
  validFrom: string
  validTo: string | null
  learnedAt: string
  lastAccessedAt: string
}

export interface CreateMemoryRequest {
  content: string
  type?: MemoryItemType
  category?: string
  importance?: number
  source?: string
  scope?: MemoryScope
  chatbotId?: string
  locationId?: string
  chatIdentityId?: string
  sessionKey?: string
  metadata?: Record<string, unknown>
  impact?: MemoryImpact
  /** When the fact became true in the world (ISO-8601). Defaults to now. */
  validFrom?: string
}

export interface UpdateMemoryRequest {
  content?: string
  type?: MemoryItemType
  category?: string
  importance?: number
  scope?: MemoryScope
  status?: MemoryStatus
}

export interface ConfirmMemoryRequest {
  status: 'confirmed' | 'rejected'
  comment?: string
}

export interface PromoteMemoryRequest {
  targetScope: MemoryScope
}

export interface MemorySearchRequest {
  query: string
  chatbotId?: string
  locationId?: string
  chatIdentityId?: string
  scope?: MemoryScope
  status?: MemoryStatus
  limit?: number
  /** Time-travel: ISO-8601 timestamp. Returns memories the agent
   *  knew AND that were valid at this point in time. */
  asOf?: string
}

export interface MemorySearchResult {
  id: string
  chatbotId?: string | null
  locationId?: string | null
  chatIdentityId?: string | null
  type: string
  content: string
  category: string | null
  similarity: number
  /** Unified retrieval score: weighted recency × importance × similarity,
   *  weights vary by scope. Results are ordered by score, not similarity. */
  score?: number
  metadata?: Record<string, unknown> | null
  scope: MemoryScope
  status: MemoryStatus
  importance: number
  confidence?: number
  source?: string | null
}

export interface MemoryFeedback {
  id: string
  memoryId: string
  responseId: string | null
  rating: MemoryFeedbackRating
  comment: string | null
  createdByUserId: string | null
  created: string
}

export interface SubmitFeedbackRequest {
  responseId?: string
  rating: MemoryFeedbackRating
  comment?: string
}

export interface ListMemoryParams {
  type?: MemoryItemType
  scope?: MemoryScope
  status?: MemoryStatus
  source?: string
  chatbotId?: string
  locationId?: string
  chatIdentityId?: string
  limit?: number
  offset?: number
  /** Time-travel filter — see MemorySearchRequest.asOf. */
  asOf?: string
}

export interface MemoryStats {
  total: number
  pendingReview: number
  flagged: number
  byScope: Record<string, number>
  byStatus: Record<string, number>
}

// ─── Memory Blocks ───────────────────────────────────────────────────
//
// Distinct from MemoryItem (extracted facts). Blocks are labeled, sized,
// in-context scratchpads the agent reads from its system prompt and
// writes via tools. Common labels: persona, current_task, user_facts,
// location_facts, recent_decisions.

export interface AgentMemoryBlock extends BaseModel {
  platformId: string
  projectId: string | null
  locationId: string | null
  chatbotId: string | null
  chatIdentityId: string | null
  sessionKey: string | null
  scope: MemoryScope
  label: string
  value: string
  sizeLimitTokens: number
  importance: number
  lastEditedBy: string | null
  lastEditedAt: string | null
  version: number
}

interface BlockScopeCoords {
  scope?: MemoryScope
  locationId?: string
  chatbotId?: string
  chatIdentityId?: string
  sessionKey?: string
}

export interface SetMemoryBlockRequest extends BlockScopeCoords {
  label: string
  value: string
  sizeLimitTokens?: number
  importance?: number
}

export interface AppendMemoryBlockRequest extends BlockScopeCoords {
  label: string
  content: string
  separator?: string
}

export interface GetMemoryBlockRequest extends BlockScopeCoords {
  label: string
}

export interface ListMemoryBlocksRequest extends BlockScopeCoords {
  limit?: number
}
