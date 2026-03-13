import type { BaseModel } from './common.js'

export enum DocumentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  ERROR = 'ERROR',
}

export enum SourceProvider {
  WEB_URL = 'web-url',
  NOTION = 'notion',
  GOOGLE_DOCS = 'google-docs',
  ONENOTE = 'onenote',
  GOOGLE_DRIVE = 'google-drive',
  ONEDRIVE = 'onedrive',
  S3 = 's3',
}

export enum SourceStatus {
  ACTIVE = 'ACTIVE',
  SYNCING = 'SYNCING',
  ERROR = 'ERROR',
  PAUSED = 'PAUSED',
}

export interface KnowledgeBase extends BaseModel {
  projectId: string
  name: string
  description: string | null
  embeddingProvider: string
  embeddingModel: string
  embeddingDimension: number
  chunkSize: number
  chunkOverlap: number
  documentCount: number
  chunkCount: number
}

export interface KnowledgeBaseDocument extends BaseModel {
  knowledgeBaseId: string
  projectId: string
  fileId: string
  fileName: string
  fileSize: number
  mimeType: string
  status: DocumentStatus
  chunkCount: number
  errorMessage: string | null
  sourceId: string | null
  sourceExternalId: string | null
}

export interface KnowledgeBaseChunk extends BaseModel {
  knowledgeBaseId: string
  documentId: string
  projectId: string
  content: string
  chunkIndex: number
  tokenCount: number | null
}

export interface KnowledgeBaseSource extends BaseModel {
  knowledgeBaseId: string
  projectId: string
  provider: SourceProvider
  connectionId: string | null
  config: unknown
  syncSchedule: string
  lastSyncedAt: string | null
  status: SourceStatus
  lastError: string | null
  externalIdMap: unknown
}

// Requests
export interface CreateKnowledgeBaseRequest {
  name: string
  description?: string
  embeddingProvider: string
  embeddingModel: string
  embeddingDimension: number
  chunkSize?: number
  chunkOverlap?: number
}

export interface UpdateKnowledgeBaseRequest {
  name?: string
  description?: string
}

export interface SearchKnowledgeBaseRequest {
  query: string
  knowledgeBaseIds: string[]
  topK?: number
  similarityThreshold?: number
}

export interface SearchResult {
  chunkId: string
  documentId: string
  documentName: string
  knowledgeBaseId: string
  knowledgeBaseName: string
  content: string
  similarity: number
  chunkIndex: number
}

export interface SearchKnowledgeBaseResponse {
  results: SearchResult[]
}

export interface CreateSourceRequest {
  provider: SourceProvider
  connectionId?: string
  config: unknown
  syncSchedule?: string
}

export interface UpdateSourceRequest {
  config?: unknown
  syncSchedule?: string
  status?: SourceStatus
}
