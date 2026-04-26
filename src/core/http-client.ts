import {
  ThinkFleetError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  TimeoutError,
} from './errors.js'
import type { HttpClientOptions, RequestOptions } from './types.js'

export class HttpClient {
  private readonly options: HttpClientOptions

  constructor(options: HttpClientOptions) {
    this.options = options
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>, requestOptions?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, params, requestOptions)
    return this.request<T>(url, { method: 'GET' }, requestOptions)
  }

  /**
   * GET that returns the response body as a raw string instead of parsing
   * JSON. Used for endpoints that emit YAML, plain text, or another non-JSON
   * format.
   */
  async getText(path: string, params?: Record<string, string | number | boolean | undefined>, requestOptions?: RequestOptions): Promise<string> {
    const url = this.buildUrl(path, params, requestOptions)
    const timeout = requestOptions?.timeout ?? this.options.timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await this.options.fetchFn(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.options.apiKey}` },
        signal: requestOptions?.signal ?? controller.signal,
      })
      clearTimeout(timeoutId)
      const body = await response.text()
      if (!response.ok) {
        throw new ThinkFleetError(body || `HTTP ${response.status}`, response.status, 'REQUEST_FAILED')
      }
      return body
    }
    catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof ThinkFleetError) throw error
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(`Request timed out after ${timeout}ms`)
      }
      throw new ThinkFleetError(`Network error: ${(error as Error).message}`, 0, 'NETWORK_ERROR')
    }
  }

  async post<T>(path: string, body?: unknown, requestOptions?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, undefined, requestOptions)
    return this.request<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body != null ? JSON.stringify(body) : undefined,
    }, requestOptions)
  }

  async patch<T>(path: string, body?: unknown, requestOptions?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, undefined, requestOptions)
    return this.request<T>(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: body != null ? JSON.stringify(body) : undefined,
    }, requestOptions)
  }

  async delete<T>(path: string, requestOptions?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, undefined, requestOptions)
    return this.request<T>(url, { method: 'DELETE' }, requestOptions)
  }

  async postFormData<T>(path: string, formData: FormData, requestOptions?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, undefined, requestOptions)
    return this.request<T>(url, {
      method: 'POST',
      body: formData,
    }, requestOptions)
  }

  /**
   * Auto-paginating list helper. Fetches all pages of a SeekPage response.
   *
   * @example
   * ```ts
   * const allFlows = await http.listAll<Flow>('/flows')
   * ```
   */
  async listAll<T>(path: string, params?: Record<string, string | number | boolean | undefined>, requestOptions?: RequestOptions): Promise<T[]> {
    const all: T[] = []
    let cursor: string | null = null
    const limit = 100

    do {
      const queryParams: Record<string, string | number | boolean | undefined> = { ...params, limit, ...(cursor ? { cursor } : {}) }
      const page: { data: T[]; next: string | null } = await this.get(path, queryParams, requestOptions)
      if (page.data) {
        all.push(...page.data)
      }
      cursor = page.next
    } while (cursor)

    return all
  }

  /**
   * POST that returns a Server-Sent Events stream.
   * Yields parsed SSE events as they arrive.
   *
   * @example
   * ```ts
   * for await (const event of http.postStream('/chatbots/123/agent-chat', { message: 'hello' })) {
   *   console.log(event)
   * }
   * ```
   */
  async *postStream(path: string, body?: unknown, requestOptions?: RequestOptions): AsyncGenerator<{ event?: string; data: string }> {
    const url = this.buildUrl(path, undefined, requestOptions)
    const timeout = requestOptions?.timeout ?? 120000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      let init: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.apiKey}`,
          'Accept': 'text/event-stream',
        },
        body: body != null ? JSON.stringify(body) : undefined,
        signal: requestOptions?.signal ?? controller.signal,
      }

      if (this.options.requestInterceptors) {
        for (const interceptor of this.options.requestInterceptors) {
          init = await interceptor(url, init)
        }
      }

      const response = await this.options.fetchFn(url, init)
      clearTimeout(timeoutId)

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new ThinkFleetError(text || `HTTP ${response.status}`, response.status, 'STREAM_ERROR')
      }

      if (!response.body) {
        throw new ThinkFleetError('No response body for stream', 0, 'STREAM_ERROR')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        let currentEvent: string | undefined
        let currentData = ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim()
          }
          else if (line.startsWith('data:')) {
            currentData = line.slice(5).trim()
            if (currentData === '[DONE]') return
            yield { event: currentEvent, data: currentData }
            currentEvent = undefined
            currentData = ''
          }
          else if (line === '') {
            if (currentData) {
              yield { event: currentEvent, data: currentData }
              currentEvent = undefined
              currentData = ''
            }
          }
        }
      }
    }
    catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof ThinkFleetError) throw error
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(`Stream timed out after ${timeout}ms`)
      }
      throw new ThinkFleetError(`Stream error: ${(error as Error).message}`, 0, 'STREAM_ERROR')
    }
  }

  /** POST that returns raw binary data (ArrayBuffer) instead of JSON */
  async postRaw(path: string, body?: unknown, requestOptions?: RequestOptions): Promise<ArrayBuffer> {
    const url = this.buildUrl(path, undefined, requestOptions)
    const timeout = requestOptions?.timeout ?? this.options.timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await this.options.fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.options.apiKey}`,
        },
        body: body != null ? JSON.stringify(body) : undefined,
        signal: requestOptions?.signal ?? controller.signal,
      })
      clearTimeout(timeoutId)
      if (!response.ok) {
        const errorBody = await response.text().catch(() => '')
        throw new ThinkFleetError(errorBody || `HTTP ${response.status}`, response.status, 'REQUEST_FAILED')
      }
      return await response.arrayBuffer()
    }
    catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof ThinkFleetError) throw error
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new TimeoutError(`Request timed out after ${timeout}ms`)
      }
      throw new ThinkFleetError(`Network error: ${(error as Error).message}`, 0, 'NETWORK_ERROR')
    }
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>, requestOptions?: RequestOptions): string {
    const base = requestOptions?.rawPath
      ? `${this.options.baseUrl}/api/v1${path}`
      : `${this.options.baseUrl}/api/v1/projects/${requestOptions?.projectId ?? this.options.projectId}${path}`

    const mergedParams = { ...params }
    if (requestOptions?.rawPath && requestOptions?.injectProjectId) {
      mergedParams.projectId = requestOptions?.projectId ?? this.options.projectId
    }

    if (Object.keys(mergedParams).length === 0) return base

    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(mergedParams)) {
      if (value !== undefined) {
        searchParams.set(key, String(value))
      }
    }
    const qs = searchParams.toString()
    return qs ? `${base}?${qs}` : base
  }

  private async request<T>(url: string, init: RequestInit, requestOptions?: RequestOptions): Promise<T> {
    const timeout = requestOptions?.timeout ?? this.options.timeout
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 10000)
        const jitter = delay * (0.5 + Math.random() * 0.5)
        await new Promise(resolve => setTimeout(resolve, jitter))
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        let finalInit: RequestInit = {
          ...init,
          headers: {
            ...init.headers as Record<string, string>,
            'Authorization': `Bearer ${this.options.apiKey}`,
          },
          signal: requestOptions?.signal ?? controller.signal,
        }

        // Run request interceptors
        if (this.options.requestInterceptors) {
          for (const interceptor of this.options.requestInterceptors) {
            finalInit = await interceptor(url, finalInit)
          }
        }

        let response = await this.options.fetchFn(url, finalInit)

        clearTimeout(timeoutId)

        // Run response interceptors
        if (this.options.responseInterceptors) {
          for (const interceptor of this.options.responseInterceptors) {
            response = await interceptor(response, url)
          }
        }

        if (response.ok) {
          if (response.status === 204) {
            return undefined as T
          }
          return await response.json() as T
        }

        const errorBody = await response.text().catch(() => '')
        let errorMessage = `HTTP ${response.status}`
        let errorCode = 'UNKNOWN'
        let errorParams: Record<string, unknown> | undefined

        try {
          const parsed = JSON.parse(errorBody)
          errorMessage = parsed.message ?? parsed.error ?? errorMessage
          errorCode = parsed.code ?? errorCode
          errorParams = parsed.params
        } catch {
          if (errorBody) errorMessage = errorBody
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : null
          lastError = new RateLimitError(errorMessage, retryAfterMs)
          if (attempt < this.options.maxRetries) continue
          throw lastError
        }

        if (response.status >= 500) {
          lastError = new ServerError(errorMessage, response.status)
          if (attempt < this.options.maxRetries) continue
          throw lastError
        }

        // Non-retryable errors
        switch (response.status) {
          case 401:
            throw new AuthenticationError(errorMessage)
          case 403:
            throw new AuthorizationError(errorMessage)
          case 404:
            throw new NotFoundError(errorMessage)
          case 400:
          case 422:
            throw new ValidationError(errorMessage, errorParams)
          default:
            throw new ThinkFleetError(errorMessage, response.status, errorCode, errorParams)
        }
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof ThinkFleetError) {
          throw error
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new TimeoutError(`Request timed out after ${timeout}ms`)
        }

        lastError = error instanceof Error ? error : new Error(String(error))
        if (attempt < this.options.maxRetries) continue
        throw new ThinkFleetError(
          `Network error: ${lastError.message}`,
          0,
          'NETWORK_ERROR',
        )
      }
    }

    throw lastError ?? new ThinkFleetError('Request failed', 0, 'UNKNOWN')
  }
}
