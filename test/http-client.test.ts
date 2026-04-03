import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpClient } from '../src/core/http-client'
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  TimeoutError,
} from '../src/core/errors'

function createMockFetch(response: Partial<Response> & { json?: () => Promise<unknown>; text?: () => Promise<string>; ok?: boolean; status?: number }) {
  const headers = new Map<string, string>()
  return vi.fn().mockResolvedValue({
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: response.json ?? (() => Promise.resolve({})),
    text: response.text ?? (() => Promise.resolve('')),
    headers: { get: (name: string) => headers.get(name) ?? null },
    body: null,
  })
}

function createClient(fetchFn: any, overrides?: Record<string, unknown>) {
  return new HttpClient({
    apiKey: 'test-key',
    projectId: 'proj-123',
    baseUrl: 'https://api.test.com',
    maxRetries: 2,
    timeout: 5000,
    fetchFn,
    ...overrides,
  })
}

describe('HttpClient', () => {

  describe('URL building', () => {
    it('builds project-scoped URL', async () => {
      const mockFetch = createMockFetch({ json: () => Promise.resolve({ data: 'ok' }) })
      const client = createClient(mockFetch)
      await client.get('/agents')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/projects/proj-123/agents',
        expect.any(Object),
      )
    })

    it('builds raw path URL when rawPath: true', async () => {
      const mockFetch = createMockFetch({ json: () => Promise.resolve({ data: 'ok' }) })
      const client = createClient(mockFetch)
      await client.get('/providers', undefined, { rawPath: true })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.test.com/api/v1/providers',
        expect.any(Object),
      )
    })

    it('appends query params', async () => {
      const mockFetch = createMockFetch({ json: () => Promise.resolve({ data: 'ok' }) })
      const client = createClient(mockFetch)
      await client.get('/agents', { type: 'AGENT', limit: 10 })
      const calledUrl = mockFetch.mock.calls[0][0]
      expect(calledUrl).toContain('type=AGENT')
      expect(calledUrl).toContain('limit=10')
    })

    it('skips undefined query params', async () => {
      const mockFetch = createMockFetch({ json: () => Promise.resolve({ data: 'ok' }) })
      const client = createClient(mockFetch)
      await client.get('/agents', { type: 'AGENT', search: undefined })
      const calledUrl = mockFetch.mock.calls[0][0]
      expect(calledUrl).toContain('type=AGENT')
      expect(calledUrl).not.toContain('search')
    })
  })

  describe('Authorization header', () => {
    it('sends Bearer token', async () => {
      const mockFetch = createMockFetch({ json: () => Promise.resolve({}) })
      const client = createClient(mockFetch)
      await client.get('/test')
      const init = mockFetch.mock.calls[0][1]
      expect(init.headers.Authorization).toBe('Bearer test-key')
    })
  })

  describe('HTTP methods', () => {
    it('GET sends no body', async () => {
      const mockFetch = createMockFetch({ json: () => Promise.resolve({}) })
      const client = createClient(mockFetch)
      await client.get('/test')
      const init = mockFetch.mock.calls[0][1]
      expect(init.method).toBe('GET')
      expect(init.body).toBeUndefined()
    })

    it('POST sends JSON body', async () => {
      const mockFetch = createMockFetch({ json: () => Promise.resolve({}) })
      const client = createClient(mockFetch)
      await client.post('/test', { name: 'hello' })
      const init = mockFetch.mock.calls[0][1]
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body)).toEqual({ name: 'hello' })
      expect(init.headers['Content-Type']).toBe('application/json')
    })

    it('PATCH sends JSON body', async () => {
      const mockFetch = createMockFetch({ json: () => Promise.resolve({}) })
      const client = createClient(mockFetch)
      await client.patch('/test', { name: 'updated' })
      const init = mockFetch.mock.calls[0][1]
      expect(init.method).toBe('PATCH')
    })

    it('DELETE sends no body', async () => {
      const mockFetch = createMockFetch({ json: () => Promise.resolve({}) })
      const client = createClient(mockFetch)
      await client.delete('/test')
      const init = mockFetch.mock.calls[0][1]
      expect(init.method).toBe('DELETE')
    })

    it('returns undefined for 204 No Content', async () => {
      const mockFetch = createMockFetch({ ok: true, status: 204 })
      const client = createClient(mockFetch)
      const result = await client.delete('/test')
      expect(result).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('throws AuthenticationError on 401', async () => {
      const mockFetch = createMockFetch({ ok: false, status: 401, text: () => Promise.resolve('Unauthorized') })
      const client = createClient(mockFetch)
      await expect(client.get('/test')).rejects.toThrow(AuthenticationError)
    })

    it('throws AuthorizationError on 403', async () => {
      const mockFetch = createMockFetch({ ok: false, status: 403, text: () => Promise.resolve('Forbidden') })
      const client = createClient(mockFetch)
      await expect(client.get('/test')).rejects.toThrow(AuthorizationError)
    })

    it('throws NotFoundError on 404', async () => {
      const mockFetch = createMockFetch({ ok: false, status: 404, text: () => Promise.resolve('Not found') })
      const client = createClient(mockFetch)
      await expect(client.get('/test')).rejects.toThrow(NotFoundError)
    })

    it('throws ValidationError on 400', async () => {
      const mockFetch = createMockFetch({
        ok: false, status: 400,
        text: () => Promise.resolve(JSON.stringify({ message: 'Bad request', params: { field: 'name' } })),
      })
      const client = createClient(mockFetch)
      await expect(client.get('/test')).rejects.toThrow(ValidationError)
    })

    it('throws ValidationError on 422', async () => {
      const mockFetch = createMockFetch({ ok: false, status: 422, text: () => Promise.resolve('{}') })
      const client = createClient(mockFetch)
      await expect(client.get('/test')).rejects.toThrow(ValidationError)
    })

    it('throws RateLimitError on 429', async () => {
      const mockFetch = createMockFetch({ ok: false, status: 429, text: () => Promise.resolve('Rate limited') })
      const client = createClient(mockFetch, { maxRetries: 0 })
      await expect(client.get('/test')).rejects.toThrow(RateLimitError)
    })

    it('throws ServerError on 500', async () => {
      const mockFetch = createMockFetch({ ok: false, status: 500, text: () => Promise.resolve('Internal error') })
      const client = createClient(mockFetch, { maxRetries: 0 })
      await expect(client.get('/test')).rejects.toThrow(ServerError)
    })
  })

  describe('Retry logic', () => {
    it('retries on 500 up to maxRetries', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('fail'), headers: { get: () => null } })
        .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('fail'), headers: { get: () => null } })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ success: true }), headers: { get: () => null } })
      const client = createClient(mockFetch)
      const result = await client.get('/test')
      expect(result).toEqual({ success: true })
      expect(mockFetch).toHaveBeenCalledTimes(3)
    })

    it('retries on 429', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({ ok: false, status: 429, text: () => Promise.resolve(''), headers: { get: () => null } })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }), headers: { get: () => null } })
      const client = createClient(mockFetch)
      const result = await client.get('/test')
      expect(result).toEqual({ ok: true })
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('does NOT retry on 401', async () => {
      const mockFetch = createMockFetch({ ok: false, status: 401, text: () => Promise.resolve('') })
      const client = createClient(mockFetch)
      await expect(client.get('/test')).rejects.toThrow(AuthenticationError)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('does NOT retry on 400', async () => {
      const mockFetch = createMockFetch({ ok: false, status: 400, text: () => Promise.resolve('{}') })
      const client = createClient(mockFetch)
      await expect(client.get('/test')).rejects.toThrow(ValidationError)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Interceptors', () => {
    it('runs request interceptors before fetch', async () => {
      const mockFetch = createMockFetch({ json: () => Promise.resolve({}) })
      const interceptor = vi.fn((url: string, init: RequestInit) => {
        return { ...init, headers: { ...(init.headers as any), 'X-Custom': 'test' } }
      })
      const client = createClient(mockFetch, { requestInterceptors: [interceptor] })
      await client.get('/test')
      expect(interceptor).toHaveBeenCalledTimes(1)
      const fetchInit = mockFetch.mock.calls[0][1]
      expect(fetchInit.headers['X-Custom']).toBe('test')
    })

    it('runs response interceptors after fetch', async () => {
      const mockResponse = {
        ok: true, status: 200,
        json: () => Promise.resolve({ modified: true }),
        headers: { get: () => null },
        body: null,
      }
      const mockFetch = vi.fn().mockResolvedValue(mockResponse)
      const interceptor = vi.fn((response: any) => response)
      const client = createClient(mockFetch, { responseInterceptors: [interceptor] })
      await client.get('/test')
      expect(interceptor).toHaveBeenCalledTimes(1)
    })
  })

  describe('listAll pagination', () => {
    it('fetches all pages', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve({ data: [{ id: '1' }, { id: '2' }], next: 'cursor-2' }),
          headers: { get: () => null },
        })
        .mockResolvedValueOnce({
          ok: true, status: 200,
          json: () => Promise.resolve({ data: [{ id: '3' }], next: null }),
          headers: { get: () => null },
        })
      const client = createClient(mockFetch)
      const results = await client.listAll('/items')
      expect(results).toHaveLength(3)
      expect(results.map((r: any) => r.id)).toEqual(['1', '2', '3'])
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('handles empty first page', async () => {
      const mockFetch = createMockFetch({
        json: () => Promise.resolve({ data: [], next: null }),
      })
      const client = createClient(mockFetch)
      const results = await client.listAll('/items')
      expect(results).toHaveLength(0)
    })
  })
})
