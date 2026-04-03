import type { BaseModel } from './common.js'

export enum GuardrailAction {
  BLOCK = 'BLOCK',
  REDACT = 'REDACT',
  FLAG = 'FLAG',
}

export enum GuardrailSensitivity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum GuardrailViolationType {
  CONTENT_MODERATION = 'CONTENT_MODERATION',
  PROMPT_INJECTION = 'PROMPT_INJECTION',
  PII_DETECTED = 'PII_DETECTED',
  TOKEN_BUDGET_EXCEEDED = 'TOKEN_BUDGET_EXCEEDED',
  EXECUTION_TIMEOUT = 'EXECUTION_TIMEOUT',
  TOOL_RESTRICTED = 'TOOL_RESTRICTED',
  MODEL_ACCESS_DENIED = 'MODEL_ACCESS_DENIED',
}

export enum ModelAccessMode {
  ALLOWLIST = 'ALLOWLIST',
  DENYLIST = 'DENYLIST',
}

export interface ModerationConfig {
  enabled: boolean
  sensitivity: GuardrailSensitivity
  action: GuardrailAction
}

export interface PromptInjectionConfig {
  enabled: boolean
  action: GuardrailAction
}

export interface PiiDetectionConfig {
  enabled: boolean
  action: GuardrailAction
  patterns?: string[]
}

export interface TokenBudget {
  perMessage?: number
  perSession?: number
  perDay?: number
}

export interface ModelAccessPolicy {
  mode: ModelAccessMode
  modelIds: string[]
}

export interface DataProtectionConfig {
  enabled: boolean
  scanInput: boolean
  scanOutput: boolean
  enabledPatterns: string[]
  actionOverrides?: Record<string, GuardrailAction>
  customPatterns?: CustomPattern[]
}

export interface CustomPattern {
  id: string
  name: string
  pattern: string
  action: GuardrailAction
  redactionLabel?: string
}

export interface GuardrailPolicy extends BaseModel {
  projectId: string
  platformId: string
  inputModeration?: ModerationConfig
  outputModeration?: ModerationConfig
  promptInjectionDefense?: PromptInjectionConfig
  piiDetection?: PiiDetectionConfig
  tokenBudget?: TokenBudget
  executionTimeoutSeconds?: number
  toolRestrictions?: string[]
  modelAccessPolicy?: ModelAccessPolicy
  dataProtection?: DataProtectionConfig
}

export interface UpdateGuardrailPolicyRequest {
  inputModeration?: ModerationConfig
  outputModeration?: ModerationConfig
  promptInjectionDefense?: PromptInjectionConfig
  piiDetection?: PiiDetectionConfig
  tokenBudget?: TokenBudget
  executionTimeoutSeconds?: number
  toolRestrictions?: string[]
  modelAccessPolicy?: ModelAccessPolicy
  dataProtection?: DataProtectionConfig
}

export interface GuardrailCheckResult {
  allowed: boolean
  violationType?: GuardrailViolationType
  message?: string
  redactedContent?: string
}

export interface ScanTextRequest {
  text: string
}

export interface ScanTextResult {
  detections: Array<{
    patternId: string
    patternName: string
    action: string
    count: number
  }>
  redactedText: string
  hasBlockableDetection: boolean
}

export interface PatternCatalogEntry {
  id: string
  name: string
  description: string
  compliance: string[]
  defaultAction: string
}

export type PatternCatalog = Record<string, PatternCatalogEntry[]>

export interface TokenUsageDaily extends BaseModel {
  projectId: string
  chatIdentityId?: string
  date: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
}
