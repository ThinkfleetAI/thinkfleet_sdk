export interface SeekPage<T> {
  data: T[]
  next: string | null
  previous: string | null
}

export interface RequestOptions {
  projectId?: string
  timeout?: number
  signal?: AbortSignal
  /** If true, path is used as-is under /api/v1/ without /projects/:projectId/ prefix */
  rawPath?: boolean
}

export interface HttpClientOptions {
  apiKey: string
  projectId: string
  baseUrl: string
  maxRetries: number
  timeout: number
  fetchFn: typeof globalThis.fetch
}
