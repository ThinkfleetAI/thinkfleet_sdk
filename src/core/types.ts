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
  /** If true and rawPath is true, automatically adds projectId as a query parameter */
  injectProjectId?: boolean
}

/** Middleware function that can inspect/modify requests before they are sent. */
export type RequestInterceptor = (url: string, init: RequestInit) => RequestInit | Promise<RequestInit>

/** Middleware function that can inspect/modify responses before they are returned. */
export type ResponseInterceptor = (response: Response, url: string) => Response | Promise<Response>

export interface HttpClientOptions {
  apiKey: string
  projectId: string
  baseUrl: string
  maxRetries: number
  timeout: number
  fetchFn: typeof globalThis.fetch
  /** Middleware hooks called before each request. */
  requestInterceptors?: RequestInterceptor[]
  /** Middleware hooks called after each response (before JSON parsing). */
  responseInterceptors?: ResponseInterceptor[]
}
