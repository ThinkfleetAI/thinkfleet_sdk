import type { HttpClient } from '../core/http-client.js'
import type { RequestOptions } from '../core/types.js'
import type {
  KnowledgeBase,
  KnowledgeBaseDocument,
  KnowledgeBaseChunk,
  KnowledgeBaseSource,
  CreateKnowledgeBaseRequest,
  UpdateKnowledgeBaseRequest,
  SearchKnowledgeBaseRequest,
  SearchKnowledgeBaseResponse,
  CreateSourceRequest,
  UpdateSourceRequest,
} from '../types/knowledge-bases.js'

export class KnowledgeBaseDocumentsResource {
  constructor(private readonly http: HttpClient) {}

  async list(kbId: string, options?: RequestOptions): Promise<KnowledgeBaseDocument[]> {
    return this.http.get<KnowledgeBaseDocument[]>(`/knowledge-bases/${kbId}/documents`, undefined, options)
  }

  async get(kbId: string, docId: string, options?: RequestOptions): Promise<KnowledgeBaseDocument> {
    return this.http.get<KnowledgeBaseDocument>(`/knowledge-bases/${kbId}/documents/${docId}`, undefined, options)
  }

  async upload(kbId: string, file: File | Blob, fileName?: string, options?: RequestOptions): Promise<KnowledgeBaseDocument> {
    const formData = new FormData()
    formData.append('file', file, fileName)
    return this.http.postFormData<KnowledgeBaseDocument>(`/knowledge-bases/${kbId}/documents`, formData, options)
  }

  async delete(kbId: string, docId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/knowledge-bases/${kbId}/documents/${docId}`, options)
  }

  async chunks(kbId: string, docId: string, options?: RequestOptions): Promise<KnowledgeBaseChunk[]> {
    return this.http.get<KnowledgeBaseChunk[]>(`/knowledge-bases/${kbId}/documents/${docId}/chunks`, undefined, options)
  }
}

export class KnowledgeBaseSourcesResource {
  constructor(private readonly http: HttpClient) {}

  async list(kbId: string, options?: RequestOptions): Promise<KnowledgeBaseSource[]> {
    return this.http.get<KnowledgeBaseSource[]>(`/knowledge-bases/${kbId}/sources`, undefined, options)
  }

  async create(kbId: string, body: CreateSourceRequest, options?: RequestOptions): Promise<KnowledgeBaseSource> {
    return this.http.post<KnowledgeBaseSource>(`/knowledge-bases/${kbId}/sources`, body, options)
  }

  async update(kbId: string, sourceId: string, body: UpdateSourceRequest, options?: RequestOptions): Promise<KnowledgeBaseSource> {
    return this.http.patch<KnowledgeBaseSource>(`/knowledge-bases/${kbId}/sources/${sourceId}`, body, options)
  }

  async delete(kbId: string, sourceId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/knowledge-bases/${kbId}/sources/${sourceId}`, options)
  }
}

export class KnowledgeBasesResource {
  readonly documents: KnowledgeBaseDocumentsResource
  readonly sources: KnowledgeBaseSourcesResource

  constructor(private readonly http: HttpClient) {
    this.documents = new KnowledgeBaseDocumentsResource(http)
    this.sources = new KnowledgeBaseSourcesResource(http)
  }

  async list(options?: RequestOptions): Promise<KnowledgeBase[]> {
    return this.http.get<KnowledgeBase[]>('/knowledge-bases', undefined, options)
  }

  async create(body: CreateKnowledgeBaseRequest, options?: RequestOptions): Promise<KnowledgeBase> {
    return this.http.post<KnowledgeBase>('/knowledge-bases', body, options)
  }

  async get(kbId: string, options?: RequestOptions): Promise<KnowledgeBase> {
    return this.http.get<KnowledgeBase>(`/knowledge-bases/${kbId}`, undefined, options)
  }

  async update(kbId: string, body: UpdateKnowledgeBaseRequest, options?: RequestOptions): Promise<KnowledgeBase> {
    return this.http.patch<KnowledgeBase>(`/knowledge-bases/${kbId}`, body, options)
  }

  async delete(kbId: string, options?: RequestOptions): Promise<void> {
    return this.http.delete(`/knowledge-bases/${kbId}`, options)
  }

  async search(body: SearchKnowledgeBaseRequest, options?: RequestOptions): Promise<SearchKnowledgeBaseResponse> {
    return this.http.post<SearchKnowledgeBaseResponse>('/knowledge-bases/search', body, options)
  }
}
